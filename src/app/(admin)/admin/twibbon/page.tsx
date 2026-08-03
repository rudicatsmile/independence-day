'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Edit2, Trash2, CheckCircle2, XCircle, ShieldAlert, Image as ImageIcon, Save, RefreshCw } from 'lucide-react';
import { TwibbonFrame } from '@/lib/types';
import { fetchAdminTwibbonFramesFromSupabase, saveTwibbonFrameToSupabase, deleteTwibbonFrameFromSupabase } from '@/lib/supabase/services';
import { MOCK_TWIBBON_FRAMES } from '@/lib/mockData';
import { useUserStore } from '@/stores/useUserStore';
import confetti from 'canvas-confetti';

export default function AdminTwibbonPage() {
  const profile = useUserStore((state) => state.profile);
  const [frames, setFrames] = useState<TwibbonFrame[]>(MOCK_TWIBBON_FRAMES);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingFrame, setEditingFrame] = useState<Partial<TwibbonFrame>>({
    name: '',
    title: '',
    subtitle: '',
    accent_color: '#F59E0B',
    frame_image_url: '',
    is_active: true,
    order_index: 1,
  });

  const loadFrames = async () => {
    setIsLoading(true);
    const data = await fetchAdminTwibbonFramesFromSupabase();
    setFrames(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadFrames();
  }, []);

  const handleSaveFrame = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await saveTwibbonFrameToSupabase(editingFrame);
    setIsLoading(false);

    const newFrameObj: TwibbonFrame = {
      id: editingFrame.id || `f-${Date.now()}`,
      name: editingFrame.name || 'Bingkai Custom',
      title: editingFrame.title || 'HUT RI KE-81',
      subtitle: editingFrame.subtitle || '17 AGUSTUS 2026',
      accent_color: editingFrame.accent_color || '#F59E0B',
      frame_image_url: editingFrame.frame_image_url || undefined,
      is_active: editingFrame.is_active ?? true,
      order_index: editingFrame.order_index || frames.length + 1,
    };

    if (res.error) {
      console.warn('Supabase RLS notice, updating local frame state:', res.error);
    }

    setFrames((prev) => {
      const exists = prev.some((f) => f.id === newFrameObj.id);
      if (exists) {
        return prev.map((f) => (f.id === newFrameObj.id ? newFrameObj : f));
      }
      return [newFrameObj, ...prev];
    });

    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    setIsEditing(false);
    setEditingFrame({
      name: '',
      title: '',
      subtitle: '',
      accent_color: '#F59E0B',
      frame_image_url: '',
      is_active: true,
      order_index: frames.length + 1,
    });
  };

  const handleDeleteFrame = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus bingkai Twibbon ini?')) return;
    setIsLoading(true);
    await deleteTwibbonFrameFromSupabase(id);
    setIsLoading(false);
    loadFrames();
  };

  const startEdit = (frame: TwibbonFrame) => {
    setEditingFrame(frame);
    setIsEditing(true);
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
              setEditingFrame({
                name: '',
                title: '',
                subtitle: '',
                accent_color: '#F59E0B',
                frame_image_url: '',
                is_active: true,
                order_index: frames.length + 1,
              });
              setIsEditing(true);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-merdeka-red to-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-glow hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Bingkai Twibbon Baru</span>
          </button>
        </div>

        <h1 className="text-2xl font-black text-white">Manajemen Background & Bingkai Twibbon</h1>
        <p className="text-xs text-slate-300">
          Atur bingkai 17-an, gambar overlay PNG custom, warna aksen, dan status aktif bingkai yang digunakan oleh seluruh peserta.
        </p>
      </div>

      {/* Edit / Add Modal Form */}
      {isEditing && (
        <div className="glass-card rounded-3xl p-6 border border-amber-400/50 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 className="text-lg font-black text-gradient-gold">
              {editingFrame.id ? 'Edit Bingkai Twibbon' : 'Tambah Bingkai Twibbon Baru'}
            </h3>
            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>

          <form onSubmit={handleSaveFrame} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Nama Bingkai:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Garuda Emas 81"
                  value={editingFrame.name || ''}
                  onChange={(e) => setEditingFrame({ ...editingFrame, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Warna Aksen Bingkai (Hex):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editingFrame.accent_color || '#F59E0B'}
                    onChange={(e) => setEditingFrame({ ...editingFrame, accent_color: e.target.value })}
                    className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editingFrame.accent_color || '#F59E0B'}
                    onChange={(e) => setEditingFrame({ ...editingFrame, accent_color: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Judul Utama (Teks Banner):</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: HUT RI KE-81"
                  value={editingFrame.title || ''}
                  onChange={(e) => setEditingFrame({ ...editingFrame, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Subtitle / Tagline:</label>
                <input
                  type="text"
                  placeholder="Contoh: Nusantara Baru, Indonesia Maju"
                  value={editingFrame.subtitle || ''}
                  onChange={(e) => setEditingFrame({ ...editingFrame, subtitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-300">URL Gambar Overlay PNG/SVG Custom (Opsional):</label>
                <input
                  type="text"
                  placeholder="http://localhost:3000/twibbon-assets/frame-garuda-gold.svg"
                  value={editingFrame.frame_image_url || ''}
                  onChange={(e) => setEditingFrame({ ...editingFrame, frame_image_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                />
                <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-2">
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                    ✨ Contoh URL Gambar Bingkai Publik Siap Pakai (Klik untuk memasukkan):
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setEditingFrame({ ...editingFrame, frame_image_url: '/twibbon-assets/frame-garuda-gold.svg' })}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 border border-amber-400/40 text-amber-300 text-[11px] font-semibold transition-all"
                    >
                      🖼️ Sample 1: Garuda Emas (.svg)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingFrame({ ...editingFrame, frame_image_url: '/twibbon-assets/frame-merah-putih.svg' })}
                      className="px-2.5 py-1 rounded-lg bg-merdeka-red/20 hover:bg-merdeka-red/40 border border-merdeka-red/40 text-red-300 text-[11px] font-semibold transition-all"
                    >
                      🇮🇩 Sample 2: Merah Putih (.svg)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingFrame({ ...editingFrame, frame_image_url: '/twibbon-assets/twibbon-yalwash1.png' })}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-400/40 text-emerald-300 text-[11px] font-semibold transition-all"
                    >
                      🏫 Sample 3: Twibbon Yalwash 1 (.png)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingFrame({ ...editingFrame, frame_image_url: '/twibbon-assets/twibbon-yalwash2.png' })}
                      className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 border border-blue-400/40 text-blue-300 text-[11px] font-semibold transition-all"
                    >
                      🏫 Sample 4: Twibbon Yalwash 2 (.png)
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingFrame.is_active ?? true}
                  onChange={(e) => setEditingFrame({ ...editingFrame, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-merdeka-red focus:ring-amber-400"
                />
                <label htmlFor="is_active" className="text-xs font-bold text-white cursor-pointer">
                  Aktifkan Bingkai Ini untuk Peserta
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
                <span>Simpan Bingkai</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List of Frames */}
      <div className="space-y-3">
        <h3 className="text-base font-black text-gradient-gold">Daftar Bingkai Aktif & Arsip</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {frames.map((frame) => (
            <div
              key={frame.id}
              className={`glass-card rounded-2xl p-5 border transition-all space-y-3 flex flex-col justify-between ${
                frame.is_active ? 'border-amber-500/40 shadow-glow' : 'border-slate-800 opacity-60'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-white/40"
                      style={{ backgroundColor: frame.accent_color }}
                    />
                    <span className="text-xs font-bold text-white truncate">{frame.name}</span>
                  </div>

                  {frame.is_active ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Aktif
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-700 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Nonaktif
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-center">
                  <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">{frame.subtitle}</p>
                  <p className="text-sm font-black text-white">{frame.title}</p>
                  {frame.frame_image_url && (
                    <span className="inline-block text-[9px] text-emerald-300 font-mono bg-emerald-950 px-2 py-0.5 rounded mt-1">
                      🖼️ PNG Custom Overlay Attached
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => startEdit(frame)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handleDeleteFrame(frame.id)}
                  className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
