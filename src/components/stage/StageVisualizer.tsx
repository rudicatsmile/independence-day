'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Flag, Trophy, Sparkles, Volume2, VolumeX, Tv, Flame, Settings, Save, X, Edit3, Maximize2, Minimize2, ZoomIn, Clock, Megaphone, Music } from 'lucide-react';
import { useLiveStore } from '@/stores/useLiveStore';
import { useUserStore } from '@/stores/useUserStore';
import {
  fetchLeaderboardFromSupabase,
  fetchGalleryFromSupabase,
  fetchActivePollFromSupabase,
  fetchLiveEventHeaderFromSupabase,
  updateLiveEventHeaderInSupabase,
} from '@/lib/supabase/services';
import { Profile } from '@/lib/types';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import confetti from 'canvas-confetti';

function useCountdown(targetTime: string | null) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: true });

  useEffect(() => {
    if (!targetTime) { setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true }); return; }

    const tick = () => {
      const diff = new Date(targetTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
      } else {
        setTimeLeft({
          hours: Math.floor(diff / 3600000),
          minutes: Math.floor((diff % 3600000) / 60000),
          seconds: Math.floor((diff % 60000) / 1000),
          expired: false,
        });
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  return timeLeft;
}

export const StageVisualizer: React.FC = () => {
  const saluteCount = useLiveStore((state) => state.saluteCount);
  const triggerSalute = useLiveStore((state) => state.incrementSalute);
  const activePoll = useLiveStore((state) => state.poll);
  const initLiveSupabase = useLiveStore((state) => state.initLiveSupabase);

  const countdownTargetTime = useLiveStore((state) => state.countdownTargetTime);
  const isCountdownEnabled = useLiveStore((state) => state.isCountdownEnabled);
  const announcementText = useLiveStore((state) => state.announcementText);
  const isAnnouncementEnabled = useLiveStore((state) => state.isAnnouncementEnabled);
  const isSfxEnabled = useLiveStore((state) => state.isSfxEnabled);

  const profile = useUserStore((state) => state.profile);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const isAdmin = isLoggedIn && (profile.role === 'admin' || profile.role === 'media_team');
  const galleryItems = useUserStore((state) => state.galleryItems);
  const initSupabaseData = useUserStore((state) => state.initSupabaseData);

  const [leaderboard, setLeaderboard] = useState<Profile[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const previousItemCountRef = useRef(galleryItems.length);

  // Dynamic Header State from Database
  const [eventTitle, setEventTitle] = useState('PANGGUNG UTAMA PERAYAAN HUT RI KE-81');
  const [eventDate, setEventDate] = useState('17 AGUSTUS 2026');
  const [eventYearNumber, setEventYearNumber] = useState('81');

  // Admin Header Settings Modal State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editTitleInput, setEditTitleInput] = useState(eventTitle);
  const [editDateInput, setEditDateInput] = useState(eventDate);
  const [editYearInput, setEditYearInput] = useState(eventYearNumber);
  const [isSavingHeader, setIsSavingHeader] = useState(false);

  // Objective Committee Inspection Modal State
  const [selectedParticipant, setSelectedParticipant] = useState<Profile | null>(null);

  // Full-Screen Wall of Merdeka Mode State
  const [isWallExpanded, setIsWallExpanded] = useState<boolean>(false);
  const [selectedPhotoForZoom, setSelectedPhotoForZoom] = useState<any | null>(null);

  const countdown = useCountdown(isCountdownEnabled ? countdownTargetTime : null);
  const pad = (n: number) => String(n).padStart(2, '0');

  const refreshLeaderboard = async () => {
    const data = await fetchLeaderboardFromSupabase();
    const filteredData = data.filter(p => p.total_points >= 100);
    setLeaderboard(filteredData.slice(0, 5));
  };

  const refreshHeaderInfo = async () => {
    const info = await fetchLiveEventHeaderFromSupabase();
    if (info.event_title) setEventTitle(info.event_title);
    if (info.event_date) setEventDate(info.event_date);
    if (info.event_year_number) setEventYearNumber(info.event_year_number);
  };

  useEffect(() => {
    initSupabaseData();
    initLiveSupabase();

    // Initial Leaderboard & Header fetch strictly from Supabase Cloud
    refreshLeaderboard();
    refreshHeaderInfo();

    // Polling fallback every 3 seconds to guarantee updates
    let pollCount = 0;
    const lbTimer = setInterval(async () => {
      refreshLeaderboard();
      refreshHeaderInfo();

      // Fallback: Fetch gallery every 9 seconds to bypass Realtime 1MB limits
      pollCount++;
      if (pollCount % 3 === 0) {
        const fallbackGallery = await fetchGalleryFromSupabase();
        useUserStore.setState({ galleryItems: fallbackGallery });
      }
    }, 3000);

    // Direct Realtime listener subscription on Stage Visualizer component
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const stageChannel = supabase
        .channel('stage-full-realtime-broadcast-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'gallery_items' },
          async () => {
            const updatedGallery = await fetchGalleryFromSupabase();
            useUserStore.setState({ galleryItems: updatedGallery });
            setCurrentSlideIndex(0); // Jump to newest photo immediately on stage
            confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } });
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'live_event_state' },
          (payload) => {
            if (payload.new) {
              if (payload.new.salute_count) {
                useLiveStore.setState({ saluteCount: payload.new.salute_count });
              }
              if (payload.new.event_title) {
                setEventTitle(payload.new.event_title);
              }
              if (payload.new.event_date) {
                setEventDate(payload.new.event_date);
              }
              if (payload.new.event_year_number) {
                setEventYearNumber(payload.new.event_year_number);
              }
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'polls' },
          async () => {
            const updatedPoll = await fetchActivePollFromSupabase();
            useLiveStore.setState({ poll: updatedPoll });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          () => {
            refreshLeaderboard();
          }
        )
        .subscribe();

      return () => {
        clearInterval(lbTimer);
        supabase.removeChannel(stageChannel);
      };
    }

    return () => {
      clearInterval(lbTimer);
    };
  }, [initSupabaseData, initLiveSupabase]);

  // Sync modal inputs when header state changes
  useEffect(() => {
    setEditTitleInput(eventTitle);
    setEditDateInput(eventDate);
    setEditYearInput(eventYearNumber);
  }, [eventTitle, eventDate, eventYearNumber]);

  // Save Header Info by Administrator
  const handleSaveHeaderInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingHeader(true);

    const { error } = await updateLiveEventHeaderInSupabase(editTitleInput, editDateInput, editYearInput);
    setIsSavingHeader(false);

    if (error) {
      alert('Gagal memperbarui header di Supabase Cloud: ' + error);
    } else {
      setEventTitle(editTitleInput);
      setEventDate(editDateInput);
      setEventYearNumber(editYearInput);
      setIsAdminModalOpen(false);
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.3 } });
    }
  };

  // When a new photo is published from any device, jump immediately to the newly uploaded photo on stage!
  useEffect(() => {
    if (galleryItems.length > previousItemCountRef.current) {
      setCurrentSlideIndex(0);
    }
    previousItemCountRef.current = galleryItems.length;
  }, [galleryItems.length]);

  // Auto slideshow for Wall of Merdeka photos on stage using live gallery items
  useEffect(() => {
    if (galleryItems.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % galleryItems.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [galleryItems.length]);

  // Web Audio API SFX synthesizer for Celebration Trumpet / Sirens
  const playTrumpetSFX = () => {
    if (isAudioMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.12);

        gain.gain.setValueAtTime(0.3, ctx.currentTime + index * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.12 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + index * 0.12);
        osc.stop(ctx.currentTime + index * 0.12 + 0.4);
      });
    } catch (e) {
      console.warn('Audio SFX context error:', e);
    }
  };

  const playExternalAudio = (filename: string) => {
    if (isAudioMuted || !isSfxEnabled) return;
    try {
      const audio = new Audio(`/sfx/${filename}`);
      audio.play().catch(e => console.warn('Could not play external audio (might need interaction first):', e));
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  };

  const handleStageSalute = () => {
    triggerSalute();
    if (isSfxEnabled) playTrumpetSFX();
    confetti({ particleCount: 120, spread: 100, origin: { y: 0.4 } });
  };

  const activePhoto = galleryItems[currentSlideIndex] || galleryItems[0];

  // Calculate dynamic winning option based on highest votes
  const winningOption = activePoll.options && activePoll.options.length > 0
    ? [...activePoll.options].sort((a, b) => b.votes - a.votes)[0]
    : { label: 'Tari Colossal Nusantara', votes: 142 };

  return (
    <div className="min-h-screen bg-[#070A12] text-white p-4 sm:p-6 space-y-6 flex flex-col justify-between select-none">
      {/* Header Banner Panggung */}
      <header className="flex items-center justify-between glass-card-gold rounded-3xl p-4 sm:p-6 border border-amber-400/50 shadow-gold-glow">
        <div className="flex items-center gap-3">
          {/* Logo Yayasan Al-Wathoniyah 9 Emblem */}
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-amber-400/50 p-1 flex items-center justify-center shadow-gold-glow">
            <img
              src="/logo-yayasan.png"
              alt="Logo Yayasan Al-Wathoniyah 9"
              className="w-full h-full object-contain drop-shadow"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-red-950/80 border border-red-500 text-red-400 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 animate-pulse">
                <Tv className="w-3 h-3" /> STAGE DISPLAY LIVE
              </span>
              {/* Dynamic Event Date from Database */}
              <span className="text-xs text-amber-300 font-bold uppercase tracking-wider">
                {eventDate}
              </span>
            </div>

            {/* Dynamic Event Title from Database */}
            <h1 className="text-xl sm:text-2xl font-black text-gradient-gold uppercase tracking-wider">
              {eventTitle}
            </h1>
          </div>
        </div>

        {/* Top Right Admin Actions & Controls */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-3">
            {isAdmin && isSfxEnabled && (
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <span className="text-[10px] text-amber-300 font-bold px-2 flex items-center gap-1">
                  <Music className="w-3 h-3" /> SFX:
                </span>
                <button onClick={() => playExternalAudio('terompet.mp3')} className="p-2 rounded-xl bg-slate-900/80 hover:bg-amber-500/30 border border-slate-700 hover:border-amber-400 text-amber-300 transition-all shadow-glow" title="Terompet Fanfare">
                  🎺
                </button>
                <button onClick={() => playExternalAudio('tepuk-tangan.mp3')} className="p-2 rounded-xl bg-slate-900/80 hover:bg-amber-500/30 border border-slate-700 hover:border-amber-400 text-amber-300 transition-all shadow-glow" title="Tepuk Tangan">
                  👏
                </button>
                <button onClick={() => playExternalAudio('drum-roll.mp3')} className="p-2 rounded-xl bg-slate-900/80 hover:bg-amber-500/30 border border-slate-700 hover:border-amber-400 text-amber-300 transition-all shadow-glow" title="Drum Roll">
                  🥁
                </button>
                <button onClick={() => playExternalAudio('indonesia-raya.mp3')} className="p-2 rounded-xl bg-slate-900/80 hover:bg-amber-500/30 border border-slate-700 hover:border-amber-400 text-amber-300 transition-all shadow-glow" title="Indonesia Raya">
                  🎵
                </button>
              </div>
            )}

            <button
              onClick={() => setIsAudioMuted(!isAudioMuted)}
              className={`p-3 rounded-2xl border transition-all ${isAudioMuted
                  ? 'bg-slate-900 border-slate-700 text-slate-400'
                  : 'bg-amber-500/20 border-amber-400/50 text-amber-300 shadow-gold-glow'
                }`}
              title={isAudioMuted ? 'Nyalakan Efek Suara' : 'Matikan Efek Suara'}
            >
              {isAudioMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {isAdmin && (
              <button
                onClick={handleStageSalute}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-merdeka-red to-amber-500 text-slate-950 font-black text-sm uppercase shadow-gold-glow shimmer-btn hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
              >
                <Flame className="w-5 h-5" />
                <span>Picu Hormat Panggung</span>
              </button>
            )}
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-400 text-[10px] font-bold hover:bg-slate-800 hover:text-amber-300 transition-all flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Ubah Teks Header (Admin)</span>
            </button>
          )}
        </div>
      </header>

      {/* Running Text / Announcement Banner (Admin Controlled) */}
      {isAnnouncementEnabled && announcementText && (
        <div className="w-full glass-card border-y border-amber-500/40 bg-amber-500/10 py-2.5 overflow-hidden shadow-gold-glow relative z-10 flex items-center">
          <div className="absolute left-0 top-0 bottom-0 px-4 bg-gradient-to-r from-[#070A12] via-[#070A12] to-transparent z-20 flex items-center gap-2 border-r border-amber-500/30">
            <Megaphone className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="text-xs font-black text-amber-300 uppercase tracking-widest hidden sm:inline">PENGUMUMAN</span>
          </div>
          <div className="flex-1 overflow-hidden pl-32 sm:pl-48">
            <p className="text-xl font-black text-amber-200 whitespace-nowrap animate-marquee">
              📢 {announcementText}
            </p>
          </div>
        </div>
      )}

      {/* Main Stage Split Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto">
        {/* Left Column: Huge Live Salute Visualizer */}
        <div className="lg:col-span-5 glass-card-red rounded-3xl p-6 sm:p-8 border border-merdeka-red/40 space-y-6 flex flex-col justify-center text-center shadow-2xl relative">

          {/* Main Event Title Info */}
          <div className="space-y-2">
            <span className="text-sm font-bold text-amber-300 uppercase tracking-widest">
              GELORA HORMAT! KEMERDEKAAN MASAL
            </span>
            <div className="text-6xl sm:text-7xl font-black text-white drop-shadow-xl font-mono tracking-tight">
              {saluteCount.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-slate-300">Total ketukan Hormat! dari seluruh HP peserta di lokasi acara</p>
          </div>

          {/* Countdown Timer Panggung */}
          {isCountdownEnabled && !countdown.expired && (
            <div className="glass-card bg-slate-950/80 rounded-2xl p-4 border border-amber-400/50 text-center space-y-2 shadow-gold-glow mx-auto max-w-md">
              <div className="flex items-center justify-center gap-2 text-amber-300 text-[10px] font-bold uppercase tracking-widest">
                <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>Menuju Detik Proklamasi</span>
              </div>
              <div className="flex items-center justify-center gap-3 font-mono">
                <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-amber-500/40 text-4xl font-black text-white shadow-glow">
                  {pad(countdown.hours)}
                </div>
                <span className="text-2xl font-black text-amber-400 animate-pulse mt-2">:</span>
                <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-amber-500/40 text-4xl font-black text-white shadow-glow">
                  {pad(countdown.minutes)}
                </div>
                <span className="text-2xl font-black text-amber-400 animate-pulse mt-2">:</span>
                <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-merdeka-red/50 text-4xl font-black text-red-400 shadow-glow">
                  {pad(countdown.seconds)}
                </div>
              </div>
            </div>
          )}

          {/* Giant Animated Flag Emblem */}
          <div className="relative w-56 h-56 mx-auto my-4 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-merdeka-red via-amber-500 to-merdeka-red animate-spin-slow opacity-40 blur-xl" />
            <div className="relative z-10 w-52 h-52 rounded-full bg-slate-950 border-4 border-amber-400 flex flex-col items-center justify-center shadow-gold-glow animate-pulse overflow-hidden p-1.5">
              <img src="/hormat.png" alt="Hormat Bendera" className="w-36 h-36 object-contain drop-shadow-2xl scale-125 -mt-1" />
              {/* Dynamic Emblem Label */}
              <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest -mt-1">Hormat Bendera</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 text-xs text-center space-y-1">
            <p className="text-amber-300 font-bold">📊 Polling Paling Memukau Terkini:</p>
            <p className="text-white font-black text-sm">"{activePoll.question}"</p>
            <p className="text-amber-400 font-bold text-xs mt-1">
              🏆 Pilihan Tertinggi: <span className="text-white font-extrabold">{winningOption.label}</span> ({winningOption.votes} Suara)
            </p>
          </div>
        </div>

        {/* Right Column: Wall of Merdeka Live Photo Slideshow */}
        <div className="lg:col-span-7 glass-card rounded-3xl p-6 border border-amber-400/40 space-y-4 flex flex-col justify-between shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>WALL OF MERDEKA • SLIDESHOW TWIBBON</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-bold hidden sm:inline">
                Foto {currentSlideIndex + 1} dari {galleryItems.length}
              </span>
              <button
                type="button"
                onClick={() => setIsWallExpanded(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 hover:bg-amber-500/30 transition-all font-bold text-xs flex items-center gap-1.5 shadow-gold-glow hover:scale-105"
                title="Perluas Layar untuk Menampilkan Seluruh Foto Twibbon"
              >
                <Maximize2 className="w-3.5 h-3.5 text-amber-400" />

              </button>
            </div>
          </div>

          {/* Active Photo Carousel Card */}
          {activePhoto ? (
            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
              <img
                src={activePhoto.image_url}
                alt={activePhoto.caption}
                className="w-full h-full object-cover animate-fade-in"
              />

              {/* Special Badge if photo is Teacher Selfie */}
              {activePhoto.caption.includes('Selfie Bersama Guru') && (
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-gold-glow flex items-center gap-1.5 animate-bounce">
                  <span>🎓 MOMEN BERSAMA </span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6 space-y-2">
                <div className="flex items-center gap-3">
                  <img
                    src={activePhoto.user_avatar || '/logo-yayasan.png'}
                    alt={activePhoto.user_name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shadow-lg"
                  />
                  <div>
                    <h3 className="text-base font-black text-white">{activePhoto.user_name}</h3>
                    <p className="text-xs text-amber-300 font-semibold">{activePhoto.instansi}</p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 font-medium italic line-clamp-2">
                  "{activePhoto.caption}"
                </p>
              </div>
            </div>
          ) : (
            /* Fallback Card when Gallery is Empty: Displays Ultra Large logo-yayasan.png filling the entire box */
            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-950/90 border border-amber-500/50 shadow-gold-glow flex items-center justify-center p-2">
              <img
                src="/logo-yayasan.png"
                alt="Logo Yayasan Al-Wathoniyah 9"
                className="w-full h-full object-contain p-2 drop-shadow-2xl animate-pulse"
              />
            </div>
          )}

          {/* Bottom Leaderboard Top 5 Carousel Strip */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-amber-400 flex items-center gap-1">
                <Trophy className="w-4 h-4" /> TOP 5 POINT TERATAS
              </span>
              <span className="text-slate-400 text-[10px]">Data Murni Database Profiles ({leaderboard.length} Peserta)</span>
            </div>

            {leaderboard.length > 0 ? (
              <div className="grid grid-cols-5 gap-2">
                {leaderboard.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    onClick={() => setSelectedParticipant(item)}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer hover:scale-105 ${idx === 0
                      ? 'glass-card-gold border-amber-400 text-amber-300 font-bold shadow-gold-glow'
                      : 'glass-card border-slate-800 text-slate-300 hover:border-amber-400/50'
                      }`}
                    title="Klik untuk inspeksi foto Twibbon & Selfie Guru"
                  >
                    <div className="text-[10px] font-black text-amber-400">#{idx + 1}</div>
                    <p className="text-[11px] font-bold text-white truncate">{item.full_name}</p>
                    <p className="text-[9px] text-amber-300 font-mono font-bold">{item.total_points} PTS</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                Belum ada data profil terdaftar di database.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Modal to Edit Dynamic Header Title, Date, and Year Number */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md glass-card-gold rounded-3xl p-6 border border-amber-400/60 space-y-5 shadow-gold-glow relative">
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Edit3 className="w-5 h-5" />
                <span>KONTROL HEADER LAYAR PANGGUNG (ADMIN)</span>
              </div>
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHeaderInfo} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-300 block">
                  1. Judul Utama Acara Panggung:
                </label>
                <input
                  type="text"
                  required
                  value={editTitleInput}
                  onChange={(e) => setEditTitleInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  placeholder="Contoh: PANGGUNG UTAMA PERAYAAN HUT RI KE-81"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-300 block">
                  2. Tanggal Acara Kemerdekaan (event_date):
                </label>
                <input
                  type="text"
                  required
                  value={editDateInput}
                  onChange={(e) => setEditDateInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  placeholder="Contoh: 17 AGUSTUS 2026"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-300 block">
                  3. Angka Umur Kemerdekaan / Perayaan (misal: 81):
                </label>
                <input
                  type="text"
                  required
                  value={editYearInput}
                  onChange={(e) => setEditYearInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 font-mono font-bold"
                  placeholder="Contoh: 81"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingHeader}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-merdeka-red to-amber-500 text-slate-950 font-black text-xs shadow-gold-glow flex items-center gap-1.5 hover:scale-105"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingHeader ? 'Menyimpan...' : 'Simpan & Broadcast Live'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Participant Inspector Modal for Committee/Panitia Objective Verification */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl glass-card-gold rounded-3xl p-6 border-2 border-amber-400/60 space-y-4 shadow-gold-glow relative max-h-[90vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                  INSPEKSI OBJEKTIF PANITIA • TOP 5 POIN TERATAS
                </span>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <span>{selectedParticipant.full_name}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono font-bold border border-amber-400/40">
                    {selectedParticipant.total_points} PTS
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Lembaga / Instansi: <strong className="text-amber-300">{selectedParticipant.instansi || 'Yayasan Al-Wathoniyah 9'}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedParticipant(null)}
                className="p-2 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photos Grid for Inspection */}
            {(() => {
              const userPhotos = galleryItems.filter(
                (g) => g.user_id === selectedParticipant.id || g.user_name === selectedParticipant.full_name
              );
              const twibbonPhoto = userPhotos.find(
                (g) => !g.caption?.toLowerCase().includes('guru')
              ) || userPhotos[0];
              const guruPhoto = userPhotos.find(
                (g) => g.caption?.toLowerCase().includes('guru')
              );

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Card 1: Foto Twibbon */}
                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" /> Foto Twibbon Upload
                      </span>
                      {twibbonPhoto && (
                        <span className="text-[10px] text-emerald-400 font-bold">✓ Terverifikasi</span>
                      )}
                    </div>

                    {twibbonPhoto ? (
                      <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-700 relative">
                        <img
                          src={twibbonPhoto.image_url}
                          alt={twibbonPhoto.caption || 'Twibbon Participant'}
                          className="w-full h-full object-cover"
                        />
                        <p className="absolute bottom-0 inset-x-0 p-2 text-[10px] bg-black/70 text-slate-200 line-clamp-1">
                          {twibbonPhoto.caption || 'Twibbon Photobooth'}
                        </p>
                      </div>
                    ) : (
                      <div className="aspect-square w-full rounded-xl bg-slate-900/50 border border-dashed border-slate-800 flex flex-col items-center justify-center text-center p-4 space-y-1">
                        <span className="text-2xl">🖼️</span>
                        <p className="text-xs font-bold text-slate-400">Belum Ada Foto Twibbon</p>
                        <p className="text-[10px] text-slate-500">Peserta belum mengunggah twibbon ke galeri</p>
                      </div>
                    )}
                  </div>

                  {/* Card 2: Foto Selfie Bersama Guru Patriot */}
                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-amber-400" /> Selfie bersama Guru Patriot
                      </span>
                      {guruPhoto && (
                        <span className="text-[10px] text-emerald-400 font-bold">✓ Terverifikasi</span>
                      )}
                    </div>

                    {guruPhoto ? (
                      <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-700 relative">
                        <img
                          src={guruPhoto.image_url}
                          alt={guruPhoto.caption || 'Selfie Guru'}
                          className="w-full h-full object-cover"
                        />
                        <p className="absolute bottom-0 inset-x-0 p-2 text-[10px] bg-black/70 text-slate-200 line-clamp-1">
                          {guruPhoto.caption || 'Selfie bersama Guru Patriot'}
                        </p>
                      </div>
                    ) : (
                      <div className="aspect-square w-full rounded-xl bg-slate-900/50 border border-dashed border-slate-800 flex flex-col items-center justify-center text-center p-4 space-y-1">
                        <span className="text-2xl">📸</span>
                        <p className="text-xs font-bold text-slate-400">Belum Mengunggah Foto</p>
                        <p className="text-[10px] text-slate-500">Peserta belum menyelesaikan Misi Photo Kebersamaan</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="pt-2 text-right border-t border-amber-500/20">
              <button
                onClick={() => setSelectedParticipant(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs hover:bg-slate-800"
              >
                Tutup Inspeksi Panitia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Expanded Wall of Merdeka Grid Mode (Overlay covering Stage Display & Counter) */}
      {isWallExpanded && (
        <div className="fixed inset-0 z-50 bg-[#070A12]/98 backdrop-blur-2xl p-4 sm:p-8 overflow-y-auto space-y-6 animate-fade-in flex flex-col justify-between">
          {/* Top Bar Header */}
          <div className="flex items-center justify-between border-b border-amber-500/30 pb-4 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-gold-glow">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">
                  GALERI FOTO RESMI STAGE DISPLAY
                </span>
                <h2 className="text-2xl font-black text-white">
                  Wall of Merdeka <span className="text-gradient-gold">• Seluruh Foto Twibbon</span>
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-amber-300 text-xs font-mono font-bold">
                {galleryItems.length} Foto Terpublikasi
              </span>
              <button
                type="button"
                onClick={() => setIsWallExpanded(false)}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-merdeka-red via-amber-500 to-merdeka-red text-slate-950 font-black text-xs shadow-gold-glow flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <Minimize2 className="w-4 h-4 text-slate-950" />
                <span>↙️ Kecilkan Layar (Kembali)</span>
              </button>
            </div>
          </div>

          {/* Full Grid of All Twibbon Photos Only (Exclude Selfie Guru / Bestie) */}
          {(() => {
            const twibbonOnlyItems = galleryItems.filter(
              (photo) => !photo.caption?.toLowerCase().includes('selfie bersama') && !photo.caption?.toLowerCase().includes('guru')
            );

            return twibbonOnlyItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 py-2 my-auto">
                {twibbonOnlyItems.map((photo, idx) => (
                  <div
                    key={photo.id || idx}
                    onClick={() => setSelectedPhotoForZoom(photo)}
                    className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 hover:border-amber-400/80 transition-all duration-300 cursor-pointer shadow-xl hover:scale-105 hover:shadow-gold-glow"
                  >
                    <img
                      src={photo.image_url}
                      alt={photo.caption || 'Foto Twibbon'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                    {/* Top Zoom Icon Indicator */}
                    <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-md text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn className="w-4 h-4" />
                    </div>

                    {/* Bottom Caption & User Badge */}
                    <div className="absolute bottom-0 inset-x-0 p-3 space-y-0.5 text-left">
                      <p className="text-xs font-black text-white truncate drop-shadow">
                        {photo.user_name || 'Peserta Perayaan'}
                      </p>
                      <p className="text-[10px] text-amber-300 font-bold truncate">
                        {photo.instansi || 'Yayasan Al-Wathoniyah 9'}
                      </p>
                      {photo.caption && (
                        <p className="text-[9px] text-slate-300 line-clamp-1 italic opacity-80 pt-0.5">
                          "{photo.caption}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 rounded-3xl bg-slate-950/80 border border-slate-800 text-center space-y-3 my-auto">
                <span className="text-4xl">🖼️</span>
                <h3 className="text-lg font-bold text-white">Belum Ada Foto Twibbon Terpublikasi</h3>
                <p className="text-xs text-slate-400">
                  Foto Twibbon yang diunggah oleh peserta akan muncul di sini secara otomatis secara live!
                </p>
              </div>
            );
          })()}

          {/* Footer Bar inside Overlay */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>💡 Klik salah satu foto untuk memperbesar foto dalam resolusi tinggi</span>
            <button
              onClick={() => setIsWallExpanded(false)}
              className="text-amber-400 hover:underline font-bold"
            >
              Tutup Galeri Grid
            </button>
          </div>
        </div>
      )}

      {/* Zoom Photo Popup Viewer Modal */}
      {selectedPhotoForZoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl glass-card-gold rounded-3xl p-6 border-2 border-amber-400/60 space-y-4 shadow-gold-glow relative max-h-[90vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                  DETAIL FOTO TWIBBON • WALL OF MERDEKA
                </span>
                <h3 className="text-lg font-black text-white">{selectedPhotoForZoom.user_name || 'Peserta'}</h3>
                <p className="text-xs text-slate-300">{selectedPhotoForZoom.instansi || 'Yayasan Al-Wathoniyah 9'}</p>
              </div>
              <button
                onClick={() => setSelectedPhotoForZoom(null)}
                className="p-2 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-950 border border-amber-400/50 shadow-2xl relative">
              <img
                src={selectedPhotoForZoom.image_url}
                alt={selectedPhotoForZoom.caption || 'Zoom Photo'}
                className="w-full h-full object-contain"
              />
            </div>

            {selectedPhotoForZoom.caption && (
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-200">
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Pesan / Caption:</p>
                <p className="italic">"{selectedPhotoForZoom.caption}"</p>
              </div>
            )}

            <div className="text-right pt-2 border-t border-amber-500/20">
              <button
                onClick={() => setSelectedPhotoForZoom(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs hover:bg-slate-800"
              >
                Tutup Foto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
