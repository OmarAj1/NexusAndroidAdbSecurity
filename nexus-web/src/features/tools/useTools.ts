import { useState } from 'react';
import { TOOLS_DATA } from './toolsData';

export const useTools = (executeCommand: (cmd: string) => Promise<string>) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const runTool = async (id: string, command: string) => {
    // 1. Set Loading State
    setLoadingId(id);

    try {
      console.log(`[Tools] Executing: ${id} -> ${command}`);

      // 2. Check if bridge is available (Frontend Check)
      if (!(window as any).AndroidNative) {
        console.warn("Native Bridge NOT detected. Are you in the browser?");
      }

      // 3. Execute
      await executeCommand(command);

    } catch (error) {
      console.error(`[Tools] Error running ${id}:`, error);
    } finally {
      // 4. Clear Loading after delay
      setTimeout(() => setLoadingId(null), 600);
    }
  };

  return {
    tools: TOOLS_DATA,
    runTool,
    loadingId
  };
};