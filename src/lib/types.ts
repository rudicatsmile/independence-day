export type UserRole = 'participant' | 'admin' | 'media_team';

export interface Profile {
  id: string;
  full_name: string;
  instansi: string;
  phone: string;
  avatar_url?: string;
  role: UserRole;
  group_name?: string;
  total_points: number;
  onboarding_completed: boolean;
  rank?: number;
}

export type MissionType = 'checkin' | 'qr_hunt' | 'quiz' | 'video' | 'referral';

export interface Mission {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: MissionType;
  points_reward: number;
  icon_name: string;
  is_active: boolean;
  order_index: number;
  location_name?: string;
  coordinates?: { lat: number; lng: number };
  radius_meters?: number;
}

export interface UserMission {
  mission_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  points_earned: number;
  completed_at?: string;
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'legendary';
}

export interface UserBadge {
  badge_id: string;
  earned_at: string;
}

export interface GalleryItem {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  instansi?: string;
  type: 'photo' | 'video';
  image_url: string;
  caption: string;
  like_count: number;
  is_liked?: boolean;
  teacher_name?: string;
  status: 'approved' | 'flagged' | 'removed';
  report_count: number;
  created_at: string;
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  is_active: boolean;
  total_votes: number;
  user_voted_option?: string;
}

export interface LiveEventState {
  is_active: boolean;
  salute_count: number;
  event_title: string;
  event_date: string;
  event_year_number: string;
  cosplay_published?: boolean;
  event_type: 'salute' | 'merdeka_challenge';
}

export interface TwibbonFrame {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  accent_color: string;
  frame_image_url?: string;
  is_active: boolean;
  order_index: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer_index: number;
  explanation?: string;
  order_index: number;
  is_active: boolean;
}

export type CosplayCategory = 'usia_dini' | 'usia_menengah' | 'usia_atas';

export interface CosplayParticipant {
  id: string;
  name: string;
  class_level: string;
  character_name: string;
  category: CosplayCategory;
  created_at?: string;
  final_score?: number;
  scores_by_judge?: Record<string, { scores: Record<string, number>; final_score: number }>;
}

export interface CosplayCriterion {
  key: string;
  label: string;
  indicator: string;
  weight: number; // e.g. 0.30 for 30%
}

export interface CosplayScoreRecord {
  id?: string;
  participant_id: string;
  judge_name: string;
  scores: Record<string, number>;
  final_score: number;
}
