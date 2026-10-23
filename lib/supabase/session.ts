import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";

export async function waitForSession(
  timeoutMs = 4000,
): Promise<Session | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const first = await supabase.auth.getSession();
  if (first.data.session) return first.data.session;

  return new Promise((resolve) => {
    let settled = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session || settled) return;
      settled = true;
      clearTimeout(timer);
      subscription.unsubscribe();
      resolve(session);
    });
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      subscription.unsubscribe();
      resolve(null);
    }, timeoutMs);
  });
}
