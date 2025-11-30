import React from 'react';
import {
  Shield, Smartphone, Brain, User as UserIcon, Plus, Minus,
  ChevronRight, Download, Trash2, Power, Zap, Filter, RotateCcw
} from 'lucide-react';

// --- Native Utilities ---
const NATIVE_INTERFACE: any = (window as any).AndroidNative;

export const isNative = () => typeof NATIVE_INTERFACE !== 'undefined';

export const triggerHaptic = (type: 'light' | 'heavy' | 'success' = 'light') => {
  if (isNative()) {
    NATIVE_INTERFACE.hapticFeedback(type);
  }
};

export const showToast = (msg: string) => {
  if (isNative()) {
    NATIVE_INTERFACE.showToast(msg);
  } else {
    console.log(`[Toast] ${msg}`);
  }
};

export const shareData = (title: string, content: string) => {
  if (isNative()) {
    NATIVE_INTERFACE.shareText(title, content);
  } else {
    console.log(`[Share] ${title}:`, content);
    console.log(`Simulated Export:\n${content.substring(0, 100)}...`);
  }
};

// --- Modern Components ---

// GlassCard component adapted to user's style
export const GlassCard = ({ children, className = "", highlight = false, borderColor = "white" }: any) => {
  const borderColors: any = {
    white: "border-white/[0.05]",
    purple: "border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.1)]",
    green: "border-green-500/10 shadow-[0_0_30px_rgba(74,222,128,0.05)]",
    red: "border-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.05)]",
    amber: "border-amber-500/10 shadow-[0_0_30px_rgba(245,158,11,0.05)]",
    cyan: "border-cyan-500/10 shadow-[0_0_40px_rgba(6,182,212,0.1)]", // Adjusted shadow for cyan theme
    gray: "border-gray-500/10 shadow-[0_0_10px_rgba(107,114,128,0.05)]"
  };

  return (
    <div className={`backdrop-blur-xl bg-[#0f172a]/80 rounded-xl p-5 border ${borderColors[borderColor] || borderColors.white} shadow-2xl ${className}`}>
      {children}
    </div>
  );
};


// Badge component extracted and adapted from user's PurgeScreen code
export const Badge = ({ text }: { text: string }) => {
  const styles: any = {
    System: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    User: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    Enabled: "bg-green-500/20 text-green-300 border-green-500/30",
    Disabled: "bg-red-500/20 text-red-300 border-red-500/30",
    Unknown: "bg-gray-500/20 text-gray-400 border-gray-500/30"
  };
  const colorClass = styles[text] || styles.Unknown;

  return (
    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${colorClass}`}>
      {text}
    </span>
  );
};

// NeonButton component (retained from previous refactoring, updated imports)
export const NeonButton = ({ onClick, active, icon: Icon, label, color = "green", loading = false, size = "md", fullWidth = true }: any) => {
  const colors: any = {
    green: "from-green-500/90 to-emerald-600/90 shadow-green-500/20",
    red: "from-red-500/90 to-rose-600/90 shadow-red-500/20",
    blue: "from-blue-500/90 to-indigo-600/90 shadow-blue-500/20",
    purple: "from-purple-500/90 to-violet-600/90 shadow-purple-500/20",
    amber: "from-amber-500/90 to-orange-600/90 shadow-amber-500/20",
    cyan: "from-cyan-500/90 to-blue-600/90 shadow-cyan-500/20",
    gray: "from-gray-700/90 to-gray-800/90 shadow-gray-500/10"
  };

  const pad = size === "sm" ? "py-2 px-3 text-xs" : "py-4 px-4 text-sm";
  const widthClass = fullWidth ? "w-full" : "w-auto";

  const handleClick = (e: any) => {
    triggerHaptic('light');
    onClick(e);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`relative overflow-hidden group ${widthClass} ${pad} rounded-xl font-medium tracking-wide transition-all duration-300 transform active:scale-[0.98]
        ${active
          ? `bg-gradient-to-r ${colors[color]} shadow-lg text-white ring-1 ring-white/20`
          : 'bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-gray-400 hover:text-white'}
        ${loading ? 'opacity-80 cursor-wait' : ''}`}
    >
      <div className="flex items-center justify-center space-x-2 relative z-10">
        {loading ? (
          <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
        ) : (
          <>
            {Icon && <Icon size={size === "sm" ? 14 : 18} strokeWidth={2} className={active ? "text-white" : "opacity-70 group-hover:opacity-100"} />}
            <span>{label}</span>
          </>
        )}
      </div>
    </button>
  );
};


// TabBar component (retained)
export const TabBar = ({ active, onChange }: { active: string, onChange: (id: string) => void }) => {
    const handleTabChange = (id: string) => {
        triggerHaptic('light');
        onChange(id);
    };

    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="absolute bottom-0 w-full h-48 bg-gradient-to-t from-[#020617] via-[#020617]/95 to-transparent" />

        <div className="pointer-events-auto relative flex justify-center pb-6 pt-2">
          <div className="flex items-center p-1.5 rounded-full bg-[#0f172a]/80 backdrop-blur-2xl border border-white/[0.1] shadow-2xl">
            {[
              { id: 'purge', icon: Smartphone, label: 'Purge' },
              { id: 'shield', icon: Shield, label: 'Shield' },
              { id: 'insights', icon: Brain, label: 'Insights' },
              { id: 'user', icon: UserIcon, label: 'Profile' }
            ].map((tab) => {
              const isActive = active === tab.id;

              let activeStyles = '';
              if (tab.id === 'purge') activeStyles = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20';
              if (tab.id === 'shield') activeStyles = 'bg-blue-500/20 text-blue-400 border-blue-500/20';
              if (tab.id === 'insights') activeStyles = 'bg-purple-500/20 text-purple-400 border-purple-500/20';
              if (tab.id === 'user') activeStyles = 'bg-amber-500/20 text-amber-400 border-amber-500/20';

              const inactiveStyles = 'text-gray-500 hover:text-gray-300 border-transparent';

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    relative flex items-center justify-center rounded-full transition-all duration-300
                    border px-5 py-3.5
                    ${isActive ? activeStyles : inactiveStyles}
                  `}
                >
                  <tab.icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`transition-transform duration-300 ${isActive ? 'scale-100' : 'scale-90 opacity-70'}`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
};