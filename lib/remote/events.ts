import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { createRealtimeChannel } from "@/lib/supabase/realtime";
import { normalizeBrokenItems } from "@/lib/broken-items";
import { normalizeDiscount, normalizePriceRules } from "@/lib/pricing";
import type { VenueEvent } from "@/types/domain";

type EventRow = {
  id: string;
  title: string;
  contact: string;
  date: string;
  start_time: string;
  guests: number;
  room_id: string;
  status: string;
  notes: string;
  lines: unknown;
  discount: unknown;
  price_rules: unknown;
  broken_items?: unknown;
  created_at: string;
  updated_at: string;
};

export async function fetchEvents(): Promise<VenueEvent[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.from("venue_events").select("*");
  if (error) {
    console.warn("[events] fetch", error.message);
    return null;
  }
  return ((data ?? []) as EventRow[])
    .map(rowToEvent)
    .filter((e): e is VenueEvent => e !== null);
}

export async function upsertEvent(event: VenueEvent) {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return;
  const { error } = await supabase.from("venue_events").upsert({
    id: event.id,
    title: event.title,
    contact: event.contact,
    date: event.date,
    start_time: event.startTime,
    guests: event.guests,
    room_id: event.roomId,
    status: event.status,
    notes: event.notes,
    lines: event.lines,
    discount: event.discount,
    price_rules: event.priceRules,
    broken_items: event.brokenItems ?? [],
    created_at: event.createdAt,
    updated_at: event.updatedAt,
  });
  if (error) console.warn("[events] upsert", error.message);
}

export async function deleteEventRemote(eventId: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase
    .from("venue_events")
    .delete()
    .eq("id", eventId);
  if (error) console.warn("[events] delete", error.message);
}

export async function replaceAllEvents(events: VenueEvent[]) {
  for (const event of events) {
    await upsertEvent(event);
  }
}

export function subscribeEventsTable(onChange: () => void) {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = createRealtimeChannel(supabase, "venue_events_table")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "venue_events" },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

function rowToEvent(row: EventRow): VenueEvent | null {
  if (!row?.id) return null;
  return {
    id: row.id,
    title: row.title,
    contact: row.contact ?? "",
    date: typeof row.date === "string" ? row.date.slice(0, 10) : "",
    startTime: row.start_time ?? "",
    guests: Number(row.guests) || 0,
    roomId:
      row.room_id === "hall-2" || row.room_id === "hall-3"
        ? row.room_id
        : "hall-1",
    status:
      row.status === "draft" ||
      row.status === "done" ||
      row.status === "cancelled"
        ? row.status
        : "confirmed",
    notes: row.notes ?? "",
    lines: Array.isArray(row.lines) ? row.lines : [],
    discount: normalizeDiscount(
      row.discount as VenueEvent["discount"] | undefined,
    ),
    priceRules: normalizePriceRules(
      row.price_rules as VenueEvent["priceRules"] | undefined,
    ),
    brokenItems: normalizeBrokenItems(
      row.broken_items as VenueEvent["brokenItems"] | undefined,
    ),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
