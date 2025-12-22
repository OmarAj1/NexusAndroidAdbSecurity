import React, { useState } from 'react';
import { Shield, Zap, FileText, Loader2 } from 'lucide-react';
import { useNativeBridge } from './hooks/useNativeBridge';

// Views
import { PurgeView } from './features/purge/PurgeView';
import { ConnectionView } from './features/connection/ConnectionView';
import { ShieldView } from './features/shield/ShieldView';
import { HistoryView } from './features/history/HistoryView';

export default function App() {
  const [activeTab, setActiveTab] = useState('shield');

  // Hook into the native Android bridge
  const {
    apps, users, status, vpnActive, history, actions,
    pairingData, connectData
  } = useNativeBridge();

  // Handle Apps Logic
  const handleAppAction = (action: string, pkg: string, userId: number) => {
    if ((window as any).AndroidNative) {
      (window as any).AndroidNative.executeCommand(action, pkg, userId);
    } else {
      console.warn("Native bridge not found. Action:", action, pkg);
    }
  };

  const renderPurgeContent = () => {
    // STRICT CHECK: Only show App Manager if Shell is fully active.
    const isReady = status === 'Shell Active';
    const isHandshaking = status === 'Connected';

    // 1. If fully ready (Root/Shell Active), show the App Manager
    if (isReady) {
      return (
        <PurgeView
          allApps={apps}
          users={users}
          onDisconnect={actions.disconnect}
          onAction={handleAppAction}
          onTrimCaches={actions.trimCaches} // PASSED HERE
        />
      );
    }

    // 2. If connected but waiting for Shell/Data (Transitional State)
    if (isHandshaking) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 animate-in fade-in">
          <Loader2 size={48} className="text-accent animate-spin" />
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">Establishing Shell</h2>
            <p className="text-slate-500">Retrieving package list...</p>
          </div>
        </div>
      );
    }

    // 3. Otherwise, show Connection/Pairing View
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

  // Main App Shell
  return (
    <div className="flex flex-col h-full w-full bg-void text-slate-200 font-sans select-none overflow-hidden relative">

      {/* SCROLLABLE CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-4 pb-24 scroll-smooth">
        <div className="animate-in fade-in duration-300 slide-in-from-bottom-2">

          {activeTab === 'shield' && (
            <ShieldView isActive={vpnActive} onToggle={actions.toggleVpn} />
          )}

          {activeTab === 'purge' && renderPurgeContent()}

          {activeTab === 'history' && (
            <HistoryView history={history} onExport={actions.exportHistory} />
          )}

        </div>
      </main>

      {/* FIXED BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 h-[88px] bg-void/95 backdrop-blur-xl border-t border-white/5 flex items-start justify-around pt-4 z-50 pb-safe">
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
          active={activeTab === 'history'}
          onClick={() => setActiveTab('history')}
          icon={FileText}
          label="Logs"
        />
      </nav>

    </div>
  );
}

// Sub-component for clean code
const NavButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1.5 w-16 transition-all duration-200 active:scale-90 ${active ? 'text-accent' : 'text-slate-600'}`}
  >
    <Icon
      size={26}
      strokeWidth={active ? 2.5 : 2}
      className={active ? 'drop-shadow-[0_0_12px_rgba(139,92,246,0.6)]' : ''}
    />
    <span className="text-[10px] font-medium tracking-wide">{label}</span>
  </button>
);