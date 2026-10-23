import { t } from "@/lib/i18n/messages";
import type { Locale, SeatingTable } from "@/types/domain";

export function tableLabel(table: SeatingTable, locale: Locale) {
  if (table.kind === "bridal") return t(locale, "bridalTable");
  if (table.kind === "head12") return t(locale, "headTable");
  return `${t(locale, "table")} ${table.number}`;
}
