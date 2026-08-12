'use client';

import React, { useState } from 'react';
import { Award, Lock, CheckCircle2, ShieldAlert, FileText, Download, LogIn, Sparkles } from 'lucide-react';
import { useUserStore } from '@/stores/useUserStore';
import { AuthModal } from '@/components/auth/AuthModal';
import confetti from 'canvas-confetti';

export const BadgeGrid: React.FC = () => {
  const profile = useUserStore((state) => state.profile);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const badges = useUserStore((state) => state.badges);
  const earnedBadgeIds = useUserStore((state) => state.earnedBadgeIds);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Generate Certificate PDF action
  const handleDownloadCertificate = () => {
    if (!isLoggedIn || profile.id === 'guest') {
      setIsAuthModalOpen(true);
      return;
    }

    confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });

    // Create print-friendly popup window with certificate layout
    const certWindow = window.open('', '_blank');
    if (!certWindow) return;

    certWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sertifikat Digital - ${profile.full_name}</title>
          <style>
            body {
              font-family: 'Plus Jakarta Sans', sans-serif;
              background: #0B0F19;
              color: #FFF;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
            }
            .cert-card {
              width: 800px;
              padding: 50px;
              border: 12px solid #F59E0B;
              background: linear-gradient(135deg, #131A2A 0%, #0B0F19 100%);
              text-align: center;
              box-shadow: 0 0 50px rgba(245, 158, 11, 0.4);
              position: relative;
            }
            h1 { color: #F59E0B; font-size: 36px; margin-bottom: 10px; letter-spacing: 2px; }
            h2 { color: #FFFFFF; font-size: 28px; margin: 20px 0 10px 0; border-bottom: 2px solid #D9272D; display: inline-block; padding-bottom: 5px; }
            p { font-size: 16px; color: #CBD5E1; line-height: 1.6; }
            .badge-list { margin-top: 30px; display: flex; justify-content: center; gap: 20px; }
            .badge-item { background: rgba(245, 158, 11, 0.15); border: 1px solid #F59E0B; padding: 10px 20px; border-radius: 20px; font-weight: bold; font-size: 14px; }
            .footer { margin-top: 40px; font-size: 12px; color: #64748B; border-top: 1px solid #334155; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="cert-card">
            <div style="font-size: 48px;">🇮🇩</div>
            <h1>SERTIFIKAT DIGITAL KEHORMATAN</h1>
            <p>Diberikan kepada Pejuang Kemerdekaan:</p>
            <h2>${profile.full_name}</h2>
            <p><strong>${profile.instansi}</strong></p>
            <p>Atas partisipasi aktif dan kontribusi nyata dalam Perayaan <strong>HUT RI ke-81 (17 Agustus 2026)</strong> dengan total pencapaian <strong>${profile.total_points} Poin</strong>.</p>

            <div class="badge-list">
              ${earnedBadgeIds.length > 0
        ? badges.filter(b => earnedBadgeIds.includes(b.id)).map(b => `<div class="badge-item">${b.icon} Gelar: ${b.name}</div>`).join('')
        : '<div class="badge-item">Belum Ada Gelar Patriotik</div>'
      }
            </div>

            <div class="footer">
              Diterbitkan oleh Panitia HUT ke-81 RI
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    certWindow.document.close();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header Passport */}
      {!isLoggedIn || profile.id === 'guest' ? (
        <div className="glass-card-red rounded-3xl p-6 border border-merdeka-red/40 relative overflow-hidden space-y-4 shadow-glow text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/40 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-white">Paspor & Sertifikat Digital Terkunci</h2>
            <p className="text-xs text-slate-300">
              Silakan masuk atau mendaftar akun untuk melihat lencana achievement pribadi & mencetak Sertifikat PDF Kehormatan.
            </p>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-merdeka-red to-amber-500 text-slate-950 font-black text-xs shadow-gold-glow shimmer-btn inline-flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <LogIn className="w-4 h-4" />
            <span>Masuk / Daftar Akun Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="glass-card-gold rounded-3xl p-6 border border-amber-400/40 relative overflow-hidden space-y-4 shadow-gold-glow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                alt={profile.full_name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400 shadow-lg"
              />
              <div>
                <h2 className="text-xl font-black text-white">{profile.full_name}</h2>
                <p className="text-xs text-amber-300 font-semibold">{profile.instansi}</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-merdeka-red text-white text-[10px] font-bold">
                  RANK #{profile.rank || 1} • {profile.total_points} POINTS
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-merdeka-red to-amber-500 flex items-center justify-center border border-amber-300 text-white font-black text-xl shadow-glow">
                81
              </div>
            </div>
          </div>

          {/* Certificate Claim Button */}
          <div className="pt-2 border-t border-amber-500/30 flex items-center justify-between">
            <div className="text-xs text-slate-300">
              <span className="font-bold text-white">Status Sertifikat:</span> Syarat Lulus Terpenuhi
            </div>
            <button
              onClick={handleDownloadCertificate}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-merdeka-red text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-gold-glow hover:scale-105 transition-transform"
            >
              <Download className="w-4 h-4" />
              <span>Cetak Sertifikat PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Badges System Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-black text-gradient-gold">Lencana Achievement Patriotik</h3>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {earnedBadgeIds.length} / {badges.length} Terbuka
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {badges.map((badge) => {
            const isUnlocked = earnedBadgeIds.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border text-center transition-all relative overflow-hidden flex flex-col justify-between ${isUnlocked
                  ? 'glass-card-gold border-amber-400 shadow-gold-glow scale-105'
                  : 'glass-card border-slate-800 opacity-60'
                  }`}
              >
                <div>
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <h4 className="text-xs font-bold text-white leading-tight">{badge.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{badge.description}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-700/50">
                  {isUnlocked ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400">
                      <CheckCircle2 className="w-3 h-3 text-amber-400" /> TERBUKA
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
                      <Lock className="w-3 h-3" /> TERKUNCI
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Auth Modal Popup when requested */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};
