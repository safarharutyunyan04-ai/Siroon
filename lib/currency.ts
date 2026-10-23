import type { Currency } from "@/types/domain";

export const currencies: {
  id: Currency;
  label: string;
  symbol: string;
}[] = [
  { id: "AMD", label: "AMD", symbol: "֏" },
  { id: "USD", label: "Dollar", symbol: "$" },
  { id: "EUR", label: "Euro", symbol: "€" },
  { id: "RUB", label: "Rouble", symbol: "₽" },
];

export function getCurrency(id: Currency) {
  return currencies.find((entry) => entry.id === id) ?? currencies[0];
}
