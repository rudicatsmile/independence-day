'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flag, Sparkles, MapPin, Trophy, Camera, Radio, ChevronRight, CheckCircle2, LogIn, Lock, ShieldCheck, Image as ImageIcon, Tv, GraduationCap } from 'lucide-react';
import { useUserStore } from '@/stores/useUserStore';
import { useLiveStore } from '@/stores/useLiveStore';
import { AuthModal } from '@/components/auth/AuthModal';
import { fetchLiveEventHeaderFromSupabase } from '@/lib/supabase/services';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function HomePage() {
  const profile = useUserStore((state) => state.profile);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const missions = useUserStore((state) => state.missions);
  const userMissions = useUserStore((state) => state.userMissions);
  const saluteCount = useLiveStore((state) => state.saluteCount);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('PANGGUNG UTAMA PERAYAAN HUT RI KE-81');
  const [eventDate, setEventDate] = useState('17 AGUSTUS 2026');

  const isAdmin = isLoggedIn && (profile.role === 'admin' || profile.role === 'media_team');

  useEffect(() => {
    // Initial fetch for dynamic event title & date from Supabase Cloud
    const loadHeaderInfo = async () => {
      const info = await fetchLiveEventHeaderFromSupabase();
      if (info.event_title) setEventTitle(info.event_title);
      if (info.event_date) setEventDate(info.event_date);
    };

    loadHeaderInfo();

    // Subscribe to Supabase Realtime for live_event_state update
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const channel = supabase
        .channel('home-header-realtime-channel')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'live_event_state' },
          (payload) => {
            if (payload.new) {
              if (payload.new.event_title) setEventTitle(payload.new.event_title);
              if (payload.new.event_date) setEventDate(payload.new.event_date);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="glass-card-red rounded-3xl p-6 sm:p-8 border-merdeka-red/40 relative overflow-hidden space-y-4 shadow-glow">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{eventTitle}</span>
            </div>

            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                    Selamat Datang, <span className="text-gradient-gold">{profile.full_name}!</span>
                  </h1>
                  {isAdmin && (
                    <span className="px-2.5 py-0.5 rounded-full bg-merdeka-red text-white text-[10px] font-black tracking-wider uppercase border border-amber-400 shadow-gold-glow">
                      🛡️ ADMIN
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-300">
                  {profile.instansi} • Status Sesi: <span className="text-emerald-400 font-bold">Terautentikasi</span>
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  Selamat Datang di <span className="text-gradient-gold">Perayaan Merdeka 81!</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-300">
                  Silakan masuk atau mendaftar untuk mulai mengumpulkan poin, scan QR Hunt, & klaim sertifikat digital.
                </p>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isLoggedIn ? (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-merdeka-red to-amber-500 text-slate-950 font-black text-xs shadow-gold-glow shimmer-btn hover:scale-105 transition-transform flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk / Login Akun</span>
              </button>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-merdeka-red to-amber-500 border-2 border-amber-300 flex flex-col items-center justify-center text-white shadow-gold-glow animate-pulse">
                <span className="text-2xl font-black leading-none">81</span>
                <span className="text-[9px] font-bold tracking-widest uppercase">Tahun</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Action Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <Link
            href="/twibbon"
            className="p-3 rounded-2xl bg-slate-900/80 border border-amber-500/30 hover:border-amber-400 text-left transition-all hover:scale-105"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-white">Twibbon Photobooth</p>
            <p className="text-[10px] text-slate-400">Buat bingkai 17-an</p>
          </Link>

          {!isLoggedIn ? (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="p-3 rounded-2xl bg-slate-900/80 border border-amber-500/30 hover:border-amber-400 text-left transition-all hover:scale-105 w-full"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center mb-2">
                <GraduationCap className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-white">Selfie Guru Patriot</p>
              <p className="text-[10px] text-amber-300 font-semibold">Foto & Klaim +150 PTS</p>
            </button>
          ) : (
            <Link
              href="/selfie-guru"
              className="p-3 rounded-2xl bg-slate-900/80 border border-amber-500/30 hover:border-amber-400 text-left transition-all hover:scale-105"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center mb-2">
                <GraduationCap className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-white">Selfie Guru Patriot</p>
              <p className="text-[10px] text-amber-300 font-semibold">Foto & Klaim +150 PTS</p>
            </Link>
          )}

          <Link
            href="/live"
            className="p-3 rounded-2xl bg-slate-900/80 border border-amber-500/30 hover:border-amber-400 text-left transition-all hover:scale-105"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center mb-2">
              <Radio className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-white">Live Salute ({saluteCount})</p>
            <p className="text-[10px] text-slate-400">Tekan Hormat!</p>
          </Link>

          <Link
            href="/passport"
            className="p-3 rounded-2xl bg-slate-900/80 border border-amber-500/30 hover:border-amber-400 text-left transition-all hover:scale-105"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
              <Trophy className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-white">Paspor & Badge</p>
            <p className="text-[10px] text-slate-400">Gelar Achievement</p>
          </Link>
        </div>
      </div>

      {/* Admin Panel Quick Banner */}
      {isAdmin && (
        <div className="glass-card-gold rounded-3xl p-5 border border-amber-400/60 space-y-3 shadow-gold-glow">
          <div className="flex items-center gap-2 text-amber-300">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-black text-white">Panel Kontrol Utama Administrator</h2>
          </div>
          <p className="text-xs text-slate-300">
            Akses khusus Panitia Utama: Kelola bingkai Twibbon publik, pemicu suara sirine panggung, & takedown galeri foto.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            <Link
              href="/admin/twibbon"
              className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 hover:border-amber-400 flex items-center gap-3 transition-all hover:scale-105 shadow-glow"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Kelola Bingkai Twibbon</p>
                <p className="text-[10px] text-amber-300">Tambah/Edit PNG Custom</p>
              </div>
            </Link>

            <Link
              href="/admin/map"
              className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 hover:border-amber-400 flex items-center gap-3 transition-all hover:scale-105 shadow-glow"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Kelola Peta QR Hunt</p>
                <p className="text-[10px] text-amber-300">Atur Titik & Radius GPS</p>
              </div>
            </Link>

            <Link
              href="/stage-display"
              className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 hover:border-amber-400 flex items-center gap-3 transition-all hover:scale-105 shadow-glow"
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Layar Panggung Utama</p>
                <p className="text-[10px] text-red-300">Picu Sirine & Slideshow</p>
              </div>
            </Link>

            <Link
              href="/gallery"
              className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 hover:border-amber-400 flex items-center gap-3 transition-all hover:scale-105 shadow-glow"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Moderasi Wall of Merdeka</p>
                <p className="text-[10px] text-emerald-300">Takedown Konten Lapangan</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Active Missions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-gradient-gold">Daftar Misi Kemerdekaan</h2>
          <span className="text-xs font-bold text-amber-300">
            {Object.keys(userMissions).length} / {missions.length} Selesai
          </span>
        </div>

        <div className="space-y-2">
          {missions.map((mission) => {
            const isCompleted = userMissions[mission.id]?.status === 'completed';
            return (
              <div
                key={mission.id}
                className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                  isCompleted
                    ? 'glass-card border-emerald-500/30 bg-emerald-950/20'
                    : 'glass-card border-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isCompleted
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-merdeka-red/20 text-amber-300 border border-amber-400/30'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : `+${mission.points_reward}`}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white">{mission.title}</h3>
                    <p className="text-[11px] text-slate-400">{mission.description}</p>
                  </div>
                </div>

                <div>
                  {isCompleted ? (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/40">
                      Selesai
                    </span>
                  ) : !isLoggedIn ? (
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1 border border-slate-700"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Masuk dulu</span>
                    </button>
                  ) : (
                    <Link
                      href={
                        mission.slug === 'selfie-guru'
                          ? '/selfie-guru'
                          : mission.slug === 'selfie-patriotik'
                          ? '/twibbon'
                          : mission.type === 'qr_hunt'
                          ? '/map'
                          : mission.type === 'quiz'
                          ? '/quiz'
                          : '/live'
                      }
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-merdeka-red to-amber-500 text-white font-bold text-xs flex items-center gap-1 shadow-glow"
                    >
                      <span>Mulai</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Auth Modal Popup when requested */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
