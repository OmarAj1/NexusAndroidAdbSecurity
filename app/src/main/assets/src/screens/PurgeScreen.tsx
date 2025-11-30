import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield, Trash2, Power, Wifi, Zap,
  Search, AlertTriangle, Filter, RotateCcw,
  ArrowRight, DownloadCloud, Smartphone
} from 'lucide-react';

import { useNexus } from '../context/NexusContext';
import { GlassCard, Badge, triggerHaptic, showToast } from '../components/Common';
import { AppData } from '../interfaces';

// Define the window interface to avoid TypeScript errors
declare global {
    interface Window {
        onPairingServiceFound: (ip: string, port: number | string) => void;
        onConnectServiceFound: (ip: string, port: number | string) => void;
        receiveAppList: (apps: any) => void;
        adbStatus: (status: string) => void;
    }
}

export default function PurgeScreen() {
  const {
    // State from Context
    apps, pairIp, setPairIp, pairPort, setPairPort, connectIp, connectPort, setConnectIp, setConnectPort,
    code, setCode, status, setStatus,

    // Handlers from Context
    handleRetrieve, handlePair, handleConnect, confirmAppAction
  } = useNexus();

  // Local UI State
  const [filterType, setFilterType] = useState('All');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<AppData | null>(null);
  const [actionType, setActionType] = useState<'uninstall' | 'disable' | 'restore' | 'enable' | null>(null);

  // --- CRITICAL FIX: Ensure window callbacks update React state ---
  useEffect(() => {
      // Callback for Pairing Service (mDNS or Clipboard)
      window.onPairingServiceFound = (ip: string, port: number | string) => {
          console.log("Received Pair Info:", ip, port);
          // Ensure we update state even if it's a number
          setPairIp(ip);
          setPairPort(port.toString());
          setStatus('Pairing Info Found');
          triggerHaptic('success');
      };

      // Callback for Connect Service (mDNS)
      window.onConnectServiceFound = (ip: string, port: number | string) => {
          console.log("Received Connect Info:", ip, port);
          setConnectIp(ip);
          setConnectPort(port.toString());
          setStatus('Ready to Connect');
          triggerHaptic('success');
      };

      // Callback for connection status updates from Java
      window.adbStatus = (newStatus: string) => {
          if (newStatus === 'Connected') {
              setStatus('Shell Active');
              triggerHaptic('success');
          }
      };

      // Cleanup
      return () => {
          // Ideally we'd remove them, but for this specific bridge it's okay to overwrite
      };
  }, [setPairIp, setPairPort, setConnectIp, setConnectPort, setStatus]);


  // Filtered Apps Logic
  const filteredApps = useMemo(() => {
    let result = apps;
    if (filterType !== 'All') {
      if (filterType === 'Disabled') result = result.filter(a => a.status === 'Disabled');
      else if (filterType === 'Enabled') result = result.filter(a => a.status === 'Enabled');
      else result = result.filter(a => a.type === filterType);
    }
    const lower = search.toLowerCase();
    return result.filter(a => a.name.toLowerCase().includes(lower) || a.pkg.toLowerCase().includes(lower));
  }, [apps, filterType, search]);

  const openModal = (app: AppData, action: 'uninstall' | 'disable' | 'restore' | 'enable') => {
    setSelectedApp(app);
    setActionType(action);
    setModalOpen(true);
    triggerHaptic('light');
  };

  const handleConfirmAction = () => {
    if (selectedApp && actionType) {
      confirmAppAction(actionType, selectedApp.pkg);
      setModalOpen(false);
      setSelectedApp(null);
    }
  };

  const AppRow = ({ app }: { app: AppData }) => {
      const iconSrc = app.iconBase64 ? `data:image/png;base64,${app.iconBase64}` : null;

      return (
          <div key={app.pkg} className="bg-[#1e293b]/40 border border-white/[0.05] rounded-lg p-3 hover:bg-[#1e293b]/60 transition-colors group">
              <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center overflow-hidden">
                      {iconSrc ? (
                          <img
                              src={iconSrc}
                              alt={`${app.name} icon`}
                              className="w-8 h-8 rounded-md mr-3 shrink-0 bg-transparent"
                              onError={(e:any) => e.target.style.display = 'none'}
                          />
                      ) : (
                          <div className="w-8 h-8 rounded-md mr-3 shrink-0 bg-gray-600/50 flex items-center justify-center">
                              <Smartphone size={16} className="text-gray-400" />
                          </div>
                      )}

                      <div className="overflow-hidden pr-2">
                          <h3 className="font-semibold text-white text-sm truncate">{app.name}</h3>
                          <p className="text-[10px] text-gray-500 font-mono truncate">{app.pkg}</p>
                      </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge text={app.type} />
                      <Badge text={app.status} />
                  </div>
              </div>

              <div className="flex gap-2 mt-2 pt-2 border-t border-white/5 justify-end">
                  {app.status === 'Disabled' ? (
                      <button onClick={() => openModal(app, 'enable')} className="p-1.5 bg-green-500/10 text-green-400 rounded hover:bg-green-500/20" title="Enable">
                          <Zap size={14}/>
                      </button>
                  ) : (
                      <button onClick={() => openModal(app, 'disable')} className="p-1.5 bg-amber-500/10 text-amber-400 rounded hover:bg-amber-500/20" title="Disable">
                          <Power size={14}/>
                      </button>
                  )}
                  <button onClick={() => openModal(app, 'uninstall')} className="p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20" title="Uninstall">
                      <Trash2 size={14}/>
                  </button>
                  <button onClick={() => openModal(app, 'restore')} className="p-1.5 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20" title="Restore">
                      <RotateCcw size={14} />
                  </button>
              </div>
          </div>
      );
  }


  const renderConnection = () => (
    <div className="flex flex-col h-full justify-center space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto ring-2 ring-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.2)]">
            <Wifi size={40} className="text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Universal Android Debloater</h2>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">
             1. Enable <b>Wireless Debugging</b>.<br/>
             2. Tap <b>Pair with Code</b>.<br/>
             3. Fill info & Connect.
          </p>
      </div>

      <GlassCard className="space-y-4" borderColor="cyan">
        <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <span className="text-xs font-mono text-gray-400">STATUS</span>
            <span className={`text-xs font-bold ${status.includes('Found') || status.includes('Ready') || status.includes('Active') ? 'text-green-400' : 'text-amber-400'}`}>
                {status.toUpperCase()}
            </span>
        </div>

        {/* --- MANUAL RETRIEVAL SECTION --- */}
        <div className="space-y-2">
            <label className="text-xs text-gray-500 font-bold uppercase">Manual Info</label>
            <div className="flex gap-2">
                <input
                    value={pairIp}
                    onChange={e=>setPairIp(e.target.value)}
                    placeholder="IP Address"
                    className="flex-1 bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-cyan-500 outline-none font-mono"
                />
                <input
                    value={pairPort}
                    onChange={e=>setPairPort(e.target.value)}
                    placeholder="Port"
                    className="w-20 bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-cyan-500 outline-none font-mono text-center"
                />
            </div>

            {/* RETRIEVE BUTTON - Triggers native call */}
            <button
                onClick={() => {
                    handleRetrieve();
                    // Fallback visual feedback
                    triggerHaptic('light');
                }}
                className="w-full bg-white/5 hover:bg-cyan-500/20 text-cyan-400 p-2 rounded-lg border border-white/10 flex items-center justify-center gap-2 transition-all font-bold text-xs uppercase tracking-wider"
            >
                <DownloadCloud size={16} />
                Retrieve IP & Port
            </button>
        </div>

        {/* Pairing Code Section */}
        <div className="space-y-2">
            <input
                value={code}
                onChange={e=>setCode(e.target.value)}
                placeholder="PAIRING CODE"
                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-center tracking-[0.5em] font-mono focus:border-cyan-500 outline-none transition-colors placeholder:tracking-normal"
                maxLength={6}
                inputMode="numeric"
            />

            <button
                onClick={handlePair}
                disabled={!pairIp || !pairPort || !code}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-lg text-sm font-bold transition-all disabled:opacity-30 disabled:bg-gray-700 mt-2 flex items-center justify-center gap-2"
            >
                <Zap size={16} fill="currentColor"/> PAIR DEVICE
            </button>
        </div>

        {/* Connect Section */}
        <div className={`space-y-2 pt-2 transition-all duration-500 ${connectPort ? 'opacity-100' : 'opacity-60'}`}>
             <button
                onClick={handleConnect}
                disabled={!connectPort}
                className={`w-full p-3 rounded-lg font-bold text-white shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2
                    ${connectPort ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-white/10 text-gray-400'}`}
             >
                <ArrowRight size={16}/> {connectPort ? "CONNECT TO SHELL" : "Connect (Requires Port)"}
            </button>
        </div>
      </GlassCard>
    </div>
  );

  const renderAppManager = () => (
    <div className="flex flex-col h-full pt-2 animate-in slide-in-from-right-10 duration-300 min-h-screen">
      <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search packages..."
              className="w-full bg-[#1e293b] border border-white/10 rounded-lg py-2 pl-9 text-sm text-white focus:ring-1 focus:ring-cyan-500 outline-none"
            />
          </div>
          <button className="bg-[#1e293b] p-2 rounded-lg border border-white/10 text-gray-400" onClick={() => triggerHaptic('light')}>
             <Filter size={18} />
          </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
          <div className="w-24 flex flex-col gap-1 pr-2 border-r border-white/5 overflow-y-auto shrink-0">
             {['All', 'System', 'User', 'Enabled', 'Disabled'].map(f => (
                 <button
                   key={f}
                   onClick={() => { setFilterType(f); triggerHaptic('light'); }}
                   className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filterType === f ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/20' : 'text-gray-500 hover:bg-white/5'}`}
                 >
                     {f}
                 </button>
             ))}
             <div className="mt-auto pt-4 pb-2 text-[10px] text-gray-600 font-mono text-center">
                 {apps.length} APPS
             </div>
          </div>

          <div className="flex-1 pl-2 overflow-y-auto space-y-2 pb-20">
            {filteredApps.length === 0 && <div className="text-center text-gray-500 text-sm mt-10">No packages found</div>}

            {filteredApps.map((app) => (
                <AppRow key={app.pkg} app={app} />
            ))}
          </div>
      </div>
    </div>
  );

  const renderModal = () => {
    if (!modalOpen || !selectedApp || !actionType) return null;

    const config = {
      uninstall: { color: 'red', title: 'Uninstall Package', desc: 'Removes the package for user 0. Data is cleared.' },
      disable: { color: 'amber', title: 'Disable Package', desc: 'Freezes the app. Data preserved, hidden from launcher.' },
      enable: { color: 'green', title: 'Enable Package', desc: 'Re-enables the application.' },
      restore: { color: 'blue', title: 'Restore Package', desc: 'Reinstalls package for current user if uninstalled.' }
    };

    const info = config[actionType];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
           <div className="flex items-center gap-3 mb-4">
               <AlertTriangle className={`text-${info.color}-400`} size={24} />
               <h3 className="text-lg font-bold text-white">{info.title}</h3>
           </div>

           <div className="bg-white/5 p-3 rounded-lg mb-4">
               <p className="font-mono text-xs text-cyan-300 mb-1">{selectedApp.pkg}</p>
               <p className="text-sm text-gray-300">{selectedApp.name}</p>
           </div>

           <p className="text-sm text-gray-400 mb-6">
             {info.desc}
           </p>

           <div className="flex gap-3">
               <button onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-gray-300 font-medium hover:bg-white/10">
                 Cancel
               </button>
               <button onClick={handleConfirmAction} className={`flex-1 py-3 rounded-xl font-bold bg-${info.color}-600 text-white shadow-lg`}>
                 Confirm
               </button>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen text-white font-sans p-4">
        {activeTab === 'connect' ? renderConnection() : renderAppManager()}
        {renderModal()}
    </div>
  );
}