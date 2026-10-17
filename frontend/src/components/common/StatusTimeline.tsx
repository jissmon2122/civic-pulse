import React from 'react';
import { Check, Clock, Eye, UserCheck, Wrench, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { ReportStatus } from '../../types';

interface StatusTimelineProps {
  currentStatus: ReportStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  currentStatus,
  createdAt,
  updatedAt,
  resolvedAt,
}) => {
  // If rejected or reopened, show specialized alert badge state
  if (currentStatus === 'REJECTED') {
    return (
      <div className="flex items-center gap-3 p-4 bg-surface-subtle border border-border rounded-xl">
        <XCircle className="text-status-closed" size={24} />
        <div>
          <h4 className="font-heading font-semibold text-sm text-text-primary">Complaint Closed / Declined</h4>
          <p className="text-xs text-text-secondary mt-0.5">
            This issue was reviewed and closed by municipal authorities.
          </p>
        </div>
      </div>
    );
  }

  // Linear progression steps
  const steps: { key: ReportStatus; label: string; icon: React.ReactNode }[] = [
    { key: 'SUBMITTED', label: 'Submitted', icon: <Clock size={16} /> },
    { key: 'UNDER_REVIEW', label: 'Reviewed', icon: <Eye size={16} /> },
    { key: 'ASSIGNED', label: 'Assigned', icon: <UserCheck size={16} /> },
    { key: 'IN_PROGRESS', label: 'In Progress', icon: <Wrench size={16} /> },
    { key: 'RESOLVED', label: 'Resolved', icon: <CheckCircle2 size={16} /> },
  ];

  const getStepIndex = (status: ReportStatus): number => {
    switch (status) {
      case 'SUBMITTED':
        return 0;
      case 'UNDER_REVIEW':
      case 'NEEDS_INFORMATION':
        return 1;
      case 'ASSIGNED':
        return 2;
      case 'IN_PROGRESS':
      case 'REOPENED':
        return 3;
      case 'RESOLVED':
      case 'CLOSED':
        return 4;
      default:
        return 0;
    }
  };

  const activeIndex = getStepIndex(currentStatus);

  return (
    <div className="w-full py-4">
      {/* Desktop Horizontal Stepper */}
      <div className="hidden sm:flex items-center justify-between relative">
        {/* Connecting Progress Bar */}
        <div className="absolute top-5 left-8 right-8 h-1 bg-[#E8E6DF] -z-0">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {steps.map((step, idx) => {
          const isCompleted = idx < activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 border-2 ${
                  isCompleted
                    ? 'bg-primary border-primary text-white'
                    : isCurrent
                    ? 'bg-surface border-primary text-primary shadow-subtle animate-pulse-subtle ring-4 ring-primary-tint'
                    : 'bg-surface border-border text-text-secondary'
                }`}
              >
                {isCompleted ? <Check size={16} strokeWidth={3} /> : step.icon}
              </div>
              <span
                className={`mt-2 text-xs font-semibold select-none ${
                  isCurrent
                    ? 'text-primary font-bold'
                    : isCompleted
                    ? 'text-text-primary'
                    : 'text-text-secondary/70'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile Vertical Stepper */}
      <div className="sm:hidden space-y-4 pl-3 relative border-l-2 border-border ml-4">
        {steps.map((step, idx) => {
          const isCompleted = idx < activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <div key={step.key} className="relative pl-6">
              {/* Node on vertical line */}
              <div
                className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full flex items-center justify-center text-xs border-2 ${
                  isCompleted
                    ? 'bg-primary border-primary text-white'
                    : isCurrent
                    ? 'bg-surface border-primary text-primary ring-4 ring-primary-tint animate-pulse-subtle'
                    : 'bg-surface border-border text-text-secondary'
                }`}
              >
                {isCompleted ? <Check size={14} strokeWidth={3} /> : step.icon}
              </div>
              <div>
                <p
                  className={`text-sm font-semibold ${
                    isCurrent ? 'text-primary' : isCompleted ? 'text-text-primary' : 'text-text-secondary'
                  }`}
                >
                  {step.label}
                </p>
                {isCurrent && (
                  <p className="text-xs text-text-secondary mt-0.5">
                    {currentStatus === 'RESOLVED'
                      ? 'Issue successfully resolved and verified.'
                      : 'Actively in this stage of municipal resolution.'}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {currentStatus === 'REOPENED' && (
        <div className="mt-4 p-3 bg-status-critical-tint border border-status-critical/20 rounded-xl flex items-center gap-2.5 text-xs text-status-critical font-medium">
          <RotateCcw size={16} />
          <span>This issue was marked as unresolved by the citizen and reopened for action.</span>
        </div>
      )}
    </div>
  );
};
