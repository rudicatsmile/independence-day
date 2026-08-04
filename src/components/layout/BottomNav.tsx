'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Flag, Image as ImageIcon, HelpCircle, Sparkles, BookOpen } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/home', label: 'Beranda', icon: Home },
    { href: '/twibbon', label: 'Twibbon', icon: Sparkles },
    { href: '/quiz', label: 'Kuis', icon: HelpCircle },
    { href: '/gallery', label: 'Galeri', icon: ImageIcon },
    { href: '/passport', label: 'Paspor', icon: BookOpen },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-card border-t border-merdeka-red/20 px-3 py-2 sm:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-all ${
                isActive
                  ? 'text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-merdeka-red/30 border border-merdeka-gold/50' : 'bg-transparent'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
