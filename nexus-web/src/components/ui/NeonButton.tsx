import React from 'react';
import { LucideIcon } from 'lucide-react';

interface NeonButtonProps {
  onClick: (e: any) => void;
  active?: boolean;
  icon?: LucideIcon;
  label: string;
  color?: "green" | "cyan" | "red" | "gray";
  loading?: boolean;
  small?: boolean;
}

export const NeonButton = ({ onClick, active, icon: Icon, label, color = "green", loading = false, small=false }: NeonButtonProps) => {
  // New Pastel/Vibrant Gradient Mapping
  const colors: Record<string, string> = {
    green: "bg-green-100 text-green-700 hover:bg-green-200 border-green-200",
    cyan: "bg-cyan-100 text-cyan-700 hover:bg-cyan-200 border-cyan-200",
    red: "bg-red-100 text-red-700 hover:bg-red-200 border-red-200",
    gray: "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200"
  };

  const activeColors: Record<string, string> = {
     green: "bg-green-400 text-white shadow-green-200 shadow-lg border-green-400",
     cyan: "bg-cyan-400 text-white shadow-cyan-200 shadow-lg border-cyan-400",
     red: "bg-red-400 text-white shadow-red-200 shadow-lg border-red-400",
     gray: "bg-slate-700 text-white shadow-slate-200 shadow-lg border-slate-700"
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`
        relative overflow-hidden group
        ${small ? 'p-2 rounded-2xl' : 'w-full py-4 px-6 rounded-3xl'}
        text-sm font-bold tracking-wide
        transition-all duration-200 active:scale-95
        border
        ${active
            ? activeColors[color]
            : colors[color]
        }
        ${loading ? 'opacity-80 cursor-wait' : ''}
      `}
    >
      <div className="flex items-center justify-center space-x-2 relative z-10">
        {loading ? (
          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
        ) : (
          <>
            {Icon && <Icon size={small ? 18 : 20} strokeWidth={2.5} />}
            {!small && <span>{label}</span>}
          </>
        )}
      </div>
    </button>
  );
};