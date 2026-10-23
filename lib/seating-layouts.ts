import type { RoomId, Seat, SeatingTable, SeatZone, TableKind } from "@/types/domain";

function seats(count: number, tableId: string): Seat[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${tableId}-s${index + 1}`,
    label: "",
  }));
}

function table(
  id: string,
  number: number,
  kind: TableKind,
  zone: SeatZone,
  seatCount: number,
): SeatingTable {
  return {
    id,
    number,
    kind,
    zone,
    seats: seats(seatCount, id),
  };
}

/** Fixed floor templates: N×14 = N rectangular tables of 14 seats. */
export function buildLayout(roomId: RoomId): SeatingTable[] {
  if (roomId === "hall-3") {
    return Array.from({ length: 5 }, (_, index) =>
      table(`p-${index + 1}`, index + 1, "standard", "bottom", 14),
    );
  }

  if (roomId === "hall-2") {
    return Array.from({ length: 9 }, (_, index) =>
      table(`m-${index + 1}`, index + 1, "standard", "bottom", 14),
    );
  }

  // Grande: top 7×14, center bridal, bottom 20×14 + 1×12
  const top = Array.from({ length: 7 }, (_, index) =>
    table(`g-top-${index + 1}`, index + 1, "standard", "top", 14),
  );
  const bridal = table("g-bridal", 0, "bridal", "center", 4);
  const bottom = Array.from({ length: 20 }, (_, index) =>
    table(`g-bot-${index + 1}`, index + 8, "standard", "bottom", 14),
  );
  const head12 = table("g-head12", 28, "head12", "bottom", 12);

  return [...top, bridal, ...bottom, head12];
}

export function layoutCapacity(tables: SeatingTable[]) {
  return tables.reduce((sum, entry) => sum + entry.seats.length, 0);
}

export function occupiedSeats(tables: SeatingTable[]) {
  return tables.reduce(
    (sum, entry) =>
      sum + entry.seats.filter((seat) => seat.label.trim().length > 0).length,
    0,
  );
}

export function tableHasGuests(entry: SeatingTable) {
  return entry.seats.some((seat) => seat.label.trim().length > 0);
}

export function planHasGuests(tables: SeatingTable[]) {
  return tables.some(tableHasGuests);
}
