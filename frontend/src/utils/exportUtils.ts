import type { ScanResultItem, BaselineManifest } from '../types';

/**
 * Escapes a field for safe CSV output per RFC 4180
 */
const escapeCsvField = (field: unknown): string => {
  if (field === null || field === undefined) return '""';
  const str = String(field);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
};

/**
 * Export scan results to CSV file with proper RFC 4180 escaping
 */
export const exportResultsToCsv = (
  results: ScanResultItem[],
  metadata?: { timestamp?: string; baselineName?: string }
): void => {
  const scanTime = metadata?.timestamp || new Date().toISOString();
  const baselineLabel = metadata?.baselineName || 'Active Baseline';

  const headers = [
    'File Path',
    'Size (Bytes)',
    'Status',
    'Baseline SHA-256',
    'Current SHA-256',
    'Scan Timestamp',
    'Baseline Manifest',
    'Details'
  ];

  const rows = results.map((item) => [
    escapeCsvField(item.path),
    escapeCsvField(item.size),
    escapeCsvField(item.status),
    escapeCsvField(item.baselineHash || 'N/A'),
    escapeCsvField(item.currentHash || 'N/A'),
    escapeCsvField(scanTime),
    escapeCsvField(baselineLabel),
    escapeCsvField(item.details || '')
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `securefile-scan-${formatFilenameDate(scanTime)}.csv`);
};

/**
 * Export scan results to formatted JSON report
 */
export const exportResultsToJson = (
  results: ScanResultItem[],
  metadata?: { timestamp?: string; baselineName?: string }
): void => {
  const scanTime = metadata?.timestamp || new Date().toISOString();
  const report = {
    reportType: 'SecureFile Integrity Scan Report',
    algorithm: 'SHA-256',
    generatedAt: scanTime,
    baseline: metadata?.baselineName || 'Active Baseline',
    summary: {
      totalItems: results.length,
      unchanged: results.filter((r) => r.status === 'UNCHANGED').length,
      modified: results.filter((r) => r.status === 'MODIFIED').length,
      newFiles: results.filter((r) => r.status === 'NEW').length,
      missing: results.filter((r) => r.status === 'MISSING').length,
    },
    results: results.map((r) => ({
      path: r.path,
      size: r.size,
      status: r.status,
      baselineHash: r.baselineHash || null,
      currentHash: r.currentHash || null,
      details: r.details || null,
    })),
  };

  const jsonContent = JSON.stringify(report, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  triggerDownload(blob, `securefile-scan-${formatFilenameDate(scanTime)}.json`);
};

/**
 * Download a Baseline Manifest JSON file
 */
export const downloadManifestJson = (
  manifest: BaselineManifest,
  suggestedName?: string
): void => {
  const jsonContent = JSON.stringify(manifest, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const filename = suggestedName || `baseline-manifest-${formatFilenameDate(manifest.createdAt)}.json`;
  triggerDownload(blob, filename);
};

const formatFilenameDate = (isoString?: string): string => {
  try {
    const d = isoString ? new Date(isoString) : new Date();
    return d.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  } catch {
    return 'export';
  }
};

const triggerDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
