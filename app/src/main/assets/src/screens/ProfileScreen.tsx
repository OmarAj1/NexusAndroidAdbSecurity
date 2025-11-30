import React from 'react';
import { Trophy, Target, TrendingUp, User as UserIcon, LogOut } from 'lucide-react';
import { GlassCard, NeonButton } from '../components/Common';
import { useNexus } from '../context/NexusContext';

export default function ProfileScreen() {
    const { username, stats, coreVersion, handleLogout } = useNexus();

    const userLevel = Math.floor(stats.blocked / 50) + 1;
    const currentLevelProgress = stats.blocked % 50;
    const progressPercent = (currentLevelProgress / 50) * 100;

    const getRankTitle = (lvl: number) => {
        if (lvl < 5) return "Net Initiate";
        if (lvl < 10) return "Cyber Sentinel";
        if (lvl < 20) return "Data Guardian";
        return "Privacy Warlord";
    };

    return (
        <div className="space-y-6">
            <GlassCard borderColor="amber">
                {/* ... User Info UI ... */}
                 <div className='mt-4'>
                    <NeonButton onClick={handleLogout} label="Log Out" icon={LogOut} color="gray" size="sm" fullWidth={false} />
                 </div>
            </GlassCard>

            <GlassCard>
                {/* ... Rank & Progression UI ... */}
            </GlassCard>

            <div className="grid grid-cols-2 gap-4">
                <GlassCard>
                    <h3 className="font-bold text-white flex items-center"><Target size={18} className="mr-2 text-red-400" />Total Blocked</h3>
                    <p className="text-3xl font-bold text-white mt-2">{stats.blocked}</p>
                </GlassCard>
                 <GlassCard>
                    <h3 className="font-bold text-white flex items-center"><TrendingUp size={18} className="mr-2 text-green-400" />Data Saved</h3>
                    <p className="text-3xl font-bold text-white mt-2">{stats.saved.toFixed(2)} <span className="text-xl">MB</span></p>
                </GlassCard>
            </div>
        </div>
    );
}