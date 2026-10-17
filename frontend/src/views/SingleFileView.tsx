import React, { useState, useCallback } from 'react';
import {
  Fingerprint,
  Shield,
  Copy,
  Check,
  X,
  AlertTriangle,
  Upload,
  RefreshCw,
  Lock,
} from 'lucide-react';
import type { SingleFileHashResult, SingleFileReference } from '../types';
import { formatFileSize } from '../utils/formatters';

export const SingleFileView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [hashResult, setHashResult] = useState<SingleFileHashResult | null>(null);
  const [referenceHash, setReferenceHash] = useState<SingleFileReference | null>(null);
  const [verifyFile, setVerifyFile] = useState<File | null>(null);
  const [verifyResult, setVerifyResult] = useState<'unchanged' | 'modified' | null>(null);
  const [verifyHashResult, setVerifyHashResult] = useState<SingleFileHashResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [verifyCopied, setVerifyCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = '/api';

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setHashResult(null);
      setError(null);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setHashResult(null);
      setError(null);
    }
  };

  const generateHash = async () => {
    if (!file) return;

    setIsGenerating(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/hash`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate hash');
      }

      const result: SingleFileHashResult = await response.json();
      setHashResult(result);
    } catch (err) {
      setError('Failed to generate hash. Please ensure the backend is running.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveReference = () => {
    if (hashResult) {
      setReferenceHash({
        filename: hashResult.filename,
        hash: hashResult.hash,
      });
    }
  };

  const handleVerifyFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setVerifyFile(droppedFile);
      setVerifyResult(null);
      setVerifyHashResult(null);
      setError(null);
    }
  }, []);

  const handleVerifyFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setVerifyFile(selectedFile);
      setVerifyResult(null);
      setVerifyHashResult(null);
      setError(null);
    }
  };

  const verifyIntegrity = async () => {
    if (!verifyFile || !referenceHash) return;

    setIsVerifying(true);
    setError(null);
    setVerifyHashResult(null);

    const formData = new FormData();
    formData.append('file', verifyFile);

    try {
      const response = await fetch(`${API_URL}/hash`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to verify file');
      }

      const result: SingleFileHashResult = await response.json();
      setVerifyHashResult(result);

      if (result.hash.toLowerCase() === referenceHash.hash.toLowerCase()) {
        setVerifyResult('unchanged');
      } else {
        setVerifyResult('modified');
      }
    } catch (err) {
      setError('Failed to verify file. Please ensure the backend is running.');
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = () => {
    if (hashResult) {
      navigator.clipboard.writeText(hashResult.hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyVerifyHashToClipboard = () => {
    if (verifyHashResult) {
      navigator.clipboard.writeText(verifyHashResult.hash);
      setVerifyCopied(true);
      setTimeout(() => setVerifyCopied(false), 2000);
    }
  };

  const resetReference = () => {
    setReferenceHash(null);
    setVerifyResult(null);
    setVerifyHashResult(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-electric-blue/10 border border-electric-blue/30 rounded-full mb-3 text-xs text-electric-blue font-medium">
          <Lock className="w-3.5 h-3.5" />
          <span>Single File Integrity Verification</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Single File Hash & Compare
        </h2>
        <p className="text-sm text-gray-400 mt-1 leading-relaxed">
          Generate a 256-bit cryptographic digest for an individual file, save it as a reference baseline, and verify any modified copy.
        </p>
      </div>

      {/* File Hashing Section */}
      <div className="bg-navy-800/60 border border-navy-700 rounded-xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-electric-blue/10 rounded-lg border border-electric-blue/30">
            <Fingerprint className="w-5 h-5 text-electric-blue" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">1. Generate File Hash</h3>
            <p className="text-xs text-gray-400">Upload any file to calculate its SHA-256 fingerprint</p>
          </div>
        </div>

        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all duration-200 ${
            file
              ? 'border-electric-blue bg-electric-blue/5'
              : 'border-navy-600 hover:border-navy-500 hover:bg-navy-700/30'
          }`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
        >
          {file ? (
            <div className="space-y-3">
              <div className="w-16 h-16 mx-auto bg-electric-blue/10 rounded-full flex items-center justify-center border border-electric-blue/30">
                <Fingerprint className="w-8 h-8 text-electric-blue" />
              </div>
              <p className="text-white font-semibold text-lg">{file.name}</p>
              <p className="text-sm text-gray-400">{formatFileSize(file.size)}</p>
              <button
                onClick={() => {
                  setFile(null);
                  setHashResult(null);
                }}
                className="mt-4 text-xs text-electric-blue hover:text-blue-400 font-medium transition-colors cursor-pointer"
              >
                Choose different file
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-14 h-14 mx-auto bg-navy-700 rounded-full flex items-center justify-center">
                <Upload className="w-7 h-7 text-gray-400" />
              </div>
              <div>
                <p className="text-gray-300 font-medium mb-1">Drag and drop a file here</p>
                <p className="text-xs text-gray-500 mb-4">or</p>
                <label className="inline-block">
                  <span className="px-5 py-2.5 bg-electric-blue text-white rounded-lg font-medium hover:bg-blue-600 transition-colors cursor-pointer text-sm shadow-md shadow-blue-500/20">
                    Browse file
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">Maximum file size: 20 MB</p>
            </div>
          )}
        </div>

        {/* Generate Button */}
        {file && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={generateHash}
              disabled={isGenerating}
              className="px-6 py-2.5 bg-electric-blue text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 text-sm"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating SHA-256 Hash...
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4" />
                  Generate SHA-256 Hash
                </>
              )}
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-900/20 border border-red-800 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Hash Result */}
        {hashResult && (
          <div className="mt-8 space-y-5 p-5 bg-navy-900/70 rounded-xl border border-navy-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Filename</p>
                <p className="text-white font-medium text-sm">{hashResult.filename}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">File Size</p>
                <p className="text-white font-medium text-sm">{formatFileSize(hashResult.size)}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">SHA-256 Fingerprint</p>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Hash</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-navy-950 border border-navy-700 rounded-lg p-3.5">
                <code className="text-xs sm:text-sm text-electric-blue font-mono break-all leading-relaxed select-all">
                  {hashResult.hash}
                </code>
              </div>
            </div>

            <button
              onClick={saveReference}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm shadow-md shadow-emerald-600/20"
            >
              <Shield className="w-4 h-4" />
              Save as Reference Hash
            </button>
          </div>
        )}
      </div>

      {/* Reference Hash and Verification - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reference Hash Section */}
        <div className="bg-navy-800/60 border border-navy-700 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">2. Saved Reference Hash</h3>
                  <p className="text-xs text-gray-400">Target baseline for single-file comparison</p>
                </div>
              </div>
              {referenceHash && (
                <button
                  onClick={resetReference}
                  className="text-xs text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            {referenceHash ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Reference File</p>
                  <p className="text-white font-medium text-sm">{referenceHash.filename}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Saved SHA-256 Digest</p>
                  <div className="bg-navy-950 border border-navy-700 rounded-lg p-3.5">
                    <code className="text-xs text-emerald-400 font-mono break-all leading-relaxed select-all">
                      {referenceHash.hash}
                    </code>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                  <Check className="w-4 h-4" />
                  <span>Reference baseline active for verification</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-12 h-12 mx-auto bg-navy-700/60 rounded-full flex items-center justify-center mb-3">
                  <Shield className="w-6 h-6 text-gray-500" />
                </div>
                <p className="text-gray-300 text-sm font-medium">No reference hash saved yet</p>
                <p className="text-gray-500 text-xs mt-1">
                  Generate a hash above and click "Save as Reference Hash"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Integrity Verification Section */}
        <div className="bg-navy-800/60 border border-navy-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-electric-blue/10 rounded-lg border border-electric-blue/30">
              <Shield className="w-5 h-5 text-electric-blue" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">3. Verify File Integrity</h3>
              <p className="text-xs text-gray-400">Upload suspect file to compare against reference</p>
            </div>
          </div>

          {/* Verification File Upload */}
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
              verifyFile
                ? 'border-electric-blue bg-electric-blue/5'
                : 'border-navy-600 hover:border-navy-500 hover:bg-navy-700/30'
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleVerifyFileDrop}
          >
            {verifyFile ? (
              <div className="space-y-2">
                <p className="text-white font-medium text-sm">{verifyFile.name}</p>
                <p className="text-xs text-gray-400">{formatFileSize(verifyFile.size)}</p>
                <label className="inline-block mt-2">
                  <span className="text-xs text-electric-blue hover:text-blue-400 cursor-pointer font-medium">
                    Choose different file
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleVerifyFileSelect}
                  />
                </label>
              </div>
            ) : (
              <label className="inline-block">
                <span className="px-5 py-2.5 bg-navy-700 hover:bg-navy-600 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer inline-block">
                  Select File to Verify
                </span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleVerifyFileSelect}
                />
              </label>
            )}
          </div>

          <button
            onClick={verifyIntegrity}
            disabled={!verifyFile || !referenceHash || isVerifying}
            className="mt-4 w-full px-6 py-2.5 bg-electric-blue text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer text-sm shadow-md shadow-blue-500/20"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Verifying Integrity...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Verify Integrity
              </>
            )}
          </button>

          {!referenceHash && (
            <p className="mt-3 text-xs text-amber-400 text-center flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Save a reference hash above first
            </p>
          )}

          {/* Hash Comparison Display */}
          {verifyHashResult && referenceHash && (
            <div className="mt-6 space-y-4">
              <div className="bg-navy-900/60 border border-navy-700 rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Reference SHA-256</p>
                  <p className="text-[11px] text-gray-400">{referenceHash.filename}</p>
                </div>
                <div className="bg-navy-950 border border-navy-700/80 rounded-md p-2.5">
                  <code className="text-xs text-emerald-400 font-mono break-all leading-relaxed">
                    {referenceHash.hash}
                  </code>
                </div>
              </div>

              <div className="bg-navy-900/60 border border-navy-700 rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Verification SHA-256</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] text-gray-400">{verifyHashResult.filename}</p>
                    <button
                      onClick={copyVerifyHashToClipboard}
                      className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                      title="Copy hash"
                    >
                      {verifyCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="bg-navy-950 border border-navy-700/80 rounded-md p-2.5">
                  <code className="text-xs text-electric-blue font-mono break-all leading-relaxed">
                    {verifyHashResult.hash}
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* Verification Result Banner */}
          {verifyResult === 'unchanged' && (
            <div className="mt-4 p-4 bg-emerald-950/30 border border-emerald-800 rounded-lg">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="p-1.5 bg-emerald-500/20 rounded-md">
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <h4 className="text-base font-bold text-emerald-400">FILE UNCHANGED</h4>
              </div>
              <p className="text-xs text-gray-300">
                The computed SHA-256 hash matches the reference hash. File contents appear 100% identical.
              </p>
            </div>
          )}

          {verifyResult === 'modified' && (
            <div className="mt-4 p-4 bg-rose-950/30 border border-rose-800 rounded-lg">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="p-1.5 bg-rose-500/20 rounded-md">
                  <X className="w-4 h-4 text-rose-400" />
                </div>
                <h4 className="text-base font-bold text-rose-400">FILE MODIFIED</h4>
              </div>
              <p className="text-xs text-gray-300">
                The computed SHA-256 hash differs from the reference hash. Contents have been changed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
