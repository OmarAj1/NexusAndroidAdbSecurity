import React, { memo } from 'react';
import { FixedSizeList as List, areEqual } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Trash2, Power, RefreshCw, CheckCircle2, HelpCircle, EyeOff } from 'lucide-react';
import { EnhancedAppData } from './useAppManager';

interface AppListProps {
  apps: EnhancedAppData[];
  selectedApps: Set<string>;
  onToggle: (pkg: string) => void;
  onAction: (action: string, pkg: string) => void;
}

// 1. RISK BADGE COMPONENT
const RiskBadge = ({ level }: { level?: string }) => {
  switch (level) {
    case 'Recommended': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">SAFE</span>;
    case 'Advanced': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">ADVANCED</span>;
    case 'Expert': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">EXPERT</span>;
    case 'Unsafe': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">UNSAFE</span>;
    default: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">UNKNOWN</span>;
  }
};

// 2. VIRTUALIZED ROW COMPONENT
// This component receives data and index from react-window
const VirtualRow = memo(({ data, index, style }: any) => {
  const { apps, selectedApps, onToggle, onAction } = data;
  const app = apps[index];
  const isSelected = selectedApps.has(app.pkg);

  const isUninstalled = app.status === 'Uninstalled';
  const isDisabled = app.status === 'Disabled';
  const isEnabled = app.status === 'Enabled';

  // Note: We apply 'style' here to position the row absolutely
  return (
    <div style={style} className="px-1 pb-2"> {/* Add padding for gap effect */}
      <div
        className={`group relative flex flex-col p-4 rounded-xl border transition-all duration-200 h-full
          ${isSelected
            ? 'bg-accent/5 border-accent/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
            : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.07]'}
          ${isUninstalled ? 'opacity-60 grayscale-[0.5]' : ''}
        `}
      >
        <div className="flex items-start gap-4 h-full">
          {/* Checkbox */}
          <div className="pt-1">
            <button
              onClick={() => onToggle(app.pkg)}
              className={`w-5 h-5 rounded border flex items-center justify-center transition-all
                ${isSelected
                  ? 'bg-accent border-accent text-black'
                  : 'border-slate-600 hover:border-slate-400'}`}
            >
              {isSelected && <CheckCircle2 size={14} strokeWidth={3} />}
            </button>
          </div>

          {/* Icon & Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <RiskBadge level={app.uad?.removal} />
              {app.uad?.list && (
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                  {app.uad.list}
                </span>
              )}
              {/* Status Indicator */}
              <span className={`text-[10px] px-1.5 rounded border ${
                isUninstalled ? 'text-red-400 border-red-400/30 bg-red-400/10' :
                isDisabled ? 'text-amber-400 border-amber-400/30 bg-amber-400/10' :
                'text-blue-400 border-blue-400/30 bg-blue-400/10'
              }`}>
                {app.status}
              </span>
            </div>

            <h3 className={`font-mono text-sm truncate select-all ${isUninstalled ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
              {app.pkg}
            </h3>

            <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
              {app.uad?.description || "No description available."}
            </p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-1 self-start">

            {/* 1. RESTORE */}
            {isUninstalled && (
              <button
                onClick={() => onAction('restore', app.pkg)}
                className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 transition-colors"
                title="Restore / Re-install"
              >
                <RefreshCw size={18} />
              </button>
            )}

            {/* 2. ENABLE */}
            {isDisabled && (
              <button
                onClick={() => onAction('enable', app.pkg)}
                className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/20 transition-colors"
                title="Enable App"
              >
                <Power size={18} />
              </button>
            )}

            {/* 3. DISABLE */}
            {isEnabled && (
              <button
                onClick={() => onAction('disable', app.pkg)}
                className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 transition-colors"
                title="Disable App"
              >
                <EyeOff size={18} />
              </button>
            )}

            {/* 4. UNINSTALL */}
            {!isUninstalled && (
              <button
                onClick={() => onAction('uninstall', app.pkg)}
                className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 transition-colors"
                title="Uninstall"
              >
                <Trash2 size={18} />
              </button>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}, areEqual); // Use react-window's areEqual for performance

// 3. MAIN LIST COMPONENT
export const AppList = ({ apps, selectedApps, onToggle, onAction }: AppListProps) => {
  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <HelpCircle size={48} className="mb-4 opacity-20" />
        <p>No packages found matching criteria.</p>
      </div>
    );
  }

  return (
    // Height must be explicit for Virtualization. We use flex-1 to fill remaining space.
    <div className="flex-1 w-full h-full min-h-[0px]">
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            width={width}
            itemCount={apps.length}
            itemSize={110} // Fixed height for each card (pixels)
            itemData={{ apps, selectedApps, onToggle, onAction }} // Pass props to rows
            className="pb-24" // Extra padding at bottom for navbar
          >
            {VirtualRow}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};