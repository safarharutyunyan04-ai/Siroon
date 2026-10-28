import { id } from "@/lib/format";
import { t } from "@/lib/i18n/messages";
import {
  deleteBrokenCatalogItemRemote,
  fetchBrokenCatalog,
  replaceAllBrokenCatalog,
  subscribeBrokenCatalogTable,
  upsertBrokenCatalogItem,
} from "@/lib/remote/broken-catalog";
import { getSettings } from "@/lib/settings-store";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { waitForSession } from "@/lib/supabase/session";
import type { BrokenCatalogItem } from "@/types/domain";

const storageKey = "siroon:broken-catalog:v1";

let items: BrokenCatalogItem[] = [];
const empty: BrokenCatalogItem[] = [];
let ready = false;
let remoteBootstrapped = false;
let bootstrapPromise: Promise<void> | null = null;
let applyingRemote = false;
let unsubscribeRemote: (() => void) | null = null;
let reloadTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

export function subscribeBrokenCatalog(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getBrokenCatalog() {
  return ready ? items : empty;
}

export function getServerBrokenCatalog() {
  return empty;
}

export function getBrokenCatalogReady() {
  return ready;
}

export function getServerBrokenCatalogReady() {
  return false;
}

export function ensureBrokenCatalog() {
  if (ready) return;
  items = read();
  ready = true;
  emit(false);
  void bootstrapRemote();
}

export function addBrokenCatalogItem(input: { name: string; price: number }) {
  hydrate();
  const item: BrokenCatalogItem = {
    id: id("bcat"),
    name:
      input.name.trim() ||
      t(getSettings().locale, "defaultBrokenCatalogItem"),
    price: Math.max(0, Math.round(Number(input.price) || 0)),
    active: true,
    createdAt: new Date().toISOString(),
  };
  items = [...items, item];
  emit(true);
  void upsertBrokenCatalogItem(item);
  return item;
}

export function updateBrokenCatalogItem(
  itemId: string,
  patch: Partial<Pick<BrokenCatalogItem, "name" | "price" | "active">>,
) {
  hydrate();
  let updated: BrokenCatalogItem | undefined;
  items = items.map((item) => {
    if (item.id !== itemId) return item;
    updated = {
      ...item,
      name:
        patch.name !== undefined
          ? patch.name.trim() || item.name
          : item.name,
      price:
        patch.price !== undefined
          ? Math.max(0, Math.round(Number(patch.price) || 0))
          : item.price,
      active: patch.active !== undefined ? patch.active : item.active,
    };
    return updated;
  });
  emit(true);
  if (updated) void upsertBrokenCatalogItem(updated);
}

export function deleteBrokenCatalogItem(itemId: string) {
  hydrate();
  items = items.filter((item) => item.id !== itemId);
  emit(true);
  void deleteBrokenCatalogItemRemote(itemId);
}

function hydrate() {
  if (!ready) {
    items = read();
    ready = true;
  }
}

function normalizeItem(
  raw: Partial<BrokenCatalogItem>,
): BrokenCatalogItem | null {
  if (!raw || typeof raw.id !== "string") return null;
  return {
    id: raw.id,
    name: typeof raw.name === "string" ? raw.name : "",
    price: Math.max(0, Math.round(Number(raw.price) || 0)),
    active: raw.active !== false,
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date().toISOString(),
  };
}

function read(): BrokenCatalogItem[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<BrokenCatalogItem>[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => normalizeItem(entry))
      .filter((entry): entry is BrokenCatalogItem => entry !== null);
  } catch {
    return [];
  }
}

function emit(persist: boolean) {
  if (persist && typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
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
    const session = await waitForSession();
    if (!session || remoteBootstrapped) return;
    remoteBootstrapped = true;

    const remote = await fetchBrokenCatalog();
    if (remote) {
      if (remote.length === 0 && items.length > 0) {
        await replaceAllBrokenCatalog(items);
      } else if (remote.length > 0) {
        applyRemote(remote);
      }
    }

    if (!unsubscribeRemote) {
      unsubscribeRemote = subscribeBrokenCatalogTable(() => {
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
  const remote = await fetchBrokenCatalog();
  if (!remote) return;
  applyRemote(remote);
}

function applyRemote(remoteItems: BrokenCatalogItem[]) {
  applyingRemote = true;
  items = remoteItems
    .map((entry) => normalizeItem(entry))
    .filter((entry): entry is BrokenCatalogItem => entry !== null);
  emit(true);
  applyingRemote = false;
}
