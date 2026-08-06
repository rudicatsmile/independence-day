'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, UserCog, Loader2, CheckCircle2 } from 'lucide-react';
import { fetchAllProfilesForAdmin, updateProfileRole } from '@/lib/supabase/services';
import { Profile, UserRole } from '@/lib/types';

interface RoleManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_OPTIONS: { value: UserRole; label: string; color: string }[] = [
  { value: 'participant', label: 'Peserta', color: 'text-slate-400 bg-slate-400/10' },
  { value: 'juri_cosplay', label: 'Juri Cosplay', color: 'text-purple-400 bg-purple-400/10' },
  { value: 'panitia_cosplay', label: 'Panitia (Chief)', color: 'text-pink-400 bg-pink-400/10' },
  { value: 'media_team', label: 'Tim Media', color: 'text-emerald-400 bg-emerald-400/10' },
  { value: 'admin', label: 'Admin (Master)', color: 'text-amber-400 bg-amber-400/10' },
];

export default function RoleManagementModal({ isOpen, onClose }: RoleManagementModalProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProfiles();
    }
  }, [isOpen]);

  const loadProfiles = async () => {
    setIsLoading(true);
    const data = await fetchAllProfilesForAdmin();
    setProfiles(data);
    setIsLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingId(userId);
    const success = await updateProfileRole(userId, newRole);
    if (success) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, role: newRole } : p))
      );
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } else {
      alert('Gagal memperbarui role pengguna. Pastikan role baru tersebut sudah didaftarkan di Supabase.');
    }
    setUpdatingId(null);
  };

  if (!isOpen) return null;

  const filteredProfiles = profiles.filter(
    (p) =>
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.instansi.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-slate-900 border border-amber-500/30 rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex-shrink-0 p-5 border-b border-white/5 flex items-center justify-between bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <UserCog className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Manajemen Akses & Role</h2>
              <p className="text-xs text-slate-400">Atur peran pengguna dalam sistem</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/5 bg-slate-900">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama atau instansi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-900/50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-sm text-slate-400">Memuat data pengguna...</p>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <UserCog className="w-12 h-12 text-slate-700 mb-3" />
              <p className="text-slate-400 text-sm">Tidak ada pengguna yang cocok dengan pencarian.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-800/50 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div>
                    <h3 className="text-sm font-bold text-white">{profile.full_name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{profile.instansi}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {updatingId === profile.id && (
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                    )}
                    <select
                      value={profile.role}
                      onChange={(e) => handleRoleChange(profile.id, e.target.value as UserRole)}
                      disabled={updatingId === profile.id}
                      className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 disabled:opacity-50 min-w-[150px] appearance-none cursor-pointer"
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Success Toast */}
        {showSuccessToast && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-emerald-500/90 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            Role berhasil diperbarui!
          </div>
        )}
      </div>
    </div>
  );
}
