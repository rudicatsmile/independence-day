'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3, Users, Camera, Heart, HelpCircle, Flag, Vote,
  ArrowLeft, RefreshCw, Clock, Megaphone, Trophy, Music,
  ToggleLeft, ToggleRight, Save, Timer, Sparkles, AlertTriangle
} from 'lucide-react';
import { useUserStore } from '@/stores/useUserStore';
import { useLiveStore } from '@/stores/useLiveStore';
import {
  fetchAdminStatsFromSupabase,
  updateCountdownInSupabase,
  updateAnnouncementInSupabase,
  updateLeaderboardToggleInSupabase,
  updateSfxToggleInSupabase,
  updateMissionsToggleInSupabase,
  updateEventFinishedToggleInSupabase,
  executeFactoryReset,
} from '@/lib/supabase/services';

export default function AdminDashboardPage() {
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const initSupabaseData = useUserStore((state) => state.initSupabaseData);
  const initLiveSupabase = useLiveStore((state) => state.initLiveSupabase);

  const countdownTargetTime = useLiveStore((state) => state.countdownTargetTime);
  const isCountdownEnabled = useLiveStore((state) => state.isCountdownEnabled);
  const announcementText = useLiveStore((state) => state.announcementText);
  const isAnnouncementEnabled = useLiveStore((state) => state.isAnnouncementEnabled);
  const isLeaderboardEnabled = useLiveStore((state) => state.isLeaderboardEnabled);
  const isSfxEnabled = useLiveStore((state) => state.isSfxEnabled);
  const isMissionsEnabled = useLiveStore((state) => state.isMissionsEnabled);
  const isEventFinished = useLiveStore((state) => state.isEventFinished);

  const isAdmin = isLoggedIn && (profile.role === 'admin' || profile.role === 'media_team');

  const [stats, setStats] = useState({
    totalParticipants: 0,
    totalTwibbonPhotos: 0,
    totalSelfiePhotos: 0,
    totalQuizCompleted: 0,
    totalSaluteCount: 1945,
    totalPollVotes: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Admin Controls Local State
  const [countdownInput, setCountdownInput] = useState('');
  const [announcementInput, setAnnouncementInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    initSupabaseData();
    initLiveSupabase();
  }, [initSupabaseData, initLiveSupabase]);

  useEffect(() => {
    setAnnouncementInput(announcementText);
    if (countdownTargetTime) {
      // Convert ISO to local datetime-local format
      try {
        const d = new Date(countdownTargetTime);
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setCountdownInput(local);
      } catch { setCountdownInput(''); }
    }
  }, [announcementText, countdownTargetTime]);

  const refreshStats = async () => {
    setIsLoadingStats(true);
    const data = await fetchAdminStatsFromSupabase();
    setStats(data);
    setIsLoadingStats(false);
  };

  useEffect(() => {
    refreshStats();
  }, []);

  const handleSaveCountdown = async () => {
    setIsSaving(true);
    const targetISO = countdownInput ? new Date(countdownInput).toISOString() : null;
    useLiveStore.setState({ countdownTargetTime: targetISO, isCountdownEnabled: isCountdownEnabled });
    await updateCountdownInSupabase(targetISO, isCountdownEnabled);
    setIsSaving(false);
  };

  const handleToggleCountdown = async () => {
    setIsSaving(true);
    const targetISO = countdownInput ? new Date(countdownInput).toISOString() : null;
    useLiveStore.setState({ isCountdownEnabled: !isCountdownEnabled });
    await updateCountdownInSupabase(targetISO, !isCountdownEnabled);
    setIsSaving(false);
  };

  const handleSaveAnnouncement = async () => {
    setIsSaving(true);
    useLiveStore.setState({ announcementText: announcementInput, isAnnouncementEnabled: isAnnouncementEnabled });
    await updateAnnouncementInSupabase(announcementInput, isAnnouncementEnabled);
    setIsSaving(false);
  };

  const handleToggleAnnouncement = async () => {
    setIsSaving(true);
    useLiveStore.setState({ isAnnouncementEnabled: !isAnnouncementEnabled });
    await updateAnnouncementInSupabase(announcementInput, !isAnnouncementEnabled);
    setIsSaving(false);
  };

  const handleToggleLeaderboard = async () => {
    setIsSaving(true);
    useLiveStore.setState({ isLeaderboardEnabled: !isLeaderboardEnabled });
    await updateLeaderboardToggleInSupabase(!isLeaderboardEnabled);
    setIsSaving(false);
  };

  const handleToggleSfx = async () => {
    setIsSaving(true);
    useLiveStore.setState({ isSfxEnabled: !isSfxEnabled });
    await updateSfxToggleInSupabase(!isSfxEnabled);
    setIsSaving(false);
  };

  const handleToggleMissions = async () => {
    setIsSaving(true);
    useLiveStore.setState({ isMissionsEnabled: !isMissionsEnabled });
    await updateMissionsToggleInSupabase(!isMissionsEnabled);
    setIsSaving(false);
  };

  const handleToggleEventFinished = async () => {
    const nextState = !isEventFinished;
    if (nextState && !confirm('Yakin ingin menutup acara? Semua peserta akan melihat pesan acara selesai.')) return;
    
    setIsSaving(true);
    useLiveStore.setState({ isEventFinished: nextState });
    await updateEventFinishedToggleInSupabase(nextState);
    setIsSaving(false);
  };

  const handleFactoryReset = async () => {
    setIsResetting(true);
    const { error } = await executeFactoryReset();
    if (error) {
      alert('Gagal melakukan factory reset: ' + error);
    } else {
      alert('Factory Reset berhasil dieksekusi! Semua data percobaan telah dibersihkan.');
      setShowResetConfirm(false);
      refreshStats(); // Refresh dashboard stats
    }
    setIsResetting(false);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#070A12] text-white flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-lg font-bold text-red-400">⛔ Akses Ditolak</p>
          <p className="text-sm text-slate-300">Halaman ini hanya untuk Administrator & Panitia.</p>
          <Link href="/home" className="inline-block px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Peserta Terdaftar', value: stats.totalParticipants, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { label: 'Foto Twibbon', value: stats.totalTwibbonPhotos, icon: Camera, color: 'text-amber-400', bg: 'bg-amber-500/20' },
    { label: 'Selfie Bestie', value: stats.totalSelfiePhotos, icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/20' },
    { label: 'Quiz Selesai', value: stats.totalQuizCompleted, icon: HelpCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    { label: 'Ketukan Hormat', value: stats.totalSaluteCount, icon: Flag, color: 'text-red-400', bg: 'bg-red-500/20' },
    { label: 'Suara Polling', value: stats.totalPollVotes, icon: Vote, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  ];

  const ToggleButton = ({ enabled, onToggle, label }: { enabled: boolean; onToggle: () => void; label: string }) => (
    <button
      onClick={onToggle}
      disabled={isSaving}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
        enabled
          ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
          : 'bg-slate-900 border border-slate-700 text-slate-400'
      }`}
    >
      {enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
      <span>{enabled ? `${label} ON` : `${label} OFF`}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#070A12] text-white p-4 sm:p-6 space-y-6 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/home"
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
              PANEL ADMINISTRATOR
            </span>
            <h1 className="text-2xl font-black text-gradient-gold">Dashboard Statistik</h1>
          </div>
        </div>
        <button
          onClick={refreshStats}
          disabled={isLoadingStats}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-bold text-xs flex items-center gap-2 hover:bg-slate-800"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3 hover:border-amber-400/40 transition-all">
              <div className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">{card.label}</span>
              </div>
              <p className="text-3xl font-black text-white font-mono">
                {isLoadingStats ? '...' : card.value.toLocaleString('id-ID')}
              </p>
            </div>
          );
        })}
      </div>

      {/* Feature Toggles Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-gradient-gold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-amber-400" />
          Kontrol Fitur Acara (Enable / Disable)
        </h2>

        {/* === MISSION CONTROL - Main Switch === */}
        <div className={`glass-card rounded-2xl p-5 border-2 space-y-2 transition-all ${
          isMissionsEnabled ? 'border-emerald-400/60 shadow-[0_0_20px_rgba(52,211,153,0.2)]' : 'border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">{isMissionsEnabled ? '🟢' : '🔴'}</span>
                <span className="text-base font-black text-white">Mission Control (Global)</span>
              </div>
              <p className="text-[11px] text-slate-400 pl-8">
                {isMissionsEnabled
                  ? 'Semua misi AKTIF — peserta bisa mengerjakan misi sekarang.'
                  : 'Semua misi TERKUNCI — peserta hanya melihat countdown timer.'}
              </p>
            </div>
            <button
              onClick={handleToggleMissions}
              disabled={isSaving}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all ${
                isMissionsEnabled
                  ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 hover:bg-emerald-500/30'
                  : 'bg-red-500/20 border-2 border-red-400 text-red-300 hover:bg-red-500/30'
              }`}
            >
              {isMissionsEnabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              <span>{isMissionsEnabled ? 'MISI ON' : 'MISI OFF'}</span>
            </button>
          </div>
        </div>

        {/* === PENUTUPAN ACARA (EVENT FINISHED) === */}
        <div className={`glass-card rounded-2xl p-5 border-2 space-y-2 transition-all ${
          isEventFinished ? 'border-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.2)]' : 'border-slate-800'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 ${isEventFinished ? 'text-amber-400' : 'text-slate-500'}`} />
                <span className="text-base font-black text-white">Status Akhir Acara</span>
              </div>
              <p className="text-[11px] text-slate-400 pl-7">
                {isEventFinished
                  ? 'ACARA SELESAI — Peserta akan melihat pesan terima kasih.'
                  : 'ACARA BERJALAN — Misi masih mengikuti aturan Mission Control di atas.'}
              </p>
            </div>
            <button
              onClick={handleToggleEventFinished}
              disabled={isSaving}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all ${
                isEventFinished
                  ? 'bg-amber-500/20 border-2 border-amber-400 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-slate-800 border-2 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {isEventFinished ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              <span>{isEventFinished ? 'ACARA SELESAI' : 'ACARA AKTIF'}</span>
            </button>
          </div>
        </div>

        {/* Countdown Timer Control */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-bold text-white">Countdown Timer Panggung</span>
            </div>
            <ToggleButton enabled={isCountdownEnabled} onToggle={handleToggleCountdown} label="Countdown" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="datetime-local"
              value={countdownInput}
              onChange={(e) => setCountdownInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
            />
            <button
              onClick={handleSaveCountdown}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-merdeka-red to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-gold-glow hover:scale-105"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan</span>
            </button>
          </div>
        </div>

        {/* Announcement Control */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-bold text-white">Running Text / Pengumuman</span>
            </div>
            <ToggleButton enabled={isAnnouncementEnabled} onToggle={handleToggleAnnouncement} label="Pengumuman" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={announcementInput}
              onChange={(e) => setAnnouncementInput(e.target.value)}
              placeholder="Ketik teks pengumuman berjalan..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />
            <button
              onClick={handleSaveAnnouncement}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-merdeka-red to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-gold-glow hover:scale-105"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan</span>
            </button>
          </div>
        </div>

        {/* Leaderboard Toggle */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-bold text-white">Leaderboard Publik (di Halaman Home)</span>
            </div>
            <ToggleButton enabled={isLeaderboardEnabled} onToggle={handleToggleLeaderboard} label="Leaderboard" />
          </div>
        </div>

        {/* SFX Toggle */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-bold text-white">Sound Effects Panggung</span>
            </div>
            <ToggleButton enabled={isSfxEnabled} onToggle={handleToggleSfx} label="SFX" />
          </div>
        </div>
      </div>

      {/* Manajemen Lomba & Penilaian Section */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-black text-gradient-gold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          Manajemen Lomba & Penilaian
        </h2>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-amber-400/40 transition-all cursor-pointer" onClick={() => window.location.href = '/admin/cosplay'}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Panel Penilaian Juri Cosplay</h3>
                <p className="text-xs text-slate-400">Input peserta, nilai performa, dan publikasikan pemenang</p>
              </div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-bold whitespace-nowrap">
              Buka Panel &rarr;
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="space-y-4 pt-10 pb-10">
        <h2 className="text-lg font-black text-red-500 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h2>
        <div className="glass-card-red rounded-2xl p-6 border border-red-500/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">Factory Reset Data Peserta</h3>
              <p className="text-xs text-red-300 mt-1 max-w-xl">
                Tindakan ini akan menghapus <strong>seluruh riwayat misi, polling, foto twibbon, dan poin</strong> semua peserta. Hanya profil akun dan peserta cosplay yang dipertahankan. Gunakan ini sebelum acara resmi dimulai untuk membersihkan data percobaan.
              </p>
            </div>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-glow whitespace-nowrap transition-all"
            >
              Reset Semua Data
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-red-500/50 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-white">Peringatan Keras!</h3>
              <p className="text-sm text-slate-300">
                Anda yakin ingin menghapus <strong>SEMUA</strong> poin, misi, galeri, dan aktivitas peserta? Data yang dihapus tidak dapat dikembalikan.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={isResetting}
                className="flex-1 py-3 rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-700 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleFactoryReset}
                disabled={isResetting}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-500 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isResetting ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                <span>Ya, Hapus Semua</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
