import React from 'react';

export interface ThemeConfig {
  accentColor: string;
  darkColor: string;
  bgColor: string; // Added background color to theme config
  particles: string[];
}

export const AtmosphericBackground = React.memo(({ theme }: { theme: ThemeConfig }) => {
  const style = {
    '--accent': theme.accentColor,
    '--dark': theme.darkColor,
    '--bg-color': theme.bgColor,
  } as React.CSSProperties;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[var(--bg-color)] transition-colors duration-500" style={style}>

      {/* CUTE FLOATING BLOBS (CSS Animation) */}
      <div
        className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] rounded-full opacity-60 mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob"
        style={{ backgroundColor: 'var(--accent)' }}
      />

      <div
        className="absolute bottom-[-20%] right-[-20%] w-[80vw] h-[80vw] rounded-full opacity-60 mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"
        style={{ backgroundColor: 'var(--dark)' }}
      />

      <div
        className="absolute top-[40%] left-[30%] w-[60vw] h-[60vw] rounded-full opacity-40 mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-4000"
        style={{ backgroundColor: theme.bgColor === '#fdfbf7' ? '#e0f2fe' : '#1e293b' }}
      />

      {/* Subtle Pattern (Polka Dots) */}
      <div className="absolute inset-0 opacity-[0.03]"
           style={{
               backgroundImage: `radial-gradient(${theme.bgColor === '#fdfbf7' ? '#000' : '#fff'} 1px, transparent 1px)`,
               backgroundSize: '24px 24px'
           }}
      />
    </div>
  );
});