import { createClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseKey: string;
}

const getSupabaseConfig = (): SupabaseConfig | null => {
  // 1. Check environment variables
  const envConfig = {
    supabaseUrl: (import.meta.env.VITE_SUPABASE_URL || '') as string,
    supabaseKey: (import.meta.env.VITE_SUPABASE_ANON_KEY || '') as string,
  };

  if (envConfig.supabaseUrl && envConfig.supabaseKey) {
    return envConfig;
  }

  // 2. Check localStorage custom config
  try {
    const localConfigStr = localStorage.getItem('qr-studio-supabase-config');
    if (localConfigStr) {
      const parsed = JSON.parse(localConfigStr);
      if (parsed && parsed.supabaseUrl && parsed.supabaseKey) {
        return parsed as SupabaseConfig;
      }
    }
  } catch (e) {
    console.error('Error parsing local Supabase config:', e);
  }

  return null;
};

const config = getSupabaseConfig();

export const isSupabaseConfigured = (): boolean => {
  return !!config;
};

let supabaseInstance: ReturnType<typeof createClient> | null = null;

if (config) {
  try {
    supabaseInstance = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
  }
}

export const supabase = supabaseInstance;
