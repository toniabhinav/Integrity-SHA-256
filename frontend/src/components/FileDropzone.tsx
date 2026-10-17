import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Trash2, AlertCircle, HardDrive } from 'lucide-react';
import { formatFileSize } from '../utils/formatters';

interface FileDropzoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxSizeMB?: number;
  multiple?: boolean;
  disabled?: boolean;
  title?: string;
  subtitle?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  files,
  onFilesChange,
  maxSizeMB = 20,
  multiple = true,
  disabled = false,
  title = 'Drag & drop files here to scan',
  subtitle = 'or browse files from your computer',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxBytes = maxSizeMB * 1024 * 1024;

  const validateAndAddFiles = useCallback(
    (newFilesList: FileList | File[]) => {
      setValidationError(null);
      const incoming = Array.from(newFilesList);
      if (incoming.length === 0) return;

      const oversized = incoming.filter((f) => f.size > maxBytes);
      if (oversized.length > 0) {
        setValidationError(
          `${oversized.length} file(s) exceeded the ${maxSizeMB} MB limit: ${oversized.map((f) => f.name).join(', ')}`
        );
        return;
      }

      if (!multiple) {
        onFilesChange([incoming[0]]);
        return;
      }

      // In multiple mode, append files while deduplicating by name+size
      const existingMap = new Map(files.map((f) => [`${f.name}:${f.size}`, f]));
      let duplicatesCount = 0;

      incoming.forEach((f) => {
        const key = `${f.name}:${f.size}`;
        if (existingMap.has(key)) {
          duplicatesCount++;
        } else {
          existingMap.set(key, f);
        }
      });

      if (duplicatesCount > 0) {
        setValidationError(`Ignored ${duplicatesCount} duplicate file(s) already in the selection list.`);
      }

      onFilesChange(Array.from(existingMap.values()));
    },
    [files, maxBytes, maxSizeMB, multiple, onFilesChange]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
    }
    // reset input so the user can re-select if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (indexToRemove: number) => {
    onFilesChange(files.filter((_, idx) => idx !== indexToRemove));
  };

  const clearAllFiles = () => {
    onFilesChange([]);
    setValidationError(null);
  };

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all duration-200 ${
          isDragging
            ? 'border-electric-blue bg-electric-blue/10 scale-[1.005]'
            : files.length > 0
            ? 'border-navy-600 bg-navy-800/40 hover:border-navy-500'
            : 'border-navy-700 bg-navy-800/20 hover:border-navy-600 hover:bg-navy-800/40'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          multiple={multiple}
          disabled={disabled}
          className="hidden"
          id="file-dropzone-input"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 bg-navy-700/80 rounded-xl flex items-center justify-center text-electric-blue border border-navy-600">
            <Upload className="w-6 h-6" />
          </div>

          <div>
            <p className="text-white font-medium text-base">{title}</p>
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          </div>

          <div className="pt-1">
            <button
              type="button"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-electric-blue hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/10 cursor-pointer disabled:cursor-not-allowed"
            >
              Browse {multiple ? 'Files' : 'File'}
            </button>
          </div>

          <p className="text-[11px] text-gray-500">
            Maximum file size: {maxSizeMB} MB per file • Processed securely in-memory and discarded
          </p>
        </div>
      </div>

      {/* Validation warning */}
      {validationError && (
        <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg flex items-start gap-2.5 text-xs text-amber-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Selected Files Queue */}
      {files.length > 0 && (
        <div className="bg-navy-800/60 border border-navy-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-navy-800/90 border-b border-navy-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-electric-blue" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Selected Files Queue ({files.length})
              </span>
              <span className="text-xs text-gray-400">• Total: {formatFileSize(totalBytes)}</span>
            </div>
            <button
              type="button"
              onClick={clearAllFiles}
              className="text-xs text-gray-400 hover:text-rose-400 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear all
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-navy-700/50">
            {files.map((file, idx) => (
              <div
                key={`${file.name}-${file.size}-${idx}`}
                className="px-4 py-2.5 flex items-center justify-between text-sm hover:bg-navy-700/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-gray-200 font-medium truncate text-xs sm:text-sm">{file.name}</p>
                    <p className="text-[11px] text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="p-1 text-gray-400 hover:text-rose-400 rounded transition-colors shrink-0"
                  title="Remove file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
