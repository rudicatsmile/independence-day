'use client';

import React, { useState, useEffect } from 'react';
import { Award, Trophy, UserCheck, Star, Sparkles, Plus, CheckCircle2, ShieldAlert, Save, RefreshCw, X, FileText, Lock, Unlock, KeyRound } from 'lucide-react';
import { CosplayCategory, CosplayParticipant } from '@/lib/types';
import { COSPLAY_JUDGES, COSPLAY_CRITERIA_MAP } from '@/lib/mockData';
import {
  fetchCosplayParticipantsFromSupabase,
  saveCosplayScoreToSupabase,
  saveCosplayParticipantToSupabase,
  fetchCosplayPublishedStatusFromSupabase,
  updateCosplayPublishedStatusInSupabase,
} from '@/lib/supabase/services';
import { useUserStore } from '@/stores/useUserStore';
import confetti from 'canvas-confetti';

export default function AdminCosplayPage() {
  const profile = useUserStore((state) => state.profile);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const isAdmin = isLoggedIn && (profile.role === 'admin' || profile.role === 'media_team');

  // Jury PIN Gate State (Default PIN: 1945)
  const [pinInput, setPinInput] = useState('');
  const [isPinUnlocked, setIsPinUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);

  const [activeCategory, setActiveCategory] = useState<CosplayCategory>('usia_dini');
  const [selectedJudge, setSelectedJudge] = useState<string>(COSPLAY_JUDGES[0]);
  const [participants, setParticipants] = useState<CosplayParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  // Scoring Modal State
  const [activeParticipant, setActiveParticipant] = useState<CosplayParticipant | null>(null);
  const [currentScores, setCurrentScores] = useState<Record<string, number>>({});
  const [isSavingScore, setIsSavingScore] = useState(false);

  // Add Participant Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState('');
  const [newCharacter, setNewCharacter] = useState('');
  const [isSavingParticipant, setIsSavingParticipant] = useState(false);

  const criteriaList = COSPLAY_CRITERIA_MAP[activeCategory];

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
    // If logged in as admin, bypass PIN gate automatically
    if (isAdmin) {
      setIsPinUnlocked(true);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isPinUnlocked) {
      loadData();
    }
  }, [activeCategory, isPinUnlocked]);

  const handleUnlockPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1945' || pinInput === '8181') {
      setIsPinUnlocked(true);
      setPinError(false);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.5 } });
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
        confetti({ particleCount: 100, spread: 100, origin: { y: 0.4 } });
      }
    }
  };

  const openScoringModal = (p: CosplayParticipant) => {
    setActiveParticipant(p);
    const existingScores = p.scores_by_judge?.[selectedJudge]?.scores || {};
    
    // Initialize default scores if not present
    const initScores: Record<string, number> = {};
    criteriaList.forEach((c) => {
      initScores[c.key] = existingScores[c.key] ?? 80;
    });

    setCurrentScores(initScores);
  };

  const calculateWeightedScore = (scores: Record<string, number>) => {
    let total = 0;
    criteriaList.forEach((c) => {
      const scoreVal = scores[c.key] || 0;
      total += scoreVal * c.weight;
    });
    return Number(total.toFixed(2));
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeParticipant) return;

    setIsSavingScore(true);
    const finalScore = calculateWeightedScore(currentScores);

    const { error } = await saveCosplayScoreToSupabase(
      activeParticipant.id,
      selectedJudge,
      currentScores,
      finalScore
    );

    setIsSavingScore(false);

    if (error) {
      alert('Gagal menyimpan nilai juri: ' + error);
    } else {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } });
      setActiveParticipant(null);
      loadData();
    }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingParticipant(true);

    const { error } = await saveCosplayParticipantToSupabase({
      name: newName,
      class_level: newClass,
      character_name: newCharacter,
      category: activeCategory,
    });

    setIsSavingParticipant(false);

    if (error) {
      alert('Gagal menambah peserta: ' + error);
    } else {
      setNewName('');
      setNewClass('');
      setNewCharacter('');
      setIsAddModalOpen(false);
      loadData();
    }
  };

  // Sort participants by final_score descending for leaderboard
  const sortedParticipants = [...participants].sort((a, b) => (b.final_score || 0) - (a.final_score || 0));

  // PIN Unlock Gate for Jury Members on HP/Tablet
  if (!isPinUnlocked) {
    return (
      <div className="max-w-md mx-auto py-12 space-y-6 text-center">
        <div className="glass-card-gold rounded-3xl p-8 border border-amber-400/50 space-y-5 shadow-gold-glow">
          <div className="w-16 h-16 rounded-3xl bg-merdeka-red/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-amber-400 shadow-glow animate-pulse">
            <KeyRound className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">Portal Juri Lomba Cosplay</h2>
            <p className="text-xs text-slate-300">
              Masukkan 4-Digit PIN Akses Juri untuk Penilaian di HP / Tablet (PIN Default: <strong className="text-amber-300 font-mono">1945</strong>)
            </p>
          </div>

          <form onSubmit={handleUnlockPin} className="space-y-4">
            <input
              type="password"
              maxLength={4}
              required
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Masukkan PIN (misal: 1945)"
              className="w-full text-center text-2xl tracking-[0.5em] font-mono font-black bg-slate-950 border-2 border-amber-400/60 rounded-2xl py-3 text-amber-300 focus:outline-none focus:border-amber-400"
            />

            {pinError && (
              <p className="text-xs text-red-400 font-bold animate-bounce">
                ❌ PIN Akses Salah. Silakan masukkan PIN 1945
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-merdeka-red to-amber-500 text-slate-950 font-black text-sm shadow-gold-glow shimmer-btn hover:scale-102 transition-transform"
            >
              BUKA PORTAL PENILAIAN JURI
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Admin & Publication Status */}
      <div className="glass-card-gold rounded-3xl p-6 border border-amber-400/40 space-y-4 shadow-gold-glow">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-merdeka-red/20 border border-merdeka-red/40 text-amber-300 text-xs font-bold mb-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>INSTRUMEN RESMI PENILAIAN JURI LOMBA COSPLAY 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Penilaian Cosplay Presiden RI & Pahlawan Nasional
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Yayasan Al-Wathoniyah Asshodriyah 9 Jakarta • Perayaan Kemerdekaan RI ke-81
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle Publication Button */}
            <button
              onClick={handleTogglePublish}
              className={`px-4 py-2.5 rounded-xl font-black text-xs shadow-gold-glow flex items-center gap-2 transition-all ${
                isPublished
                  ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                  : 'bg-slate-900 border border-amber-400/50 text-amber-300 hover:bg-slate-800'
              }`}
            >
              {isPublished ? (
                <>
                  <Unlock className="w-4 h-4 text-slate-950" />
                  <span>PEMENANG DITAYANGKAN PUBLIK</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>PENILAIAN INTERNAL (TERKUNCI)</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-merdeka-red to-amber-500 text-slate-950 font-black text-xs shadow-gold-glow shimmer-btn flex items-center gap-1.5 hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Peserta Baru</span>
            </button>
          </div>
        </div>

        {/* Judge Selector Dropdown */}
        <div className="pt-2 border-t border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300">Pilih Identitas Juri Penilai:</span>
          </div>
          <select
            value={selectedJudge}
            onChange={(e) => setSelectedJudge(e.target.value)}
            className="bg-slate-950 border border-amber-400/50 rounded-xl px-4 py-2 text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            {COSPLAY_JUDGES.map((j) => (
              <option key={j} value={j} className="bg-slate-900 text-white">
                👨‍⚖️ {j}
              </option>
            ))}
          </select>
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
          <p className="text-xs font-black text-white">Jenjang Usia Dini</p>
          <p className="text-[10px] text-amber-300 font-bold">TK / PAUD (Kelas A, B1, B2)</p>
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
          <p className="text-xs font-black text-white">Jenjang Usia Menengah</p>
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
          <p className="text-xs font-black text-white">Jenjang Usia Atas</p>
          <p className="text-[10px] text-amber-300 font-bold">SMA / SMK / DP-1 & DP-2</p>
        </button>
      </div>

      {/* Criteria Reference Banner */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
          <FileText className="w-4 h-4" />
          <span>Kriteria & Bobot Penilaian Dokumen PDF ({activeCategory.replace('_', ' ').toUpperCase()}):</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
          {criteriaList.map((c, idx) => (
            <div key={c.key} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-left">
              <span className="text-[10px] font-bold text-amber-400">#{idx + 1} ({Math.round(c.weight * 100)}%)</span>
              <p className="text-[11px] font-bold text-white leading-tight truncate">{c.label}</p>
              <p className="text-[9px] text-slate-400 line-clamp-2 mt-0.5">{c.indicator}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Participants Table */}
      <div className="glass-card rounded-3xl p-6 border border-amber-400/40 space-y-4 shadow-2xl overflow-x-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Tabel Peserta & Input Skor Penilaian Juri</span>
          </h3>
          <span className="text-xs text-slate-400 font-bold">Total: {participants.length} Peserta</span>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-amber-300 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Memuat data peserta cosplay...</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-amber-300 font-black uppercase tracking-wider">
                <th className="p-3">Rank / No</th>
                <th className="p-3">Nama Peserta</th>
                <th className="p-3">Kelas</th>
                <th className="p-3">Tokoh yang Diperankan</th>
                <th className="p-3">Skor Juri Aktif ({selectedJudge.split(',')[0]})</th>
                <th className="p-3 text-center">Nilai Akhir Terbobot</th>
                <th className="p-3 text-right">Aksi Juri</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {sortedParticipants.map((p, idx) => {
                const judgeScoreData = p.scores_by_judge?.[selectedJudge];
                const hasJudged = !!judgeScoreData;

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
                    <td className="p-3 text-slate-200 italic font-medium">🇮🇩 {p.character_name}</td>
                    <td className="p-3">
                      {hasJudged ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{judgeScoreData.final_score} PTS</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 font-medium text-[10px]">
                          Belum Dinilai
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-sm font-black text-amber-400 font-mono">
                        {p.final_score ? `${p.final_score} PTS` : '-'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => openScoringModal(p)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-merdeka-red to-amber-500 text-slate-950 font-extrabold text-[11px] shadow-gold-glow hover:scale-105 transition-transform inline-flex items-center gap-1"
                      >
                        <Star className="w-3.5 h-3.5" />
                        <span>{hasJudged ? 'Edit Nilai' : 'Input Nilai Juri'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Interactive Scoring Modal for Jury */}
      {activeParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl glass-card-gold rounded-3xl p-6 border border-amber-400/60 space-y-5 shadow-gold-glow relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                  FORMULIR PENILAIAN JURI • {selectedJudge}
                </span>
                <h3 className="text-lg font-black text-white">
                  {activeParticipant.name} <span className="text-amber-400">({activeParticipant.class_level})</span>
                </h3>
                <p className="text-xs text-slate-300 italic">Tokoh: {activeParticipant.character_name}</p>
              </div>
              <button
                onClick={() => setActiveParticipant(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveScore} className="space-y-4">
              <div className="space-y-3">
                {criteriaList.map((criterion, idx) => {
                  const val = currentScores[criterion.key] || 80;
                  const weightedVal = Number((val * criterion.weight).toFixed(2));

                  return (
                    <div key={criterion.key} className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-bold text-amber-300 block">
                            {idx + 1}. {criterion.label} <span className="text-slate-400 font-normal">({Math.round(criterion.weight * 100)}%)</span>
                          </label>
                          <p className="text-[10px] text-slate-400">{criterion.indicator}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-white font-mono">{val}</span>
                          <span className="text-[10px] text-amber-400 font-bold block">({weightedVal} Pts)</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="50"
                          max="100"
                          step="1"
                          value={val}
                          onChange={(e) =>
                            setCurrentScores({ ...currentScores, [criterion.key]: parseInt(e.target.value) })
                          }
                          className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={val}
                          onChange={(e) =>
                            setCurrentScores({ ...currentScores, [criterion.key]: parseInt(e.target.value) || 0 })
                          }
                          className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-center text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Calculated Final Score Preview */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-amber-400/50 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-300 font-bold block">TOTAL NILAI AKHIR TERBOBOT:</span>
                  <span className="text-[10px] text-amber-300">Hasil penjumlahan otomatis berdasarkan persentase bobot dokumen</span>
                </div>
                <div className="text-2xl font-black text-gradient-gold font-mono">
                  {calculateWeightedScore(currentScores)} / 100
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveParticipant(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingScore}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-merdeka-red to-amber-500 text-slate-950 font-black text-xs shadow-gold-glow flex items-center gap-1.5 hover:scale-105"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingScore ? 'Menyimpan...' : 'Simpan Nilai Juri'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Participant Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md glass-card-gold rounded-3xl p-6 border border-amber-400/60 space-y-5 shadow-gold-glow relative">
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
              <h3 className="text-lg font-black text-white">Tambah Peserta Cosplay Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddParticipant} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-300 block">Nama Peserta:</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  placeholder="Contoh: Ahmad Sofyan"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-300 block">Kelas:</label>
                <input
                  type="text"
                  required
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  placeholder="Contoh: A / B1 / SD / SMP / DP-1"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-300 block">Tokoh yang Diperankan:</label>
                <input
                  type="text"
                  required
                  value={newCharacter}
                  onChange={(e) => setNewCharacter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  placeholder="Contoh: Ir. Soekarno / Cut Nyak Dhien"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingParticipant}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-merdeka-red to-amber-500 text-slate-950 font-black text-xs shadow-gold-glow flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingParticipant ? 'Menyimpan...' : 'Simpan Peserta'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
