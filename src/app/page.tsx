'use client';

import React from 'react';
import Link from 'next/link';
import { Flag, Sparkles, ShieldCheck, Award, ArrowRight, GraduationCap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center text-center space-y-8 py-8">
      {/* Badge Pill */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card-gold border border-amber-400/40 text-amber-300 text-xs font-black tracking-wider uppercase animate-bounce">
        <Sparkles className="w-4 h-4 text-amber-400" />
        <span>APLIKASI RESMI PERAYAAN HUT RI KE-81</span>
      </div>

      {/* Hero Title */}
      <div className="space-y-4 max-w-3xl">
        {/* Logo Yayasan Emblem */}
        <div className="w-28 h-28 rounded-3xl bg-slate-900 border-4 border-amber-300 p-2 flex items-center justify-center mx-auto shadow-gold-glow animate-pulse">
          <img
            src="/logo-yayasan.png"
            alt="Logo Yayasan Al-Wathoniyah Asshodriyah 9 Jakarta"
            className="w-full h-full object-contain drop-shadow-md"
          />
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Yayasan Al-Wathoniyah <span className="text-gradient-gold">Asshodriyah 9</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
          Platform partisipasi digital interaktif HUT RI ke-81. Ikuti Twibbon Photobooth, Wall of Merdeka, dan Gerakan Penghormatan Bendera di Panggung Utama!
        </p>
      </div>

      {/* CTA Button */}
      <div className="pt-4">
        <Link
          href="/home"
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-merdeka-red via-amber-500 to-merdeka-red text-slate-950 font-black text-base shadow-gold-glow shimmer-btn inline-flex items-center gap-3 hover:scale-105 transition-transform"
        >
          <span>MASUK KE PORTAL</span>
          <ArrowRight className="w-5 h-5 text-slate-950" />
        </Link>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl w-full pt-8 text-left">
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            ✨
          </div>
          <h3 className="text-sm font-bold text-white">Twibbon Photobooth</h3>
          <p className="text-xs text-slate-400">Bingkai 17-an instan dengan kompresi otomatis & 1-klik share ke WA Status & IG Story.</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-amber-500/30 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xl">
            ❓
          </div>
          <h3 className="text-sm font-bold text-white">Kuis Trivia Kemerdekaan RI</h3>
          <p className="text-xs text-slate-400">Uji wawasan sejarah bangsa, jawab kuis interaktif & kumpulkan poin kemerdekaan.</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            📺
          </div>
          <h3 className="text-sm font-bold text-white">Panggung Live & SFX</h3>
          <p className="text-xs text-slate-400">Tampilan proyektor panggung live salute visualizer & audio sirine perayaan.</p>
        </div>
      </div>
    </div>
  );
}
