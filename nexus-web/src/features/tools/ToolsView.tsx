import React from 'react';
import { useTools } from './useTools';

interface ToolsViewProps {
  executeCommand: (command: string) => Promise<string>;
}

export const ToolsView: React.FC<ToolsViewProps> = ({ executeCommand }) => {
  // Use our new custom hook for logic
  const { tools, runTool, loadingId } = useTools(executeCommand);

  return (
    <div className="h-full w-full p-4 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="mb-3 px-1 shrink-0">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Tools</h1>
        <p className="text-slate-500 text-xs">Quick actions for your device.</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 pb-20 overflow-y-auto">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => runTool(tool.id, tool.cmd)}
            disabled={loadingId !== null}
            className={`
              relative group
              flex flex-col justify-center
              min-h-[90px]
              bg-white dark:bg-white/5
              border border-slate-200 dark:border-white/5
              rounded-xl p-3
              text-left transition-all duration-200
              hover:border-slate-300 dark:hover:border-white/20
              hover:shadow-lg dark:hover:shadow-none
              active:scale-[0.98]
              ${loadingId === tool.id ? 'opacity-70' : 'opacity-100'}
            `}
          >
            {/* Loading Spinner Overlay */}
            {loadingId === tool.id && (
              <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-10 rounded-xl">
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-lg shrink-0 ${tool.bg} ${tool.color}`}>
                <tool.icon size={22} />
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight">
                  {tool.title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-1 opacity-90">
                  {tool.desc}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};