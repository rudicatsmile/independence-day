'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, UserCog, Loader2, CheckCircle2, Users, Clock, Award } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'role' | 'instansi'>('role');
  const [activeInstansiTab, setActiveInstansiTab] = useState<string>('');

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

  const handleRoleChange = async (userId: string, newRole: UserRole, judgeId?: string) => {
    setUpdatingId(userId);
    const success = await updateProfileRole(userId, newRole, judgeId);
    if (success) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, role: newRole, judge_id: judgeId } : p))
      );
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } else {
      alert('Gagal memperbarui role pengguna. Pastikan role baru tersebut sudah didaftarkan di Supabase.');
    }
    setUpdatingId(null);
  };

  const filteredProfiles = profiles.filter(
    (p) =>
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.instansi.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const instansiGroups = profiles.reduce((acc, profile) => {
    const key = profile.instansi || 'Tanpa Instansi';
    if (!acc[key]) acc[key] = [];
    acc[key].push(profile);
    return acc;
  }, {} as Record<string, Profile[]>);

  const instansiList = Object.keys(instansiGroups).sort();

  useEffect(() => {
    if (viewMode === 'instansi' && instansiList.length > 0 && !activeInstansiTab) {
      setActiveInstansiTab(instansiList[0]);
    }
  }, [viewMode, instansiList, activeInstansiTab]);

  if (!isOpen) return null;

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
        <div className="flex-shrink-0 border-b border-white/5 bg-slate-800/50">
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <UserCog className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Manajemen Administrator</h2>
                <p className="text-xs text-slate-400">Atur akses dan pantau peserta</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex px-5 gap-6">
            <button
              onClick={() => setViewMode('role')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                viewMode === 'role' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <UserCog className="w-4 h-4" /> Akses & Role
            </button>
            <button
              onClick={() => setViewMode('instansi')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                viewMode === 'instansi' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <Users className="w-4 h-4" /> Grup Instansi
            </button>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'role' ? (
          <>
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
                      
                      <div className="flex flex-col gap-2 items-end">
                        <div className="flex items-center gap-3">
                          {updatingId === profile.id && (
                            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                          )}
                          <select
                            value={profile.role}
                            onChange={(e) => handleRoleChange(profile.id, e.target.value as UserRole, profile.judge_id)}
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
                        
                        {profile.role === 'juri_cosplay' && (
                          <select
                            value={profile.judge_id || ''}
                            onChange={(e) => handleRoleChange(profile.id, profile.role, e.target.value)}
                            disabled={updatingId === profile.id}
                            className="bg-purple-950 border border-purple-500/40 rounded-xl px-3 py-1.5 text-xs font-bold text-purple-200 focus:outline-none focus:border-purple-400 disabled:opacity-50 min-w-[150px] appearance-none cursor-pointer"
                          >
                            <option value="" disabled>-- Pilih Identitas Juri --</option>
                            <option value="judge_1">Juri 1 (Bapak Sofyan)</option>
                            <option value="judge_2">Juri 2 (Bapak H. Mulyana)</option>
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full overflow-hidden bg-slate-900/50">
            {/* Horizontal Tabs */}
            <div className="flex overflow-x-auto custom-scrollbar p-3 gap-2 border-b border-white/5">
              {instansiList.map((instansi) => (
                <button
                  key={instansi}
                  onClick={() => setActiveInstansiTab(instansi)}
                  className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeInstansiTab === instansi
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-white/5'
                  }`}
                >
                  {instansi}
                  <span className="ml-2 px-1.5 py-0.5 rounded-md bg-black/20 text-[10px]">
                    {instansiGroups[instansi].length}
                  </span>
                </button>
              ))}
            </div>

            {/* Participants List */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-48 space-y-3">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  <p className="text-sm text-slate-400">Memuat data instansi...</p>
                </div>
              ) : activeInstansiTab && instansiGroups[activeInstansiTab] ? (
                <div className="grid gap-3">
                  {instansiGroups[activeInstansiTab]
                    .sort((a, b) => b.total_points - a.total_points)
                    .map((profile, idx) => (
                      <div
                        key={profile.id}
                        className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/30 border border-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-black text-slate-300">
                            {idx + 1}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                              {profile.full_name}
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300 border border-white/10 uppercase">
                                {profile.role}
                              </span>
                            </h3>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <Award className="w-3 h-3 text-amber-500" /> {profile.total_points} PTS
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> 
                                {profile.updated_at || profile.created_at 
                                  ? new Date(profile.updated_at || profile.created_at || '').toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                  : '-'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        )}

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
