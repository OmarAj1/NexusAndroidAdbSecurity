import React, { useState, useEffect } from 'react';
import { DownloadCloud, Zap, Wifi, Terminal, Wand2 } from 'lucide-react';

interface ConnectionViewProps {
    status: string;
    onPair: (ip: string, port: string, code: string) => void;
    onConnect: (ip: string, port: string) => void;
    onRetrieve: () => void;
    pairingData: { ip: string, port: string };
    connectData: { ip: string, port: string };
    // NEW: Pass the full actions object to access startZeroTouch
    actions: any;
}

export const ConnectionView = ({ status, onPair, onConnect, onRetrieve, pairingData, connectData, actions }: ConnectionViewProps) => {
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
      if (pairingData.ip) { setIp(pairingData.ip); setPort(pairingData.port); }
      else if (connectData.ip) { setIp(connectData.ip); setPort(connectData.port); }
  }, [pairingData, connectData]);

  return (
    <div className="flex flex-col h-full pt-10 px-4">

      {/* HEADER GRAPHIC */}
      <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-surface border border-white/5 flex items-center justify-center mb-4 shadow-2xl shadow-accent/10 relative">
              <Terminal size={32} className="text-slate-500" />
              {status.includes('Active') && (
                  <div className="absolute -right-1 -top-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                      <Zap size={12} className="text-black fill-black" />
                  </div>
              )}
          </div>
          <h2 className="text-xl font-bold text-white">ADB Wireless</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-2 h-2 rounded-full ${status.includes('Connect') || status.includes('Shell') ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500'}`} />
            <span className="text-xs font-mono text-slate-500 uppercase">{status}</span>
          </div>
      </div>

      {/* ZERO-TOUCH CARD (The New UI) */}
      <div className="relative overflow-hidden p-0.5 rounded-2xl bg-gradient-to-br from-indigo-500/50 via-purple-500/30 to-transparent mb-6">
        <div className="bg-[#0B1121] rounded-2xl p-5 relative">

            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Wand2 size={18} className="text-indigo-400" />
                    <h3 className="text-indigo-100 font-bold text-sm">Magic Connect</h3>
                </div>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">
                    AUTO-PILOT
                </span>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
               Grant accessibility permission once, and Nexus will auto-click the pairing buttons for you. No typing required.
            </p>

            <button
              onClick={() => actions.startZeroTouch && actions.startZeroTouch()}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Auto-Pair Device</span>
              <Wand2 size={14} className="group-hover:rotate-12 transition-transform" />
            </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-white/5 flex-1" />
          <span className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">Manual Override</span>
          <div className="h-px bg-white/5 flex-1" />
      </div>

      {/* Manual IP & Port Row */}
      <div className="flex gap-3 mb-3">
          <input
              value={ip} onChange={e=>setIp(e.target.value)} placeholder="IP Address"
              className="flex-1 bg-surface border border-white/5 rounded-xl p-3 text-white font-mono text-xs placeholder-slate-700 focus:border-indigo-500/50 outline-none transition-colors"
          />
          <input
              value={port} onChange={e=>setPort(e.target.value)} placeholder="Port"
              className="w-20 bg-surface border border-white/5 rounded-xl p-3 text-white font-mono text-xs text-center placeholder-slate-700 focus:border-indigo-500/50 outline-none transition-colors"
          />
      </div>

      {/* Manual Code Input */}
      <div className="relative mb-3">
         <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <span className="text-slate-600 font-mono text-[10px]">PAIRING CODE</span>
         </div>
         <input
            value={code} onChange={e=>setCode(e.target.value)} placeholder="------"
            className="w-full bg-surface border border-white/5 rounded-xl py-3 pl-28 pr-4 text-white text-right font-mono tracking-widest focus:border-indigo-500/50 outline-none transition-colors"
            maxLength={6}
         />
      </div>

      {/* Manual Actions */}
      <div className="grid grid-cols-2 gap-3">
         <button onClick={() => onPair(ip, port, code)} className="p-3 rounded-xl bg-surface border border-white/5 hover:bg-white/5 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all">
             <Zap size={14} className="text-amber-400" />
             Pair
         </button>
         <button onClick={() => onConnect(ip, port)} className="p-3 rounded-xl bg-white text-black font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-white/10">
             <Wifi size={14} className="text-black" />
             Connect
         </button>
      </div>

      {/* Auto Detect Link */}
      <button onClick={onRetrieve} className="w-full mt-4 py-2 text-[10px] font-mono text-slate-500 hover:text-indigo-400 flex items-center justify-center gap-1 transition-colors">
          <DownloadCloud size={10} />
          Rescan Network Services
      </button>

    </div>
  );
};