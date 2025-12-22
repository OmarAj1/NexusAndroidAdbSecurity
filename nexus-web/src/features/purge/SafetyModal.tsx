import React from 'react';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';
import { UadAppDefinition } from '../../data/uadApps';

interface SafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  app?: UadAppDefinition;
  pkg: string;
  action: string;
}

export const SafetyModal = ({ isOpen, onClose, onConfirm, app, pkg, action }: SafetyModalProps) => {
  if (!isOpen) return null;

  // Determine Severity
  const level = app?.removal || 'Unknown';
  const isDangerous = level === 'Unsafe' || level === 'Expert';
  const isSafe = level === 'Recommended';

  // Dynamic Styles based on Risk Level
  const colorClass = isDangerous ? 'text-rose-500' : isSafe ? 'text-emerald-400' : 'text-amber-400';
  const borderClass = isDangerous ? 'border-rose-500/30' : isSafe ? 'border-emerald-500/30' : 'border-amber-500/30';
  const bgClass = isDangerous ? 'bg-rose-500/10' : isSafe ? 'bg-emerald-500/10' : 'bg-amber-500/10';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-md mx-4 bg-[#0a0a0a] border ${borderClass} rounded-2xl shadow-2xl overflow-hidden scale-100`}>

        {/* Header */}
        <div className={`px-6 py-4 flex items-center gap-3 ${bgClass} border-b ${borderClass}`}>
          {isDangerous ? <ShieldAlert className={colorClass} size={24} /> : <AlertTriangle className={colorClass} size={24} />}
          <h3 className={`text-lg font-bold tracking-wide ${colorClass}`}>
            {action === 'uninstall' ? 'CONFIRM REMOVAL' : 'CONFIRM ACTION'}
          </h3>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-slate-500">PACKAGE</span>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${borderClass} ${colorClass} ${bgClass}`}>
                {level}
              </span>
            </div>
            <p className="font-mono text-sm text-slate-200 break-all select-all bg-white/5 p-2 rounded">
              {pkg}
            </p>
          </div>

          <div>
            <span className="text-xs font-mono text-slate-500">DESCRIPTION</span>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed max-h-32 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
              {app?.description || "No description available. Proceed with caution."}
            </p>
          </div>

          {isDangerous && (
            <div className="p-3 rounded bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs flex gap-2 items-start">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <p>
                <strong>WARNING:</strong> This package is marked as <strong>{level}</strong>.
                Removing it may cause bootloops, crashes, or feature loss.
                Only proceed if you know exactly what you are doing.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white/5 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-bold text-black shadow-lg transition-all active:scale-95
              ${isDangerous
                ? 'bg-rose-500 hover:bg-rose-400 shadow-rose-500/20'
                : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20'}`}
          >
            {action === 'uninstall' ? 'Uninstall' : 'Confirm'}
          </button>
        </div>

      </div>
    </div>
  );
};