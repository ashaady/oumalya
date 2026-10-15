import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jufenigdvmpjwguyjwqw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const SUPABASE_BUCKET = 'oumalya-images';

export function getSupabaseImageUrl(path: string): string {
  if (!path) return '/images/hero-abaya-pink.jpg';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
    return path;
  }
  return `${supabaseUrl}/storage/v1/object/public/${SUPABASE_BUCKET}/${path}`;
}
