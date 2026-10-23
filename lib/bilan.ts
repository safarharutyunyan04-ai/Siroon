import { quoteEvent } from "@/lib/pricing";
import { roomName, rooms } from "@/lib/rooms";
import type { Currency, Locale, MenuItem, VenueEvent } from "@/types/domain";
import { t } from "@/lib/i18n/messages";

export type BilanEvent = {
  event: VenueEvent;
  total: number;
};

export function billedEvents(events: VenueEvent[]) {
  return events.filter(
    (event) => event.status === "confirmed" || event.status === "done",
  );
}

export function withTotals(
  events: VenueEvent[],
  menu: MenuItem[],
  currency: Currency,
): BilanEvent[] {
  return events.map((event) => ({
    event,
    total: quoteEvent(event, menu, currency).total,
  }));
}

export function sumTotals(rows: BilanEvent[]) {
  return rows.reduce((sum, row) => sum + row.total, 0);
}

export function sumGuests(rows: BilanEvent[]) {
  return rows.reduce((sum, row) => sum + (row.event.guests || 0), 0);
}

export function totalsByRoom(rows: BilanEvent[]) {
  return rooms.map((room) => {
    const roomRows = rows.filter((row) => row.event.roomId === room.id);
    return {
      room,
      count: roomRows.length,
      total: sumTotals(roomRows),
      guests: sumGuests(roomRows),
    };
  });
}

export function totalsByMonth(rows: BilanEvent[]) {
  const map = new Map<string, BilanEvent[]>();
  for (const row of rows) {
    const key = row.event.date.slice(0, 7);
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([month, monthRows]) => ({
      month,
      count: monthRows.length,
      total: sumTotals(monthRows),
      guests: sumGuests(monthRows),
    }));
}

export function formatMonthLabel(month: string, locale: Locale = "hy") {
  const date = new Date(`${month}-01T12:00:00`);
  const intl = locale === "hy" ? "hy-AM" : "fr-FR";
  return new Intl.DateTimeFormat(intl, {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function statusLabel(
  status: VenueEvent["status"],
  locale: Locale = "hy",
) {
  if (status === "confirmed") return t(locale, "statusConfirmed");
  if (status === "done") return t(locale, "statusDone");
  if (status === "draft") return t(locale, "statusDraft");
  return t(locale, "statusCancelled");
}

export function roomLabel(roomId: VenueEvent["roomId"], locale: Locale = "hy") {
  return roomName(roomId, locale);
}
