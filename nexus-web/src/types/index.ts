export interface AppData {
  name: string;
  pkg: string;
  type: 'User' | 'System';
  status: 'Enabled' | 'Disabled' | 'Uninstalled';
  userId: number;
  category?: string;
  safety?: 'Unknown' | 'Expert' | 'Advanced' | 'Recommended' | 'Unsafe';
  listCategory?: 'Google' | 'OEM' | 'AOSP' | 'Third Party' | 'Other';
  description?: string; 
}

// REMOVED: ActionLog interface (History Tab)

export interface UserData {
  id: number;
  name:string;
}

export interface ToolStats {
  ghost: boolean;
  privacy: boolean;
  storage: string;
  tasks: string;
  speed?: string;
}

declare global {
  interface Window {
    AndroidNative?: {
      executeCommand: (action: string, pkg: string, userId: number) => void;
      getInstalledPackages: () => void;
      toggleVpn: () => void;
      pairAdb?: (ip: string, port: string, code: string) => void;
      connectAdb?: (ip: string, port: string) => void;
      checkConnectionStatus?: () => void;
      retrieveConnectionInfo?: () => void;
      startVpn?: () => void;
      stopVpn?: () => void;
      shareText?: (title: string, text: string) => void;
      fetchToolStats?: () => void;
      startZeroTouchPairing?: () => void;
      executeShell?: (cmd: string) => void;
      setFakeLocation: (lat: number, lon: number) => void;
      stopFakeLocation: () => void;
      scanForCorpses?: () => void;
    };
    updateAppList?: (json: string) => void;
    adbStatus?: (status: string) => void;
    receiveAppList?: (b64: string) => void;
    updateToolStats?: (json: string) => void;
    onPairingServiceFound?: (ip: string, port: any) => void;
    onConnectServiceFound?: (ip: string, port: any) => void;
    onShieldBlock?: (domain: string) => void;
  }
}