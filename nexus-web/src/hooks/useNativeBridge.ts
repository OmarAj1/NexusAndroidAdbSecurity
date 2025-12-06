import { useState, useEffect } from 'react';
import { AppData, ActionLog } from '../types';

export const useNativeBridge = () => {
  const [status, setStatus] = useState('Initializing...');
  const [apps, setApps] = useState<AppData[]>([]);
  const [users, setUsers] = useState<{id: number, name: string}[]>([{id: 0, name: 'Owner'}]);
  const [vpnActive, setVpnActive] = useState(false);
  const [history, setHistory] = useState<ActionLog[]>([]);

  // These update the UI text fields
  const [pairingData, setPairingData] = useState({ ip: '', port: '' });
  const [connectData, setConnectData] = useState({ ip: '', port: '' });

  // --- NEW: THE CONSTANT MEMORY ---
  // This stores the "Main" Wireless Debugging IP/Port permanently once found.
  // It will NOT be overwritten by the pairing port.
  const [mainEndpoint, setMainEndpoint] = useState<{ ip: string, port: string } | null>(null);

  const isNative = () => typeof (window as any).AndroidNative !== 'undefined';

  const actions = {
    pair: (ip: string, port: string, code: string) => {
        if (isNative()) (window as any).AndroidNative.pairAdb(ip, port, code);
    },

    // --- UPDATED CONNECT LOGIC ---
    connect: (uiIp: string, uiPort: string) => {
        // SMART CONNECT:
        // If we have a saved "Main" endpoint (from Retrieve IP), use that.
        // This effectively ignores the Pairing Port currently sitting in the input fields.
        const finalIp = mainEndpoint ? mainEndpoint.ip : uiIp;
        const finalPort = mainEndpoint ? mainEndpoint.port : uiPort;

        setStatus(`Connecting to Main Port: ${finalPort}...`);

        if (isNative()) {
            (window as any).AndroidNative.connectAdb(finalIp, finalPort);
        }
    },

    disconnect: () => {
         setStatus("Disconnected");
    },
    retrieve: () => {
        if (isNative()) (window as any).AndroidNative.retrieveConnectionInfo();
    },
    toggleVpn: () => {
        if (isNative() && (window as any).AndroidNative.startVpn) {
             if (vpnActive) (window as any).AndroidNative.stopVpn();
             else (window as any).AndroidNative.startVpn();
             setVpnActive(!vpnActive);
        }
    },
    exportHistory: () => {
        const text = history.map(h => `[${h.timestamp}] ${h.action} -> ${h.pkg}`).join('\n');
        if (isNative()) (window as any).AndroidNative.shareText("UAD Export", text);
    }
  };

  // --- FIX: AUTO-FETCH APPS ON CONNECT ---
  useEffect(() => {
    // When status hits "Connected", immediately ask Java for the package list.
    if (status === 'Connected' && isNative()) {
        console.log("Status Connected -> Fetching Packages");
        (window as any).AndroidNative.getInstalledPackages();
    }
  }, [status]);

  useEffect(() => {
    // Poll VPN Status
    const interval = setInterval(() => {
       if (isNative() && (window as any).AndroidNative.getVpnStatus) {
         setVpnActive((window as any).AndroidNative.getVpnStatus());
       }
    }, 2000);

    // Setup Global Listeners
    (window as any).adbStatus = (s: string) => {
        console.log("ADB Status:", s);
        setStatus(s);
    };

    (window as any).receiveAppList = (b64: string) => {
        try {
            console.log("App List Received. Length:", b64.length);
            const json = JSON.parse(atob(b64));
            setApps(json);
            // Update status to indicate data is ready (and prevent loop)
            setStatus("Shell Active");
        } catch(e) { console.error("JSON Parse Error:", e); }
    };

    // --- PAIRING FOUND ---
    // Just updates the UI fields for the user to click "Pair"
    (window as any).onPairingServiceFound = (ip: string, port: any) => {
        setPairingData({ ip, port: port.toString() });
        setStatus('Pairing Info Found');
    };

    // --- CONNECT (MAIN) FOUND ---
    // This is the Golden Source. We save this to 'mainEndpoint'.
    (window as any).onConnectServiceFound = (ip: string, port: any) => {
        const portStr = port.toString();

        // 1. Update UI
        setConnectData({ ip, port: portStr });

        // 2. LOCK IT IN MEMORY
        setMainEndpoint({ ip, port: portStr });

        setStatus('Ready to Connect');
    };

    // --- CRITICAL FIX FOR REAL DEVICES ---
    // If the View loads AFTER Java has already initialized, we missed the initial events.
    // We must manually request the state immediately.
    if (isNative()) {
        console.log("Mounting: Requesting initial data sync...");
        (window as any).AndroidNative.retrieveConnectionInfo();

        // Slight delay to ensure connection is ready before asking for packages
        setTimeout(() => {
             (window as any).AndroidNative.getInstalledPackages();
        }, 1000);
    }

    return () => clearInterval(interval);
  }, []);

  return { apps, users, status, vpnActive, history, actions, pairingData, connectData };
};