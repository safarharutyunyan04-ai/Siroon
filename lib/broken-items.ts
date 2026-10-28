import type { BrokenItem } from "@/types/domain";

export function normalizeBrokenItems(
  value: BrokenItem[] | null | undefined,
): BrokenItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry) => entry && typeof entry.id === "string")
    .map((entry) => ({
      id: entry.id,
      catalogId:
        typeof entry.catalogId === "string" && entry.catalogId
          ? entry.catalogId
          : undefined,
      label: typeof entry.label === "string" ? entry.label.trim() : "",
      unitPrice: Math.max(0, Math.round(Number(entry.unitPrice) || 0)),
      quantity: Math.max(1, Math.round(Number(entry.quantity) || 1)),
      note: typeof entry.note === "string" ? entry.note.trim() : "",
      createdAt:
        typeof entry.createdAt === "string"
          ? entry.createdAt
          : new Date().toISOString(),
    }))
    .filter((entry) => entry.label.length > 0);
}

export function brokenItemAmount(item: BrokenItem): number {
  return Math.max(0, item.unitPrice) * Math.max(0, item.quantity);
}

export function brokenItemsTotal(items: BrokenItem[] | null | undefined): number {
  if (!Array.isArray(items) || items.length === 0) return 0;
  return Math.round(
    items.reduce((sum, item) => sum + brokenItemAmount(item), 0),
  );
}
