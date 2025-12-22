import { useState, useMemo } from 'react';
import { AppData } from '../../types';
import { getUadData, UadAppDefinition } from '../../data/uadApps';

export interface EnhancedAppData extends AppData {
  uad?: UadAppDefinition;
}

interface FilterState {
  search: string;
  userId: number;
  removalLevel: string; // 'All', 'Recommended', 'Advanced', 'Expert', 'Unsafe'
  listType: string;     // 'All', 'User', 'System', 'Oem', 'Carrier', 'Google', etc.
  appStatus: string;    // 'All', 'Enabled', 'Disabled', 'Uninstalled'
  selectionMode: boolean;
}

export const useAppManager = (rawApps: AppData[]) => {
  const [search, setSearch] = useState('');
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());

  const [filters, setFilters] = useState<Omit<FilterState, 'search'>>({
    userId: 0,
    removalLevel: 'All',
    listType: 'All',
    appStatus: 'All', // New Filter
    selectionMode: false,
  });

  // 1. Merge Raw Data with UAD Data
  const enhancedApps: EnhancedAppData[] = useMemo(() => {
    return rawApps.map(app => ({
      ...app,
      uad: getUadData(app.pkg)
    }));
  }, [rawApps]);

  // 2. Apply Filters
  const filteredApps = useMemo(() => {
    return enhancedApps.filter(app => {
      // Search
      const matchesSearch = app.pkg.toLowerCase().includes(search.toLowerCase()) ||
                            app.uad?.description.toLowerCase().includes(search.toLowerCase());

      // Risk Filter
      const matchesRemoval = filters.removalLevel === 'All' ||
                             (app.uad?.removal === filters.removalLevel) ||
                             (filters.removalLevel === 'Unknown' && !app.uad);

      // Status Filter (New)
      const matchesStatus = filters.appStatus === 'All' ||
                            app.status === filters.appStatus;

      // List Type Filter (Updated for 'User' category)
      let matchesList = true;
      if (filters.listType === 'All') {
        matchesList = true;
      } else if (filters.listType === 'User') {
        matchesList = app.type === 'User';
      } else if (filters.listType === 'System') {
        matchesList = app.type === 'System';
      } else {
        // Match UAD categories (Oem, Carrier, Google, etc.)
        matchesList = app.uad?.list === filters.listType;
      }

      return matchesSearch && matchesRemoval && matchesStatus && matchesList;
    });
  }, [enhancedApps, search, filters]);

  const updateFilter = (key: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleSelection = (pkg: string) => {
    const newSet = new Set(selectedApps);
    if (newSet.has(pkg)) newSet.delete(pkg);
    else newSet.add(pkg);
    setSelectedApps(newSet);
  };

  const selectRecommended = () => {
    const recommended = filteredApps
      .filter(app => app.uad?.removal === 'Recommended')
      .map(app => app.pkg);
    setSelectedApps(new Set(recommended));
  };

  const clearSelection = () => setSelectedApps(new Set());

  return {
    search,
    setSearch,
    filters,
    updateFilter,
    filteredApps,
    enhancedApps,
    selectedApps,
    toggleSelection,
    selectRecommended,
    clearSelection
  };
};