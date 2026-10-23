import type {
  Currency,
  EventDiscount,
  MenuItem,
  PriceRule,
  VenueEvent,
} from "@/types/domain";
import { formatMoney } from "@/lib/format";

export type QuoteLine = {
  itemId: string;
  name: string;
  categoryId: string;
  quantity: number;
  unitPrice: number;
  priceUnit: MenuItem["priceUnit"];
  amount: number;
  explanation: string;
};

export type QuoteRule = {
  id: string;
  label: string;
  kind: PriceRule["kind"];
  value: number;
  amount: number;
};

export type EventQuote = {
  lines: QuoteLine[];
  subtotal: number;
  rules: QuoteRule[];
  rulesTotal: number;
  discount: EventDiscount;
  discountAmount: number;
  total: number;
};

export const emptyDiscount: EventDiscount = { kind: "none", value: 0 };

export function normalizeDiscount(
  discount: Partial<EventDiscount> | null | undefined,
): EventDiscount {
  if (!discount || discount.kind === "none" || !discount.kind) {
    return emptyDiscount;
  }
  if (discount.kind === "percent") {
    return {
      kind: "percent",
      value: Math.max(0, Math.min(100, Number(discount.value) || 0)),
    };
  }
  if (discount.kind === "amount") {
    return {
      kind: "amount",
      value: Math.max(0, Number(discount.value) || 0),
    };
  }
  return emptyDiscount;
}

export function normalizePriceRules(
  rules: Partial<PriceRule>[] | null | undefined,
): PriceRule[] {
  if (!Array.isArray(rules)) return [];
  return rules
    .filter((rule) => rule && typeof rule.id === "string")
    .map((rule) => ({
      id: rule.id as string,
      label: typeof rule.label === "string" ? rule.label : "",
      kind: rule.kind === "percent" ? "percent" : "amount",
      value: Number(rule.value) || 0,
    }));
}

export function quoteEvent(
  event: Pick<VenueEvent, "lines" | "discount" | "priceRules">,
  menu: MenuItem[],
  currency: Currency = "AMD",
): EventQuote {
  const byId = new Map(menu.map((item) => [item.id, item]));
  const lines: QuoteLine[] = [];

  for (const line of event.lines) {
    const item = byId.get(line.itemId);
    if (!item || !item.active) continue;
    const quantity = Math.max(0, line.quantity);
    if (quantity <= 0) continue;
    const amount = item.price * quantity;
    const unit = formatMoney(item.price, currency);
    lines.push({
      itemId: item.id,
      name: item.name,
      categoryId: item.categoryId,
      quantity,
      unitPrice: item.price,
      priceUnit: item.priceUnit,
      amount,
      explanation:
        item.priceUnit === "kg"
          ? `${quantity} kg × ${unit}`
          : item.priceUnit === "portion"
            ? `${quantity} portion${quantity > 1 ? "s" : ""} × ${unit}`
            : `${quantity} × ${unit}`,
    });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const discount = normalizeDiscount(event.discount);
  const priceRules = normalizePriceRules(event.priceRules);

  const rules: QuoteRule[] = priceRules.map((rule) => {
    const amount =
      rule.kind === "percent"
        ? (subtotal * rule.value) / 100
        : rule.value;
    return {
      id: rule.id,
      label: rule.label.trim() || "—",
      kind: rule.kind,
      value: rule.value,
      amount,
    };
  });

  const rulesTotal = rules.reduce((sum, rule) => sum + rule.amount, 0);
  const afterRules = subtotal + rulesTotal;

  const discountAmount =
    discount.kind === "percent"
      ? (afterRules * discount.value) / 100
      : discount.kind === "amount"
        ? Math.min(discount.value, Math.max(0, afterRules))
        : 0;

  const total = Math.max(0, Math.round(afterRules - discountAmount));

  return {
    lines,
    subtotal: Math.round(subtotal),
    rules,
    rulesTotal: Math.round(rulesTotal),
    discount,
    discountAmount: Math.round(discountAmount),
    total,
  };
}
