'use client';

import React, { useState, useEffect } from 'react';
import { Radio, Plus, Trash2, Save, RefreshCw, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { Poll, PollOption } from '@/lib/types';
import { MOCK_POLL } from '@/lib/mockData';
import { fetchActivePollFromSupabase, updatePollInSupabase, resetPollVotesInSupabase } from '@/lib/supabase/services';
import confetti from 'canvas-confetti';

export default function AdminPollPage() {
  const [question, setQuestion] = useState(MOCK_POLL.question);
  const [options, setOptions] = useState<PollOption[]>(MOCK_POLL.options);
  const [totalVotes, setTotalVotes] = useState(MOCK_POLL.total_votes);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchActivePollFromSupabase();
    if (data) {
      setQuestion(data.question);
      setOptions(data.options || []);
      setTotalVotes(data.total_votes || 0);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddOption = () => {
    const newId = `opt-${Date.now()}`;
    setOptions([
      ...options,
      { id: newId, label: `Pilihan Jawaban #${options.length + 1}`, votes: 0 },
    ]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      alert('Minimal harus terdapat 2 pilihan jawaban polling!');
      return;
    }
    const updated = options.filter((_, idx) => idx !== index);
    setOptions(updated);
  };

  const handleOptionLabelChange = (index: number, newLabel: string) => {
    const updated = [...options];
    updated[index].label = newLabel;
    setOptions(updated);
  };

  const handleSavePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      alert('Pertanyaan polling tidak boleh kosong!');
      return;
    }

    setIsSaving(true);
    const { error } = await updatePollInSupabase(question, options);
    setIsSaving(false);

    if (error) {
      alert('Gagal menyimpan polling: ' + error);
    } else {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } });
      alert('✅ Polling Interaktif Lapangan Berhasil Diperbarui!');
      loadData();
    }
  };

  const handleResetVotes = async () => {
    if (!confirm('Apakah Anda yakin ingin mengosongkan (reset) seluruh hasil voting polling?')) {
      return;
    }

    setIsResetting(true);
    const { error } = await resetPollVotesInSupabase();
    setIsResetting(false);

    if (error) {
      alert('Gagal mereset perolehan suara: ' + error);
    } else {
      alert('✅ Suara voting polling berhasil dikosongkan!');
      loadData();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Admin */}
      <div className="glass-card-gold rounded-3xl p-6 border border-amber-400/40 space-y-3 shadow-gold-glow">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-merdeka-red/20 border border-merdeka-red/40 text-amber-300 text-xs font-bold mb-2">
              <Radio className="w-4 h-4 text-amber-400" />
              <span>MANAJEMEN POLLING INTERAKTIF LAPANGAN</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Kelola Pertanyaan & Pilihan Polling
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Pertanyaan dan opsi pilihan yang diubah di sini akan <strong>seketika tersinkronisasi secara live</strong> di HP Peserta (`/live`) dan Layar Panggung (`/stage-display`).
            </p>
          </div>

          <button
            onClick={handleResetVotes}
            disabled={isResetting}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-300 font-bold text-xs hover:bg-red-950/50 hover:text-red-400 transition-all flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset Suara Voting ({totalVotes} Suara)</span>
          </button>
        </div>
      </div>

      {/* Main Poll Form */}
      <div className="glass-card rounded-3xl p-6 border border-amber-400/40 space-y-5 shadow-2xl">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-amber-300 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Memuat data polling...</span>
          </div>
        ) : (
          <form onSubmit={handleSavePoll} className="space-y-6">
            {/* Question Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-amber-300 block">
                1. Pertanyaan Polling Interaktif:
              </label>
              <textarea
                rows={2}
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Contoh: Pertunjukan Mana yang Paling Memukau Hari Ini?"
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Options Management Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-300">
                  2. Pilihan Jawaban ({options.length} Pilihan Dinamis):
                </label>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold hover:bg-amber-500/40 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Pilihan Jawaban</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {options.map((opt, idx) => {
                  const percentage = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;

                  return (
                    <div
                      key={opt.id || idx}
                      className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
                        <span className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 font-black text-xs flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <input
                          type="text"
                          required
                          value={opt.label}
                          onChange={(e) => handleOptionLabelChange(idx, e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                          placeholder={`Pilihan Jawaban #${idx + 1}`}
                        />
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-black text-amber-400 font-mono">
                            {opt.votes || 0} Suara
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold block font-mono">
                            ({percentage}%)
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="p-2 rounded-xl bg-red-950/50 hover:bg-red-900 border border-red-500/30 text-red-400 text-xs"
                          title="Hapus Pilihan Ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-merdeka-red to-amber-500 text-slate-950 font-black text-sm shadow-gold-glow shimmer-btn flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Memproses...' : 'Simpan & Publikasikan Polling'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
