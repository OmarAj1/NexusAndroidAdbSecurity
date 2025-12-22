import { useState, useEffect } from 'react';
import { AppData, ActionLog } from '../types';

export const useNativeBridge = () => {
  const [status, setStatus] = useState('Initializing...');
  const [apps, setApps] = useState<AppData[]>([]);
  const [users, setUsers] = useState<{id: number, name: string}[]>([{id: 0, name: 'Owner'}]);
  const [vpnActive, setVpnActive] = useState(false);
  const [history, setHistory] = useState<ActionLog[]>([]);

  // NEW STATE: Live Shield Logs
  const [shieldLogs, setShieldLogs] = useState<{time: string, domain: string}[]>([]);

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
    exportHistory: () => {
        const text = history.map(h => `[${h.timestamp}] ${h.action} -> ${h.pkg}`).join('\n');
        if (isNative()) (window as any).AndroidNative.shareText("UAD Export", text);
    }
  };

  // --- TOOLS OBJECT ---
  const tools = {
    // 1. OVERDRIVE: Set Animation Scale
    setAnimationSpeed: (scale: number) => {
        if (isNative()) {
            const cmd = `settings put global window_animation_scale ${scale}; settings put global transition_animation_scale ${scale}; settings put global animator_duration_scale ${scale}`;
            (window as any).AndroidNative.executeShell(cmd);
        }
    },
    // 2. OVERDRIVE: Set DPI
    setDpi: (val: string) => {
        if (isNative()) {
            const cmd = val === 'reset' ? 'wm density reset' : `wm density ${val}`;
            (window as any).AndroidNative.executeShell(cmd);
        }
    },
    // 3. GHOST: Toggle Monochrome
    toggleMonochrome: (enable: boolean) => {
        if (isNative()) {
            const cmd = enable
                ? 'settings put secure accessibility_display_daltonizer_enabled 1; settings put secure accessibility_display_daltonizer 0'
                : 'settings put secure accessibility_display_daltonizer_enabled 0';
            (window as any).AndroidNative.executeShell(cmd);
        }
    },
    // 4. GHOST: Kill Background
    killBackground: () => {
        if (isNative()) {
            (window as any).AndroidNative.executeShell('am kill-all');
        }
    },
    // 5. GHOST: Sensors Off (Robust)
toggleSensors: (disable: boolean) => {
         if (isNative()) {
             // 1 = Blocked (True), 0 = Allowed (False)
             const val = disable ? '1' : '0';
             const action = disable ? 'enable' : 'disable';

             // COMMAND 1: Standard Manager (Pixel/AOSP)
             const cmdStandard = `cmd sensor_privacy ${action} 0 1; cmd sensor_privacy ${action} 0 2`;

             // COMMAND 2: Direct Settings Injection (Samsung/Xiaomi/Oppo)
             // Forces the system toggle state in the secure database
             const cmdSettings = `settings put global sensor_privacy_enabled ${val}; settings put secure sensor_privacy_enabled ${val}`;

             // COMMAND 3: Service Call (Low-level fallback)
             // 8 = toggleSensorPrivacy (Int), 1 = Mic, 2 = Camera, val = boolean (1/0)
             // Note: Transaction codes vary by Android version, this is a generic attempt
             const cmdService = `service call sensor_privacy 8 i32 1 i32 ${val}; service call sensor_privacy 8 i32 2 i32 ${val}`;

             // EXECUTE ALL
             const finalCommand = `${cmdStandard}; ${cmdSettings}; ${cmdService}`;

             // Log it for debugging
             console.log("Executing Sensor Lock:", finalCommand);
             (window as any).AndroidNative.executeShell(finalCommand);
         }
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

    (window as any).onShieldBlock = (domain: string) => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setShieldLogs(prev => {
            const newLog = { time, domain };
            return [newLog, ...prev].slice(0, 20);
        });
    };

    // MOUNT LOGIC
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

  return { apps, users, status, vpnActive, history, actions, pairingData, connectData, shieldLogs, tools };
};