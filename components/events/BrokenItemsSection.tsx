"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { IconButton } from "@/components/ui/IconButton";
import { updateEvent } from "@/lib/events-store";
import { id } from "@/lib/format";
import { t } from "@/lib/i18n/messages";
import type { BrokenItem, Locale, VenueEvent } from "@/types/domain";

export function BrokenItemsSection({
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
    <section
      id="broken-items"
      className="panel mt-8 scroll-mt-28 border-2 border-accent/35 bg-linear-to-br from-[#faf0f2] via-surface-raised to-white px-5 py-6 sm:mt-10 sm:px-7 sm:py-7"
    >
      <div>
        <h2 className="font-display text-xl font-medium tracking-tight text-accent-deep sm:text-2xl">
          {t(locale, "brokenItems")}
        </h2>
        <p className="mt-1.5 text-[13px] text-muted">
          {t(locale, "brokenItemsHint")}
        </p>
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
