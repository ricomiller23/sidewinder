"use client";

import React from 'react';
import { Home, Bell, Search, Settings } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export default function MobileNavV4() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { icon: Home, label: 'Feed', path: '/v4/dashboard' },
    { icon: Bell, label: 'Alerts', path: '/v4/alerts' },
    { icon: Search, label: 'Search', action: () => {
      // Trigger Command Bar
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
    }},
    { icon: Settings, label: 'Config', path: '/v4/settings' },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-6 right-6 z-[90]">
      <div className="v4-glass-card p-2 flex justify-around items-center border-v4-primary/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        {navItems.map((item, i) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <button 
              key={i}
              onClick={() => item.action ? item.action() : router.push(item.path!)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                isActive ? 'text-v4-primary bg-v4-primary/10' : 'text-v4-text-muted hover:text-white'
              }`}
            >
              <Icon size={20} className={isActive ? 'v4-glow-text' : ''} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
