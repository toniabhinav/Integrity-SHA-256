import React from 'react';
import {
  Shield,
  Layers,
  FileCheck,
  FolderGit2,
  BookOpen,
  RefreshCw,
  HardDrive,
} from 'lucide-react';
import type { NavigationTab, BackendStatus } from '../types';

interface AppLayoutProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  backendStatus: BackendStatus;
  activeBaselineCount?: number;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  onTabChange,
  backendStatus,
  activeBaselineCount = 0,
  children,
}) => {
  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'overview', label: 'Overview', icon: <Layers className="w-4 h-4" /> },
    { id: 'single', label: 'Single File', icon: <FileCheck className="w-4 h-4" /> },
    {
      id: 'batch',
      label: 'Batch Scanner',
      icon: <HardDrive className="w-4 h-4" />,
      badge: activeBaselineCount > 0 ? `${activeBaselineCount}` : undefined,
    },
    { id: 'reference', label: 'Reference Manager', icon: <FolderGit2 className="w-4 h-4" /> },
    { id: 'learn', label: 'Learn INS', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-navy-900 text-gray-100 flex flex-col selection:bg-electric-blue selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-navy-700 bg-navy-900/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => onTabChange('overview')}
            >
              <div className="p-2 bg-electric-blue/10 border border-electric-blue/30 rounded-lg group-hover:bg-electric-blue/20 transition-colors">
                <Shield className="w-6 h-6 text-electric-blue" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-white tracking-tight">SecureFile</h1>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-electric-blue/20 text-electric-blue border border-electric-blue/30">
                    FIM v2.0
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 font-medium">Batch File Integrity Monitoring</p>
              </div>
            </div>

            {/* Right Meta Info & Backend Status */}
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="hidden sm:inline-flex px-2.5 py-1 text-xs font-semibold bg-navy-800 text-electric-blue rounded-md border border-navy-700 font-mono">
                SHA-256
              </span>

              {/* Backend status badge */}
              {backendStatus === 'checking' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-navy-800 border border-navy-700 text-xs text-gray-400">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-electric-blue" />
                  <span className="hidden sm:inline">Checking Backend...</span>
                </div>
              )}
              {backendStatus === 'online' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-400">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="hidden sm:inline font-medium">Service Online</span>
                </div>
              )}
              {backendStatus === 'offline' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-950/40 border border-rose-800/60 text-xs text-rose-400">
                  <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                  <span className="hidden sm:inline font-medium">Backend Offline</span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <nav className="flex space-x-1 sm:space-x-2 border-t border-navy-800/80 overflow-x-auto py-2 scrollbar-none">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-electric-blue text-white shadow-md shadow-blue-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-navy-800'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-white text-blue-700' : 'bg-navy-700 text-gray-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-navy-800 bg-navy-900/60 py-6 text-xs text-gray-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="font-medium text-gray-400">
              SecureFile — File Integrity Monitoring System
            </p>
            <p className="text-[11px] text-gray-600 mt-0.5">
              Information and Network Security (INS) • SHA-256 Collision-Resistant Cryptographic Verification
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-gray-500">
            <span>In-Memory Processing</span>
            <span>•</span>
            <span>Deterministic Hashing</span>
            <span>•</span>
            <span>RFC 4180 CSV Export</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
