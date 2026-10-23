"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { formatMoney, todayIso } from "@/lib/format";
import { getLocaleMeta, t } from "@/lib/i18n/messages";
import { useCurrency, useEvents, useLocale, useMenu } from "@/lib/hooks";
import { quoteEvent } from "@/lib/pricing";
import { roomName } from "@/lib/rooms";
import type { Locale, VenueEvent } from "@/types/domain";

const roomDot: Record<string, string> = {
  "hall-1": "bg-teal",
  "hall-2": "bg-accent",
  "hall-3": "bg-sky",
};

function subscribeNoop() {
  return () => undefined;
}

function useClientToday() {
  return useSyncExternalStore(subscribeNoop, todayIso, () => "1970-01-01");
}

export function PlanningExperience() {
  const { locale } = useLocale();
  const { events, ready } = useEvents();
  const { items: menu } = useMenu();
  const { currency } = useCurrency();
  const today = useClientToday();
  const datesReady = today !== "1970-01-01";
  const [cursorOverride, setCursorOverride] = useState<string | null>(null);
  const [selectedOverride, setSelectedOverride] = useState<string | null>(null);
  const cursor = cursorOverride ?? monthStart(today);
  const selected = selectedOverride ?? today;

  const active = useMemo(
    () => events.filter((event) => event.status !== "cancelled"),
    [events],
  );

  const byDate = useMemo(() => {
    const map = new Map<string, VenueEvent[]>();
    for (const event of active) {
      const list = map.get(event.date) ?? [];
      list.push(event);
      map.set(event.date, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) =>
        (a.startTime || "99:99").localeCompare(b.startTime || "99:99"),
      );
    }
    return map;
  }, [active]);

  const cells = useMemo(() => buildMonthCells(cursor), [cursor]);
  const weekCount = cells.length / 7;
  const weekdays = useMemo(() => weekdayLabels(locale), [locale]);
  const monthTitle = useMemo(
    () =>
      new Intl.DateTimeFormat(getLocaleMeta(locale).intl, {
        month: "long",
        year: "numeric",
      }).format(new Date(`${cursor}T12:00:00`)),
    [cursor, locale],
  );

  const dayEvents = byDate.get(selected) ?? [];

  return (
    <div className="flex h-[calc(100dvh-4.5rem)] flex-col gap-2 sm:h-[calc(100dvh-5rem)] sm:gap-3">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
          {t(locale, "planning")}
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={t(locale, "prevMonth")}
            onClick={() =>
              setCursorOverride((current) =>
                shiftMonth(current ?? monthStart(today), -1),
              )
            }
            className="flex h-8 w-8 items-center justify-center rounded-[10px] text-lg text-teal hover:bg-teal-soft"
          >
            ‹
          </button>
          <h2
            className="min-w-[9rem] text-center font-display text-base font-medium capitalize sm:min-w-[11rem] sm:text-lg"
            suppressHydrationWarning
          >
            {datesReady ? monthTitle : "—"}
          </h2>
          <button
            type="button"
            aria-label={t(locale, "nextMonth")}
            onClick={() =>
              setCursorOverride((current) =>
                shiftMonth(current ?? monthStart(today), 1),
              )
            }
            className="flex h-8 w-8 items-center justify-center rounded-[10px] text-lg text-teal hover:bg-teal-soft"
          >
            ›
          </button>
          <Button href="/events/new" className="ml-1">
            {t(locale, "newEvent")}
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 max-lg:grid-rows-[minmax(0,1fr)_min(28%,11rem)] lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="panel flex min-h-0 flex-col overflow-hidden">
          <div className="grid shrink-0 grid-cols-7 border-b border-border/60">
            {weekdays.map((day, index) => (
              <div
                key={index}
                className="px-0.5 py-1.5 text-center text-[10px] font-medium text-muted sm:text-[11px]"
                suppressHydrationWarning
              >
                {datesReady ? day : "·"}
              </div>
            ))}
          </div>

          {!ready || !datesReady ? (
            <p className="px-4 py-6 text-sm text-muted">{t(locale, "loading")}</p>
          ) : (
            <div
              className="grid min-h-0 flex-1 grid-cols-7"
              style={{
                gridTemplateRows: `repeat(${weekCount}, minmax(0, 1fr))`,
              }}
            >
              {cells.map((iso, index) => {
                if (!iso) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="border-t border-r border-border/40 bg-surface/25"
                    />
                  );
                }
                const dayList = byDate.get(iso) ?? [];
                const isToday = iso === today;
                const isSelected = iso === selected;
                const inMonth = iso.startsWith(cursor.slice(0, 7));

                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setSelectedOverride(iso)}
                    className={`flex min-h-0 flex-col gap-0.5 overflow-hidden border-t border-r border-border/40 px-1 py-1 text-left transition-colors ${
                      isSelected
                        ? "bg-teal-soft/80"
                        : "hover:bg-surface-raised/80"
                    } ${inMonth ? "" : "opacity-35"}`}
                  >
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] tabular-nums sm:h-6 sm:w-6 sm:text-[12px] ${
                        isToday
                          ? "bg-accent font-medium text-ink"
                          : "text-foreground"
                      }`}
                    >
                      {Number(iso.slice(8))}
                    </span>
                    <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                      {dayList.slice(0, 2).map((event) => (
                        <span
                          key={event.id}
                          className="hidden truncate rounded-[4px] bg-teal-soft px-1 text-[9px] leading-4 text-teal sm:block sm:text-[10px]"
                          title={event.title}
                        >
                          {event.startTime || event.title}
                        </span>
                      ))}
                      <div className="mt-auto flex flex-wrap gap-0.5 sm:hidden">
                        {dayList.slice(0, 4).map((event) => (
                          <span
                            key={event.id}
                            className={`h-1.5 w-1.5 rounded-full ${
                              roomDot[event.roomId] ?? "bg-teal"
                            }`}
                          />
                        ))}
                      </div>
                      {dayList.length > 2 ? (
                        <span className="hidden text-[9px] text-muted sm:block">
                          +{dayList.length - 2}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <aside className="panel flex min-h-0 flex-col overflow-hidden px-3 py-3 sm:px-4">
          <div className="flex shrink-0 items-start justify-between gap-2">
            <h2
              className="font-display text-base font-medium leading-snug sm:text-lg"
              suppressHydrationWarning
            >
              {datesReady ? formatDayHeading(selected, locale) : "—"}
            </h2>
          </div>

          <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
            {dayEvents.length === 0 ? (
              <p className="text-sm text-muted">{t(locale, "noEventsDay")}</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {dayEvents.map((event) => {
                  const quote = quoteEvent(event, menu, currency);
                  return (
                    <li key={event.id}>
                      <Link
                        href={`/events/${event.id}`}
                        className="list-row block rounded-[10px] px-2 py-2"
                      >
                        <p className="text-sm font-medium">
                          {event.startTime ? (
                            <span className="mr-1.5 text-teal tabular-nums">
                              {event.startTime}
                            </span>
                          ) : null}
                          {event.title}
                        </p>
                        <p className="mt-0.5 text-[12px] text-muted">
                          {[
                            roomName(event.roomId, locale),
                            formatMoney(quote.total, currency, locale),
                          ].join(" · ")}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function monthStart(isoDate: string) {
  return `${isoDate.slice(0, 7)}-01`;
}

function shiftMonth(monthIso: string, delta: number) {
  const date = new Date(`${monthIso}T12:00:00`);
  date.setMonth(date.getMonth() + delta);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

function buildMonthCells(monthIso: string) {
  const first = new Date(`${monthIso}T12:00:00`);
  const year = first.getFullYear();
  const month = first.getMonth();
  const startWeekday = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];

  for (let i = 0; i < startWeekday; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    );
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

function weekdayLabels(locale: Locale) {
  const intl = getLocaleMeta(locale).intl;
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.UTC(2024, 0, 1 + index));
    return new Intl.DateTimeFormat(intl, { weekday: "short" }).format(date);
  });
}

function formatDayHeading(isoDate: string, locale: Locale) {
  const date = new Date(`${isoDate}T12:00:00`);
  const intl = getLocaleMeta(locale).intl;
  const weekday = new Intl.DateTimeFormat(intl, { weekday: "long" }).format(
    date,
  );
  const day = new Intl.DateTimeFormat(intl, { day: "numeric" }).format(date);
  const month = new Intl.DateTimeFormat(intl, { month: "long" }).format(date);
  return `${weekday} · ${day} ${month}`;
}
