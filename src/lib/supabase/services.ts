import { createClient, isSupabaseConfigured } from './client';
import { GalleryItem, Mission, Profile, UserMission, TwibbonFrame, QuizQuestion, Poll, CosplayCategory, CosplayParticipant, CosplayScoreRecord } from '@/lib/types';
import { MOCK_GALLERY, MOCK_MISSIONS, MOCK_LEADERBOARD, MOCK_TWIBBON_FRAMES, MOCK_QUIZ_QUESTIONS, MOCK_POLL, MOCK_COSPLAY_PARTICIPANTS } from '@/lib/mockData';

const supabase = createClient();

/**
 * Fetch Live Salute Counter from Supabase Cloud
 */
export async function fetchLiveSaluteCountFromSupabase(): Promise<number> {
  if (!isSupabaseConfigured()) return 1945;

  const { data, error } = await supabase
    .from('live_event_state')
    .select('salute_count')
    .eq('id', 'main')
    .single();

  if (error || !data) return 1945;
  return typeof data.salute_count === 'number' ? data.salute_count : 1945;
}

/**
 * Increment Live Salute Counter in Supabase Cloud atomically
 */
export async function incrementLiveSaluteInSupabase(currentCount: number): Promise<number> {
  if (!isSupabaseConfigured()) return currentCount + 1;

  // Try RPC first for atomic increment
  const { data: rpcVal, error: rpcErr } = await supabase.rpc('increment_salute_count');
  if (!rpcErr && typeof rpcVal === 'number') {
    return rpcVal;
  }

  // Fallback to direct table update/upsert
  const newCount = currentCount + 1;
  const { error: upsertErr } = await supabase
    .from('live_event_state')
    .upsert({ id: 'main', salute_count: newCount, updated_at: new Date().toISOString() }, { onConflict: 'id' });

  if (upsertErr) {
    console.warn('⚠️ Supabase live_event_state update notice:', upsertErr.message);
  } else {
    console.log('✅ Success increment live_event_state to:', newCount);
  }

  return newCount;
}

/**
 * Fetch Active Poll from Supabase Cloud
 */
export async function fetchActivePollFromSupabase(userId?: string): Promise<Poll> {
  if (!isSupabaseConfigured()) return MOCK_POLL;

  const { data: poll, error } = await supabase
    .from('polls')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !poll) return MOCK_POLL;

  let userVotedOption: string | undefined;
  if (userId) {
    const { data: userVote } = await supabase
      .from('poll_votes')
      .select('option_id')
      .eq('poll_id', poll.id)
      .eq('user_id', userId)
      .single();

    if (userVote) {
      userVotedOption = userVote.option_id;
    }
  }

  return {
    id: poll.id,
    question: poll.question,
    options: poll.options || [],
    is_active: poll.is_active,
    total_votes: poll.total_votes || 0,
    user_voted_option: userVotedOption,
  };
}

/**
 * Submit Poll Vote to Supabase Cloud
 */
export async function submitPollVoteToSupabase(userId: string, pollId: string, optionId: string): Promise<Poll | null> {
  if (!isSupabaseConfigured()) return null;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
  let validUserId: string | null = isUuid ? userId : null;

  if (!validUserId) {
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.id) {
      validUserId = authData.user.id;
    }
  }

  if (!validUserId) {
    const { data: existingProfile } = await supabase.from('profiles').select('id').limit(1).single();
    if (existingProfile?.id) {
      validUserId = existingProfile.id;
    }
  }

  if (!validUserId) return null;

  const { error: voteErr } = await supabase.from('poll_votes').insert({
    user_id: validUserId,
    poll_id: pollId,
    option_id: optionId,
  });

  if (voteErr) {
    console.warn('User already voted or vote error:', voteErr.message);
  }

  const { data: poll } = await supabase.from('polls').select('*').eq('id', pollId).single();
  if (!poll) return null;

  const updatedOptions = (poll.options || []).map((opt: any) => {
    if (opt.id === optionId) {
      return { ...opt, votes: (opt.votes || 0) + 1 };
    }
    return opt;
  });

  const newTotal = (poll.total_votes || 0) + 1;

  await supabase.from('polls').update({
    options: updatedOptions,
    total_votes: newTotal,
  }).eq('id', pollId);

  return {
    id: poll.id,
    question: poll.question,
    options: updatedOptions,
    is_active: poll.is_active,
    total_votes: newTotal,
    user_voted_option: optionId,
  };
}

/**
 * Fetch Quiz questions from Supabase Cloud
 */
export async function fetchQuizQuestionsFromSupabase(): Promise<QuizQuestion[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_QUIZ_QUESTIONS;
  }

  const { data, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (error || !data || data.length === 0) {
    return MOCK_QUIZ_QUESTIONS;
  }

  return data as QuizQuestion[];
}

/**
 * Insert or update a Quiz question by Admin
 */
export async function saveQuizQuestionToSupabase(q: Partial<QuizQuestion>): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: null };

  const { error } = await supabase
    .from('quiz_questions')
    .upsert({
      question: q.question,
      options: q.options,
      correct_answer_index: q.correct_answer_index ?? 0,
      explanation: q.explanation || '',
      order_index: q.order_index || 1,
      is_active: q.is_active ?? true,
      ...(q.id ? { id: q.id } : {}),
    });

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Delete a Quiz question by Admin
 */
export async function deleteQuizQuestionFromSupabase(id: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: null };

  const { error } = await supabase
    .from('quiz_questions')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Fetch active twibbon frames
 */
export async function fetchTwibbonFramesFromSupabase(): Promise<TwibbonFrame[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_TWIBBON_FRAMES;
  }

  const { data, error } = await supabase
    .from('twibbon_frames')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (error || !data || data.length === 0) {
    return MOCK_TWIBBON_FRAMES;
  }

  return data as TwibbonFrame[];
}

/**
 * Fetch all twibbon frames for Admin
 */
export async function fetchAdminTwibbonFramesFromSupabase(): Promise<TwibbonFrame[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_TWIBBON_FRAMES;
  }

  const { data, error } = await supabase
    .from('twibbon_frames')
    .select('*')
    .order('order_index', { ascending: true });

  if (error || !data) {
    return MOCK_TWIBBON_FRAMES;
  }

  return data as TwibbonFrame[];
}

/**
 * Insert or update a twibbon frame by Admin
 */
export async function saveTwibbonFrameToSupabase(frame: Partial<TwibbonFrame>): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { error: null };
  }

  const { error } = await supabase
    .from('twibbon_frames')
    .upsert({
      name: frame.name,
      title: frame.title,
      subtitle: frame.subtitle,
      accent_color: frame.accent_color || '#F59E0B',
      frame_image_url: frame.frame_image_url || null,
      is_active: frame.is_active ?? true,
      order_index: frame.order_index || 1,
      ...(frame.id ? { id: frame.id } : {}),
    });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Delete a twibbon frame by Admin
 */
export async function deleteTwibbonFrameFromSupabase(id: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { error: null };
  }

  const { error } = await supabase
    .from('twibbon_frames')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Fetch list of missions from Supabase Cloud
 */
export async function fetchMissionsFromSupabase(): Promise<Mission[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_MISSIONS;
  }

  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (error || !data || data.length === 0) {
    return MOCK_MISSIONS;
  }

  return data as Mission[];
}

/**
 * Save / Update Mission / QR Location Pin by Admin
 */
export async function saveMissionToSupabase(mission: Partial<Mission>): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { error: null };
  }

  const { error } = await supabase
    .from('missions')
    .upsert({
      slug: mission.slug || `qr-${Date.now()}`,
      title: mission.title,
      description: mission.description,
      type: mission.type || 'qr_hunt',
      points_reward: mission.points_reward || 75,
      icon_name: mission.icon_name || 'MapPin',
      is_active: mission.is_active ?? true,
      order_index: mission.order_index || 1,
      location_name: mission.location_name || '',
      coordinates: mission.coordinates || { lat: -6.175392, lng: 106.827153 },
      radius_meters: mission.radius_meters || 50,
      ...(mission.id ? { id: mission.id } : {}),
    });

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Delete Mission / QR Location Pin by Admin
 */
export async function deleteMissionFromSupabase(id: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { error: null };
  }

  const { error } = await supabase
    .from('missions')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Fetch user completed missions from Supabase Cloud
 */
export async function fetchUserMissionsFromSupabase(userId: string): Promise<Record<string, UserMission>> {
  if (!isSupabaseConfigured() || !userId) {
    return {};
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
  let validUserId: string | null = isUuid ? userId : null;

  if (!validUserId) {
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.id) validUserId = authData.user.id;
  }

  if (!validUserId) return {};

  const { data, error } = await supabase
    .from('user_missions')
    .select('*')
    .eq('user_id', validUserId);

  if (error || !data) {
    return {};
  }

  const result: Record<string, UserMission> = {};
  data.forEach((um) => {
    result[um.mission_id] = {
      mission_id: um.mission_id,
      status: um.status,
      points_earned: um.points_earned,
      completed_at: um.completed_at,
    };
  });

  return result;
}

/**
 * Save mission completion to Supabase Cloud & update profiles.total_points
 */
export async function saveCompletedMissionToSupabase(userId: string, missionId: string, rewardPoints: number) {
  if (!isSupabaseConfigured()) return;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
  let validUserId: string | null = isUuid ? userId : null;

  if (!validUserId) {
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.id) {
      validUserId = authData.user.id;
    }
  }

  if (!validUserId) {
    const { data: existingProfile } = await supabase.from('profiles').select('id').limit(1).single();
    if (existingProfile?.id) {
      validUserId = existingProfile.id;
    }
  }

  if (!validUserId) return;

  // 1. Record completed mission
  await supabase.from('user_missions').upsert({
    user_id: validUserId,
    mission_id: missionId,
    status: 'completed',
    points_earned: rewardPoints,
    completed_at: new Date().toISOString(),
  }, { onConflict: 'user_id,mission_id' });

  // 2. Fetch current points and update profiles.total_points in Supabase Cloud
  const { data: profile } = await supabase.from('profiles').select('total_points').eq('id', validUserId).single();
  const currentPoints = profile?.total_points || 0;
  const newTotal = currentPoints + rewardPoints;

  const { error: updateErr } = await supabase.from('profiles').update({
    total_points: newTotal,
  }).eq('id', validUserId);

  if (updateErr) {
    console.warn('⚠️ Supabase profiles points update notice:', updateErr.message);
  } else {
    console.log('✅ Success update total_points in Supabase Cloud to:', newTotal);
  }
}

/**
 * Fetch approved gallery items for Wall of Merdeka
 */
export async function fetchGalleryFromSupabase(): Promise<GalleryItem[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_GALLERY;
  }

  const { data, error } = await supabase
    .from('gallery_items')
    .select('*, profiles(full_name, avatar_url, instansi)')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((item) => ({
    id: item.id,
    user_id: item.user_id,
    user_name: item.profiles?.full_name || 'Peserta Merdeka 81',
    user_avatar: item.profiles?.avatar_url,
    instansi: item.profiles?.instansi || 'Kontingen HUT RI 81',
    type: item.type,
    image_url: item.image_url,
    caption: item.caption,
    like_count: item.like_count || 0,
    report_count: item.report_count || 0,
    status: item.status,
    created_at: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));
}

/**
 * Insert new photo to Wall of Merdeka with guaranteed active profile ID
 */
export async function insertGalleryItemToSupabase(item: Omit<GalleryItem, 'id' | 'created_at' | 'like_count' | 'report_count' | 'status'>) {
  if (!isSupabaseConfigured()) {
    return;
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.user_id);
  let validUserId: string | null = isUuid ? item.user_id : null;

  if (!validUserId) {
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.id) {
      validUserId = authData.user.id;
    }
  }

  if (!validUserId) {
    const { data: existingProfile } = await supabase.from('profiles').select('id').limit(1).single();
    if (existingProfile?.id) {
      validUserId = existingProfile.id;
    }
  }

  if (!validUserId) {
    console.warn('⚠️ Cannot find any valid profile ID in Supabase Cloud for gallery insert.');
    return;
  }

  const { error } = await supabase.from('gallery_items').insert({
    user_id: validUserId,
    type: item.type || 'photo',
    image_url: item.image_url,
    caption: item.caption,
    status: 'approved', // Auto-publish
  });

  if (error) {
    console.error('❌ Supabase gallery_items insert error:', error.message);
  } else {
    console.log('✅ Success insert gallery_items to Supabase Cloud!');
  }
}

/**
 * Admin Takedown photo from Wall of Merdeka
 */
export async function takedownGalleryItemInSupabase(id: string) {
  if (!isSupabaseConfigured()) return;
  await supabase.from('gallery_items').update({ status: 'removed' }).eq('id', id);
}

/**
 * Fetch Leaderboard top profiles strictly from Supabase Cloud public.profiles table
 */
export async function fetchLeaderboardFromSupabase(): Promise<Profile[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_LEADERBOARD;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('total_points', { ascending: false })
    .limit(50);

  if (error) {
    console.error('❌ Error fetching leaderboard from Supabase Cloud:', error.message);
    return [];
  }

  console.log('🏆 Leaderboard fetched from Supabase Cloud:', data?.length, 'rows');
  return (data || []).map((p, idx) => ({ ...p, rank: idx + 1 }));
}

/**
 * Fetch dynamic stage header title, date, and year number from Supabase Cloud
 */
export async function fetchLiveEventHeaderFromSupabase(): Promise<{ event_title: string; event_date: string; event_year_number: string }> {
  if (!isSupabaseConfigured()) {
    return {
      event_title: 'PANGGUNG UTAMA PERAYAAN HUT RI KE-81',
      event_date: '17 AGUSTUS 2026',
      event_year_number: '81',
    };
  }

  const { data, error } = await supabase
    .from('live_event_state')
    .select('event_title, event_date, event_year_number')
    .eq('id', 'main')
    .single();

  if (error || !data) {
    return {
      event_title: 'PANGGUNG UTAMA PERAYAAN HUT RI KE-81',
      event_date: '17 AGUSTUS 2026',
      event_year_number: '81',
    };
  }

  return {
    event_title: data.event_title || 'PANGGUNG UTAMA PERAYAAN HUT RI KE-81',
    event_date: data.event_date || '17 AGUSTUS 2026',
    event_year_number: data.event_year_number || '81',
  };
}

/**
 * Update dynamic stage header title, date, and year number in Supabase Cloud by Admin
 */
export async function updateLiveEventHeaderInSupabase(
  eventTitle: string,
  eventDate: string,
  eventYearNumber: string
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: null };

  const { error } = await supabase
    .from('live_event_state')
    .upsert({
      id: 'main',
      event_title: eventTitle,
      event_date: eventDate,
      event_year_number: eventYearNumber,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Fetch cosplay participants and scores for a specific category
 */
export async function fetchCosplayParticipantsFromSupabase(category: CosplayCategory): Promise<CosplayParticipant[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_COSPLAY_PARTICIPANTS.filter((p) => p.category === category);
  }

  const { data: participants, error: pErr } = await supabase
    .from('cosplay_participants')
    .select('*')
    .eq('category', category);

  if (pErr || !participants || participants.length === 0) {
    return MOCK_COSPLAY_PARTICIPANTS.filter((p) => p.category === category);
  }

  const pIds = participants.map((p) => p.id);
  const { data: scores } = await supabase
    .from('cosplay_scores')
    .select('*')
    .in('participant_id', pIds);

  return participants.map((p) => {
    const pScores = (scores || []).filter((s) => s.participant_id === p.id);
    const scoresByJudge: Record<string, { scores: Record<string, number>; final_score: number }> = {};
    let totalScoreSum = 0;

    pScores.forEach((s) => {
      scoresByJudge[s.judge_name] = {
        scores: s.scores || {},
        final_score: Number(s.final_score) || 0,
      };
      totalScoreSum += Number(s.final_score) || 0;
    });

    const avgFinalScore = pScores.length > 0 ? Number((totalScoreSum / pScores.length).toFixed(2)) : 0;

    return {
      id: p.id,
      name: p.name,
      class_level: p.class_level,
      character_name: p.character_name,
      category: p.category as CosplayCategory,
      created_at: p.created_at,
      final_score: avgFinalScore,
      scores_by_judge: scoresByJudge,
    };
  });
}

/**
 * Save / Update a score from a Jury member for a cosplay participant
 */
export async function saveCosplayScoreToSupabase(
  participantId: string,
  judgeName: string,
  scores: Record<string, number>,
  finalScore: number
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: null };

  const { error } = await supabase
    .from('cosplay_scores')
    .upsert({
      participant_id: participantId,
      judge_name: judgeName,
      scores: scores,
      final_score: finalScore,
      created_at: new Date().toISOString(),
    }, { onConflict: 'participant_id,judge_name' });

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Add a new cosplay participant
 */
export async function saveCosplayParticipantToSupabase(
  participant: Partial<CosplayParticipant>
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: null };

  const { error } = await supabase
    .from('cosplay_participants')
    .insert({
      name: participant.name,
      class_level: participant.class_level,
      character_name: participant.character_name,
      category: participant.category,
    });

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Fetch Cosplay competition publication status for public viewing
 */
export async function fetchCosplayPublishedStatusFromSupabase(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { data, error } = await supabase
    .from('live_event_state')
    .select('cosplay_published')
    .eq('id', 'main')
    .single();

  if (error || !data) return false;
  return !!data.cosplay_published;
}

/**
 * Update Cosplay competition publication status by Jury / Admin
 */
export async function updateCosplayPublishedStatusInSupabase(published: boolean): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: null };

  const { error } = await supabase
    .from('live_event_state')
    .upsert({
      id: 'main',
      cosplay_published: published,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) {
    console.warn('⚠️ live_event_state cosplay_published notice:', error.message);
    if (error.message.includes('cosplay_published')) {
      return { error: null };
    }
    return { error: error.message };
  }
  return { error: null };
}



/**
 * Update Poll Question & Options in Supabase Cloud by Admin
 */
export async function updatePollInSupabase(
  question: string,
  options: { id: string; label: string; votes: number }[]
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: null };

  const totalVotes = options.reduce((sum, opt) => sum + (opt.votes || 0), 0);

  const { error } = await supabase
    .from('polls')
    .upsert({
      id: 'poll-main',
      question: question,
      options: options,
      total_votes: totalVotes,
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Reset Poll Votes in Supabase Cloud by Admin
 */
export async function resetPollVotesInSupabase(): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: null };

  const currentPoll = await fetchActivePollFromSupabase();
  const resetOptions = currentPoll.options.map((opt) => ({ ...opt, votes: 0 }));

  const { error } = await supabase
    .from('polls')
    .upsert({
      id: 'poll-main',
      question: currentPoll.question,
      options: resetOptions,
      total_votes: 0,
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) return { error: error.message };
  return { error: null };
}

// ═══════════════════════════════════════════════════════════════════════
// NEW FEATURES: Countdown Timer, Announcement, Leaderboard, Admin Stats, SFX
// ═══════════════════════════════════════════════════════════════════════

/**
 * Fetch all live event toggles & extra fields from Supabase (countdown, announcement, leaderboard, sfx)
 */
export async function fetchLiveEventExtrasFromSupabase(): Promise<{
  countdown_target_time: string | null;
  countdown_enabled: boolean;
  announcement_text: string;
  announcement_enabled: boolean;
  leaderboard_enabled: boolean;
  sfx_enabled: boolean;
}> {
  const defaults = {
    countdown_target_time: null,
    countdown_enabled: false,
    announcement_text: '',
    announcement_enabled: false,
    leaderboard_enabled: true,
    sfx_enabled: true,
  };

  if (!isSupabaseConfigured()) return defaults;

  const { data, error } = await supabase
    .from('live_event_state')
    .select('countdown_target_time, countdown_enabled, announcement_text, announcement_enabled, leaderboard_enabled, sfx_enabled')
    .eq('id', 'main')
    .single();

  if (error || !data) return defaults;

  return {
    countdown_target_time: data.countdown_target_time ?? null,
    countdown_enabled: data.countdown_enabled ?? false,
    announcement_text: data.announcement_text ?? '',
    announcement_enabled: data.announcement_enabled ?? false,
    leaderboard_enabled: data.leaderboard_enabled ?? true,
    sfx_enabled: data.sfx_enabled ?? true,
  };
}

/**
 * Update Countdown Timer target time and enabled flag by Admin
 */
export async function updateCountdownInSupabase(
  targetTime: string | null,
  enabled: boolean
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: null };

  const { error } = await supabase
    .from('live_event_state')
    .upsert({
      id: 'main',
      countdown_target_time: targetTime,
      countdown_enabled: enabled,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Update Running Text Announcement by Admin
 */
export async function updateAnnouncementInSupabase(
  text: string,
  enabled: boolean
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: null };

  const { error } = await supabase
    .from('live_event_state')
    .upsert({
      id: 'main',
      announcement_text: text,
      announcement_enabled: enabled,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Update Leaderboard visibility toggle by Admin
 */
export async function updateLeaderboardToggleInSupabase(enabled: boolean): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: null };

  const { error } = await supabase
    .from('live_event_state')
    .upsert({
      id: 'main',
      leaderboard_enabled: enabled,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Update SFX toggle by Admin
 */
export async function updateSfxToggleInSupabase(enabled: boolean): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: null };

  const { error } = await supabase
    .from('live_event_state')
    .upsert({
      id: 'main',
      sfx_enabled: enabled,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Fetch Full Leaderboard (all participants, no limit) for public view
 */
export async function fetchFullLeaderboardFromSupabase(): Promise<Profile[]> {
  if (!isSupabaseConfigured()) return MOCK_LEADERBOARD;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('total_points', { ascending: false });

  if (error || !data) return MOCK_LEADERBOARD;
  return (data || []).map((p, idx) => ({ ...p, rank: idx + 1 }));
}

/**
 * Fetch Admin Dashboard Statistics (aggregated counts) from Supabase
 */
export async function fetchAdminStatsFromSupabase(): Promise<{
  totalParticipants: number;
  totalTwibbonPhotos: number;
  totalSelfiePhotos: number;
  totalQuizCompleted: number;
  totalSaluteCount: number;
  totalPollVotes: number;
}> {
  const defaults = {
    totalParticipants: 0,
    totalTwibbonPhotos: 0,
    totalSelfiePhotos: 0,
    totalQuizCompleted: 0,
    totalSaluteCount: 1945,
    totalPollVotes: 0,
  };

  if (!isSupabaseConfigured()) return defaults;

  try {
    // Fetch all stats in parallel
    const [profilesRes, galleryRes, saluteRes, pollRes, quizMissionsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('gallery_items').select('id, caption'),
      supabase.from('live_event_state').select('salute_count').eq('id', 'main').single(),
      supabase.from('polls').select('total_votes').eq('is_active', true).single(),
      supabase.from('user_missions').select('id', { count: 'exact', head: true }).eq('mission_id', 'm-04').eq('status', 'completed'),
    ]);

    const totalParticipants = profilesRes.count || 0;
    const totalSaluteCount = saluteRes.data?.salute_count || 1945;
    const totalPollVotes = pollRes.data?.total_votes || 0;
    const totalQuizCompleted = quizMissionsRes.count || 0;

    // Count gallery items by type (twibbon vs selfie) based on caption
    const allGallery = galleryRes.data || [];
    const totalSelfiePhotos = allGallery.filter((g: { caption?: string }) =>
      g.caption?.toLowerCase().includes('selfie bersama')
    ).length;
    const totalTwibbonPhotos = allGallery.length - totalSelfiePhotos;

    return {
      totalParticipants,
      totalTwibbonPhotos,
      totalSelfiePhotos,
      totalQuizCompleted,
      totalSaluteCount,
      totalPollVotes,
    };
  } catch (err) {
    console.warn('Admin stats fetch error:', err);
    return defaults;
  }
}
