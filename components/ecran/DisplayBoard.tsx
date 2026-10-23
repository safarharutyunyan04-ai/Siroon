"use client";

import { useEffect, useRef, useState } from "react";
import { SiroonMark } from "@/components/brand/SiroonMark";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { formatLongDate, formatMoney } from "@/lib/format";
import { getLocaleMeta, t } from "@/lib/i18n/messages";
import { useCurrency, useEvents, useLocale, useMenu, useTodayEvents } from "@/lib/hooks";
import { quoteEvent } from "@/lib/pricing";
import { roomName, rooms } from "@/lib/rooms";
import type { Locale, VenueEvent } from "@/types/domain";

type DisplayBoardProps = {
  onClose?: () => void;
  autoFullscreen?: boolean;
};

export function DisplayBoard({
  onClose,
  autoFullscreen = false,
}: DisplayBoardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { locale } = useLocale();
  const { events, ready, today } = useTodayEvents();
  const { events: allEvents } = useEvents();
  const { items: menu } = useMenu();
  const { currency } = useCurrency();
  const [now, setNow] = useState(() => new Date());
  const [fullscreen, setFullscreen] = useState(false);
  const intl = getLocaleMeta(locale).intl;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function onChange() {
      setFullscreen(Boolean(document.fullscreenElement));
    }
    onChange();
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (!autoFullscreen) return;
    const node = rootRef.current;
    if (!node || document.fullscreenElement) return;
    void node.requestFullscreen().catch(() => undefined);
  }, [autoFullscreen]);

  const clock = new Intl.DateTimeFormat(intl, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);

  const seconds = new Intl.DateTimeFormat(intl, {
    second: "2-digit",
  }).format(now);

  const upcoming = allEvents
    .filter(
      (event) =>
        event.date > today &&
        event.status !== "cancelled" &&
        event.status !== "done",
    )
    .slice(0, 5);

  const sortedToday = [...events].sort((a, b) =>
    (a.startTime || "99:99").localeCompare(b.startTime || "99:99"),
  );

  async function toggleFullscreen() {
    const node = rootRef.current;
    if (!node) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await node.requestFullscreen();
      }
    } catch {
      /* ignore */
    }
  }

  async function handleClose() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      /* ignore */
    }
    onClose?.();
  }

  return (
    <div
      ref={rootRef}
      className="relative flex min-h-dvh flex-col overflow-x-clip bg-[var(--background)] px-4 py-4 sm:px-8 sm:py-6 lg:px-10 lg:py-8"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(196,92,106,0.18),transparent_50%),radial-gradient(ellipse_at_90%_40%,rgba(255,255,255,0.5),transparent_45%)]"
      />

      <header className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <SiroonMark size={36} />
            <p className="font-brand text-xl tracking-[0.22em] text-accent uppercase sm:text-2xl">
              Siroon
            </p>
            <LanguageSwitcher />
          </div>
          <h1 className="font-display mt-2 text-3xl leading-[1.1] font-medium tracking-tight text-balance sm:mt-3 sm:text-4xl lg:text-5xl">
            {formatLongDate(today, locale)}
          </h1>
        </div>
        <div className="sm:text-right">
          <p className="font-display text-5xl leading-none font-medium tabular-nums text-accent sm:text-6xl lg:text-7xl">
            {clock}
            <span className="ml-2 text-2xl text-muted sm:text-3xl">{seconds}</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="rounded-[10px] bg-white/90 px-3 py-2 text-[12px] font-medium text-accent ring-1 ring-border/80 transition-colors hover:bg-accent-soft sm:px-4"
            >
              {fullscreen
                ? t(locale, "exitFullscreen")
                : t(locale, "fullscreen")}
            </button>
            {onClose ? (
              <button
                type="button"
                onClick={handleClose}
                className="rounded-[12px] px-3 py-2 text-[12px] font-medium text-muted transition-colors hover:text-foreground sm:px-4"
              >
                {t(locale, "quit")}
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="relative mt-6 grid min-h-0 flex-1 gap-4 sm:mt-8 sm:gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6">
        <section className="panel flex min-h-0 flex-col overflow-hidden px-4 py-5 sm:px-6 sm:py-6">
          <h2 className="font-display text-2xl font-medium sm:text-3xl">
            {t(locale, "today")}
          </h2>
          {!ready ? (
            <p className="mt-10 text-xl text-muted">…</p>
          ) : sortedToday.length === 0 ? (
            <p className="mt-8 font-display text-2xl text-muted sm:text-3xl">
              {t(locale, "free")}
            </p>
          ) : (
            <ul className="mt-5 flex flex-1 flex-col gap-1 overflow-y-auto sm:mt-6 sm:gap-2">
              {sortedToday.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  total={quoteEvent(event, menu, currency).total}
                  currency={currency}
                  locale={locale}
                  large
                />
              ))}
            </ul>
          )}
        </section>

        <div className="flex min-h-0 flex-col gap-4 sm:gap-5">
          <section className="grid flex-1 gap-3 sm:gap-4">
            {rooms.map((room, index) => {
              const roomEvents = sortedToday.filter(
                (event) => event.roomId === room.id,
              );
              const current = pickCurrent(roomEvents, clock);
              const washes = [
                "from-[#f8ecef] to-white",
                "from-[#f5e8eb] to-white",
                "from-[#f1e4e7] to-white",
              ];
              return (
                <div
                  key={room.id}
                  className={`rounded-[var(--radius)] border border-border/80 bg-linear-to-br ${washes[index]} px-4 py-4 sm:px-5 sm:py-5`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-display text-xl font-medium sm:text-2xl">
                      {t(locale, room.nameKey)}
                    </p>
                    <p className="shrink-0 text-sm text-muted">
                      {room.capacity} {t(locale, "placesShort")}
                    </p>
                  </div>
                  {current ? (
                    <div className="mt-3">
                      <p className="font-display text-lg text-teal tabular-nums sm:text-xl">
                        {current.startTime || "—"}
                      </p>
                      <p className="mt-1 text-base font-medium sm:text-lg">
                        {current.title}
                      </p>
                      {current.guests > 0 ? (
                        <p className="mt-1 text-sm text-muted">
                          {current.guests} {t(locale, "guests")}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-3 font-display text-xl text-muted sm:text-2xl">
                      {t(locale, "free")}
                    </p>
                  )}
                </div>
              );
            })}
          </section>

          {upcoming.length > 0 ? (
            <section className="panel px-4 py-5 sm:px-5 sm:py-5">
              <h2 className="font-display text-xl font-medium sm:text-2xl">
                {t(locale, "next")}
              </h2>
              <ul className="mt-3 flex flex-col gap-2 sm:mt-4 sm:gap-3">
                {upcoming.map((event) => (
                  <li
                    key={event.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border pt-3 first:border-t-0 first:pt-0"
                  >
                    <div>
                      <p className="text-base font-medium sm:text-lg">
                        {event.title}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {[
                          event.date,
                          event.startTime || null,
                          roomName(event.roomId, locale),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function EventRow({
  event,
  total,
  currency,
  locale,
  large,
}: {
  event: VenueEvent;
  total: number;
  currency: Parameters<typeof formatMoney>[1];
  locale: Locale;
  large?: boolean;
}) {
  return (
    <li
      className={`grid gap-2 rounded-[12px] px-3 py-4 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-baseline sm:gap-6 ${
        large ? "sm:py-5" : ""
      }`}
    >
      <p
        className={`font-display font-medium text-teal tabular-nums ${
          large ? "text-3xl sm:text-4xl" : "text-2xl"
        }`}
      >
        {event.startTime || "—"}
      </p>
      <div>
        <p className={`font-medium ${large ? "text-xl sm:text-2xl" : "text-lg"}`}>
          {event.title}
        </p>
        <p className="mt-1 text-sm text-muted sm:text-base">
          {[
            roomName(event.roomId, locale),
            event.guests > 0
              ? `${event.guests} ${t(locale, "guests")}`
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <p
        className={`font-medium tabular-nums ${
          large ? "text-xl sm:text-2xl" : "text-lg"
        }`}
      >
        {formatMoney(total, currency, locale)}
      </p>
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
