"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { OrderSheetPrint } from "@/components/events/OrderSheetPrint";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { IconButton } from "@/components/ui/IconButton";
import { deleteEvent, updateEvent } from "@/lib/events-store";
import { formatMoney, formatLongDate, id } from "@/lib/format";
import { t } from "@/lib/i18n/messages";
import { useCurrency, useEvent, useLocale, useMenu } from "@/lib/hooks";
import { getCategory } from "@/lib/menu-store";
import { quoteEvent } from "@/lib/pricing";
import { roomName } from "@/lib/rooms";
import type { BrokenItem, Locale, VenueEvent } from "@/types/domain";

export function EventDetail({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { locale } = useLocale();
  const { event, ready } = useEvent(eventId);
  const { items: menu } = useMenu();
  const { currency } = useCurrency();
  const [justDone, setJustDone] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  const quote = quoteEvent(event, menu, currency, locale);
  const groups = new Map<string, typeof quote.lines>();
  for (const line of quote.lines) {
    const list = groups.get(line.categoryId) ?? [];
    list.push(line);
    groups.set(line.categoryId, list);
  }

  const isDone = event.status === "done";

  function toggleDone() {
    const next = isDone ? "confirmed" : "done";
    updateEvent(event!.id, { status: next });
    if (next === "done") {
      setJustDone(true);
      window.setTimeout(() => setJustDone(false), 1600);
    } else {
      setJustDone(false);
    }
  }

  return (
    <div className="animate-rise">
      <div className="no-print">
      <Link
        href="/planning"
        className="inline-flex text-[13px] font-medium text-muted transition-colors hover:text-foreground"
      >
        {t(locale, "backPlanning")}
      </Link>

      <section
        className={`panel relative mt-6 overflow-hidden px-6 py-8 transition-[box-shadow,border-color] duration-500 sm:mt-8 sm:px-8 ${
          isDone
            ? "border-[#2f6b4f]/35 shadow-[0_12px_36px_rgba(47,107,79,0.12)]"
            : ""
        }`}
      >
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
            isDone
              ? "bg-[radial-gradient(ellipse_at_100%_0%,rgba(47,107,79,0.14),transparent_55%)] opacity-100"
              : "bg-[radial-gradient(ellipse_at_100%_0%,rgba(196,92,106,0.12),transparent_50%)] opacity-100"
          }`}
        />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip done={isDone} locale={locale} pulse={justDone} />
            {justDone ? (
              <span
                className="animate-rise text-lg"
                aria-hidden
              >
                ✓
              </span>
            ) : null}
          </div>

          <h1 className="font-display mt-4 text-4xl font-medium tracking-tight">
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
          <p
            className={`font-display mt-8 text-4xl font-medium tabular-nums transition-colors duration-500 ${
              isDone ? "text-[#2f6b4f]" : "text-accent"
            }`}
          >
            {formatMoney(quote.total, currency, locale)}
            {event.guests > 0 ? (
              <span className="ml-3 text-xl font-normal text-muted sm:text-2xl">
                ·{" "}
                {formatMoney(
                  Math.round(quote.total / event.guests),
                  currency,
                  locale,
                )}{" "}
                {t(locale, "pricePerPerson")}
              </span>
            ) : null}
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
                    +{formatMoney(rule.amount, currency, locale)}
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

      <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center">
        <Button size="lg" onClick={() => window.print()}>
          {t(locale, "printOrder")}
        </Button>
        <Button href={`/events/${event.id}/edit`} variant="secondary" size="lg">
          {t(locale, "edit")}
        </Button>
        <Button
          variant={isDone ? "secondary" : "success"}
          size="lg"
          onClick={toggleDone}
        >
          {!isDone ? <span aria-hidden>✓</span> : null}
          {isDone ? t(locale, "reopen") : t(locale, "markDone")}
        </Button>
        <Button
          variant="danger"
          size="sm"
          className="sm:ml-auto"
          onClick={() => setConfirmDelete(true)}
        >
          {t(locale, "deleteEvent")}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={t(locale, "confirmDeleteEvent")}
        description={t(locale, "confirmIrreversible")}
        confirmLabel={t(locale, "deleteEvent")}
        cancelLabel={t(locale, "cancel")}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          deleteEvent(event.id);
          router.push("/");
        }}
      />

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

      <BrokenItemsSection event={event} locale={locale} />
      </div>

      <OrderSheetPrint
        event={event}
        quote={quote}
        locale={locale}
        currency={currency}
      />
    </div>
  );
}

function StatusChip({
  done,
  locale,
  pulse,
}: {
  done: boolean;
  locale: Locale;
  pulse: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.06em] uppercase transition-colors duration-500 ${
        done
          ? "bg-[#e7f5ee] text-[#1f4d3a] ring-1 ring-[#2f6b4f]/20"
          : "bg-accent-soft text-accent-deep ring-1 ring-accent/25"
      } ${pulse ? "scale-105" : ""}`}
    >
      <span aria-hidden>{done ? "✓" : "●"}</span>
      {done ? t(locale, "statusDone") : t(locale, "statusConfirmed")}
    </span>
  );
}

function BrokenItemsSection({
  event,
  locale,
}: {
  event: VenueEvent;
  locale: Locale;
}) {
  const items = event.brokenItems ?? [];
  const [label, setLabel] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [removeId, setRemoveId] = useState<string | null>(null);

  function persist(next: BrokenItem[]) {
    updateEvent(event.id, { brokenItems: next });
  }

  function addItem() {
    const trimmed = label.trim();
    if (!trimmed) return;
    const qty = Math.max(1, Math.round(Number(quantity) || 1));
    persist([
      {
        id: id("brk"),
        label: trimmed,
        quantity: qty,
        note: note.trim(),
        createdAt: new Date().toISOString(),
      },
      ...items,
    ]);
    setLabel("");
    setQuantity("1");
    setNote("");
  }

  return (
    <section className="mt-10 border-t border-border pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label">{t(locale, "brokenItems")}</p>
          <p className="mt-1 text-[12px] text-muted">
            {t(locale, "brokenItemsHint")}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="mt-5 text-sm text-muted">{t(locale, "noBrokenItems")}</p>
      ) : (
        <ul className="mt-5 flex flex-col">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-3 border-t border-border py-3.5 first:border-t-0 first:pt-0"
            >
              <div className="min-w-0">
                <p className="text-sm">
                  {item.label}
                  {item.quantity > 1 ? (
                    <span className="ml-2 tabular-nums text-muted">
                      ×{item.quantity}
                    </span>
                  ) : null}
                </p>
                {item.note ? (
                  <p className="mt-1 text-[12px] text-muted">{item.note}</p>
                ) : null}
              </div>
              <IconButton
                variant="remove"
                label={t(locale, "delete")}
                onClick={() => setRemoveId(item.id)}
              >
                ×
              </IconButton>
            </li>
          ))}
        </ul>
      )}

      <form
        className="mt-5 grid max-w-2xl gap-3 sm:grid-cols-[1fr_5rem_1fr_auto]"
        onSubmit={(submit) => {
          submit.preventDefault();
          addItem();
        }}
      >
        <label className="flex flex-col gap-1.5">
          <span className="label">{t(locale, "brokenItemName")}</span>
          <input
            value={label}
            onChange={(change) => setLabel(change.target.value)}
            required
            className="border-b border-border bg-transparent py-2 text-sm outline-none focus:border-foreground"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">{t(locale, "brokenItemQty")}</span>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(change) => setQuantity(change.target.value)}
            className="border-b border-border bg-transparent py-2 text-sm tabular-nums outline-none focus:border-foreground"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">{t(locale, "brokenItemNote")}</span>
          <input
            value={note}
            onChange={(change) => setNote(change.target.value)}
            className="border-b border-border bg-transparent py-2 text-sm outline-none focus:border-foreground"
          />
        </label>
        <div className="flex items-end">
          <Button type="submit" size="sm">
            {t(locale, "addBrokenItem")}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={removeId !== null}
        title={t(locale, "confirmDeleteBrokenItem")}
        description={t(locale, "confirmIrreversible")}
        confirmLabel={t(locale, "delete")}
        cancelLabel={t(locale, "cancel")}
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId) {
            persist(items.filter((item) => item.id !== removeId));
          }
          setRemoveId(null);
        }}
      />
    </section>
  );
}
