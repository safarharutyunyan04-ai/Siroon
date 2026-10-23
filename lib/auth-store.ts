import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type AuthState = {
  ready: boolean;
  session: Session | null;
  user: User | null;
};

const empty: AuthState = { ready: false, session: null, user: null };
let state: AuthState = empty;
let bootstrapped = false;
const listeners = new Set<() => void>();

export function subscribeAuth(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAuthState() {
  return state;
}

export function getServerAuthState(): AuthState {
  return empty;
}

export function ensureAuth() {
  if (bootstrapped) return;
  bootstrapped = true;

  if (!isSupabaseConfigured()) {
    state = { ready: true, session: null, user: null };
    emit();
    return;
  }

  const supabase = getSupabase();
  if (!supabase) {
    state = { ready: true, session: null, user: null };
    emit();
    return;
  }

  void supabase.auth.getSession().then(({ data }) => {
    state = {
      ready: true,
      session: data.session,
      user: data.session?.user ?? null,
    };
    emit();
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    state = {
      ready: true,
      session,
      user: session?.user ?? null,
    };
    emit();
  });
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase non configuré");
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
}

export async function signOut() {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}

function emit() {
  for (const listener of listeners) listener();
}
