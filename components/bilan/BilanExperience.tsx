"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BackupPanel } from "@/components/backup/BackupPanel";
import {
  billedEvents,
  formatMonthLabel,
  roomLabel,
  statusLabel,
  sumGuests,
  sumTotals,
  totalsByMonth,
  totalsByRoom,
  withTotals,
} from "@/lib/bilan";
import { formatMoney, formatShortDate, todayIso } from "@/lib/format";
import { t } from "@/lib/i18n/messages";
import { useCurrency, useEvents, useLocale, useMenu } from "@/lib/hooks";

type Scope = "all" | "month" | "past" | "upcoming";

export function BilanExperience() {
  const { locale } = useLocale();
  const { events, ready } = useEvents();
  const { items: menu } = useMenu();
  const { currency } = useCurrency();
  const [scope, setScope] = useState<Scope>("all");
  const today = todayIso();
  const thisMonth = today.slice(0, 7);

  const rows = useMemo(() => {
    const billed = withTotals(billedEvents(events), menu, currency);
    if (scope === "month") {
      return billed.filter((row) => row.event.date.startsWith(thisMonth));
    }
    if (scope === "past") {
      return billed.filter(
        (row) => row.event.date < today || row.event.status === "done",
      );
    }
    if (scope === "upcoming") {
      return billed.filter(
        (row) => row.event.date >= today && row.event.status !== "done",
      );
    }
    return billed;
  }, [currency, events, menu, scope, thisMonth, today]);

  const history = useMemo(
    () =>
      withTotals(
        events.filter((event) => event.status !== "cancelled"),
        menu,
        currency,
      ).sort((a, b) => {
        const left = `${a.event.date}T${a.event.startTime || "00:00"}`;
        const right = `${b.event.date}T${b.event.startTime || "00:00"}`;
        return right.localeCompare(left);
      }),
    [currency, events, menu],
  );

  const total = sumTotals(rows);
  const guests = sumGuests(rows);
  const average = rows.length > 0 ? Math.round(total / rows.length) : 0;
  const byRoom = totalsByRoom(rows);
  const byMonth = totalsByMonth(
    withTotals(billedEvents(events), menu, currency),
  );

  const scopes = [
    ["all", "all"],
    ["month", "thisMonth"],
    ["upcoming", "upcoming"],
    ["past", "past"],
  ] as const;

  return (
    <div className="animate-rise flex flex-col gap-8 sm:gap-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
          {t(locale, "bilan")}
        </h1>
        <div className="flex max-w-full gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {scopes.map(([value, key]) => (
            <button
              key={value}
              type="button"
              onClick={() => setScope(value)}
              className={`shrink-0 rounded-[10px] px-3 py-2 text-[12px] font-medium transition-all duration-[var(--duration)] ${
                scope === value
                  ? "bg-accent text-ink"
                  : "text-muted hover:bg-teal-soft hover:text-foreground"
              }`}
            >
              {t(locale, key)}
            </button>
          ))}
        </div>
      </div>

      {!ready ? (
        <p className="text-sm text-muted">{t(locale, "loading")}</p>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label={t(locale, "revenue")}
              value={formatMoney(total, currency, locale)}
              tone="accent"
            />
            <Stat
              label={t(locale, "events")}
              value={String(rows.length)}
              tone="teal"
            />
            <Stat
              label={t(locale, "average")}
              value={
                rows.length ? formatMoney(average, currency, locale) : "—"
              }
              tone="sky"
            />
            <Stat
              label={t(locale, "guests")}
              value={guests > 0 ? String(guests) : "—"}
              tone="teal"
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="panel px-5 py-6 sm:px-6">
              <h2 className="font-display text-2xl font-medium">
                {t(locale, "byRoom")}
              </h2>
              <ul className="mt-6 flex flex-col">
                {byRoom.map(
                  ({ room, count, total: roomTotal, guests: roomGuests }) => (
                    <li
                      key={room.id}
                      className="flex items-baseline justify-between gap-4 border-t border-border py-4"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {t(locale, room.nameKey)}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          {count}{" "}
                          {count === 1
                            ? t(locale, "eventOne")
                            : t(locale, "eventMany")}
                          {roomGuests > 0
                            ? ` · ${roomGuests} ${t(locale, "guests")}`
                            : ""}
                        </p>
                      </div>
                      <p className="text-sm font-medium tabular-nums">
                        {formatMoney(roomTotal, currency, locale)}
                      </p>
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div className="panel px-5 py-6 sm:px-6">
              <h2 className="font-display text-2xl font-medium">
                {t(locale, "byMonth")}
              </h2>
              {byMonth.length === 0 ? (
                <p className="mt-6 text-sm text-muted">—</p>
              ) : (
                <ul className="mt-6 flex flex-col">
                  {byMonth.map((entry) => (
                    <li
                      key={entry.month}
                      className="flex items-baseline justify-between gap-4 border-t border-border py-4"
                    >
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {formatMonthLabel(entry.month, locale)}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          {entry.count}{" "}
                          {entry.count === 1
                            ? t(locale, "eventOne")
                            : t(locale, "eventMany")}
                          {entry.guests > 0
                            ? ` · ${entry.guests} ${t(locale, "guests")}`
                            : ""}
                        </p>
                      </div>
                      <p className="text-sm font-medium tabular-nums">
                        {formatMoney(entry.total, currency, locale)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-medium">
              {t(locale, "history")}
            </h2>
            {history.length === 0 ? (
              <p className="mt-6 text-sm text-muted">—</p>
            ) : (
              <ul className="panel mt-6 flex flex-col gap-1 px-2 py-3 sm:px-3">
                {history.map(({ event, total: eventTotal }) => (
                  <li key={event.id}>
                    <Link
                      href={`/events/${event.id}`}
                      className="list-row grid gap-3 px-3 py-4 sm:grid-cols-[7rem_minmax(0,1fr)_auto_auto] sm:items-baseline"
                    >
                      <div>
                        <p className="text-sm text-muted">
                          {formatShortDate(event.date, locale)}
                        </p>
                        {event.startTime ? (
                          <p className="mt-1 font-display text-lg text-teal tabular-nums">
                            {event.startTime}
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="mt-1 text-sm text-muted">
                          {[
                            roomLabel(event.roomId, locale),
                            event.guests > 0
                              ? `${event.guests} ${t(locale, "guests")}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <span className="text-[12px] font-medium text-muted">
                        {statusLabel(event.status, locale)}
                      </span>
                      <p className="text-sm font-medium tabular-nums">
                        {formatMoney(eventTotal, currency, locale)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <BackupPanel />
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "sky" | "teal" | "accent";
}) {
  const accent =
    tone === "accent"
      ? "text-accent"
      : tone === "teal"
        ? "text-teal"
        : "text-sky";

  return (
    <div className="stat-tile">
      <p className="label">{label}</p>
      <p
        className={`font-display mt-3 text-2xl font-medium tabular-nums sm:text-3xl ${accent}`}
      >
        {value}
      </p>
    </div>
  );
}
