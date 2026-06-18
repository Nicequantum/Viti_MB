import { ClipboardList, Wrench } from 'lucide-react';
import type { TechnicianDetailPrompt } from '../../prompts/storyQuality';

const FIELD_LABELS: Record<TechnicianDetailPrompt['field'], string> = {
  technicianNotes: 'Technician Notes',
  customerConcern: 'Customer Concern',
  diagnostic: 'Diagnostic Evidence',
  workflow: 'Workflow Steps',
};

interface AddTechnicianDetailsPanelProps {
  details: TechnicianDetailPrompt[];
  onApplyToNotes?: (text: string) => void;
}

export function AddTechnicianDetailsPanel({ details, onApplyToNotes }: AddTechnicianDetailsPanelProps) {
  if (details.length === 0) return null;

  return (
    <div className="bg-[#0a84ff]/5 border border-[#0a84ff]/25 rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-widest text-[#0a84ff] mb-2 flex items-center gap-1.5">
        <Wrench size={12} /> Add Technician Details
      </div>
      <p className="text-[10px] text-[#8e8e93] mb-3 leading-snug">
        BenzBot 2.0 flagged these specific gaps. Add the missing details below to raise your audit score.
      </p>
      <ul className="space-y-3">
        {details.map((detail, index) => (
          <li key={`${detail.missing}-${index}`} className="text-xs leading-relaxed">
            <div className="flex items-start gap-2">
              <ClipboardList size={14} className="text-[#0a84ff] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[#ff9f0a]">{detail.missing}</div>
                <div className="text-[#d1d1d6] mt-0.5">{detail.prompt}</div>
                <div className="text-[9px] text-[#8e8e93] mt-1 uppercase tracking-wide">
                  Add to: {FIELD_LABELS[detail.field]}
                </div>
                {onApplyToNotes && detail.field === 'technicianNotes' && (
                  <button
                    type="button"
                    onClick={() => onApplyToNotes(detail.prompt)}
                    className="mt-1.5 text-[10px] text-[#0a84ff] font-medium"
                  >
                    + Add to Technician Notes
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}