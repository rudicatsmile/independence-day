'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Plus, Edit2, Trash2, CheckCircle2, XCircle, ShieldAlert, Save, RefreshCw, QrCode, Printer } from 'lucide-react';
import { Mission } from '@/lib/types';
import { fetchMissionsFromSupabase, saveMissionToSupabase, deleteMissionFromSupabase } from '@/lib/supabase/services';
import { MOCK_MISSIONS } from '@/lib/mockData';
import confetti from 'canvas-confetti';

export default function AdminMapPage() {
  const [missions, setMissions] = useState<Mission[]>(MOCK_MISSIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMission, setEditingMission] = useState<Partial<Mission>>({
    title: '',
    description: '',
    type: 'qr_hunt',
    points_reward: 75,
    location_name: 'Zona A - Panggung Utama',
    coordinates: { lat: -6.175392, lng: 106.827153 },
    radius_meters: 50,
    is_active: true,
    order_index: 1,
  });

  const loadMissions = async () => {
    setIsLoading(true);
    const data = await fetchMissionsFromSupabase();
    setMissions(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadMissions();
  }, []);

  const qrMissions = missions.filter((m) => m.type === 'qr_hunt');

  const handleSaveMission = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await saveMissionToSupabase(editingMission);
    setIsLoading(false);

    const newObj: Mission = {
      id: editingMission.id || `m-${Date.now()}`,
      slug: editingMission.slug || `qr-${Date.now()}`,
      title: editingMission.title || 'Titik Lokasi QR Baru',
      description: editingMission.description || '',
      type: 'qr_hunt',
      points_reward: editingMission.points_reward || 75,
      icon_name: 'MapPin',
      is_active: editingMission.is_active ?? true,
      order_index: editingMission.order_index || missions.length + 1,
      location_name: editingMission.location_name || 'Zona Utama',
      coordinates: editingMission.coordinates || { lat: -6.175392, lng: 106.827153 },
      radius_meters: editingMission.radius_meters || 50,
    };

    if (res.error) {
      console.warn('Supabase RLS notice, updating local state:', res.error);
    }

    setMissions((prev) => {
      const exists = prev.some((m) => m.id === newObj.id);
      if (exists) {
        return prev.map((m) => (m.id === newObj.id ? newObj : m));
      }
      return [...prev, newObj];
    });

    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    setIsEditing(false);
  };

  const handleDeleteMission = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus titik lokasi QR Hunt ini?')) return;
    setIsLoading(true);
    await deleteMissionFromSupabase(id);
    setIsLoading(false);
    setMissions((prev) => prev.filter((m) => m.id !== id));
  };

  const handlePrintQrCard = (mission: Mission) => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Banner QR Code - ${mission.title}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; background: #FFF; color: #000; }
            .qr-card { border: 8px solid #D9272D; padding: 40px; border-radius: 24px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
            h1 { color: #D9272D; font-size: 28px; margin-bottom: 5px; }
            h2 { color: #F59E0B; font-size: 20px; margin-top: 0; }
            .qr-img { width: 250px; height: 250px; margin: 20px 0; border: 4px solid #000; padding: 10px; border-radius: 16px; }
            .pts { background: #D9272D; color: #FFF; font-weight: bold; padding: 10px 20px; border-radius: 20px; display: inline-block; font-size: 18px; }
            p { color: #555; font-size: 14px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="qr-card">
            <h1>PERAYAAN HUT RI KE-81</h1>
            <h2>${mission.title.toUpperCase()}</h2>
            <div class="pts">+${mission.points_reward} POIN KEMERDEKAAN</div>
            <br/>
            <img class="qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://merdeka81.id/map?scan=${mission.id}" alt="QR Code" />
            <p><strong>Lokasi:</strong> ${mission.location_name || 'Area Utama'}</p>
            <p>Buka Aplikasi Merdeka 81 pada HP Anda & Pindai QR Code Ini!</p>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Admin */}
      <div className="glass-card-gold rounded-3xl p-6 border border-amber-400/40 space-y-2 shadow-gold-glow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-merdeka-red/20 border border-merdeka-red/40 text-amber-300 text-xs font-bold">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Dashboard Administrator</span>
          </div>
          <button
            onClick={() => {
              setEditingMission({
                title: '',
                description: '',
                type: 'qr_hunt',
                points_reward: 75,
                location_name: 'Zona A - Panggung Utama',
                coordinates: { lat: -6.175392, lng: 106.827153 },
                radius_meters: 50,
                is_active: true,
                order_index: missions.length + 1,
              });
              setIsEditing(true);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-merdeka-red to-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-glow hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Titik Lokasi QR Hunt Baru</span>
          </button>
        </div>

        <h1 className="text-2xl font-black text-white">Manajemen Peta QR Hunt & Geofencing GPS</h1>
        <p className="text-xs text-slate-300">
          Atur lokasi titik pin QR Code pada denah acara, poin reward, toleransi radius GPS geofencing (meter), dan cetak banner QR untuk dipasang di lokasi fisik.
        </p>
      </div>

      {/* Edit / Add Modal Form */}
      {isEditing && (
        <div className="glass-card rounded-3xl p-6 border border-amber-400/50 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 className="text-lg font-black text-gradient-gold">
              {editingMission.id ? 'Edit Titik Lokasi QR' : 'Tambah Titik Lokasi QR Baru'}
            </h3>
            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>

          <form onSubmit={handleSaveMission} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Nama Titik Lokasi QR:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Titik Panggung Utama"
                  value={editingMission.title || ''}
                  onChange={(e) => setEditingMission({ ...editingMission, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Nama Zona Acara:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Zona A - Panggung Utama"
                  value={editingMission.location_name || ''}
                  onChange={(e) => setEditingMission({ ...editingMission, location_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Poin Reward Misi:</label>
                <input
                  type="number"
                  required
                  placeholder="75"
                  value={editingMission.points_reward || 75}
                  onChange={(e) => setEditingMission({ ...editingMission, points_reward: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Radius Toleransi Geofencing GPS (Meter):</label>
                <input
                  type="number"
                  required
                  placeholder="50"
                  value={editingMission.radius_meters || 50}
                  onChange={(e) => setEditingMission({ ...editingMission, radius_meters: parseInt(e.target.value) || 50 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-300">Petunjuk Tempat / Hints untuk Peserta:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Dekat podium pengibaran bendera di sebelah kanan panggung utama."
                  value={editingMission.description || ''}
                  onChange={(e) => setEditingMission({ ...editingMission, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active_qr"
                  checked={editingMission.is_active ?? true}
                  onChange={(e) => setEditingMission({ ...editingMission, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-merdeka-red focus:ring-amber-400"
                />
                <label htmlFor="is_active_qr" className="text-xs font-bold text-white cursor-pointer">
                  Aktifkan Titik Lokasi QR Ini
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-merdeka-red to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-gold-glow"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Simpan Titik Lokasi</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List of QR Locations */}
      <div className="space-y-3">
        <h3 className="text-base font-black text-gradient-gold">Daftar Titik Lokasi QR Hunt di Lapangan</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {qrMissions.map((mission) => (
            <div
              key={mission.id}
              className="glass-card rounded-2xl p-5 border border-amber-500/40 space-y-3 flex flex-col justify-between shadow-glow"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    {mission.location_name || 'Area Utama'}
                  </span>
                  <span className="text-xs font-black text-amber-400">
                    +{mission.points_reward} PTS
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white">{mission.title}</h4>
                  <p className="text-xs text-slate-300 mt-1">💡 <span className="text-slate-400">{mission.description}</span></p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono space-y-0.5">
                  <p>📍 Radius Toleransi GPS: <span className="text-emerald-400 font-bold">{mission.radius_meters || 50} Meter</span></p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  onClick={() => handlePrintQrCard(mission)}
                  className="px-3 py-1.5 rounded-xl bg-merdeka-red/30 hover:bg-merdeka-red/50 border border-merdeka-red/50 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cetak Banner QR</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingMission(mission);
                      setIsEditing(true);
                    }}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                  </button>

                  <button
                    onClick={() => handleDeleteMission(mission.id)}
                    className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
