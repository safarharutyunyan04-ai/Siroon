"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { IconButton } from "@/components/ui/IconButton";
import { getCurrency } from "@/lib/currency";
import { formatMoney } from "@/lib/format";
import { t } from "@/lib/i18n/messages";
import { useBrokenCatalog, useCurrency, useLocale } from "@/lib/hooks";
import {
  addBrokenCatalogItem,
  deleteBrokenCatalogItem,
  updateBrokenCatalogItem,
} from "@/lib/broken-catalog-store";
import type { BrokenCatalogItem, Currency, Locale } from "@/types/domain";

export function BrokenCatalogPanel() {
  const { locale } = useLocale();
  const { currency } = useCurrency();
  const { items, ready } = useBrokenCatalog();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [removeId, setRemoveId] = useState<string | null>(null);
  const symbol = getCurrency(currency).symbol;

  if (!ready) {
    return <p className="mt-6 text-sm text-muted">{t(locale, "loading")}</p>;
  }

  return (
    <div className="mt-6 animate-rise">
      <header className="max-w-2xl">
        <h2 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
          {t(locale, "brokenCatalogTitle")}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {t(locale, "brokenCatalogLead")}
        </p>
      </header>

      {items.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          {t(locale, "brokenCatalogEmptyList")}
        </p>
      ) : (
        <ul className="mt-8 max-w-2xl flex flex-col">
          {items.map((item) => (
            <CatalogRow
              key={item.id}
              item={item}
              locale={locale}
              currency={currency}
              onRemove={() => setRemoveId(item.id)}
            />
          ))}
        </ul>
      )}

      <form
        className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-[1fr_8rem_auto]"
        onSubmit={(submit) => {
          submit.preventDefault();
          addBrokenCatalogItem({
            name,
            price: Number(price) || 0,
          });
          setName("");
          setPrice("");
        }}
      >
        <label className="flex flex-col gap-1.5">
          <span className="label">{t(locale, "name")}</span>
          <input
            value={name}
            onChange={(change) => setName(change.target.value)}
            required
            className="border-b border-border bg-transparent py-2 text-sm outline-none focus:border-foreground"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">
            {t(locale, "price")} ({symbol})
          </span>
          <input
            type="number"
            min={0}
            value={price}
            onChange={(change) => setPrice(change.target.value)}
            required
            className="border-b border-border bg-transparent py-2 text-sm tabular-nums outline-none focus:border-foreground"
          />
        </label>
        <div className="flex items-end">
          <Button type="submit" size="sm">
            {t(locale, "addBrokenCatalogItem")}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={removeId !== null}
        title={t(locale, "confirmDeleteBrokenCatalogItem")}
        description={t(locale, "confirmIrreversible")}
        confirmLabel={t(locale, "delete")}
        cancelLabel={t(locale, "cancel")}
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId) deleteBrokenCatalogItem(removeId);
          setRemoveId(null);
        }}
      />
    </div>
  );
}

function CatalogRow({
  item,
  locale,
  currency,
  onRemove,
}: {
  item: BrokenCatalogItem;
  locale: Locale;
  currency: Currency;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const symbol = getCurrency(currency).symbol;

  if (editing) {
    return (
      <li className="border-t border-border py-4">
        <form
          className="grid gap-3 sm:grid-cols-[1fr_8rem_auto]"
          onSubmit={(submit) => {
            submit.preventDefault();
            const data = new FormData(submit.currentTarget);
            updateBrokenCatalogItem(item.id, {
              name: String(data.get("name") ?? item.name),
              price: Number(data.get("price") ?? item.price),
            });
            setEditing(false);
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="label">{t(locale, "name")}</span>
            <input
              name="name"
              defaultValue={item.name}
              required
              className="border-b border-border bg-transparent py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="label">
              {t(locale, "price")} ({symbol})
            </span>
            <input
              name="price"
              type="number"
              min={0}
              defaultValue={String(item.price)}
              required
              className="border-b border-border bg-transparent py-2 text-sm tabular-nums outline-none focus:border-foreground"
            />
          </label>
          <div className="flex items-end gap-2">
            <Button type="submit" size="sm">
              {t(locale, "save")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditing(false)}
            >
              {t(locale, "cancel")}
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-4">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={`min-w-0 flex-1 text-left ${item.active ? "" : "text-muted"}`}
      >
        <span className={`text-sm ${item.active ? "" : "line-through"}`}>
          {item.name}
        </span>
      </button>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-sm tabular-nums text-muted">
          {formatMoney(item.price, currency, locale)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            updateBrokenCatalogItem(item.id, { active: !item.active })
          }
        >
          {item.active ? t(locale, "hide") : t(locale, "show")}
        </Button>
        <IconButton
          variant="remove"
          label={t(locale, "delete")}
          onClick={onRemove}
        >
          ×
        </IconButton>
      </div>
    </li>
  );
}
