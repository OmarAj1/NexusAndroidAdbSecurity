import React from 'react';
import { Search, Sparkles, XCircle, Layers, AlertTriangle, Activity } from 'lucide-react';

interface FilterBarProps {
  search: string;
  setSearch: (value: string) => void;
  filters: any;
  updateFilter: (key: any, value: any) => void;
  onMagicSelect: () => void;
  onClearSelect: () => void;
  selectionCount: number;
}

export const FilterBar = ({
  search, setSearch, filters, updateFilter,
  onMagicSelect, onClearSelect, selectionCount
}: FilterBarProps) => {
  return (
    <div className="flex flex-col gap-3">
      {/* TOP ROW: Search & Magic Actions */}
      <div className="flex gap-3">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500 group-focus-within:text-accent transition-colors" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 bg-black/20 border border-white/10 rounded-xl
                     text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-accent/50
                     focus:ring-1 focus:ring-accent/50 transition-all backdrop-blur-sm"
            placeholder="Search packages..."
          />
        </div>

        <button
          onClick={onMagicSelect}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20
                   border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-medium transition-all"
        >
          <Sparkles size={16} />
          <span className="hidden sm:inline">Auto</span>
        </button>
      </div>

      {/* BOTTOM ROW: Advanced Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">

        {/* 1. Status Filter (New) */}
        <div className="flex items-center bg-black/20 rounded-lg border border-white/5 p-1">
          <Activity size={14} className="ml-2 text-slate-400" />
          <select
            value={filters.appStatus}
            onChange={(e) => updateFilter('appStatus', e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-300 py-1.5 pl-2 pr-8 outline-none cursor-pointer appearance-none"
          >
            <option value="All">All Status</option>
            <option value="Enabled">Enabled</option>
            <option value="Disabled">Disabled</option>
            <option value="Uninstalled">Uninstalled</option>
          </select>
        </div>

        {/* 2. List Type Filter (Added 'User' option) */}
        <div className="flex items-center bg-black/20 rounded-lg border border-white/5 p-1">
          <Layers size={14} className="ml-2 text-slate-400" />
          <select
            value={filters.listType}
            onChange={(e) => updateFilter('listType', e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-300 py-1.5 pl-2 pr-8 outline-none cursor-pointer appearance-none"
          >
            <option value="All">All Lists</option>
            <option value="User">User Apps</option> {/* Added */}
            <option value="System">System Apps</option>
            <option value="Oem">OEM</option>
            <option value="Carrier">Carrier</option>
            <option value="Google">Google</option>
            <option value="Misc">Misc</option>
          </select>
        </div>

        {/* 3. Risk Level Filter */}
        <div className="flex items-center bg-black/20 rounded-lg border border-white/5 p-1">
          <AlertTriangle size={14} className="ml-2 text-slate-400" />
          <select
            value={filters.removalLevel}
            onChange={(e) => updateFilter('removalLevel', e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-300 py-1.5 pl-2 pr-8 outline-none cursor-pointer appearance-none"
          >
            <option value="All">All Risks</option>
            <option value="Recommended">Recommended</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
            <option value="Unsafe">Unsafe</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>

        {selectionCount > 0 && (
          <button
            onClick={onClearSelect}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20
                     border border-rose-500/20 rounded-lg text-rose-400 text-xs transition-all ml-auto"
          >
            <XCircle size={14} />
            Clear ({selectionCount})
          </button>
        )}
      </div>
    </div>
  );
};