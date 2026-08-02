'use client';

import React, { useState } from 'react';
import { Sparkles, Heart, Flag, Share2, Upload, CheckCircle2, ShieldAlert, Trash2, AlertTriangle } from 'lucide-react';
import { useUserStore } from '@/stores/useUserStore';
import { AuthModal } from '@/components/auth/AuthModal';
import confetti from 'canvas-confetti';

export default function GalleryPage() {
  const galleryItems = useUserStore((state) => state.galleryItems);
  const toggleLikeGallery = useUserStore((state) => state.toggleLikeGallery);
  const reportGalleryItem = useUserStore((state) => state.reportGalleryItem);
  const removeGalleryItem = useUserStore((state) => state.removeGalleryItem);

  const profile = useUserStore((state) => state.profile);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'popular' | 'reported'>('all');

  const isAdmin = isLoggedIn && (profile.role === 'admin' || profile.role === 'media_team');

  const handleReport = (id: string) => {
    if (!isLoggedIn || profile.id === 'guest') {
      setIsAuthModalOpen(true);
      return;
    }
    reportGalleryItem(id);
    alert('Terima kasih! Foto ini telah ditandai untuk ditinjau oleh Tim Moderasi Admin.');
  };

  const handleTakedown = (id: string, userName: string) => {
    if (!confirm(`Apakah Anda yakin ingin melakukan TAKEDOWN / HAPUS foto karya ${userName} ini dari publik dan layar panggung?`)) return;
    removeGalleryItem(id);
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
  };

  // Filter items
  const displayedItems = galleryItems.filter((item) => {
    if (filterType === 'popular') return item.like_count >= 50;
    if (filterType === 'reported') return item.report_count > 0;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
          <Sparkles className="w-4 h-4" />
          <span>Live Feed Galeri Publik & Moderasi</span>
        </div>
        <h2 className="text-2xl font-black text-gradient-gold">Wall of Merdeka</h2>
        <p className="text-sm text-slate-300">
          Koleksi momen keseruan perayaan 17-an dari seluruh kontingen & peserta di lapangan!
        </p>
      </div>

      {/* Admin Moderation Special Header Bar */}
      {isAdmin && (
        <div className="glass-card-gold rounded-2xl p-4 border border-amber-400/50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-gold-glow">
          <div className="flex items-center gap-2 text-white font-bold text-xs">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>Mode Moderasi Admin Aktif: Anda dapat melakukan Takedown langsung pada foto yang melanggar.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold ${
                filterType === 'all' ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-300'
              }`}
            >
              Semua Foto
            </button>
            <button
              onClick={() => setFilterType('reported')}
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 ${
                filterType === 'reported' ? 'bg-merdeka-red text-white' : 'bg-slate-900 text-red-300'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Dilaporkan ({galleryItems.filter((i) => i.report_count > 0).length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Gallery Cards Masonry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedItems.map((item) => (
          <div
            key={item.id}
            className={`glass-card rounded-2xl overflow-hidden border transition-all space-y-3 flex flex-col justify-between ${
              item.report_count > 0 ? 'border-red-500/60 shadow-lg' : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            {/* Header User Info */}
            <div className="p-3 pb-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={item.user_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                  alt={item.user_name}
                  className="w-8 h-8 rounded-full object-cover border border-amber-400"
                />
                <div className="leading-tight">
                  <p className="text-xs font-bold text-white truncate max-w-[130px]">{item.user_name}</p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[130px]">{item.instansi}</p>
                </div>
              </div>

              <span className="text-[10px] text-slate-500 font-semibold">{item.created_at}</span>
            </div>

            {/* Photo Card Image */}
            <div className="relative aspect-square w-full overflow-hidden bg-slate-950">
              <img
                src={item.image_url}
                alt={item.caption}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />

              {item.report_count > 0 && (
                <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-red-950/90 border border-red-500 text-red-300 text-[10px] font-bold flex items-center gap-1 shadow-lg">
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                  <span>Dilaporkan ({item.report_count}x)</span>
                </div>
              )}
            </div>

            {/* Caption & Interactions */}
            <div className="p-3 pt-0 space-y-2">
              <p className="text-xs text-slate-200 line-clamp-2">{item.caption}</p>

              {/* Public Interactions (Like & Report) */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  onClick={() => toggleLikeGallery(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    item.is_liked
                      ? 'bg-red-950/80 text-merdeka-red border border-red-500/40'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${item.is_liked ? 'fill-merdeka-red text-merdeka-red' : ''}`} />
                  <span>{item.like_count}</span>
                </button>

                <button
                  onClick={() => handleReport(item.id)}
                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-red-950/60 text-slate-400 hover:text-red-400 text-xs transition-colors"
                  title="Laporkan Foto Ini"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* ADMIN TAKEDOWN BUTTON */}
              {isAdmin && (
                <div className="pt-2">
                  <button
                    onClick={() => handleTakedown(item.id, item.user_name)}
                    className="w-full py-2 rounded-xl bg-red-950/90 hover:bg-red-900 border border-red-500/60 text-red-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>Takedown Konten Ini (Hapus Admin)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Auth Modal Popup when requested */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
