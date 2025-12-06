import { useState, useMemo } from 'react';
import { AppData } from '../../types';
import { identifyApp } from '../../utils/appIdentifier';

interface FilterState {
  search: string;
  userId: number;
  safety: string;
  status: string;
  category: string;
}

export const useAppManager = (rawApps: AppData[]) => {
  const [search, setSearch] = useState('');

  const [filters, setFilters] = useState<Omit<FilterState, 'search'>>({
    userId: 0,
    safety: 'All',
    status: 'All',
    category: 'All'
  });

  const updateFilter = (key: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // 1. ENRICHMENT LAYER
  // We process the raw Java list to add Safety ratings and fix Statuses
  const processedApps = useMemo(() => {
    if (!rawApps) return [];

    return rawApps.map(app => {
      // Add Safety & Category info
      const { safety, listCategory } = identifyApp(app.pkg);

      // LOGIC FIX: If a System App is "Disabled", it is effectively "Uninstalled" (Debloated)
      // This ensures it shows up when you filter by "Uninstalled"
      let effectiveStatus = app.status;
      if (app.type === 'System' && app.status === 'Disabled') {
          effectiveStatus = 'Uninstalled';
      }

      return {
        ...app,
        safety,
        listCategory,
        status: effectiveStatus,
        userId: app.userId !== undefined ? app.userId : 0 // Default to User 0 if missing
      };
    });
  }, [rawApps]);

  // 2. FILTERING LAYER
  const filteredApps = useMemo(() => {
    return processedApps.filter(app => {
      // Search
      const searchLower = search.toLowerCase();
      if (!app.name.toLowerCase().includes(searchLower) &&
          !app.pkg.toLowerCase().includes(searchLower)) {
        return false;
      }

      // User
      if (app.userId !== filters.userId) return false;

      // Status
      // Now 'Uninstalled' filter will catch the apps we re-labeled above
      if (filters.status !== 'All' && app.status !== filters.status) return false;

      // Safety
      if (filters.safety !== 'All' && app.safety !== filters.safety) return false;

      // Category
      if (filters.category !== 'All') {
         if (filters.category === 'User') { if (app.type !== 'User') return false; }
         else if (filters.category === 'System') { if (app.type !== 'System') return false; }
         else if (app.listCategory !== filters.category) return false;
      }

      return true;
    });
  }, [processedApps, search, filters]);

  return {
    search,
    setSearch,
    filters,
    updateFilter,
    filteredApps
  };
};