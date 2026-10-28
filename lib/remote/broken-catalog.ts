import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { createRealtimeChannel } from "@/lib/supabase/realtime";
import type { BrokenCatalogItem } from "@/types/domain";

type CatalogRow = {
  id: string;
  name: string;
  price: number;
  active: boolean;
  created_at: string;
};

export async function fetchBrokenCatalog(): Promise<BrokenCatalogItem[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("broken_catalog")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) {
    console.warn("[broken-catalog] fetch", error.message);
    return null;
  }
  return ((data ?? []) as CatalogRow[]).map(rowToItem);
}

export async function upsertBrokenCatalogItem(item: BrokenCatalogItem) {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return;
  const { error } = await supabase.from("broken_catalog").upsert({
    id: item.id,
    name: item.name,
    price: item.price,
    active: item.active,
    created_at: item.createdAt,
  });
  if (error) console.warn("[broken-catalog] upsert", error.message);
}

export async function deleteBrokenCatalogItemRemote(itemId: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase
    .from("broken_catalog")
    .delete()
    .eq("id", itemId);
  if (error) console.warn("[broken-catalog] delete", error.message);
}

export async function replaceAllBrokenCatalog(items: BrokenCatalogItem[]) {
  for (const item of items) {
    await upsertBrokenCatalogItem(item);
  }
}

export function subscribeBrokenCatalogTable(onChange: () => void) {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = createRealtimeChannel(supabase, "broken_catalog_table")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "broken_catalog" },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

function rowToItem(row: CatalogRow): BrokenCatalogItem {
  return {
    id: row.id,
    name: typeof row.name === "string" ? row.name : "",
    price: Math.max(0, Math.round(Number(row.price) || 0)),
    active: row.active !== false,
    createdAt: row.created_at,
  };
}
