'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Flag, Trophy, Sparkles, Volume2, VolumeX, Tv, Flame, Settings, Save, X, Edit3 } from 'lucide-react';
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

export const StageVisualizer: React.FC = () => {
  const saluteCount = useLiveStore((state) => state.saluteCount);
  const triggerSalute = useLiveStore((state) => state.incrementSalute);
  const activePoll = useLiveStore((state) => state.poll);
  const initLiveSupabase = useLiveStore((state) => state.initLiveSupabase);

  const profile = useUserStore((state) => state.profile);
  const galleryItems = useUserStore((state) => state.galleryItems);
  const initSupabaseData = useUserStore((state) => state.initSupabaseData);

  const [leaderboard, setLeaderboard] = useState<Profile[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const previousItemCountRef = useRef(galleryItems.length);

  // Dynamic Header State from Database
  const [eventTitle, setEventTitle] = useState('PANGGUNG UTAMA PERAYAAN HUT RI KE-81');
  const [eventDate, setEventDate] = useState('17 AGUSTUS 2026');
  
  // Admin Header Settings Modal State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editTitleInput, setEditTitleInput] = useState(eventTitle);
  const [editDateInput, setEditDateInput] = useState(eventDate);
  const [isSavingHeader, setIsSavingHeader] = useState(false);

  const refreshLeaderboard = async () => {
    const data = await fetchLeaderboardFromSupabase();
    setLeaderboard(data.slice(0, 5));
  };

  const refreshHeaderInfo = async () => {
    const info = await fetchLiveEventHeaderFromSupabase();
    if (info.event_title) setEventTitle(info.event_title);
    if (info.event_date) setEventDate(info.event_date);
  };

  useEffect(() => {
    initSupabaseData();
    initLiveSupabase();

    // Initial Leaderboard & Header fetch strictly from Supabase Cloud
    refreshLeaderboard();
    refreshHeaderInfo();

    // Polling fallback every 3 seconds to guarantee updates
    const lbTimer = setInterval(() => {
      refreshLeaderboard();
      refreshHeaderInfo();
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
  }, [eventTitle, eventDate]);

  // Save Header Info by Administrator
  const handleSaveHeaderInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingHeader(true);

    const { error } = await updateLiveEventHeaderInSupabase(editTitleInput, editDateInput);
    setIsSavingHeader(false);

    if (error) {
      alert('Gagal memperbarui header di Supabase Cloud: ' + error);
    } else {
      setEventTitle(editTitleInput);
      setEventDate(editDateInput);
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

  const handleStageSalute = () => {
    triggerSalute();
    playTrumpetSFX();
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-merdeka-red to-amber-500 border border-amber-300 flex items-center justify-center shadow-glow font-black text-2xl text-white">
            81
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

        <div className="flex items-center gap-3">
          {/* Admin Control Button to edit Header Title & Date */}
          <button
            onClick={() => setIsAdminModalOpen(true)}
            className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-300 hover:bg-amber-500/30 transition-colors flex items-center justify-center"
            title="Kelola Header Panggung (Admin)"
          >
            <Settings className="w-5 h-5 text-amber-400" />
          </button>

          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title={isAudioMuted ? 'Unmute Audio Sirine' : 'Mute Audio Sirine'}
          >
            {isAudioMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-amber-400" />}
          </button>

          <button
            onClick={handleStageSalute}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-merdeka-red to-amber-500 text-slate-950 font-black text-xs shadow-gold-glow shimmer-btn flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <Flame className="w-4 h-4" />
            <span>Picu Hormat Panggung (SFX)</span>
          </button>
        </div>
      </header>

      {/* Main Grid: Visualizer Live Salute + Wall of Merdeka Carousel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto">
        {/* Left Column: Huge Live Salute Visualizer */}
        <div className="lg:col-span-5 glass-card-red rounded-3xl p-8 border border-merdeka-red/50 text-center space-y-6 flex flex-col justify-between shadow-glow relative overflow-hidden">
          <div className="space-y-2">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-widest block">
              🇮🇩 GELORA HORMAT! KEMERDEKAAN MASSAL
            </span>
            <div className="text-6xl sm:text-7xl font-black text-white tracking-tight font-mono drop-shadow-2xl text-gradient-gold">
              {saluteCount.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-slate-300">Total ketukan Hormat! dari seluruh HP peserta di lokasi acara</p>
          </div>

          {/* Giant Animated Flag Emblem */}
          <div className="relative w-48 h-48 mx-auto my-4 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-merdeka-red via-amber-500 to-merdeka-red animate-spin-slow opacity-40 blur-xl" />
            <div className="relative z-10 w-44 h-44 rounded-full bg-slate-950 border-4 border-amber-400 flex flex-col items-center justify-center shadow-gold-glow animate-pulse">
              <span className="text-6xl mb-1">🫡</span>
              <span className="text-xs font-black text-amber-300 uppercase tracking-widest">NUSANTARA 81</span>
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
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>WALL OF MERDEKA • SLIDESHOW TERBARU</span>
            </div>
            <span className="text-xs text-slate-400 font-bold">
              Foto {currentSlideIndex + 1} dari {galleryItems.length}
            </span>
          </div>

          {/* Active Photo Carousel Card */}
          {activePhoto && (
            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
              <img
                src={activePhoto.image_url}
                alt={activePhoto.caption}
                className="w-full h-full object-cover animate-fade-in"
              />

              {/* Special Badge if photo is Teacher Selfie */}
              {activePhoto.caption.includes('Selfie Bersama Guru') && (
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-gold-glow flex items-center gap-1.5 animate-bounce">
                  <span>🎓 MOMEN PATRIOT: SELFIE GURU & MURID</span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6 space-y-2">
                <div className="flex items-center gap-3">
                  <img
                    src={activePhoto.user_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
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
          )}

          {/* Bottom Leaderboard Top 5 Carousel Strip */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-amber-400 flex items-center gap-1">
                <Trophy className="w-4 h-4" /> LEADERBOARD TOP 5 KEMERDEKAAN (STRICT LIVE DB)
              </span>
              <span className="text-slate-400 text-[10px]">Data Murni Database Profiles ({leaderboard.length} Peserta)</span>
            </div>

            {leaderboard.length > 0 ? (
              <div className="grid grid-cols-5 gap-2">
                {leaderboard.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      idx === 0
                        ? 'glass-card-gold border-amber-400 text-amber-300 font-bold shadow-gold-glow'
                        : 'glass-card border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="text-[10px] font-black text-amber-400">#{idx + 1}</div>
                    <p className="text-[11px] font-bold text-white truncate">{item.full_name}</p>
                    <p className="text-[9px] text-amber-300 font-mono font-bold">{item.total_points} PTS</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                Belum ada data profil terdaftar di database Supabase Cloud.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Modal to Edit Dynamic Header Title & Date */}
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
                  2. Kalimat Subtitle / Tanggal Acara:
                </label>
                <input
                  type="text"
                  required
                  value={editDateInput}
                  onChange={(e) => setEditDateInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  placeholder="Contoh: 17 AGUSTUS 2026 / PERAYAAN NASIONAL"
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
    </div>
  );
};
