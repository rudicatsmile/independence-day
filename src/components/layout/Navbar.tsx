'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, Award, Radio, Tv, LogOut, ShieldCheck, Image as ImageIcon, ChevronDown, Sparkles, MapPin, HelpCircle } from 'lucide-react';
import { useUserStore } from '@/stores/useUserStore';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client';
import { logoutUser } from '@/lib/supabase/auth';
import { AuthModal } from '@/components/auth/AuthModal';

export const Navbar: React.FC = () => {
  const profile = useUserStore((state) => state.profile);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const setUserProfile = useUserStore((state) => state.setUserProfile);
  const initSupabaseData = useUserStore((state) => state.initSupabaseData);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);

  useEffect(() => {
    initSupabaseData();

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          supabase.from('profiles').select('*').eq('id', data.user.id).single().then(({ data: prof }) => {
            if (prof) {
              setUserProfile(prof);
            }
          });
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (!session?.user) {
          setUserProfile(null);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, [initSupabaseData, setUserProfile]);

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      await logoutUser();
    }
    setUserProfile(null);
    setIsAdminDropdownOpen(false);
  };

  const isAdmin = isLoggedIn && (profile.role === 'admin' || profile.role === 'media_team');

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-card border-b border-merdeka-red/20 px-3 sm:px-4 py-2.5">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Brand & Logo Yayasan */}
          <Link href="/home" className="flex items-center gap-2 group shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 border border-amber-400/50 p-1 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform overflow-hidden shrink-0">
              <img
                src="/logo-yayasan.png"
                alt="Logo Yayasan Al-Wathoniyah Asshodriyah 9 Jakarta"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-wider text-gradient-gold uppercase leading-tight">
                Merdeka 81
              </h1>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium tracking-wide">
                HUT RI KE-81 • 17 AGUSTUS 2026
              </p>
            </div>
          </Link>

          {/* Action Pills & User Auth */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* ADMIN SPECIAL MENU DROPDOWN */}
            {isAdmin && (
              <div className="relative">
                <button
                  onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-merdeka-red to-amber-500 text-slate-950 font-black text-xs shadow-gold-glow hover:scale-105 transition-transform"
                >
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950" />
                  <span className="text-[11px] sm:text-xs">Admin</span>
                  <ChevronDown className="w-3 h-3 text-slate-950" />
                </button>

                {/* Dropdown Options */}
                {isAdminDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 glass-card-gold rounded-2xl p-2 border border-amber-400/50 shadow-2xl space-y-1 z-50">
                    <div className="px-3 py-1.5 border-b border-amber-500/30 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                      Menu Administrator
                    </div>
                    <Link
                      href="/admin/twibbon"
                      onClick={() => setIsAdminDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-merdeka-red/30 transition-colors"
                    >
                      <ImageIcon className="w-4 h-4 text-amber-400" />
                      <span>Kelola Twibbon</span>
                    </Link>
                    <Link
                      href="/admin/map"
                      onClick={() => setIsAdminDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-merdeka-red/30 transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-amber-400" />
                      <span>Kelola Peta QR</span>
                    </Link>
                    <Link
                      href="/admin/quiz"
                      onClick={() => setIsAdminDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-merdeka-red/30 transition-colors"
                    >
                      <HelpCircle className="w-4 h-4 text-amber-400" />
                      <span>Kelola Kuis Trivia</span>
                    </Link>
                    <Link
                      href="/admin/cosplay"
                      onClick={() => setIsAdminDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-merdeka-red/30 transition-colors"
                    >
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>Penilaian Cosplay</span>
                    </Link>
                    <Link
                      href="/stage-display"
                      onClick={() => setIsAdminDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-merdeka-red/30 transition-colors"
                    >
                      <Tv className="w-4 h-4 text-amber-400" />
                      <span>Layar Panggung</span>
                    </Link>
                    <Link
                      href="/gallery"
                      onClick={() => setIsAdminDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-merdeka-red/30 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Moderasi Galeri</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Live Badge */}
            <Link
              href="/live"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/80 border border-merdeka-red/50 text-merdeka-red text-xs font-bold animate-pulse"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <Radio className="w-3 h-3 text-red-500" />
              <span className="hidden xs:inline">LIVE</span>
            </Link>

            {/* Points Pill */}
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-merdeka-red/20 border border-merdeka-gold/40 text-xs font-bold text-amber-300">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span>{isLoggedIn ? profile.total_points : 0} PTS</span>
            </div>

            {/* Logout Action (Only shown when logged in) */}
            {isLoggedIn && (
              <div className="flex items-center gap-2">
                <div className="hidden md:flex flex-col items-end leading-tight">
                  <span className="text-xs font-black text-white truncate max-w-[120px]">
                    {profile.full_name}
                  </span>
                  {isAdmin && (
                    <span className="text-[9px] font-extrabold text-amber-400 tracking-wider">
                      🛡️ ADMIN
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-red-950/80 border border-slate-700 hover:border-red-500/50 text-slate-300 hover:text-red-400 text-xs font-bold transition-all"
                  title="Keluar / Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal Popup */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
};
