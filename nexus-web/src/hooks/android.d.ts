// This file is conflicting with src/types/index.ts which has a more complete definition.
// We are commenting this out to let the compiler use the definition from types/index.ts.

/*
interface Window {
  AndroidNative?: {
    executeCommand: (action: string, pkg: string, userId: number) => void;
    getInstalledPackages: () => void;
    toggleVpn: () => void;
    setFakeLocation: (lat: number, lon: number) => void;
    stopFakeLocation: () => void;
  };
}
*/

export {};