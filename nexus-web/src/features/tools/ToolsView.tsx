import React, { useState } from 'react';
import { Zap, EyeOff, Wind, Layers, Smartphone, Activity, Ghost, Trash2, Power } from 'lucide-react';

export const ToolsView = ({ tools }: any) => {
  // Local State tracking (Defaults to false since we can't easily read system state yet)
  const [isHyperSpeed, setHyperSpeed] = useState(false);
  const [isFocusMode, setFocusMode] = useState(false);
  const [isSensorsBlocked, setSensorsBlocked] = useState(false);

  // Handlers
  const toggleSpeed = () => {
    const newState = !isHyperSpeed;
    setHyperSpeed(newState);
    tools.setAnimationSpeed(newState ? 0.5 : 1.0);
  };

  const toggleFocus = () => {
    const newState = !isFocusMode;
    setFocusMode(newState);
    tools.toggleMonochrome(newState);
  };

  const toggleSensors = () => {
    const newState = !isSensorsBlocked;
    setSensorsBlocked(newState);
    tools.toggleSensors(newState);
  };

  return (
    <div className="flex flex-col gap-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* HEADER */}
      <div className="px-2">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Tools</h1>
        <p className="text-slate-500 text-sm">System Overdrive & Privacy Protocols</p>
      </div>

      {/* SECTION 1: OVERDRIVE (Performance) */}
      <div className="space-y-3">
        <SectionHeader title="OVERDRIVE" icon={Zap} color="text-accent" />

        <div className="grid grid-cols-1 gap-3">
            {/* HYPER SPEED TOGGLE */}
            <ToolToggle
                icon={Wind}
                title="Hyper-Speed"
                desc="Set system animations to 0.5x."
                isActive={isHyperSpeed}
                onToggle={toggleSpeed}
                activeLabel="ENGAGED"
                inactiveLabel="NORMAL"
                variant="accent"
            />

            {/* DPI SHIFT */}
            <div className="bg-white dark:bg-surface rounded-xl p-4 border border-slate-200 dark:border-white/5 shadow-sm">
                <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><Layers size={20} /></div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-200">Quantum Density</h3>
                        <p className="text-xs text-slate-500">Modify UI scaling (DPI).</p>
                    </div>
                </div>
                <div className="flex gap-2">
                     <button onClick={() => tools.setDpi('reset')} className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-white/5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10">DEFAULT</button>
                     <button onClick={() => tools.setDpi('480')} className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-white/5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10">HIGH RES</button>
                </div>
            </div>
        </div>
      </div>

      {/* SECTION 2: GHOST (Privacy) */}
      <div className="space-y-3 mt-4">
        <SectionHeader title="GHOST PROTOCOL" icon={Ghost} color="text-danger" />

        <div className="grid grid-cols-1 gap-3">
             {/* FOCUS MODE TOGGLE */}
             <ToolToggle
                icon={EyeOff}
                title="Focus Mode"
                desc="Force system-wide monochrome."
                isActive={isFocusMode}
                onToggle={toggleFocus}
                activeLabel="ACTIVE"
                inactiveLabel="OFF"
                variant="danger"
            />

            {/* SENSORS TOGGLE */}
            <ToolToggle
                icon={Activity}
                title="Sensors Lock"
                desc="Block Camera & Microphone."
                isActive={isSensorsBlocked}
                onToggle={toggleSensors}
                activeLabel="LOCKED"
                inactiveLabel="OPEN"
                variant="danger"
            />

            {/* KILL BACKGROUND (Trigger Only) */}
            <div className="bg-white dark:bg-surface rounded-xl p-4 border border-slate-200 dark:border-white/5 shadow-sm flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
               <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-500/10 text-slate-500"><Trash2 size={20} /></div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-200">Kill Background</h3>
                        <p className="text-xs text-slate-500">Terminate background apps.</p>
                    </div>
               </div>
               <button
                onClick={() => tools.killBackground()}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-[10px] font-bold tracking-wider active:scale-95"
               >
                EXECUTE
               </button>
            </div>

        </div>
      </div>

    </div>
  );
};

// --- SUB COMPONENTS ---

const SectionHeader = ({ title, icon: Icon, color }: any) => (
    <div className="flex items-center gap-2 px-2 pb-1 border-b border-slate-200 dark:border-white/5">
        <Icon size={14} className={color} />
        <span className={`text-[10px] font-bold tracking-widest ${color}`}>{title}</span>
    </div>
);

const ToolToggle = ({ icon: Icon, title, desc, isActive, onToggle, activeLabel, inactiveLabel, variant }: any) => {
    const isDanger = variant === 'danger';

    // Dynamic Styles based on Active State
    const activeBg = isDanger ? 'bg-danger text-white' : 'bg-accent text-white';
    const inactiveBg = 'bg-slate-100 dark:bg-white/5 text-slate-500';

    const iconColor = isActive
        ? (isDanger ? 'text-danger' : 'text-accent')
        : 'text-slate-400';

    const iconBg = isActive
        ? (isDanger ? 'bg-danger/10' : 'bg-accent/10')
        : 'bg-slate-100 dark:bg-white/5';

    return (
        <div className={`bg-white dark:bg-surface rounded-xl p-4 border transition-all duration-300 flex items-center justify-between ${isActive ? 'border-slate-300 dark:border-white/20' : 'border-slate-200 dark:border-white/5 shadow-sm'}`}>
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors duration-300 ${iconBg} ${iconColor}`}>
                    <Icon size={20} />
                </div>
                <div>
                    <h3 className={`font-bold transition-colors ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{title}</h3>
                    <p className="text-xs text-slate-500 max-w-[180px]">{desc}</p>
                </div>
            </div>
            <button
                onClick={onToggle}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold tracking-wider transition-all duration-300 active:scale-95 flex items-center gap-2 ${isActive ? activeBg : inactiveBg}`}
            >
                {isActive && <Power size={12} strokeWidth={3} />}
                {isActive ? activeLabel : inactiveLabel}
            </button>
        </div>
    );
};