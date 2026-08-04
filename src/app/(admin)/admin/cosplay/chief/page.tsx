'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Trophy, Crown, CheckCircle2, AlertTriangle, Lock, Unlock, KeyRound, RefreshCw, Star, Users, Eye, Sparkles } from 'lucide-react';
import { CosplayCategory, CosplayParticipant } from '@/lib/types';
import { COSPLAY_JUDGES, COSPLAY_CRITERIA_MAP } from '@/lib/mockData';
import {
  fetchCosplayParticipantsFromSupabase,
  fetchCosplayPublishedStatusFromSupabase,
  updateCosplayPublishedStatusInSupabase,
} from '@/lib/supabase/services';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client';
import confetti from 'canvas-confetti';

export default function ChiefCosplayRefereePage() {
  // Chief Referee PIN Gate State (Default PIN: 8181)
  const [pinInput, setPinInput] = useState('');
  const [isPinUnlocked, setIsPinUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);

  const [activeCategory, setActiveCategory] = useState<CosplayCategory>('usia_dini');
  const [participants, setParticipants] = useState<CosplayParticipant[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDetailParticipant, setSelectedDetailParticipant] = useState<CosplayParticipant | null>(null);

  const criteriaList = COSPLAY_CRITERIA_MAP[activeCategory];
  const judge1Name = COSPLAY_JUDGES[0]; // Bapak Sofyan Jamaludin,S.H.I.
  const judge2Name = COSPLAY_JUDGES[1]; // Bapak H. Mulyana, S.H., M.M.

  const loadData = async () => {
    setIsLoading(true);
    const [data, pubStatus] = await Promise.all([
      fetchCosplayParticipantsFromSupabase(activeCategory),
      fetchCosplayPublishedStatusFromSupabase(),
    ]);
    setParticipants(data);
    setIsPublished(pubStatus);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isPinUnlocked) {
      loadData();

      // Zero-Load Realtime Supabase WebSockets Subscription
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const channel = supabase
          .channel('chief_cosplay_realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'cosplay_scores' },
            () => loadData()
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'cosplay_participants' },
            () => loadData()
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'live_event_state' },
            () => loadData()
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    }
  }, [activeCategory, isPinUnlocked]);

  const handleUnlockPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '8181' || pinInput === '9999') {
      setIsPinUnlocked(true);
      setPinError(false);
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.4 } });
    } else {
      setPinError(true);
    }
  };

  const handleTogglePublish = async () => {
    const nextState = !isPublished;
    setIsPublished(nextState);
    const { error } = await updateCosplayPublishedStatusInSupabase(nextState);

    if (error) {
      alert('Gagal mengosongkan/memublikasikan status: ' + error);
      setIsPublished(!nextState);
    } else {
      if (nextState) {
        confetti({ particleCount: 120, spread: 100, origin: { y: 0.4 } });
      }
    }
  };

  // Calculate jury completion stats
  const judge1CompletedCount = participants.filter((p) => !!p.scores_by_judge?.[judge1Name]).length;
  const judge2CompletedCount = participants.filter((p) => !!p.scores_by_judge?.[judge2Name]).length;
  const totalCount = participants.length;

  // Sort participants by final_score descending for leaderboard preview
  const sortedParticipants = [...participants].sort((a, b) => (b.final_score || 0) - (a.final_score || 0));

  // PIN Unlock Gate for Wasit Utama (Chief Referee)
  if (!isPinUnlocked) {
    return (
      <div className="max-w-md mx-auto py-12 space-y-6 text-center">
        <div className="glass-card-gold rounded-3xl p-8 border-2 border-amber-400 space-y-5 shadow-gold-glow">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-amber-400 shadow-glow animate-pulse">
            <Crown className="w-8 h-8 text-amber-300" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">Portal Kepala Penilaian Cosplay</h2>
            <p className="text-xs text-slate-300">
              Hak Akses Khusus Wasit Utama Penilaian Cosplay (PIN Default Wasit: <strong className="text-amber-300 font-mono">8181</strong>)
            </p>
          </div>

          <form onSubmit={handleUnlockPin} className="space-y-4">
            <input
              type="password"
              maxLength={4}
              required
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Masukkan PIN Wasit (8181)"
              className="w-full text-center text-2xl tracking-[0.5em] font-mono font-black bg-slate-950 border-2 border-amber-400/60 rounded-2xl py-3 text-amber-300 focus:outline-none focus:border-amber-400"
            />

            {pinError && (
              <p className="text-xs text-red-400 font-bold animate-bounce">
                ❌ PIN Akses Wasit Salah. Silakan masukkan PIN 8181
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-merdeka-red via-amber-500 to-merdeka-red text-slate-950 font-black text-sm shadow-gold-glow shimmer-btn hover:scale-102 transition-transform"
            >
              MASUK CONTROL ROOM WASIT UTAMA
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Executive Control Header */}
      <div className="glass-card-gold rounded-3xl p-6 border-2 border-amber-400/60 space-y-4 shadow-gold-glow">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black tracking-wider uppercase mb-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>CONTROL ROOM WASIT UTAMA • KEPALA PENILAIAN COSPLAY</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Supervisi & Pengesahan Hasil Lomba Cosplay
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Memantau nilai realtime Juri 1 vs Juri 2 & memegang kendali mutlak penayangan pemenang ke publik.
            </p>
          </div>

          {/* Toggle Official Winner Release Button */}
          <div className="shrink-0 w-full md:w-auto">
            <button
              onClick={handleTogglePublish}
              className={`w-full md:w-auto px-5 py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-gold-glow flex items-center justify-center gap-2.5 transition-all hover:scale-105 ${
                isPublished
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950'
                  : 'bg-gradient-to-r from-merdeka-red to-amber-500 text-slate-950 shimmer-btn'
              }`}
            >
              {isPublished ? (
                <>
                  <Unlock className="w-5 h-5 text-slate-950" />
                  <span>🔓 HASIL DITAYANGKAN PUBLIK (BISA DILIHAT PESERTA)</span>
                </>
              ) : (
                <>
                  <Crown className="w-5 h-5 text-slate-950" />
                  <span>👑 SAHKAN & TAYANGKAN JUARA 1, 2, 3 KE PUBLIK</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Jury Progress Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-amber-500/20">
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">👨‍⚖️</span>
              <div>
                <p className="text-xs font-bold text-white">Juri 1: Pak Sofyan Jamaludin, S.H.I.</p>
                <p className="text-[10px] text-slate-400">Progres Penilaian Peserta</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-black font-mono ${
              judge1CompletedCount === totalCount ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
            }`}>
              {judge1CompletedCount} / {totalCount} Selesai
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">👨‍⚖️</span>
              <div>
                <p className="text-xs font-bold text-white">Juri 2: Pak H. Mulyana, S.H., M.M.</p>
                <p className="text-[10px] text-slate-400">Progres Penilaian Peserta</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-black font-mono ${
              judge2CompletedCount === totalCount ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
            }`}>
              {judge2CompletedCount} / {totalCount} Selesai
            </span>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setActiveCategory('usia_dini')}
          className={`p-4 rounded-2xl border text-center transition-all ${
            activeCategory === 'usia_dini'
              ? 'glass-card-gold border-amber-400 scale-102 shadow-gold-glow'
              : 'glass-card border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <span className="text-2xl block mb-1">🧸</span>
          <p className="text-xs font-black text-white">Usia Dini</p>
          <p className="text-[10px] text-amber-300 font-bold">PAUD / TK</p>
        </button>

        <button
          onClick={() => setActiveCategory('usia_menengah')}
          className={`p-4 rounded-2xl border text-center transition-all ${
            activeCategory === 'usia_menengah'
              ? 'glass-card-gold border-amber-400 scale-102 shadow-gold-glow'
              : 'glass-card border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <span className="text-2xl block mb-1">🎒</span>
          <p className="text-xs font-black text-white">Usia Menengah</p>
          <p className="text-[10px] text-amber-300 font-bold">SD & SMP</p>
        </button>

        <button
          onClick={() => setActiveCategory('usia_atas')}
          className={`p-4 rounded-2xl border text-center transition-all ${
            activeCategory === 'usia_atas'
              ? 'glass-card-gold border-amber-400 scale-102 shadow-gold-glow'
              : 'glass-card border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <span className="text-2xl block mb-1">🎓</span>
          <p className="text-xs font-black text-white">Usia Atas</p>
          <p className="text-[10px] text-amber-300 font-bold">SMK : DP1 & DP2</p>
        </button>
      </div>

      {/* Main Realtime Wasit Comparison Table */}
      <div className="glass-card rounded-3xl p-6 border border-amber-400/40 space-y-4 shadow-2xl overflow-x-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Matriks Rekapitulasi Realtime Juri 1 vs Juri 2</span>
          </h3>
          <span className="text-xs text-amber-300 font-bold animate-pulse flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Auto Realtime 3s
          </span>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-amber-300 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Memuat data pengawasan wasit...</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-amber-300 font-black uppercase tracking-wider">
                <th className="p-3">Peringkat</th>
                <th className="p-3">Nama Peserta</th>
                <th className="p-3">Kelas</th>
                <th className="p-3">Tokoh</th>
                <th className="p-3 text-center">Juri 1 (Pak Sofyan)</th>
                <th className="p-3 text-center">Juri 2 (Pak Mulyana)</th>
                <th className="p-3 text-center">Nilai Rata-Rata</th>
                <th className="p-3 text-right">Detail Breakdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {sortedParticipants.map((p, idx) => {
                const j1 = p.scores_by_judge?.[judge1Name];
                const j2 = p.scores_by_judge?.[judge2Name];

                const scoreDiff = j1 && j2 ? Math.abs(j1.final_score - j2.final_score) : 0;
                const isDiffHigh = scoreDiff > 10;

                return (
                  <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3 font-bold">
                      {idx === 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">🥇 JUARA 1</span>
                      ) : idx === 1 ? (
                        <span className="px-2 py-0.5 rounded-full bg-slate-300 text-slate-950 font-black text-[10px]">🥈 JUARA 2</span>
                      ) : idx === 2 ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-700 text-white font-black text-[10px]">🥉 JUARA 3</span>
                      ) : (
                        <span className="text-slate-400">#{idx + 1}</span>
                      )}
                    </td>
                    <td className="p-3 font-bold text-white">{p.name}</td>
                    <td className="p-3 text-amber-300 font-semibold">{p.class_level}</td>
                    <td className="p-3 text-slate-300 italic">🇮🇩 {p.character_name}</td>

                    {/* Juri 1 Score */}
                    <td className="p-3 text-center">
                      {j1 ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold font-mono text-xs">
                          {j1.final_score} PTS
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-medium">Belum Input</span>
                      )}
                    </td>

                    {/* Juri 2 Score */}
                    <td className="p-3 text-center">
                      {j2 ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold font-mono text-xs">
                          {j2.final_score} PTS
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-medium">Belum Input</span>
                      )}
                    </td>

                    {/* Average Final Score */}
                    <td className="p-3 text-center font-mono">
                      <span className="text-sm font-black text-amber-400">
                        {p.final_score ? `${p.final_score} PTS` : '-'}
                      </span>
                      {isDiffHigh && (
                        <span className="block text-[9px] text-amber-400 font-bold flex items-center justify-center gap-0.5 mt-0.5" title="Selisih nilai antar juri > 10 pts">
                          <AlertTriangle className="w-3 h-3 text-amber-400" /> Selisih {scoreDiff.toFixed(1)}
                        </span>
                      )}
                    </td>

                    {/* Detail Inspector Modal Trigger */}
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedDetailParticipant(p)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] inline-flex items-center gap-1 border border-slate-700"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>Rincian</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detailed Breakdown Modal for Wasit */}
      {selectedDetailParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl glass-card-gold rounded-3xl p-6 border border-amber-400/60 space-y-4 shadow-gold-glow relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                  INSPEKSI WASIT UTAMA • MATRIKS KRITERIA
                </span>
                <h3 className="text-lg font-black text-white">
                  {selectedDetailParticipant.name} ({selectedDetailParticipant.class_level})
                </h3>
                <p className="text-xs text-slate-300 italic">Tokoh: {selectedDetailParticipant.character_name}</p>
              </div>
              <button
                onClick={() => setSelectedDetailParticipant(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {criteriaList.map((criterion, idx) => {
                const j1Scores = selectedDetailParticipant.scores_by_judge?.[judge1Name]?.scores || {};
                const j2Scores = selectedDetailParticipant.scores_by_judge?.[judge2Name]?.scores || {};

                const scoreJ1 = j1Scores[criterion.key] ?? '-';
                const scoreJ2 = j2Scores[criterion.key] ?? '-';

                return (
                  <div key={criterion.key} className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-amber-300 block">
                          #{idx + 1} {criterion.label} ({Math.round(criterion.weight * 100)}%)
                        </span>
                        <p className="text-[10px] text-slate-400">{criterion.indicator}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-sans">Juri 1 (Pak Sofyan):</span>
                        <span className="text-sm font-bold text-white">{scoreJ1} Pts</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-sans">Juri 2 (Pak Mulyana):</span>
                        <span className="text-sm font-bold text-white">{scoreJ2} Pts</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedDetailParticipant(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs"
              >
                Tutup Inspeksi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
