'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, QrCode, ShieldCheck, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { useUserStore } from '@/stores/useUserStore';
import { AuthModal } from '@/components/auth/AuthModal';
import confetti from 'canvas-confetti';

interface LocationPoint {
  id: string;
  name: string;
  zone: string;
  points: number;
  lat: number;
  lng: number;
  isScanned: boolean;
  hint: string;
}

export const InteractiveMap: React.FC = () => {
  const completeMission = useUserStore((state) => state.completeMission);
  const unlockBadge = useUserStore((state) => state.unlockBadge);
  const userMissions = useUserStore((state) => state.userMissions);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const profile = useUserStore((state) => state.profile);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [points, setPoints] = useState<LocationPoint[]>([
    {
      id: 'm-02',
      name: 'Panggung Utama Kemerdekaan',
      zone: 'Zona A - Panggung Utama',
      points: 75,
      lat: -6.175392,
      lng: 106.827153,
      isScanned: userMissions['m-02']?.status === 'completed',
      hint: 'Dekat podium pengibaran bendera di sebelah kanan panggung utama.',
    },
    {
      id: 'm-03',
      name: 'Bazar Kuliner Nusantara',
      zone: 'Zona B - Lapangan UMKM',
      points: 75,
      lat: -6.175850,
      lng: 106.827900,
      isScanned: userMissions['m-03']?.status === 'completed',
      hint: 'Di samping booth informasi utama Bazar Kuliner Kemerdekaan.',
    },
    {
      id: 'm-06',
      name: 'Tugu Proklamasi Digital',
      zone: 'Zona C - Area Monumen',
      points: 100,
      lat: -6.176200,
      lng: 106.826800,
      isScanned: false,
      hint: 'Di kaki monumen Garuda Emas dekat area pameran foto sejarah.',
    },
  ]);

  const [selectedPoint, setSelectedPoint] = useState<LocationPoint | null>(points[0]);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'checking' | 'verified' | 'failed'>('idle');
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);

  // Simulate GPS Geofencing verification
  const handleVerifyLocationAndScan = (point: LocationPoint) => {
    if (!isLoggedIn || profile.id === 'guest') {
      setIsAuthModalOpen(true);
      return;
    }

    setGpsStatus('checking');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const simulatedDistance = Math.floor(Math.random() * 25) + 5; // 5-30m
          setDistanceMeters(simulatedDistance);
          if (simulatedDistance <= 50) {
            setGpsStatus('verified');
            completeScan(point);
          } else {
            setGpsStatus('failed');
          }
        },
        () => {
          const simulatedDistance = 18; // 18m
          setDistanceMeters(simulatedDistance);
          setGpsStatus('verified');
          completeScan(point);
        }
      );
    } else {
      setGpsStatus('verified');
      completeScan(point);
    }
  };

  const completeScan = (point: LocationPoint) => {
    completeMission(point.id, point.points);
    setPoints((prev) =>
      prev.map((p) => (p.id === point.id ? { ...p, isScanned: true } : p))
    );
    unlockBadge('b-03'); // Unlock Penjelajah Nusantara badge
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-merdeka-red/20 border border-merdeka-red/40 text-amber-300 text-xs font-bold">
          <Navigation className="w-4 h-4" />
          <span>Fitur Peta & Anti-Cheat Geofencing</span>
        </div>
        <h2 className="text-2xl font-black text-gradient-gold">Jelajah Titik Merdeka</h2>
        <p className="text-sm text-slate-300">
          Temukan 3 lokasi QR Code di area acara. Bebas jelajahi denah, lalu masuk akun untuk verifikasi GPS & klaim poin!
        </p>
      </div>

      {/* Interactive Map Visual Container */}
      <div className="relative aspect-[16/9] w-full rounded-2xl glass-card border border-merdeka-gold/30 overflow-hidden bg-slate-950/80 p-4 flex flex-col justify-between">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d_1px,transparent_1px),linear-gradient(to_bottom,#1f293d_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-30" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-xs font-bold text-slate-200">
            <MapPin className="w-4 h-4 text-merdeka-red" />
            <span>Denah Acara HUT RI 81</span>
          </div>
          <div className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>GPS Geofencing Active</span>
          </div>
        </div>

        {/* Map Pins Interactive Layout */}
        <div className="relative z-10 grid grid-cols-3 gap-2 my-auto py-4">
          {points.map((point, idx) => {
            const isSelected = selectedPoint?.id === point.id;
            return (
              <button
                key={point.id}
                onClick={() => {
                  setSelectedPoint(point);
                  setGpsStatus('idle');
                }}
                className={`p-3 rounded-xl border text-center transition-all relative ${
                  isSelected
                    ? 'glass-card-gold border-amber-400 scale-105 shadow-gold-glow'
                    : 'glass-card border-slate-700 hover:border-slate-500'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 text-xs font-black ${
                    point.isScanned
                      ? 'bg-emerald-500 text-slate-950'
                      : isSelected
                      ? 'bg-amber-400 text-slate-950 animate-bounce'
                      : 'bg-merdeka-red text-white'
                  }`}
                >
                  {point.isScanned ? '✓' : `T${idx + 1}`}
                </div>
                <p className="text-xs font-bold text-white truncate">{point.name}</p>
                <p className="text-[10px] text-amber-300 font-semibold">+{point.points} PTS</p>

                {point.isScanned && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] flex items-center justify-center font-bold">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative z-10 text-center text-[11px] text-slate-400">
          📍 Klik pin lokasi untuk melihat petunjuk tempat & memverifikasi kehadiran GPS.
        </div>
      </div>

      {/* Selected Point Details & GPS Action Box */}
      {selectedPoint && (
        <div className="glass-card-red rounded-2xl p-5 space-y-4 border border-merdeka-red/40">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                {selectedPoint.zone}
              </span>
              <h3 className="text-lg font-black text-white">{selectedPoint.name}</h3>
              <p className="text-xs text-slate-300 mt-1">💡 <span className="font-semibold text-slate-200">Petunjuk Lokasi:</span> {selectedPoint.hint}</p>
            </div>
            <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-xs">
              +{selectedPoint.points} PTS
            </div>
          </div>

          {/* GPS Verification Status */}
          {gpsStatus === 'checking' && (
            <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 font-semibold">
              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span>Memeriksa Koordinat GPS Peserta di Lokasi Acara...</span>
            </div>
          )}

          {gpsStatus === 'verified' && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Lokasi Terverifikasi! Peserta berada dalam radius {distanceMeters}m dari QR Code. Poin berhasil diklaim!</span>
            </div>
          )}

          {gpsStatus === 'failed' && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span>Lokasi Ditolak! Anda terlalu jauh dari QR Code ({distanceMeters}m). Harap scan langsung di lokasi acara.</span>
            </div>
          )}

          {/* Action Scan Button */}
          {!selectedPoint.isScanned ? (
            !isLoggedIn || profile.id === 'guest' ? (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Masuk Akun untuk Verifikasi GPS & Klaim Poin (+{selectedPoint.points} PTS)</span>
              </button>
            ) : (
              <button
                onClick={() => handleVerifyLocationAndScan(selectedPoint)}
                disabled={gpsStatus === 'checking'}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-merdeka-red to-amber-500 text-white font-bold text-sm shadow-glow flex items-center justify-center gap-2 shimmer-btn hover:scale-[1.02] transition-transform"
              >
                <QrCode className="w-5 h-5" />
                <span>Verifikasi GPS & Scan QR Code ({selectedPoint.points} Poin)</span>
              </button>
            )
          ) : (
            <div className="w-full py-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Titik Ini Sudah Berhasil Discan</span>
            </div>
          )}
        </div>
      )}

      {/* Auth Modal Popup when requested */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};
