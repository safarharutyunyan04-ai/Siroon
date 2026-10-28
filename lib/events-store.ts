import { normalizeBrokenItems } from "@/lib/broken-items";
import { id } from "@/lib/format";
import { t } from "@/lib/i18n/messages";
import { normalizeDiscount, normalizePriceRules } from "@/lib/pricing";
import { getSettings } from "@/lib/settings-store";
import {
  deleteEventRemote,
  fetchEvents,
  replaceAllEvents,
  subscribeEventsTable,
  upsertEvent,
} from "@/lib/remote/events";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { waitForSession } from "@/lib/supabase/session";
import type {
  BrokenItem,
  EventDiscount,
  EventLine,
  EventStatus,
  PriceRule,
  RoomId,
  VenueEvent,
} from "@/types/domain";

export { normalizeBrokenItems } from "@/lib/broken-items";

const storageKey = "siroon:events";

let events: VenueEvent[] = [];
const empty: VenueEvent[] = [];
let ready = false;
let remoteBootstrapped = false;
let bootstrapPromise: Promise<void> | null = null;
let applyingRemote = false;
let unsubscribeRemote: (() => void) | null = null;
let reloadTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

export type EventInput = {
  title: string;
  contact: string;
  date: string;
  startTime: string;
  guests: number;
  roomId: RoomId;
  notes: string;
  lines: EventLine[];
  discount?: EventDiscount;
  priceRules?: PriceRule[];
  brokenItems?: BrokenItem[];
  status?: EventStatus;
};

export function subscribeEvents(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getEvents() {
  return ready ? events : empty;
}

export function getServerEvents() {
  return empty;
}

export function getEventsReady() {
  return ready;
}

export function getServerEventsReady() {
  return false;
}

export function ensureEvents() {
  if (ready) return;
  events = read();
  ready = true;
  emit(false);
  void bootstrapRemote();
}

export function createEvent(input: EventInput) {
  hydrate();
  const now = new Date().toISOString();
  const event: VenueEvent = {
    id: id("evt"),
    title:
      input.title.trim() || t(getSettings().locale, "defaultNewEvent"),
    contact: input.contact.trim(),
    date: input.date,
    startTime: input.startTime.trim(),
    guests: Math.max(0, Math.round(input.guests) || 0),
    roomId: input.roomId,
    status: input.status ?? "confirmed",
    notes: input.notes.trim(),
    lines: input.lines,
    discount: normalizeDiscount(input.discount),
    priceRules: normalizePriceRules(input.priceRules),
    brokenItems: normalizeBrokenItems(input.brokenItems),
    createdAt: now,
    updatedAt: now,
  };
  events = [event, ...events].sort(byDate);
  emit(true);
  void upsertEvent(event);
  return event;
}

export function updateEvent(
  eventId: string,
  patch: Partial<EventInput> & { status?: EventStatus },
) {
  hydrate();
  let updated: VenueEvent | undefined;
  events = events
    .map((event) => {
      if (event.id !== eventId) return event;
      updated = {
        ...event,
        ...patch,
        title:
          patch.title !== undefined
            ? patch.title.trim() || event.title
            : event.title,
        contact:
          patch.contact !== undefined ? patch.contact.trim() : event.contact,
        notes: patch.notes !== undefined ? patch.notes.trim() : event.notes,
        startTime:
          patch.startTime !== undefined
            ? patch.startTime.trim()
            : event.startTime,
        guests:
          patch.guests !== undefined
            ? Math.max(0, Math.round(patch.guests) || 0)
            : event.guests,
        discount:
          patch.discount !== undefined
            ? normalizeDiscount(patch.discount)
            : event.discount,
        priceRules:
          patch.priceRules !== undefined
            ? normalizePriceRules(patch.priceRules)
            : event.priceRules,
        brokenItems:
          patch.brokenItems !== undefined
            ? normalizeBrokenItems(patch.brokenItems)
            : event.brokenItems,
        updatedAt: new Date().toISOString(),
      };
      return updated;
    })
    .sort(byDate);
  emit(true);
  if (updated) void upsertEvent(updated);
}

export function deleteEvent(eventId: string) {
  hydrate();
  events = events.filter((event) => event.id !== eventId);
  emit(true);
  void deleteEventRemote(eventId);
}

export function getEvent(eventId: string) {
  return getEvents().find((event) => event.id === eventId);
}

function byDate(a: VenueEvent, b: VenueEvent) {
  const left = `${a.date}T${a.startTime}`;
  const right = `${b.date}T${b.startTime}`;
  return left.localeCompare(right);
}

function hydrate() {
  if (!ready) {
    events = read();
    ready = true;
  }
}

function normalizeEvent(raw: Partial<VenueEvent>): VenueEvent | null {
  if (!raw || typeof raw.id !== "string") return null;
  return {
    id: raw.id,
    title:
      typeof raw.title === "string"
        ? raw.title
        : t(getSettings().locale, "defaultEvent"),
    contact: typeof raw.contact === "string" ? raw.contact : "",
    date: typeof raw.date === "string" ? raw.date : "",
    startTime: typeof raw.startTime === "string" ? raw.startTime : "",
    guests: typeof raw.guests === "number" ? raw.guests : 0,
    roomId:
      raw.roomId === "hall-2" || raw.roomId === "hall-3"
        ? raw.roomId
        : "hall-1",
    status:
      raw.status === "draft" ||
      raw.status === "done" ||
      raw.status === "cancelled"
        ? raw.status
        : "confirmed",
    notes: typeof raw.notes === "string" ? raw.notes : "",
    lines: Array.isArray(raw.lines) ? raw.lines : [],
    discount: normalizeDiscount(raw.discount),
    priceRules: normalizePriceRules(raw.priceRules),
    brokenItems: normalizeBrokenItems(raw.brokenItems),
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof raw.updatedAt === "string"
        ? raw.updatedAt
        : new Date().toISOString(),
  };
}

function read(): VenueEvent[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<VenueEvent>[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => normalizeEvent(entry))
      .filter((entry): entry is VenueEvent => entry !== null)
      .sort(byDate);
  } catch {
    return [];
  }
}

function emit(persist: boolean) {
  if (persist && typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(storageKey, JSON.stringify(events));
    } catch {
      /* ignore */
    }
  }
  for (const listener of listeners) listener();
}

async function bootstrapRemote() {
  if (remoteBootstrapped || !isSupabaseConfigured()) return;
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    const session = await waitForSession();
    if (!session || remoteBootstrapped) return;
    remoteBootstrapped = true;

    const remote = await fetchEvents();
    if (remote) {
      if (remote.length === 0 && events.length > 0) {
        await replaceAllEvents(events);
      } else if (remote.length > 0) {
        applyRemote(remote);
      }
    }

    if (!unsubscribeRemote) {
      unsubscribeRemote = subscribeEventsTable(() => {
        if (applyingRemote) return;
        if (reloadTimer) clearTimeout(reloadTimer);
        reloadTimer = setTimeout(() => {
          reloadTimer = null;
          void reloadFromRemote();
        }, 300);
      });
    }
  })();

  await bootstrapPromise;
}

async function reloadFromRemote() {
  const remote = await fetchEvents();
  if (!remote) return;
  applyRemote(remote);
}

function applyRemote(remoteEvents: VenueEvent[]) {
  applyingRemote = true;
  events = remoteEvents
    .map((entry) => normalizeEvent(entry))
    .filter((entry): entry is VenueEvent => entry !== null)
    .sort(byDate);
  emit(true);
  applyingRemote = false;
}
