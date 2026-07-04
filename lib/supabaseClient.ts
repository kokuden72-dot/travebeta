import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iakiidblfhkftzauetva.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlha2lpZGJsZmhrZnR6YXVldHZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NDM3OTUsImV4cCI6MjA5ODIxOTc5NX0.2PFU_bcTEl_5lwoD00fato1Ii9-a93Orc9pP5rsero0';
const defaultAppUrl = 'https://trav-agent.vercel.app';

export function getOAuthRedirectUrl(pathname = '/overview') {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const browserOrigin = typeof window !== 'undefined' ? window.location.origin : undefined;
  const baseUrl = (configuredUrl || browserOrigin || defaultAppUrl).replace(/\/$/, '');
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;

  return `${baseUrl}${normalizedPath}`;
}

export const isSupabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseEnabled
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        storage: typeof window === 'undefined' ? undefined : window.localStorage,
      },
    })
  : null;
