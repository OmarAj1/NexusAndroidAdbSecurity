import React, { useState, useEffect, useRef } from 'react';

// --- Inline Icons (No Dependencies) ---
const TerminalIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="4 17 10 11 4 5"></polyline>
    <line x1="12" y1="19" x2="20" y2="19"></line>
  </svg>
);

const ShieldAlertIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

const PowerIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
    <line x1="12" y1="2" x2="12" y2="12"></line>
  </svg>
);

const CpuIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
    <rect x="9" y="9" width="6" height="6"></rect>
    <line x1="9" y1="1" x2="9" y2="4"></line>
    <line x1="15" y1="1" x2="15" y2="4"></line>
    <line x1="9" y1="20" x2="9" y2="23"></line>
    <line x1="15" y1="20" x2="15" y2="23"></line>
    <line x1="20" y1="9" x2="23" y2="9"></line>
    <line x1="20" y1="14" x2="23" y2="14"></line>
    <line x1="1" y1="9" x2="4" y2="9"></line>
    <line x1="1" y1="14" x2="4" y2="14"></line>
  </svg>
);

export default function PurgeViewShell() {
  const [isConnected, setIsConnected] = useState(false);
  const [bootSequence, setBootSequence] = useState(false);

  // Initial state checks session storage to see if we should restore history
  const [terminalLines, setTerminalLines] = useState(() => {
    const saved = sessionStorage.getItem('pv_shell_history');
    return saved ? JSON.parse(saved) : [
      { text: "PurgeView Systems v4.0.1", type: "system" },
      { text: "Secure environment ready.", type: "success" }
    ];
  });

  const [input, setInput] = useState("");
  const [lastPurgeReason, setLastPurgeReason] = useState(null);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  // --- PERSISTENCE LOGIC ---
  useEffect(() => {
    // Check for active session on mount
    const sessionActive = sessionStorage.getItem('pv_shell_active');
    if (sessionActive === 'true') {
      setIsConnected(true);
    }
  }, []);

  // Save history whenever it changes
  useEffect(() => {
    if (isConnected) {
      sessionStorage.setItem('pv_shell_history', JSON.stringify(terminalLines));
    }
  }, [terminalLines, isConnected]);

  // --- CORE FUNCTIONS ---

  const connect = () => {
    setBootSequence(true);
    setLastPurgeReason(null);

    // Fake boot delay
    setTimeout(() => {
      setIsConnected(true);
      sessionStorage.setItem('pv_shell_active', 'true'); // MARK SESSION AS ACTIVE

      const newLines = [
        { text: "PurgeView Environment Loaded.", type: "system" },
        { text: "Identity Verified.", type: "success" },
        { text: "Type 'help' for commands.", type: "info" }
      ];
      setTerminalLines(newLines);
      setBootSequence(false);
    }, 1500);
  };

  const purgeSession = (reason) => {
    setIsConnected(false);
    setBootSequence(false);
    setLastPurgeReason(reason);
    sessionStorage.removeItem('pv_shell_active'); // CLEAR SESSION
    sessionStorage.removeItem('pv_shell_history');
    console.log("Session purged:", reason);
  };

  const handleCommand = (e) => {
    if (e.key === 'Enter') {
      const cmd = input.trim().toLowerCase();
      const newLines = [...terminalLines, { text: `> ${input}`, type: "user" }];

      let response = { text: `Command not found: ${cmd}`, type: "error" };

      if (cmd === 'help') {
        response = { text: "Available commands: clear, status, disconnect, purge", type: "info" };
      } else if (cmd === 'clear') {
        setTerminalLines([]);
        setInput("");
        return;
      } else if (cmd === 'status') {
        response = { text: "Connection: PERSISTENT | Encryption: AES-256 | Purge: MANUAL-ONLY", type: "success" };
      } else if (cmd === 'disconnect' || cmd === 'purge') {
        purgeSession("USER_INITIATED");
        return;
      } else if (cmd === '') {
        response = null;
      }

      if (response) newLines.push(response);

      setTerminalLines(newLines);
      setInput("");
    }
  };

  // Auto-scroll terminal
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLines, isConnected]);

  // Focus input on click
  const focusInput = () => {
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono overflow-hidden selection:bg-green-900 selection:text-white">
      {/* CRT Scanline Effect */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20"></div>

      {/* Main Container */}
      <div className="relative z-10 h-screen flex flex-col">

        {/* Header */}
        <header className="border-b border-green-900 p-4 flex justify-between items-center bg-black/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <TerminalIcon size={20} />
            <span className="font-bold tracking-widest text-lg">PURGEVIEW</span>
          </div>
          <div className="flex items-center gap-4 text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span>{isConnected ? 'LIVE' : 'OFFLINE'}</span>
            </div>
          </div>
        </header>

        {/* Body Content */}
        <main className="flex-1 flex flex-col justify-center items-center relative p-4">

          {/* CONNECT SCREEN */}
          {!isConnected && !bootSequence && (
            <div className="animate-in fade-in zoom-in duration-500 max-w-md w-full border border-green-800 bg-black/50 p-8 shadow-[0_0_30px_rgba(0,255,0,0.1)]">
              <div className="text-center mb-8">
                <ShieldAlertIcon className="w-16 h-16 mx-auto mb-4 text-green-600" />
                <h2 className="text-2xl font-bold mb-2">SECURE SHELL</h2>
                <p className="text-green-700 text-sm">
                   {lastPurgeReason === 'USER_INITIATED' ? 'SESSION TERMINATED BY USER' :
                   'INITIATE CONNECTION PROTOCOL'}
                </p>
              </div>

              <button
                onClick={connect}
                className="w-full group relative px-6 py-3 font-bold border border-green-600 hover:bg-green-900/30 transition-all active:scale-[0.98]"
              >
                <span className="absolute inset-0 w-full h-full bg-green-500/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                <span className="relative flex items-center justify-center gap-2">
                  <PowerIcon size={18} /> ESTABLISH LINK
                </span>
              </button>

              <div className="mt-6 text-xs text-green-800 text-center">
                PERSISTENT CONNECTION ENABLED
              </div>
            </div>
          )}

          {/* BOOT SEQUENCE */}
          {bootSequence && (
            <div className="text-center space-y-4">
              <CpuIcon className="w-12 h-12 animate-spin mx-auto text-green-400" />
              <div className="text-sm tracking-widest animate-pulse">ESTABLISHING SECURE HANDSHAKE...</div>
              <div className="w-64 h-1 bg-green-900 mx-auto overflow-hidden">
                <div className="h-full bg-green-500 animate-[progress_1s_ease-in-out_infinite]"></div>
              </div>
            </div>
          )}

          {/* TERMINAL UI */}
          {isConnected && (
            <div
              className="w-full max-w-4xl h-full max-h-[80vh] bg-black/90 border border-green-900/50 p-4 font-mono text-sm md:text-base overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,255,0,0.05)] animate-in fade-in duration-300"
              onClick={focusInput}
            >
              <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pb-2">
                {terminalLines.map((line, i) => (
                  <div key={i} className={`${
                    line.type === 'user' ? 'text-white' :
                    line.type === 'error' ? 'text-red-500' :
                    line.type === 'success' ? 'text-green-400' :
                    line.type === 'system' ? 'text-green-700' : 'text-green-500'
                  }`}>
                    {line.text}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-green-900/30">
                <span className="text-green-400 font-bold">{'>'}</span>
                <input
                  ref={inputRef}
                  autoFocus
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleCommand}
                  className="flex-1 bg-transparent outline-none text-green-100 placeholder-green-900"
                  placeholder="Enter command..."
                  autoComplete="off"
                />
              </div>
            </div>
          )}

        </main>
      </div>

      <style jsx global>{`
        @keyframes progress {
          0% { width: 0%; margin-left: 0; }
          50% { width: 100%; margin-left: 0; }
          100% { width: 0%; margin-left: 100%; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #000;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #113311;
        }
      `}</style>
    </div>
  );
}