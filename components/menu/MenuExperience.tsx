"use client";

import { useState } from "react";
import Link from "next/link";
import { MenuQrCode } from "@/components/carte/MenuQrCode";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { IconButton } from "@/components/ui/IconButton";
import { getCurrency } from "@/lib/currency";
import { formatPrice } from "@/lib/format";
import { t } from "@/lib/i18n/messages";
import { useCurrency, useLocale, useMenu } from "@/lib/hooks";
import { hasRoomPrices } from "@/lib/pricing";
import {
  addMenuCategory,
  addMenuItem,
  deleteMenuCategory,
  deleteMenuItem,
  getChildCategories,
  getRootCategories,
  moveRootCategory,
  normalizeRoomPrices,
  reorderRootCategories,
  updateMenuCategory,
  updateMenuItem,
} from "@/lib/menu-store";
import { rooms } from "@/lib/rooms";
import type {
  Currency,
  Locale,
  MenuCategory,
  MenuItem,
  PriceUnit,
  RoomId,
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
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const roots = getRootCategories(categories);
  const selected = roots.find((category) => category.id === sectionId) ?? null;

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
            {addingSection ? (
              <div className="mb-4">
                <NameForm
                  label={t(locale, "section")}
                  locale={locale}
                  onSubmit={(name) => {
                    const created = addMenuCategory(name);
                    setAddingSection(false);
                    setSectionId(created.id);
                  }}
                  onCancel={() => setAddingSection(false)}
                />
              </div>
            ) : null}

            {!ready ? (
              <p className="mt-8 text-sm text-muted">{t(locale, "loading")}</p>
            ) : (
              <div className="mt-2 -mx-3 overflow-x-auto px-3 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:mt-4 sm:-mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
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
                        className={`relative flex h-[15.3rem] w-[15.3rem] shrink-0 flex-col rounded-[18px] border bg-[linear-gradient(160deg,#fffaf8_0%,#faf0f2_100%)] shadow-[0_8px_24px_rgba(26,21,16,0.04)] transition-[transform,border-color,box-shadow,opacity] duration-[var(--duration)] sm:h-[17rem] sm:w-[17rem] ${
                          isDragging
                            ? "border-accent/50 opacity-55"
                            : isOver
                              ? "border-accent -translate-y-0.5 shadow-[0_12px_28px_rgba(163,68,84,0.14)]"
                              : "border-border/80 hover:-translate-y-0.5 hover:border-accent/35 hover:shadow-[0_12px_28px_rgba(163,68,84,0.12)]"
                        }`}
                      >
                        <div className="flex items-center justify-between px-3.5 pt-3.5 sm:px-4 sm:pt-4">
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
                              className="flex h-8 w-8 items-center justify-center rounded-[9px] text-base text-muted transition-colors hover:bg-white/80 hover:text-foreground disabled:opacity-25"
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
                              className="flex h-8 w-8 items-center justify-center rounded-[9px] text-base text-muted transition-colors hover:bg-white/80 hover:text-foreground disabled:opacity-25"
                            >
                              ›
                            </button>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSectionId(category.id)}
                          className="flex min-h-0 flex-1 flex-col justify-end p-4 pt-2 text-left sm:p-5 sm:pt-2"
                        >
                          <span className="font-display line-clamp-3 text-xl font-medium tracking-tight text-foreground sm:text-2xl">
                            {category.name}
                          </span>
                          <span className="mt-2.5 block text-sm text-muted">
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
                    className="flex h-[15.3rem] w-[15.3rem] shrink-0 flex-col items-center justify-center gap-3 rounded-[18px] border border-dashed border-border/90 bg-white/50 text-muted transition-[transform,border-color,color,background-color] duration-[var(--duration)] hover:-translate-y-0.5 hover:border-accent/40 hover:bg-accent-soft/40 hover:text-foreground sm:h-[17rem] sm:w-[17rem]"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-current text-3xl leading-none">
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
  const [addingSub, setAddingSub] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const children = getChildCategories(categories, category.id);
  const directItems = items.filter((item) => item.categoryId === category.id);
  const isEmpty =
    directItems.length === 0 &&
    children.length === 0 &&
    !openItem &&
    !addingSub;

  return (
    <div className="mt-6 animate-rise pb-28">
      <Button type="button" variant="ghost" size="sm" onClick={onBack}>
        <span aria-hidden>←</span>
        {t(locale, "backToSections")}
      </Button>

      <ConfirmDialog
        open={confirmDelete}
        title={t(locale, "confirmDeleteSection")}
        description={t(locale, "confirmIrreversible")}
        confirmLabel={t(locale, "deleteSection")}
        cancelLabel={t(locale, "cancel")}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          deleteMenuCategory(category.id);
          onDeleted();
        }}
      />

      <section className="panel mt-5 overflow-hidden px-5 py-6 sm:mt-6 sm:px-7 sm:py-8">
        <header>
          <p className="label">{t(locale, "section")}</p>
          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
            <CategoryTitle
              name={category.name}
              size="lg"
              locale={locale}
              onRename={(name) => updateMenuCategory(category.id, name)}
            />
            <Button
              size="sm"
              variant="danger"
              onClick={() => setConfirmDelete(true)}
            >
              {t(locale, "deleteSection")}
            </Button>
          </div>
          <div className="menu-section-rule mt-4" aria-hidden />
        </header>

        {directItems.length > 0 ? (
          <ul className="mt-2 flex flex-col">
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
          <div className="mt-8 flex flex-col gap-5 sm:mt-10 sm:gap-6">
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

        {isEmpty ? (
          <p className="mt-8 text-sm text-muted">{t(locale, "menuSectionEmpty")}</p>
        ) : null}
      </section>

      <div className="sticky bottom-3 z-20 mt-4">
        {openItem ? (
          <div className="rounded-[16px] border border-border/80 bg-surface-raised/95 p-4 shadow-[0_12px_36px_rgba(26,21,16,0.12)] backdrop-blur-xl sm:p-5">
            <AddItemForm
              categoryId={category.id}
              currency={currency}
              locale={locale}
              onDone={() => setOpenItem(false)}
              compact
            />
          </div>
        ) : addingSub ? (
          <div className="rounded-[16px] border border-border/80 bg-surface-raised/95 px-4 py-3 shadow-[0_12px_36px_rgba(26,21,16,0.12)] backdrop-blur-xl sm:px-5">
            <NameForm
              label={t(locale, "subsection")}
              locale={locale}
              onSubmit={(name) => {
                addMenuCategory(name, category.id);
                setAddingSub(false);
              }}
              onCancel={() => setAddingSub(false)}
            />
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 rounded-[16px] border border-border/80 bg-surface-raised/95 p-3 shadow-[0_12px_36px_rgba(26,21,16,0.12)] backdrop-blur-xl">
            <Button
              size="sm"
              onClick={() => {
                setOpenItem(true);
                setAddingSub(false);
              }}
            >
              {t(locale, "addItem")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAddingSub(true);
                setOpenItem(false);
              }}
            >
              {t(locale, "addSubsection")}
            </Button>
          </div>
        )}
      </div>
    </div>
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const categoryItems = items.filter((item) => item.categoryId === category.id);

  return (
    <div className="rounded-[14px] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(250,240,242,0.35))] px-4 py-5 ring-1 ring-border/70 sm:px-5 sm:py-6">
      <ConfirmDialog
        open={confirmDelete}
        title={t(locale, "confirmDeleteSubsection")}
        description={t(locale, "confirmIrreversible")}
        confirmLabel={t(locale, "deleteSubsection")}
        cancelLabel={t(locale, "cancel")}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          deleteMenuCategory(category.id);
        }}
      />
      <header>
        <p className="label text-teal">{t(locale, "subsection")}</p>
        <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-2">
          <CategoryTitle
            name={category.name}
            size="md"
            locale={locale}
            onRename={(name) => updateMenuCategory(category.id, name)}
          />
          <Button
            size="sm"
            variant="danger"
            onClick={() => setConfirmDelete(true)}
          >
            {t(locale, "deleteSubsection")}
          </Button>
        </div>
      </header>

      {categoryItems.length > 0 ? (
        <ul className="mt-1 flex flex-col">
          {categoryItems.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              currency={currency}
              locale={locale}
            />
          ))}
        </ul>
      ) : !openItem ? (
        <p className="mt-4 text-sm text-muted">—</p>
      ) : null}

      {openItem ? (
        <AddItemForm
          categoryId={category.id}
          currency={currency}
          locale={locale}
          onDone={() => setOpenItem(false)}
        />
      ) : (
        <div className="mt-4">
          <Button size="sm" variant="ghost" onClick={() => setOpenItem(true)}>
            {t(locale, "addItem")}
          </Button>
        </div>
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
      className="relative flex max-w-md flex-wrap items-end gap-3"
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
  size = "lg",
  locale,
  onRename,
}: {
  name: string;
  size?: "lg" | "md";
  locale: Locale;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const textClass =
    size === "lg"
      ? "font-display text-2xl font-medium tracking-tight sm:text-[1.75rem]"
      : "font-display text-xl font-medium tracking-tight text-teal sm:text-[1.35rem]";

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

function readRoomPricesFromForm(data: FormData): MenuItem["roomPrices"] {
  if (data.get("priceByRoom") !== "on") return {};
  const roomPrices: MenuItem["roomPrices"] = {};
  for (const room of rooms) {
    const raw = data.get(`price-${room.id}`);
    if (raw === null || String(raw).trim() === "") continue;
    const value = Number(raw);
    if (Number.isFinite(value)) roomPrices[room.id] = Math.max(0, value);
  }
  return normalizeRoomPrices(roomPrices);
}

function AddItemForm({
  categoryId,
  currency,
  locale,
  onDone,
  compact = false,
}: {
  categoryId: string;
  currency: Currency;
  locale: Locale;
  onDone: () => void;
  compact?: boolean;
}) {
  const symbol = getCurrency(currency).symbol;
  const [byRoom, setByRoom] = useState(false);
  return (
    <form
      className={`grid max-w-2xl gap-4 sm:grid-cols-[1fr_8rem_8rem_auto] ${
        compact ? "" : "mt-6 border-t border-border pt-6"
      }`}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const roomPrices = readRoomPricesFromForm(data);
        addMenuItem({
          categoryId,
          name: String(data.get("name") ?? ""),
          description: String(data.get("description") ?? ""),
          price: Number(data.get("price") ?? 0),
          priceUnit:
            (String(data.get("unit") ?? "portion") as PriceUnit) || "portion",
          roomPrices,
        });
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
      <RoomPriceFields
        locale={locale}
        symbol={symbol}
        enabled={byRoom}
        onEnabledChange={setByRoom}
      />
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
  const [byRoom, setByRoom] = useState(() => hasRoomPrices(item));
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
              roomPrices: readRoomPricesFromForm(data),
            });
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
          <RoomPriceFields
            locale={locale}
            symbol={symbol}
            enabled={byRoom}
            onEnabledChange={setByRoom}
            defaults={item.roomPrices}
            fallbackPrice={item.price}
          />
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-start justify-between gap-4 border-t border-border py-5">
      <button
        type="button"
        onClick={() => {
          setByRoom(hasRoomPrices(item));
          setEditing(true);
        }}
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
        {hasRoomPrices(item) ? (
          <span className="mt-1 block text-[12px] text-teal">
            {t(locale, "priceByRoom")}
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

function RoomPriceFields({
  locale,
  symbol,
  enabled,
  onEnabledChange,
  defaults,
  fallbackPrice = 0,
}: {
  locale: Locale;
  symbol: string;
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  defaults?: Partial<Record<RoomId, number>>;
  fallbackPrice?: number;
}) {
  return (
    <div className="sm:col-span-4">
      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          name="priceByRoom"
          checked={enabled}
          onChange={(change) => onEnabledChange(change.target.checked)}
          className="mt-1"
        />
        <span>
          <span className="block text-sm font-medium text-foreground">
            {t(locale, "priceByRoom")}
          </span>
          <span className="mt-0.5 block text-[12px] text-muted">
            {t(locale, "priceByRoomHint")}
          </span>
        </span>
      </label>
      {enabled ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {rooms.map((room) => (
            <label key={room.id} className="flex flex-col gap-2">
              <span className="label">{t(locale, room.nameKey)}</span>
              <input
                name={`price-${room.id}`}
                type="number"
                min={0}
                defaultValue={String(
                  defaults?.[room.id] ?? fallbackPrice ?? "",
                )}
                required
                className="border-b border-border bg-transparent py-2 text-sm tabular-nums outline-none focus:border-foreground"
              />
              <span className="text-[11px] text-muted">{symbol}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
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
