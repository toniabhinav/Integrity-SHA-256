import React from 'react';
import { CheckCircle2, AlertOctagon, PlusCircle, AlertTriangle, Layers } from 'lucide-react';

interface SummaryMetricsProps {
  total: number;
  unchanged: number;
  modified: number;
  newFiles: number;
  missing: number;
  subtitle?: string;
}

export const SummaryMetrics: React.FC<SummaryMetricsProps> = ({
  total,
  unchanged,
  modified,
  newFiles,
  missing,
  subtitle,
}) => {
  const getPercent = (count: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  return (
    <div className="space-y-4">
      {/* 5-Card Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Card */}
        <div className="bg-navy-800/80 border border-navy-700/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Files</span>
            <Layers className="w-4 h-4 text-gray-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-white tracking-tight">{total}</span>
            {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {/* Unchanged Card */}
        <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Unchanged</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-400 tracking-tight">{unchanged}</span>
              {total > 0 && <span className="text-xs text-emerald-500/80">({getPercent(unchanged)}%)</span>}
            </div>
            <p className="text-[11px] text-emerald-500/70 mt-0.5">Integrity Verified</p>
          </div>
        </div>

        {/* Modified Card */}
        <div className="bg-rose-950/20 border border-rose-800/40 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Modified</span>
            <AlertOctagon className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-400 tracking-tight">{modified}</span>
              {total > 0 && <span className="text-xs text-rose-500/80">({getPercent(modified)}%)</span>}
            </div>
            <p className="text-[11px] text-rose-500/70 mt-0.5">Content Altered</p>
          </div>
        </div>

        {/* New Files Card */}
        <div className="bg-sky-950/20 border border-sky-800/40 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-sky-400">
            <span className="text-xs font-semibold uppercase tracking-wider">New Files</span>
            <PlusCircle className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-sky-400 tracking-tight">{newFiles}</span>
              {total > 0 && <span className="text-xs text-sky-500/80">({getPercent(newFiles)}%)</span>}
            </div>
            <p className="text-[11px] text-sky-500/70 mt-0.5">Not in Baseline</p>
          </div>
        </div>

        {/* Missing Files Card */}
        <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-4 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Missing</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-400 tracking-tight">{missing}</span>
              {total > 0 && <span className="text-xs text-amber-500/80">({getPercent(missing)}%)</span>}
            </div>
            <p className="text-[11px] text-amber-500/70 mt-0.5">Expected in Baseline</p>
          </div>
        </div>
      </div>

      {/* Visual Proportion Bar (only if total > 0) */}
      {total > 0 && (
        <div className="p-3 bg-navy-800/50 border border-navy-700/60 rounded-xl">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2 font-medium">
            <span>Scan Breakdown</span>
            <span>{total} Total Monitored Artifacts</span>
          </div>
          <div className="h-2.5 w-full bg-navy-950 rounded-full overflow-hidden flex">
            {unchanged > 0 && (
              <div
                style={{ width: `${(unchanged / total) * 100}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Unchanged: ${unchanged}`}
              />
            )}
            {modified > 0 && (
              <div
                style={{ width: `${(modified / total) * 100}%` }}
                className="bg-rose-500 transition-all duration-500"
                title={`Modified: ${modified}`}
              />
            )}
            {newFiles > 0 && (
              <div
                style={{ width: `${(newFiles / total) * 100}%` }}
                className="bg-sky-500 transition-all duration-500"
                title={`New: ${newFiles}`}
              />
            )}
            {missing > 0 && (
              <div
                style={{ width: `${(missing / total) * 100}%` }}
                className="bg-amber-500 transition-all duration-500"
                title={`Missing: ${missing}`}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
