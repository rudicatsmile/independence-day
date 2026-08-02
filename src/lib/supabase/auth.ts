import { createClient, isSupabaseConfigured } from './client';
import { Profile } from '@/lib/types';

const supabase = createClient();

/**
 * Login with Email and Password
 */
export async function loginWithEmail(email: string, password: string): Promise<{ user: Profile | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return {
      user: {
        id: 'demo-user-01',
        full_name: 'Bagas Kencana (Demo)',
        instansi: 'Sekretariat Negara / Garuda Muda',
        phone: '081234567890',
        role: email.includes('admin') ? 'admin' : 'participant',
        total_points: 350,
        onboarding_completed: true,
      },
      error: null,
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { user: null, error: error.message };
  }

  if (data.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profile) {
      return { user: profile as Profile, error: null };
    } else {
      // Create profile fallback if missing
      const newProf: Profile = {
        id: data.user.id,
        full_name: data.user.user_metadata?.full_name || email.split('@')[0],
        instansi: data.user.user_metadata?.instansi || 'Kontingen HUT RI 81',
        phone: '',
        role: data.user.user_metadata?.role || 'participant',
        total_points: 100,
        onboarding_completed: true,
      };

      await supabase.from('profiles').upsert(newProf);
      return { user: newProf, error: null };
    }
  }

  return { user: null, error: 'User tidak ditemukan' };
}

/**
 * Register new user with Email, Password, Full Name, and Instansi
 */
export async function registerWithEmail(
  email: string,
  password: string,
  fullName: string,
  instansi: string
): Promise<{ user: Profile | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return {
      user: {
        id: `user-${Date.now()}`,
        full_name: fullName,
        instansi: instansi,
        phone: '',
        role: 'participant',
        total_points: 100,
        onboarding_completed: true,
      },
      error: null,
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        instansi: instansi,
        role: 'participant',
      },
    },
  });

  if (error) {
    return { user: null, error: error.message };
  }

  if (data.user) {
    const newProfile: Profile = {
      id: data.user.id,
      full_name: fullName,
      instansi: instansi,
      phone: '',
      role: 'participant',
      total_points: 100,
      onboarding_completed: true,
    };

    // Explicitly insert into public.profiles to guarantee 1-to-1 correlation
    const { error: profileErr } = await supabase.from('profiles').upsert(newProfile, { onConflict: 'id' });
    if (profileErr) {
      console.warn('⚠️ Warning inserting profile on register:', profileErr.message);
    }

    return { user: newProfile, error: null };
  }

  return { user: null, error: 'Pendaftaran gagal' };
}

/**
 * Logout Current User
 */
export async function logoutUser(): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { error: null };
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: error.message };
  }
  return { error: null };
}
