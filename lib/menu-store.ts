import { id } from "@/lib/format";
import {
  deleteCategories,
  deleteItem,
  fetchMenuRows,
  replaceAllMenu,
  subscribeMenuTables,
  upsertCategory,
  upsertItem,
} from "@/lib/remote/menu";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { waitForSession } from "@/lib/supabase/session";
import { translateToLocales } from "@/lib/translate";
import type {
  Locale,
  MenuCategory,
  MenuItem,
  MenuItemI18n,
  PriceUnit,
} from "@/types/domain";

const storageKey = "siroon:menu:v4";
const legacyKey = "siroon:menu:v3";

type MenuState = {
  categories: MenuCategory[];
  items: MenuItem[];
};

const emptyState: MenuState = { categories: [], items: [] };
let state: MenuState = emptyState;
let ready = false;
let remoteBootstrapped = false;
let bootstrapPromise: Promise<void> | null = null;
let applyingRemote = false;
let unsubscribeRemote: (() => void) | null = null;
let reloadTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

export function subscribeMenu(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getMenuState() {
  return ready ? state : emptyState;
}

export function getServerMenuState() {
  return emptyState;
}

export function getMenuItems() {
  return getMenuState().items;
}

export function getServerMenuItems() {
  return emptyState.items;
}

export function getMenuCategories() {
  return getMenuState().categories;
}

export function getServerMenuCategories() {
  return emptyState.categories;
}

export function getMenuReady() {
  return ready;
}

export function getServerMenuReady() {
  return false;
}

export function ensureMenu() {
  if (ready) return;
  state = read();
  ready = true;
  emit(false);
  void bootstrapRemote();
}

export function addMenuCategory(name: string, parentId: string | null = null) {
  hydrate();
  const siblings = state.categories.filter(
    (category) => category.parentId === parentId,
  );
  const category: MenuCategory = {
    id: id("cat"),
    name: name.trim() || (parentId ? "Sous-section" : "Nouvelle section"),
    i18n: {},
    parentId,
    sortOrder: siblings.length,
  };
  state = {
    ...state,
    categories: [...state.categories, category],
  };
  emit(true);
  void upsertCategory(category);
  return category;
}

export function updateMenuCategory(
  categoryId: string,
  name: string,
  i18n?: MenuCategory["i18n"],
) {
  hydrate();
  let updated: MenuCategory | undefined;
  state = {
    ...state,
    categories: state.categories.map((category) => {
      if (category.id !== categoryId) return category;
      updated = {
        ...category,
        name: name.trim() || category.name,
        i18n: i18n !== undefined ? i18n : category.i18n,
      };
      return updated;
    }),
  };
  emit(true);
  if (updated) void upsertCategory(updated);
}

export function reorderRootCategories(orderedIds: string[]) {
  hydrate();
  const roots = getRootCategories(state.categories);
  if (
    orderedIds.length !== roots.length ||
    !roots.every((category) => orderedIds.includes(category.id))
  ) {
    return;
  }
  const orderMap = new Map(orderedIds.map((id, index) => [id, index]));
  const updated: MenuCategory[] = [];
  state = {
    ...state,
    categories: state.categories.map((category) => {
      if (category.parentId !== null) return category;
      const sortOrder = orderMap.get(category.id);
      if (sortOrder === undefined || category.sortOrder === sortOrder) {
        return category;
      }
      const next = { ...category, sortOrder };
      updated.push(next);
      return next;
    }),
  };
  if (updated.length === 0) return;
  emit(true);
  for (const category of updated) void upsertCategory(category);
}

export function moveRootCategory(categoryId: string, direction: -1 | 1) {
  hydrate();
  const roots = getRootCategories(state.categories);
  const index = roots.findIndex((category) => category.id === categoryId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= roots.length) return;
  const orderedIds = roots.map((category) => category.id);
  const [moved] = orderedIds.splice(index, 1);
  orderedIds.splice(target, 0, moved);
  reorderRootCategories(orderedIds);
}

export function deleteMenuCategory(categoryId: string) {
  hydrate();
  const toRemove = [...collectCategoryIds(categoryId)];
  state = {
    categories: state.categories.filter(
      (category) => !toRemove.includes(category.id),
    ),
    items: state.items.filter((item) => !toRemove.includes(item.categoryId)),
  };
  emit(true);
  void deleteCategories(toRemove);
}

export function normalizeRoomPrices(
  value: MenuItem["roomPrices"] | null | undefined,
): MenuItem["roomPrices"] {
  if (!value || typeof value !== "object") return {};
  const next: MenuItem["roomPrices"] = {};
  for (const roomId of ["hall-1", "hall-2", "hall-3"] as const) {
    const raw = value[roomId];
    if (typeof raw === "number" && Number.isFinite(raw)) {
      next[roomId] = Math.max(0, Math.round(raw));
    }
  }
  return next;
}

export function addMenuItem(input: {
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  priceUnit: PriceUnit;
  roomPrices?: MenuItem["roomPrices"];
  i18n?: MenuItem["i18n"];
}) {
  hydrate();
  const item: MenuItem = {
    id: id("item"),
    categoryId: input.categoryId,
    name: input.name.trim() || "Nouvel aliment",
    description: (input.description ?? "").trim(),
    i18n: input.i18n ?? {},
    price: Math.max(0, Math.round(input.price)),
    roomPrices: normalizeRoomPrices(input.roomPrices),
    priceUnit: input.priceUnit,
    active: true,
    createdAt: new Date().toISOString(),
  };
  state = { ...state, items: [item, ...state.items] };
  emit(true);
  void upsertItem(item);
  return item;
}

export function updateMenuItem(
  itemId: string,
  patch: Partial<
    Pick<
      MenuItem,
      | "name"
      | "description"
      | "i18n"
      | "price"
      | "roomPrices"
      | "priceUnit"
      | "active"
      | "categoryId"
    >
  >,
) {
  hydrate();
  let updated: MenuItem | undefined;
  state = {
    ...state,
    items: state.items.map((item) => {
      if (item.id !== itemId) return item;
      updated = {
        ...item,
        ...patch,
        name:
          patch.name !== undefined
            ? patch.name.trim() || item.name
            : item.name,
        description:
          patch.description !== undefined
            ? patch.description.trim()
            : item.description,
        i18n: patch.i18n !== undefined ? patch.i18n : item.i18n,
        price:
          patch.price !== undefined
            ? Math.max(0, Math.round(patch.price))
            : item.price,
        roomPrices:
          patch.roomPrices !== undefined
            ? normalizeRoomPrices(patch.roomPrices)
            : item.roomPrices,
      };
      return updated;
    }),
  };
  emit(true);
  if (updated) void upsertItem(updated);
}

export function deleteMenuItem(itemId: string) {
  hydrate();
  state = {
    ...state,
    items: state.items.filter((item) => item.id !== itemId),
  };
  emit(true);
  void deleteItem(itemId);
}

export function getCategory(categoryId: string) {
  return getMenuCategories().find((category) => category.id === categoryId);
}

export function getRootCategories(categories: MenuCategory[]) {
  return categories
    .filter((category) => category.parentId === null)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getChildCategories(
  categories: MenuCategory[],
  parentId: string,
) {
  return categories
    .filter((category) => category.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function fillItemTranslations(
  itemId: string,
  from: Locale = "hy",
) {
  hydrate();
  const item = state.items.find((entry) => entry.id === itemId);
  if (!item) return;

  const names = await translateToLocales(item.name, from);
  const descriptions = item.description
    ? await translateToLocales(item.description, from)
    : {};

  const i18n: MenuItem["i18n"] = { ...item.i18n };
  for (const locale of Object.keys(names) as Locale[]) {
    const name = names[locale];
    if (!name) continue;
    i18n[locale] = {
      name,
      description: descriptions[locale] ?? i18n[locale]?.description ?? "",
    };
  }

  updateMenuItem(itemId, { i18n });
}

export async function fillCategoryTranslations(
  categoryId: string,
  from: Locale = "hy",
) {
  hydrate();
  const category = state.categories.find((entry) => entry.id === categoryId);
  if (!category) return;
  const names = await translateToLocales(category.name, from);
  updateMenuCategory(categoryId, category.name, {
    ...category.i18n,
    ...names,
  });
}

export async function translateEntireMenu(from: Locale = "hy") {
  hydrate();
  for (const category of [...state.categories]) {
    await fillCategoryTranslations(category.id, from);
  }
  for (const item of [...state.items]) {
    await fillItemTranslations(item.id, from);
  }
}

function collectCategoryIds(categoryId: string) {
  const ids = new Set<string>([categoryId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const category of state.categories) {
      if (
        category.parentId &&
        ids.has(category.parentId) &&
        !ids.has(category.id)
      ) {
        ids.add(category.id);
        grew = true;
      }
    }
  }
  return ids;
}

function hydrate() {
  if (!ready) {
    state = read();
    ready = true;
  }
}

function read(): MenuState {
  if (typeof localStorage === "undefined") return { categories: [], items: [] };
  try {
    const raw =
      localStorage.getItem(storageKey) ?? localStorage.getItem(legacyKey);
    if (!raw) return { categories: [], items: [] };
    const parsed = JSON.parse(raw) as Partial<MenuState>;
    const categories = Array.isArray(parsed.categories)
      ? parsed.categories.map((category, index) =>
          normalizeCategory(category as Partial<MenuCategory>, index),
        )
      : [];
    const items = Array.isArray(parsed.items)
      ? parsed.items.map((item) => normalizeItem(item as Partial<MenuItem>))
      : [];
    return { categories, items };
  } catch {
    return { categories: [], items: [] };
  }
}

function normalizeCategory(
  category: Partial<MenuCategory>,
  index: number,
): MenuCategory {
  return {
    id: typeof category.id === "string" ? category.id : id("cat"),
    name: typeof category.name === "string" ? category.name : "Section",
    i18n:
      category.i18n && typeof category.i18n === "object" ? category.i18n : {},
    parentId:
      "parentId" in category
        ? ((category.parentId as string | null) ?? null)
        : null,
    sortOrder:
      typeof category.sortOrder === "number" ? category.sortOrder : index,
  };
}

function normalizeItem(item: Partial<MenuItem>): MenuItem {
  const i18n: MenuItem["i18n"] = {};
  if (item.i18n && typeof item.i18n === "object") {
    for (const [locale, value] of Object.entries(item.i18n)) {
      if (!value || typeof value !== "object") continue;
      const entry = value as Partial<MenuItemI18n>;
      i18n[locale as Locale] = {
        name: typeof entry.name === "string" ? entry.name : "",
        description:
          typeof entry.description === "string" ? entry.description : "",
      };
    }
  }

  return {
    id: typeof item.id === "string" ? item.id : id("item"),
    categoryId: typeof item.categoryId === "string" ? item.categoryId : "",
    name: typeof item.name === "string" ? item.name : "Aliment",
    description: typeof item.description === "string" ? item.description : "",
    i18n,
    price: typeof item.price === "number" ? Math.max(0, item.price) : 0,
    roomPrices: normalizeRoomPrices(item.roomPrices),
    priceUnit:
      item.priceUnit === "unit" ||
      item.priceUnit === "kg" ||
      item.priceUnit === "portion"
        ? item.priceUnit
        : "portion",
    active: item.active !== false,
    createdAt:
      typeof item.createdAt === "string"
        ? item.createdAt
        : new Date().toISOString(),
  };
}

function emit(persist: boolean) {
  if (persist && typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }
  for (const listener of listeners) listener();
}

async function bootstrapRemote() {
  if (remoteBootstrapped || !isSupabaseConfigured()) return;
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    if (remoteBootstrapped) return;
    remoteBootstrapped = true;

    // Guest /carte can read without auth; writes need login.
    await waitForSession(1500);

    const remote = await fetchMenuRows();
    if (remote) {
      const remoteEmpty =
        remote.categories.length === 0 && remote.items.length === 0;
      const localHasData =
        state.categories.length > 0 || state.items.length > 0;

      if (remoteEmpty && localHasData) {
        await replaceAllMenu(state.categories, state.items);
      } else if (!remoteEmpty) {
        applyRemote(remote.categories, remote.items);
      }
    }

    if (!unsubscribeRemote) {
      unsubscribeRemote = subscribeMenuTables(() => {
        if (applyingRemote) return;
        if (reloadTimer) clearTimeout(reloadTimer);
        reloadTimer = setTimeout(() => {
          reloadTimer = null;
          void reloadFromRemote();
        }, 300);
      });
    }
  })();

  await bootstrapPromise;
}

async function reloadFromRemote() {
  const remote = await fetchMenuRows();
  if (!remote) return;
  applyRemote(remote.categories, remote.items);
}

function applyRemote(categories: MenuCategory[], items: MenuItem[]) {
  applyingRemote = true;
  state = {
    categories: categories.map((category, index) =>
      normalizeCategory(category, index),
    ),
    items: items.map((item) => normalizeItem(item)),
  };
  emit(true);
  applyingRemote = false;
}
