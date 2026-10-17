export type NavigationTab = 'overview' | 'single' | 'batch' | 'reference' | 'learn';

export type BackendStatus = 'checking' | 'online' | 'offline';

export type ScanItemStatus = 'UNCHANGED' | 'MODIFIED' | 'NEW' | 'MISSING';

export interface SingleFileHashResult {
  filename: string;
  size: number;
  hash: string;
  algorithm: string;
}

export interface SingleFileReference {
  filename: string;
  hash: string;
}

export interface ManifestFileEntry {
  path: string;
  size: number;
  sha256: string;
}

export interface BaselineManifest {
  manifestVersion: number;
  algorithm: 'SHA-256' | string;
  createdAt: string;
  files: ManifestFileEntry[];
  description?: string;
}

export interface ScanResultItem {
  id: string;
  path: string;
  size: number;
  baselineHash?: string;
  currentHash?: string;
  status: ScanItemStatus;
  details?: string;
}

export interface BatchScanSession {
  id: string;
  timestamp: string;
  baselineName: string;
  totalScanned: number;
  unchangedCount: number;
  modifiedCount: number;
  newCount: number;
  missingCount: number;
  results: ScanResultItem[];
}

export interface SessionStats {
  totalScans: number;
  totalFilesProcessed: number;
  unchangedTotal: number;
  modifiedTotal: number;
  newTotal: number;
  missingTotal: number;
}
