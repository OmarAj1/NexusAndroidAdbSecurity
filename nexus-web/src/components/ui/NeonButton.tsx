import React from 'react';
import { LucideIcon } from 'lucide-react';

interface NeonButtonProps {
  onClick: (e: any) => void;
  active?: boolean;
  icon?: LucideIcon;
  label: string;
  color?: "safe" | "accent" | "danger" | "void"; // Updated types
  loading?: boolean;
}

export const NeonButton = ({ onClick, active, icon: Icon, label, color = "safe", loading = false }: NeonButtonProps) => {

  // Tailwind class mapping based on new config
  const styles = {
    safe:   "bg-safe/10 text-safe border-safe/20 hover:bg-safe/20",
    accent: "bg-accent/10 text-accent border-accent/20 hover:bg-accent/20",
    danger: "bg-danger/10 text-danger border-danger/20 hover:bg-danger/20",
    void:   "bg-surface text-slate-400 border-white/5 hover:bg-white/5"
  };

  const activeStyles = {
    safe:   "bg-safe text-white border-safe shadow-[0_0_20px_rgba(6,182,212,0.4)]",
    accent: "bg-accent text-white border-accent shadow-[0_0_20px_rgba(139,92,246,0.4)]",
    danger: "bg-danger text-white border-danger shadow-[0_0_20px_rgba(239,68,68,0.4)]",
    void:   "bg-white text-black border-white"
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`
        relative w-full py-4 px-6 rounded-2xl
        flex items-center justify-center gap-2
        text-sm font-bold tracking-wide border
        transition-all duration-200 active:scale-95
        ${active ? activeStyles[color] : styles[color]}
        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
        {loading && <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />}
        {Icon && <Icon size={18} />}
        <span>{label}</span>
    </button>
  );
};