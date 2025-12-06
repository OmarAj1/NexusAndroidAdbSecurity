import React, { useState } from 'react';
import { Shield, Zap, FileText, User } from 'lucide-react';
import { useNativeBridge } from './hooks/useNativeBridge';

// Views
import { PurgeView } from './features/purge/PurgeView';
import { ConnectionView } from './features/connection/ConnectionView';
import { ShieldView } from './features/shield/ShieldView';
import { HistoryView } from './features/history/HistoryView';
import { LoginView } from './features/auth/LoginView';

export default function App() {
  const [activeTab, setActiveTab] = useState('shield');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('admin');

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
    const isConnected = status === 'Shell Active' || status === 'Connected';

    if (!isConnected) {
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
    }
    return (
      <PurgeView
        allApps={apps}
        users={users}
        onDisconnect={actions.disconnect}
        onAction={handleAppAction}
      />
    );
  };

  // --- RENDER ---

  // 1. Full Screen Login
  if (!isLoggedIn) {
    return <LoginView onLogin={(user) => { setUsername(user); setIsLoggedIn(true); }} />;
  }

  // 2. Main App Shell
  return (
    <div className="flex flex-col h-full w-full bg-void text-slate-200 font-sans select-none overflow-hidden">

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

          {/* Simple User/Profile View directly inline for performance */}
          {activeTab === 'user' && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
               <div className="w-24 h-24 rounded-full bg-surface border-2 border-accent/20 flex items-center justify-center">
                  <User size={40} className="text-accent" />
               </div>
               <div>
                 <h2 className="text-2xl font-bold text-white">Hi, {username}</h2>
                 <p className="text-slate-500 text-sm mt-1">System Administrator</p>
               </div>
               <button
                 onClick={() => setIsLoggedIn(false)}
                 className="px-6 py-3 rounded-xl bg-surface border border-white/5 text-danger font-medium active:scale-95 transition-transform"
               >
                 Log Out
               </button>
            </div>
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
        <NavButton
          active={activeTab === 'user'}
          onClick={() => setActiveTab('user')}
          icon={User}
          label="User"
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