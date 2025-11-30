import React from 'react';
import {
    Shield, Zap, ScanEye, XCircle, Plus, Minus, Trash2,
    Fingerprint, Download
} from 'lucide-react';
import { GlassCard, NeonButton } from '../components/Common';
import { useNexus } from '../context/NexusContext';

export default function ShieldScreen() {
    const {
        vpnActive, stats, totalScanned, trafficLog,
        toggleVpn, exportShieldLog,
        customRules, newRuleDomain, newRuleType,
        setNewRuleDomain, setNewRuleType, addCustomRule, removeCustomRule
    } = useNexus();

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <GlassCard borderColor={vpnActive ? "green" : "red"}>
                    {/* ... Shield Status UI ... */}
                </GlassCard>
                <GlassCard borderColor="green">
                  {/* ... Real-time Stats UI ... */}
                </GlassCard>
            </div>

            <GlassCard borderColor="blue">
                {/* ... Traffic Log UI ... */}
                <div className="font-mono text-xs mt-4 h-48 overflow-y-auto bg-blue-950/30 p-3 rounded-lg border border-blue-500/20">
                  {trafficLog.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-blue-300/40">
                      <p>Activate Shield to start logging...</p>
                    </div>
                  ) : trafficLog.map((log, i) => (
                    <p key={i} className={`whitespace-nowrap ${log.includes('[BLOCK]') ? 'text-amber-400' : 'text-blue-300'}`}>
                      <span className="text-blue-500/50 mr-2">{`[${totalScanned - i}]`}</span>
                      <XCircle size={10} className="inline mr-1 text-red-500/80"/>
                      {log}
                    </p>
                  ))}
                </div>
            </GlassCard>

             <GlassCard borderColor="amber">
                <h3 className="text-lg font-bold text-white flex items-center"><Fingerprint size={20} className="mr-2 text-amber-400"/>Custom Rules</h3>
                <div className="flex items-center space-x-2 mt-4">
                    <input
                        type="text"
                        placeholder="e.g., ad.company.com"
                        value={newRuleDomain}
                        onChange={(e) => setNewRuleDomain(e.target.value)}
                        className="flex-grow bg-slate-800/60 border border-white/10 rounded-lg p-2 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                    <select
                      value={newRuleType}
                      onChange={(e) => setNewRuleType(e.target.value as 'BLOCK' | 'ALLOW')}
                      className="bg-slate-800/60 border border-white/10 rounded-lg p-2 text-sm text-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    >
                        <option value="BLOCK">BLOCK</option>
                        <option value="ALLOW">ALLOW</option>
                    </select>
                    <NeonButton label="Add" onClick={addCustomRule} icon={Plus} color="amber" size="sm" fullWidth={false} />
                </div>
                {/* ... Custom Rules List UI ... */}
            </GlassCard>
        </div>
    );
}