import React from 'react';
import { ClipboardCopy, Activity } from 'lucide-react';
import { ActionLog } from '../../types';

export const HistoryView = ({ history, onExport }: { history: ActionLog[], onExport: () => void }) => (
    <div className="flex flex-col h-full">
        {/* HEADER */}
        <div className="flex justify-between items-end mb-6 px-2">
            <div>
                <h2 className="text-2xl font-bold text-white">System Logs</h2>
                <p className="text-slate-500 text-xs mt-1">Audit Trail</p>
            </div>
            <button onClick={onExport} className="bg-surface border border-white/5 text-slate-300 p-2.5 rounded-xl active:scale-90 transition-transform">
                <ClipboardCopy size={18} />
            </button>
        </div>

        {/* TIMELINE */}
        <div className="relative border-l border-white/5 ml-4 pl-6 space-y-6 pb-20">
            {history.length === 0 && (
                <div className="text-slate-600 text-sm font-mono italic">No events recorded.</div>
            )}

            {history.map((h, i) => (
                <div key={i} className="relative">
                    {/* Dot */}
                    <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-surface border border-slate-600" />

                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono text-slate-500">{h.timestamp}</span>
                        <div className="p-3 rounded-xl bg-surface border border-white/5">
                            <p className="text-slate-200 text-sm font-mono break-all">{h.pkg}</p>
                            <div className="flex items-center gap-1.5 mt-2">
                                <Activity size={12} className="text-accent" />
                                <span className="text-[10px] uppercase text-accent font-bold tracking-wider">EXECUTED</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);