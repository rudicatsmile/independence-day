'use client';

import React, { useState } from 'react';
import { X, LogIn, UserPlus, Sparkles, Shield, UserCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { loginWithEmail, registerWithEmail } from '@/lib/supabase/auth';
import { useUserStore } from '@/stores/useUserStore';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [instansi, setInstansi] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setUserProfile = useUserStore((state) => state.setUserProfile);

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
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
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
      confetti({ particleCount: 80, spread: 90, origin: { y: 0.6 } });
      onClose();
    }
  };

  const handleQuickDemoLogin = async (type: 'admin' | 'peserta') => {
    setIsLoading(true);
    setErrorMessage(null);

    const demoEmail = type === 'admin' ? 'admin@merdeka81.id' : 'peserta@merdeka81.id';
    const demoPass = type === 'admin' ? 'Merdeka81#Admin' : 'Merdeka81#Peserta';

    setEmail(demoEmail);
    setPassword(demoPass);

    const { user, error } = await loginWithEmail(demoEmail, demoPass);
    setIsLoading(false);

    if (error) {
      // Fallback local user for demo if remote auth fails
      await setUserProfile({
        id: type === 'admin' ? 'demo-admin-01' : `user-${Date.now()}`,
        full_name: type === 'admin' ? 'Panitia Utama HUT RI 81' : 'Bagas Kencana (Peserta Demo)',
        role: type === 'admin' ? 'admin' : 'participant',
        instansi: type === 'admin' ? 'Panitia Nasional / Garuda 81' : 'Sekretariat Negara / Garuda Muda',
        phone: '081234567890',
        total_points: type === 'admin' ? 500 : 0,
        onboarding_completed: true,
      });
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      onClose();
    } else if (user) {
      await setUserProfile(user);
      confetti({ particleCount: 80, spread: 90, origin: { y: 0.6 } });
      onClose();
    }
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-merdeka-red to-amber-500 border border-amber-300 flex items-center justify-center mx-auto shadow-gold-glow">
            <span className="text-2xl font-black text-white">81</span>
          </div>
          <h3 className="text-xl font-black text-gradient-gold">
            {mode === 'login' ? 'Masuk ke Merdeka 81' : 'Daftar Akun Peserta'}
          </h3>
          <p className="text-xs text-slate-300">
            {mode === 'login'
              ? 'Masukkan kredensial akun Anda untuk mengakses fitur lengkap'
              : 'Isi data diri untuk mulai mengumpulkan poin & lencana'}
          </p>
        </div>

        {/* Quick Demo Login Buttons Bar */}
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-2 text-center">
          <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
            ⚡ 1-Klik Demo Login (Instan Testing)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickDemoLogin('admin')}
              disabled={isLoading}
              className="py-2 px-3 rounded-xl bg-merdeka-red/30 hover:bg-merdeka-red/50 border border-merdeka-red/50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Login Admin</span>
            </button>
            <button
              onClick={() => handleQuickDemoLogin('peserta')}
              disabled={isLoading}
              className="py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>Login Peserta</span>
            </button>
          </div>
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
                  placeholder="Contoh: Bagas Kencana"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Instansi / Kontingen:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Garuda Muda / RT 05"
                  value={instansi}
                  onChange={(e) => setInstansi(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
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
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
            />
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

      </div>
    </div>
  );
};
