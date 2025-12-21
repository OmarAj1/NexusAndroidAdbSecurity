import { AppData } from '../types';
// Ensure you have copied uad_lists.json to nexus-web/src/assets/
// If you see an error here, create a file at src/typings.d.ts with: declare module "*.json" { const value: any; export default value; }
import uadDatabaseRaw from '../data/uad_lists.json';

// Define the shape of the UAD list items
interface UADItem {
  id: string;
  list: string;
  removal: string;
  description: string;
}

// Cast the imported JSON to our interface
const uadDatabase = uadDatabaseRaw as UADItem[];

// Optimization: Create a Map for O(1) instant lookups instead of looping through the array
const appMap = new Map<string, UADItem>();
uadDatabase.forEach((item) => {
  if (item.id) {
    appMap.set(item.id.toLowerCase(), item);
  }
});

/**
 * Maps UAD 'removal' tags to Nexus 'Safety' levels.
 */
const mapSafetyLevel = (uadRemoval: string): AppData['safety'] => {
  // UAD uses: Recommended, Advanced, Expert, Unsafe (Do not delete)
  switch (uadRemoval.toLowerCase()) {
    case 'recommended':
      return 'Recommended'; // Safe to remove
    case 'advanced':
      return 'Advanced';    // Breaks some features
    case 'expert':
      return 'Expert';      // High risk of bootloop
    case 'unsafe':
      return 'Expert';      // UAD 'Unsafe' means 'DO NOT DELETE'. We map to Expert/Dangerous.
    default:
      return 'Unknown';
  }
};

/**
 * Maps UAD 'list' categories to Nexus 'ListCategory'.
 */
const mapListCategory = (uadList: string): AppData['listCategory'] => {
  const l = uadList.toLowerCase();
  if (l.includes('google')) return 'Google';
  if (l.includes('oem') || l.includes('manufacturer')) return 'OEM';
  if (l.includes('aosp')) return 'AOSP';
  if (l.includes('misc') || l.includes('facebook') || l.includes('amazon')) return 'Third Party';
  return 'Other';
};

export const identifyApp = (pkg: string): Partial<AppData> & { description?: string } => {
  const p = pkg.toLowerCase();

  // 1. INTELLIGENT LOOKUP (UAD DATABASE)
  const knownApp = appMap.get(p);

  if (knownApp) {
    return {
      safety: mapSafetyLevel(knownApp.removal),
      listCategory: mapListCategory(knownApp.list),
      // We return the description so you can show it in the UI (e.g., in a tooltip)
      description: knownApp.description,
    };
  }

  // 2. FALLBACK HEURISTICS (For apps not in the database)
  // This ensures we still have basic classification for random installed apps.
  let safety: AppData['safety'] = 'Unknown';

  if (p.includes('launcher') || p.includes('systemui') || p.includes('settings') || p.includes('provider')) {
    safety = 'Expert'; // Dangerous to remove
  } else if (p.includes('camera') || p.includes('keyboard') || p.includes('messaging') || p.includes('dialer')) {
    safety = 'Advanced'; // Core functionality
  } else if (p.includes('google') || p.includes('android') || p.includes('service')) {
    safety = 'Advanced';
  } else if (p.includes('facebook') || p.includes('amazon') || p.includes('netflix') || p.includes('tiktok')) {
    safety = 'Recommended'; // Common Bloatware
  } else {
    // Default safe guess for unknown user apps (usually safe to remove if it's 3rd party)
    safety = 'Unsafe';
  }

  let listCategory: AppData['listCategory'] = 'Other';
  if (p.includes('google')) listCategory = 'Google';
  else if (p.includes('samsung') || p.includes('sec')) listCategory = 'OEM';
  else if (p.includes('xiaomi') || p.includes('miui')) listCategory = 'OEM';
  else if (p.includes('huawei')) listCategory = 'OEM';
  else if (p.startsWith('com.android')) listCategory = 'AOSP';
  else listCategory = 'Third Party';

  return { safety, listCategory };
};