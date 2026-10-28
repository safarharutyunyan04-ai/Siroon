import type { BrokenItem } from "@/types/domain";

export function normalizeBrokenItems(
  value: BrokenItem[] | null | undefined,
): BrokenItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry) => entry && typeof entry.id === "string")
    .map((entry) => ({
      id: entry.id,
      label: typeof entry.label === "string" ? entry.label.trim() : "",
      quantity: Math.max(1, Math.round(Number(entry.quantity) || 1)),
      note: typeof entry.note === "string" ? entry.note.trim() : "",
      createdAt:
        typeof entry.createdAt === "string"
          ? entry.createdAt
          : new Date().toISOString(),
    }))
    .filter((entry) => entry.label.length > 0);
}
