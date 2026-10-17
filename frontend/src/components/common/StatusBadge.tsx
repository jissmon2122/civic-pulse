import React from 'react';
import {
  Clock,
  Search,
  UserCheck,
  Wrench,
  CheckCircle2,
  Lock,
  HelpCircle,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { ReportStatus } from '../../types';

interface StatusBadgeProps {
  status: ReportStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const configs: Record<
    ReportStatus,
    { label: string; icon: React.ReactNode; bg: string; text: string; border: string }
  > = {
    SUBMITTED: {
      label: 'Submitted',
      icon: <Clock size={size === 'sm' ? 12 : 14} className="text-[#0E7C86]" />,
      bg: 'bg-primary-tint',
      text: 'text-[#0E7C86]',
      border: 'border-[#BFE5E8]',
    },
    UNDER_REVIEW: {
      label: 'Under Review',
      icon: <Search size={size === 'sm' ? 12 : 14} className="text-[#D98E04]" />,
      bg: 'bg-status-review-tint',
      text: 'text-[#B87702]',
      border: 'border-[#F8E2B6]',
    },
    ASSIGNED: {
      label: 'Assigned',
      icon: <UserCheck size={size === 'sm' ? 12 : 14} className="text-[#2F6FDE]" />,
      bg: 'bg-status-in_progress-tint',
      text: 'text-[#2157B5]',
      border: 'border-[#C7DBFB]',
    },
    IN_PROGRESS: {
      label: 'In Progress',
      icon: <Wrench size={size === 'sm' ? 12 : 14} className="text-[#2F6FDE]" />,
      bg: 'bg-status-in_progress-tint',
      text: 'text-[#2157B5]',
      border: 'border-[#C7DBFB]',
    },
    RESOLVED: {
      label: 'Resolved',
      icon: <CheckCircle2 size={size === 'sm' ? 12 : 14} className="text-[#2E8B57]" />,
      bg: 'bg-status-resolved-tint',
      text: 'text-[#1F6D42]',
      border: 'border-[#BFE2CD]',
    },
    CLOSED: {
      label: 'Closed',
      icon: <Lock size={size === 'sm' ? 12 : 14} className="text-[#52606D]" />,
      bg: 'bg-status-closed-tint',
      text: 'text-[#485663]',
      border: 'border-[#D9DFE5]',
    },
    NEEDS_INFORMATION: {
      label: 'Needs Info',
      icon: <HelpCircle size={size === 'sm' ? 12 : 14} className="text-[#D98E04]" />,
      bg: 'bg-status-review-tint',
      text: 'text-[#B87702]',
      border: 'border-[#F8E2B6]',
    },
    REOPENED: {
      label: 'Reopened',
      icon: <RotateCcw size={size === 'sm' ? 12 : 14} className="text-[#D64545]" />,
      bg: 'bg-status-critical-tint',
      text: 'text-[#B72F2F]',
      border: 'border-[#F8C8C8]',
    },
    REJECTED: {
      label: 'Declined',
      icon: <XCircle size={size === 'sm' ? 12 : 14} className="text-[#7B8794]" />,
      bg: 'bg-status-closed-tint',
      text: 'text-[#52606D]',
      border: 'border-[#D9DFE5]',
    },
  };

  const current = configs[status] || configs.SUBMITTED;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${current.bg} ${current.text} ${current.border} ${padding} select-none ${className}`}
    >
      {current.icon}
      <span>{current.label}</span>
    </span>
  );
};
