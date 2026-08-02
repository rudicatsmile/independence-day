import { create } from 'zustand';
import { MOCK_POLL } from '@/lib/mockData';
import { Poll } from '@/lib/types';
import {
  fetchLiveSaluteCountFromSupabase,
  incrementLiveSaluteInSupabase,
  fetchActivePollFromSupabase,
  submitPollVoteToSupabase,
} from '@/lib/supabase/services';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface LiveState {
  saluteCount: number;
  poll: Poll;
  isAudioMuted: boolean;
  isRealtimeConnected: boolean;
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

  initLiveSupabase: async (userId?: string) => {
    if (!isSupabaseConfigured()) return;

    try {
      const [count, activePoll] = await Promise.all([
        fetchLiveSaluteCountFromSupabase(),
        fetchActivePollFromSupabase(userId),
      ]);

      set({
        saluteCount: count,
        poll: activePoll,
        isRealtimeConnected: true,
      });

      // Subscribe to Supabase Realtime for Live Salute Counter
      const supabase = createClient();
      supabase
        .channel('live-salute-channel')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'live_event_state' },
          (payload) => {
            if (payload.new && payload.new.salute_count) {
              set({ saluteCount: payload.new.salute_count });
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
