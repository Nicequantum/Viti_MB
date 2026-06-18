import { logger } from './logger';

export type AuditAction =
  | 'ro.create'
  | 'ro.delete'
  | 'ro.scan'
  | 'line.create'
  | 'story.generate'
  | 'story.review'
  | 'template.insert'
  | 'auth.unlock'
  | 'auth.save_key';

export interface AuditEntry {
  id: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  dealershipId?: string;
}

const AUDIT_KEY = 'benztech_audit_trail_v1';
const MAX_ENTRIES = 500;

function loadEntries(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(entries: AuditEntry[]): void {
  try {
    localStorage.setItem(AUDIT_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch (e) {
    logger.warn('Audit trail persist failed', 'audit', e);
  }
}

export function writeAuditLog(
  action: AuditAction,
  options?: {
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    dealershipId?: string;
  }
): AuditEntry {
  const entry: AuditEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    entityType: options?.entityType,
    entityId: options?.entityId,
    metadata: options?.metadata,
    dealershipId: options?.dealershipId,
    timestamp: new Date().toISOString(),
  };
  const entries = [entry, ...loadEntries()].slice(0, MAX_ENTRIES);
  persist(entries);
  logger.info(`Audit: ${action}`, 'audit', options?.metadata);
  return entry;
}

export function getAuditTrail(limit = 100): AuditEntry[] {
  return loadEntries().slice(0, limit);
}

export function clearAuditTrail(): void {
  localStorage.removeItem(AUDIT_KEY);
}