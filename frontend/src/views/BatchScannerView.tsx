import React, { useState } from 'react';
import {
  HardDrive,
  FolderGit2,
  Play,
  Download,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import type {
  BaselineManifest,
  BatchScanSession,
  ScanResultItem,
  NavigationTab,
} from '../types';
import { FileDropzone } from '../components/FileDropzone';
import { SummaryMetrics } from '../components/SummaryMetrics';
import { BatchResultsTable } from '../components/BatchResultsTable';
import { HashModal } from '../components/HashModal';
import { downloadManifestJson } from '../utils/exportUtils';
import { formatDate } from '../utils/formatters';

interface BatchScannerViewProps {
  activeBaseline: BaselineManifest | null;
  baselineName: string | null;
  onSetBaseline: (manifest: BaselineManifest, name: string) => void;
  onNavigate: (tab: NavigationTab) => void;
  onRecordSession: (session: BatchScanSession) => void;
}

export const BatchScannerView: React.FC<BatchScannerViewProps> = ({
  activeBaseline,
  baselineName,
  onSetBaseline,
  onNavigate,
  onRecordSession,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<BatchScanSession | null>(null);
  const [inspectingItem, setInspectingItem] = useState<ScanResultItem | null>(null);

  const API_URL = '/api';

  // Helper: Hash files via backend /api/batch-hash with clear error diagnosis
  const hashBatchFiles = async (
    filesToHash: File[]
  ): Promise<{ filename: string; size: number; hash: string }[]> => {
    // 1. Try batch endpoint first
    try {
      const formData = new FormData();
      filesToHash.forEach((f) => formData.append('files', f));

      const response = await fetch(`${API_URL}/batch-hash`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.files)) {
          return data.files.map((item: { filename: string; size: number; hash: string }) => ({
            filename: item.filename,
            size: item.size,
            hash: item.hash.toLowerCase(),
          }));
        }
      } else {
        // Parse server error if returned
        const errorJson = await response.json().catch(() => null);
        if (errorJson && errorJson.error) {
          throw new Error(`Server error: ${errorJson.error}`);
        }
      }
    } catch (batchErr) {
      const msg = (batchErr as Error).message || '';
      // If it's a specific server error (like file size limit), rethrow it directly
      if (msg.startsWith('Server error:')) {
        throw batchErr;
      }
      // If it's a connection failure, check single endpoint or throw helpful message
    }

    // 2. Fallback: sequential single hashing via /api/hash
    try {
      const results: { filename: string; size: number; hash: string }[] = [];
      for (let i = 0; i < filesToHash.length; i++) {
        const f = filesToHash[i];
        setProgressText(`Computing SHA-256 for file ${i + 1} of ${filesToHash.length}: ${f.name}...`);
        const singleFormData = new FormData();
        singleFormData.append('file', f);

        const resp = await fetch(`${API_URL}/hash`, {
          method: 'POST',
          body: singleFormData,
        });

        if (!resp.ok) {
          const errBody = await resp.json().catch(() => null);
          const errorMsg = errBody?.error || `HTTP ${resp.status} ${resp.statusText}`;
          throw new Error(`Failed to compute hash for '${f.name}': ${errorMsg}`);
        }

        const item = await resp.json();
        results.push({
          filename: item.filename,
          size: item.size,
          hash: item.hash.toLowerCase(),
        });
      }

      return results;
    } catch (fallbackErr) {
      const message = (fallbackErr as Error).message || '';
      if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
        throw new Error(
          'Cannot connect to SecureFile backend at http://localhost:3002. Please ensure the backend is running in your terminal: run "npm start" in the backend folder.'
        );
      }
      throw fallbackErr;
    }
  };

  // Action: Create baseline from selected files
  const handleCreateBaseline = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file to create a baseline.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);
    setProgressText(`Calculating SHA-256 digests for ${selectedFiles.length} file(s)...`);

    try {
      const hashedFiles = await hashBatchFiles(selectedFiles);

      const manifestFiles = hashedFiles.map((h, idx) => {
        const originalFile = selectedFiles[idx];
        const relativePath = originalFile.webkitRelativePath || originalFile.name;
        return {
          path: relativePath,
          size: h.size,
          sha256: h.hash,
        };
      });

      const newManifest: BaselineManifest = {
        manifestVersion: 1,
        algorithm: 'SHA-256',
        createdAt: new Date().toISOString(),
        files: manifestFiles,
        description: `Baseline generated with ${manifestFiles.length} file(s) on ${new Date().toLocaleDateString()}`,
      };

      const manifestTitle = `Active Baseline (${manifestFiles.length} files)`;
      onSetBaseline(newManifest, manifestTitle);

      // Trigger manifest download
      downloadManifestJson(newManifest, `securefile-baseline-${Date.now()}.json`);

      setSuccessMessage(
        `Baseline created and set active with ${manifestFiles.length} file(s)! Manifest backup automatically downloaded as JSON.`
      );
    } catch (err) {
      console.error(err);
      setError((err as Error).message || 'Failed to create baseline manifest.');
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  // Helper to extract clean filename from path
  const getBasename = (p: string) => p.split(/[\\/]/).pop() || p;

  // Action: Scan selected files against active baseline
  const handleScanFiles = async () => {
    if (!activeBaseline) {
      setError('A trusted baseline must be loaded or created before scanning.');
      return;
    }

    if (selectedFiles.length === 0) {
      setError('Please select files to scan against the baseline.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);
    setCurrentSession(null);
    setProgressText(`Scanning and computing digests for ${selectedFiles.length} files...`);

    try {
      const hashedUploads = await hashBatchFiles(selectedFiles);

      // Build maps of baseline entries for both exact path and basename matching
      const baselinePathMap = new Map<string, { path: string; size: number; sha256: string; index: number }>();
      const baselineNameMap = new Map<string, { path: string; size: number; sha256: string; index: number }>();

      activeBaseline.files.forEach((f, idx) => {
        const entry = { ...f, index: idx };
        baselinePathMap.set(f.path.toLowerCase(), entry);
        baselineNameMap.set(getBasename(f.path).toLowerCase(), entry);
      });

      const matchedBaselineIndices = new Set<number>();
      const scanResults: ScanResultItem[] = [];

      // 1. Process each uploaded file
      hashedUploads.forEach((uploaded, idx) => {
        const fileObj = selectedFiles[idx];
        const displayPath = fileObj.webkitRelativePath || fileObj.name;
        const normalizedKey = displayPath.toLowerCase();
        const baseNameKey = getBasename(displayPath).toLowerCase();

        // Match by exact path first, then fallback to filename
        const baselineEntry = baselinePathMap.get(normalizedKey) || baselineNameMap.get(baseNameKey);

        if (baselineEntry) {
          matchedBaselineIndices.add(baselineEntry.index);
          const hashesMatch = baselineEntry.sha256.toLowerCase() === uploaded.hash.toLowerCase();

          if (hashesMatch) {
            scanResults.push({
              id: `unchanged-${idx}-${displayPath}`,
              path: displayPath,
              size: uploaded.size,
              baselineHash: baselineEntry.sha256,
              currentHash: uploaded.hash,
              status: 'UNCHANGED',
              details: 'File digest matches baseline. Integrity verified.',
            });
          } else {
            scanResults.push({
              id: `modified-${idx}-${displayPath}`,
              path: displayPath,
              size: uploaded.size,
              baselineHash: baselineEntry.sha256,
              currentHash: uploaded.hash,
              status: 'MODIFIED',
              details: 'Digest mismatch! File content has been altered.',
            });
          }
        } else {
          // File was not in baseline
          scanResults.push({
            id: `new-${idx}-${displayPath}`,
            path: displayPath,
            size: uploaded.size,
            currentHash: uploaded.hash,
            status: 'NEW',
            details: 'File is not recorded in the active baseline manifest.',
          });
        }
      });

      // 2. Identify MISSING files (in baseline, but not uploaded in current scan)
      activeBaseline.files.forEach((baseFile, bIdx) => {
        if (!matchedBaselineIndices.has(bIdx)) {
          scanResults.push({
            id: `missing-${bIdx}-${baseFile.path}`,
            path: baseFile.path,
            size: baseFile.size,
            baselineHash: baseFile.sha256,
            status: 'MISSING',
            details: 'Expected in baseline manifest but absent from current scan batch.',
          });
        }
      });

      // Calculate counts
      const unchangedCount = scanResults.filter((r) => r.status === 'UNCHANGED').length;
      const modifiedCount = scanResults.filter((r) => r.status === 'MODIFIED').length;
      const newCount = scanResults.filter((r) => r.status === 'NEW').length;
      const missingCount = scanResults.filter((r) => r.status === 'MISSING').length;

      const session: BatchScanSession = {
        id: `scan-${Date.now()}`,
        timestamp: new Date().toISOString(),
        baselineName: baselineName || 'Active Baseline',
        totalScanned: scanResults.length,
        unchangedCount,
        modifiedCount,
        newCount,
        missingCount,
        results: scanResults,
      };

      setCurrentSession(session);
      onRecordSession(session);
      setSuccessMessage(
        `Batch scan completed! Evaluated ${scanResults.length} total file entities (${unchangedCount} unchanged, ${modifiedCount} modified, ${newCount} new, ${missingCount} missing).`
      );
    } catch (err) {
      console.error(err);
      setError((err as Error).message || 'Failed to complete batch scan.');
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-electric-blue/10 border border-electric-blue/30 rounded-full mb-3 text-xs text-electric-blue font-medium">
          <HardDrive className="w-3.5 h-3.5" />
          <span>Multi-File Security Verification</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Batch File Integrity Scanner
        </h2>
        <p className="text-sm text-gray-400 mt-1 leading-relaxed">
          Compare whole batches of files against a trusted cryptographic baseline. Identify unchanged, modified, newly introduced, or missing files.
        </p>
      </div>

      {/* Baseline Status & Control Bar */}
      <div className="bg-navy-800/80 border border-navy-700 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-lg border ${
              activeBaseline
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-400'
            }`}
          >
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                Active Baseline:
              </span>
              <span className="text-sm font-bold text-white">
                {activeBaseline ? baselineName || 'Loaded Baseline' : 'No Baseline Loaded'}
              </span>
            </div>
            {activeBaseline ? (
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  <strong className="text-emerald-400">{activeBaseline.files.length} registered files</strong> • Created {formatDate(activeBaseline.createdAt)} (Persisted in browser storage)
                </span>
              </p>
            ) : (
              <p className="text-xs text-amber-400 mt-0.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Select clean files below to create a baseline, or import a manifest in Reference Manager.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => onNavigate('reference')}
            className="px-3.5 py-2 bg-navy-700 hover:bg-navy-600 border border-navy-600 text-gray-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-electric-blue" />
            <span>{activeBaseline ? 'Manage Baseline' : 'Import Baseline'}</span>
          </button>
        </div>
      </div>

      {/* Multi-File Upload Area */}
      <div className="bg-navy-800/50 border border-navy-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-electric-blue"></div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              1. Select Files to Scan or Baseline
            </h3>
          </div>
          <span className="text-xs text-gray-400">
            {selectedFiles.length} file{selectedFiles.length === 1 ? '' : 's'} staged
          </span>
        </div>

        <FileDropzone
          files={selectedFiles}
          onFilesChange={(newFiles) => {
            setSelectedFiles(newFiles);
            setError(null);
          }}
          disabled={isProcessing}
          title="Drag and drop multiple files to scan"
          subtitle="Click to browse or drop entire file groups"
        />

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-navy-700/60">
          {/* Primary Scan Button */}
          <button
            onClick={handleScanFiles}
            disabled={isProcessing || selectedFiles.length === 0 || !activeBaseline}
            className="px-6 py-2.5 bg-electric-blue hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Scan Files Against Baseline</span>
              </>
            )}
          </button>

          {/* Create Baseline Button */}
          <button
            onClick={handleCreateBaseline}
            disabled={isProcessing || selectedFiles.length === 0}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
            title="Create and download a new JSON baseline manifest from the selected files"
          >
            <Download className="w-4 h-4" />
            <span>Create & Download Baseline</span>
          </button>
        </div>

        {/* Guidance tip */}
        <div className="mt-4 flex items-start gap-2 text-xs text-gray-500">
          <HelpCircle className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
          <p>
            <span className="text-gray-300 font-medium">Matching Rule:</span> Files are identified by their relative path or filename. SHA-256 digests are computed strictly from file bytes in memory.
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      {isProcessing && (
        <div className="p-4 bg-navy-800/90 border border-electric-blue/40 rounded-xl flex items-center gap-3 text-sm text-electric-blue animate-pulse">
          <RefreshCw className="w-5 h-5 animate-spin shrink-0" />
          <span className="font-medium">{progressText || 'Computing SHA-256 hashes...'}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800 rounded-xl flex items-start gap-3 text-sm text-red-300">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-200">Execution Error</p>
            <p className="text-xs text-red-300 mt-0.5 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800 rounded-xl flex items-start gap-3 text-sm text-emerald-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-200">Action Completed</p>
            <p className="text-xs text-emerald-300 mt-0.5">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Scan Results Section */}
      {currentSession && (
        <div className="space-y-6 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Scan Verification Results
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Evaluated against: <span className="text-white font-medium">{currentSession.baselineName}</span> • {formatDate(currentSession.timestamp)}
              </p>
            </div>
          </div>

          {/* Metrics Overview */}
          <SummaryMetrics
            total={currentSession.totalScanned}
            unchanged={currentSession.unchangedCount}
            modified={currentSession.modifiedCount}
            newFiles={currentSession.newCount}
            missing={currentSession.missingCount}
          />

          {/* Filterable, Searchable Results Table */}
          <BatchResultsTable
            results={currentSession.results}
            baselineName={currentSession.baselineName}
            scanTimestamp={currentSession.timestamp}
            onInspectItem={(item) => setInspectingItem(item)}
          />
        </div>
      )}

      {/* Hash Inspection Modal */}
      <HashModal item={inspectingItem} onClose={() => setInspectingItem(null)} />
    </div>
  );
};
