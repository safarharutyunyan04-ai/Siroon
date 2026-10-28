"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { IconButton } from "@/components/ui/IconButton";
import {
  brokenItemAmount,
  brokenItemsTotal,
} from "@/lib/broken-items";
import { formatMoney, id } from "@/lib/format";
import { t } from "@/lib/i18n/messages";
import { useBrokenCatalog, useCurrency } from "@/lib/hooks";
import type { BrokenItem, Locale } from "@/types/domain";

export function BrokenItemsSection({
  items,
  onChange,
  locale,
}: {
  items: BrokenItem[];
  onChange: (items: BrokenItem[]) => void;
  locale: Locale;
}) {
  const list = items ?? [];
  const { currency } = useCurrency();
  const { items: catalog, ready } = useBrokenCatalog();
  const activeCatalog = catalog.filter((entry) => entry.active);
  const [catalogId, setCatalogId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [removeId, setRemoveId] = useState<string | null>(null);
  const total = brokenItemsTotal(list);

  function addItem() {
    const picked = activeCatalog.find((entry) => entry.id === catalogId);
    if (!picked) return;
    const qty = Math.max(1, Math.round(Number(quantity) || 1));
    onChange([
      {
        id: id("brk"),
        catalogId: picked.id,
        label: picked.name,
        unitPrice: picked.price,
        quantity: qty,
        note: note.trim(),
        createdAt: new Date().toISOString(),
      },
      ...list,
    ]);
    setCatalogId("");
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

      {list.length === 0 ? (
        <p className="mt-5 text-sm text-muted">{t(locale, "noBrokenItems")}</p>
      ) : (
        <ul className="mt-5 flex flex-col">
          {list.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-3 border-t border-border py-3.5 first:border-t-0 first:pt-0"
            >
              <div className="min-w-0">
                <p className="text-sm">
                  {item.label}
                  <span className="ml-2 tabular-nums text-muted">
                    ×{item.quantity}
                  </span>
                </p>
                <p className="mt-1 text-[12px] text-muted tabular-nums">
                  {formatMoney(item.unitPrice, currency, locale)} ×{" "}
                  {item.quantity} ={" "}
                  {formatMoney(brokenItemAmount(item), currency, locale)}
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

      {list.length > 0 ? (
        <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-accent/25 pt-4">
          <p className="text-sm font-medium text-accent-deep">
            {t(locale, "brokenItemsTotal")}
          </p>
          <p className="font-display text-xl font-medium tabular-nums text-accent-deep">
            {formatMoney(total, currency, locale)}
          </p>
        </div>
      ) : null}

      {!ready ? (
        <p className="mt-5 text-sm text-muted">{t(locale, "loading")}</p>
      ) : activeCatalog.length === 0 ? (
        <p className="mt-5 text-sm text-muted">
          {t(locale, "brokenCatalogEmpty")}
        </p>
      ) : (
        <form
          className="mt-5 grid max-w-2xl gap-3 sm:grid-cols-[1fr_5rem_1fr_auto]"
          onSubmit={(submit) => {
            submit.preventDefault();
            addItem();
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="label">{t(locale, "brokenCatalogPick")}</span>
            <select
              value={catalogId}
              onChange={(change) => setCatalogId(change.target.value)}
              required
              className="border-b border-border bg-transparent py-2 text-sm outline-none focus:border-foreground"
            >
              <option value="">{t(locale, "brokenCatalogPick")}</option>
              {activeCatalog.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name} ·{" "}
                  {formatMoney(entry.price, currency, locale)}
                </option>
              ))}
            </select>
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
      )}

      <ConfirmDialog
        open={removeId !== null}
        title={t(locale, "confirmDeleteBrokenItem")}
        description={t(locale, "confirmIrreversible")}
        confirmLabel={t(locale, "delete")}
        cancelLabel={t(locale, "cancel")}
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId) {
            onChange(list.filter((item) => item.id !== removeId));
          }
          setRemoveId(null);
        }}
      />
    </section>
  );
}
