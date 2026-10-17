import React from 'react';
import { CheckCircle2, AlertOctagon, PlusCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { ScanItemStatus } from '../types';

interface StatusBadgeProps {
  status: ScanItemStatus;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs sm:text-sm';

  switch (status) {
    case 'UNCHANGED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-md border bg-emerald-950/60 text-emerald-400 border-emerald-800/80 ${sizeClasses}`}
        >
          {showIcon && <CheckCircle2 className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
          UNCHANGED
        </span>
      );

    case 'MODIFIED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-md border bg-rose-950/60 text-rose-400 border-rose-800/80 ${sizeClasses}`}
        >
          {showIcon && <AlertOctagon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
          MODIFIED
        </span>
      );

    case 'NEW':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-md border bg-sky-950/60 text-sky-400 border-sky-800/80 ${sizeClasses}`}
        >
          {showIcon && <PlusCircle className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
          NEW FILE
        </span>
      );

    case 'MISSING':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-md border bg-amber-950/60 text-amber-400 border-amber-800/80 ${sizeClasses}`}
        >
          {showIcon && <AlertTriangle className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
          MISSING
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center gap-1 font-medium rounded-md border bg-gray-800 text-gray-300 border-gray-700 ${sizeClasses}`}>
          {showIcon && <ShieldCheck className="w-3.5 h-3.5" />}
          {status}
        </span>
      );
  }
};
