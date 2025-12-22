import { useState, useEffect } from 'react';
import { AppData, ActionLog } from '../types';

export const useNativeBridge = () => {
  const [status, setStatus] = useState('Initializing...');
  const [apps, setApps] = useState<AppData[]>([]);
  const [users, setUsers] = useState<{id: number, name: string}[]>([{id: 0, name: 'Owner'}]);
  const [vpnActive, setVpnActive] = useState(false);
  const [history, setHistory] = useState<ActionLog[]>([]);

  // Connection UI State
  const [pairingData, setPairingData] = useState({ ip: '', port: '' });
  const [connectData, setConnectData] = useState({ ip: '', port: '' });
  const [mainEndpoint, setMainEndpoint] = useState<{ ip: string, port: string } | null>(null);

  const isNative = () => typeof (window as any).AndroidNative !== 'undefined';

  const actions = {
    pair: (ip: string, port: string, code: string) => {
        if (isNative()) (window as any).AndroidNative.pairAdb(ip, port, code);
    },

    connect: (uiIp: string, uiPort: string) => {
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
    // Triggers the system-wide cache trim (pm trim-caches)
    trimCaches: () => {
        if (isNative() && (window as any).AndroidNative.trimCaches) {
             (window as any).AndroidNative.trimCaches();
        } else {
             console.log("Mock: Trimming System Caches");
        }
    },
    exportHistory: () => {
        const text = history.map(h => `[${h.timestamp}] ${h.action} -> ${h.pkg}`).join('\n');
        if (isNative()) (window as any).AndroidNative.shareText("UAD Export", text);
    }
  };

  // --- EFFECT 1: SETUP (Runs Once) ---
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
            if (!b64) return;

            const json = JSON.parse(atob(b64));
            setApps(json);
            // Update status to indicate data is ready
            setStatus("Shell Active");
        } catch(e) { console.error("JSON Parse Error:", e); }
    };

    (window as any).onPairingServiceFound = (ip: string, port: any) => {
        setPairingData({ ip, port: port.toString() });
        setStatus((prev) => prev.includes('Active') ? prev : 'Pairing Info Found');
    };

    (window as any).onConnectServiceFound = (ip: string, port: any) => {
        const portStr = port.toString();
        setConnectData({ ip, port: portStr });
        setMainEndpoint({ ip, port: portStr });
        setStatus((prev) => prev.includes('Active') ? prev : 'Ready to Connect');
    };

    // MOUNT LOGIC
    if (isNative()) {
        // Only ask for connection info ONCE at startup
        (window as any).AndroidNative.retrieveConnectionInfo();
    }

    return () => clearInterval(interval);
  }, []); // Empty dependency array = Runs once

  // --- EFFECT 2: REACTION (Runs on Status Change) ---
  useEffect(() => {
    // Auto-fetch ONLY when status explicitly changes to connected
    if (status === 'Connected' && isNative()) {
        console.log("Status Connected -> Fetching Packages");
        (window as any).AndroidNative.getInstalledPackages();
    }
  }, [status]);

  return { apps, users, status, vpnActive, history, actions, pairingData, connectData };
};