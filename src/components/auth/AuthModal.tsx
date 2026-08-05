'use client';

import React, { useState } from 'react';
import { X, LogIn, UserPlus, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { useUserStore } from '@/stores/useUserStore';
import { loginWithEmail, registerWithEmail } from '@/lib/supabase/auth';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const setUserProfile = useUserStore((state) => state.setUserProfile);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [instansi, setInstansi] = useState('Yayasan');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const { user, error } = await loginWithEmail(email, password);
    setIsLoading(false);

    if (error) {
      setErrorMessage(error);
    } else if (user) {
      await setUserProfile(user);
      confetti({ particleCount: 80, spread: 90, origin: { y: 0.6 } });
      onClose();
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const { user, error } = await registerWithEmail(email, password, fullName, instansi);
    setIsLoading(false);

    if (error) {
      setErrorMessage(error);
    } else if (user) {
      await setUserProfile(user);
      confetti({ particleCount: 100, spread: 100, origin: { y: 0.6 } });
      onClose();
    }
  };

  const handleAdminFill = () => {
    setEmail('admin@merdeka81.id');
    setPassword('Merdeka81#Admin');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md glass-card-gold rounded-3xl p-6 sm:p-8 border border-amber-400/50 shadow-2xl space-y-6">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 border border-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-amber-400/40 flex items-center justify-center mx-auto shadow-gold-glow overflow-hidden p-1.5">
            <Image src="/logo-yayasan.png" alt="Logo Yayasan" width={40} height={40} className="object-contain" />
          </div>
          <h3 className="text-xl font-black text-gradient-gold">
            {mode === 'login' ? 'Masuk Halaman Portal' : 'Daftar Akun Peserta'}
          </h3>
          <p className="text-xs text-slate-300">
            {mode === 'login'
              ? 'Masukkan kredensial akun Anda untuk mengakses fitur lengkap'
              : 'Isi data diri untuk mulai mengumpulkan poin & lencana'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Login / Register */}
        <form onSubmit={mode === 'login' ? handleLoginSubmit : handleRegisterSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Nama Lengkap:</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Lembaga:</label>
                <select
                  required
                  value={instansi}
                  onChange={(e) => setInstansi(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-semibold cursor-pointer"
                >
                  <option value="Yayasan">Yayasan</option>
                  <option value="TK Al-Wathoniyah 9">TK Al-Wathoniyah 9</option>
                  <option value="SD Al-Wathoniyah 9">SD Al-Wathoniyah 9</option>
                  <option value="SMP Al-Wathoniyah 9">SMP Al-Wathoniyah 9</option>
                  <option value="SMK Dinamika Pembangunan 1 Jakarta">SMK Dinamika Pembangunan 1 Jakarta</option>
                  <option value="SMK Dinamika Pembangunan 2 Jakarta">SMK Dinamika Pembangunan 2 Jakarta</option>
                </select>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Email:</label>
            <input
              type="email"
              required
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Password:</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-300 transition-colors p-1"
                title={showPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-merdeka-red via-amber-500 to-merdeka-red text-slate-950 font-black text-xs shadow-gold-glow flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Masuk Sekarang</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Daftar Akun Baru</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle Login / Register */}
        <div className="text-center pt-2 border-t border-slate-800">
          {mode === 'login' ? (
            <p className="text-xs text-slate-400">
              Belum punya akun?{' '}
              <button
                onClick={() => setMode('register')}
                className="text-amber-400 font-bold hover:underline"
              >
                Daftar di sini
              </button>
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Sudah punya akun?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-amber-400 font-bold hover:underline"
              >
                Masuk di sini
              </button>
            </p>
          )}
        </div>

        {/* Subtle Admin Shortcut Link */}
        {mode === 'login' && (
          <div className="text-center pt-1 border-t border-slate-800/50">
            <button
              type="button"
              onClick={handleAdminFill}
              className="text-[11px] font-semibold text-slate-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1"
            >
              <span>👑 Akses Pintasan Panitia / Admin (Isi Otomatis Kredensial)</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
