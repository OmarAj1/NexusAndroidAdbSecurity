import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  borderColor?: "white" | "purple" | "green" | "red" | "amber" | "cyan";
  isDark?: boolean; // New prop for dark mode
}

export const GlassCard = ({ children, className = "", borderColor = "white", isDark = false }: GlassCardProps) => {
  // Styles for LIGHT mode
  const lightColors: Record<string, string> = {
    white: "border-slate-200",
    purple: "border-purple-200 bg-purple-50/50",
    green: "border-green-200 bg-green-50/50",
    red: "border-red-200 bg-red-50/50",
    amber: "border-amber-200 bg-amber-50/50",
    cyan: "border-cyan-200 bg-cyan-50/50"
  };

  // Styles for DARK mode
  const darkColors: Record<string, string> = {
    white: "border-white/10 bg-slate-800/50",
    purple: "border-purple-500/20 bg-purple-900/20",
    green: "border-green-500/20 bg-green-900/20",
    red: "border-red-500/20 bg-red-900/20",
    amber: "border-amber-500/20 bg-amber-900/20",
    cyan: "border-cyan-500/20 bg-cyan-900/20"
  };

  const selectedColors = isDark ? darkColors : lightColors;

  return (
    <div
      className={`
        relative rounded-3xl p-6 shadow-sm
        backdrop-blur-md border transition-all duration-300
        ${isDark ? 'bg-[#0f172a]/80 shadow-black/20 text-white' : 'bg-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-slate-700'}
        ${selectedColors[borderColor] || selectedColors.white}
        ${className}
      `}
    >
      {children}
    </div>
  );
};