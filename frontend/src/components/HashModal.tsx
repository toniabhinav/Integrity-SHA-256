import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Shield, AlertTriangle, Fingerprint, FileCode } from 'lucide-react';
import type { ScanResultItem } from '../types';
import { formatFileSize } from '../utils/formatters';
import { StatusBadge } from './StatusBadge';

interface HashModalProps {
  item: ScanResultItem | null;
  onClose: () => void;
}

export const HashModal: React.FC<HashModalProps> = ({ item, onClose }) => {
  const [copiedBaseline, setCopiedBaseline] = useState(false);
  const [copiedCurrent, setCopiedCurrent] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const copyHash = (hash: string, isBaseline: boolean) => {
    navigator.clipboard.writeText(hash);
    if (isBaseline) {
      setCopiedBaseline(true);
      setTimeout(() => setCopiedBaseline(false), 2000);
    } else {
      setCopiedCurrent(true);
      setTimeout(() => setCopiedCurrent(false), 2000);
    }
  };

  const renderHexDiff = (baseline?: string, current?: string) => {
    if (!baseline || !current) return null;

    const charsBaseline = baseline.split('');
    const charsCurrent = current.split('');

    return (
      <div className="mt-4 p-3 bg-navy-950/80 rounded-lg border border-navy-700 font-mono text-xs overflow-x-auto">
        <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-2 font-sans font-medium">
          Nibble-by-Nibble Comparison:
        </p>
        <div className="space-y-1.5 select-text">
          <div className="flex items-center gap-2">
            <span className="w-16 text-gray-500 shrink-0 font-sans text-[11px]">Baseline:</span>
            <span className="break-all">
              {charsBaseline.map((c, i) => {
                const isMatch = charsCurrent[i] === c;
                return (
                  <span
                    key={i}
                    className={isMatch ? 'text-gray-300' : 'text-emerald-400 bg-emerald-950/50 font-bold px-0.5'}
                  >
                    {c}
                  </span>
                );
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-16 text-gray-500 shrink-0 font-sans text-[11px]">Current:</span>
            <span className="break-all">
              {charsCurrent.map((c, i) => {
                const isMatch = charsBaseline[i] === c;
                return (
                  <span
                    key={i}
                    className={isMatch ? 'text-gray-300' : 'text-rose-400 bg-rose-950/50 font-bold px-0.5'}
                  >
                    {c}
                  </span>
                );
              })}
            </span>
          </div>
        </div>
        {item.status === 'MODIFIED' && (
          <p className="mt-2 text-[11px] text-gray-400 font-sans">
            Demonstrates the <span className="text-white font-medium">Avalanche Effect</span>: flipping even a single bit in the source file completely alters approximately 50% of the output hash digest.
          </p>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-navy-800 border border-navy-700 rounded-xl shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-navy-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-electric-blue/10 border border-electric-blue/30 rounded-lg">
              <Fingerprint className="w-6 h-6 text-electric-blue" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Hash Inspection & Comparison
              </h3>
              <p className="text-xs text-gray-400">SHA-256 Cryptographic Checksum</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-navy-700 transition-colors"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File Metadata Overview */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-navy-900/60 rounded-lg border border-navy-700/60 text-sm">
          <div>
            <span className="text-xs text-gray-400 block mb-0.5">File Identity</span>
            <span className="font-semibold text-white break-all flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-electric-blue shrink-0" />
              {item.path}
            </span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block mb-0.5">Size</span>
            <span className="font-medium text-gray-200">{formatFileSize(item.size)}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block mb-0.5">Integrity Status</span>
            <div>
              <StatusBadge status={item.status} size="sm" />
            </div>
          </div>
        </div>

        {/* Detailed Explanation Banner */}
        <div className="mt-4">
          {item.status === 'UNCHANGED' && (
            <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg flex items-center gap-2 text-xs text-emerald-300">
              <Shield className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Full 256-bit collision-resistant match. File contents are verified identical to baseline.</span>
            </div>
          )}
          {item.status === 'MODIFIED' && (
            <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-lg flex items-center gap-2 text-xs text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>Hash digest mismatch detected! Contents have been altered, corrupted, or tampered with.</span>
            </div>
          )}
          {item.status === 'NEW' && (
            <div className="p-3 bg-sky-950/30 border border-sky-800/40 rounded-lg flex items-center gap-2 text-xs text-sky-300">
              <Shield className="w-4 h-4 shrink-0 text-sky-400" />
              <span>File was newly introduced in this scan; no baseline entry exists for comparison.</span>
            </div>
          )}
          {item.status === 'MISSING' && (
            <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-lg flex items-center gap-2 text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>File is expected by the baseline manifest but was not found in the current batch upload.</span>
            </div>
          )}
        </div>

        {/* Baseline Hash Box */}
        <div className="mt-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                Baseline Reference SHA-256
              </span>
              {item.baselineHash && (
                <button
                  onClick={() => copyHash(item.baselineHash!, true)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  {copiedBaseline ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="p-3 bg-navy-900 border border-navy-700 rounded-lg">
              <code className="text-xs text-emerald-400 font-mono break-all leading-relaxed select-all">
                {item.baselineHash || '(No baseline record available for this file)'}
              </code>
            </div>
          </div>

          {/* Current Hash Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-electric-blue inline-block"></span>
                Current Scanned SHA-256
              </span>
              {item.currentHash && (
                <button
                  onClick={() => copyHash(item.currentHash!, false)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  {copiedCurrent ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="p-3 bg-navy-900 border border-navy-700 rounded-lg">
              <code className="text-xs text-electric-blue font-mono break-all leading-relaxed select-all">
                {item.currentHash || '(File was missing during scan; no current hash calculated)'}
              </code>
            </div>
          </div>
        </div>

        {/* Nibble comparison if both hashes are present and differing */}
        {item.baselineHash && item.currentHash && item.status === 'MODIFIED' && (
          renderHexDiff(item.baselineHash, item.currentHash)
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-navy-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-navy-700 hover:bg-navy-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
