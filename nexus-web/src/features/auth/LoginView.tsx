import React, { useState } from 'react';
import { ArrowRight, Lock } from 'lucide-react';

export const LoginView = ({ onLogin }: { onLogin: (user: string) => void }) => {
    const [user, setUser] = useState('admin');

    return (
        <div className="fixed inset-0 bg-void flex flex-col items-center justify-center p-6 z-[100]">

            <div className="w-full max-w-xs space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* LOGO AREA */}
                <div className="text-center space-y-2">
                    <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                        <Lock size={32} className="text-black" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Nexus Core</h1>
                    <p className="text-slate-500">Security Environment</p>
                </div>

                {/* INPUTS */}
                <div className="space-y-3">
                    <input
                        type="text" value={user} onChange={e => setUser(e.target.value)}
                        className="w-full bg-surface border border-white/10 rounded-2xl p-4 text-center text-white placeholder-slate-600 focus:border-white/30 outline-none transition-all"
                        placeholder="Identity"
                    />
                    <div className="h-2" /> {/* Spacer */}
                    <button
                        onClick={() => onLogin(user)}
                        className="w-full bg-accent hover:bg-accent/90 text-white font-bold p-4 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-accent/20"
                    >
                        <span>Initialize</span>
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>

            {/* FOOTER */}
            <div className="absolute bottom-10 text-slate-600 text-xs font-mono">
                SYSTEM VER. 2.0
            </div>
        </div>
    );
};