'use client';

import React, { createContext, useEffect, useMemo, useState } from 'react';
import { createId, loadFromStorage, saveToStorage } from '../lib/storage';
import { isSupabaseEnabled, supabase } from '../lib/supabaseClient';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { UserProfile } from '../lib/types';

const USER_KEY = 'travebeta-user';

interface UserContextValue {
  user: UserProfile | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const UserContext = createContext<UserContextValue>({
  user: null,
  signInWithGoogle: async () => undefined,
  signOut: async () => undefined,
});

function mapSupabaseUser(user: SupabaseUser): UserProfile {
  const metadata = user.user_metadata as Record<string, unknown> | null;
  const name =
    (metadata?.full_name as string) ||
    (metadata?.name as string) ||
    user.email?.split('@')[0] ||
    '旅人';
  const avatarUrl =
    (metadata?.avatar_url as string) ||
    (metadata?.picture as string) ||
    null;

  return {
    id: user.id,
    email: user.email ?? '',
    name,
    avatarUrl,
  };
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    const loadUser = async () => {
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        const sessionUser = data.session?.user;
        if (sessionUser) {
          const profile = mapSupabaseUser(sessionUser);
          saveToStorage(USER_KEY, profile);
          setUser(profile);
        } else {
          const stored = loadFromStorage<UserProfile | null>(USER_KEY, null);
          if (stored) {
            setUser(stored);
          }
        }

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
          const activeUser = session?.user;
          if (activeUser) {
            const profile = mapSupabaseUser(activeUser);
            saveToStorage(USER_KEY, profile);
            setUser(profile);
          } else {
            saveToStorage(USER_KEY, null);
            setUser(null);
          }
        });

        subscription = listener.subscription;
      } else {
        const stored = loadFromStorage<UserProfile | null>(USER_KEY, null);
        if (stored) {
          setUser(stored);
        }
      }
    };

    loadUser();

    return () => subscription?.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (supabase) {
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/overview`
          : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) {
        console.error('Google OAuth sign-in failed:', error.message);
      }
      return;
    }

    const name = typeof window !== 'undefined' ? window.prompt('Googleアカウント名を入力してください', '旅人')?.trim() || '旅人' : '旅人';
    const profile: UserProfile = {
      id: createId('user'),
      email: `${name.replace(/\s+/g, '').toLowerCase()}@example.com`,
      name,
      avatarUrl: null,
    };
    saveToStorage(USER_KEY, profile);
    setUser(profile);
  };

  const signOut = async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out failed:', error.message);
      }
    }
    saveToStorage(USER_KEY, null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      signInWithGoogle,
      signOut,
    }),
    [user],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
