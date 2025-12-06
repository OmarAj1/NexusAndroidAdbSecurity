import React from 'react';
import { Search, LogOut, Filter } from 'lucide-react';

interface FilterBarProps {
  search: string;
  setSearch: (value: string) => void;
  filters: { safety: string; status: string; userId: number; category: string };
  updateFilter: (key: "status" | "category" | "safety" | "userId", value: any) => void;
  users: { id: number; name: string }[];
  onDisconnect: () => void;
}

export const FilterBar = ({ search, setSearch, filters, updateFilter, users, onDisconnect }: FilterBarProps) => {
  return (
    <div className="flex flex-col gap-3">

      {/* TOP ROW: SEARCH */}
      <div className="flex gap-3">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
             <Search size={16} className="text-slate-500 group-focus-within:text-accent transition-colors" />
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search packages..."
            className="w-full bg-surface border border-white/5 rounded-2xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
          />
        </div>

        {/* Disconnect Button (Icon Only) */}
        <button
          onClick={onDisconnect}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-danger/10 text-danger border border-danger/20 active:scale-95 transition-transform"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* BOTTOM ROW: HORIZONTAL SCROLL FILTERS */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
        <FilterPill
            active={filters.safety !== 'All'}
            label={filters.safety === 'All' ? 'Safety' : filters.safety}
        >
             <select
                className="opacity-0 absolute inset-0 w-full h-full"
                value={filters.safety}
                onChange={(e) => updateFilter('safety', e.target.value)}
             >
                {['All', 'Recommended', 'Advanced', 'Expert', 'Unsafe'].map(f => <option key={f} value={f}>{f}</option>)}
             </select>
        </FilterPill>

        <FilterPill
            active={filters.status !== 'All'}
            label={filters.status === 'All' ? 'Status' : filters.status}
        >
             <select
                className="opacity-0 absolute inset-0 w-full h-full"
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
             >
                {['All', 'Enabled', 'Disabled', 'Uninstalled'].map(f => <option key={f} value={f}>{f}</option>)}
             </select>
        </FilterPill>

        <FilterPill active={false} label="User">
             <select
                className="opacity-0 absolute inset-0 w-full h-full"
                value={filters.userId}
                onChange={(e) => updateFilter('userId', parseInt(e.target.value))}
             >
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
             </select>
        </FilterPill>
      </div>
    </div>
  );
};

const FilterPill = ({ label, active, children }: any) => (
    <div className={`relative flex items-center justify-center px-4 py-2 rounded-xl text-xs font-medium border transition-all whitespace-nowrap ${active ? 'bg-accent text-white border-accent' : 'bg-surface text-slate-400 border-white/5'}`}>
        <span className="flex items-center gap-1.5">
            {active && <Filter size={10} />}
            {label}
        </span>
        {children}
    </div>
);