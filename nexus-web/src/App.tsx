import React, { useState, useEffect } from 'react';
import { Shield, Zap, Wrench, Loader2, Moon, Sun } from 'lucide-react';
import { useNativeBridge } from './hooks/useNativeBridge';

// Views
import { PurgeView } from './features/purge/PurgeView';
import { ConnectionView } from './features/connection/ConnectionView';
import { ShieldView } from './features/shield/ShieldView';
import { ToolsView } from './features/tools/ToolsView';

export default function App() {
  const [activeTab, setActiveTab] = useState('shield');

  // Theme State
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // --- HOOK INTEGRATION ---
  // We destructure everything from a SINGLE call to prevent state conflicts.
  // Note: We expect 'executeCommand' to be returned here. (See step 2 below if you get an error)
  const {
    apps, users, status, vpnActive, shieldLogs, actions,
    pairingData, connectData, executeCommand
  } = useNativeBridge();

  const handleAppAction = (action: string, pkg: string, userId: number) => {
    // If the hook provides a specific action handler, use it.
    // Otherwise, we fallback to the raw bridge for app-specific actions.
    if ((window as any).AndroidNative) {
      (window as any).AndroidNative.executeCommand(action, pkg, userId);
    } else {
      console.warn("Native bridge not found. Action:", action, pkg);
    }
  };

  const renderPurgeContent = () => {
    // 'Shell Active' means we are fully ready.
    const isReady = status === 'Shell Active';
    // 'Connected' usually means ADB is linked but we are fetching packages.
    const isHandshaking = status === 'Connected';

    if (isReady) {
      return (
        <PurgeView
          allApps={apps}
          users={users}
          onDisconnect={actions.disconnect}
          onAction={handleAppAction}
        />
      );
    }

    if (isHandshaking) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 animate-in fade-in">
          <Loader2 size={48} className="text-accent animate-spin" />
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Establishing Shell</h2>
            <p className="text-slate-500">Retrieving package list...</p>
          </div>
        </div>
      );
    }

    return (
      <ConnectionView
        status={status}
        onPair={actions.pair}
        onConnect={actions.connect}
        onRetrieve={actions.retrieve}
        pairingData={pairingData}
        connectData={connectData}
      />
    );
  };

  // --- RENDER ---
  return (
    <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-void text-slate-900 dark:text-slate-200 font-sans select-none overflow-hidden relative transition-colors duration-300">

      {/* TOP NAVBAR (FIXED) */}
      <header className="fixed top-0 left-0 right-0 h-auto min-h-[80px] pb-3 px-4 flex items-center justify-between bg-white/80 dark:bg-void/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 z-40 transition-colors duration-300">
        <div className="flex items-center gap-2 mt-1">
           <button
             onClick={toggleTheme}
             className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all"
           >
             {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
           </button>
           <span className="font-bold text-lg tracking-tight">Nexus<span className="text-accent">Security</span></span>
        </div>

        <div className="text-xs font-mono text-slate-400 mt-1">
          {status === 'Shell Active' ? <span className="text-green-500">● ONLINE</span> : <span>○ {status}</span>}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto pt-24 pb-24 px-4 scroll-smooth">
        <div className="animate-in fade-in duration-300 slide-in-from-bottom-2">
          {activeTab === 'shield' && (
            <ShieldView
              isActive={vpnActive}
              onToggle={actions.toggleVpn}
              logs={shieldLogs}
            />
          )}

          {activeTab === 'purge' && renderPurgeContent()}

          {activeTab === 'tools' && (
            <ToolsView executeCommand={executeCommand} />
          )}
        </div>
      </main>

      {/* BOTTOM NAVBAR (FIXED) */}
      <nav className="fixed bottom-0 left-0 right-0 h-auto pt-4 pb-4 bg-white/95 dark:bg-void/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/5 flex items-start justify-around z-50 transition-colors duration-300">
        <NavButton
          active={activeTab === 'shield'}
          onClick={() => setActiveTab('shield')}
          icon={Shield}
          label="Shield"
        />
        <NavButton
          active={activeTab === 'purge'}
          onClick={() => setActiveTab('purge')}
          icon={Zap}
          label="Purge"
        />
        <NavButton
          active={activeTab === 'tools'}
          onClick={() => setActiveTab('tools')}
          icon={Wrench}
          label="Tools"
        />
      </nav>

    </div>
  );
}

const NavButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1.5 w-16 mb-2 transition-all duration-200 active:scale-90 ${active ? 'text-accent' : 'text-slate-400 dark:text-slate-600'}`}
  >
    <Icon
      size={26}
      strokeWidth={active ? 2.5 : 2}
      className={active ? 'drop-shadow-[0_0_12px_rgba(139,92,246,0.6)]' : ''}
    />
    <span className="text-[10px] font-medium tracking-wide">{label}</span>
  </button>
);