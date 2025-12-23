import React, { useState, useEffect } from 'react';
import { DownloadCloud, Zap, Wifi, Terminal } from 'lucide-react';

interface ConnectionViewProps {
    status: string;
    onPair: (ip: string, port: string, code: string) => void;
    onConnect: (ip: string, port: string) => void;
    onRetrieve: () => void;
    pairingData: { ip: string, port: string };
    connectData: { ip: string, port: string };
}

export const ConnectionView = ({ status, onPair, onConnect, onRetrieve, pairingData, connectData }: ConnectionViewProps) => {
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
      if (pairingData.ip) { setIp(pairingData.ip); setPort(pairingData.port); }
      else if (connectData.ip) { setIp(connectData.ip); setPort(connectData.port); }
  }, [pairingData, connectData]);

  return (
    <div className="flex flex-col h-full pt-10 px-2">

      {/* HEADER GRAPHIC */}
      <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-full bg-surface border border-white/5 flex items-center justify-center mb-4 shadow-2xl shadow-accent/10">
              <Terminal size={32} className="text-slate-500" />
          </div>
          <h2 className="text-xl font-bold text-white">ADB Wireless</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-2 h-2 rounded-full ${status.includes('Connect') ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500'}`} />
            <span className="text-xs font-mono text-slate-500 uppercase">{status}</span>
          </div>
      </div>

      {/* FORM AREA */}
      <div className="space-y-4">

          {/* NEW: Notification Mode Button */}
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-indigo-400 font-bold text-sm">Notification Mode</h3>
              <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-full">RECOMMENDED</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Creates a notification so you can enter the code directly from Settings without switching apps.
            </p>

            <button
              onClick={() => {
                if ((window as any).AndroidNative) {
                  (window as any).AndroidNative.startPairingNotificationMode();
                }
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-mono text-sm shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
            >
              START PAIRING SERVICE
            </button>
          </div>

          <div className="h-px bg-white/5 my-6" />

          {/* Manual IP & Port Row */}
          <div className="flex gap-3">
              <input
                  value={ip} onChange={e=>setIp(e.target.value)} placeholder="192.168.x.x"
                  className="flex-1 bg-surface border border-white/5 rounded-2xl p-4 text-white font-mono text-sm placeholder-slate-600 focus:border-accent outline-none"
              />
              <input
                  value={port} onChange={e=>setPort(e.target.value)} placeholder="5555"
                  className="w-24 bg-surface border border-white/5 rounded-2xl p-4 text-white font-mono text-sm text-center placeholder-slate-600 focus:border-accent outline-none"
              />
          </div>

          <button onClick={onRetrieve} className="w-full py-3 text-xs font-bold text-accent bg-accent/10 rounded-xl border border-accent/20 flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <DownloadCloud size={14} /> AUTO-DETECT
          </button>

          {/* Pairing Input */}
          <div className="relative pt-2">
             <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none top-2">
                <span className="text-slate-600 font-mono text-xs">PAIRING CODE</span>
             </div>
             <input
                value={code} onChange={e=>setCode(e.target.value)} placeholder="------"
                className="w-full bg-surface border border-white/5 rounded-2xl py-4 pl-32 pr-4 text-white text-right font-mono tracking-widest focus:border-safe outline-none"
                maxLength={6}
             />
          </div>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-2 gap-3 pt-2">
             <button onClick={() => onPair(ip, port, code)} className="p-4 rounded-2xl bg-surface border border-white/5 text-slate-300 font-bold text-sm flex flex-col items-center gap-2 active:scale-95 transition-transform">
                 <Zap size={20} className="text-amber-400" />
                 Pair
             </button>
             <button onClick={() => onConnect(ip, port)} className="p-4 rounded-2xl bg-white text-black font-bold text-sm flex flex-col items-center gap-2 active:scale-95 transition-transform shadow-lg shadow-white/10">
                 <Wifi size={20} className="text-black" />
                 Connect
             </button>
          </div>
      </div>
    </div>
  );
};