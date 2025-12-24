import React, { useEffect } from 'react';
import { useTools } from './useTools';
import { useNativeBridge } from '../../hooks/useNativeBridge';
import {
  Zap, Trash2, Ghost, Lock, Unlock, Layers
} from 'lucide-react';

interface ToolsViewProps {
  executeCommand: (command: string) => Promise<string>;
}

export const ToolsView: React.FC<ToolsViewProps> = ({ executeCommand }) => {
  const { runTool, loadingId } = useTools(executeCommand);
  const { toolStats, actions } = useNativeBridge();

  useEffect(() => {
    actions.refreshStats();
    const interval = setInterval(actions.refreshStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full w-full p-4 flex flex-col animate-in fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-body">System Tools</h1>
        <p className="text-muted text-xs">Live Status & Controls</p>
      </div>

      <div className="grid grid-cols-2 gap-3 pb-20 overflow-y-auto">

        <ToolCard
            title="Clean Storage"
            desc={`Available: ${toolStats.storage}`}
            icon={Trash2}
            color="text-danger"
            bg="bg-danger/10"
            isLoading={loadingId === 'clean'}
            onClick={() => runTool('clean', 'pm trim-caches 999G')}
        />

        <ToolCard
            title="Ghost Mode"
            desc={toolStats.ghost ? "State: Monochrome" : "State: Normal"}
            icon={Ghost}
            color={toolStats.ghost ? "text-body" : "text-muted"}
            bg={toolStats.ghost ? "bg-card" : "bg-input"}
            isLoading={loadingId === 'ghost'}
            onClick={() => {
                runTool('ghost', 'toggle_ghost');
                setTimeout(actions.refreshStats, 500);
            }}
        />

        <ToolCard
            title="Sensors & Cam"
            desc={toolStats.privacy ? "Blocked (Secure)" : "Allowed (Open)"}
            icon={toolStats.privacy ? Lock : Unlock}
            color={toolStats.privacy ? "text-safe" : "text-amber-500"}
            bg={toolStats.privacy ? "bg-safe/10" : "bg-amber-500/10"}
            isLoading={loadingId === 'privacy'}
            onClick={() => {
                runTool('privacy', 'toggle_privacy');
                setTimeout(actions.refreshStats, 500);
            }}
        />

        <ToolCard
            title="Close Apps"
            desc={`Active Tasks: ${toolStats.tasks}`}
            icon={Layers}
            color="text-blue-500"
            bg="bg-blue-500/10"
            isLoading={loadingId === 'kill'}
            onClick={() => {
                 runTool('kill', 'am kill-all');
                 setTimeout(actions.refreshStats, 1000);
            }}
        />

         <ToolCard
            title="Speed Up"
            desc="Set animations to 0.5x"
            icon={Zap}
            color="text-amber-500"
            bg="bg-amber-500/10"
            isLoading={loadingId === 'speed'}
            onClick={() => runTool('speed', 'settings put global window_animation_scale 0.5')}
        />

      </div>
    </div>
  );
};

const ToolCard = ({ title, desc, icon: Icon, color, bg, onClick, isLoading }: any) => (
  <button
    onClick={onClick}
    disabled={isLoading}
    className={`
      relative group flex flex-col justify-between min-h-[110px]
      bg-card border border-border
      rounded-xl p-4 text-left transition-all duration-200
      hover:shadow-lg active:scale-[0.98]
      ${isLoading ? 'opacity-70' : 'opacity-100'}
    `}
  >
    {isLoading && (
       <div className="absolute inset-0 flex items-center justify-center bg-card/50 rounded-xl">
         <div className="w-5 h-5 border-2 border-muted border-t-transparent rounded-full animate-spin"/>
       </div>
    )}

    <div className={`p-2 w-fit rounded-lg ${bg} ${color} mb-2`}>
      <Icon size={24} />
    </div>

    <div>
      <h3 className="font-bold text-body">{title}</h3>
      <p className="text-xs text-muted font-mono mt-1">{desc}</p>
    </div>
  </button>
);