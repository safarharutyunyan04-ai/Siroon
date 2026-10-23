"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  ensureAuth,
  getAuthState,
  getServerAuthState,
  subscribeAuth,
} from "@/lib/auth-store";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export function useAuth() {
  const auth = useSyncExternalStore(
    subscribeAuth,
    getAuthState,
    getServerAuthState,
  );

  useEffect(() => {
    ensureAuth();
  }, []);

  return {
    ...auth,
    configured: isSupabaseConfigured(),
    /** Ops requires login only when Supabase is configured */
    requiresAuth: isSupabaseConfigured(),
  };
}
