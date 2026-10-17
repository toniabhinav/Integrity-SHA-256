import React from 'react';
import {
  Shield,
  HardDrive,
  FolderGit2,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { NavigationTab, BaselineManifest, BatchScanSession, SessionStats } from '../types';
import { SummaryMetrics } from '../components/SummaryMetrics';
import { formatDate } from '../utils/formatters';

interface OverviewViewProps {
  onNavigate: (tab: NavigationTab) => void;
  activeBaseline: BaselineManifest | null;
  baselineName: string | null;
  lastSession: BatchScanSession | null;
  sessionStats: SessionStats;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
  activeBaseline,
  baselineName,
  lastSession,
  sessionStats,
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-navy-800 via-navy-800/90 to-navy-900 border border-navy-700/80 p-6 sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-electric-blue/10 border border-electric-blue/30 rounded-full mb-3 text-xs text-electric-blue font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Host-based File Integrity Monitoring (FIM)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Cryptographic Integrity Dashboard
          </h2>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed">
            Monitor files against trusted cryptographic baselines. Instantly pinpoint modified, unauthorized, or missing assets using SHA-256 hashing.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={() => onNavigate('batch')}
              className="px-5 py-2.5 bg-electric-blue hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
            >
              <HardDrive className="w-4 h-4" />
              <span>Launch Batch Scanner</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('reference')}
              className="px-4 py-2.5 bg-navy-700 hover:bg-navy-600 border border-navy-600 text-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
            >
              <FolderGit2 className="w-4 h-4 text-gray-300" />
              <span>Baseline Manifests</span>
            </button>
          </div>
        </div>

        {/* Subtle background shield illustration */}
        <div className="absolute right-6 -bottom-6 opacity-10 pointer-events-none hidden md:block">
          <Shield className="w-64 h-64 text-electric-blue" />
        </div>
      </div>

      {/* Session Metrics Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Current Session Monitoring Statistics</span>
          </h3>
          <span className="text-xs text-gray-400">
            {sessionStats.totalScans} scan{sessionStats.totalScans === 1 ? '' : 's'} executed
          </span>
        </div>

        <SummaryMetrics
          total={sessionStats.totalFilesProcessed}
          unchanged={sessionStats.unchangedTotal}
          modified={sessionStats.modifiedTotal}
          newFiles={sessionStats.newTotal}
          missing={sessionStats.missingTotal}
          subtitle={`${sessionStats.totalScans} batch runs`}
        />
      </div>

      {/* 2-Column Info: Active Baseline & Last Scan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Baseline Status Card */}
        <div className="bg-navy-800/60 border border-navy-700 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-navy-700/60">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <FolderGit2 className="w-4 h-4 text-electric-blue" />
                <span>Active Reference Baseline</span>
              </div>
              {activeBaseline ? (
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 font-medium">
                  Active
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded bg-navy-700 text-gray-400 font-medium">
                  None Loaded
                </span>
              )}
            </div>

            <div className="mt-4">
              {activeBaseline ? (
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-400 block">Baseline Name / Source:</span>
                    <span className="text-sm font-semibold text-white break-all">
                      {baselineName || 'Trusted Baseline Manifest'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-navy-900/60 rounded-lg border border-navy-700/50">
                      <span className="text-gray-400 block">Registered Files</span>
                      <span className="text-base font-bold text-emerald-400">
                        {activeBaseline.files.length} files
                      </span>
                    </div>
                    <div className="p-2.5 bg-navy-900/60 rounded-lg border border-navy-700/50">
                      <span className="text-gray-400 block">Algorithm</span>
                      <span className="text-base font-bold text-electric-blue font-mono">
                        {activeBaseline.algorithm}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    <span>Created: {formatDate(activeBaseline.createdAt)}</span>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-gray-400 space-y-2">
                  <p className="text-sm font-medium text-gray-300">No baseline loaded yet</p>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Create a baseline from a clean set of files, or import a pre-generated manifest JSON in Reference Manager.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-navy-700/60">
            <button
              onClick={() => onNavigate('reference')}
              className="w-full py-2 bg-navy-700 hover:bg-navy-600 text-gray-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{activeBaseline ? 'Manage / Replace Baseline' : 'Load or Create Baseline'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Scan Summary Card */}
        <div className="bg-navy-800/60 border border-navy-700 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-navy-700/60">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Clock className="w-4 h-4 text-electric-blue" />
                <span>Most Recent Batch Scan</span>
              </div>
              {lastSession && (
                <span className="text-xs text-gray-400">
                  {formatDate(lastSession.timestamp)}
                </span>
              )}
            </div>

            <div className="mt-4">
              {lastSession ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Target Baseline:</span>
                    <span className="font-semibold text-white truncate max-w-[200px]">
                      {lastSession.baselineName}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 bg-emerald-950/30 border border-emerald-800/30 rounded-lg">
                      <span className="text-gray-400 block text-[10px]">Unchanged</span>
                      <span className="text-sm font-bold text-emerald-400">
                        {lastSession.unchangedCount}
                      </span>
                    </div>
                    <div className="p-2 bg-rose-950/30 border border-rose-800/30 rounded-lg">
                      <span className="text-gray-400 block text-[10px]">Modified</span>
                      <span className="text-sm font-bold text-rose-400">
                        {lastSession.modifiedCount}
                      </span>
                    </div>
                    <div className="p-2 bg-sky-950/30 border border-sky-800/30 rounded-lg">
                      <span className="text-gray-400 block text-[10px]">New</span>
                      <span className="text-sm font-bold text-sky-400">
                        {lastSession.newCount}
                      </span>
                    </div>
                    <div className="p-2 bg-amber-950/30 border border-amber-800/30 rounded-lg">
                      <span className="text-gray-400 block text-[10px]">Missing</span>
                      <span className="text-sm font-bold text-amber-400">
                        {lastSession.missingCount}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400">
                    Total files in scan: <span className="text-white font-medium">{lastSession.totalScanned}</span>
                  </p>
                </div>
              ) : (
                <div className="py-6 text-center text-gray-400 space-y-2">
                  <p className="text-sm font-medium text-gray-300">No batch scans performed yet</p>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Select your files and run your first integrity verification in the Batch Scanner tab.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-navy-700/60">
            <button
              onClick={() => onNavigate('batch')}
              className="w-full py-2 bg-navy-700 hover:bg-navy-600 text-gray-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{lastSession ? 'View Full Scan Results' : 'Go to Batch Scanner'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Getting Started & Workflow Steps */}
      <div className="bg-navy-800/40 border border-navy-700/70 rounded-xl p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>How Batch File Integrity Monitoring Works</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-navy-900/60 rounded-lg border border-navy-700/60 space-y-2">
            <div className="w-7 h-7 rounded-full bg-electric-blue/10 border border-electric-blue/30 text-electric-blue flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h4 className="text-sm font-semibold text-white">Create Baseline</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Upload known trusted files to compute their SHA-256 digests and export a cryptographically sealed JSON manifest.
            </p>
          </div>

          <div className="p-4 bg-navy-900/60 rounded-lg border border-navy-700/60 space-y-2">
            <div className="w-7 h-7 rounded-full bg-electric-blue/10 border border-electric-blue/30 text-electric-blue flex items-center justify-center font-bold text-xs">
              2
            </div>
            <h4 className="text-sm font-semibold text-white">Select Current Files</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Upload files from any directory or system state to verify against the saved baseline manifest.
            </p>
          </div>

          <div className="p-4 bg-navy-900/60 rounded-lg border border-navy-700/60 space-y-2">
            <div className="w-7 h-7 rounded-full bg-electric-blue/10 border border-electric-blue/30 text-electric-blue flex items-center justify-center font-bold text-xs">
              3
            </div>
            <h4 className="text-sm font-semibold text-white">Compare Digests</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              SecureFile matches paths and detects UNCHANGED, MODIFIED (altered hash), NEW, or MISSING entries.
            </p>
          </div>

          <div className="p-4 bg-navy-900/60 rounded-lg border border-navy-700/60 space-y-2">
            <div className="w-7 h-7 rounded-full bg-electric-blue/10 border border-electric-blue/30 text-electric-blue flex items-center justify-center font-bold text-xs">
              4
            </div>
            <h4 className="text-sm font-semibold text-white">Export & Inspect</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Inspect character-level hash diffs, filter by anomaly status, and download audit-ready CSV or JSON reports.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
