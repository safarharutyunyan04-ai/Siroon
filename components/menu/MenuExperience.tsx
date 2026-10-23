"use client";

import { useState } from "react";
import Link from "next/link";
import { MenuQrCode } from "@/components/carte/MenuQrCode";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { currencies, getCurrency } from "@/lib/currency";
import { formatPrice } from "@/lib/format";
import { t } from "@/lib/i18n/messages";
import { useCurrency, useLocale, useMenu } from "@/lib/hooks";
import {
  addMenuCategory,
  addMenuItem,
  deleteMenuCategory,
  deleteMenuItem,
  fillCategoryTranslations,
  fillItemTranslations,
  getChildCategories,
  getRootCategories,
  translateEntireMenu,
  updateMenuCategory,
  updateMenuItem,
} from "@/lib/menu-store";
import { setCurrency } from "@/lib/settings-store";
import type {
  Currency,
  Locale,
  MenuCategory,
  MenuItem,
  PriceUnit,
} from "@/types/domain";

type MenuTab = "menus" | "qr";

function currencyLabel(id: Currency, locale: Locale) {
  if (id === "AMD") return "AMD";
  if (id === "USD") return t(locale, "dollar");
  if (id === "EUR") return t(locale, "euro");
  return t(locale, "ruble");
}

export function MenuExperience() {
  const { locale } = useLocale();
  const { items, categories, ready } = useMenu();
  const { currency } = useCurrency();
  const [tab, setTab] = useState<MenuTab>("menus");
  const [addingSection, setAddingSection] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translateNote, setTranslateNote] = useState("");
  const roots = getRootCategories(categories);

  async function runTranslate() {
    setTranslating(true);
    setTranslateNote(t(locale, "translating"));
    try {
      await translateEntireMenu(locale === "fr" ? "fr" : "hy");
      setTranslateNote(t(locale, "translateDone"));
    } catch {
      setTranslateNote("");
    } finally {
      setTranslating(false);
      window.setTimeout(() => setTranslateNote(""), 2500);
    }
  }

  return (
    <div className="animate-rise">
      <div className="no-print flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
          {t(locale, "menu")}
        </h1>
        <div className="flex max-w-full gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setTab("menus")}
            className={`shrink-0 rounded-[10px] px-3 py-2 text-[12px] font-medium transition-all duration-[var(--duration)] ${
              tab === "menus"
                ? "bg-accent text-ink"
                : "text-muted hover:bg-teal-soft hover:text-foreground"
            }`}
          >
            {t(locale, "menuTabMenus")}
          </button>
          <Link
            href="/carte"
            className="shrink-0 rounded-[10px] px-3 py-2 text-[12px] font-medium text-muted transition-all duration-[var(--duration)] hover:bg-teal-soft hover:text-foreground"
          >
            {t(locale, "menuTabCarte")}
          </Link>
          <button
            type="button"
            onClick={() => setTab("qr")}
            className={`shrink-0 rounded-[10px] px-3 py-2 text-[12px] font-medium transition-all duration-[var(--duration)] ${
              tab === "qr"
                ? "bg-accent text-ink"
                : "text-muted hover:bg-teal-soft hover:text-foreground"
            }`}
          >
            {t(locale, "menuTabQr")}
          </button>
        </div>
      </div>

      {tab === "menus" ? (
        <div className="mt-6">
          <div className="panel relative overflow-hidden px-4 py-6 sm:px-7 sm:py-7">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(196,92,106,0.1),transparent_50%)]"
            />
            <div className="relative flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="max-w-md text-sm text-muted">
                  {t(locale, "menuExtras")}
                </p>
                {translateNote ? (
                  <p className="mt-2 text-[12px] text-accent">{translateNote}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex min-w-0 flex-col gap-2">
                  <span className="label">{t(locale, "currency")}</span>
                  <select
                    value={currency}
                    onChange={(change) =>
                      setCurrency(change.target.value as Currency)
                    }
                    className="min-w-[7.5rem] max-w-full border-b border-border bg-transparent py-2 text-sm outline-none focus:border-foreground"
                  >
                    {currencies.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {currencyLabel(entry.id, locale)} ({entry.symbol})
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={translating || roots.length === 0}
                  onClick={runTranslate}
                >
                  {translating
                    ? t(locale, "translating")
                    : t(locale, "translateMenu")}
                </Button>
                <IconButton
                  label={t(locale, "addSection")}
                  onClick={() => setAddingSection((current) => !current)}
                >
                  +
                </IconButton>
              </div>
            </div>
            {addingSection ? (
              <NameForm
                label={t(locale, "section")}
                locale={locale}
                onSubmit={(name) => {
                  const created = addMenuCategory(name);
                  void fillCategoryTranslations(
                    created.id,
                    locale === "fr" ? "fr" : "hy",
                  );
                  setAddingSection(false);
                }}
                onCancel={() => setAddingSection(false)}
              />
            ) : null}
          </div>

          {!ready ? (
            <p className="mt-8 text-sm text-muted">{t(locale, "loading")}</p>
          ) : roots.length === 0 ? (
            <div className="mt-8">
              <IconButton
                label={t(locale, "addSection")}
                onClick={() => setAddingSection(true)}
              >
                +
              </IconButton>
            </div>
          ) : (
            <div className="mt-8 flex flex-col gap-10 sm:mt-10 sm:gap-12">
              {roots.map((category) => (
                <SectionBlock
                  key={category.id}
                  category={category}
                  categories={categories}
                  items={items}
                  currency={currency}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === "qr" ? <MenuQrCode className="mt-6" /> : null}
    </div>
  );
}

function SectionBlock({
  category,
  categories,
  items,
  currency,
  locale,
}: {
  category: MenuCategory;
  categories: MenuCategory[];
  items: MenuItem[];
  currency: Currency;
  locale: Locale;
}) {
  const [openItem, setOpenItem] = useState(false);
  const [addingSub, setAddingSub] = useState(false);
  const children = getChildCategories(categories, category.id);
  const directItems = items.filter((item) => item.categoryId === category.id);

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1">
          <CategoryTitle
            name={category.name}
            size="lg"
            locale={locale}
            onRename={(name) => {
              updateMenuCategory(category.id, name);
              void fillCategoryTranslations(
                category.id,
                locale === "fr" ? "fr" : "hy",
              );
            }}
          />
          <IconButton
            variant="remove"
            label={t(locale, "deleteSection")}
            onClick={() => deleteMenuCategory(category.id)}
          >
            ×
          </IconButton>
        </div>
        <IconButton
          label={t(locale, "addItem")}
          onClick={() => {
            setOpenItem((current) => !current);
            setAddingSub(false);
          }}
        >
          +
        </IconButton>
      </div>

      {openItem ? (
        <AddItemForm
          categoryId={category.id}
          currency={currency}
          locale={locale}
          onDone={() => setOpenItem(false)}
        />
      ) : null}

      {directItems.length > 0 ? (
        <ul className="mt-5 flex flex-col">
          {directItems.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              currency={currency}
              locale={locale}
            />
          ))}
        </ul>
      ) : null}

      {children.length > 0 ? (
        <div className="mt-8 flex flex-col gap-8 border-l border-border/80 pl-5 sm:pl-7">
          {children.map((child) => (
            <SubsectionBlock
              key={child.id}
              category={child}
              items={items}
              currency={currency}
              locale={locale}
            />
          ))}
        </div>
      ) : null}

      {addingSub ? (
        <NameForm
          label={t(locale, "subsection")}
          locale={locale}
          onSubmit={(name) => {
            const created = addMenuCategory(name, category.id);
            void fillCategoryTranslations(
              created.id,
              locale === "fr" ? "fr" : "hy",
            );
            setAddingSub(false);
          }}
          onCancel={() => setAddingSub(false)}
        />
      ) : (
        <div className="mt-6 border-t border-dashed border-border/80 pt-4">
          <Button
            variant="ghost"
            onClick={() => {
              setAddingSub(true);
              setOpenItem(false);
            }}
          >
            + {t(locale, "addSubsection")}
          </Button>
        </div>
      )}

      {directItems.length === 0 &&
      children.length === 0 &&
      !openItem &&
      !addingSub ? (
        <p className="mt-2 text-sm text-muted">—</p>
      ) : null}
    </section>
  );
}

function SubsectionBlock({
  category,
  items,
  currency,
  locale,
}: {
  category: MenuCategory;
  items: MenuItem[];
  currency: Currency;
  locale: Locale;
}) {
  const [openItem, setOpenItem] = useState(false);
  const categoryItems = items.filter((item) => item.categoryId === category.id);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1">
          <CategoryTitle
            name={category.name}
            size="md"
            locale={locale}
            onRename={(name) => {
              updateMenuCategory(category.id, name);
              void fillCategoryTranslations(
                category.id,
                locale === "fr" ? "fr" : "hy",
              );
            }}
          />
          <IconButton
            variant="remove"
            label={t(locale, "deleteSubsection")}
            onClick={() => deleteMenuCategory(category.id)}
          >
            ×
          </IconButton>
        </div>
        <IconButton
          label={t(locale, "addItem")}
          onClick={() => setOpenItem((current) => !current)}
        >
          +
        </IconButton>
      </div>

      {openItem ? (
        <AddItemForm
          categoryId={category.id}
          currency={currency}
          locale={locale}
          onDone={() => setOpenItem(false)}
        />
      ) : null}

      {categoryItems.length === 0 && !openItem ? (
        <p className="mt-4 text-sm text-muted">—</p>
      ) : (
        <ul className="mt-4 flex flex-col">
          {categoryItems.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              currency={currency}
              locale={locale}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function NameForm({
  label,
  locale,
  onSubmit,
  onCancel,
}: {
  label: string;
  locale: Locale;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  return (
    <form
      className="relative mt-6 flex max-w-md flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        onSubmit(String(data.get("name") ?? ""));
      }}
    >
      <label className="flex min-w-[12rem] flex-1 flex-col gap-2">
        <span className="label">{label}</span>
        <input
          name="name"
          required
          autoFocus
          className="border-b border-border bg-transparent py-2 text-sm outline-none focus:border-foreground"
        />
      </label>
      <Button type="submit">{t(locale, "create")}</Button>
      <Button type="button" variant="ghost" onClick={onCancel}>
        {t(locale, "cancel")}
      </Button>
    </form>
  );
}

function CategoryTitle({
  name,
  size,
  locale,
  onRename,
}: {
  name: string;
  size: "lg" | "md";
  locale: Locale;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const textClass =
    size === "lg"
      ? "font-display text-2xl font-medium"
      : "font-display text-xl font-medium text-teal";

  if (editing) {
    return (
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          onRename(String(data.get("name") ?? name));
          setEditing(false);
        }}
      >
        <input
          name="name"
          defaultValue={name}
          autoFocus
          className={`${textClass} border-b border-border bg-transparent outline-none focus:border-foreground`}
        />
        <Button type="submit" variant="ghost">
          {t(locale, "ok")}
        </Button>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={`${textClass} text-left`}
    >
      {name}
    </button>
  );
}

function AddItemForm({
  categoryId,
  currency,
  locale,
  onDone,
}: {
  categoryId: string;
  currency: Currency;
  locale: Locale;
  onDone: () => void;
}) {
  const symbol = getCurrency(currency).symbol;
  return (
    <form
      className="mt-6 grid max-w-2xl gap-4 border-t border-border pt-6 sm:grid-cols-[1fr_8rem_8rem_auto]"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const created = addMenuItem({
          categoryId,
          name: String(data.get("name") ?? ""),
          description: String(data.get("description") ?? ""),
          price: Number(data.get("price") ?? 0),
          priceUnit:
            (String(data.get("unit") ?? "portion") as PriceUnit) || "portion",
        });
        void fillItemTranslations(created.id, locale === "fr" ? "fr" : "hy");
        onDone();
      }}
    >
      <Field label={t(locale, "name")} name="name" required />
      <Field
        label={`${t(locale, "price")} (${symbol})`}
        name="price"
        type="number"
        required
        min={0}
      />
      <label className="flex flex-col gap-2">
        <span className="label">{t(locale, "unit")}</span>
        <select
          name="unit"
          defaultValue="portion"
          className="border-b border-border bg-transparent py-2 text-sm outline-none focus:border-foreground"
        >
          <UnitOptions locale={locale} />
        </select>
      </label>
      <div className="flex items-end gap-2">
        <Button type="submit">{t(locale, "save")}</Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          {t(locale, "cancel")}
        </Button>
      </div>
      <label className="flex flex-col gap-2 sm:col-span-4">
        <span className="label">{t(locale, "description")}</span>
        <textarea
          name="description"
          rows={2}
          placeholder={t(locale, "descriptionHint")}
          className="resize-y border-b border-border bg-transparent py-2 text-sm outline-none focus:border-foreground"
        />
      </label>
    </form>
  );
}

function UnitOptions({ locale }: { locale: Locale }) {
  return (
    <>
      <option value="portion">{t(locale, "perPortion")}</option>
      <option value="unit">{t(locale, "perUnit")}</option>
      <option value="kg">{t(locale, "perKg")}</option>
    </>
  );
}

function ItemRow({
  item,
  currency,
  locale,
}: {
  item: MenuItem;
  currency: Currency;
  locale: Locale;
}) {
  const [editing, setEditing] = useState(false);
  const symbol = getCurrency(currency).symbol;

  if (editing) {
    return (
      <li className="border-t border-border py-5">
        <form
          className="grid max-w-2xl gap-4 sm:grid-cols-[1fr_8rem_8rem_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            updateMenuItem(item.id, {
              name: String(data.get("name") ?? item.name),
              description: String(data.get("description") ?? ""),
              price: Number(data.get("price") ?? item.price),
              priceUnit:
                (String(data.get("unit") ?? item.priceUnit) as PriceUnit) ||
                item.priceUnit,
            });
            void fillItemTranslations(item.id, locale === "fr" ? "fr" : "hy");
            setEditing(false);
          }}
        >
          <Field
            label={t(locale, "name")}
            name="name"
            defaultValue={item.name}
            required
          />
          <Field
            label={`${t(locale, "price")} (${symbol})`}
            name="price"
            type="number"
            min={0}
            defaultValue={String(item.price)}
            required
          />
          <label className="flex flex-col gap-2">
            <span className="label">{t(locale, "unit")}</span>
            <select
              name="unit"
              defaultValue={item.priceUnit}
              className="border-b border-border bg-transparent py-2 text-sm outline-none focus:border-foreground"
            >
              <UnitOptions locale={locale} />
            </select>
          </label>
          <div className="flex items-end gap-2">
            <Button type="submit">{t(locale, "save")}</Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditing(false)}
            >
              {t(locale, "cancel")}
            </Button>
          </div>
          <label className="flex flex-col gap-2 sm:col-span-4">
            <span className="label">{t(locale, "description")}</span>
            <textarea
              name="description"
              rows={2}
              defaultValue={item.description}
              placeholder={t(locale, "descriptionHint")}
              className="resize-y border-b border-border bg-transparent py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-start justify-between gap-4 border-t border-border py-5">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={`min-w-0 flex-1 text-left ${item.active ? "" : "text-muted"}`}
      >
        <span
          className={`text-sm ${item.active ? "" : "line-through"}`}
        >
          {item.name}
        </span>
        {item.description ? (
          <span className="mt-1 block text-[13px] leading-snug text-muted">
            {item.description}
          </span>
        ) : null}
      </button>
      <div className="flex shrink-0 items-baseline gap-3">
        <span className="text-sm tabular-nums text-muted">
          {formatPrice(item.price, item.priceUnit, currency, locale)}
        </span>
        <Button
          variant="ghost"
          onClick={() => updateMenuItem(item.id, { active: !item.active })}
        >
          {item.active ? t(locale, "hide") : t(locale, "show")}
        </Button>
        <IconButton
          variant="remove"
          label={t(locale, "delete")}
          onClick={() => deleteMenuItem(item.id)}
        >
          ×
        </IconButton>
      </div>
    </li>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  min,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  min?: number;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="label">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        min={min}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="border-b border-border bg-transparent py-2 text-sm outline-none focus:border-foreground"
      />
    </label>
  );
}
