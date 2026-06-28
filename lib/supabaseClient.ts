import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iakiidblfhkftzauetva.supabase.co';
const supabaseAnonKey = process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlha2lpZGJsZmhrZnR6YXVldHZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NDM3OTUsImV4cCI6MjA5ODIxOTc5NX0.2PFU_bcTEl_5lwoD00fato1Ii9-a93Orc9pP5rsero0;

export const isSupabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseEnabled
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        storage: typeof window === 'undefined' ? undefined : window.localStorage,
      },
    })
  : null;
