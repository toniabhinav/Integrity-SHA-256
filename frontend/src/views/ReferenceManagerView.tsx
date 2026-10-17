import React, { useState, useRef } from 'react';
import {
  FolderGit2,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Search,
  ShieldCheck,
  HardDrive,
  Copy,
  Check,
} from 'lucide-react';
import type { BaselineManifest, NavigationTab } from '../types';
import { validateManifestJson } from '../utils/manifestValidator';
import { downloadManifestJson } from '../utils/exportUtils';
import { formatFileSize, formatDate, truncateHash } from '../utils/formatters';

interface ReferenceManagerViewProps {
  activeBaseline: BaselineManifest | null;
  baselineName: string | null;
  onSetBaseline: (manifest: BaselineManifest, name: string) => void;
  onClearBaseline: () => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const ReferenceManagerView: React.FC<ReferenceManagerViewProps> = ({
  activeBaseline,
  baselineName,
  onSetBaseline,
  onClearBaseline,
  onNavigate,
}) => {
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = validateManifestJson(content);

      if (!result.isValid || !result.manifest) {
        setImportError(result.error || 'Failed to validate manifest file.');
        return;
      }

      onSetBaseline(result.manifest, file.name);
      setImportSuccess(
        `Manifest "${file.name}" imported successfully! (${result.manifest.files.length} registered file entries).`
      );
    };

    reader.onerror = () => {
      setImportError('Failed to read the selected file.');
    };

    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copyHashToClipboard = (hash: string, id: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleDownloadSample = () => {
    const sampleManifest: BaselineManifest = {
      manifestVersion: 1,
      algorithm: 'SHA-256',
      createdAt: new Date().toISOString(),
      description: 'SecureFile Sample INS Baseline Manifest',
      files: [
        {
          path: 'config/settings.json',
          size: 1024,
          sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        },
        {
          path: 'database/schema.sql',
          size: 4096,
          sha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
        },
        {
          path: 'index.html',
          size: 2048,
          sha256: 'ca978112ca1bbdcafac231b39a23dc4da786081cd1e14eed647f4b4b4c4897f1',
        },
      ],
    };
    downloadManifestJson(sampleManifest, 'sample-baseline-manifest.json');
  };

  // Filter baseline entries by search
  const filteredFiles = activeBaseline
    ? activeBaseline.files.filter(
        (f) =>
          f.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.sha256.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-electric-blue/10 border border-electric-blue/30 rounded-full mb-3 text-xs text-electric-blue font-medium">
          <FolderGit2 className="w-3.5 h-3.5" />
          <span>Baseline Manifest Repository</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Reference Manifest Manager
        </h2>
        <p className="text-sm text-gray-400 mt-1 leading-relaxed">
          Import, validate, inspect, and export cryptographically signed baseline manifests. Validates manifest versions, SHA-256 algorithm stamps, and file checksums.
        </p>
      </div>

      {/* Two Column: Import Area & Active Manifest Quick Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Box */}
        <div className="bg-navy-800/60 border border-navy-700 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 bg-electric-blue/10 border border-electric-blue/30 rounded-lg">
                <Upload className="w-5 h-5 text-electric-blue" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Import Baseline Manifest</h3>
                <p className="text-xs text-gray-400">Load a previously downloaded .json manifest</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed mb-5">
              SecureFile performs strict JSON schema verification, ensuring manifest version compatibility (v1), SHA-256 algorithms, non-negative file sizes, and 64-character hex digests.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json,application/json"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 bg-navy-700 hover:bg-navy-600 border border-navy-600 hover:border-electric-blue text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <FileCode className="w-4 h-4 text-electric-blue" />
              <span>Select Manifest JSON File</span>
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-navy-700/60 flex items-center justify-between">
            <span className="text-xs text-gray-500">Need a template for testing?</span>
            <button
              onClick={handleDownloadSample}
              className="text-xs text-electric-blue hover:text-blue-400 font-medium transition-colors cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              Download Sample Manifest
            </button>
          </div>
        </div>

        {/* Current Active Baseline Card */}
        <div className="bg-navy-800/60 border border-navy-700 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-lg border ${
                    activeBaseline
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                      : 'bg-navy-700/50 border-navy-600 text-gray-400'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Current Active Baseline</h3>
                  <p className="text-xs text-gray-400">Used for batch integrity verification</p>
                </div>
              </div>

              {activeBaseline && (
                <button
                  onClick={onClearBaseline}
                  className="text-xs text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Unload this baseline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Unload</span>
                </button>
              )}
            </div>

            {activeBaseline ? (
              <div className="space-y-3.5">
                <div className="p-3 bg-navy-900/60 rounded-lg border border-navy-700/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Manifest Name:</span>
                    <span className="font-semibold text-white truncate max-w-[220px]">
                      {baselineName || 'Active Manifest'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-2">
                    <span className="text-gray-400">Creation Date:</span>
                    <span className="text-gray-300 font-mono text-[11px]">
                      {formatDate(activeBaseline.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-2">
                    <span className="text-gray-400">Algorithm / Version:</span>
                    <span className="text-emerald-400 font-mono text-[11px]">
                      {activeBaseline.algorithm} (v{activeBaseline.manifestVersion})
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-2">
                    <span className="text-gray-400">Registered Files:</span>
                    <span className="text-electric-blue font-bold">
                      {activeBaseline.files.length} items
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadManifestJson(activeBaseline, baselineName || 'baseline-manifest.json')}
                    className="flex-1 py-2 bg-navy-700 hover:bg-navy-600 text-gray-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download Manifest</span>
                  </button>
                  <button
                    onClick={() => onNavigate('batch')}
                    className="flex-1 py-2 bg-electric-blue hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>Scan with This Baseline</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400 space-y-2">
                <p className="text-sm font-medium text-gray-300">No active baseline loaded</p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Import an existing JSON manifest or generate one from files in the Batch Scanner tab.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Validation Alert Displays */}
      {importError && (
        <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-xl flex items-start gap-3 text-sm text-rose-300">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-200">Manifest Validation Failed</p>
            <p className="text-xs text-rose-300 mt-0.5">{importError}</p>
          </div>
        </div>
      )}

      {importSuccess && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800 rounded-xl flex items-start gap-3 text-sm text-emerald-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-200">Import Successful</p>
            <p className="text-xs text-emerald-300 mt-0.5">{importSuccess}</p>
          </div>
        </div>
      )}

      {/* Baseline File Entries Browser */}
      {activeBaseline && (
        <div className="bg-navy-800/60 border border-navy-700 rounded-xl overflow-hidden space-y-4">
          <div className="p-4 sm:p-5 border-b border-navy-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Registered Baseline Files</h3>
              <p className="text-xs text-gray-400">
                All cryptographic signatures stored inside this baseline manifest
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search registered files..."
                className="w-full bg-navy-900 border border-navy-600 rounded-lg pl-9 pr-4 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-electric-blue transition-colors"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-navy-900/80 border-b border-navy-700 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="py-2.5 px-4 font-semibold">#</th>
                  <th className="py-2.5 px-4 font-semibold">File Path</th>
                  <th className="py-2.5 px-4 font-semibold">Size</th>
                  <th className="py-2.5 px-4 font-semibold">Stored SHA-256 Digest</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/50 text-xs">
                {filteredFiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No files matched your search query.
                    </td>
                  </tr>
                ) : (
                  filteredFiles.map((file, idx) => (
                    <tr key={`${file.path}-${idx}`} className="hover:bg-navy-700/20 transition-colors">
                      <td className="py-2.5 px-4 text-gray-500 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-medium text-white max-w-xs truncate">
                        {file.path}
                      </td>
                      <td className="py-2.5 px-4 text-gray-400 whitespace-nowrap">
                        {formatFileSize(file.size)}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-emerald-400 whitespace-nowrap">
                        {truncateHash(file.sha256, 12, 12)}
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => copyHashToClipboard(file.sha256, `manifest-${idx}`)}
                          className="px-2 py-1 bg-navy-700 hover:bg-navy-600 text-gray-200 rounded text-[11px] font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Copy SHA-256 hash"
                        >
                          {copiedHash === `manifest-${idx}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
