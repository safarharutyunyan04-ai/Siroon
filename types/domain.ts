export type PriceUnit = "unit" | "kg" | "portion";

export type Currency = "AMD" | "USD" | "EUR" | "RUB";

export type Locale = "hy" | "fr" | "en" | "ru";

export type MenuCategory = {
  id: string;
  name: string;
  /** Translated names keyed by locale */
  i18n: Partial<Record<Locale, string>>;
  parentId: string | null;
  sortOrder: number;
};

export type MenuItemI18n = {
  name: string;
  description: string;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  /** Translated name/description keyed by locale */
  i18n: Partial<Record<Locale, MenuItemI18n>>;
  price: number;
  priceUnit: PriceUnit;
  active: boolean;
  createdAt: string;
};

export type RoomId = "hall-1" | "hall-2" | "hall-3";

export type EventStatus = "draft" | "confirmed" | "done" | "cancelled";

export type EventLine = {
  itemId: string;
  quantity: number;
};

export type DiscountKind = "none" | "percent" | "amount";

export type EventDiscount = {
  kind: DiscountKind;
  value: number;
};

export type PriceRuleKind = "amount" | "percent";

export type PriceRule = {
  id: string;
  label: string;
  kind: PriceRuleKind;
  value: number;
};

export type VenueEvent = {
  id: string;
  title: string;
  contact: string;
  date: string;
  startTime: string;
  guests: number;
  roomId: RoomId;
  status: EventStatus;
  notes: string;
  lines: EventLine[];
  discount: EventDiscount;
  priceRules: PriceRule[];
  createdAt: string;
  updatedAt: string;
};

