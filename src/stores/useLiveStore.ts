import { create } from 'zustand';
import { MOCK_POLL } from '@/lib/mockData';
import { Poll } from '@/lib/types';
import {
  fetchLiveSaluteCountFromSupabase,
  incrementLiveSaluteInSupabase,
  fetchActivePollFromSupabase,
  submitPollVoteToSupabase,
  fetchLiveEventExtrasFromSupabase,
} from '@/lib/supabase/services';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface LiveState {
  saluteCount: number;
  poll: Poll;
  isAudioMuted: boolean;
  isRealtimeConnected: boolean;

  // New Feature States
  countdownTargetTime: string | null;
  isCountdownEnabled: boolean;
  announcementText: string;
  isAnnouncementEnabled: boolean;
  isLeaderboardEnabled: boolean;
  isSfxEnabled: boolean;
  isMissionsEnabled: boolean;

  initLiveSupabase: (userId?: string) => Promise<void>;
  incrementSalute: () => void;
  votePoll: (userId: string, optionId: string) => Promise<void>;
  toggleAudioMute: () => void;
}

export const useLiveStore = create<LiveState>((set, get) => ({
  saluteCount: 1945,
  poll: MOCK_POLL,
  isAudioMuted: false,
  isRealtimeConnected: false,

  // New Feature Defaults
  countdownTargetTime: null,
  isCountdownEnabled: false,
  announcementText: '',
  isAnnouncementEnabled: false,
  isLeaderboardEnabled: true,
  isSfxEnabled: true,
  isMissionsEnabled: false,

  initLiveSupabase: async (userId?: string) => {
    if (!isSupabaseConfigured()) return;

    try {
      const [count, activePoll, extras] = await Promise.all([
        fetchLiveSaluteCountFromSupabase(),
        fetchActivePollFromSupabase(userId),
        fetchLiveEventExtrasFromSupabase(),
      ]);

      const wasConnected = get().isRealtimeConnected;

      set({
        saluteCount: count,
        poll: activePoll,
        isRealtimeConnected: true,
        countdownTargetTime: extras.countdown_target_time,
        isCountdownEnabled: extras.countdown_enabled,
        announcementText: extras.announcement_text,
        isAnnouncementEnabled: extras.announcement_enabled,
        isLeaderboardEnabled: extras.leaderboard_enabled,
        isSfxEnabled: extras.sfx_enabled,
        isMissionsEnabled: extras.missions_enabled,
      });

      if (wasConnected) {
        return; // Already connected, do not subscribe again
      }

      // Subscribe to Supabase Realtime for Live Salute Counter + New Features
      const supabase = createClient();
      supabase
        .channel('live-salute-channel')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'live_event_state' },
          (payload) => {
            const newData = payload.new as Record<string, unknown>;
            if (newData) {
              const updates: Partial<LiveState> = {};
              if (typeof newData.salute_count === 'number') updates.saluteCount = newData.salute_count;
              if (typeof newData.countdown_target_time === 'string' || newData.countdown_target_time === null) updates.countdownTargetTime = newData.countdown_target_time as string | null;
              if (typeof newData.countdown_enabled === 'boolean') updates.isCountdownEnabled = newData.countdown_enabled;
              if (typeof newData.announcement_text === 'string') updates.announcementText = newData.announcement_text;
              if (typeof newData.announcement_enabled === 'boolean') updates.isAnnouncementEnabled = newData.announcement_enabled;
              if (typeof newData.leaderboard_enabled === 'boolean') updates.isLeaderboardEnabled = newData.leaderboard_enabled;
              if (typeof newData.sfx_enabled === 'boolean') updates.isSfxEnabled = newData.sfx_enabled;
              if (typeof newData.missions_enabled === 'boolean') updates.isMissionsEnabled = newData.missions_enabled;
              set(updates);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'polls' },
          async () => {
            const updatedPoll = await fetchActivePollFromSupabase(userId);
            set({ poll: updatedPoll });
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Live Realtime fallback:', err);
    }
  },

  incrementSalute: () => {
    const current = get().saluteCount;
    const nextCount = current + 1;
    set({ saluteCount: nextCount });

    if (isSupabaseConfigured()) {
      incrementLiveSaluteInSupabase(current);
    }
  },

  votePoll: async (userId: string, optionId: string) => {
    const { poll } = get();
    if (poll.user_voted_option) return;

    // Optimistic UI update
    const updatedOptions = poll.options.map((opt) =>
      opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
    );

    set({
      poll: {
        ...poll,
        options: updatedOptions,
        total_votes: poll.total_votes + 1,
        user_voted_option: optionId,
      },
    });

    if (isSupabaseConfigured() && userId) {
      const remotePoll = await submitPollVoteToSupabase(userId, poll.id, optionId);
      if (remotePoll) {
        set({ poll: remotePoll });
      }
    }
  },

  toggleAudioMute: () => {
    set((state) => ({ isAudioMuted: !state.isAudioMuted }));
  },
}));
