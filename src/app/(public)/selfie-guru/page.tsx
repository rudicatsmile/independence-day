'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Upload,
  Sparkles,
  Award,
  CheckCircle2,
  Share2,
  RefreshCw,
  Send,
  UserCheck,
  Heart,
  ShieldCheck,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import { useUserStore } from '@/stores/useUserStore';
import { AuthModal } from '@/components/auth/AuthModal';
import confetti from 'canvas-confetti';

const PRESET_TEACHERS = [
  { id: 't-1', name: 'Pak Rudi Kurniawan, ST', subject: 'Guru Pembina & ST', school: 'Yayasan Merdeka' },
  { id: 't-2', name: 'Ibu Titi Wijaya', subject: 'Guru Kepala Sekolah', school: 'SD AL-Wathoniyah 9' },
  { id: 't-3', name: 'Pak Bagas Kencana', subject: 'Guru Pembimbing Garuda', school: 'Sekretariat Negara' },
  { id: 't-4', name: 'Ibu Fatmawati', subject: 'Guru Kebangsaan', school: 'SMA Merdeka 81' },
  { id: 't-5', name: 'Pak Sayuti Melik', subject: 'Guru Sejarah Nusantara', school: 'SMP Al-Wathoniyah 9' },
  { id: 't-6', name: 'Ibu Dewi Sartika', subject: 'Guru Bahasa & Seni', school: 'TK Al-Wathoniyah 9' },
];

export default function SelfieGuruPage() {
  const router = useRouter();
  const { isLoggedIn, profile, addGalleryItem, completeMission, initSupabaseData } = useUserStore();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(PRESET_TEACHERS[0].name);
  const [customTeacher, setCustomTeacher] = useState('');
  const [isCustomTeacher, setIsCustomTeacher] = useState(false);
  const [caption, setCaption] = useState('Terima kasih Guruku! Dirgahayu Republik Indonesia ke-81! 🇮🇩✨');

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [generatedDataUrl, setGeneratedDataUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    initSupabaseData();
  }, [initSupabaseData]);

  const teacherNameFinal = isCustomTeacher ? customTeacher || 'Guru Patriot' : selectedTeacher;

  // Camera stream handler
  const startCamera = async () => {
    try {
      setIsCapturing(true);
      setImageSrc(null);
      setGeneratedDataUrl(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1080 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      alert('Kamera tidak dapat diakses. Silakan gunakan tombol Unggah Foto.');
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 800, 800);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setImageSrc(dataUrl);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
          stopCamera();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Render composite image with Merdeka Teacher Frame
  useEffect(() => {
    if (!imageSrc) return;

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      // 1. Base Photo
      ctx.drawImage(img, 0, 0, 800, 800);

      // 2. Merdeka Gradient Bottom Overlay
      const grad = ctx.createLinearGradient(0, 500, 0, 800);
      grad.addColorStop(0, 'rgba(7, 10, 18, 0)');
      grad.addColorStop(0.6, 'rgba(7, 10, 18, 0.85)');
      grad.addColorStop(1, 'rgba(7, 10, 18, 0.98)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 800);

      // 3. Top Ribbon Bar
      ctx.fillStyle = '#D9272D';
      ctx.fillRect(0, 0, 800, 24);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 24, 800, 24);

      // 4. Gold Border
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 16;
      ctx.strokeRect(16, 16, 768, 768);

      // 5. Gold Badge Teacher Emblem (Bottom)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(40, 670, 720, 95, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.fillText('🎓 SELFIE PATRIOT: MURID & GURU PERAYAAN 81', 65, 708);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 26px Inter, sans-serif';
      ctx.fillText(`Guru: ${teacherNameFinal}`, 65, 745);

      setGeneratedDataUrl(canvas.toDataURL('image/jpeg', 0.92));
    };
  }, [imageSrc, teacherNameFinal]);

  const handlePublishSelfie = async () => {
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
      caption: `Selfie Bersama : ${teacherNameFinal} - "${caption}"`,
    });

    completeMission('m-06', 150);
    setIsPublished(true);
    confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
  };

  return (
    <div className="min-h-screen bg-[#070A12] text-white p-4 sm:p-6 space-y-6 max-w-4xl mx-auto pb-20">
      {/* Header Card */}
      <div className="glass-card-gold rounded-3xl p-6 border border-amber-400/50 text-center space-y-3 shadow-gold-glow relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-wider">
          <GraduationCap className="w-4 h-4 text-amber-400" />
          <span>MISI GURU & MURID PATRIOT</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gradient-gold uppercase">
          SELFIE BERSAMA GURU PATRIOT (+150 PTS)
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto">
          Pilih nama guru favoritmu, ambil foto selfie bersama, dan tayangkan momen kebersamaan kalian langsung di Layar Panggung Utama HUT RI ke-81!
        </p>
      </div>

      {!isPublished ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Form Controls */}
          <div className="md:col-span-5 space-y-5 glass-card rounded-3xl p-6 border border-slate-800">
            {/* Step 1: Select Teacher */}
            <div className="space-y-2">
              <label className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" /> 1. Pilih Nama Guru:
              </label>

              {!isCustomTeacher ? (
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  {PRESET_TEACHERS.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.school})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Ketik Nama Guru lengkap..."
                  value={customTeacher}
                  onChange={(e) => setCustomTeacher(e.target.value)}
                  className="w-full bg-slate-900 border border-amber-500/50 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                />
              )}

              <button
                type="button"
                onClick={() => setIsCustomTeacher(!isCustomTeacher)}
                className="text-[11px] text-amber-300 hover:underline font-semibold block pt-1"
              >
                {isCustomTeacher ? '← Pilih dari Daftar Guru Sekolah' : '+ Ketik Nama Guru Lainnya'}
              </button>
            </div>

            {/* Step 2: Message/Caption */}
            <div className="space-y-2">
              <label className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-red-400" /> 2. Pesan untuk Guru:
              </label>
              <textarea
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                placeholder="Tuliskan ucapan Kemerdekaan atau pesan terima kasih untuk guru..."
              />
            </div>

            {/* Step 3: Photo Action Buttons */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-black text-amber-400 uppercase tracking-wider block">
                3. Ambil / Unggah Foto:
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 shadow-lg"
                >
                  <Camera className="w-4 h-4" /> Kamera HP
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-700"
                >
                  <Upload className="w-4 h-4 text-amber-400" /> Upload Foto
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Right Column: Interactive Photobooth Viewport */}
          <div className="md:col-span-7 glass-card rounded-3xl p-6 border border-amber-400/30 flex flex-col justify-between space-y-4">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
              {/* Camera Live Stream Viewport */}
              {isCapturing && (
                <div className="relative w-full h-full">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <button
                    onClick={capturePhoto}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-gold-glow flex items-center gap-2 hover:scale-105"
                  >
                    <Camera className="w-4 h-4" /> Jepret Foto
                  </button>
                </div>
              )}

              {/* Rendered Preview Image with Frame */}
              {!isCapturing && generatedDataUrl && (
                <img src={generatedDataUrl} alt="Selfie Guru" className="w-full h-full object-cover animate-fade-in" />
              )}

              {/* Placeholder */}
              {!isCapturing && !generatedDataUrl && (
                <div className="text-center space-y-3 p-6">
                  <div className="w-16 h-16 rounded-full bg-slate-900 border border-amber-400/40 flex items-center justify-center mx-auto text-amber-400">
                    <GraduationCap className="w-8 h-8" />
                  </div>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Klik <b>Kamera HP</b> atau <b>Upload Foto</b> untuk memulai momen selfie bersama guru patriot.
                  </p>
                </div>
              )}
            </div>

            {/* Final Action Button */}
            {generatedDataUrl && (
              <button
                type="button"
                onClick={handlePublishSelfie}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-merdeka-red text-slate-950 font-black text-sm uppercase tracking-wider shadow-gold-glow shimmer-btn flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
              >
                <Send className="w-5 h-5" />
                <span>Tayangkan di Layar Panggung & Klaim +150 PTS</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Success State View */
        <div className="glass-card-gold rounded-3xl p-8 border border-amber-400 text-center space-y-6 animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">SELAMAT! +150 PTS BERHASIL DIKLAIM! 🎉</h2>
            <p className="text-xs text-slate-300">
              Foto Selfie Anda bersama <b>{teacherNameFinal}</b> telah ditayangkan secara live di <b>Wall of Merdeka Panggung Utama</b>!
            </p>
          </div>

          {generatedDataUrl && (
            <div className="max-w-sm mx-auto aspect-square rounded-2xl overflow-hidden border-2 border-amber-400 shadow-gold-glow">
              <img src={generatedDataUrl} alt="Selfie Success" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => router.push('/stage-display')}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-merdeka-red to-amber-500 text-slate-950 font-black text-xs shadow-gold-glow flex items-center gap-2 hover:scale-105"
            >
              <span>Lihat di Layar Panggung</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setIsPublished(false);
                setImageSrc(null);
                setGeneratedDataUrl(null);
              }}
              className="px-6 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-200 font-bold text-xs hover:bg-slate-800"
            >
              Unggah Foto Lagi
            </button>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
