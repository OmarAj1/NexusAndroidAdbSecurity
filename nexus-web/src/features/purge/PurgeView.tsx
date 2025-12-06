import React, { useState, memo } from 'react';
import { Trash2, Power, Box, Cpu, AlertTriangle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppManager } from './useAppManager';
import { FilterBar } from './FilterBar';
import { AppData } from '../../types';

interface PurgeViewProps {
  allApps: AppData[];
  users: { id: number; name: string }[];
  onDisconnect: () => void;
  onAction: (action: string, pkg: string, userId: number) => void;
}

export const PurgeView = ({ allApps, users, onDisconnect, onAction }: PurgeViewProps) => {
  const { search, setSearch, filters, updateFilter, filteredApps } = useAppManager(allApps);

  return (
    <div className="flex flex-col gap-4 min-h-full">

      {/* STICKY HEADER: Keeps filters accessible while scrolling */}
      <div className="sticky top-0 z-30 -mx-4 px-4 pt-2 pb-4 bg-void/95 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/50">
        <FilterBar
          search={search} setSearch={setSearch}
          filters={filters} updateFilter={updateFilter}
          users={users} onDisconnect={onDisconnect}
        />
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 pb-safe">
        {filteredApps.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-3">
             <AnimatePresence mode="popLayout">
              {filteredApps.map((app) => (
                <MemoizedAppCard
                  key={app.pkg}
                  app={app}
                  onAction={onAction}
                />
              ))}
             </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const EmptyState = () => (
    <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 opacity-50"
    >
        <div className="relative">
            <Box size={48} className="text-slate-600" />
            <AlertCircle size={20} className="absolute -top-1 -right-1 text-accent" />
        </div>
        <p className="mt-4 text-sm font-mono text-slate-500 uppercase tracking-widest">No Packages</p>
    </motion.div>
);

const AppCard = ({ app, onAction }: { app: AppData, onAction: (a: string, p: string, u: number) => void }) => {
    const isSystem = app.type === 'System';
    const isDisabled = app.status === 'Disabled';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`
                group relative overflow-hidden rounded-2xl border transition-all duration-200
                ${isDisabled
                    ? 'bg-red-950/10 border-danger/30'
                    : 'bg-surface border-white/5 hover:border-white/10'
                }
            `}
        >
            {/* Native Touch Ripple Area (Conceptual) */}
            <div className="flex items-center p-4 gap-4">

                {/* ICON */}
                <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-lg
                    ${isSystem ? 'bg-purple-500/10 text-accent' : 'bg-cyan-500/10 text-safe'}
                `}>
                    {isSystem ? <Cpu size={22} /> : <Box size={22} />}
                </div>

                {/* TEXT */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-200 text-sm truncate pr-2">
                        {app.name}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                        {app.pkg}
                    </p>
                    {isDisabled && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-danger bg-danger/10 px-2 py-0.5 rounded-full">
                           DISABLED
                        </span>
                    )}
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-2">
                    {/* Toggle Button */}
                    <button
                        onClick={() => onAction(isDisabled ? 'enable' : 'disable', app.pkg, 0)}
                        className={`p-3 rounded-xl transition-all active:scale-90 ${isDisabled ? 'bg-green-500/10 text-green-400' : 'bg-slate-800 text-slate-400'}`}
                    >
                        <Power size={18} />
                    </button>

                    {/* Delete Button */}
                    <DestructiveButton onClick={() => onAction('uninstall', app.pkg, 0)} />
                </div>
            </div>
        </motion.div>
    );
};

const DestructiveButton = ({ onClick }: { onClick: () => void }) => {
    const [confirm, setConfirm] = useState(false);

    return (
        <button
            onClick={() => {
                if (confirm) { onClick(); setConfirm(false); }
                else { setConfirm(true); setTimeout(() => setConfirm(false), 3000); }
            }}
            className={`
                flex items-center justify-center p-3 rounded-xl transition-all duration-300 active:scale-90
                ${confirm ? 'bg-danger text-white w-20' : 'bg-slate-800 text-danger hover:bg-danger/10 w-12'}
            `}
        >
             {confirm ? <span className="text-[10px] font-bold">SURE?</span> : <Trash2 size={18} />}
        </button>
    );
};

const MemoizedAppCard = memo(AppCard);