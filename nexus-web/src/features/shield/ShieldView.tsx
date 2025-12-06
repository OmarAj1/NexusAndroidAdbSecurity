import React from 'react';
import { Power, ShieldCheck, Globe, Activity } from 'lucide-react';

export const ShieldView = ({ isActive, onToggle }: { isActive: boolean, onToggle: () => void }) => {
  const statusColor = isActive ? 'text-safe' : 'text-slate-500';
  const statusBorder = isActive ? 'border-safe shadow-[0_0_30px_rgba(6,182,212,0.2)]' : 'border-surface';

  return (
    <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* HEADER */}
      <div className="w-full mb-8">
        <h1 className="text-3xl font-bold text-white">Shield</h1>
        <p className="text-slate-400 text-sm">System Protection</p>
      </div>

      {/* MAIN TOGGLE BUTTON */}
      <div className="relative mb-10 group">
         {/* Glow Effect */}
         <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700 ${isActive ? 'bg-safe/20' : 'bg-transparent'}`} />

         <button
            onClick={onToggle}
            className={`relative w-48 h-48 rounded-full border-[3px] flex flex-col items-center justify-center bg-void transition-all duration-300 active:scale-95 ${statusBorder}`}
         >
            <Power size={48} className={`mb-2 transition-colors duration-300 ${statusColor}`} />
            <span className={`text-xs font-bold tracking-widest ${isActive ? 'text-safe' : 'text-slate-600'}`}>
                {isActive ? 'ACTIVE' : 'OFF'}
            </span>
         </button>
      </div>

      <div className="text-center mb-8">
          <h2 className={`text-xl font-bold transition-colors ${isActive ? 'text-white' : 'text-slate-500'}`}>
              {isActive ? 'System Secured' : 'Protection Disabled'}
          </h2>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <StatCard
            icon={Globe}
            label="Region"
            value={isActive ? "Nexus-1" : "---"}
            active={isActive}
        />
        <StatCard
            icon={Activity}
            label="Protocol"
            value="ADB-SEC"
            active={isActive}
        />
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, active }: any) => (
  <div className="bg-surface rounded-2xl p-4 flex flex-col items-start border border-white/5">
     <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={active ? 'text-safe' : 'text-slate-600'} />
        <span className="text-[10px] uppercase text-slate-500 font-bold">{label}</span>
     </div>
     <span className="text-lg font-mono font-semibold text-slate-200">{value}</span>
  </div>
);