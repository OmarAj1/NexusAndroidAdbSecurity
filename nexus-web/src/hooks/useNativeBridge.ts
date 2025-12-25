import { useState, useEffect } from 'react';
import { AppData, ActionLog } from '../types';

// Define the shape of the stats data coming from Java
export interface ToolStats {
  ghost: boolean;
  privacy: boolean;
  storage: string;
  tasks: string;
  speed?: string;
}

export const useNativeBridge = () => {
  const [status, setStatus] = useState('Initializing...');
  const [apps, setApps] = useState<AppData[]>([]);
  const [users, setUsers] = useState<{id: number, name: string}[]>([{id: 0, name: 'Owner'}]);
  const [vpnActive, setVpnActive] = useState(false);
  const [history, setHistory] = useState<ActionLog[]>([]);

  // --- NEW: Live Tool Stats State ---
  const [toolStats, setToolStats] = useState<ToolStats>({
      ghost: false,
      privacy: false,
      storage: '...',
      tasks: '0',
      speed: '1'
  });

  // Shield Logs State
  const [shieldLogs, setShieldLogs] = useState<{time: string, domain: string}[]>([]);

  // Connection UI State
  const [pairingData, setPairingData] = useState({ ip: '', port: '' });
  const [connectData, setConnectData] = useState({ ip: '', port: '' });
  const [mainEndpoint, setMainEndpoint] = useState<{ ip: string, port: string } | null>(null);

  // Helper to check if we are running inside the Android App
  const isNative = () => typeof (window as any).AndroidNative !== 'undefined';

  // --- ACTIONS ---
  const actions = {
    pair: (ip: string, port: string, code: string) => {
        if (isNative()) (window as any).AndroidNative.pairAdb(ip, port, code);
    },

    checkStatus: () => {
          if (isNative() && (window as any).AndroidNative.checkConnectionStatus) {
              (window as any).AndroidNative.checkConnectionStatus();
          }
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
    exportHistory: () => {
        const text = history.map(h => `[${h.timestamp}] ${h.action} -> ${h.pkg}`).join('\n');
        if (isNative()) (window as any).AndroidNative.shareText("UAD Export", text);
    },

    // --- NEW: Action to request updated stats from Java ---
    refreshStats: () => {
        if (isNative() && (window as any).AndroidNative.fetchToolStats) {
            (window as any).AndroidNative.fetchToolStats();
        }
    },

    startZeroTouch: () => {
          if (isNative() && (window as any).AndroidNative.startZeroTouchPairing) {
              (window as any).AndroidNative.startZeroTouchPairing();
          } else {
              console.warn("Zero Touch not supported or not running on device");
          }
      },
  };

  // --- COMMAND EXECUTOR ---
  const executeCommand = async (command: string): Promise<string> => {
    if (isNative()) {
      // Execute the shell command via the Java interface
      (window as any).AndroidNative.executeShell(command);
      return "Command Sent";
    } else {
      console.warn("Native Bridge not found. Command ignored:", command);
      return "Error: Native Bridge Missing";
    }
  };

  // --- EFFECT 1: SETUP (Runs Once) ---
  useEffect(() => {
    // Poll VPN Status
    const interval = setInterval(() => {
    if (isNative() && (window as any).AndroidNative.checkConnectionStatus) {
            (window as any).AndroidNative.checkConnectionStatus();
        }
    }, 2000);

    // Setup Global Listeners from Java
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
            setStatus("Shell Active");
        } catch(e) { console.error("JSON Parse Error:", e); }
    };

    // --- NEW: Listener for Tool Stats Updates ---
    (window as any).updateToolStats = (jsonString: string) => {
        try {
            const data = JSON.parse(jsonString);
            setToolStats(data);
        } catch(e) { console.error("Stats Parse Error", e); }
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

    (window as any).onShieldBlock = (domain: string) => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setShieldLogs(prev => {
            const newLog = { time, domain };
            return [newLog, ...prev].slice(0, 20);
        });
    };

    // Initial Connection Info Retrieval
    if (isNative()) {
        (window as any).AndroidNative.retrieveConnectionInfo();
    }

    return () => clearInterval(interval);
  }, []);

  // --- EFFECT 2: REACTION (Runs on Status Change) ---
  useEffect(() => {
    if (status === 'Connected' && isNative()) {
        console.log("Status Connected -> Fetching Packages");
        (window as any).AndroidNative.getInstalledPackages();
    }
  }, [status]);

  // --- RETURN EVERYTHING ---
  return {
      apps,
      users,
      status,
      vpnActive,
      history,
      actions,
      pairingData,
      connectData,
      shieldLogs,
      executeCommand,
      toolStats // <--- Exported so ToolsView can read it
  };
};