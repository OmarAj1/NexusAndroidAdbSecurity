import React, { useState, useMemo, useEffect } from 'react';
import { LogOut, User as UserIcon, Moon, Sun } from 'lucide-react';

// Imports
import TabBar from './components/ui/TabBar';
import { GlassCard } from './components/ui/GlassCard';
import { NeonButton } from './components/ui/NeonButton';
import { AtmosphericBackground, ThemeConfig } from './components/ui/AtmosphericBackground';

import { PurgeView } from './features/purge/PurgeView';
import { ConnectionView } from './features/connection/ConnectionView';
import { ShieldView } from './features/shield/ShieldView';
import { HistoryView } from './features/history/HistoryView';
import { LoginView } from './features/auth/LoginView';

import { useNativeBridge } from './hooks/useNativeBridge';

export default function App() {
  const [activeTab, setActiveTab] = useState('purge');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('admin');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Hook into the native Android bridge
  const {
        apps, users, status, vpnActive, history, actions,
        pairingData, connectData
    } = useNativeBridge();

  const handleAppAction = (action: string, pkg: string, userId: number) => {
      if ((window as any).AndroidNative) {
          (window as any).AndroidNative.executeCommand(action, pkg, userId);
      } else {
          console.warn("Native bridge not found. Action:", action, pkg);
      }
  };

  // Sync background color with body via CSS variable
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--app-bg', isDarkMode ? '#0f172a' : '#fdfbf7');
  }, [isDarkMode]);


  // --- DYNAMIC THEME ENGINE ---
  const theme = useMemo<ThemeConfig>(() => {
    // 1. Dark Mode Base Colors
    if (isDarkMode) {
       const base = {
           bgColor: '#0f172a', // Slate 900
           darkColor: '#1e293b', // Slate 800
           accentColor: '#38bdf8', // Sky 400
           particles: []
       };
       if (activeTab === 'shield') return { ...base, accentColor: vpnActive ? '#4ade80' : '#f87171' };
       if (activeTab === 'history') return { ...base, accentColor: '#c084fc' };
       if (activeTab === 'user') return { ...base, accentColor: '#fbbf24' };
       return base;
    }

    // 2. Light Mode Base Colors (Cute/Pastel)
    const baseLight = {
        bgColor: '#fdfbf7', // Cream
        darkColor: '#cffafe', // Light Cyan
        accentColor: '#67e8f9', // Cyan
        particles: []
    };

    if (!isLoggedIn) return baseLight;

    if (activeTab === 'shield') {
      return vpnActive
        ? { ...baseLight, accentColor: '#86efac', darkColor: '#dcfce7' } // Mint Green
        : { ...baseLight, accentColor: '#fca5a5', darkColor: '#fee2e2' }; // Soft Red
    }

    if (activeTab === 'history') {
        return { ...baseLight, accentColor: '#d8b4fe', darkColor: '#f3e8ff' }; // Lavender
    }

    if (activeTab === 'user') {
       return { ...baseLight, accentColor: '#fcd34d', darkColor: '#fef3c7' }; // Pastel Yellow
    }

    return { ...baseLight, accentColor: '#93c5fd', darkColor: '#dbeafe' }; // Baby Blue (Purge)

  }, [activeTab, vpnActive, isLoggedIn, isDarkMode]);


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

  // Text color based on theme
  const textColor = isDarkMode ? "text-slate-100" : "text-slate-700";

  return (
    <div className={`relative w-full h-screen font-sans select-none overflow-hidden ${textColor} flex flex-col`}>

      {/* 1. Background Layer */}
      <AtmosphericBackground theme={theme} />

      {/* 2. Main Content Area */}
      <main className="relative z-10 flex flex-col flex-1 h-full overflow-hidden p-4 pb-24 md:p-6 md:pb-28">

        {!isLoggedIn ? (
           <LoginView onLogin={(user) => { setUsername(user); setIsLoggedIn(true); }} />
        ) : (
             <div
                key={activeTab}
                className="flex flex-col h-full overflow-hidden animate-in fade-in duration-500 slide-in-from-bottom-4"
             >
                {/* PURGE TAB */}
                {activeTab === 'purge' && renderPurgeContent()}

                {/* SHIELD TAB */}
                {activeTab === 'shield' && (
                  <ShieldView isActive={vpnActive} onToggle={actions.toggleVpn} />
                )}

                {/* HISTORY TAB - Wrapped for consistent margins */}
                {activeTab === 'history' && (
                   <div className="h-full w-full flex flex-col">
                      <HistoryView history={history} onExport={actions.exportHistory} />
                   </div>
                )}

                {/* USER TAB - Centered with margins like Shield page */}
                {activeTab === 'user' && (
                    <div className="flex-1 flex items-center justify-center p-4">
                        <div className="w-full max-w-md">
                            <GlassCard borderColor="amber" isDark={isDarkMode} className="flex flex-col items-center text-center space-y-6 py-10">

                                <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${isDarkMode ? 'bg-amber-900/30 border-amber-500/30' : 'bg-amber-100 border-amber-200'}`}>
                                    <UserIcon size={48} className="text-amber-400" />
                                </div>

                                <div>
                                    <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                        Hi, {username}! 👋
                                    </h2>
                                    <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'} font-medium mt-1`}>
                                        System Administrator
                                    </p>
                                </div>

                                {/* THEME TOGGLE */}
                                <div className={`flex items-center justify-between w-full p-4 rounded-2xl ${isDarkMode ? 'bg-black/20' : 'bg-slate-50'}`}>
                                    <div className="flex items-center space-x-3">
                                        {isDarkMode ? <Moon size={20} className="text-purple-400" /> : <Sun size={20} className="text-orange-400" />}
                                        <span className="font-medium text-sm">Appearance</span>
                                    </div>
                                    <button
                                        onClick={() => setIsDarkMode(!isDarkMode)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isDarkMode ? 'bg-purple-600' : 'bg-slate-300'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                <div className="w-full pt-4">
                                    <NeonButton onClick={() => setIsLoggedIn(false)} label="Log Out" icon={LogOut} color="gray" />
                                </div>
                            </GlassCard>
                        </div>
                    </div>
                )}
             </div>
        )}
      </main>

      {/* 3. Tab Bar */}
      {isLoggedIn && <TabBar active={activeTab} onChange={setActiveTab} />}
    </div>
  );
}