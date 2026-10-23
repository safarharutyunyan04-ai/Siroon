import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

/**
 * Create a fresh realtime channel. Removes any existing channel with the same
 * name first (React Strict Mode / HMR can otherwise call .on() after subscribe).
 */
export function createRealtimeChannel(
  supabase: SupabaseClient,
  name: string,
): RealtimeChannel {
  const topic = `realtime:${name}`;
  for (const existing of supabase.getChannels()) {
    if (existing.topic === topic || existing.topic.endsWith(`:${name}`)) {
      void supabase.removeChannel(existing);
    }
  }
  return supabase.channel(name);
}
