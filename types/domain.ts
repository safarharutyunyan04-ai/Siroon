export type PriceUnit = "unit" | "kg" | "portion";

export type Currency = "AMD" | "USD" | "EUR" | "RUB";

export type Locale = "hy" | "fr";

export type MenuCategory = {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
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

export type SeatZone = "top" | "bottom" | "center";

export type TableKind = "standard" | "head12" | "bridal";

export type Seat = {
  id: string;
  label: string;
};

export type SeatingTable = {
  id: string;
  number: number;
  kind: TableKind;
  zone: SeatZone;
  seats: Seat[];
};

export type SeatingPlan = {
  eventId: string;
  roomId: RoomId;
  tables: SeatingTable[];
  updatedAt: string;
};
