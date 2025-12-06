export interface AppData {
  name: string;
  pkg: string;
  type: 'User' | 'System';
  status: 'Enabled' | 'Disabled' | 'Uninstalled';
  userId: number;
  category?: string; // Optional: for future categorization
  safety?: 'Unknown' | 'Expert' | 'Advanced' | 'Recommended' | 'Unsafe';
  listCategory?: 'Google' | 'OEM' | 'AOSP' | 'Third Party' | 'Other';
}

export interface ActionLog {
  timestamp: string;
  pkg: string;
  action: string;
  status: 'Success' | 'Failed';
}

export interface UserData {
  id: number;
  name:string;
}

// Global Window Interface for the Native Bridge
declare global {
  interface Window {
    AndroidNative?: {
      executeCommand: (action: string, pkg: string, userId: number) => void;
      getInstalledPackages: () => void;
      toggleVpn: () => void;
    };
    // Callbacks exposed to Java
    updateAppList?: (json: string) => void;
    adbStatus?: (status: string) => void;
  }
}