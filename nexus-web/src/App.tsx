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

  const {
    apps, users, status, vpnActive, shieldLogs, actions,
    pairingData, connectData, executeCommand
  } = useNativeBridge();

  const handleAppAction = (action: string, pkg: string, userId: number) => {
    if ((window as any).AndroidNative) {
      (window as any).AndroidNative.executeCommand(action, pkg, userId);
    }
  };

  const renderPurgeContent = () => {
    const isReady = status === 'Shell Active';
    const isHandshaking = status === 'Connected';

    if (isReady) {
      return (
        <PurgeView
          allApps={apps}
          users={users}
          onDisconnect={actions.disconnect}
          onAction={handleAppAction}
          onTrimCaches={() => executeCommand('trim-caches')}
        />
      );
    }

    if (isHandshaking) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <Loader2 size={48} className="text-accent animate-spin" />
          {/* Note: animate-spin kept for the loader, remove if you want it static */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-body">Establishing Shell</h2>
            <p className="text-muted">Retrieving package list...</p>
          </div>
        </div>
      );
    }

    return (
<ConnectionView
    status={status}
    actions={actions} // <--- Don't forget this!
    onPair={actions.pair}
    onConnect={actions.connect}
    onRetrieve={actions.retrieve}
    pairingData={pairingData}
    connectData={connectData}
/>
    );
  };

  return (
    <div className="flex flex-col h-screen w-full bg-main text-body font-sans select-none overflow-hidden relative">

      {/* TOP NAVBAR (Fixed height, removed calc and transitions) */}
      <header className="fixed top-0 left-0 right-0 z-40 w-full h-14
        bg-card border-b border-border
        pt-[env(safe-area-inset-top)]
        flex items-center justify-between px-4"
      >
        <div className="flex items-center gap-2 h-full shrink-0">
           <button
             onClick={toggleTheme}
             className="p-1.5 rounded-full bg-transparent hover:bg-input text-muted"
           >
             {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
           </button>
           <span className="font-bold text-base tracking-tight text-body">Nexus<span className="text-accent">Security</span></span>
        </div>

        <div className="text-[10px] font-mono text-muted shrink-0">
          {status === 'Shell Active' ? <span className="text-safe">● ONLINE</span> : <span>○ {status}</span>}
        </div>
      </header>

      {/* MAIN CONTENT (Static padding to prevent height collapse) */}
      <main className="flex-1 overflow-y-auto pt-20 pb-20">
        <div className="px-4">
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

      {/* BOTTOM NAVBAR (Fixed height, removed calc and transitions) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 w-full h-16
        bg-card border-t border-border
        pb-[env(safe-area-inset-bottom)]
        flex items-center justify-around"
      >
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
    className={`
      flex flex-col items-center justify-center gap-0.5 w-16 shrink-0
      ${active ? 'text-accent' : 'text-muted'}
    `}
  >
    <Icon
      size={20}
      strokeWidth={active ? 2.5 : 2}
    />
    <span className="text-[9px] font-medium tracking-wide uppercase">{label}</span>
  </button>
);