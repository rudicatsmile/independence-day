'use client';

import React, { useEffect, useState } from 'react';
import { Radio, Flag, Volume2, VolumeX, Sparkles, CheckCircle2, Heart, Award, Lock, LogIn } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLiveStore } from '@/stores/useLiveStore';
import { useUserStore } from '@/stores/useUserStore';
import { AuthModal } from '@/components/auth/AuthModal';

export default function LivePage() {
  const saluteCount = useLiveStore((state) => state.saluteCount);
  const poll = useLiveStore((state) => state.poll);
  const isAudioMuted = useLiveStore((state) => state.isAudioMuted);
  const isRealtimeConnected = useLiveStore((state) => state.isRealtimeConnected);
  const initLiveSupabase = useLiveStore((state) => state.initLiveSupabase);

  const incrementSalute = useLiveStore((state) => state.incrementSalute);
  const votePoll = useLiveStore((state) => state.votePoll);
  const toggleAudioMute = useLiveStore((state) => state.toggleAudioMute);

  const profile = useUserStore((state) => state.profile);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const completeMission = useUserStore((state) => state.completeMission);

  const [isSaluteAnimating, setIsSaluteAnimating] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    initLiveSupabase(profile?.id);
  }, [initLiveSupabase, profile?.id]);

  const handleSaluteTap = () => {
    incrementSalute();
    setIsSaluteAnimating(true);
    setTimeout(() => setIsSaluteAnimating(false), 300);
    confetti({ particleCount: 25, spread: 40, origin: { y: 0.7 } });
  };

  const handleVote = (optionId: string) => {
    if (!isLoggedIn || profile.id === 'guest') {
      setIsAuthModalOpen(true);
      return;
    }

    votePoll(profile.id, optionId);
    completeMission('m-05', 125); // Complete Live challenge mission
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-merdeka-red/50 text-red-400 text-xs font-bold animate-pulse">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <Radio className="w-4 h-4" />
          <span>Siaran Langsung & Partisipasi Massal Lapangan</span>
        </div>

        <h2 className="text-2xl font-black text-gradient-gold">Hormat Bendera & Polling Perayaan</h2>
        <p className="text-sm text-slate-300">
          Suarakan rasa hormatmu! Jumlah ketukan Hormat! tersinkronisasi secara real-time ke layar proyektor panggung utama.
        </p>
      </div>

      {/* Main Salute Button Box */}
      <div className="glass-card-red rounded-3xl p-8 text-center space-y-6 relative overflow-hidden border border-merdeka-red/40 shadow-glow">
        <div className="space-y-1">
          <span className="text-xs font-bold text-amber-300 uppercase tracking-widest block">
            🇮🇩 KETUKAN HORMAT! KEMERDEKAAN
          </span>
          <div className="text-5xl font-black text-white tracking-tight drop-shadow-lg font-mono">
            {saluteCount.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-slate-300">
            {isRealtimeConnected ? '🟢 Realtime ' : '🟡 Offline Mode'}
          </p>
        </div>

        {/* Big Interactive Salute Button */}
        <button
          onClick={handleSaluteTap}
          className={`w-36 h-36 rounded-full bg-gradient-to-br from-merdeka-red via-merdeka-crimson to-amber-500 border-4 border-amber-300 shadow-gold-glow flex flex-col items-center justify-center mx-auto text-white transition-transform active:scale-95 ${
            isSaluteAnimating ? 'scale-110' : 'hover:scale-105'
          }`}
        >
          <span className="text-4xl">🫡</span>
          <span className="text-xs font-black tracking-wider uppercase mt-1">HORMAT!</span>
        </button>

        <p className="text-xs text-slate-300 max-w-sm mx-auto">
          💡 Bebas ketuk tombol **Hormat!** sebanyak mungkin! Setiap ketukan akan langsung menambah angka counter di Layar Proyektor Panggung.
        </p>
      </div>

      {/* Live Polling Section */}
      <div className="glass-card-gold rounded-3xl p-6 border border-amber-400/40 space-y-4 shadow-gold-glow">
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>POLLING INTERAKTIF LAPANGAN</span>
          </div>
          <span className="text-xs font-bold text-slate-300">
            Total {poll.total_votes} Suara
          </span>
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">{poll.question}</h3>
          <p className="text-xs text-slate-400">
            Pilih 1 pertunjukan favoritmu. Masuk akun untuk melakukan voting & klaim <span className="text-amber-300 font-bold">+125 PTS</span>!
          </p>
        </div>

        {/* Poll Options Grid */}
        <div className="space-y-2.5 pt-2">
          {poll.options.map((opt) => {
            const isVoted = poll.user_voted_option === opt.id;
            const percentage = poll.total_votes > 0 ? Math.round((opt.votes / poll.total_votes) * 100) : 0;

            return (
              <div key={opt.id} className="relative rounded-2xl overflow-hidden">
                {/* Background Progress Fill */}
                <div
                  className="absolute inset-0 bg-amber-500/20 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />

                <button
                  onClick={() => handleVote(opt.id)}
                  disabled={!!poll.user_voted_option}
                  className={`relative z-10 w-full p-4 rounded-2xl border text-left text-xs sm:text-sm flex items-center justify-between transition-all ${
                    isVoted
                      ? 'border-amber-400 bg-amber-500/30 font-bold text-white shadow-gold-glow'
                      : 'border-slate-800 hover:border-slate-600 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isVoted && <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                    <span>{opt.label}</span>
                  </div>

                  <div className="flex items-center gap-2 font-bold text-xs">
                    <span className="text-amber-300">{percentage}%</span>
                    <span className="text-slate-400">({opt.votes})</span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {!isLoggedIn || profile.id === 'guest' ? (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all mt-2"
          >
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Masuk Akun untuk Ikut Voting Polling Live & Klaim Poin (+125 PTS)</span>
          </button>
        ) : null}
      </div>

      {/* Auth Modal Popup when requested */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
