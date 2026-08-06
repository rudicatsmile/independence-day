'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Award, Sparkles, RefreshCw, Star, ShieldCheck, Lock } from 'lucide-react';
import { CosplayCategory, CosplayParticipant } from '@/lib/types';
import { COSPLAY_CRITERIA_MAP } from '@/lib/mockData';
import { fetchCosplayParticipantsFromSupabase, fetchCosplayPublishedStatusFromSupabase } from '@/lib/supabase/services';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client';
import confetti from 'canvas-confetti';

export default function PublicCosplayPage() {
  const [activeCategory, setActiveCategory] = useState<CosplayCategory>('usia_dini');
  const [participants, setParticipants] = useState<CosplayParticipant[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const [data, pubStatus] = await Promise.all([
      fetchCosplayParticipantsFromSupabase(activeCategory),
      fetchCosplayPublishedStatusFromSupabase(),
    ]);

    setParticipants(data);
    setIsPublished(pubStatus);
    setIsLoading(false);

    if (pubStatus) {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.4 } });
    }
  };

  useEffect(() => {
    loadData();

    // Zero-Load Realtime Supabase WebSockets Subscription for Public
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const channel = supabase
        .channel('public_cosplay_realtime')
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
  }, [activeCategory]);

  const sortedParticipants = [...participants].sort((a, b) => (b.final_score || 0) - (a.final_score || 0));
  const top1 = sortedParticipants[0];
  const top2 = sortedParticipants[1];
  const top3 = sortedParticipants[2];

  // Dynamic Date Phase Calculation for Event Day (17 August)
  const now = new Date();
  const currentYear = now.getFullYear();
  const eventDate = new Date(currentYear, 7, 17); // 17 August

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const eventStr = `${currentYear}-08-17`;

  let eventPhase: 'before_event' | 'event_day' | 'after_event' = 'before_event';
  if (todayStr === eventStr) {
    eventPhase = 'event_day';
  } else if (now > eventDate) {
    eventPhase = 'after_event';
  } else {
    eventPhase = 'before_event';
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card-gold border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>HASIL LOMBA RESMI HUT RI KE-81</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">
          Klasemen Penilaian <span className="text-gradient-gold">Lomba Cosplay</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Presiden RI & Pahlawan Nasional • Yayasan Al-Wathoniyah Asshodriyah 9
        </p>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setActiveCategory('usia_dini')}
          className={`p-3 rounded-2xl border text-center transition-all ${activeCategory === 'usia_dini'
            ? 'glass-card-gold border-amber-400 scale-102 shadow-gold-glow'
            : 'glass-card border-slate-800 text-slate-400 hover:text-white'
            }`}
        >
          <span className="text-xl block mb-1">🧸</span>
          <p className="text-xs font-black text-white">Usia Dini</p>
          <p className="text-[10px] text-amber-300 font-bold">PAUD / TK</p>
        </button>

        <button
          onClick={() => setActiveCategory('usia_menengah')}
          className={`p-3 rounded-2xl border text-center transition-all ${activeCategory === 'usia_menengah'
            ? 'glass-card-gold border-amber-400 scale-102 shadow-gold-glow'
            : 'glass-card border-slate-800 text-slate-400 hover:text-white'
            }`}
        >
          <span className="text-xl block mb-1">🎒</span>
          <p className="text-xs font-black text-white">Usia Menengah</p>
          <p className="text-[10px] text-amber-300 font-bold">SD & SMP</p>
        </button>

        <button
          onClick={() => setActiveCategory('usia_atas')}
          className={`p-3 rounded-2xl border text-center transition-all ${activeCategory === 'usia_atas'
            ? 'glass-card-gold border-amber-400 scale-102 shadow-gold-glow'
            : 'glass-card border-slate-800 text-slate-400 hover:text-white'
            }`}
        >
          <span className="text-xl block mb-1">🎓</span>
          <p className="text-xs font-black text-white">Usia Atas</p>
          <p className="text-[10px] text-amber-300 font-bold">SMK : DP1 & DP2</p>
        </button>
      </div>

      {/* Locked / Unlocked Condition */}
      {!isPublished ? (
        /* Locked Status Card with 3 Date Phase Cases */
        <div className="glass-card-gold rounded-3xl p-8 border-2 border-amber-400/60 text-center space-y-4 shadow-gold-glow my-8">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-amber-400 shadow-glow animate-pulse">
            <Lock className="w-8 h-8" />
          </div>

          {eventPhase === 'before_event' ? (
            /* Case 1: Sebelum Hari-H */
            <>
              <div className="space-y-2 max-w-lg mx-auto">
                <h2 className="text-2xl font-black text-white">
                  Pengumuman Pemenang Lomba Cosplay <span className="text-gradient-gold">Akan Datang</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Hasil penilaian resmi Lomba Cosplay Pahlawan Nasional oleh Tim Juri (<strong className="text-amber-300">Bapak Sofyan Jamaludin, S.H.I.</strong> & <strong className="text-amber-300">Bapak H. Mulyana, S.H., M.M.</strong>) akan ditayangkan secara live pada Puncak Perayaan 17 Agustus setelah disahkan oleh Sie Acara!
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/80 border border-amber-500/40 text-amber-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>⏳ Acara Dilaksanakan 17 Agustus</span>
              </div>
            </>
          ) : eventPhase === 'event_day' ? (
            /* Case 2: Hari-H (17 Agustus) */
            <>
              <div className="space-y-2 max-w-lg mx-auto">
                <h2 className="text-2xl font-black text-white">
                  Penilaian Lomba Cosplay <span className="text-gradient-gold">Sedang Berlangsung</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Tim Juri (<strong className="text-amber-300">Bapak Sofyan Jamaludin, S.H.I.</strong> & <strong className="text-amber-300">Bapak H. Mulyana, S.H., M.M.</strong>) sedang menguji dan menginput skor instrumen penilaian peserta di lokasi perayaan. Klasemen Pemenang akan secara otomatis dibuka dari Panggung Utama setelah pengesahan Sie Acara!
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/80 border border-amber-500/40 text-amber-400 text-xs font-bold animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Menunggu Pengesahan Sie Acara...</span>
              </div>
            </>
          ) : (
            /* Case 3: Setelah Hari-H & Belum Di-publish */
            <>
              <div className="space-y-2 max-w-lg mx-auto">
                <h2 className="text-2xl font-black text-white">
                  Pengumuman Pemenang Lomba Cosplay <span className="text-gradient-gold">Belum Dipublikasikan</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Proses penilaian Lomba Cosplay Pahlawan Nasional telah selesai dilaksanakan. Pengumuman Pemenang resmi sedang menunggu konfirmasi pengesahan & peluncuran oleh Sie Acara!
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/80 border border-amber-500/40 text-amber-400 text-xs font-bold">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>🔒 Pengumuman Terkunci oleh Sie Acara</span>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Published Winners Podium & Full Leaderboard */
        <>
          {/* Podium Top 3 Juara */}
          <div className="grid grid-cols-3 gap-3 items-end pt-4 animate-fade-in">
            {/* Juara 2 */}
            {top2 ? (
              <div className="glass-card rounded-2xl p-4 border border-slate-700 text-center space-y-2 shadow-lg">
                <span className="text-3xl block">🥈</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-300 text-slate-950 font-black text-[10px] uppercase">
                  JUARA 2
                </span>
                <h3 className="text-sm font-black text-white truncate">{top2.name}</h3>
                <p className="text-[11px] text-amber-300 font-bold">{top2.class_level} • {top2.character_name}</p>
                <div className="text-base font-black text-amber-400 font-mono">
                  {top2.final_score ? `${top2.final_score} PTS` : 'Belum Dinilai'}
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-4 border border-slate-800 text-center text-xs text-slate-500">
                Posisi Juara 2
              </div>
            )}

            {/* Juara 1 */}
            {top1 ? (
              <div className="glass-card-gold rounded-3xl p-5 border-2 border-amber-400 text-center space-y-2 shadow-gold-glow -translate-y-2">
                <span className="text-4xl block animate-bounce">🥇</span>
                <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs uppercase shadow-gold-glow">
                  👑 JUARA 1 UTAMA
                </span>
                <h3 className="text-base font-black text-white truncate">{top1.name}</h3>
                <p className="text-xs text-amber-300 font-extrabold">{top1.class_level} • {top1.character_name}</p>
                <div className="text-xl font-black text-gradient-gold font-mono">
                  {top1.final_score ? `${top1.final_score} PTS` : 'Belum Dinilai'}
                </div>
              </div>
            ) : (
              <div className="glass-card-gold rounded-3xl p-5 border border-amber-400/50 text-center text-xs text-amber-300">
                Posisi Juara 1
              </div>
            )}

            {/* Juara 3 */}
            {top3 ? (
              <div className="glass-card rounded-2xl p-4 border border-amber-700/50 text-center space-y-2 shadow-lg">
                <span className="text-3xl block">🥉</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-700 text-white font-black text-[10px] uppercase">
                  JUARA 3
                </span>
                <h3 className="text-sm font-black text-white truncate">{top3.name}</h3>
                <p className="text-[11px] text-amber-300 font-bold">{top3.class_level} • {top3.character_name}</p>
                <div className="text-base font-black text-amber-400 font-mono">
                  {top3.final_score ? `${top3.final_score} PTS` : 'Belum Dinilai'}
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-4 border border-slate-800 text-center text-xs text-slate-500">
                Posisi Juara 3
              </div>
            )}
          </div>

          {/* Full Leaderboard Table */}
          <div className="glass-card rounded-3xl p-6 border border-amber-400/40 space-y-4 shadow-2xl overflow-x-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>KLASEMEN SELURUH PESERTA COSPLAY</span>
              </h3>
              <span className="text-xs text-amber-300 font-bold animate-pulse flex items-center gap-1">
                <RefreshCw className="w-3 h-3 text-emerald-400" /> Hasil Resmi Diumumkan
              </span>
            </div>

            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-amber-300 font-black uppercase tracking-wider">
                  <th className="p-3">Peringkat</th>
                  <th className="p-3">Nama Peserta</th>
                  <th className="p-3">Kelas</th>
                  <th className="p-3">Tokoh yang Diperankan</th>
                  <th className="p-3 text-right">Skor Akhir Juri</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {sortedParticipants.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3 font-bold">
                      {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                    </td>
                    <td className="p-3 font-bold text-white">{p.name}</td>
                    <td className="p-3 text-amber-300 font-semibold">{p.class_level}</td>
                    <td className="p-3 text-slate-300 italic">🇮🇩 {p.character_name}</td>
                    <td className="p-3 text-right font-black text-amber-400 font-mono text-sm">
                      {p.final_score ? `${p.final_score} PTS` : 'Sedang Dinilai'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
