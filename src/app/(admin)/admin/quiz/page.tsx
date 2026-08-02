'use client';

import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, Edit2, Trash2, CheckCircle2, ShieldAlert, Save, RefreshCw } from 'lucide-react';
import { QuizQuestion } from '@/lib/types';
import { fetchQuizQuestionsFromSupabase, saveQuizQuestionToSupabase, deleteQuizQuestionFromSupabase } from '@/lib/supabase/services';
import { MOCK_QUIZ_QUESTIONS } from '@/lib/mockData';
import confetti from 'canvas-confetti';

export default function AdminQuizPage() {
  const [questions, setQuestions] = useState<QuizQuestion[]>(MOCK_QUIZ_QUESTIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingQ, setEditingQ] = useState<Partial<QuizQuestion>>({
    question: '',
    options: ['', '', '', ''],
    correct_answer_index: 0,
    explanation: '',
    is_active: true,
    order_index: 1,
  });

  const loadQuestions = async () => {
    setIsLoading(true);
    const data = await fetchQuizQuestionsFromSupabase();
    setQuestions(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await saveQuizQuestionToSupabase(editingQ);
    setIsLoading(false);

    const newObj: QuizQuestion = {
      id: editingQ.id || `q-${Date.now()}`,
      question: editingQ.question || 'Pertanyaan Kuis',
      options: editingQ.options || ['', '', '', ''],
      correct_answer_index: editingQ.correct_answer_index ?? 0,
      explanation: editingQ.explanation || '',
      is_active: editingQ.is_active ?? true,
      order_index: editingQ.order_index || questions.length + 1,
    };

    if (res.error) {
      console.warn('Supabase RLS notice, updating local state:', res.error);
    }

    setQuestions((prev) => {
      const exists = prev.some((q) => q.id === newObj.id);
      if (exists) {
        return prev.map((q) => (q.id === newObj.id ? newObj : q));
      }
      return [...prev, newObj];
    });

    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    setIsEditing(false);
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus soal kuis ini?')) return;
    setIsLoading(true);
    await deleteQuizQuestionFromSupabase(id);
    setIsLoading(false);
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Admin */}
      <div className="glass-card-gold rounded-3xl p-6 border border-amber-400/40 space-y-2 shadow-gold-glow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-merdeka-red/20 border border-merdeka-red/40 text-amber-300 text-xs font-bold">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Dashboard Administrator</span>
          </div>
          <button
            onClick={() => {
              setEditingQ({
                question: '',
                options: ['', '', '', ''],
                correct_answer_index: 0,
                explanation: '',
                is_active: true,
                order_index: questions.length + 1,
              });
              setIsEditing(true);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-merdeka-red to-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-glow hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Soal Kuis Baru</span>
          </button>
        </div>

        <h1 className="text-2xl font-black text-white">Manajemen Soal Kuis Trivia Sejarah</h1>
        <p className="text-xs text-slate-300">
          Atur pertanyaan kuis sejarah kemerdekaan, pilihan jawaban A/B/C/D, kunci jawaban benar, dan pembahasan edukatif untuk peserta.
        </p>
      </div>

      {/* Edit / Add Modal Form */}
      {isEditing && (
        <div className="glass-card rounded-3xl p-6 border border-amber-400/50 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 className="text-lg font-black text-gradient-gold">
              {editingQ.id ? 'Edit Soal Kuis' : 'Tambah Soal Kuis Baru'}
            </h3>
            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>

          <form onSubmit={handleSaveQuestion} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Teks Pertanyaan Sejarah:</label>
              <textarea
                rows={2}
                required
                placeholder="Contoh: Siapakah pencipta lagu kebangsaan Indonesia Raya?"
                value={editingQ.question || ''}
                onChange={(e) => setEditingQ({ ...editingQ, question: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['A', 'B', 'C', 'D'].map((letter, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="text-xs font-bold text-amber-300">Pilihan {letter}:</label>
                  <input
                    type="text"
                    required
                    placeholder={`Opsi ${letter}`}
                    value={editingQ.options?.[idx] || ''}
                    onChange={(e) => {
                      const newOpts = [...(editingQ.options || ['', '', '', ''])];
                      newOpts[idx] = e.target.value;
                      setEditingQ({ ...editingQ, options: newOpts });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Kunci Jawaban Yang Benar:</label>
                <select
                  value={editingQ.correct_answer_index ?? 0}
                  onChange={(e) => setEditingQ({ ...editingQ, correct_answer_index: parseInt(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-bold text-amber-400"
                >
                  <option value={0}>Pilihan A</option>
                  <option value={1}>Pilihan B</option>
                  <option value={2}>Pilihan C</option>
                  <option value={3}>Pilihan D</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="is_active_q"
                  checked={editingQ.is_active ?? true}
                  onChange={(e) => setEditingQ({ ...editingQ, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-merdeka-red focus:ring-amber-400"
                />
                <label htmlFor="is_active_q" className="text-xs font-bold text-white cursor-pointer">
                  Aktifkan Soal Kuis Ini
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Penjelasan / Pembahasan Edukatif Sejarah:</label>
              <textarea
                rows={2}
                required
                placeholder="Penjelasan latar belakang sejarah jawaban yang benar..."
                value={editingQ.explanation || ''}
                onChange={(e) => setEditingQ({ ...editingQ, explanation: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-merdeka-red to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-gold-glow"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Simpan Soal Kuis</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List of Quiz Questions */}
      <div className="space-y-3">
        <h3 className="text-base font-black text-gradient-gold">Daftar Bank Soal Kuis Trivia</h3>

        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="glass-card rounded-2xl p-5 border border-amber-500/40 space-y-3 flex flex-col justify-between shadow-glow"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    SOAL #{idx + 1}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    Kunci: Opsi {String.fromCharCode(65 + q.correct_answer_index)}
                  </span>
                </div>

                <h4 className="text-base font-bold text-white">{q.question}</h4>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className={`p-2 rounded-xl border text-xs ${
                        oIdx === q.correct_answer_index
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="font-bold text-amber-400 mr-1">{String.fromCharCode(65 + oIdx)}.</span>
                      <span>{opt}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-slate-300 pt-1">💡 <span className="text-slate-400">{q.explanation}</span></p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    setEditingQ(q);
                    setIsEditing(true);
                  }}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Edit Soal</span>
                </button>

                <button
                  onClick={() => handleDeleteQuestion(q.id)}
                  className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
