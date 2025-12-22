import rawUadList from './uad_lists.json';

export interface UadAppDefinition {
  id: string;
  list: string;
  description: string;
  removal: string; // "Recommended" | "Advanced" | "Expert" | "Unsafe"
  dependencies?: string[];
  neededBy?: string[];
  labels?: string[];
}

// Cast the JSON import to our type
export const UAD_APPS_DATA: UadAppDefinition[] = rawUadList as UadAppDefinition[];

// --- HELPERS ---

export const getUadData = (packageName: string) => {
  return UAD_APPS_DATA.find(app => app.id === packageName);
};

export const getRiskLevel = (packageName: string): string => {
  const app = getUadData(packageName);
  return app ? app.removal : 'Unknown';
};

export const isDangerous = (packageName: string): boolean => {
  const level = getRiskLevel(packageName);
  return level === 'Unsafe' || level === 'Expert';
};