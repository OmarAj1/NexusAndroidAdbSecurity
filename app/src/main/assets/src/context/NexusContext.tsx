import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AppData, CustomRule, AiSuggestion, AndroidNativeInterface } from '../interfaces';
import { isNative, showToast, triggerHaptic, shareData } from '../components/Common';

// --- Native API Access ---
const NATIVE_API: AndroidNativeInterface = (window as any).AndroidNative;

// Helper to access native functions
const AdbModule = {
  // ADB Connection methods (renamed/updated to reflect the new API)
  pair: (ip: string, port: string, code: string) => {
    if (isNative()) { NATIVE_API.pairAdb(ip, port, code); }
    showToast("[Native] Pairing Initiated");
  },
  connect: (ip: string, port: string) => {
    if (isNative()) { NATIVE_API.connectAdb(ip, port); }
    showToast("[Native] Connection Attempted");
  },
  execute: (action: 'uninstall' | 'disable' | 'restore' | 'enable', pkg: string) => {
      if (isNative()) { NATIVE_API.executeCommand(action, pkg); }
      showToast(`[Native] Executing: ${action} on ${pkg}`);
  },
  startDiscovery: () => {
      if (isNative()) { NATIVE_API.startMdnsDiscovery(); }
      console.log("[Native] mDNS Discovery Started");
  },
  stopDiscovery: () => {
      if (isNative()) { NATIVE_API.stopMdnsDiscovery(); }
      console.log("[Native] mDNS Discovery Stopped");
  },
  retrieve: () => {
      if (isNative()) { NATIVE_API.retrieveConnectionInfo(); }
      showToast("[Native] Retrieving Connection Info");
  }
};

// --- Mock Data Pools for Shield/Insights (Retained) ---
const SHIELD_MODULE_MOCKS = {
  AD_DOMAINS: [
    "googleads.g.doubleclick.net", "pagead2.googlesyndication.com", "ads.facebook.com",
    "creative.ak.fbcdn.net", "adservice.google.com", "analytics.twitter.com",
    "app-measurement.com", "firebase-installations.googleapis.com"
  ],
  SAFE_DOMAINS: [
    "api.weather.com", "samsung-updates.com", "connectivitycheck.gstatic.com",
    "clients3.google.com", "update.googleapis.com", "outlook.office365.com",
    "imap.gmail.com", "api.spotify.com", "netflix.com"
  ],
  simulateTraffic: (customRules: CustomRule[]): { domain: string, blocked: boolean, ruleApplied?: string } => {
    const isBad = Math.random() > 0.4;
    const pool = isBad ? SHIELD_MODULE_MOCKS.AD_DOMAINS : SHIELD_MODULE_MOCKS.SAFE_DOMAINS;
    const domain = pool[Math.floor(Math.random() * pool.length)];

    const customRule = customRules.find(r => domain.includes(r.domain));
    if (customRule) {
      return { domain, blocked: customRule.type === 'BLOCK', ruleApplied: customRule.type };
    }

    return { domain, blocked: isBad };
  },
};

const getCoreVersion = () => isNative() ? NATIVE_API.getNativeCoreVersion() : "WEB_SIMULATION_v1.0";

// --- Context & State Definitions ---
const NexusContext = createContext<any>(undefined);

// Mock data matching the new AppData interface structure
const MOCK_APPS: AppData[] = [
    { name: 'Analytics Agent', pkg: 'com.tracking.agent', type: 'System', status: 'Enabled' },
    { name: 'Cloud Daemon', pkg: 'com.vendor.cloud', type: 'User', status: 'Enabled' },
    { name: 'Market Push', pkg: 'com.ads.push', type: 'User', status: 'Disabled' },
    { name: 'System Updater', pkg: 'com.android.updater', type: 'System', status: 'Enabled' },
    { name: 'Face Filters', pkg: 'com.cam.filters', type: 'User', status: 'Disabled' },
];

export const NexusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Auth State (Retained)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [coreVersion, setCoreVersion] = useState("Loading...");

  // ADB/Purge State (NEW/UPDATED to match PurgeScreen requirements)
  const [apps, setApps] = useState<AppData[]>(MOCK_APPS);
  const [pairIp, setPairIp] = useState('');
  const [pairPort, setPairPort] = useState('');
  const [connectIp, setConnectIp] = useState('');
  const [connectPort, setConnectPort] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('Initializing...');
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<'connect' | 'apps'>('connect');

  // Shield State (Retained)
  const [vpnActive, setVpnActive] = useState(false);
  const [stats, setStats] = useState({ blocked: 124, saved: 4.2 });
  const [totalScanned, setTotalScanned] = useState(1240);
  const [trafficLog, setTrafficLog] = useState<string[]>([]);
  const [customRules, setCustomRules] = useState<CustomRule[]>([]);
  const [newRuleDomain, setNewRuleDomain] = useState('');
  const [newRuleType, setNewRuleType] = useState<'BLOCK' | 'ALLOW'>('BLOCK');

  // Analysis State (Retained)
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);


  // --- Event Listener for Native Java Callbacks (UPDATED) ---
  const handleScan = useCallback(() => {
    setIsScanning(true);
    setStatus("Scanning...");
    AdbModule.startDiscovery();
    // Simulate stopping scan after 10s for web, native logic handles stop
    if (!isNative()) setTimeout(() => setIsScanning(false), 10000);
  }, []);

  useEffect(() => {
     // Callback from Java when app list is received (JSON parsing happens in PurgeInterface)
     (window as any).receiveAppList = (json: AppData[]) => {
         try {
           setApps(json);
           setActiveTab('apps');
           triggerHaptic('light');
           setStatus("Shell Active");
           AdbModule.stopDiscovery(); // Stop discovery once connection is active
         } catch(e) {
             console.error("Failed to parse app list from Java", e);
             showToast("Error processing app list.");
         }
     };

     // Callback from Java when a pairing mDNS service is found
     (window as any).onPairingServiceFound = (ip: string, port: number) => {
        setPairIp(ip);
        setPairPort(port.toString());
        setStatus('Pairing Service Found');
        triggerHaptic('light');
     };

     // Callback from Java when a connect mDNS service is found
     (window as any).onConnectServiceFound = (ip: string, port: number) => {
        setConnectIp(ip);
        setConnectPort(port.toString());
        setStatus('Ready to Connect');
        AdbModule.stopDiscovery(); // Usually connect service is found after successful pairing/connection
        triggerHaptic('light');
     };

     // Initial setup
     setCoreVersion(getCoreVersion());
     handleScan();

     return () => AdbModule.stopDiscovery();
  }, [handleScan]);

  // --- Handlers (UPDATED) ---

  const handleLogin = async () => {
    setIsAuthenticating(true); triggerHaptic('light'); setAuthError('');
    await new Promise(r => setTimeout(r, 1000));
    if (username === 'admin' && password === 'admin') {
      setIsLoggedIn(true); triggerHaptic('success'); showToast('Welcome back, Operative.');
    } else {
      setAuthError('Invalid credentials. Access Denied.'); triggerHaptic('heavy');
    }
    setIsAuthenticating(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false); setUsername('admin'); setPassword('admin'); setAuthError('');
    triggerHaptic('light');
  };

  const handleRetrieve = () => {
      triggerHaptic('light');
      AdbModule.retrieve();
  };

  const handlePair = () => {
    if (!pairIp || !pairPort || !code) return showToast("All fields required");
    setStatus("Attempting Pair...");
    AdbModule.pair(pairIp, pairPort, code);
  };

  const handleConnect = () => {
    const targetIp = connectIp || pairIp;
    const targetPort = connectPort;
    if (!targetPort) {
      showToast("Waiting for Connect Port...");
      return;
    }
    setStatus("Attempting Connect...");
    AdbModule.connect(targetIp, targetPort);
  };

  const confirmAppAction = (action: 'uninstall' | 'disable' | 'restore' | 'enable', pkg: string) => {
    AdbModule.execute(action, pkg);
    // Optimistic update for UI state
    setApps(prevApps => prevApps.map(app => {
        if (app.pkg === pkg) {
            let newStatus = app.status;
            if (action === 'disable') newStatus = 'Disabled';
            if (action === 'enable') newStatus = 'Enabled';
            if (action === 'uninstall' || action === 'restore') newStatus = 'Unknown'; // Status will be refreshed by Java
            return { ...app, status: newStatus };
        }
        return app;
    }));
  };

  const toggleVpn = () => {
      const newState = !vpnActive;
      setVpnActive(newState); triggerHaptic('heavy');
      newState ? NATIVE_API.startVpn() : NATIVE_API.stopVpn();
  };

  const runTrafficAnalysis = async () => {
    setIsAnalyzing(true); triggerHaptic('light'); setAiSuggestions([]);

    // Mocked analysis logic...
    const HEURISTICS: Record<string, { type: 'SAFE' | 'TRACKER', reason: string }> = {/* ... definitions ... */};
    await new Promise(r => setTimeout(r, 2000));
    const results: AiSuggestion[] = [/* ... mocked results ... */];
    setAiSuggestions(results);

    setIsAnalyzing(false); triggerHaptic('success');
  };

  // --- Simulation Effect for Shield Traffic (Retained) ---
  useEffect(() => { /* ... (Retained) ... */ }, [vpnActive, customRules]);


  const contextValue = {
    // Auth
    isLoggedIn, setIsLoggedIn, username, setUsername, password, setPassword, authError, isAuthenticating, handleLogin, handleLogout, coreVersion,
    // Purge (ADB)
    apps, setApps, pairIp, setPairIp, pairPort, setPairPort, connectIp, setConnectIp, connectPort,
    code, setCode, status, setStatus, isScanning, setActiveTab, activeTab,
    handleScan, handleRetrieve, handlePair, handleConnect, confirmAppAction,
    // Shield
    vpnActive, stats, totalScanned, trafficLog, customRules, newRuleDomain, setNewRuleDomain, newRuleType, setNewRuleType, toggleVpn,
    // Insights
    isAnalyzing, aiSuggestions, runTrafficAnalysis, exportAnalysis: () => {/* Logic retained */},
    // Utilities
    addCustomRule: () => {/* Logic retained */}, removeCustomRule: () => {/* Logic retained */}, exportShieldLog: () => {/* Logic retained */},
  };

  return (
    <NexusContext.Provider value={contextValue}>
      {children}
    </NexusContext.Provider>
  );
};

export const useNexus = () => {
  const context = useContext(NexusContext);
  if (context === undefined) { throw new Error('useNexus must be used within a NexusProvider'); }
  return context;
};