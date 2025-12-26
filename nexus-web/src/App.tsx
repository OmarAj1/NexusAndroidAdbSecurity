import React, { useState, useEffect, Suspense } from 'react';
import { Shield, Zap, Wrench, Loader2, Moon, Sun, Map as MapIcon } from 'lucide-react';

// Hooks & UI
import { useNativeBridge } from './hooks/useNativeBridge';
import { AtmosphericBackground, ThemeConfig } from './components/ui/AtmosphericBackground';

// Views
import { PurgeView } from './features/purge/PurgeView';
import { ConnectionView } from './features/connection/ConnectionView';
import { ShieldView } from './features/shield/ShieldView';
import { ToolsView } from './features/tools/ToolsView';

// LAZY LOAD: MapView
const MapView = React.lazy(() =>
  import('./features/map/MapView').then(module => ({ default: module.MapView }))
);

const THEMES: Record<string, ThemeConfig> = {
  dark: { accentColor: '#6366f1', darkColor: '#1e1b4b', bgColor: '#020617', particles: [] },
  light: { accentColor: '#4f46e5', darkColor: '#e0e7ff', bgColor: '#fdfbf7', particles: [] }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('shield');

  const [themeMode, setThemeMode] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('theme') || 'dark';
    return 'dark';
  });

  const {
    apps, users, status, vpnActive, shieldLogs, actions,
    pairingData, connectData, executeCommand
  } = useNativeBridge();

  useEffect(() => {
    const root = window.document.documentElement;
    if (themeMode === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', themeMode);
  }, [themeMode]);

  const toggleTheme = () => setThemeMode(prev => prev === 'dark' ? 'light' : 'dark');

  const handleAppAction = (action: string, pkg: string, userId: number) => {
    if ((window as any).AndroidNative) {
      (window as any).AndroidNative.executeCommand(action, pkg, userId);
    }
  };

  const renderPurgeContent = () => {
    const isReady = status === 'Shell Active';
    const isHandshaking = status === 'Connected';

    if (isReady) {
      // PurgeView is self-contained and handles its own height now
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
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <Loader2 size={48} className="text-accent animate-spin" />
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
        actions={actions}
        onPair={actions.pair}
        onConnect={actions.connect}
        onRetrieve={actions.retrieve}
        pairingData={pairingData}
        connectData={connectData}
      />
    );
  };

  const currentThemeConfig = THEMES[themeMode] || THEMES.dark;

  return (
    <div className="flex flex-col h-screen w-full bg-main text-body font-sans select-none overflow-hidden relative">

      <AtmosphericBackground theme={currentThemeConfig} />

      {/* TOP NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-40 w-full h-14 bg-card border-b border-border pt-[env(safe-area-inset-top)] flex items-center justify-between px-4">
        <div className="flex items-center gap-2 h-full shrink-0">
          <button onClick={toggleTheme} className="p-1.5 rounded-full bg-transparent hover:bg-input text-muted">
            {themeMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <span className="font-bold text-base tracking-tight text-body">Nexus<span className="text-accent">Security</span></span>
        </div>
        <div className="text-[10px] font-mono text-muted shrink-0">
          {status === 'Shell Active' ? <span className="text-safe">● ONLINE</span> : <span>○ {status}</span>}
        </div>
      </header>

      {/* MAIN CONTENT AREA - FIXED LAYOUT */}
      {/* FIX 1: Removed 'overflow-y-auto'. We use 'overflow-hidden' so the inner views
         (like PurgeView or ShieldView) control their own scrolling.
      */}
      <main className={`flex-1 relative z-10 overflow-hidden ${activeTab === 'map' ? 'pt-14 pb-0' : 'pt-14 pb-16'}`}>

        {/* FIX 2: Added 'h-full'. This passes the height down to the children.
           Without this, PurgeView thinks it has 0 height.
        */}
        <div className={`h-full w-full ${activeTab === 'map' ? '' : 'px-4 py-4'}`}>

          {activeTab === 'shield' && (
            <div className="h-full overflow-y-auto"> {/* Shield needs its own scroll now */}
              <ShieldView
                isActive={vpnActive}
                onToggle={actions.toggleVpn}
                logs={shieldLogs}
              />
            </div>
          )}

          {activeTab === 'purge' && (
            <div className="h-full w-full"> {/* Wrapper for PurgeView */}
               {renderPurgeContent()}
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="h-full overflow-y-auto"> {/* Tools needs its own scroll */}
              <ToolsView
                executeCommand={executeCommand}
                onNavigate={setActiveTab}
              />
            </div>
          )}

          {activeTab === 'map' && (
            <Suspense fallback={
              <div className="h-full w-full flex items-center justify-center">
                <Loader2 size={32} className="text-accent animate-spin" />
              </div>
            }>
              <MapView />
            </Suspense>
          )}
        </div>
      </main>

      {/* BOTTOM NAVBAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 w-full h-16 bg-card border-t border-border pb-[env(safe-area-inset-bottom)] flex items-center justify-around">
        <NavButton active={activeTab === 'shield'} onClick={() => setActiveTab('shield')} icon={Shield} label="Shield" />
        <NavButton active={activeTab === 'purge'} onClick={() => setActiveTab('purge')} icon={Zap} label="Purge" />
        <NavButton active={activeTab === 'tools'} onClick={() => setActiveTab('tools')} icon={Wrench} label="Tools" />
        <NavButton active={activeTab === 'map'} onClick={() => setActiveTab('map')} icon={MapIcon} label="Map" />
      </nav>
    </div>
  );
}

const NavButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-0.5 w-14 shrink-0 ${active ? 'text-accent' : 'text-muted'}`}
  >
    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[9px] font-medium tracking-wide uppercase">{label}</span>
  </button>
);