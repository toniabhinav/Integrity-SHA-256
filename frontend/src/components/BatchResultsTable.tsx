import React, { useState, useMemo } from 'react';
import {
  Search,
  FileSpreadsheet,
  FileText,
  Copy,
  Check,
  Eye,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import type { ScanResultItem, ScanItemStatus } from '../types';
import { formatFileSize, truncateHash } from '../utils/formatters';
import { StatusBadge } from './StatusBadge';
import { exportResultsToCsv, exportResultsToJson } from '../utils/exportUtils';

interface BatchResultsTableProps {
  results: ScanResultItem[];
  baselineName?: string;
  scanTimestamp?: string;
  onInspectItem: (item: ScanResultItem) => void;
}

type SortField = 'path' | 'size' | 'status';
type SortDirection = 'asc' | 'desc';

export const BatchResultsTable: React.FC<BatchResultsTableProps> = ({
  results,
  baselineName,
  scanTimestamp,
  onInspectItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ScanItemStatus>('ALL');
  const [sortField, setSortField] = useState<SortField>('status');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const copyToClipboard = (hash: string, id: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Status counts for filter chips
  const counts = useMemo(() => {
    return {
      ALL: results.length,
      UNCHANGED: results.filter((r) => r.status === 'UNCHANGED').length,
      MODIFIED: results.filter((r) => r.status === 'MODIFIED').length,
      NEW: results.filter((r) => r.status === 'NEW').length,
      MISSING: results.filter((r) => r.status === 'MISSING').length,
    };
  }, [results]);

  // Filter and sort items
  const filteredResults = useMemo(() => {
    return results
      .filter((item) => {
        // Status filter
        if (statusFilter !== 'ALL' && item.status !== statusFilter) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchPath = item.path.toLowerCase().includes(q);
          const matchBaseline = item.baselineHash?.toLowerCase().includes(q);
          const matchCurrent = item.currentHash?.toLowerCase().includes(q);
          return matchPath || matchBaseline || matchCurrent;
        }
        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortField === 'path') {
          comparison = a.path.localeCompare(b.path);
        } else if (sortField === 'size') {
          comparison = a.size - b.size;
        } else if (sortField === 'status') {
          const order: Record<ScanItemStatus, number> = {
            MODIFIED: 1,
            MISSING: 2,
            NEW: 3,
            UNCHANGED: 4,
          };
          comparison = order[a.status] - order[b.status];
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [results, statusFilter, searchQuery, sortField, sortDirection]);

  return (
    <div className="bg-navy-800/60 border border-navy-700 rounded-xl overflow-hidden shadow-xl space-y-4">
      {/* Top Header: Controls & Export */}
      <div className="p-4 sm:p-5 border-b border-navy-700/80 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by filename or hash..."
            className="w-full bg-navy-900 border border-navy-600 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-electric-blue transition-colors"
          />
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={() => exportResultsToCsv(results, { timestamp: scanTimestamp, baselineName })}
            className="px-3.5 py-2 bg-navy-700 hover:bg-navy-600 border border-navy-600 text-gray-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Download CSV report"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => exportResultsToJson(results, { timestamp: scanTimestamp, baselineName })}
            className="px-3.5 py-2 bg-navy-700 hover:bg-navy-600 border border-navy-600 text-gray-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Download JSON report"
          >
            <FileText className="w-3.5 h-3.5 text-electric-blue" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="px-4 sm:px-5 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-gray-400 flex items-center gap-1 mr-1 shrink-0 font-medium">
          <Filter className="w-3.5 h-3.5" />
          Filter:
        </span>
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-electric-blue text-white'
              : 'bg-navy-700/60 text-gray-300 hover:bg-navy-700'
          }`}
        >
          All Results <span className="text-[11px] opacity-80">({counts.ALL})</span>
        </button>
        <button
          onClick={() => setStatusFilter('UNCHANGED')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
            statusFilter === 'UNCHANGED'
              ? 'bg-emerald-600 text-white'
              : 'bg-navy-700/60 text-emerald-400 hover:bg-navy-700'
          }`}
        >
          Unchanged <span className="text-[11px] opacity-80">({counts.UNCHANGED})</span>
        </button>
        <button
          onClick={() => setStatusFilter('MODIFIED')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
            statusFilter === 'MODIFIED'
              ? 'bg-rose-600 text-white'
              : 'bg-navy-700/60 text-rose-400 hover:bg-navy-700'
          }`}
        >
          Modified <span className="text-[11px] opacity-80">({counts.MODIFIED})</span>
        </button>
        <button
          onClick={() => setStatusFilter('NEW')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
            statusFilter === 'NEW'
              ? 'bg-sky-600 text-white'
              : 'bg-navy-700/60 text-sky-400 hover:bg-navy-700'
          }`}
        >
          New Files <span className="text-[11px] opacity-80">({counts.NEW})</span>
        </button>
        <button
          onClick={() => setStatusFilter('MISSING')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
            statusFilter === 'MISSING'
              ? 'bg-amber-600 text-white'
              : 'bg-navy-700/60 text-amber-400 hover:bg-navy-700'
          }`}
        >
          Missing <span className="text-[11px] opacity-80">({counts.MISSING})</span>
        </button>
      </div>

      {/* Results Count Banner */}
      <div className="px-4 sm:px-5 flex items-center justify-between text-xs text-gray-400">
        <span>
          Showing {filteredResults.length} of {results.length} files
        </span>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-navy-900/80 border-y border-navy-700 text-gray-400 text-xs uppercase tracking-wider">
              <th
                onClick={() => handleSort('path')}
                className="py-3 px-4 font-semibold cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>File Name / Path</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('size')}
                className="py-3 px-4 font-semibold cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Size</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
                </div>
              </th>
              <th className="py-3 px-4 font-semibold">Baseline SHA-256</th>
              <th className="py-3 px-4 font-semibold">Scanned SHA-256</th>
              <th
                onClick={() => handleSort('status')}
                className="py-3 px-4 font-semibold cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Integrity Status</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
                </div>
              </th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-700/50">
            {filteredResults.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Search className="w-8 h-8 text-gray-500" />
                    <p className="font-medium text-gray-300">No matching files found</p>
                    <p className="text-xs text-gray-500">
                      Try adjusting your search query or filter settings.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredResults.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-navy-700/20 transition-colors group text-xs sm:text-sm"
                >
                  {/* File Name */}
                  <td className="py-3 px-4 font-medium text-white max-w-[200px] sm:max-w-xs truncate">
                    <span title={item.path}>{item.path}</span>
                  </td>

                  {/* Size */}
                  <td className="py-3 px-4 text-gray-400 whitespace-nowrap">
                    {formatFileSize(item.size)}
                  </td>

                  {/* Baseline Hash */}
                  <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                    {item.baselineHash ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-emerald-400 cursor-pointer hover:underline"
                          onClick={() => onInspectItem(item)}
                          title="Click to view full hash"
                        >
                          {truncateHash(item.baselineHash, 6, 6)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(item.baselineHash!, `base-${item.id}`)}
                          className="text-gray-500 hover:text-gray-300 transition-colors p-0.5 cursor-pointer"
                          title="Copy baseline hash"
                        >
                          {copiedHash === `base-${item.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>

                  {/* Scanned Hash */}
                  <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                    {item.currentHash ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-electric-blue cursor-pointer hover:underline"
                          onClick={() => onInspectItem(item)}
                          title="Click to view full hash"
                        >
                          {truncateHash(item.currentHash, 6, 6)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(item.currentHash!, `curr-${item.id}`)}
                          className="text-gray-500 hover:text-gray-300 transition-colors p-0.5 cursor-pointer"
                          title="Copy current hash"
                        >
                          {copiedHash === `curr-${item.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <StatusBadge status={item.status} size="sm" />
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => onInspectItem(item)}
                      className="px-2.5 py-1 bg-navy-700 hover:bg-navy-600 text-gray-200 rounded text-xs font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
                      title="Inspect hash details"
                    >
                      <Eye className="w-3.5 h-3.5 text-electric-blue" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
