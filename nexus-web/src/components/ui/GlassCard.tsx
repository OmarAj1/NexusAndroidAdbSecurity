import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  borderColor?: "default" | "accent" | "safe" | "danger" | "amber";
}

export const GlassCard = ({ children, className = "", borderColor = "default" }: GlassCardProps) => {

  const borderStyles = {
    default: "border-border bg-card",
    accent:  "border-accent/30 bg-accent/5",
    safe:    "border-safe/30 bg-safe/5",
    danger:  "border-danger/30 bg-danger/5",
    amber:   "border-amber-500/30 bg-amber-500/5"
  };

  return (
    <div
      className={`
        relative rounded-2xl p-5
        backdrop-blur-xl border
        shadow-lg shadow-black/5
        transition-all duration-300
        ${borderStyles[borderColor]}
        ${className}
      `}
    >
      {children}
    </div>
  );
};