import { create } from 'zustand';
import { MOCK_MISSIONS, MOCK_BADGES, MOCK_GALLERY } from '@/lib/mockData';
import { Profile, Mission, UserMission, Badge, GalleryItem } from '@/lib/types';
import {
  fetchGalleryFromSupabase,
  fetchMissionsFromSupabase,
  fetchUserMissionsFromSupabase,
  insertGalleryItemToSupabase,
  saveCompletedMissionToSupabase,
  takedownGalleryItemInSupabase,
} from '@/lib/supabase/services';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export const GUEST_PROFILE: Profile = {
  id: 'guest',
  full_name: 'Pejuang Kemerdekaan',
  instansi: 'Pengunjung Perayaan HUT RI ke-81',
  phone: '',
  role: 'participant',
  total_points: 0,
  onboarding_completed: false,
  rank: 0,
};

interface UserState {
  profile: Profile;
  isLoggedIn: boolean;
  missions: Mission[];
  userMissions: Record<string, UserMission>;
  badges: Badge[];
  earnedBadgeIds: string[];
  galleryItems: GalleryItem[];
  isSupabaseLive: boolean;
  initSupabaseData: () => Promise<void>;
  setUserProfile: (profile: Profile | null) => Promise<void>;
  completeMission: (missionId: string, rewardPoints: number) => void;
  unlockBadge: (badgeId: string) => void;
  addGalleryItem: (item: Omit<GalleryItem, 'id' | 'created_at' | 'like_count' | 'report_count' | 'status'>) => void;
  removeGalleryItem: (id: string) => void;
  toggleLikeGallery: (id: string) => void;
  reportGalleryItem: (id: string) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: GUEST_PROFILE,
  isLoggedIn: false,
  missions: MOCK_MISSIONS,
  userMissions: {},
  badges: MOCK_BADGES,
  earnedBadgeIds: [],
  galleryItems: MOCK_GALLERY,
  isSupabaseLive: false,

  initSupabaseData: async () => {
    if (!isSupabaseConfigured() || get().isSupabaseLive) return;

    try {
      set({ isSupabaseLive: true });
      
      const [fetchedMissions, fetchedGallery] = await Promise.all([
        fetchMissionsFromSupabase(),
        fetchGalleryFromSupabase(),
      ]);

      const currentProfile = get().profile;
      let fetchedUserMissions: Record<string, UserMission> = {};

      if (get().isLoggedIn && currentProfile?.id && currentProfile.id !== 'guest') {
        fetchedUserMissions = await fetchUserMissionsFromSupabase(currentProfile.id);
      }

      set({
        missions: fetchedMissions,
        galleryItems: fetchedGallery,
        userMissions: fetchedUserMissions,
      });

      // Subscribe to Supabase Realtime channel for gallery updates
      const supabase = createClient();
      supabase
        .channel('gallery-feed-realtime-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'gallery_items' },
          async () => {
            const updatedGallery = await fetchGalleryFromSupabase();
            set({ galleryItems: updatedGallery });
          }
        )
        .subscribe();

      // Subscribe to Supabase Realtime channel for profile updates (total_points sync)
      supabase
        .channel('user-profile-realtime')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles' },
          (payload) => {
            const currentProfile = get().profile;
            if (currentProfile?.id === payload.new.id) {
              set({ profile: { ...currentProfile, ...payload.new } });
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Supabase Realtime fallback to local storage:', err);
    }
  },

  setUserProfile: async (newProfile: Profile | null) => {
    if (!newProfile) {
      set({
        profile: GUEST_PROFILE,
        isLoggedIn: false,
        userMissions: {},
        earnedBadgeIds: [],
      });
      return;
    }

    let userMissions: Record<string, UserMission> = {};
    if (isSupabaseConfigured() && newProfile.id && newProfile.id !== 'guest') {
      userMissions = await fetchUserMissionsFromSupabase(newProfile.id);
    }

    set({
      profile: newProfile,
      isLoggedIn: true,
      userMissions: userMissions,
      earnedBadgeIds: newProfile.role === 'admin' ? ['b-01', 'b-02', 'b-03', 'b-04'] : [],
    });
  },

  completeMission: (missionId: string, rewardPoints: number) => {
    const { userMissions, profile } = get();

    set({
      userMissions: {
        ...userMissions,
        [missionId]: {
          mission_id: missionId,
          status: 'completed',
          points_earned: rewardPoints,
          completed_at: new Date().toISOString(),
        },
      },
      profile: {
        ...profile,
        total_points: profile.total_points + rewardPoints,
      },
    });

    if (isSupabaseConfigured() && profile.id && profile.id !== 'guest') {
      saveCompletedMissionToSupabase(profile.id, missionId, rewardPoints);
    }
  },

  unlockBadge: (badgeId: string) => {
    const { earnedBadgeIds } = get();
    if (earnedBadgeIds.includes(badgeId)) return;
    set({ earnedBadgeIds: [...earnedBadgeIds, badgeId] });
  },

  addGalleryItem: async (itemData) => {
    const newItem: GalleryItem = {
      ...itemData,
      id: `g-${Date.now()}`,
      status: 'approved',
      like_count: 0,
      report_count: 0,
      created_at: 'Baru saja',
    };

    const currentProfile = get().profile;
    const newPoints = currentProfile.total_points + 100;

    set((state) => ({
      galleryItems: [newItem, ...state.galleryItems],
      profile: {
        ...state.profile,
        total_points: newPoints,
      },
    }));

    if (isSupabaseConfigured()) {
      await insertGalleryItemToSupabase(itemData);
      await saveCompletedMissionToSupabase(currentProfile.id, 'm-01', 100);
      const updated = await fetchGalleryFromSupabase();
      set({ galleryItems: updated });
    }
  },

  removeGalleryItem: (id: string) => {
    set((state) => ({
      galleryItems: state.galleryItems.filter((g) => g.id !== id),
    }));

    if (isSupabaseConfigured()) {
      takedownGalleryItemInSupabase(id);
    }
  },

  toggleLikeGallery: (id: string) => {
    set((state) => ({
      galleryItems: state.galleryItems.map((g) => {
        if (g.id !== id) return g;
        const isLiked = !g.is_liked;
        return {
          ...g,
          is_liked: isLiked,
          like_count: isLiked ? g.like_count + 1 : g.like_count - 1,
        };
      }),
    }));
  },

  reportGalleryItem: (id: string) => {
    set((state) => ({
      galleryItems: state.galleryItems.map((g) =>
        g.id === id ? { ...g, report_count: g.report_count + 1 } : g
      ),
    }));
  },
}));
