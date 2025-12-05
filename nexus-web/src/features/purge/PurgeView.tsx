import React, { useState, useCallback, memo } from 'react';
import { Trash2, Power, Box, Cpu, AlertTriangle, Check, X } from 'lucide-react';
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

  // specific animation variants for the list container
  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Search & Filter Section */}
      <div className="flex-none z-20">
        <FilterBar
          search={search} setSearch={setSearch}
          filters={filters} updateFilter={updateFilter}
          users={users} onDisconnect={onDisconnect}
        />
      </div>

      {/* Scrollable List Area */}
      <div className="flex-1 overflow-y-auto pr-2 pb-20 custom-scrollbar">
        {filteredApps.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-64 text-cyan-500/40 select-none"
          >
            <div className="relative">
                <Box size={64} className="opacity-20 animate-pulse" />
                <AlertTriangle size={24} className="absolute -top-2 -right-2 text-amber-500/50" />
            </div>
            <p className="font-mono text-sm tracking-[0.2em] mt-4 uppercase">No Packets Found</p>
            <p className="text-xs text-cyan-500/20 mt-2">ADJUST FILTERS TO SCAN</p>
          </motion.div>
        ) : (
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-3"
          >
            <AnimatePresence mode="popLayout">
              {filteredApps.map((app) => (
                <MemoizedAppCard
                  key={app.pkg}
                  app={app}
                  onAction={onAction}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// --- Sub-Components ---

// 1. Memoized Card for Performance
const AppCard = ({ app, onAction }: { app: AppData, onAction: (a: string, p: string, u: number) => void }) => {
    const isSystem = app.type === 'System';
    const isDisabled = app.status === 'Disabled';

    // Animation variant for individual items
    const itemVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        show: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
    };

    return (
        <motion.div
            layout
            variants={itemVariants}
            exit="exit"
            className={`
                group relative overflow-hidden rounded-xl border backdrop-blur-md transition-colors duration-300
                ${isDisabled
                    ? 'bg-red-950/20 border-red-500/20 hover:border-red-500/40'
                    : 'bg-slate-900/40 border-cyan-500/10 hover:border-cyan-400/30'
                }
            `}
        >
            {/* Status Indicator Line */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300
                ${isDisabled ? 'bg-red-500/50 group-hover:bg-red-500' : 'bg-cyan-500/50 group-hover:bg-cyan-400'}
                opacity-60 group-hover:opacity-100`}
            />

            <div className="flex justify-between items-center p-3 sm:p-4 pl-5">
                <div className="flex items-center gap-3 overflow-hidden">
                    {/* Icon Container */}
                    <div className={`
                        flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 transition-colors
                        ${isSystem
                            ? 'bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20'
                            : 'bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20'}
                    `}>
                        {isSystem ? <Cpu size={20} /> : <Box size={20} />}
                    </div>

                    {/* Text Info */}
                    <div className="flex flex-col overflow-hidden gap-0.5">
                        <h3 className="font-bold text-gray-200 text-sm truncate tracking-wide group-hover:text-white transition-colors">
                            {app.name}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
                            <span className="truncate max-w-[150px]">{app.pkg}</span>
                            {isDisabled && (
                                <span className="text-red-400 flex items-center gap-1 bg-red-900/30 px-1.5 py-0.5 rounded">
                                    <AlertTriangle size={8} /> DISABLED
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pl-2">
                    <ActionButton
                        label={isDisabled ? "Enable" : "Disable"}
                        icon={Power}
                        color={isDisabled ? "green" : "amber"}
                        onClick={() => onAction(isDisabled ? 'enable' : 'disable', app.pkg, 0)}
                    />

                    {/* Safety Uninstall Button */}
                    <DestructiveButton
                        onClick={() => onAction('uninstall', app.pkg, 0)}
                    />
                </div>
            </div>
        </motion.div>
    );
};

const MemoizedAppCard = memo(AppCard);

// 2. Standard Action Button
const ActionButton = ({ icon: Icon, color, onClick, label }: { icon: any, color: 'red'|'amber'|'green', onClick: () => void, label: string }) => {
    const colors = {
        red: "hover:bg-red-500/20 text-red-400 hover:text-red-300 active:border-red-500/50",
        amber: "hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 active:border-amber-500/50",
        green: "hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 active:border-emerald-500/50",
    };

    return (
        <button
            onClick={onClick}
            title={label}
            className={`
                p-2 rounded-lg border border-transparent transition-all duration-200 active:scale-95
                ${colors[color]}
            `}
        >
            <Icon size={18} strokeWidth={2} />
        </button>
    );
}

// 3. Safety "Confirm" Button for Uninstall
const DestructiveButton = ({ onClick }: { onClick: () => void }) => {
    const [confirming, setConfirming] = useState(false);

    const handleClick = () => {
        if (confirming) {
            onClick();
            setConfirming(false);
        } else {
            setConfirming(true);
            // Auto-reset after 3 seconds if not confirmed
            setTimeout(() => setConfirming(false), 3000);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={handleClick}
                onBlur={() => setTimeout(() => setConfirming(false), 200)} // Reset on blur (slight delay for click to register)
                title="Uninstall Package"
                className={`
                    flex items-center justify-center p-2 rounded-lg border transition-all duration-200 active:scale-95
                    ${confirming
                        ? "bg-red-600/20 border-red-500 text-red-200 w-24 gap-2"
                        : "border-transparent hover:bg-red-500/20 text-red-400 hover:text-red-300 w-9"
                    }
                `}
            >
                <AnimatePresence mode="wait" initial={false}>
                    {confirming ? (
                        <motion.div
                            key="confirm"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="flex items-center gap-1 overflow-hidden whitespace-nowrap"
                        >
                            <span className="text-[10px] font-bold">CONFIRM?</span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                        >
                            <Trash2 size={18} strokeWidth={2} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </button>
        </div>
    );
};