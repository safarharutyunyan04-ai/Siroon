"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { formatMoney, formatPrice, id, todayIso } from "@/lib/format";
import { t } from "@/lib/i18n/messages";
import { useCurrency, useLocale, useMenu } from "@/lib/hooks";
import { createEvent, updateEvent } from "@/lib/events-store";
import { getChildCategories, getRootCategories } from "@/lib/menu-store";
import {
  emptyDiscount,
  normalizeDiscount,
  normalizePriceRules,
  quoteEvent,
} from "@/lib/pricing";
import { roomTone, rooms } from "@/lib/rooms";
import type {
  Currency,
  DiscountKind,
  EventDiscount,
  EventLine,
  Locale,
  MenuItem,
  PriceRule,
  PriceRuleKind,
  RoomId,
  VenueEvent,
} from "@/types/domain";

type EventFormProps = {
  event?: VenueEvent;
};

export function EventForm({ event }: EventFormProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const { items: menu, categories, ready } = useMenu();
  const { currency } = useCurrency();
  const activeMenu = menu.filter((item) => item.active);

  const [title, setTitle] = useState(event?.title ?? "");
  const [contact, setContact] = useState(event?.contact ?? "");
  const [date, setDate] = useState(event?.date ?? todayIso());
  const [startTime, setStartTime] = useState(event?.startTime ?? "");
  const [guests, setGuests] = useState(
    event?.guests && event.guests > 0 ? String(event.guests) : "",
  );
  const [roomId, setRoomId] = useState<RoomId>(event?.roomId ?? "hall-1");
  const [notes, setNotes] = useState(event?.notes ?? "");
  const [lines, setLines] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const line of event?.lines ?? []) {
      map[line.itemId] = line.quantity;
    }
    return map;
  });
  const [discount, setDiscount] = useState<EventDiscount>(() =>
    normalizeDiscount(event?.discount),
  );
  const [priceRules, setPriceRules] = useState<PriceRule[]>(() =>
    normalizePriceRules(event?.priceRules),
  );

  const selectedLines: EventLine[] = useMemo(
    () =>
      Object.entries(lines)
        .filter(([, quantity]) => quantity > 0)
        .map(([itemId, quantity]) => ({ itemId, quantity })),
    [lines],
  );

  const quote = useMemo(
    () =>
      quoteEvent(
        { lines: selectedLines, discount, priceRules },
        activeMenu,
        currency,
      ),
    [activeMenu, currency, discount, priceRules, selectedLines],
  );

  function setQty(itemId: string, quantity: number) {
    setLines((current) => {
      const next = { ...current };
      if (quantity <= 0) {
        delete next[itemId];
      } else {
        next[itemId] = quantity;
      }
      return next;
    });
  }

  function setDiscountKind(kind: DiscountKind) {
    setDiscount((current) =>
      kind === "none"
        ? emptyDiscount
        : { kind, value: kind === current.kind ? current.value : 0 },
    );
  }

  function addRule() {
    setPriceRules((current) => [
      ...current,
      { id: id("rule"), label: "", kind: "amount", value: 0 },
    ]);
  }

  function updateRule(ruleId: string, patch: Partial<PriceRule>) {
    setPriceRules((current) =>
      current.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)),
    );
  }

  function removeRule(ruleId: string) {
    setPriceRules((current) => current.filter((rule) => rule.id !== ruleId));
  }

  function submit() {
    const payload = {
      title,
      contact,
      date,
      startTime,
      guests: guests === "" ? 0 : Math.max(0, Math.round(Number(guests)) || 0),
      roomId,
      notes,
      lines: selectedLines,
      discount: normalizeDiscount(discount),
      priceRules: normalizePriceRules(priceRules),
      status: "confirmed" as const,
    };
    if (event) {
      updateEvent(event.id, payload);
      router.push(`/events/${event.id}`);
      return;
    }
    const created = createEvent(payload);
    router.push(`/events/${created.id}`);
  }

  return (
    <div className="animate-rise grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
          {event ? t(locale, "event") : t(locale, "newEvent")}
        </h1>

        <section className="mt-8 sm:mt-10">
          <h2 className="font-display text-xl font-medium sm:text-2xl">
            {t(locale, "informations")}
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field
              label={t(locale, "title")}
              value={title}
              onChange={setTitle}
            />
            <Field
              label={t(locale, "contact")}
              value={contact}
              onChange={setContact}
            />
            <Field
              label={t(locale, "guests")}
              type="number"
              value={guests}
              onChange={setGuests}
            />
            <Field
              label={t(locale, "date")}
              type="date"
              value={date}
              onChange={setDate}
            />
            <Field
              label={t(locale, "time")}
              type="time"
              value={startTime}
              onChange={setStartTime}
            />
          </div>
          <label className="mt-6 flex flex-col gap-2">
            <span className="label">{t(locale, "notes")}</span>
            <textarea
              rows={3}
              value={notes}
              onChange={(change) => setNotes(change.target.value)}
              className="resize-none border-b border-border bg-transparent py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
        </section>

        <section className="mt-10 sm:mt-12">
          <h2 className="font-display text-xl font-medium sm:text-2xl">
            {t(locale, "room")}
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {rooms.map((room) => {
              const selected = roomId === room.id;
              const tone = roomTone[room.id];
              const muted =
                room.id === "hall-1" ? "text-white/75" : "text-[#a34454]/75";
              return (
                <button
                  key={room.id}
                  type="button"
                  data-selected={selected}
                  onClick={() => setRoomId(room.id)}
                  className={`room-tile border bg-linear-to-br px-4 py-5 text-left ${tone.wash} ${tone.border} ${
                    selected ? tone.selected : ""
                  }`}
                >
                  <p className={`font-display text-lg font-medium ${tone.title}`}>
                    {t(locale, room.nameKey)}
                  </p>
                  <p className={`mt-2 text-sm ${muted}`}>
                    {t(locale, "upTo")} {room.capacity} {t(locale, "places")}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-10 sm:mt-12">
          <h2 className="font-display text-xl font-medium sm:text-2xl">
            {t(locale, "menuExtras")}
          </h2>
          {!ready ? (
            <p className="mt-6 text-sm text-muted">{t(locale, "loading")}</p>
          ) : (
            <div className="mt-6 flex flex-col gap-8 sm:gap-10">
              {getRootCategories(categories).map((category) => {
                const directItems = activeMenu.filter(
                  (item) => item.categoryId === category.id,
                );
                const children = getChildCategories(categories, category.id);
                const childBlocks = children
                  .map((child) => ({
                    child,
                    items: activeMenu.filter(
                      (item) => item.categoryId === child.id,
                    ),
                  }))
                  .filter((block) => block.items.length > 0);
                if (directItems.length === 0 && childBlocks.length === 0) {
                  return null;
                }
                return (
                  <div key={category.id}>
                    <p className="label">{category.name}</p>
                    {directItems.length > 0 ? (
                      <ul className="mt-4 flex flex-col">
                        {directItems.map((item) => (
                          <MenuLine
                            key={item.id}
                            item={item}
                            currency={currency}
                            locale={locale}
                            quantity={lines[item.id] ?? 0}
                            onChange={(quantity) => setQty(item.id, quantity)}
                          />
                        ))}
                      </ul>
                    ) : null}
                    {childBlocks.map(({ child, items: childItems }) => (
                      <div key={child.id} className="mt-6 pl-4">
                        <p className="text-[11px] font-medium tracking-[0.12em] text-teal uppercase">
                          {child.name}
                        </p>
                        <ul className="mt-3 flex flex-col">
                          {childItems.map((item) => (
                            <MenuLine
                              key={item.id}
                              item={item}
                              currency={currency}
                              locale={locale}
                              quantity={lines[item.id] ?? 0}
                              onChange={(quantity) => setQty(item.id, quantity)}
                            />
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-10 sm:mt-12">
          <h2 className="font-display text-xl font-medium sm:text-2xl">
            {t(locale, "discount")}
          </h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {(
              [
                ["none", "discountNone"],
                ["percent", "discountPercent"],
                ["amount", "discountAmount"],
              ] as const
            ).map(([kind, labelKey]) => (
              <button
                key={kind}
                type="button"
                onClick={() => setDiscountKind(kind)}
                className={`rounded-[8px] px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  discount.kind === kind
                    ? "bg-accent text-ink"
                    : "bg-teal-soft text-muted hover:text-foreground"
                }`}
              >
                {t(locale, labelKey)}
              </button>
            ))}
          </div>
          {discount.kind !== "none" ? (
            <label className="mt-5 flex max-w-xs flex-col gap-2">
              <span className="label">
                {discount.kind === "percent"
                  ? t(locale, "discountPercent")
                  : t(locale, "discountAmount")}
              </span>
              <input
                type="number"
                min={0}
                max={discount.kind === "percent" ? 100 : undefined}
                step={discount.kind === "percent" ? 1 : 1}
                value={discount.value || ""}
                onChange={(change) =>
                  setDiscount({
                    kind: discount.kind,
                    value: Number(change.target.value) || 0,
                  })
                }
                className="border-b border-border bg-transparent py-2 text-sm tabular-nums outline-none focus:border-foreground"
              />
            </label>
          ) : null}
        </section>

        <section className="mt-10 sm:mt-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-medium sm:text-2xl">
                {t(locale, "priceRules")}
              </h2>
              <p className="mt-2 max-w-lg text-sm text-muted">
                {t(locale, "priceRulesHint")}
              </p>
            </div>
            <Button type="button" variant="secondary" onClick={addRule}>
              {t(locale, "addPriceRule")}
            </Button>
          </div>

          {priceRules.length === 0 ? (
            <p className="mt-6 text-sm text-muted">{t(locale, "priceRulesHint")}</p>
          ) : (
            <ul className="mt-6 flex flex-col gap-4">
              {priceRules.map((rule) => (
                <li
                  key={rule.id}
                  className="grid gap-3 border-t border-border pt-4 sm:grid-cols-[1fr_7rem_7rem_auto]"
                >
                  <label className="flex flex-col gap-2">
                    <span className="label">{t(locale, "ruleLabel")}</span>
                    <input
                      value={rule.label}
                      onChange={(change) =>
                        updateRule(rule.id, { label: change.target.value })
                      }
                      placeholder={t(locale, "ruleLabel")}
                      className="border-b border-border bg-transparent py-2 text-sm outline-none focus:border-foreground"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="label">{t(locale, "unit")}</span>
                    <select
                      value={rule.kind}
                      onChange={(change) =>
                        updateRule(rule.id, {
                          kind: change.target.value as PriceRuleKind,
                        })
                      }
                      className="border-b border-border bg-transparent py-2 text-sm outline-none focus:border-foreground"
                    >
                      <option value="amount">{t(locale, "ruleAmount")}</option>
                      <option value="percent">{t(locale, "rulePercent")}</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="label">
                      {rule.kind === "percent"
                        ? t(locale, "rulePercent")
                        : t(locale, "ruleAmount")}
                    </span>
                    <input
                      type="number"
                      step={rule.kind === "percent" ? 1 : 1}
                      value={rule.value || ""}
                      onChange={(change) =>
                        updateRule(rule.id, {
                          value: Number(change.target.value) || 0,
                        })
                      }
                      className="border-b border-border bg-transparent py-2 text-sm tabular-nums outline-none focus:border-foreground"
                    />
                  </label>
                  <div className="flex items-end">
                    <IconButton
                      variant="remove"
                      label={t(locale, "removeRule")}
                      onClick={() => removeRule(rule.id)}
                    >
                      ×
                    </IconButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <aside className="lg:sticky lg:top-32 lg:self-start">
        <div className="panel border-t-0 bg-linear-to-br from-[#faf0f2] via-surface-raised to-white p-5 sm:p-6">
          <p className="label">{t(locale, "estimatedTotal")}</p>
          <p className="font-display mt-3 text-2xl font-medium text-accent tabular-nums sm:text-3xl">
            {formatMoney(quote.total, currency, locale)}
          </p>
          <div className="mt-4 space-y-1.5 border-t border-border/70 pt-3 text-[12px] text-muted">
            <QuoteRow
              label={t(locale, "subtotal")}
              value={formatMoney(quote.subtotal, currency, locale)}
            />
            {quote.rules.map((rule) => (
              <QuoteRow
                key={rule.id}
                label={rule.label}
                value={formatSignedMoney(rule.amount, currency, locale)}
              />
            ))}
            {quote.discountAmount > 0 ? (
              <QuoteRow
                label={
                  quote.discount.kind === "percent"
                    ? `${t(locale, "discount")} (−${quote.discount.value}%)`
                    : t(locale, "discount")
                }
                value={formatSignedMoney(-quote.discountAmount, currency, locale)}
              />
            ) : null}
          </div>
          <p className="mt-3 text-sm text-muted">
            {selectedLines.length}{" "}
            {selectedLines.length === 1
              ? t(locale, "line")
              : t(locale, "lines")}
            {guests ? ` · ${guests} ${t(locale, "guests")}` : ""}
          </p>
          <div className="mt-5 flex flex-col gap-2 lg:mt-6">
            <Button size="lg" className="w-full" onClick={submit}>
              {event ? t(locale, "saveEvent") : t(locale, "createTheEvent")}
            </Button>
            <Button href="/" variant="ghost" size="sm" className="w-full">
              {t(locale, "cancel")}
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function QuoteRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="min-w-0 truncate">{label}</span>
      <span className="shrink-0 tabular-nums text-foreground/80">{value}</span>
    </div>
  );
}

function formatSignedMoney(
  value: number,
  currency: Currency,
  locale: Locale,
) {
  const formatted = formatMoney(Math.abs(value), currency, locale);
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `−${formatted}`;
  return formatted;
}

function MenuLine({
  item,
  currency,
  locale,
  quantity,
  onChange,
}: {
  item: MenuItem;
  currency: Currency;
  locale: Locale;
  quantity: number;
  onChange: (quantity: number) => void;
}) {
  const selected = quantity > 0;
  return (
    <li
      className={`flex flex-wrap items-center justify-between gap-4 border-t border-border py-4 ${
        selected ? "" : "opacity-80"
      }`}
    >
      <div>
        <p className="text-sm">{item.name}</p>
        <p className="mt-1 text-[11px] text-muted">
          {formatPrice(item.price, item.priceUnit, currency, locale)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={t(locale, "less")}
          className="flex h-8 w-8 items-center justify-center rounded-[8px] text-muted hover:text-foreground"
          onClick={() =>
            onChange(
              Math.max(0, quantity - (item.priceUnit === "kg" ? 0.5 : 1)),
            )
          }
        >
          −
        </button>
        <input
          type="number"
          min={0}
          step={item.priceUnit === "kg" ? 0.5 : 1}
          value={quantity || ""}
          placeholder="0"
          onChange={(change) => onChange(Number(change.target.value) || 0)}
          className="w-16 border-b border-border bg-transparent py-1 text-center text-sm tabular-nums outline-none focus:border-foreground"
        />
        <button
          type="button"
          aria-label={t(locale, "more")}
          className="flex h-8 w-8 items-center justify-center rounded-[8px] text-muted hover:text-foreground"
          onClick={() =>
            onChange(quantity + (item.priceUnit === "kg" ? 0.5 : 1))
          }
        >
          +
        </button>
      </div>
    </li>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="label">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(change) => onChange(change.target.value)}
        className="border-b border-border bg-transparent py-2 text-sm outline-none focus:border-foreground"
      />
    </label>
  );
}
