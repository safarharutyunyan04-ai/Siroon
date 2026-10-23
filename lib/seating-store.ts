import { buildLayout, planHasGuests } from "@/lib/seating-layouts";
import type { RoomId, SeatingPlan, SeatingTable } from "@/types/domain";

const storageKey = "siroon:seating";

let plans: SeatingPlan[] = [];
const empty: SeatingPlan[] = [];
let ready = false;
const listeners = new Set<() => void>();

export function subscribeSeating(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSeatingPlans() {
  return ready ? plans : empty;
}

export function getServerSeatingPlans() {
  return empty;
}

export function getSeatingReady() {
  return ready;
}

export function getServerSeatingReady() {
  return false;
}

export function ensureSeating() {
  if (ready) return;
  plans = read();
  ready = true;
  emit(false);
}

export function getPlan(eventId: string) {
  return getSeatingPlans().find((plan) => plan.eventId === eventId);
}

export function ensurePlan(eventId: string, roomId: RoomId): SeatingPlan {
  hydrate();
  const existing = plans.find((plan) => plan.eventId === eventId);
  if (existing) {
    const normalized = normalizePlan(existing);
    if (normalized !== existing) {
      plans = plans.map((plan) =>
        plan.eventId === eventId ? normalized : plan,
      );
      emit(true);
      return normalized;
    }
    return existing;
  }
  const created = createFresh(eventId, roomId);
  plans = [created, ...plans];
  emit(true);
  return created;
}

/** Reset layout when room changes; returns whether previous plan had names. */
export function syncPlanRoom(
  eventId: string,
  roomId: RoomId,
  force = false,
): { plan: SeatingPlan; hadGuests: boolean } {
  hydrate();
  const existing = plans.find((plan) => plan.eventId === eventId);
  if (!existing) {
    const plan = ensurePlan(eventId, roomId);
    return { plan, hadGuests: false };
  }
  if (existing.roomId === roomId && !force) {
    return { plan: existing, hadGuests: false };
  }
  const hadGuests = planHasGuests(existing.tables);
  const next = createFresh(eventId, roomId);
  plans = plans.map((plan) => (plan.eventId === eventId ? next : plan));
  emit(true);
  return { plan: next, hadGuests };
}

export function updateSeatLabel(
  eventId: string,
  tableId: string,
  seatId: string,
  label: string,
) {
  hydrate();
  plans = plans.map((plan) => {
    if (plan.eventId !== eventId) return plan;
    return {
      ...plan,
      updatedAt: new Date().toISOString(),
      tables: plan.tables.map((table) => {
        if (table.id !== tableId) return table;
        return {
          ...table,
          seats: table.seats.map((seat) =>
            seat.id === seatId ? { ...seat, label } : seat,
          ),
        };
      }),
    };
  });
  emit(true);
}

export function clearTable(eventId: string, tableId: string) {
  hydrate();
  plans = plans.map((plan) => {
    if (plan.eventId !== eventId) return plan;
    return {
      ...plan,
      updatedAt: new Date().toISOString(),
      tables: plan.tables.map((table) => {
        if (table.id !== tableId) return table;
        return {
          ...table,
          seats: table.seats.map((seat) => ({ ...seat, label: "" })),
        };
      }),
    };
  });
  emit(true);
}

export function deletePlan(eventId: string) {
  hydrate();
  plans = plans.filter((plan) => plan.eventId !== eventId);
  emit(true);
}

function createFresh(eventId: string, roomId: RoomId): SeatingPlan {
  return {
    eventId,
    roomId,
    tables: buildLayout(roomId),
    updatedAt: new Date().toISOString(),
  };
}

function hydrate() {
  if (!ready) ensureSeating();
}

function emit(persist: boolean) {
  if (persist) write(plans);
  for (const listener of listeners) listener();
}

function read(): SeatingPlan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SeatingPlan[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPlan).map(normalizePlan);
  } catch {
    return [];
  }
}

/** Bridal table is always 4 seats; keep existing names when trimming. */
function normalizePlan(plan: SeatingPlan): SeatingPlan {
  let changed = false;
  const tables = plan.tables.map((table) => {
    if (table.kind !== "bridal") return table;
    if (table.seats.length === 4) return table;
    changed = true;
    const kept = table.seats.slice(0, 4);
    while (kept.length < 4) {
      kept.push({
        id: `${table.id}-s${kept.length + 1}`,
        label: "",
      });
    }
    return { ...table, seats: kept };
  });
  return changed
    ? { ...plan, tables, updatedAt: new Date().toISOString() }
    : plan;
}

function write(next: SeatingPlan[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(next));
}

function isPlan(value: unknown): value is SeatingPlan {
  if (!value || typeof value !== "object") return false;
  const plan = value as SeatingPlan;
  return (
    typeof plan.eventId === "string" &&
    typeof plan.roomId === "string" &&
    Array.isArray(plan.tables)
  );
}

export type { SeatingTable };
