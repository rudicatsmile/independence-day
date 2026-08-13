'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Clock } from 'lucide-react';

// Target: 17 Agustus 2026 pukul 08:00 WIB (UTC+7)
const MISSION_UNLOCK_TIME = new Date('2026-08-17T01:00:00Z'); // 08:00 WIB = 01:00 UTC

function useCountdown(target: Date) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
      } else {
        setTimeLeft({
          days: Math.floor(diff / 86400000),
          hours: Math.floor((diff % 86400000) / 3600000),
          minutes: Math.floor((diff % 3600000) / 60000),
          seconds: Math.floor((diff % 60000) / 1000),
          expired: false,
        });
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [target]);

  return timeLeft;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function MissionLockScreen() {
  const countdown = useCountdown(MISSION_UNLOCK_TIME);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-8 px-4">
      {/* Main lock icon */}
      <div className="relative">
        <div className="w-28 h-28 rounded-3xl bg-slate-900 border-2 border-amber-400/40 flex items-center justify-center shadow-gold-glow mx-auto animate-pulse">
          <Lock className="w-14 h-14 text-amber-400" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 border-2 border-slate-950 flex items-center justify-center">
          <span className="text-white text-[10px] font-black">OFF</span>
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5" />
          <span>Misi Belum Dimulai</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          ⏳ Siap-Siap, Pejuang!
        </h1>
        <p className="text-sm text-slate-300 max-w-xs mx-auto">
          Misi-misi seru akan dibuka oleh Panitia tepat saat acara dimulai. Sabar ya! 🇮🇩
        </p>
      </div>

      {/* Countdown */}
      {!countdown.expired ? (
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">
            Hitung Mundur Menuju Hari-H
          </p>
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {/* Days */}
            <div className="flex flex-col items-center">
              <div className="px-3 py-3 sm:px-4 rounded-2xl bg-slate-950 border border-amber-500/40 text-2xl sm:text-3xl font-black text-white shadow-gold-glow font-mono min-w-[60px]">
                {pad(countdown.days)}
              </div>
              <span className="text-[9px] text-slate-400 font-bold mt-1 uppercase">Hari</span>
            </div>
            <span className="text-2xl font-black text-amber-400 pb-4">:</span>
            {/* Hours */}
            <div className="flex flex-col items-center">
              <div className="px-3 py-3 sm:px-4 rounded-2xl bg-slate-950 border border-amber-500/40 text-2xl sm:text-3xl font-black text-white shadow-gold-glow font-mono min-w-[60px]">
                {pad(countdown.hours)}
              </div>
              <span className="text-[9px] text-slate-400 font-bold mt-1 uppercase">Jam</span>
            </div>
            <span className="text-2xl font-black text-amber-400 pb-4">:</span>
            {/* Minutes */}
            <div className="flex flex-col items-center">
              <div className="px-3 py-3 sm:px-4 rounded-2xl bg-slate-950 border border-amber-500/40 text-2xl sm:text-3xl font-black text-white shadow-gold-glow font-mono min-w-[60px]">
                {pad(countdown.minutes)}
              </div>
              <span className="text-[9px] text-slate-400 font-bold mt-1 uppercase">Menit</span>
            </div>
            <span className="text-2xl font-black text-amber-400 pb-4 animate-pulse">:</span>
            {/* Seconds */}
            <div className="flex flex-col items-center">
              <div className="px-3 py-3 sm:px-4 rounded-2xl bg-slate-950 border border-red-500/50 text-2xl sm:text-3xl font-black text-red-400 shadow-glow font-mono min-w-[60px]">
                {pad(countdown.seconds)}
              </div>
              <span className="text-[9px] text-slate-400 font-bold mt-1 uppercase">Detik</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            🗓️ 17 Agustus 2026 • HUT ke-81 RI • Mulai Pukul 08:00 WIB
          </p>
        </div>
      ) : (
        <div className="px-6 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-sm font-bold">
          ✅ Waktu sudah tiba! Misi akan segera dibuka oleh Panitia.
        </div>
      )}

      {/* Motivational footer */}
      <p className="text-xs text-slate-500 italic max-w-xs">
        "Proklamasi! Kami bangsa Indonesia dengan ini menyatakan Kemerdekaan Indonesia."
      </p>
    </div>
  );
}
