import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pirmwzflxvlxvjqlhbhw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_TI9S6FVP-Vq_exOBAlFgyw_C60fz5mC';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const SUPABASE_CONFIG = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  bucketName: 'documents',
};
