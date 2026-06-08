// Priority Badge component used across pages
export type PriorityType = 'CRITICAL' | 'URGENT' | 'NORMAL' | 'LOW';

interface PriorityBadgeProps {
  priority: PriorityType;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const priorityStyles: Record<PriorityType, { bg: string; text: string; border: string; label: string }> = {
  CRITICAL: {
    bg: 'bg-[#fef2f2]',
    text: 'text-[#dc2626]',
    border: 'border-[#fecaca]',
    label: 'CRITICAL',
  },
  URGENT: {
    bg: 'bg-[#fff7ed]',
    text: 'text-[#c2410c]',
    border: 'border-[#fed7aa]',
    label: 'URGENT',
  },
  NORMAL: {
    bg: 'bg-[#f1f5f9]',
    text: 'text-[#475569]',
    border: 'border-[#e2e8f0]',
    label: 'NORMAL',
  },
  LOW: {
    bg: 'bg-[#f0fdf4]',
    text: 'text-[#166534]',
    border: 'border-[#bbf7d0]',
    label: 'LOW',
  },
};

export function PriorityBadge({ priority, className = '', size = 'md' }: PriorityBadgeProps) {
  const style = priorityStyles[priority] || priorityStyles.NORMAL;

  const sizeClasses = {
    sm: 'px-2 py-1 text-[11px]',
    md: 'px-3 py-1.5 text-[12px]',
    lg: 'px-4 py-2 text-[13px]',
  };

  return (
    <span
      className={`inline-block ${sizeClasses[size]} font-semibold rounded-lg border ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      {style.label} PRIORITY
    </span>
  );
}

// Simplified inline badge for tables
export function PriorityBadgeInline({ priority }: { priority: PriorityType }) {
  const style = priorityStyles[priority];
  return (
    <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}
