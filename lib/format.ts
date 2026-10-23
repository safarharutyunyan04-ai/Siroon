import type { Currency, Locale, PriceUnit } from "@/types/domain";
import { getCurrency } from "@/lib/currency";
import { getLocaleMeta, t } from "@/lib/i18n/messages";

export function formatMoney(
  value: number,
  currency: Currency = "AMD",
  locale: Locale = "hy",
) {
  const meta = getCurrency(currency);
  const numberFormat = new Intl.NumberFormat(getLocaleMeta(locale).intl, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
  return `${numberFormat.format(value)} ${meta.symbol}`;
}

/** @deprecated use formatMoney */
export function formatAmd(value: number) {
  return formatMoney(value, "AMD");
}

export function formatPrice(
  value: number,
  unit: PriceUnit,
  currency: Currency = "AMD",
  locale: Locale = "hy",
) {
  const suffix =
    unit === "kg"
      ? " / kg"
      : unit === "portion"
        ? ` / ${locale === "hy" ? "բաժին" : "portion"}`
        : ` / ${locale === "hy" ? "հատ" : "unité"}`;
  return `${formatMoney(value, currency, locale)}${suffix}`;
}

export function priceUnitLabel(unit: PriceUnit, locale: Locale = "hy") {
  if (unit === "kg") return t(locale, "perKg");
  if (unit === "portion") return t(locale, "perPortion");
  return t(locale, "perUnit");
}

export function formatLongDate(isoDate: string, locale: Locale = "hy") {
  const date = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat(getLocaleMeta(locale).intl, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatShortDate(isoDate: string, locale: Locale = "hy") {
  const date = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat(getLocaleMeta(locale).intl, {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function todayIso() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
