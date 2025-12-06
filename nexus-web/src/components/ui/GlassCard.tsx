import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  borderColor?: "white" | "purple" | "cyan" | "danger" | "amber";
  isDark?: boolean; // Kept for API compatibility, but effectively ignored in Void theme
}

export const GlassCard = ({ children, className = "", borderColor = "white" }: GlassCardProps) => {

  // Mapping border colors to our new Tailwind Palette
  const borderStyles = {
    white:  "border-white/5",
    purple: "border-accent/30 bg-accent/5",
    cyan:   "border-safe/30 bg-safe/5",
    danger: "border-danger/30 bg-danger/5",
    amber:  "border-amber-500/30 bg-amber-500/5"
  };

  return (
    <div
      className={`
        relative rounded-2xl p-5
        bg-surface backdrop-blur-xl border
        shadow-lg shadow-black/20
        transition-all duration-300
        ${borderStyles[borderColor] || borderStyles.white}
        ${className}
      `}
    >
      {children}
    </div>
  );
};