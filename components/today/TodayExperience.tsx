"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { statusLabel } from "@/lib/bilan";
import { formatLongDate, formatMoney, todayIso } from "@/lib/format";
import { t } from "@/lib/i18n/messages";
import {
  useCurrency,
  useLocale,
  useMenu,
  useTodayEvents,
  useEvents,
} from "@/lib/hooks";
import { quoteEvent } from "@/lib/pricing";
import { roomName } from "@/lib/rooms";

export function TodayExperience() {
  const { locale } = useLocale();
  const { events, ready, today } = useTodayEvents();
  const { events: allEvents } = useEvents();
  const { items: menu } = useMenu();
  const { currency } = useCurrency();
  const upcoming = allEvents
    .filter(
      (event) =>
        event.date > today &&
        event.status !== "cancelled" &&
        event.status !== "done",
    )
    .slice(0, 4);
  const menuCount = menu.filter((item) => item.active).length;

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <section className="animate-wash panel relative overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_90%_0%,rgba(196,92,106,0.2),transparent_55%)]"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display max-w-xl text-3xl leading-[1.12] font-medium tracking-tight text-balance sm:text-4xl lg:text-5xl">
            {formatLongDate(today, locale)}
          </h1>
          <div className="flex flex-wrap gap-2">
            <Button href="/events/new">{t(locale, "newEvent")}</Button>
          </div>
        </div>
      </section>

      <section className="animate-rise-delay grid gap-4 sm:grid-cols-3">
        <Stat
          label={t(locale, "todayEvents")}
          value={ready ? String(events.length) : "—"}
          tone="sky"
        />
        <Stat
          label={t(locale, "upcoming")}
          value={String(upcoming.length)}
          tone="teal"
        />
        <Stat
          label={t(locale, "menuItems")}
          value={String(menuCount)}
          tone="accent"
        />
      </section>

      <section className="animate-rise panel px-4 py-6 sm:px-6 sm:py-7">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-xl font-medium sm:text-2xl">
            {t(locale, "todayEvents")}
          </h2>
          <Link
            href="/planning"
            className="shrink-0 text-[12px] font-medium text-teal transition-colors hover:text-accent"
          >
            {t(locale, "seePlanning")}
          </Link>
        </div>
        {!ready ? (
          <p className="mt-8 text-sm text-muted">{t(locale, "loading")}</p>
        ) : events.length === 0 ? (
          <div className="mt-8 rounded-[12px] bg-teal-soft/60 px-5 py-6">
            <p className="text-sm text-muted">{t(locale, "noEventsToday")}</p>
            <Button href="/events/new" className="mt-5">
              {t(locale, "createEvent")}
            </Button>
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-1">
            {events.map((event) => {
              const quote = quoteEvent(event, menu, currency);
              return (
                <li key={event.id}>
                  <Link
                    href={`/events/${event.id}`}
                    className="list-row group grid gap-2 px-3 py-4 sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:items-baseline sm:gap-8"
                  >
                    {event.startTime ? (
                      <p className="font-display text-xl text-teal tabular-nums">
                        {event.startTime}
                      </p>
                    ) : (
                      <p className="text-sm text-muted">—</p>
                    )}
                    <div>
                      <p className="text-sm font-medium transition-colors group-hover:text-accent">
                        {event.title}
                      </p>
                      <p className="mt-1 text-sm text-muted">
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
                    <p className="text-sm font-medium tabular-nums text-foreground/80">
                      {formatMoney(quote.total, currency, locale)}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {upcoming.length > 0 ? (
        <section className="animate-rise">
          <h2 className="font-display text-2xl font-medium">
            {t(locale, "next")}
          </h2>
          <ul className="mt-5 flex flex-col gap-1">
            {upcoming.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/events/${event.id}`}
                  className="list-row flex flex-wrap items-baseline justify-between gap-3 px-3 py-4"
                >
                  <div>
                    <p className="text-sm font-medium">{event.title}</p>
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
                  <span className="rounded-[8px] bg-sky-soft px-2.5 py-1 text-[12px] font-medium text-teal">
                    {statusLabel(event.status, locale)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="sr-only">{todayIso()}</p>
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
        className={`font-display mt-3 text-3xl font-medium tabular-nums ${accent}`}
      >
        {value}
      </p>
    </div>
  );
}
