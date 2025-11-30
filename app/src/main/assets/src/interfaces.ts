// Define the structure of an App managed by the Purge screen (Updated to user's requested structure)
export interface AppData {
    name: string;
    pkg: string;
    type: 'System' | 'User';
    status: 'Enabled' | 'Disabled' | 'Unknown';
    iconBase64?: string; // NEW: Base64 string of the app icon
}

// Define the structure of a custom blocking/allowing rule for the Shield screen
export interface CustomRule {
    domain: string;
    type: 'BLOCK' | 'ALLOW';
}

// Define the structure for AI Analysis results
export interface AiSuggestion {
    domain: string;
    type: 'SAFE' | 'TRACKER' | 'UNKNOWN';
    reason: string;
}

// Define the core methods available via the Java WebAppInterface (Updated)
export interface AndroidNativeInterface {
    getNativeCoreVersion: () => string;
    hapticFeedback: (type: 'light' | 'heavy' | 'success') => void;
    showToast: (msg: string) => void;
    shareText: (title: string, content: string) => void;

    // Purge (ADB) Methods - Updated for new features/commands
    pairAdb: (ip: string, portStr: string, code: string) => void;
    connectAdb: (ip: string, portStr: string) => boolean;

    // New methods for the Debloater screen logic
    executeCommand: (action: 'uninstall' | 'disable' | 'restore' | 'enable', pkg: string) => void;
    startMdnsDiscovery: () => void;
    stopMdnsDiscovery: () => void;
    retrieveConnectionInfo: () => void;
}