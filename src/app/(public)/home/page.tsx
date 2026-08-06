'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flag, Sparkles, MapPin, Trophy, Crown, Camera, Radio, ChevronRight, CheckCircle2, LogIn, Lock, ShieldCheck, Image as ImageIcon, Tv, GraduationCap, BarChart3, Megaphone, ChevronDown, ChevronUp } from 'lucide-react';
import { useUserStore } from '@/stores/useUserStore';
import { useLiveStore } from '@/stores/useLiveStore';
import { AuthModal } from '@/components/auth/AuthModal';
import { fetchLiveEventHeaderFromSupabase, fetchFullLeaderboardFromSupabase } from '@/lib/supabase/services';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Profile } from '@/lib/types';

export default function HomePage() {
  const profile = useUserStore((state) => state.profile);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const isAdmin = isLoggedIn && (profile.role === 'admin' || profile.role === 'media_team');
  const isPanitiaCosplay = isLoggedIn && profile.role === 'panitia_cosplay';
  const missions = useUserStore((state) => state.missions);
  const userMissions = useUserStore((state) => state.userMissions);
  const saluteCount = useLiveStore((state) => state.saluteCount);
  const isLeaderboardEnabled = useLiveStore((state) => state.isLeaderboardEnabled);
  const announcementText = useLiveStore((state) => state.announcementText);
  const isAnnouncementEnabled = useLiveStore((state) => state.isAnnouncementEnabled);
  const initLiveSupabase = useLiveStore((state) => state.initLiveSupabase);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('PANGGUNG UTAMA PERAYAAN HUT RI KE-81');
  const [eventDate, setEventDate] = useState('17 AGUSTUS 2026');
  const [eventYearNumber, setEventYearNumber] = useState('81');
  const [leaderboard, setLeaderboard] = useState<Profile[]>([]);
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);


  useEffect(() => {
    // Initial fetch for dynamic event title, date, & year number from Supabase Cloud
    const loadHeaderInfo = async () => {
      const info = await fetchLiveEventHeaderFromSupabase();
      if (info.event_title) setEventTitle(info.event_title);
      if (info.event_date) setEventDate(info.event_date);
      if (info.event_year_number) setEventYearNumber(info.event_year_number);
    };

    loadHeaderInfo();
    initLiveSupabase();

    // Load leaderboard
    fetchFullLeaderboardFromSupabase().then((data) => setLeaderboard(data));

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
              if (payload.new.event_year_number) setEventYearNumber(payload.new.event_year_number);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [initLiveSupabase]);

  const activeMissions = missions.filter((m) => m.is_active !== false);
  const completedActiveCount = activeMissions.filter(
    (m) => userMissions[m.id]?.status === 'completed'
  ).length;

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
                  {profile.instansi}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  Selamat Datang di <span className="text-gradient-gold">Perayaan HUT RI Ke-81</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-300">
                  Silakan masuk atau mendaftar untuk mulai mengumpulkan poin & klaim sertifikat digital.
                </p>
              </>
            )}
          </div>

          {!isLoggedIn && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-merdeka-red to-amber-500 text-slate-950 font-black text-xs shadow-gold-glow shimmer-btn hover:scale-105 transition-transform flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk / Login Akun</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Admin Panel Quick Banner */}
      {(isAdmin || isPanitiaCosplay) && (
        <div className="glass-card-gold rounded-3xl p-5 border border-amber-400/60 space-y-3 shadow-gold-glow">
          <div className="flex items-center gap-2 text-amber-300">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-black text-white">{isAdmin ? 'Panel Kontrol Utama Administrator' : 'Panel Khusus Panitia Lomba'}</h2>
          </div>
          <p className="text-xs text-slate-300">
            {isAdmin ? 'Akses khusus Panitia Utama: Kelola bingkai Twibbon publik, pemicu suara sirine panggung, & takedown galeri foto.' : 'Akses jalan pintas menuju halaman kontrol penilaian Cosplay.'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            {isAdmin && (
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
            )}

            <Link
              href="/admin/cosplay/chief"
              className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 hover:border-amber-400 flex items-center gap-3 transition-all hover:scale-105 shadow-glow"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Chief Referee Cosplay</p>
                <p className="text-[10px] text-purple-300">Pengesahan Pemenang</p>
              </div>
            </Link>

            {isAdmin && (
              <>
                <Link
                  href="/admin/poll"
                  className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 hover:border-amber-400 flex items-center gap-3 transition-all hover:scale-105 shadow-glow"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                    <Radio className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Kelola Polling Lapangan</p>
                    <p className="text-[10px] text-amber-300">Atur Soal & Reset Suara</p>
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
              </>
            )}

            <Link
              href="/admin/cosplay"
              className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 hover:border-amber-400 flex items-center gap-3 transition-all hover:scale-105 shadow-glow"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Panel Penilaian Cosplay</p>
                <p className="text-[10px] text-purple-300">Input Peserta & Publikasi</p>
              </div>
            </Link>

            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 hover:border-amber-400 flex items-center gap-3 transition-all hover:scale-105 shadow-glow"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Dashboard Statistik</p>
                  <p className="text-[10px] text-blue-300">Statistik & Kontrol Fitur</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Running Text / Announcement Banner */}
      {isAnnouncementEnabled && announcementText && (
        <div className="glass-card-gold rounded-2xl border border-amber-400/50 overflow-hidden shadow-gold-glow">
          <div className="flex items-center gap-2 px-3 py-2.5">
            <Megaphone className="w-4 h-4 text-amber-400 flex-shrink-0 animate-bounce" />
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-bold text-amber-200 whitespace-nowrap animate-marquee">
                📢 {announcementText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Missions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-gradient-gold">Daftar Misi Kemerdekaan</h2>
          <span className="text-xs font-bold text-amber-300 font-mono">
            {completedActiveCount} / {activeMissions.length} Selesai
          </span>
        </div>

        <div className="space-y-2">
          {activeMissions.map((mission) => {
            const isCompleted = userMissions[mission.id]?.status === 'completed';
            return (
              <div
                key={mission.id}
                className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${isCompleted
                    ? 'glass-card border-emerald-500/30 bg-emerald-950/20'
                    : 'glass-card border-slate-800 hover:border-slate-600'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${isCompleted
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

      {/* Public Leaderboard Section (toggle from Admin) */}
      {isLeaderboardEnabled && leaderboard.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-gradient-gold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Papan Peringkat Peserta
            </h2>
            <span className="text-xs font-bold text-amber-300 font-mono">
              {leaderboard.length} Peserta
            </span>
          </div>

          <div className="space-y-1.5">
            {(showFullLeaderboard ? leaderboard : leaderboard.slice(0, 10)).map((player, idx) => {
              const isCurrentUser = isLoggedIn && player.id === profile.id;
              const rankEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
              return (
                <div
                  key={player.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    isCurrentUser
                      ? 'glass-card-gold border-amber-400/60 shadow-gold-glow'
                      : idx < 3
                        ? 'glass-card border-amber-500/30'
                        : 'glass-card border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 text-center font-black text-sm ${
                      idx < 3 ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      {rankEmoji}
                    </span>
                    <div>
                      <p className={`text-xs font-bold ${isCurrentUser ? 'text-amber-300' : 'text-white'}`}>
                        {player.full_name} {isCurrentUser && '(Kamu)'}
                      </p>
                      <p className="text-[10px] text-slate-400">{player.instansi}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-full ${
                    idx < 3 ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40' : 'bg-slate-900 text-slate-300 border border-slate-700'
                  }`}>
                    {player.total_points} PTS
                  </span>
                </div>
              );
            })}
          </div>

          {leaderboard.length > 10 && (
            <button
              onClick={() => setShowFullLeaderboard(!showFullLeaderboard)}
              className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-all"
            >
              {showFullLeaderboard ? (
                <><ChevronUp className="w-4 h-4" /> Tampilkan 10 Teratas Saja</>
              ) : (
                <><ChevronDown className="w-4 h-4" /> Lihat Semua ({leaderboard.length} Peserta)</>
              )}
            </button>
          )}
        </div>
      )}

      {/* Auth Modal Popup when requested */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
