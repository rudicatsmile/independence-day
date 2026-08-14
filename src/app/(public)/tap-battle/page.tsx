'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Clock, Flag, Activity, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useUserStore } from '@/stores/useUserStore';
import { useLiveStore } from '@/stores/useLiveStore';
import { MissionLockScreen } from '@/components/missions/MissionLockScreen';
import { AuthModal } from '@/components/auth/AuthModal';
import { submitTapBattleScore } from '@/lib/supabase/services';

const BATTLE_DURATION = 60; // 60 seconds

export default function TapBattlePage() {
  const router = useRouter();
  const { profile, isLoggedIn } = useUserStore();
  const isMissionsEnabled = useLiveStore((state) => state.isMissionsEnabled);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [gameState, setGameState] = useState<'intro' | 'countdown' | 'playing' | 'finished' | 'already_played'>('intro');
  const [timeLeft, setTimeLeft] = useState(BATTLE_DURATION);
  const [tapCount, setTapCount] = useState(0);
  const [countdownText, setCountdownText] = useState('3');
  const [isAnimating, setIsAnimating] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user already played (in a real app, we'd check DB or local state)
  // For simplicity, we just allow one play per session unless they reload, but the DB unique constraint prevents multiple submissions anyway.

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startGame = () => {
    if (!isLoggedIn || profile.id === 'guest') {
      setIsAuthModalOpen(true);
      return;
    }
    
    setGameState('countdown');
    
    // 3..2..1..GO!
    let count = 3;
    const countInterval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdownText(count.toString());
      } else if (count === 0) {
        setCountdownText('GO!');
      } else {
        clearInterval(countInterval);
        setGameState('playing');
        startTimer();
      }
    }, 1000);
  };

  const startTimer = () => {
    setTimeLeft(BATTLE_DURATION);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const endGame = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState('finished');
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    
    // Submit score
    if (isLoggedIn && profile.id !== 'guest') {
      // capture current tap count
      setTapCount(currentTapCount => {
        submitTapBattleScore(profile.id, profile.full_name, profile.instansi, currentTapCount);
        return currentTapCount;
      });
    }
  };

  const handleTap = () => {
    if (gameState !== 'playing') return;
    
    setTapCount((prev) => prev + 1);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 100);
    
    // Small confetti every 10 taps
    if ((tapCount + 1) % 10 === 0) {
      confetti({ particleCount: 20, spread: 40, origin: { y: 0.7 } });
    }
  };

  // Prevent double tap zoom on mobile
  const handleTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    handleTap();
  };

  if (!isMissionsEnabled) {
    return (
      <div className="max-w-2xl mx-auto">
        <MissionLockScreen />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-merdeka-red/50 text-red-400 text-xs font-bold">
          <Activity className="w-4 h-4" />
          <span>Tap Battle Challenge</span>
        </div>
        <h2 className="text-2xl font-black text-gradient-gold">Perlombaan Ketuk Hormat</h2>
      </div>

      <div className="glass-card-red rounded-3xl p-6 sm:p-8 text-center space-y-6 relative border border-merdeka-red/40 shadow-glow min-h-[400px] flex flex-col items-center justify-center">
        
        {gameState === 'intro' && (
          <div className="space-y-6 animate-fade-in w-full max-w-sm">
            <div className="w-24 h-24 bg-slate-900/80 rounded-full border-4 border-amber-400 flex items-center justify-center mx-auto shadow-gold-glow">
              <Trophy className="w-12 h-12 text-amber-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">Siap Menjadi Juara?</h3>
              <p className="text-sm text-slate-300">
                Kamu punya waktu <strong className="text-amber-400">60 Detik</strong> untuk mengetuk tombol Hormat sebanyak-banyaknya. 
              </p>
              <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-xs text-red-200 mt-4">
                ⚠️ Kamu hanya bisa bermain <strong>SATU KALI</strong>. Pastikan sinyal stabil!
              </div>
            </div>
            <button
              onClick={startGame}
              className="w-full py-4 bg-gradient-to-r from-merdeka-red to-amber-500 text-white rounded-2xl font-black text-lg shadow-gold-glow hover:scale-105 transition-transform active:scale-95"
            >
              MULAI BATTLE!
            </button>
          </div>
        )}

        {gameState === 'countdown' && (
          <div className="animate-pulse">
            <div className="text-7xl md:text-9xl font-black text-gradient-gold drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">
              {countdownText}
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="w-full space-y-8 animate-fade-in flex flex-col items-center">
            {/* Top Bar (Timer & Score) */}
            <div className="w-full flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <Clock className={`w-6 h-6 ${timeLeft <= 10 ? 'text-red-500 animate-bounce' : 'text-amber-400'}`} />
                <span className={`text-3xl font-black font-mono ${timeLeft <= 10 ? 'text-red-500' : 'text-white'}`}>
                  00:{timeLeft.toString().padStart(2, '0')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-amber-300 font-bold block uppercase tracking-wider">SKOR SEMENTARA</span>
                <span className="text-4xl font-black text-gradient-gold font-mono leading-none">{tapCount}</span>
              </div>
            </div>

            {/* Tap Button */}
            <button
              onClick={handleTap}
              onTouchStart={handleTouch}
              className={`w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-br from-merdeka-red via-merdeka-crimson to-amber-500 border-4 border-amber-300 shadow-[0_0_40px_rgba(239,68,68,0.6)] flex items-center justify-center mx-auto p-4 transition-transform ${isAnimating ? 'scale-105' : 'scale-100'} select-none touch-none`}
              title="KETUK SECEPAT MUNGKIN!"
            >
              <img src="/hormat.png" alt="Hormat" className="w-full h-full object-contain drop-shadow-2xl pointer-events-none" />
            </button>
            
            <p className="text-sm font-bold text-slate-300 animate-pulse">
              🔥 KETUK SECEPAT MUNGKIN! 🔥
            </p>
          </div>
        )}

        {gameState === 'finished' && (
          <div className="space-y-6 animate-fade-in w-full max-w-sm">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-emerald-950 border border-emerald-500/50 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
                Waktu Habis!
              </span>
              <p className="text-sm text-slate-300 font-bold">Skor Akhir Kamu:</p>
              <div className="text-6xl sm:text-7xl font-black text-gradient-gold font-mono drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                {tapCount}
              </div>
              <p className="text-xs text-amber-200 mt-2">
                Rata-rata: {(tapCount / BATTLE_DURATION).toFixed(1)} ketukan per detik
              </p>
            </div>
            
            <div className="p-4 bg-slate-900/80 border border-amber-500/30 rounded-2xl">
              <p className="text-sm text-white font-medium">
                Skormu sudah masuk ke sistem! Cek posisi kamu di <strong>Layar Panggung Utama</strong> sekarang!
              </p>
            </div>

            <button
              onClick={() => router.push('/home')}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold border border-slate-700 hover:bg-slate-700"
            >
              Kembali ke Beranda
            </button>
          </div>
        )}

      </div>
      
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
