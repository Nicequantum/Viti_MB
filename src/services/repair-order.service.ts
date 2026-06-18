import { toast } from 'sonner';
import { writeAuditLog } from '../lib/audit';
import { deleteROFromDB, loadAllROs, saveROToDB } from '../lib/db';
import { debounce } from '../lib/debounce';
import { logger } from '../lib/logger';
import { formatVinInput } from '../lib/vin';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { useBenzBotStore } from '../store/benzbotStore';
import { useRepairOrderStore } from '../store/repairOrderStore';
import type { ExtractedData, ImageAttachment, PendingROImage, RepairLine, RepairOrder } from '../types';
import { emptyExtractedData, mergeExtracted, parseDiagnosticText } from '../utils/diagnosticParser';
import { compressImageForStorage, dataUrlToFile } from '../utils/imageCompression';
import { getSuggestions } from '../utils/mercedesKb';
import {
  buildROFromExtraction,
  createManualRepairOrder,
  createNewRepairLine,
  ensureComplaintMeta,
  syncRepairLinesWithComplaints,
} from '../utils/repairOrderFactory';
import { parseStructuredROText } from '../utils/roExtractor';
import { extractROWithGrok, generateWarrantyStory, reviewWarrantyStory, scoreWarrantyStory } from './grok';
import { preprocessImageForOCR, runOCR } from './ocr';

const persistDebounced = debounce(async (ro: RepairOrder) => {
  try {
    await saveROToDB(ro);
  } catch (e) {
    logger.error('IDB save failed', 'repair-order', e);
    toast.error('Failed to save repair order locally');
  }
}, 450);

function cloneRO(ro: RepairOrder): RepairOrder {
  return structuredClone(ro);
}

function applyROUpdate(
  updater: (ro: RepairOrder) => RepairOrder,
  options?: { immediate?: boolean }
): RepairOrder | null {
  const store = useRepairOrderStore.getState();
  const base = store.currentRO;
  if (!base) return null;

  const updated = ensureComplaintMeta(updater(cloneRO(base)));
  updated.updatedAt = new Date().toISOString();
  store.upsertRO(updated);

  if (options?.immediate) {
    persistDebounced.flush();
    void saveROToDB(updated);
  } else {
    persistDebounced(updated);
  }
  return updated;
}

function flushPendingSave(): void {
  persistDebounced.flush();
  const ro = useRepairOrderStore.getState().currentRO;
  if (ro) void saveROToDB(ro);
}

export async function hydrateRepairOrders(): Promise<void> {
  const saved = (await loadAllROs()).map(ensureComplaintMeta);
  useRepairOrderStore.getState().setAllROs(saved);
  useRepairOrderStore.getState().setHydrated(true);
  logger.info(`Loaded ${saved.length} repair orders`, 'repair-order');
}

export function navigateTo(view: import('../types').AppView, lineId?: string | null): void {
  flushPendingSave();
  useAppStore.getState().setView(view);
  if (lineId !== undefined) useRepairOrderStore.getState().setCurrentLineId(lineId);
}

export async function deleteRepairOrder(id: string): Promise<void> {
  if (!window.confirm('Delete this RO and all its data?')) return;
  try {
    await deleteROFromDB(id);
    useRepairOrderStore.getState().removeRO(id);
    if (useRepairOrderStore.getState().currentRO === null) {
      useAppStore.getState().setView('home');
    }
    writeAuditLog('ro.delete', { entityType: 'repairOrder', entityId: id });
    toast.success('Repair order deleted');
  } catch {
    toast.error('Failed to delete repair order');
  }
}

export function openRepairOrder(ro: RepairOrder): void {
  const normalized = ensureComplaintMeta(ro);
  useRepairOrderStore.getState().setCurrentRO(normalized);
  useRepairOrderStore.getState().setCurrentLineId(null);
  useAppStore.getState().setView('ro');
}

export function addROPhotoPicker(): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.setAttribute('capture', 'environment');
  input.multiple = true;
  input.onchange = async (e) => {
    const files = Array.from((e.target as HTMLInputElement).files || []);
    if (files.length === 0) return;
    const newImgs: PendingROImage[] = [];
    for (const file of files) {
      const compressed = await compressImageForStorage(file);
      newImgs.push({
        id: 'roimg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        dataUrl: compressed.dataUrl,
        name: file.name || `page-${newImgs.length + 1}.jpg`,
      });
    }
    useRepairOrderStore.getState().setPendingROImages((prev) => [...prev, ...newImgs]);
  };
  input.click();
}

export async function processPendingROImages(): Promise<void> {
  const { pendingROImages } = useRepairOrderStore.getState();
  if (pendingROImages.length === 0) return;

  const apiKey = useAuthStore.getState().apiKey;
  const app = useAppStore.getState();
  app.setProcessingOCR(true, 0);
  app.setLoadingMessage(apiKey ? 'Analyzing RO with Grok vision…' : 'Running on-device OCR…');

  try {
    const dataUrls = pendingROImages.map((img) => img.dataUrl);
    let extracted;
    if (apiKey) {
      app.setOcrProgress(20);
      extracted = await extractROWithGrok(dataUrls, apiKey);
      app.setOcrProgress(90);
    } else {
      let combinedText = '';
      for (let i = 0; i < pendingROImages.length; i++) {
        const img = pendingROImages[i];
        const file = await dataUrlToFile(img.dataUrl, img.name);
        const preprocessed = await preprocessImageForOCR(file, 'full');
        const text = await runOCR(preprocessed, (p) =>
          app.setOcrProgress(Math.round((i / pendingROImages.length) * 80 + (p / pendingROImages.length) * 80))
        );
        combinedText += `\n\n=== PAGE ${i + 1} ===\n` + text;
      }
      app.setOcrProgress(95);
      extracted = parseStructuredROText(combinedText);
    }

    const newRO = buildROFromExtraction({
      vehicle: extracted.vehicle,
      complaints: extracted.complaints,
      customerName: extracted.customerName,
      roNumber: extracted.roNumber,
    });

    useRepairOrderStore.getState().setCurrentRO(newRO);
    useRepairOrderStore.getState().upsertRO(newRO);
    await saveROToDB(newRO);
    useRepairOrderStore.getState().setPendingROImages([]);
    useAppStore.getState().setView('ro');
    writeAuditLog('ro.scan', { entityType: 'repairOrder', entityId: newRO.id, metadata: { pages: pendingROImages.length } });
    toast.success('Repair order created from scan');
  } catch (error) {
    logger.error('RO scan failed', 'repair-order', error);
    toast.error(error instanceof Error ? error.message : 'Processing images failed');
  } finally {
    app.setProcessingOCR(false);
    app.setOcrProgress(0);
    app.setLoadingMessage('');
  }
}

export async function createManualRO(): Promise<void> {
  const newRO = createManualRepairOrder();
  useRepairOrderStore.getState().setCurrentRO(newRO);
  useRepairOrderStore.getState().upsertRO(newRO);
  await saveROToDB(newRO);
  useAppStore.getState().setView('ro');
  writeAuditLog('ro.create', { entityType: 'repairOrder', entityId: newRO.id, metadata: { source: 'manual' } });
  toast.success('Manual repair order created');
}

export function updateLine(lineId: string, updates: Partial<RepairLine>): void {
  applyROUpdate((ro) => ({
    ...ro,
    repairLines: ro.repairLines.map((line) => (line.id === lineId ? { ...line, ...updates } : line)),
  }));
}

export function updateVehicle(updates: Partial<RepairOrder['vehicle']>): void {
  const normalized = { ...updates };
  if (normalized.vin !== undefined) normalized.vin = formatVinInput(normalized.vin);
  applyROUpdate((ro) => ({ ...ro, vehicle: { ...ro.vehicle, ...normalized } }));
}

export function updateCustomer(name: string): void {
  applyROUpdate((ro) => ({ ...ro, customer: { ...ro.customer, name } }));
}

export function updateRONumber(roNumber: string): void {
  applyROUpdate((ro) => ({ ...ro, roNumber: roNumber.trim() }));
}

function updateComplaints(newComplaints: string[], newLabels?: string[], newIds?: string[]): void {
  applyROUpdate((ro) => {
    const labels =
      newLabels && newLabels.length === newComplaints.length
        ? newLabels
        : ro.complaintLabels ?? newComplaints.map((_, i) => String.fromCharCode(65 + i));
    const ids =
      newIds && newIds.length === newComplaints.length
        ? newIds
        : ro.complaintIds ?? labels.map((l) => `cmp-${ro.id}-${l}`);
    const oldFirst = ro.complaints[0] || '';
    const updatedLines = syncRepairLinesWithComplaints(ro.repairLines, newComplaints, oldFirst);
    return { ...ro, complaints: newComplaints, complaintLabels: labels, complaintIds: ids, repairLines: updatedLines };
  });
}

export function addComplaint(): void {
  const ro = useRepairOrderStore.getState().currentRO;
  if (!ro) return;
  const labels = [...(ro.complaintLabels || ro.complaints.map((_, i) => String.fromCharCode(65 + i)))];
  const ids = [...(ro.complaintIds || labels.map((l) => `cmp-${ro.id}-${l}`))];
  const lastCode = labels[labels.length - 1]?.toUpperCase().charCodeAt(0) ?? 64;
  const nextLabel = lastCode >= 65 && lastCode < 90 ? String.fromCharCode(lastCode + 1) : 'A';
  labels.push(nextLabel);
  ids.push(`cmp-${ro.id}-${nextLabel}-${Date.now()}`);
  updateComplaints([...(ro.complaints || []), 'New concern - describe symptom'], labels, ids);
}

export function removeComplaint(index: number): void {
  const ro = useRepairOrderStore.getState().currentRO;
  if (!ro) return;
  updateComplaints(
    (ro.complaints || []).filter((_, i) => i !== index),
    ro.complaintLabels?.filter((_, i) => i !== index),
    ro.complaintIds?.filter((_, i) => i !== index)
  );
}

export function editComplaint(index: number, value: string): void {
  const ro = useRepairOrderStore.getState().currentRO;
  if (!ro) return;
  const updated = [...(ro.complaints || [])];
  updated[index] = value;
  updateComplaints(updated, ro.complaintLabels, ro.complaintIds);
}

export function addRepairLine(): void {
  const ro = useRepairOrderStore.getState().currentRO;
  if (!ro) return;
  const newLine = createNewRepairLine(ro.repairLines.length + 1);
  const updated = applyROUpdate((r) => ({ ...r, repairLines: [...r.repairLines, newLine] }), { immediate: true });
  if (updated) {
    useRepairOrderStore.getState().setCurrentLineId(newLine.id);
    useAppStore.getState().setView('line');
    writeAuditLog('line.create', { entityType: 'repairLine', entityId: newLine.id });
  }
}

async function processXentryFiles(
  files: File[],
  existingImages: ImageAttachment[],
  existingOcr: string[],
  existingExtracted: ExtractedData
) {
  const app = useAppStore.getState();
  let updatedExtracted = existingExtracted;
  let updatedOcrTexts = existingOcr;
  const newImgs: ImageAttachment[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    app.setOcrProgress(Math.round((i / files.length) * 30));
    const compressed = await compressImageForStorage(file);
    newImgs.push({ id: 'ximg-' + Date.now() + i, dataUrl: compressed.dataUrl, name: file.name });
    try {
      const pre = await preprocessImageForOCR(file, 'fast');
      const text = await runOCR(pre, (p) => app.setOcrProgress(Math.round(30 + ((i + p / 100) / files.length) * 70)));
      const diag = parseDiagnosticText(text);
      updatedExtracted = mergeExtracted(updatedExtracted, diag);
      updatedOcrTexts = [...updatedOcrTexts, text];
    } catch (err) {
      logger.warn('Xentry OCR failed for one image', 'ocr', err);
    }
  }
  return { newImgs, updatedExtracted, updatedOcrTexts, allImages: [...existingImages, ...newImgs] };
}

export function addXentryPhotos(lineId: string): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;
  input.setAttribute('capture', 'environment');
  input.onchange = async (e) => {
    const files = Array.from((e.target as HTMLInputElement).files || []);
    const ro = useRepairOrderStore.getState().currentRO;
    if (files.length === 0 || !ro) return;
    const app = useAppStore.getState();
    app.setProcessingOCR(true, 0);
    app.setLoadingMessage('Analyzing diagnostic photos…');
    const line = ro.repairLines.find((l) => l.id === lineId);
    if (!line) {
      app.setProcessingOCR(false);
      return;
    }
    try {
      const result = await processXentryFiles(
        files,
        line.xentryImages || [],
        line.xentryOcrTexts || [],
        line.extractedData || emptyExtractedData()
      );
      applyROUpdate(
        (r) => ({
          ...r,
          repairLines: r.repairLines.map((l) =>
            l.id === lineId
              ? { ...l, xentryImages: result.allImages, xentryOcrTexts: result.updatedOcrTexts, extractedData: result.updatedExtracted }
              : l
          ),
        }),
        { immediate: true }
      );
      toast.success(`${files.length} diagnostic photo(s) analyzed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to analyze photos');
    } finally {
      app.setProcessingOCR(false);
      app.setOcrProgress(0);
      app.setLoadingMessage('');
    }
  };
  input.click();
}

export function addROXentryPhotos(): void {
  const ro = useRepairOrderStore.getState().currentRO;
  if (!ro) return;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;
  input.setAttribute('capture', 'environment');
  input.onchange = async (e) => {
    const files = Array.from((e.target as HTMLInputElement).files || []);
    if (files.length === 0 || !ro) return;
    const app = useAppStore.getState();
    app.setProcessingOCR(true, 0);
    app.setLoadingMessage('Analyzing Xentry photos…');
    const firstLine = ro.repairLines[0];
    try {
      const result = await processXentryFiles(
        files,
        ro.xentryImages || [],
        ro.xentryOcrTexts || [],
        firstLine?.extractedData || emptyExtractedData()
      );
      applyROUpdate(
        (r) => {
          let updatedLines = r.repairLines;
          if (firstLine) {
            updatedLines = r.repairLines.map((l, idx) =>
              idx === 0
                ? { ...l, xentryImages: [...(l.xentryImages || []), ...result.newImgs], xentryOcrTexts: result.updatedOcrTexts, extractedData: result.updatedExtracted }
                : l
            );
          }
          return { ...r, xentryImages: result.allImages, xentryOcrTexts: result.updatedOcrTexts, repairLines: updatedLines };
        },
        { immediate: true }
      );
      toast.success(`${files.length} Xentry photo(s) analyzed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to analyze photos');
    } finally {
      app.setProcessingOCR(false);
      app.setOcrProgress(0);
      app.setLoadingMessage('');
    }
  };
  input.click();
}

export function applySmartDefaultsToLine(lineId: string): void {
  const ro = useRepairOrderStore.getState().currentRO;
  if (!ro) return;
  const line = ro.repairLines.find((l) => l.id === lineId);
  if (!line) return;
  const sugg = getSuggestions(ro);
  let notes = (line.technicianNotes || '').trim();
  const addBlock = `\n\n[Smart defaults for ${sugg.bandNote}]\nCommon issues at this mileage: ${sugg.issues.join(' • ')}\nStandard values: ${sugg.tests.map((t) => `${t.label}: ${t.spec}${t.note ? ' (' + t.note + ')' : ''}`).join('; ')}`;
  if (!notes.includes('Smart defaults')) notes = (notes + addBlock).trim();
  let newExtract = line.extractedData || emptyExtractedData();
  if (newExtract.measurements.length === 0 && sugg.tests.length) {
    newExtract = { ...newExtract, measurements: sugg.tests.slice(0, 4).map((t) => ({ label: t.label, value: t.spec })) };
  }
  updateLine(lineId, { technicianNotes: notes, extractedData: newExtract });
  toast.success('Reference notes added');
}

export async function generateStoryForLine(lineId: string): Promise<void> {
  const apiKey = useAuthStore.getState().apiKey;
  const ro = useRepairOrderStore.getState().currentRO;
  if (!ro || !apiKey) return;
  const line = ro.repairLines.find((l) => l.id === lineId);
  if (!line) return;

  flushPendingSave();
  const app = useAppStore.getState();
  const benzbot = useBenzBotStore.getState();
  app.setGenerating(true);
  app.setLoadingMessage('Generating warranty story with Grok…');

  try {
    const allROs = useRepairOrderStore.getState().allROs;
    let historyContext = '';
    const similar = allROs
      .filter(
        (r) =>
          r.id !== ro.id &&
          r.vehicle.model &&
          ro.vehicle.model &&
          (r.vehicle.model.toLowerCase().includes(ro.vehicle.model.toLowerCase().split(' ')[0]) ||
            (r.vehicle.make && ro.vehicle.make && r.vehicle.make.toLowerCase() === ro.vehicle.make.toLowerCase()))
      )
      .slice(0, 2);
    if (similar.length > 0) {
      historyContext =
        '\n\nFor style consistency, examples from my previous similar repairs:\n' +
        similar
          .map((r) =>
            r.repairLines
              .filter((l) => l.warrantyStory)
              .map((l) => `For ${l.description}: ${l.warrantyStory!.substring(0, 250)}...`)
              .join('\n')
          )
          .join('\n---\n');
    }

    const story = await generateWarrantyStory(ro, line, apiKey, historyContext);
    applyROUpdate(
      (r) => ({ ...r, repairLines: r.repairLines.map((l) => (l.id === lineId ? { ...l, warrantyStory: story } : l)) }),
      { immediate: true }
    );

    try {
      const quality = await scoreWarrantyStory(ro, line, story, apiKey);
      benzbot.setQuality(lineId, quality);
      benzbot.clearReview(lineId);
    } catch {
      logger.warn('BenzBot auto-score failed', 'benzbot');
    }

    writeAuditLog('story.generate', { entityType: 'repairLine', entityId: lineId, metadata: { roId: ro.id } });
    toast.success('Warranty story generated');
  } catch (error) {
    logger.error('Story generation failed', 'story', error);
    toast.error(error instanceof Error ? error.message : 'Story generation failed');
  } finally {
    app.setGenerating(false);
    app.setLoadingMessage('');
  }
}

export async function reviewStoryForLine(lineId: string): Promise<void> {
  const apiKey = useAuthStore.getState().apiKey;
  const ro = useRepairOrderStore.getState().currentRO;
  if (!ro || !apiKey) return;
  const line = ro.repairLines.find((l) => l.id === lineId);
  if (!line?.warrantyStory?.trim()) return;

  flushPendingSave();
  const app = useAppStore.getState();
  app.setReviewing(true);
  app.setLoadingMessage('BenzBot 2.0 reviewing story…');

  try {
    const review = await reviewWarrantyStory(ro, line, line.warrantyStory, apiKey);
    useBenzBotStore.getState().setReview(lineId, review);
    writeAuditLog('story.review', { entityType: 'repairLine', entityId: lineId, metadata: { score: review.score } });
    toast.success('BenzBot 2.0 review complete');
  } catch (error) {
    logger.error('BenzBot review failed', 'benzbot', error);
    toast.error(error instanceof Error ? error.message : 'BenzBot review failed');
  } finally {
    app.setReviewing(false);
    app.setLoadingMessage('');
  }
}