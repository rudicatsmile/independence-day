'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Share2, Sparkles, RefreshCw, CheckCircle2, Lock, LogIn } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useUserStore } from '@/stores/useUserStore';
import { TwibbonFrame } from '@/lib/types';
import { MOCK_TWIBBON_FRAMES } from '@/lib/mockData';
import { fetchTwibbonFramesFromSupabase } from '@/lib/supabase/services';
import { AuthModal } from '@/components/auth/AuthModal';

export const TwibbonGenerator: React.FC = () => {
  const [frames, setFrames] = useState<TwibbonFrame[]>(MOCK_TWIBBON_FRAMES);
  const [selectedFrame, setSelectedFrame] = useState<TwibbonFrame>(MOCK_TWIBBON_FRAMES[0]);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [caption, setCaption] = useState('Bangga menjadi bagian dari Perayaan HUT RI ke-81! 🇮🇩✨ #Merdeka81');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedDataUrl, setGeneratedDataUrl] = useState<string | null>(null);
  const [isSavedToGallery, setIsSavedToGallery] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const profile = useUserStore((state) => state.profile);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const addGalleryItem = useUserStore((state) => state.addGalleryItem);
  const completeMission = useUserStore((state) => state.completeMission);

  // Load frames dynamically from Supabase Cloud
  useEffect(() => {
    fetchTwibbonFramesFromSupabase().then((data) => {
      if (data && data.length > 0) {
        setFrames(data);
        setSelectedFrame(data[0]);
      }
    });
  }, []);

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
          setIsSavedToGallery(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Canvas render logic
  useEffect(() => {
    if (!imageSrc || !canvasRef.current) return;
    setIsProcessing(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 1080; // Standard High-Res Canvas Size (1:1)
    canvas.width = size;
    canvas.height = size;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      // 1. Draw User Photo (Cover mode)
      ctx.clearRect(0, 0, size, size);
      
      const aspect = img.width / img.height;
      let drawW = size;
      let drawH = size;
      let drawX = 0;
      let drawY = 0;

      if (aspect > 1) {
        drawW = size * aspect;
        drawX = -(drawW - size) / 2;
      } else {
        drawH = size / aspect;
        drawY = -(drawH - size) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      // 2. If Custom PNG Frame URL is set by Admin, render custom overlay
      if (selectedFrame.frame_image_url) {
        const overlay = new Image();
        overlay.crossOrigin = 'anonymous';
        overlay.src = selectedFrame.frame_image_url;
        overlay.onload = () => {
          ctx.drawImage(overlay, 0, 0, size, size);
          finishRender();
        };
        overlay.onerror = () => {
          drawDefaultGradientFrame(ctx, size);
          finishRender();
        };
      } else {
        drawDefaultGradientFrame(ctx, size);
        finishRender();
      }
    };

    function drawDefaultGradientFrame(context: CanvasRenderingContext2D, size: number) {
      // Overlay Gradient Frame
      const grad = context.createLinearGradient(0, size * 0.55, 0, size);
      grad.addColorStop(0, 'rgba(11, 15, 25, 0)');
      grad.addColorStop(0.7, 'rgba(11, 15, 25, 0.85)');
      grad.addColorStop(1, 'rgba(11, 15, 25, 0.98)');
      context.fillStyle = grad;
      context.fillRect(0, 0, size, size);

      // Top Red-White Ribbon Bar
      context.fillStyle = '#D9272D';
      context.fillRect(0, 0, size, 28);
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 28, size, 28);

      // Gold Border Frame
      context.strokeStyle = selectedFrame.accent_color || '#F59E0B';
      context.lineWidth = 20;
      context.strokeRect(20, 20, size - 40, size - 40);

      // Badge Emblem (Top Right)
      context.save();
      context.beginPath();
      context.arc(size - 120, 120, 75, 0, Math.PI * 2);
      context.fillStyle = '#D9272D';
      context.fill();
      context.strokeStyle = '#F59E0B';
      context.lineWidth = 6;
      context.stroke();

      context.fillStyle = '#FFFFFF';
      context.font = 'bold 54px sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('81', size - 120, 120);
      context.restore();

      // Typography & Text
      context.textAlign = 'center';
      
      context.fillStyle = selectedFrame.accent_color || '#F59E0B';
      context.font = 'bold 36px sans-serif';
      context.fillText((selectedFrame.subtitle || '17 AGUSTUS 2026').toUpperCase(), size / 2, size - 140);

      context.fillStyle = '#FFFFFF';
      context.font = 'extrabold 64px sans-serif';
      context.fillText(selectedFrame.title || 'HUT RI KE-81', size / 2, size - 75);

      context.fillStyle = 'rgba(255, 255, 255, 0.7)';
      context.font = '28px sans-serif';
      const watermarkName = isLoggedIn ? profile.full_name : 'Pejuang Kemerdekaan 81';
      context.fillText(`Dipublikasikan oleh: ${watermarkName}`, size / 2, size - 30);
    }

    function finishRender() {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setGeneratedDataUrl(dataUrl);
      setIsProcessing(false);
    }
  }, [imageSrc, selectedFrame, profile.full_name, isLoggedIn]);

  // Handle Download (Free for all)
  const handleDownload = () => {
    if (!generatedDataUrl) return;
    const a = document.createElement('a');
    a.href = generatedDataUrl;
    a.download = `Twibbon-Merdeka81-${Date.now()}.jpg`;
    a.click();
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
  };

  // Handle Web Share API (Free for all)
  const handleShare = async () => {
    if (!generatedDataUrl) return;

    try {
      const response = await fetch(generatedDataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'twibbon-merdeka81.jpg', { type: 'image/jpeg' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Twibbon HUT RI ke-81',
          text: caption,
        });
      } else {
        handleDownload();
      }
    } catch (err) {
      handleDownload();
    }
  };

  // Save to Wall of Merdeka Gallery (Requires Login)
  const handlePublishToGallery = () => {
    if (!isLoggedIn || profile.id === 'guest') {
      setIsAuthModalOpen(true);
      return;
    }

    if (!generatedDataUrl) return;
    addGalleryItem({
      user_id: profile.id,
      user_name: profile.full_name,
      user_avatar: profile.avatar_url,
      instansi: profile.instansi,
      type: 'photo',
      image_url: generatedDataUrl,
      caption: caption,
    });
    
    completeMission('m-01', 100); // Claim 100 PTS for Selfie Patriotik mission
    setIsSavedToGallery(true);
    confetti({ particleCount: 80, spread: 90, origin: { y: 0.6 } });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
          <Sparkles className="w-4 h-4" />
          <span>Generator Photobooth Instan</span>
        </div>
        <h2 className="text-2xl font-black text-gradient-gold">Twibbon Merdeka 81</h2>
        <p className="text-sm text-slate-300">
          Pilih foto terbaikmu, pasang bingkai spesial HUT RI ke-81, dan bagikan langsung ke media sosial!
        </p>
      </div>

      {/* Frame Selector */}
      <div className="grid grid-cols-3 gap-3">
        {frames.map((frame) => (
          <button
            key={frame.id}
            onClick={() => setSelectedFrame(frame)}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedFrame.id === frame.id
                ? 'glass-card-gold border-amber-400 scale-105 shadow-gold-glow'
                : 'glass-card border-slate-700 hover:border-slate-500'
            }`}
          >
            <div
              className="w-4 h-4 rounded-full mb-2"
              style={{ backgroundColor: frame.accent_color || '#F59E0B' }}
            />
            <p className="text-xs font-bold text-white truncate">{frame.name}</p>
            <p className="text-[10px] text-slate-400 truncate">{frame.title}</p>
          </button>
        ))}
      </div>

      {/* Main Upload / Preview Canvas Box */}
      <div className="glass-card-red rounded-2xl p-6 text-center space-y-4 relative overflow-hidden border border-merdeka-red/30">
        {!imageSrc ? (
          <div className="py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-merdeka-red/20 border border-merdeka-gold/40 flex items-center justify-center mx-auto text-amber-400 animate-float-slow">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Unggah Foto Kamu</h3>
              <p className="text-xs text-slate-300">Bebas diakses tanpa login! Format JPG, PNG atau HEIC</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-merdeka-red to-amber-500 text-white font-bold text-sm shadow-glow shimmer-btn inline-flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <Upload className="w-4 h-4" />
              <span>Pilih Foto Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative max-w-sm mx-auto aspect-square rounded-xl overflow-hidden shadow-2xl border border-merdeka-gold/40">
              <canvas ref={canvasRef} className="w-full h-full object-contain" />
              {isProcessing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-amber-300 gap-2 font-bold text-sm">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Memproses Bingkai...</span>
                </div>
              )}
            </div>

            {/* Caption Input */}
            <div className="text-left space-y-1">
              <label className="text-xs font-bold text-amber-300">Pesan / Caption (Opsional):</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Action Buttons (Download & Share are FREE for all guests) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-600"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Ganti Foto</span>
              </button>

              <button
                onClick={handleDownload}
                className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-merdeka-red to-merdeka-crimson text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-glow"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Foto</span>
              </button>

              <button
                onClick={handleShare}
                className="col-span-2 sm:col-span-1 px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                <span>Bagikan (WA/IG)</span>
              </button>
            </div>

            {/* Publish to App Gallery Button (Requires Login) */}
            <div className="pt-2">
              {!isLoggedIn || profile.id === 'guest' ? (
                <button
                  onClick={handlePublishToGallery}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Masuk Akun untuk Tayangkan ke Galeri & Klaim Poin (+100 PTS)</span>
                </button>
              ) : (
                <button
                  onClick={handlePublishToGallery}
                  disabled={isSavedToGallery}
                  className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    isSavedToGallery
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 cursor-default'
                      : 'bg-gradient-to-r from-amber-500 to-merdeka-red text-slate-950 hover:opacity-95 shadow-gold-glow'
                  }`}
                >
                  {isSavedToGallery ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Telah Ditayangkan di Wall of Merdeka & Poin Diklaim (+100 PTS)!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Tayangkan Foto Ini di Galeri Publik Wall of Merdeka (+100 PTS)</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>

      {/* Auth Modal Popup when requested */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};
