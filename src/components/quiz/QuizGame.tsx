'use client';

import React, { useState, useEffect } from 'react';
import { HelpCircle, Award, CheckCircle2, XCircle, RefreshCw, Trophy, Sparkles, ChevronRight, Lock, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useUserStore } from '@/stores/useUserStore';
import { QuizQuestion } from '@/lib/types';
import { MOCK_QUIZ_QUESTIONS } from '@/lib/mockData';
import { fetchQuizQuestionsFromSupabase } from '@/lib/supabase/services';
import { AuthModal } from '@/components/auth/AuthModal';
import Link from 'next/link';

export const QuizGame: React.FC = () => {
  const [questions, setQuestions] = useState<QuizQuestion[]>(MOCK_QUIZ_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const profile = useUserStore((state) => state.profile);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const completeMission = useUserStore((state) => state.completeMission);
  const unlockBadge = useUserStore((state) => state.unlockBadge);

  useEffect(() => {
    fetchQuizQuestionsFromSupabase().then((data) => {
      if (data && data.length > 0) {
        setQuestions(data);
      }
    });
  }, []);

  const currentQ = questions[currentIndex];

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;

    if (!isLoggedIn || profile.id === 'guest') {
      setIsAuthModalOpen(true);
      return;
    }

    setSelectedOption(index);
    setIsAnswered(true);

    if (index === currentQ.correct_answer_index) {
      setScore((prev) => prev + 1);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      const finalScore = score + (selectedOption === currentQ.correct_answer_index ? 0 : 0);
      const isPerfect = finalScore === questions.length;

      if (isPerfect) {
        completeMission('m-04', 100);
        unlockBadge('b-02'); // Unlock Raja Trivia Sejarah
        confetti({ particleCount: 100, spread: 90, origin: { y: 0.5 } });
      }
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
          <HelpCircle className="w-4 h-4" />
          <span>Trivia Sejarah Kemerdekaan RI</span>
        </div>
        <h2 className="text-2xl font-black text-gradient-gold">Kuis Merdeka 81</h2>
        <p className="text-sm text-slate-300">
          Jawab 5 soal sejarah dengan 100% benar untuk mengeklaim <span className="text-amber-400 font-bold">+100 PTS</span> & membuka Lencana Kehormatan <span className="text-amber-300 font-bold">"Raja Trivia Sejarah"</span>!
        </p>
      </div>

      {!isFinished ? (
        <div className="glass-card-gold rounded-3xl p-6 border border-amber-400/50 space-y-5 shadow-2xl relative overflow-hidden">
          {/* Question Progress Header */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-amber-500/30 pb-3">
            <span>SOAL {currentIndex + 1} DARI {questions.length}</span>
            <span className="text-amber-400 flex items-center gap-1">
              <Trophy className="w-4 h-4" />
              <span>SKOR: {score} / {questions.length}</span>
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-merdeka-red to-amber-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <h3 className="text-lg font-black text-white leading-snug">
              {currentQ?.question}
            </h3>
          </div>

          {/* Answer Options */}
          <div className="space-y-2.5">
            {currentQ?.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQ.correct_answer_index;

              let btnStyle = 'glass-card border-slate-700 hover:border-amber-400 text-slate-200';
              if (isAnswered) {
                if (isCorrect) {
                  btnStyle = 'bg-emerald-950/90 border-emerald-500 text-emerald-300 font-bold shadow-lg';
                } else if (isSelected) {
                  btnStyle = 'bg-red-950/90 border-red-500 text-red-300 font-bold shadow-lg';
                } else {
                  btnStyle = 'glass-card border-slate-800 opacity-40 text-slate-400';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswered}
                  className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm flex items-center justify-between transition-all ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-amber-400 text-xs">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </div>

                  {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-400" />}
                </button>
              );
            })}
          </div>

          {/* Explanation Banner */}
          {isAnswered && (
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/40 text-xs space-y-1 animate-fade-in">
              <p className="font-bold text-amber-300">💡 Penjelasan Sejarah:</p>
              <p className="text-slate-300 leading-relaxed">{currentQ?.explanation}</p>
            </div>
          )}

          {/* Next Button */}
          {isAnswered && (
            <button
              onClick={handleNext}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-merdeka-red to-amber-500 text-slate-950 font-black text-sm shadow-gold-glow flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
            >
              <span>{currentIndex + 1 === questions.length ? 'Lihat Hasil Akhir' : 'Soal Berikutnya'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        /* Final Result Card */
        <div className="glass-card-gold rounded-3xl p-8 border border-amber-400/50 text-center space-y-6 shadow-2xl animate-fade-in">
          {score === questions.length ? (
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-400 text-amber-300 flex items-center justify-center mx-auto text-4xl shadow-gold-glow animate-bounce">
                👑
              </div>
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
                  SKOR SEMPURNA 100%!
                </span>
                <h3 className="text-2xl font-black text-white">Selamat! Lencana "Raja Trivia Sejarah" Terbuka!</h3>
                <p className="text-xs text-slate-300">
                  Anda berhasil menjawab 5/5 soal dengan benar! Poin Kemerdekaan <span className="text-amber-400 font-bold">+100 PTS</span> dan Lencana Kehormatan resmi diberikan ke Paspor Digital Anda.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 flex items-center justify-center gap-3">
                <div className="text-3xl">👑</div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-amber-300">Lencana: Raja Trivia Sejarah</h4>
                  <p className="text-[10px] text-slate-400">Gelar Rarity: Rare Achievement</p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/passport"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-merdeka-red to-amber-500 text-slate-950 font-black text-xs shadow-gold-glow flex items-center justify-center gap-2"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Lihat di Paspor Digital & Cetak Sertifikat</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto text-3xl">
                🎯
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">Skor Anda: {score} / {questions.length} Benar</h3>
                <p className="text-xs text-slate-300">
                  Untuk membuka Lencana <span className="text-amber-400 font-bold">"Raja Trivia Sejarah"</span> dan klaim <span className="text-amber-300 font-bold">+100 PTS</span>, Anda harus menjawab seluruh 5 soal dengan 100% benar tanpa salah!
                </p>
              </div>

              <button
                onClick={handleRestart}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-merdeka-red to-amber-500 text-white font-bold text-xs shadow-glow flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Coba Kuis Lagi Sekarang</span>
              </button>
            </div>
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
};
