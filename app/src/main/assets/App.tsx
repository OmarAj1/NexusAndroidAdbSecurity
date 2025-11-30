import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Trash2,
  Activity,
  Power,
  Smartphone,
  Wifi,
  Terminal,
  Zap,
  Lock,
  Globe,
  Brain,
  Sparkles,
  CheckCircle,
  XCircle,
  ScanEye,
  AlertTriangle,
  Fingerprint,
  User as UserIcon,
  Trophy,
  Target,
  TrendingUp,
  Share2,
  Download,
  Plus,
  Minus,
  Info,
  Database,
  Clock,
  LayoutGrid,
  Cpu,
  LogOut,
  Key,
  ChevronRight,
  RotateCcw,
  ArrowRight,
  DownloadCloud,
  Filter
} from 'lucide-react';

// --- Native Interfaces ---

const isNative = () => typeof (window as any).AndroidNative !== 'undefined';

const triggerHaptic = (type: 'light' | 'heavy' | 'success' = 'light') => {
  if (isNative()) {
    (window as any).AndroidNative.hapticFeedback(type);
  }
};

const showToast = (msg: string) => {
  if (isNative()) {
    (window as any).AndroidNative.showToast(msg);
  } else {
    console.log(`[Toast] ${msg}`);
  }
};

const shareData = (title: string, content: string) => {
  if (isNative()) {
    (window as any).AndroidNative.shareText(title, content);
  } else {
    console.log(`[Share] ${title}:`, content);
  }
};

// --- Types ---
interface AppData {
  name: string;
  pkg: string;
  type: 'System' | 'User';
  status: 'Enabled' | 'Disabled' | 'Unknown';
  iconBase64?: string;
}

// --- Components ---

const GlassCard = ({ children, className = "", highlight = false, borderColor = "white" }: any) => {
  const borderColors: any = {
    white: "border-white/[0.05]",
    purple: "border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.1)]",
    green: "border-green-500/10 shadow-[0_0_30px_rgba(74,222,128,0.05)]",
    red: "border-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.05)]",
    amber: "border-amber-500/10 shadow-[0_0_30px_rgba(245,158,11,0.05)]",
    cyan: "border-cyan-500/10 shadow-[0_0_30px_rgba(6,182,212,0.05)]"
  };

  return (
    <div className={`backdrop-blur-xl bg-[#0f172a]/80 rounded-xl p-5 border ${borderColors[borderColor] || borderColors.white} shadow-2xl ${className}`}>
      {children}
    </div>
  );
};

const Badge = ({ text }: { text: string }) => {
  const styles: any = {
    System: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    User: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    Enabled: "bg-green-500/20 text-green-300 border-green-500/30",
    Disabled: "bg-red-500/20 text-red-300 border-red-500/30",
    Unknown: "bg-gray-500/20 text-gray-400 border-gray-500/30"
  };
  return (
    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${styles[text] || styles.Unknown}`}>
      {text}
    </span>
  );
};

const NeonButton = ({ onClick, active, icon: Icon, label, color = "green", loading = false, size = "md", fullWidth = true }: any) => {
  const colors: any = {
    green: "from-green-500/90 to-emerald-600/90 shadow-green-500/20",
    red: "from-red-500/90 to-rose-600/90 shadow-red-500/20",
    blue: "from-blue-500/90 to-indigo-600/90 shadow-blue-500/20",
    purple: "from-purple-500/90 to-violet-600/90 shadow-purple-500/20",
    amber: "from-amber-500/90 to-orange-600/90 shadow-amber-500/20",
    cyan: "from-cyan-500/90 to-blue-600/90 shadow-cyan-500/20",
    gray: "from-gray-700/90 to-gray-800/90 shadow-gray-500/10"
  };

  const pad = size === "sm" ? "py-2 px-3 text-xs" : "py-4 px-4 text-sm";
  const widthClass = fullWidth ? "w-full" : "w-auto";

  return (
    <button
      onClick={(e) => { triggerHaptic('light'); onClick(e); }}
      disabled={loading}
      className={`relative overflow-hidden group ${widthClass} ${pad} rounded-xl font-medium tracking-wide transition-all duration-300 transform active:scale-[0.98]
        ${active
          ? `bg-gradient-to-r ${colors[color]} shadow-lg text-white ring-1 ring-white/20`
          : 'bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-gray-400 hover:text-white'}
        ${loading ? 'opacity-80 cursor-wait' : ''}`}
    >
      <div className="flex items-center justify-center space-x-2 relative z-10">
        {loading ? (
          <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
        ) : (
          <>
            {Icon && <Icon size={size === "sm" ? 14 : 18} strokeWidth={2} className={active ? "text-white" : "opacity-70 group-hover:opacity-100"} />}
            <span>{label}</span>
          </>
        )}
      </div>
    </button>
  );
};

const TabBar = ({ active, onChange }: any) => {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="absolute bottom-0 w-full h-48 bg-gradient-to-t from-[#020617] via-[#020617]/95 to-transparent" />
        <div className="pointer-events-auto relative flex justify-center pb-6 pt-2">
          <div className="flex items-center p-1.5 rounded-full bg-[#0f172a]/80 backdrop-blur-2xl border border-white/[0.1] shadow-2xl">
            {[
              { id: 'purge', icon: Smartphone, label: 'Purge' },
              { id: 'shield', icon: Shield, label: 'Shield' },
              { id: 'insights', icon: Brain, label: 'Insights' },
              { id: 'user', icon: UserIcon, label: 'Profile' }
            ].map((tab) => {
              const isActive = active === tab.id;
              let activeStyles = '';
              if (tab.id === 'purge') activeStyles = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20';
              if (tab.id === 'shield') activeStyles = 'bg-blue-500/20 text-blue-400 border-blue-500/20';
              if (tab.id === 'insights') activeStyles = 'bg-purple-500/20 text-purple-400 border-purple-500/20';
              if (tab.id === 'user') activeStyles = 'bg-amber-500/20 text-amber-400 border-amber-500/20';
              const inactiveStyles = 'text-gray-500 hover:text-gray-300 border-transparent';

              return (
                <button
                  key={tab.id}
                  onClick={() => { triggerHaptic('light'); onChange(tab.id); }}
                  className={`relative flex items-center justify-center rounded-full transition-all duration-300 border px-5 py-3.5 ${isActive ? activeStyles : inactiveStyles}`}
                >
                  <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} className={`transition-transform duration-300 ${isActive ? 'scale-100' : 'scale-90 opacity-70'}`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
};

// --- Main Application ---

export default function App() {
  const [activeTab, setActiveTab] = useState('purge');

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Purge State
  const [apps, setApps] = useState<AppData[]>([]);
  const [pairIp, setPairIp] = useState('');
  const [pairPort, setPairPort] = useState('');
  const [connectIp, setConnectIp] = useState('');
  const [connectPort, setConnectPort] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('Initializing...');
  const [purgeTabState, setPurgeTabState] = useState<'connect' | 'apps'>('connect'); // Sub-tab for Purge
  const [filterType, setFilterType] = useState('All');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<AppData | null>(null);
  const [actionType, setActionType] = useState<'uninstall' | 'disable' | 'restore' | 'enable' | null>(null);

  // Shield & Other States
  const [stats, setStats] = useState({ blocked: 124, saved: 4.2 });
  const [coreVersion, setCoreVersion] = useState("Loading...");

  // --- Initialize & Listeners ---
  useEffect(() => {
       // Modified to accept Base64 string
       (window as any).receiveAppList = (base64Json: string) => {
         try {
           // Decode Base64 and parse JSON
           const jsonStr = atob(base64Json);
           const json = JSON.parse(jsonStr);

           setApps(json);
           setActiveTab('apps');
           Native.haptic();
           setStatus("Shell Active");
         } catch (e) {
           console.error("Failed to parse app list", e);
           Native.toast("Data Parse Error");
         }
       };

     // --- FIXED CALLBACKS FOR RETRIEVE BUTTON ---
     (window as any).onPairingServiceFound = (ip: string, port: number | string) => {
         console.log("Pairing Found:", ip, port);
         setPairIp(ip);
         setPairPort(port.toString());
         setStatus('Pairing Info Found');
         triggerHaptic('success');
     };

     (window as any).onConnectServiceFound = (ip: string, port: number | string) => {
         console.log("Connect Found:", ip, port);
         setConnectIp(ip);
         setConnectPort(port.toString());
         setStatus('Ready to Connect');
         triggerHaptic('success');
     };

     (window as any).adbStatus = (newStatus: string) => {
          if (newStatus === 'Connected') {
              setStatus('Shell Active');
              triggerHaptic('success');
          }
      };

     return () => {
         if (isNative()) (window as any).AndroidNative.stopMdnsDiscovery();
     };
  }, []); // Run ONCE on mount

  // --- Handlers ---

  const handleLogin = async () => {
    setIsAuthenticating(true); triggerHaptic('light'); setAuthError('');
    await new Promise(r => setTimeout(r, 1000));
    if (username === 'admin' && password === 'admin') {
      setIsLoggedIn(true); triggerHaptic('success'); showToast('Welcome back, Operative.');
    } else {
      setAuthError('Invalid credentials.'); triggerHaptic('heavy');
    }
    setIsAuthenticating(false);
  };

  const handleRetrieve = () => {
      triggerHaptic('light');
      if (isNative()) (window as any).AndroidNative.retrieveConnectionInfo();
      else showToast("Simulated Retrieve");
  };

  const handlePair = () => {
    if (!pairIp || !pairPort || !code) return showToast("All fields required");
    if (isNative()) (window as any).AndroidNative.pairAdb(pairIp, pairPort, code);
  };

  const handleConnect = () => {
    const targetIp = connectIp || pairIp;
    const targetPort = connectPort;
    if (!targetPort) { showToast("Waiting for Port..."); return; }
    if (isNative()) (window as any).AndroidNative.connectAdb(targetIp, targetPort);
  };

  const handleConfirmAction = () => {
    if (selectedApp && actionType) {
        if (isNative()) (window as any).AndroidNative.executeCommand(actionType, selectedApp.pkg);
        setModalOpen(false); setSelectedApp(null);
    }
  };

  const openModal = (app: AppData, action: 'uninstall' | 'disable' | 'restore' | 'enable') => {
    setSelectedApp(app); setActionType(action); setModalOpen(true); triggerHaptic('light');
  };

  // --- Renderers ---

  const renderLogin = () => (
    <div className="w-full max-w-sm mx-auto flex flex-col justify-center h-screen p-8">
        <div className="flex justify-center mb-8">
            <Shield size={64} className="text-cyan-400/80" strokeWidth={1} />
        </div>
        <GlassCard borderColor="cyan">
            <h2 className="text-2xl font-bold text-center text-white mb-2">NEXUS CORE</h2>
            <p className="text-center text-cyan-300/60 mb-6 text-sm">Secure Access Required</p>
            {authError && <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-3 rounded-lg mb-4 text-xs">{authError}</div>}
            <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="bg-slate-800/60 border border-white/10 rounded-lg w-full p-3 mb-4 text-white focus:outline-none focus:border-cyan-500" />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="bg-slate-800/60 border border-white/10 rounded-lg w-full p-3 mb-6 text-white focus:outline-none focus:border-cyan-500" />
            <NeonButton label="Authenticate" color="cyan" icon={Key} onClick={handleLogin} loading={isAuthenticating} />
        </GlassCard>
    </div>
  );

  const renderPurgeConnection = () => (
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

        <div className="space-y-2">
            <label className="text-xs text-gray-500 font-bold uppercase">Manual Info</label>
            <div className="flex gap-2">
                <input value={pairIp} onChange={e=>setPairIp(e.target.value)} placeholder="IP Address" className="flex-1 bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-cyan-500 outline-none font-mono" />
                <input value={pairPort} onChange={e=>setPairPort(e.target.value)} placeholder="Port" className="w-20 bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-cyan-500 outline-none font-mono text-center" />
            </div>
            {/* RETRIEVE BUTTON */}
            <button onClick={handleRetrieve} className="w-full bg-white/5 hover:bg-cyan-500/20 text-cyan-400 p-2 rounded-lg border border-white/10 flex items-center justify-center gap-2 transition-all font-bold text-xs uppercase tracking-wider">
                <DownloadCloud size={16} /> Retrieve IP & Port
            </button>
        </div>

        <div className="space-y-2">
            <input value={code} onChange={e=>setCode(e.target.value)} placeholder="PAIRING CODE" className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-center tracking-[0.5em] font-mono focus:border-cyan-500 outline-none" maxLength={6} inputMode="numeric" />
            <button onClick={handlePair} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-lg text-sm font-bold transition-all mt-2 flex items-center justify-center gap-2">
                <Zap size={16} fill="currentColor"/> PAIR DEVICE
            </button>
        </div>

        <div className={`space-y-2 pt-2 transition-all duration-500 ${connectPort ? 'opacity-100' : 'opacity-60'}`}>
             <button onClick={handleConnect} className={`w-full p-3 rounded-lg font-bold text-white shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${connectPort ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-white/10 text-gray-400'}`}>
                <ArrowRight size={16}/> {connectPort ? "CONNECT TO SHELL" : "Connect (Requires Port)"}
            </button>
        </div>
      </GlassCard>
    </div>
  );

  const renderAppManager = () => {
      const filteredApps = apps.filter(app => {
          if (filterType === 'Disabled') return app.status === 'Disabled';
          if (filterType === 'Enabled') return app.status === 'Enabled';
          if (filterType !== 'All') return app.type === filterType;
          return true;
      }).filter(app => app.name.toLowerCase().includes(search.toLowerCase()) || app.pkg.toLowerCase().includes(search.toLowerCase()));

      return (
        <div className="flex flex-col h-full pt-2 animate-in slide-in-from-right-10 duration-300 min-h-screen">
          <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search packages..." className="w-full bg-[#1e293b] border border-white/10 rounded-lg py-2 pl-9 text-sm text-white focus:ring-1 focus:ring-cyan-500 outline-none" />
              </div>
              <button className="bg-[#1e293b] p-2 rounded-lg border border-white/10 text-gray-400" onClick={() => triggerHaptic('light')}>
                 <Filter size={18} />
              </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
              <div className="w-24 flex flex-col gap-1 pr-2 border-r border-white/5 overflow-y-auto shrink-0">
                 {['All', 'System', 'User', 'Enabled', 'Disabled'].map(f => (
                     <button key={f} onClick={() => { setFilterType(f); triggerHaptic('light'); }} className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filterType === f ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/20' : 'text-gray-500 hover:bg-white/5'}`}>
                         {f}
                     </button>
                 ))}
                 <div className="mt-auto pt-4 pb-2 text-[10px] text-gray-600 font-mono text-center">{apps.length} APPS</div>
              </div>

              <div className="flex-1 pl-2 overflow-y-auto space-y-2 pb-20">
                {filteredApps.map((app) => {
                    const iconSrc = app.iconBase64 ? `data:image/png;base64,${app.iconBase64}` : null;
                    return (
                        <div key={app.pkg} className="bg-[#1e293b]/40 border border-white/[0.05] rounded-lg p-3 hover:bg-[#1e293b]/60 transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center overflow-hidden">
                                    {iconSrc ? (
                                        <img src={iconSrc} alt="icon" className="w-8 h-8 rounded-md mr-3 shrink-0 bg-transparent" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-md mr-3 shrink-0 bg-gray-600/50 flex items-center justify-center"><Smartphone size={16} className="text-gray-400" /></div>
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
                                    <button onClick={() => openModal(app, 'enable')} className="p-1.5 bg-green-500/10 text-green-400 rounded hover:bg-green-500/20"><Zap size={14}/></button>
                                ) : (
                                    <button onClick={() => openModal(app, 'disable')} className="p-1.5 bg-amber-500/10 text-amber-400 rounded hover:bg-amber-500/20"><Power size={14}/></button>
                                )}
                                <button onClick={() => openModal(app, 'uninstall')} className="p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20"><Trash2 size={14}/></button>
                                <button onClick={() => openModal(app, 'restore')} className="p-1.5 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20"><RotateCcw size={14}/></button>
                            </div>
                        </div>
                    );
                })}
              </div>
          </div>
        </div>
      );
  };

  const renderModal = () => {
    if (!modalOpen || !selectedApp || !actionType) return null;
    const config: any = {
      uninstall: { color: 'red', title: 'Uninstall Package', desc: 'Removes the package for user 0. Data is cleared.' },
      disable: { color: 'amber', title: 'Disable Package', desc: 'Freezes the app. Data preserved.' },
      enable: { color: 'green', title: 'Enable Package', desc: 'Re-enables the application.' },
      restore: { color: 'blue', title: 'Restore Package', desc: 'Reinstalls package for current user.' }
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
           <p className="text-sm text-gray-400 mb-6">{info.desc}</p>
           <div className="flex gap-3">
               <button onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-gray-300 font-medium hover:bg-white/10">Cancel</button>
               <button onClick={handleConfirmAction} className={`flex-1 py-3 rounded-xl font-bold bg-${info.color}-600 text-white shadow-lg`}>Confirm</button>
           </div>
        </div>
      </div>
    );
  };

  if (!isLoggedIn) return <div className="w-full bg-slate-900 text-white min-h-screen">{renderLogin()}</div>;

  return (
    <div className="bg-[#020617] text-white min-h-screen font-sans">
      <main className="p-6 pb-48">
        {activeTab === 'purge' && (purgeTabState === 'connect' ? renderPurgeConnection() : renderAppManager())}
        {activeTab === 'shield' && <div className="p-4 text-center text-gray-500">Shield Module Loading...</div>}
        {activeTab === 'insights' && <div className="p-4 text-center text-gray-500">AI Analysis Module Loading...</div>}
        {activeTab === 'user' && (
            <div className="space-y-6">
                <GlassCard borderColor="amber">
                    <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center"><UserIcon size={40} className="text-amber-300" /></div>
                        <div><h2 className="text-2xl font-bold text-white">Operative: {username}</h2><p className="text-sm text-amber-300/60">Privacy Warlord</p><p className="text-xs text-gray-500 mt-2">Core Version: {coreVersion}</p></div>
                    </div>
                    <div className="mt-4"><NeonButton onClick={() => setIsLoggedIn(false)} label="Log Out" icon={LogOut} color="gray" size="sm" fullWidth={false} /></div>
                </GlassCard>
                <div className="grid grid-cols-2 gap-4">
                    <GlassCard><h3 className="font-bold text-white flex items-center"><Target size={18} className="mr-2 text-red-400" />Blocked</h3><p className="text-3xl font-bold text-white mt-2">{stats.blocked}</p></GlassCard>
                    <GlassCard><h3 className="font-bold text-white flex items-center"><TrendingUp size={18} className="mr-2 text-green-400" />Saved</h3><p className="text-3xl font-bold text-white mt-2">{stats.saved} MB</p></GlassCard>
                </div>
            </div>
        )}
      </main>
      <TabBar active={activeTab} onChange={setActiveTab} />
      {renderModal()}
    </div>
  );
}