import { AppData } from '../types';

// Simple heuristic database
// You can expand this list later!
export const identifyApp = (pkg: string): Partial<AppData> => {
  const p = pkg.toLowerCase();

  // 1. SAFETY RATINGS
  let safety: AppData['safety'] = 'Unknown';
  
  if (p.includes('launcher') || p.includes('systemui') || p.includes('settings') || p.includes('provider')) {
    safety = 'Expert'; // Dangerous to remove
  } else if (p.includes('camera') || p.includes('keyboard') || p.includes('messaging')) {
    safety = 'Advanced'; // Core functionality
  } else if (p.includes('google') || p.includes('android') || p.includes('service')) {
    safety = 'Advanced';
  } else if (p.includes('facebook') || p.includes('amazon') || p.includes('netflix') || p.includes('game')) {
    safety = 'Recommended'; // Bloatware
  } else {
    // Default safe guess for unknown user apps
    safety = 'Unsafe'; 
  }

  // 2. CATEGORIES
  let listCategory: AppData['listCategory'] = 'Other';
  if (p.includes('google')) listCategory = 'Google';
  else if (p.includes('samsung') || p.includes('sec')) listCategory = 'OEM';
  else if (p.includes('xiaomi') || p.includes('miui')) listCategory = 'OEM';
  else if (p.startsWith('com.android')) listCategory = 'AOSP';
  else listCategory = 'Third Party';

  return { safety, listCategory };
};