'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Share2, Sparkles, RefreshCw, CheckCircle2, Lock, Move, RotateCcw } from 'lucide-react';
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

  // Position & Zoom adjustment state for customizable photo alignment inside Twibbon
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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
          // Reset photo position and zoom when a new photo is chosen
          setZoomScale(1.0);
          setOffsetX(0);
          setOffsetY(0);
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
      // 1. Draw User Photo with Zoom Scale and Offset X/Y
      ctx.clearRect(0, 0, size, size);
      
      const aspect = img.width / img.height;
      let baseW = size;
      let baseH = size;

      if (aspect > 1) {
        baseW = size * aspect;
      } else {
        baseH = size / aspect;
      }

      const scaledW = baseW * zoomScale;
      const scaledH = baseH * zoomScale;

      const drawX = (size - scaledW) / 2 + offsetX;
      const drawY = (size - scaledH) / 2 + offsetY;

      ctx.drawImage(img, drawX, drawY, scaledW, scaledH);

      // 2. If Custom PNG/SVG Frame URL is set by Admin, render custom overlay
      if (selectedFrame.frame_image_url) {
        const overlay = new Image();
        overlay.crossOrigin = 'anonymous';
        
        // Automatically convert any hardcoded localhost domain to relative path for production compatibility
        let cleanFrameUrl = selectedFrame.frame_image_url;
        if (cleanFrameUrl.includes('localhost:3000')) {
          cleanFrameUrl = cleanFrameUrl.replace(/http:\/\/localhost:\d+/, '');
        }

        overlay.src = cleanFrameUrl;
        overlay.onload = () => {
          ctx.drawImage(overlay, 0, 0, size, size);
          finishRender();
        };
        overlay.onerror = (err) => {
          console.warn('⚠️ Overlay image load notice for URL:', cleanFrameUrl, err);
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

      // Top Red Pill Badge
      context.fillStyle = selectedFrame.accent_color || '#D9272D';
      context.roundRect(size * 0.05, size * 0.05, size * 0.35, size * 0.07, 24);
      context.fill();

      context.fillStyle = '#FFFFFF';
      context.font = '900 32px sans-serif';
      context.textAlign = 'center';
      context.fillText('🇲🇨 MERDEKA 81', size * 0.225, size * 0.098);

      // Bottom Text Banner
      context.textAlign = 'left';
      context.fillStyle = '#FFFFFF';
      context.font = '900 48px sans-serif';
      context.fillText(selectedFrame.title || 'HUT RI KE-81', size * 0.06, size * 0.88);

      context.fillStyle = selectedFrame.accent_color || '#F59E0B';
      context.font = '700 32px sans-serif';
      context.fillText(selectedFrame.subtitle || 'Nusantara Baru, Indonesia Maju', size * 0.06, size * 0.93);
    }

    function finishRender() {
      if (canvasRef.current) {
        setGeneratedDataUrl(canvasRef.current.toDataURL('image/png'));
      }
      setIsProcessing(false);
    }
  }, [imageSrc, selectedFrame, zoomScale, offsetX, offsetY]);

  // Touch and Mouse Drag Handlers to position photo
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageSrc) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !imageSrc || !e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleFactor = 1080 / rect.width;

    const dx = (e.clientX - dragStart.x) * scaleFactor;
    const dy = (e.clientY - dragStart.y) * scaleFactor;

    setOffsetX((prev) => prev + dx);
    setOffsetY((prev) => prev + dy);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!imageSrc || e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !imageSrc || e.touches.length !== 1 || !e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleFactor = 1080 / rect.width;

    const dx = (e.touches[0].clientX - dragStart.x) * scaleFactor;
    const dy = (e.touches[0].clientY - dragStart.y) * scaleFactor;

    setOffsetX((prev) => prev + dx);
    setOffsetY((prev) => prev + dy);
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleResetPosition = () => {
    setZoomScale(1.0);
    setOffsetX(0);
    setOffsetY(0);
  };

  // Download Handler (FREE for all guests)
  const handleDownload = () => {
    if (!generatedDataUrl) return;
    const link = document.createElement('a');
    link.download = `twibbon-merdeka81-${Date.now()}.png`;
    link.href = generatedDataUrl;
    link.click();

    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
  };

  // Share Handler (FREE for all guests)
  const handleShare = async () => {
    if (!generatedDataUrl) return;
    try {
      const blob = await (await fetch(generatedDataUrl)).blob();
      const file = new File([blob], 'twibbon-merdeka81.png', { type: 'image/png' });

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
          Pilih foto terbaikmu, atur posisi & bingkai spesial HUT RI ke-81, lalu bagikan langsung ke media sosial!
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
            {/* Interactive Canvas Container with Drag Handlers */}
            <div className="space-y-2">
              <div
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="relative max-w-sm mx-auto aspect-square rounded-xl overflow-hidden shadow-2xl border border-amber-400/50 cursor-grab active:cursor-grabbing select-none group touch-none"
              >
                <canvas ref={canvasRef} className="w-full h-full object-contain" />

                {/* Touch/Drag Visual Helper Badge */}
                <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-amber-400/40 text-[10px] font-bold text-amber-300 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <Move className="w-3 h-3 text-amber-400" />
                  <span>Geser Foto</span>
                </div>

                {isProcessing && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-amber-300 gap-2 font-bold text-sm">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Memproses Bingkai...</span>
                  </div>
                )}
              </div>

              {/* Position & Zoom Adjustment Controls */}
              <div className="max-w-sm mx-auto p-3.5 rounded-xl bg-slate-950/90 border border-amber-500/30 space-y-3 text-left shadow-lg">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-amber-300 flex items-center gap-1.5">
                    <Move className="w-3.5 h-3.5 text-amber-400" />
                    <span>Atur Posisi & Perbesaran Foto</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleResetPosition}
                    className="text-[11px] text-amber-400 hover:text-white flex items-center gap-1 font-bold underline"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-slate-300">Zoom:</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.05"
                    value={zoomScale}
                    onChange={(e) => setZoomScale(parseFloat(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <span className="text-[11px] font-mono font-black text-amber-300 w-12 text-right">
                    {Math.round(zoomScale * 100)}%
                  </span>
                </div>

                <p className="text-[10px] text-slate-400 italic">
                  💡 Tip: Klik/sentuh lalu geser foto di atas untuk menyesuaikan posisi wajah agar pas dengan bingkai.
                </p>
              </div>
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
                  className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-gold-glow transition-all ${
                    isSavedToGallery
                      ? 'bg-emerald-600/30 border border-emerald-500 text-emerald-300 cursor-default'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:scale-102 shimmer-btn'
                  }`}
                >
                  {isSavedToGallery ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Berhasil Ditayangkan di Wall of Merdeka! (+100 PTS Diklaim)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>Tayangkan Foto Ini di Galeri Publik & Klaim +100 PTS</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>

      {/* Auth Modal Trigger */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};
