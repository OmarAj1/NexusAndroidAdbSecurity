import React from 'react';
import { Smartphone, Shield, History as HistoryIcon, User as UserIcon } from 'lucide-react';

interface TabBarProps {
  active: string;
  onChange: (id: string) => void;
}

const TabBar = ({ active, onChange }: TabBarProps) => (
  <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
    {/* Soft white fade from bottom */}
    <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-[#fdfbf7] via-[#fdfbf7]/90 to-transparent" />

    <div className="pointer-events-auto relative flex justify-center pb-8 pt-4">
      {/* The Dock:
        A white pill with a soft shadow. No blur needed.
      */}
      <div className="flex items-center p-2 rounded-full bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">

        {[{id:'purge',icon:Smartphone, color: 'text-blue-500 bg-blue-50'},
          {id:'shield',icon:Shield, color: 'text-green-500 bg-green-50'},
          {id:'history',icon:HistoryIcon, color: 'text-purple-500 bg-purple-50'},
          {id:'user',icon:UserIcon, color: 'text-orange-500 bg-orange-50'}
         ].map((tab) => {
          const isActive = active === tab.id;
          return (
            <button key={tab.id} onClick={() => onChange(tab.id)}
              className={`
                relative flex items-center justify-center rounded-full transition-all duration-300
                w-12 h-12 mx-1 active:scale-90
                ${isActive
                  ? `${tab.color} shadow-sm ring-1 ring-inset ring-black/5`
                  : 'bg-transparent text-slate-400 hover:bg-slate-50'}
              `}>
              <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            </button>
          );
        })}
      </div>
    </div>
  </div>
);
export default TabBar;