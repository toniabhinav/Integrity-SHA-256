import { useState, useEffect } from 'react';
import type {
  NavigationTab,
  BackendStatus,
  BaselineManifest,
  BatchScanSession,
  SessionStats,
} from './types';
import { AppLayout } from './components/AppLayout';
import { OverviewView } from './views/OverviewView';
import { SingleFileView } from './views/SingleFileView';
import { BatchScannerView } from './views/BatchScannerView';
import { ReferenceManagerView } from './views/ReferenceManagerView';
import { LearnView } from './views/LearnView';
import { validateManifestObject } from './utils/manifestValidator';

const STORAGE_KEY_BASELINE = 'securefile_active_baseline';
const STORAGE_KEY_BASELINE_NAME = 'securefile_active_baseline_name';

export function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking');
  
  // Initialize active baseline from localStorage if available
  const [activeBaseline, setActiveBaseline] = useState<BaselineManifest | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_BASELINE);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      const validation = validateManifestObject(parsed);
      if (validation.isValid && validation.manifest) {
        return validation.manifest;
      }
    } catch {
      // Ignore parse errors on corrupted storage
    }
    return null;
  });

  const [baselineName, setBaselineName] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_BASELINE_NAME);
    } catch {
      return null;
    }
  });

  const [lastSession, setLastSession] = useState<BatchScanSession | null>(null);

  // Cumulative session metrics
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalScans: 0,
    totalFilesProcessed: 0,
    unchangedTotal: 0,
    modifiedTotal: 0,
    newTotal: 0,
    missingTotal: 0,
  });

  const API_URL = '/api';

  // Check backend health on mount and periodically every 15 seconds
  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const response = await fetch(`${API_URL}/health`);
        if (!isMounted) return;
        if (response.ok) {
          const data = await response.json().catch(() => null);
          if (data && data.status === 'ok' && data.service === 'SecureFile Backend') {
            const hasBatchFeature = Array.isArray(data.features) && data.features.includes('batch-hash');
            if (hasBatchFeature) {
              setBackendStatus('online');
              return;
            } else {
              console.warn(
                '[SecureFile] Backend is running, but missing batch-hash feature. Please run "npm run dev:stop" and "npm start" in backend.'
              );
            }
          }
        }
        setBackendStatus('offline');
      } catch {
        if (!isMounted) return;
        setBackendStatus('offline');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [API_URL]);

  // Handler for setting a new active baseline (with localStorage persistence)
  const handleSetBaseline = (manifest: BaselineManifest, name: string) => {
    setActiveBaseline(manifest);
    setBaselineName(name);
    try {
      localStorage.setItem(STORAGE_KEY_BASELINE, JSON.stringify(manifest));
      localStorage.setItem(STORAGE_KEY_BASELINE_NAME, name);
    } catch (e) {
      console.warn('Failed to persist baseline to localStorage:', e);
    }
  };

  // Handler for clearing active baseline
  const handleClearBaseline = () => {
    setActiveBaseline(null);
    setBaselineName(null);
    try {
      localStorage.removeItem(STORAGE_KEY_BASELINE);
      localStorage.removeItem(STORAGE_KEY_BASELINE_NAME);
    } catch (e) {
      console.warn('Failed to clear baseline from localStorage:', e);
    }
  };

  // Handler for recording a new batch scan session
  const handleRecordSession = (session: BatchScanSession) => {
    setLastSession(session);
    setSessionStats((prev) => ({
      totalScans: prev.totalScans + 1,
      totalFilesProcessed: prev.totalFilesProcessed + session.totalScanned,
      unchangedTotal: prev.unchangedTotal + session.unchangedCount,
      modifiedTotal: prev.modifiedTotal + session.modifiedCount,
      newTotal: prev.newTotal + session.newCount,
      missingTotal: prev.missingTotal + session.missingCount,
    }));
  };

  return (
    <AppLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      backendStatus={backendStatus}
      activeBaselineCount={activeBaseline?.files.length}
    >
      {activeTab === 'overview' && (
        <OverviewView
          onNavigate={setActiveTab}
          activeBaseline={activeBaseline}
          baselineName={baselineName}
          lastSession={lastSession}
          sessionStats={sessionStats}
        />
      )}

      {activeTab === 'single' && <SingleFileView />}

      {activeTab === 'batch' && (
        <BatchScannerView
          activeBaseline={activeBaseline}
          baselineName={baselineName}
          onSetBaseline={handleSetBaseline}
          onNavigate={setActiveTab}
          onRecordSession={handleRecordSession}
        />
      )}

      {activeTab === 'reference' && (
        <ReferenceManagerView
          activeBaseline={activeBaseline}
          baselineName={baselineName}
          onSetBaseline={handleSetBaseline}
          onClearBaseline={handleClearBaseline}
          onNavigate={setActiveTab}
        />
      )}

      {activeTab === 'learn' && <LearnView />}
    </AppLayout>
  );
}

export default App;
