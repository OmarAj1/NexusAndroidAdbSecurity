import React, { useState } from 'react';
import { Trash2, Eraser } from 'lucide-react';
import { useAppManager } from './useAppManager';
import { FilterBar } from './FilterBar';
import { AppList } from './AppList';
import { SafetyModal } from './SafetyModal';
import { AppData } from '../../types';
import { getUadData } from '../../data/uadApps';

interface PurgeViewProps {
  allApps: AppData[];
  users: { id: number; name: string }[];
  onDisconnect: () => void;
  onAction: (action: string, pkg: string, userId: number) => void;
  onTrimCaches?: () => void;
}

export const PurgeView = ({ allApps, users, onDisconnect, onAction, onTrimCaches }: PurgeViewProps) => {
  const {
    search, setSearch, filters, updateFilter,
    filteredApps, selectedApps,
    toggleSelection, selectRecommended, clearSelection
  } = useAppManager(allApps);

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{action: string, pkg: string} | null>(null);

  const handleActionRequest = (action: string, pkg: string) => {
    const uadData = getUadData(pkg);
    const level = uadData?.removal;
    const isDestructive = action === 'uninstall' || action === 'disable';
    const isSafePkg = level === 'Recommended';

    if (isDestructive && !isSafePkg) {
        setPendingAction({ action, pkg });
        setModalOpen(true);
    } else {
        onAction(action, pkg, filters.userId);
    }
  };

  const confirmAction = () => {
    if (pendingAction) {
        onAction(pendingAction.action, pendingAction.pkg, filters.userId);
        setModalOpen(false);
        setPendingAction(null);
    }
  };

  const handleBulkUninstall = () => {
    if (confirm(`Uninstall ${selectedApps.size} apps for User ${filters.userId}? This will happen sequentially.`)) {
      // Loop through and fire individual actions (Old Stable Method)
      selectedApps.forEach(pkg => {
        onAction('uninstall', pkg, filters.userId);
      });
      clearSelection();
    }
  };

  return (
    <div className="flex flex-col gap-4 min-h-full relative">

      <SafetyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={confirmAction}
        pkg={pendingAction?.pkg || ''}
        action={pendingAction?.action || ''}
        app={pendingAction ? getUadData(pendingAction.pkg) : undefined}
      />

      <div className="sticky top-0 z-30 -mx-4 px-4 pt-2 pb-4 bg-void/95 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/50">
        <FilterBar
          search={search} setSearch={setSearch}
          filters={filters} updateFilter={updateFilter}
          onMagicSelect={selectRecommended}
          onClearSelect={clearSelection}
          selectionCount={selectedApps.size}
        />
      </div>

      <AppList
        apps={filteredApps}
        selectedApps={selectedApps}
        onToggle={toggleSelection}
        onAction={handleActionRequest}
      />

      {/* FORCE CACHE CLEAN BUTTON (Bottom Left) */}
      <div className="fixed bottom-24 left-6 z-50">
        <button
          onClick={() => {
            if (confirm("Force remove temporary cache files for ALL apps? This does not delete user data.")) {
              onTrimCaches?.();
            }
          }}
          className="flex items-center justify-center w-14 h-14 bg-slate-800 hover:bg-slate-700
                   text-emerald-400 shadow-[0_0_20px_rgba(0,0,0,0.3)] rounded-2xl
                   border border-white/10 transition-all active:scale-95"
          title="Nuke System Cache"
        >
          <Eraser size={24} />
        </button>
      </div>

      {selectedApps.size > 0 && (
        <div className="fixed bottom-24 right-6 z-50 animate-in fade-in slide-in-from-bottom-4">
          <button
            onClick={handleBulkUninstall}
            className="flex items-center gap-3 px-6 py-4 bg-rose-600 hover:bg-rose-500
                     text-white shadow-[0_0_30px_rgba(225,29,72,0.4)] rounded-2xl
                     font-bold tracking-wide transition-all active:scale-95"
          >
            <Trash2 size={20} />
            <span>PURGE ({selectedApps.size})</span>
          </button>
        </div>
      )}
    </div>
  );
};