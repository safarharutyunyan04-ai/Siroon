"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatLongDate, formatMoney } from "@/lib/format";
import { getLocaleMeta, t } from "@/lib/i18n/messages";
import {
  useCurrency,
  useEvents,
  useLocale,
  useMenu,
  useTodayEvents,
} from "@/lib/hooks";
import { quoteEvent } from "@/lib/pricing";
import { roomName, rooms } from "@/lib/rooms";
import type { Locale, RoomId, VenueEvent } from "@/types/domain";

type DisplayBoardProps = {
  onClose?: () => void;
};

export function DisplayBoard({ onClose }: DisplayBoardProps) {
  const { locale } = useLocale();
  const { events, ready, today } = useTodayEvents();
  const { events: allEvents } = useEvents();
  const { items: menu } = useMenu();
  const { currency } = useCurrency();
  const [now, setNow] = useState(() => new Date());
  const intl = getLocaleMeta(locale).intl;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const clock = new Intl.DateTimeFormat(intl, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);

  const sortedToday = [...events].sort((a, b) =>
    (a.startTime || "99:99").localeCompare(b.startTime || "99:99"),
  );

  const upcoming = allEvents
    .filter(
      (event) =>
        event.date > today &&
        event.status !== "cancelled" &&
        event.status !== "done",
    )
    .slice(0, 2);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
      {/* En-tête : date + heure */}
      <header className="relative flex shrink-0 items-end justify-between gap-4 border-b border-border/70 pb-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-[0.2em] text-accent uppercase">
            {t(locale, "today")}
          </p>
          <h1 className="font-display mt-1 truncate text-2xl font-medium tracking-tight sm:text-3xl">
            {formatLongDate(today, locale)}
          </h1>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <p className="font-display text-4xl leading-none font-medium tabular-nums text-accent sm:text-5xl">
            {clock}
          </p>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="text-[12px] font-medium text-muted hover:text-foreground"
            >
              {t(locale, "back")}
            </button>
          ) : null}
        </div>
      </header>

      {/* Les 3 salles — ancre visuelle */}
      <section className="relative mt-5 grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {rooms.map((room) => {
          const roomEvents = sortedToday.filter((e) => e.roomId === room.id);
          const current = pickCurrent(roomEvents, clock);
          return (
            <RoomCard
              key={room.id}
              roomId={room.id}
              name={t(locale, room.nameKey)}
              capacity={room.capacity}
              placesLabel={t(locale, "placesShort")}
              freeLabel={t(locale, "free")}
              guestsLabel={t(locale, "guests")}
              current={current}
            />
          );
        })}
      </section>

      {/* Planning du jour */}
      <section className="relative mt-5 flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-baseline justify-between gap-3">
          <h2 className="font-display text-lg font-medium sm:text-xl">
            {t(locale, "todayEvents")}
          </h2>
          {upcoming.length > 0 ? (
            <p className="truncate text-[12px] text-muted">
              {t(locale, "next")}
              {": "}
              {upcoming.map((e) => e.title).join(" · ")}
            </p>
          ) : null}
        </div>

        {!ready ? (
          <p className="mt-6 text-sm text-muted">{t(locale, "loading")}</p>
        ) : sortedToday.length === 0 ? (
          <div className="mt-6 flex flex-1 flex-col items-start justify-center">
            <p className="font-display text-2xl text-muted">{t(locale, "free")}</p>
            <Link
              href="/events/new"
              className="mt-3 text-[13px] font-medium text-accent hover:text-accent-deep"
            >
              {t(locale, "createEvent")}
            </Link>
          </div>
        ) : (
          <ul className="mt-3 flex min-h-0 flex-1 flex-col justify-start divide-y divide-border/60 overflow-hidden">
            {sortedToday.slice(0, 6).map((event) => (
              <EventRow
                key={event.id}
                event={event}
                total={quoteEvent(event, menu, currency).total}
                currency={currency}
                locale={locale}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function RoomCard({
  roomId,
  name,
  capacity,
  placesLabel,
  freeLabel,
  guestsLabel,
  current,
}: {
  roomId: RoomId;
  name: string;
  capacity: number;
  placesLabel: string;
  freeLabel: string;
  guestsLabel: string;
  current?: VenueEvent;
}) {
  const busy = Boolean(current);
  // Fonds solides (pas de blanc sur rose clair)
  const fill =
    roomId === "hall-1"
      ? "border-[#8f3a48] bg-[#a34454]"
      : roomId === "hall-2"
        ? "border-[#c45c6a]/45 bg-[#f3d6db]"
        : "border-[#c45c6a]/30 bg-[#f8ecef]";
  const onDark = roomId === "hall-1";
  const title = onDark ? "text-white" : "text-[#5c2430]";
  const soft = onDark ? "text-white/75" : "text-[#8a4a56]";
  const time = onDark ? "text-white" : "text-[#a34454]";

  return (
    <article
      className={`relative overflow-hidden rounded-[12px] border px-4 py-4 sm:px-5 sm:py-5 ${
        busy ? fill : "border-border/70 bg-surface-raised/90"
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3
          className={`font-display text-lg font-medium sm:text-xl ${
            busy ? title : "text-foreground"
          }`}
        >
          {name}
        </h3>
        <span
          className={`text-[11px] tabular-nums ${busy ? soft : "text-muted"}`}
        >
          {capacity} {placesLabel}
        </span>
      </div>

      {current ? (
        <div className="mt-5">
          <p
            className={`font-display text-2xl tabular-nums sm:text-3xl ${time}`}
          >
            {current.startTime || "—"}
          </p>
          <p
            className={`mt-1 truncate text-[15px] font-medium sm:text-base ${title}`}
          >
            {current.title}
          </p>
          {current.guests > 0 ? (
            <p className={`mt-1 text-[12px] ${soft}`}>
              {current.guests} {guestsLabel}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-8 font-display text-xl text-muted sm:text-2xl">
          {freeLabel}
        </p>
      )}
    </article>
  );
}

function EventRow({
  event,
  total,
  currency,
  locale,
}: {
  event: VenueEvent;
  total: number;
  currency: Parameters<typeof formatMoney>[1];
  locale: Locale;
}) {
  return (
    <li>
      <Link
        href={`/events/${event.id}`}
        className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-baseline gap-3 py-3 transition-colors hover:bg-white/40 sm:gap-5 sm:py-3.5"
      >
        <span className="font-display text-xl font-medium text-accent tabular-nums sm:text-2xl">
          {event.startTime || "—"}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-medium sm:text-[15px]">
            {event.title}
          </span>
          <span className="mt-0.5 block truncate text-[12px] text-muted">
            {[
              roomName(event.roomId, locale),
              event.guests > 0
                ? `${event.guests} ${t(locale, "guests")}`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </span>
        <span className="shrink-0 text-[13px] tabular-nums text-foreground/80 sm:text-[14px]">
          {formatMoney(total, currency, locale)}
        </span>
      </Link>
    </li>
  );
}

function pickCurrent(events: VenueEvent[], clock: string) {
  if (events.length === 0) return undefined;
  const withTime = events.filter((event) => event.startTime);
  if (withTime.length === 0) return events[0];
  const started = withTime.filter((event) => event.startTime <= clock);
  return started[started.length - 1] ?? withTime[0];
}
