interface Window {
  AndroidNative?: {
    executeCommand: (action: string, pkg: string, userId: number) => void;
    getInstalledPackages: () => void;
    toggleVpn: () => void;
    // Add these missing ones:
    setFakeLocation: (lat: number, lon: number) => void;
    stopFakeLocation: () => void;
  };
}