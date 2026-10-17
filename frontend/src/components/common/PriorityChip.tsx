import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Info, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { PriorityLevel } from '../../types';

interface PriorityChipProps {
  level: PriorityLevel;
  score?: number;
  explanation?: string;
  isEmergency?: boolean;
  className?: string;
}

export const PriorityChip: React.FC<PriorityChipProps> = ({
  level,
  score,
  explanation,
  isEmergency = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const configs: Record<
    PriorityLevel,
    { label: string; icon: React.ReactNode; bg: string; text: string; border: string }
  > = {
    LOW: {
      label: 'Low Priority',
      icon: <Info size={13} className="text-[#52606D]" />,
      bg: 'bg-[#F0F2F5]',
      text: 'text-[#52606D]',
      border: 'border-[#CBD2D9]',
    },
    MEDIUM: {
      label: 'Medium Priority',
      icon: <Info size={13} className="text-[#0E7C86]" />,
      bg: 'bg-primary-tint',
      text: 'text-[#0E7C86]',
      border: 'border-[#BFE5E8]',
    },
    HIGH: {
      label: 'High Priority',
      icon: <AlertTriangle size={13} className="text-[#D98E04]" />,
      bg: 'bg-status-review-tint',
      text: 'text-[#B87702]',
      border: 'border-[#F8E2B6]',
    },
    CRITICAL: {
      label: isEmergency ? 'Emergency Hazard' : 'Critical Priority',
      icon: <ShieldAlert size={13} className="text-[#D64545]" />,
      bg: 'bg-status-critical-tint',
      text: 'text-[#B72F2F]',
      border: 'border-[#F8C8C8]',
    },
  };

  const current = configs[level] || configs.LOW;
  const factors = explanation ? explanation.split(' | ').filter(Boolean) : [];

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold select-none transition-all duration-150 hover:shadow-sm active:scale-95 ${current.bg} ${current.text} ${current.border}`}
        title="Click to view explainable priority scoring rationale"
      >
        {current.icon}
        <span>{current.label}</span>
        {score !== undefined && (
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-surface/80 border border-current/20">
            {score}
          </span>
        )}
        {factors.length > 0 && (
          <span className="ml-0.5 opacity-60">
            {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </span>
        )}
      </button>

      {/* Popover explaining priority factors */}
      {isOpen && factors.length > 0 && (
        <div className="absolute left-0 mt-2 z-40 w-72 p-3.5 bg-surface rounded-xl border border-border shadow-lifted text-left animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary mb-2">
            <Sparkles size={14} className="text-primary" />
            <span>Explainable Priority Assessment</span>
          </div>

          {score !== undefined && (
            <div className="text-[11px] text-text-secondary mb-2">
              Calculated Severity Score: <span className="font-semibold text-text-primary">{score} / 100</span>
            </div>
          )}

          <ul className="space-y-1.5 text-xs text-text-secondary">
            {factors.map((factor, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-primary font-bold">•</span>
                <span className="leading-tight">{factor}</span>
              </li>
            ))}
          </ul>

          {level === 'CRITICAL' && (
            <div className="mt-3 p-2 bg-status-critical-tint rounded-lg text-[11px] text-status-critical font-medium leading-snug border border-status-critical/20">
              Immediate danger? Please call municipal emergency dispatch (112/911) directly.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
