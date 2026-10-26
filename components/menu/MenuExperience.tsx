"use client";

import { useState } from "react";
import Link from "next/link";
import { MenuQrCode } from "@/components/carte/MenuQrCode";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { getCurrency } from "@/lib/currency";
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
  moveRootCategory,
  reorderRootCategories,
  translateEntireMenu,
  updateMenuCategory,
  updateMenuItem,
} from "@/lib/menu-store";
import type {
  Currency,
  Locale,
  MenuCategory,
  MenuItem,
  PriceUnit,
} from "@/types/domain";

type MenuTab = "menus" | "qr";

function sectionItems(
  categoryId: string,
  categories: MenuCategory[],
  items: MenuItem[],
) {
  const childIds = getChildCategories(categories, categoryId).map(
    (child) => child.id,
  );
  const allowed = new Set([categoryId, ...childIds]);
  return items.filter((item) => allowed.has(item.categoryId));
}

export function MenuExperience() {
  const { locale } = useLocale();
  const { items, categories, ready } = useMenu();
  const { currency } = useCurrency();
  const [tab, setTab] = useState<MenuTab>("menus");
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [addingSection, setAddingSection] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translateNote, setTranslateNote] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const roots = getRootCategories(categories);
  const selected = roots.find((category) => category.id === sectionId) ?? null;

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
            onClick={() => {
              setTab("menus");
              setSectionId(null);
            }}
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
        selected ? (
          <SectionDetail
            category={selected}
            categories={categories}
            items={items}
            currency={currency}
            locale={locale}
            onBack={() => setSectionId(null)}
            onDeleted={() => setSectionId(null)}
          />
        ) : (
          <div className="mt-6">
            <div className="panel relative overflow-hidden px-4 py-6 sm:px-7 sm:py-7">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(196,92,106,0.1),transparent_50%)]"
              />
              <div className="relative flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="max-w-md text-sm text-muted">
                    {t(locale, "menuSectionsHint")}
                  </p>
                  {translateNote ? (
                    <p className="mt-2 text-[12px] text-accent">
                      {translateNote}
                    </p>
                  ) : null}
                </div>
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
                    setSectionId(created.id);
                  }}
                  onCancel={() => setAddingSection(false)}
                />
              ) : null}
            </div>

            {!ready ? (
              <p className="mt-8 text-sm text-muted">{t(locale, "loading")}</p>
            ) : (
              <div className="mt-8 -mx-3 overflow-x-auto px-3 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:mt-10 sm:-mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
                <div className="flex w-max gap-3 sm:gap-4">
                  {roots.map((category, index) => {
                    const count = sectionItems(
                      category.id,
                      categories,
                      items,
                    ).length;
                    const isDragging = dragId === category.id;
                    const isOver =
                      dragOverId === category.id && dragId !== category.id;
                    return (
                      <div
                        key={category.id}
                        draggable
                        onDragStart={() => setDragId(category.id)}
                        onDragEnd={() => {
                          setDragId(null);
                          setDragOverId(null);
                        }}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDragOverId(category.id);
                        }}
                        onDragLeave={() => {
                          setDragOverId((current) =>
                            current === category.id ? null : current,
                          );
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          if (!dragId || dragId === category.id) {
                            setDragId(null);
                            setDragOverId(null);
                            return;
                          }
                          const orderedIds = roots.map((entry) => entry.id);
                          const from = orderedIds.indexOf(dragId);
                          const to = orderedIds.indexOf(category.id);
                          if (from < 0 || to < 0) return;
                          orderedIds.splice(from, 1);
                          orderedIds.splice(to, 0, dragId);
                          reorderRootCategories(orderedIds);
                          setDragId(null);
                          setDragOverId(null);
                        }}
                        className={`relative flex h-72 w-72 shrink-0 flex-col rounded-[20px] border bg-[linear-gradient(160deg,#fffaf8_0%,#faf0f2_100%)] shadow-[0_8px_24px_rgba(26,21,16,0.04)] transition-[transform,border-color,box-shadow,opacity] duration-[var(--duration)] sm:h-80 sm:w-80 ${
                          isDragging
                            ? "border-accent/50 opacity-55"
                            : isOver
                              ? "border-accent -translate-y-0.5 shadow-[0_12px_28px_rgba(163,68,84,0.14)]"
                              : "border-border/80 hover:-translate-y-0.5 hover:border-accent/35 hover:shadow-[0_12px_28px_rgba(163,68,84,0.12)]"
                        }`}
                      >
                        <div className="flex items-center justify-between px-4 pt-4 sm:px-5 sm:pt-5">
                          <span className="label text-muted/80">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              aria-label={t(locale, "moveSectionLeft")}
                              disabled={index === 0}
                              onClick={(event) => {
                                event.stopPropagation();
                                moveRootCategory(category.id, -1);
                              }}
                              className="flex h-9 w-9 items-center justify-center rounded-[10px] text-lg text-muted transition-colors hover:bg-white/80 hover:text-foreground disabled:opacity-25"
                            >
                              ‹
                            </button>
                            <button
                              type="button"
                              aria-label={t(locale, "moveSectionRight")}
                              disabled={index === roots.length - 1}
                              onClick={(event) => {
                                event.stopPropagation();
                                moveRootCategory(category.id, 1);
                              }}
                              className="flex h-9 w-9 items-center justify-center rounded-[10px] text-lg text-muted transition-colors hover:bg-white/80 hover:text-foreground disabled:opacity-25"
                            >
                              ›
                            </button>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSectionId(category.id)}
                          className="flex min-h-0 flex-1 flex-col justify-end p-5 pt-2 text-left sm:p-6 sm:pt-2"
                        >
                          <span className="font-display line-clamp-3 text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
                            {category.name}
                          </span>
                          <span className="mt-3 block text-sm text-muted">
                            {count}{" "}
                            {count === 1
                              ? t(locale, "menuItemOne")
                              : t(locale, "menuItemMany")}
                          </span>
                        </button>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setAddingSection(true)}
                    className="flex h-72 w-72 shrink-0 flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-border/90 bg-white/50 text-muted transition-[transform,border-color,color,background-color] duration-[var(--duration)] hover:-translate-y-0.5 hover:border-accent/40 hover:bg-accent-soft/40 hover:text-foreground sm:h-80 sm:w-80"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-current text-3xl leading-none">
                      +
                    </span>
                    <span className="px-3 text-center text-sm font-medium tracking-[0.04em]">
                      {t(locale, "addSection")}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      ) : null}

      {tab === "qr" ? <MenuQrCode className="mt-6" /> : null}
    </div>
  );
}

function SectionDetail({
  category,
  categories,
  items,
  currency,
  locale,
  onBack,
  onDeleted,
}: {
  category: MenuCategory;
  categories: MenuCategory[];
  items: MenuItem[];
  currency: Currency;
  locale: Locale;
  onBack: () => void;
  onDeleted: () => void;
}) {
  const [openItem, setOpenItem] = useState(false);
  const list = sectionItems(category.id, categories, items);

  return (
    <div className="mt-6 animate-rise">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex text-[13px] font-medium text-muted transition-colors hover:text-foreground"
      >
        {t(locale, "menuTabMenus")}
      </button>

      <section className="panel mt-5 overflow-hidden px-5 py-6 sm:mt-6 sm:px-7 sm:py-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="label">{t(locale, "section")}</p>
            <div className="mt-2 flex min-w-0 items-center gap-1">
              <CategoryTitle
                name={category.name}
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
                onClick={() => {
                  if (
                    typeof window !== "undefined" &&
                    !window.confirm(t(locale, "deleteSection") + " ?")
                  ) {
                    return;
                  }
                  deleteMenuCategory(category.id);
                  onDeleted();
                }}
              >
                ×
              </IconButton>
            </div>
            <div className="menu-section-rule mt-4" aria-hidden />
          </div>
          {!openItem ? (
            <Button
              type="button"
              onClick={() => setOpenItem(true)}
            >
              {t(locale, "addItem")}
            </Button>
          ) : null}
        </header>

        {list.length > 0 ? (
          <ul className="mt-2 flex flex-col">
            {list.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                currency={currency}
                locale={locale}
              />
            ))}
          </ul>
        ) : !openItem ? (
          <p className="mt-8 text-sm text-muted">{t(locale, "menuSectionEmpty")}</p>
        ) : null}

        {openItem ? (
          <AddItemForm
            categoryId={category.id}
            currency={currency}
            locale={locale}
            onDone={() => setOpenItem(false)}
          />
        ) : null}
      </section>
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
  locale,
  onRename,
}: {
  name: string;
  locale: Locale;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const textClass =
    "font-display text-2xl font-medium tracking-tight sm:text-[1.75rem]";

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
        <span className={`text-sm ${item.active ? "" : "line-through"}`}>
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
