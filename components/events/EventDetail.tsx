"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { deleteEvent, updateEvent } from "@/lib/events-store";
import { formatMoney, formatLongDate } from "@/lib/format";
import { t } from "@/lib/i18n/messages";
import { useCurrency, useEvent, useLocale, useMenu } from "@/lib/hooks";
import { getCategory } from "@/lib/menu-store";
import { quoteEvent } from "@/lib/pricing";
import { roomName } from "@/lib/rooms";

export function EventDetail({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { locale } = useLocale();
  const { event, ready } = useEvent(eventId);
  const { items: menu } = useMenu();
  const { currency } = useCurrency();

  if (!ready) {
    return <p className="text-sm text-muted">{t(locale, "loading")}</p>;
  }

  if (!event) {
    return (
      <div>
        <p className="text-sm text-muted">{t(locale, "missingEvent")}</p>
        <Button href="/" className="mt-6">
          {t(locale, "back")}
        </Button>
      </div>
    );
  }

  const quote = quoteEvent(event, menu, currency);
  const groups = new Map<string, typeof quote.lines>();
  for (const line of quote.lines) {
    const list = groups.get(line.categoryId) ?? [];
    list.push(line);
    groups.set(line.categoryId, list);
  }

  return (
    <div className="animate-rise">
      <Button href="/planning" variant="ghost">
        {t(locale, "backPlanning")}
      </Button>
      <section className="panel relative mt-8 overflow-hidden px-6 py-8 sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(196,92,106,0.12),transparent_50%)]"
        />
        <div className="relative">
          <h1 className="font-display text-4xl font-medium tracking-tight">
            {event.title}
          </h1>
          <p className="mt-4 text-sm text-muted">
            {[
              formatLongDate(event.date, locale),
              event.startTime || null,
              roomName(event.roomId, locale),
              event.guests > 0
                ? `${event.guests} ${t(locale, "guests")}`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {event.contact ? (
            <p className="mt-1 text-sm text-muted">{event.contact}</p>
          ) : null}
          <p className="font-display mt-8 text-4xl font-medium text-accent tabular-nums">
            {formatMoney(quote.total, currency, locale)}
          </p>
          {quote.subtotal !== quote.total ||
          quote.rules.length > 0 ||
          quote.discountAmount > 0 ? (
            <div className="mt-4 max-w-sm space-y-1.5 text-[13px] text-muted">
              <div className="flex justify-between gap-4">
                <span>{t(locale, "subtotal")}</span>
                <span className="tabular-nums text-foreground/80">
                  {formatMoney(quote.subtotal, currency, locale)}
                </span>
              </div>
              {quote.rules.map((rule) => (
                <div key={rule.id} className="flex justify-between gap-4">
                  <span className="min-w-0 truncate">{rule.label}</span>
                  <span className="shrink-0 tabular-nums text-foreground/80">
                    {rule.amount > 0 ? "+" : rule.amount < 0 ? "−" : ""}
                    {formatMoney(Math.abs(rule.amount), currency, locale)}
                  </span>
                </div>
              ))}
              {quote.discountAmount > 0 ? (
                <div className="flex justify-between gap-4">
                  <span>
                    {quote.discount.kind === "percent"
                      ? `${t(locale, "discount")} (−${quote.discount.value}%)`
                      : t(locale, "discount")}
                  </span>
                  <span className="tabular-nums text-foreground/80">
                    −{formatMoney(quote.discountAmount, currency, locale)}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Button href={`/events/${event.id}/plan`} className="w-full">
          {t(locale, "seatingPlan")}
        </Button>
        <Button href={`/events/${event.id}/edit`} variant="secondary" className="w-full">
          {t(locale, "edit")}
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="ghost"
          onClick={() =>
            updateEvent(event.id, {
              status: event.status === "done" ? "confirmed" : "done",
            })
          }
        >
          {event.status === "done"
            ? t(locale, "reopen")
            : t(locale, "markDone")}
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            deleteEvent(event.id);
            router.push("/");
          }}
        >
          {t(locale, "deleteEvent")}
        </Button>
      </div>

      <div className="mt-14">
        {[...groups.entries()].map(([categoryId, lines]) => (
          <section key={categoryId} className="border-t border-border py-8">
            <p className="label">
              {(() => {
                const category = getCategory(categoryId);
                if (!category) return categoryId;
                if (!category.parentId) return category.name;
                const parent = getCategory(category.parentId);
                return parent
                  ? `${parent.name} · ${category.name}`
                  : category.name;
              })()}
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {lines.map((line) => (
                <li
                  key={line.itemId}
                  className="flex items-baseline justify-between gap-4"
                >
                  <div>
                    <p className="text-sm">{line.name}</p>
                    <p className="mt-1 text-[11px] text-muted">
                      {line.explanation}
                    </p>
                  </div>
                  <p className="text-sm tabular-nums">
                    {formatMoney(line.amount, currency, locale)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {quote.lines.length === 0 ? (
          <p className="border-t border-border pt-8 text-sm text-muted">
            {t(locale, "noMenuLines")}{" "}
            <Link href={`/events/${event.id}/edit`} className="text-foreground">
              {t(locale, "composeMenu")}
            </Link>
          </p>
        ) : null}
      </div>

      {event.notes ? (
        <section className="mt-10 border-t border-border pt-8">
          <p className="label">{t(locale, "notes")}</p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed">{event.notes}</p>
        </section>
      ) : null}
    </div>
  );
}
