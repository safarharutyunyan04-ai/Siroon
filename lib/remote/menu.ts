import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { createRealtimeChannel } from "@/lib/supabase/realtime";
import type { MenuCategory, MenuItem } from "@/types/domain";

type CategoryRow = {
  id: string;
  name: string;
  i18n: MenuCategory["i18n"];
  parent_id: string | null;
  sort_order: number;
};

type ItemRow = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  i18n: MenuItem["i18n"];
  price: number;
  price_unit: MenuItem["priceUnit"];
  room_prices?: MenuItem["roomPrices"] | null;
  active: boolean;
  created_at: string;
};

export async function fetchMenuRows(): Promise<{
  categories: MenuCategory[];
  items: MenuItem[];
} | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const [cats, items] = await Promise.all([
    supabase.from("menu_categories").select("*").order("sort_order"),
    supabase.from("menu_items").select("*"),
  ]);

  if (cats.error) {
    console.warn("[menu] categories fetch", cats.error.message);
    return null;
  }
  if (items.error) {
    console.warn("[menu] items fetch", items.error.message);
    return null;
  }

  return {
    categories: ((cats.data ?? []) as CategoryRow[]).map(rowToCategory),
    items: ((items.data ?? []) as ItemRow[]).map(rowToItem),
  };
}

export async function upsertCategory(category: MenuCategory) {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return;
  const { error } = await supabase.from("menu_categories").upsert({
    id: category.id,
    name: category.name,
    i18n: category.i18n ?? {},
    parent_id: category.parentId,
    sort_order: category.sortOrder,
  });
  if (error) console.warn("[menu] upsert category", error.message);
}

export async function deleteCategories(ids: string[]) {
  const supabase = getSupabase();
  if (!supabase || ids.length === 0) return;
  const { error } = await supabase
    .from("menu_categories")
    .delete()
    .in("id", ids);
  if (error) console.warn("[menu] delete categories", error.message);
}

export async function upsertItem(item: MenuItem) {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return;
  const { error } = await supabase.from("menu_items").upsert({
    id: item.id,
    category_id: item.categoryId,
    name: item.name,
    description: item.description,
    i18n: item.i18n ?? {},
    price: item.price,
    price_unit: item.priceUnit,
    room_prices: item.roomPrices ?? {},
    active: item.active,
    created_at: item.createdAt,
  });
  if (error) console.warn("[menu] upsert item", error.message);
}

export async function deleteItem(itemId: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("menu_items").delete().eq("id", itemId);
  if (error) console.warn("[menu] delete item", error.message);
}

export async function replaceAllMenu(
  categories: MenuCategory[],
  items: MenuItem[],
) {
  const supabase = getSupabase();
  if (!supabase) return;
  // Parents first (null parent_id), then children
  const roots = categories.filter((c) => !c.parentId);
  const children = categories.filter((c) => c.parentId);
  for (const category of [...roots, ...children]) {
    await upsertCategory(category);
  }
  for (const item of items) {
    await upsertItem(item);
  }
}

export function subscribeMenuTables(onChange: () => void) {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = createRealtimeChannel(supabase, "menu_tables")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "menu_categories" },
      () => onChange(),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "menu_items" },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

function rowToCategory(row: CategoryRow): MenuCategory {
  return {
    id: row.id,
    name: row.name,
    i18n: row.i18n && typeof row.i18n === "object" ? row.i18n : {},
    parentId: row.parent_id,
    sortOrder: row.sort_order,
  };
}

function rowToItem(row: ItemRow): MenuItem {
  const roomPricesRaw =
    row.room_prices && typeof row.room_prices === "object"
      ? row.room_prices
      : {};
  const roomPrices: MenuItem["roomPrices"] = {};
  for (const roomId of ["hall-1", "hall-2", "hall-3"] as const) {
    const value = Number(roomPricesRaw[roomId]);
    if (Number.isFinite(value)) roomPrices[roomId] = Math.max(0, value);
  }
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description ?? "",
    i18n: row.i18n && typeof row.i18n === "object" ? row.i18n : {},
    price: Number(row.price) || 0,
    roomPrices,
    priceUnit:
      row.price_unit === "unit" ||
      row.price_unit === "kg" ||
      row.price_unit === "portion"
        ? row.price_unit
        : "portion",
    active: row.active !== false,
    createdAt: row.created_at,
  };
}
