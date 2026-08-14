'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Activity } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { TapBattleScore } from '@/lib/types';
import { fetchTapBattleLeaderboard } from '@/lib/supabase/services';

export default function TapBattleMonitorPage() {
  const [leaderboard, setLeaderboard] = useState<TapBattleScore[]>([]);

  const loadLeaderboard = async () => {
    const data = await fetchTapBattleLeaderboard(10);
    setLeaderboard(data);
  };

  useEffect(() => {
    // Initial load
    loadLeaderboard();

    // Subscribe to realtime updates
    const supabase = createClient();
    const channel = supabase
      .channel('tap-battle-monitor')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tap_battle_scores' },
        () => {
          // When a new score comes in, refresh the leaderboard
          loadLeaderboard();
        }
      )
      .subscribe();

    // Also poll every 5 seconds as a fallback
    const interval = setInterval(() => {
      loadLeaderboard();
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#070A12] text-white p-4 sm:p-8 flex flex-col font-sans overflow-hidden">
      
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-merdeka-red/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-amber-500/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="text-center space-y-4 mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-red-950/80 border border-merdeka-red/50 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <Activity className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-bold uppercase tracking-widest text-sm sm:text-base">LIVE MONITOR</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white uppercase tracking-tight drop-shadow-xl">
            Tap Battle <span className="text-gradient-gold">Challenge</span>
          </h1>
          <p className="text-xl sm:text-2xl text-amber-200 font-medium tracking-wide">
            TOP 10 KETUKAN TERCEPAT & TERBANYAK
          </p>
        </div>

        {/* Leaderboard Table */}
        <div className="flex-1 glass-card-gold rounded-[2.5rem] border-2 border-amber-400/40 shadow-gold-glow p-6 sm:p-10 flex flex-col relative overflow-hidden">
          
          <div className="grid grid-cols-12 gap-4 text-xs sm:text-sm font-bold text-amber-300/70 uppercase tracking-widest px-6 pb-4 border-b border-amber-500/20">
            <div className="col-span-2 sm:col-span-1 text-center">Rank</div>
            <div className="col-span-7 sm:col-span-8">Nama Peserta</div>
            <div className="col-span-3 text-right">Skor (60d)</div>
          </div>

          <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-2 scrollbar-hide">
            {leaderboard.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                <Trophy className="w-20 h-20 text-amber-500/50" />
                <p className="text-2xl font-bold text-amber-200/50">Belum ada skor yang masuk</p>
                <p className="text-slate-400">Jadilah yang pertama untuk mencetak rekor!</p>
              </div>
            ) : (
              leaderboard.map((score, index) => {
                const rank = index + 1;
                const isTop3 = rank <= 3;
                
                return (
                  <div 
                    key={score.id}
                    className={`grid grid-cols-12 gap-4 items-center px-4 sm:px-6 py-4 sm:py-5 rounded-2xl transition-all duration-500 border ${
                      rank === 1 ? 'bg-gradient-to-r from-amber-500/20 to-yellow-300/10 border-amber-400/50 shadow-[0_0_30px_rgba(251,191,36,0.15)] scale-[1.02]' :
                      rank === 2 ? 'bg-slate-300/10 border-slate-300/30' :
                      rank === 3 ? 'bg-orange-600/10 border-orange-500/30' :
                      'bg-slate-900/40 border-transparent hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="col-span-2 sm:col-span-1 flex justify-center relative">
                      {rank === 1 ? (
                        <div className="relative">
                          <div className="absolute -inset-2 bg-amber-400/20 rounded-full blur animate-pulse"></div>
                          <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 drop-shadow-lg relative z-10" />
                        </div>
                      ) : rank === 2 ? (
                        <span className="text-2xl sm:text-3xl">🥈</span>
                      ) : rank === 3 ? (
                        <span className="text-2xl sm:text-3xl">🥉</span>
                      ) : (
                        <span className="text-xl sm:text-2xl font-black text-slate-500 font-mono">#{rank}</span>
                      )}
                    </div>
                    
                    <div className="col-span-7 sm:col-span-8 space-y-1">
                      <p className={`font-black text-lg sm:text-2xl truncate ${rank === 1 ? 'text-amber-300' : 'text-white'}`}>
                        {score.user_name}
                      </p>
                      {score.instansi && (
                        <p className={`text-xs sm:text-sm font-medium truncate ${rank === 1 ? 'text-amber-200/70' : 'text-slate-400'}`}>
                          {score.instansi}
                        </p>
                      )}
                    </div>
                    
                    <div className="col-span-3 text-right">
                      <span className={`font-mono font-black text-2xl sm:text-4xl tracking-tighter ${
                        rank === 1 ? 'text-gradient-gold drop-shadow-md' : 'text-white'
                      }`}>
                        {score.tap_count}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-slate-500 text-sm font-medium">
            Buka menu <strong className="text-slate-300">"Tap Battle Challenge"</strong> di aplikasi untuk ikut serta!
          </p>
        </div>
      </div>
    </div>
  );
}
