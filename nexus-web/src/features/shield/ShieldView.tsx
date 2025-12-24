import React from 'react';
import { Power, ShieldCheck, Globe, Activity, Terminal } from 'lucide-react';

export const ShieldView = ({ isActive, onToggle, logs = [] }: any) => {
  const statusColor = isActive ? 'text-safe' : 'text-muted';
  const statusBorder = isActive ? 'border-safe shadow-[0_0_30px_rgba(6,182,212,0.2)]' : 'border-border';

  return (
    <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-md mx-auto">

      {/* HEADER */}
      <div className="w-full mb-8 text-center">
        <h1 className="text-3xl font-bold text-body">Shield</h1>
        <p className="text-muted text-sm">Active Threat Mitigation</p>
      </div>

      {/* MAIN TOGGLE BUTTON */}
      <div className="relative mb-8 group">
         {/* Glow Effect */}
         <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700 ${isActive ? 'bg-safe/20' : 'bg-transparent'}`} />

         <button
            onClick={onToggle}
            className={`
                relative w-48 h-48 rounded-full border-[3px]
                flex flex-col items-center justify-center
                bg-card transition-all duration-300 active:scale-95
                ${statusBorder}
            `}
         >
            <Power size={48} className={`mb-2 transition-colors duration-300 ${statusColor}`} />
            <span className={`text-xs font-bold tracking-widest ${isActive ? 'text-safe' : 'text-muted'}`}>
                {isActive ? 'ARMED' : 'DISARMED'}
            </span>
         </button>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 gap-3 w-full mb-6 px-4">
        <StatCard
            icon={Globe}
            label="Network"
            value={isActive ? "Protected" : "Exposed"}
            active={isActive}
        />
        <StatCard
            icon={Activity}
            label="Threats"
            value={logs.length.toString()}
            active={isActive}
        />
      </div>

      {/* LIVE ATTACK LOG */}
      <div className="w-full px-4 mb-24">
        <div className="bg-input rounded-xl border border-border overflow-hidden flex flex-col h-48 shadow-lg">
            {/* Terminal Header */}
            <div className="bg-card px-3 py-2 flex items-center gap-2 border-b border-border">
                <Terminal size={12} className="text-muted" />
                <span className="text-[10px] font-mono text-muted uppercase tracking-wider">Live Threat Interception</span>
            </div>

            {/* Log Content */}
            <div className="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-1 scrollbar-thin scrollbar-thumb-border">
                {logs.length === 0 ? (
                    <div className="text-muted italic text-center mt-8">No active threats detected...</div>
                ) : (
                    logs.map((log: any, i: number) => (
                        <div key={i} className="flex gap-3 animate-in slide-in-from-left-2 duration-300">
                            <span className="text-muted">[{log.time}]</span>
                            <span className="text-danger font-bold">BLOCKED</span>
                            <span className="text-body truncate">{log.domain}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>

    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, active }: any) => (
  <div className="bg-card rounded-2xl p-4 flex flex-col items-start border border-border shadow-sm">
     <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={active ? 'text-safe' : 'text-muted'} />
        <span className="text-[10px] uppercase text-muted font-bold">{label}</span>
     </div>
     <span className="text-lg font-mono font-semibold text-body">{value}</span>
  </div>
);