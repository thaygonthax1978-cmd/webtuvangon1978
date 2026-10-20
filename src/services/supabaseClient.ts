import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://ceuwkkfwklxedzndsisu.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_5nblBT8S82bUTXPp-wQwig_yRIDJXYF';

function getInitialConfig(): { url: string; key: string } {
  try {
    const savedUrl = localStorage.getItem('thaygon_supabase_url');
    const savedKey = localStorage.getItem('thaygon_supabase_key');
    // If the saved URL is the dead/invalid pirmwzflxvlxvjqlhbhw project, clean it up!
    if (savedUrl && savedUrl.includes('pirmwzflxvlxvjqlhbhw')) {
      localStorage.removeItem('thaygon_supabase_url');
      localStorage.removeItem('thaygon_supabase_key');
    } else if (savedUrl && savedKey) {
      return { url: savedUrl, key: savedKey };
    }
  } catch {
    // Ignore storage errors
  }

  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const url = (envUrl && !envUrl.includes('pirmwzflxvlxvjqlhbhw')) ? envUrl : DEFAULT_SUPABASE_URL;
  const key = envKey || DEFAULT_SUPABASE_ANON_KEY;

  return { url, key };
}

const initial = getInitialConfig();

export let supabase: SupabaseClient = createClient(initial.url, initial.key);

export const SUPABASE_CONFIG = {
  url: initial.url,
  anonKey: initial.key,
  bucketName: 'documents',
};

export function updateClientSupabaseConfig(url: string, key: string) {
  try {
    localStorage.setItem('thaygon_supabase_url', url);
    localStorage.setItem('thaygon_supabase_key', key);
  } catch {
    // Ignore storage errors
  }
  SUPABASE_CONFIG.url = url;
  SUPABASE_CONFIG.anonKey = key;
  supabase = createClient(url, key);
}

