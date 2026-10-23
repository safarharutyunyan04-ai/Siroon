"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SeatingPlanPrint } from "@/components/seating/SeatingPlanPrint";
import { layoutCapacity, occupiedSeats } from "@/lib/seating-layouts";
import { tableLabel } from "@/lib/seating-labels";
import { t } from "@/lib/i18n/messages";
import { useEvent, useLocale, useSeatingPlan } from "@/lib/hooks";
import { roomName } from "@/lib/rooms";
import {
  clearTable,
  syncPlanRoom,
  updateSeatLabel,
} from "@/lib/seating-store";
import type { Locale, SeatingTable } from "@/types/domain";

export function SeatingPlanEditor({ eventId }: { eventId: string }) {
  const { locale } = useLocale();
  const { event, ready: eventReady } = useEvent(eventId);
  const { plan, ready: planReady } = useSeatingPlan(eventId, event?.roomId);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const roomMismatch = Boolean(
    event && plan && plan.roomId !== event.roomId,
  );

  const selected = useMemo(
    () => plan?.tables.find((table) => table.id === selectedId) ?? null,
    [plan, selectedId],
  );

  function applyRoomLayout() {
    if (!event) return;
    syncPlanRoom(eventId, event.roomId, true);
    setSelectedId(null);
  }

  if (!eventReady || !planReady) {
    return <p className="text-sm text-muted">{t(locale, "loading")}</p>;
  }

  if (!event) {
    return (
      <div>
        <p className="text-sm text-muted">{t(locale, "missingEvent")}</p>
        <Button href="/" className="mt-6">
          {t(locale, "back")}
        </Button>
      </div>
    );
  }

  if (!plan) {
    return <p className="text-sm text-muted">{t(locale, "loading")}</p>;
  }

  const capacity = layoutCapacity(plan.tables);
  const filled = occupiedSeats(plan.tables);
  const top = plan.tables.filter((table) => table.zone === "top");
  const center = plan.tables.filter((table) => table.zone === "center");
  const bottom = plan.tables.filter((table) => table.zone === "bottom");
  const isGrande = event.roomId === "hall-1";

  return (
    <>
      <div className="no-print animate-rise flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Button href={`/events/${eventId}`} variant="ghost">
              {t(locale, "backEvent")}
            </Button>
            <h1 className="font-display mt-4 text-3xl font-medium tracking-tight sm:text-4xl">
              {t(locale, "seatingPlan")}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {event.title} · {roomName(event.roomId, locale)}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <Button variant="secondary" onClick={() => window.print()}>
              {t(locale, "printPlan")}
            </Button>
            <div className="stat-tile min-w-[10rem]">
              <p className="label">{t(locale, "occupied")}</p>
              <p className="font-display mt-2 text-2xl font-medium tabular-nums text-teal">
                {filled}
                <span className="text-base text-muted"> / {capacity}</span>
              </p>
            </div>
          </div>
        </div>

      {roomMismatch ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-sky-soft/70 px-4 py-3">
          <p className="text-sm text-muted">{t(locale, "seatingResetRoom")}</p>
          <Button onClick={applyRoomLayout}>
            {t(locale, "seatingResetAction")}
          </Button>
        </div>
      ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="panel min-w-0 space-y-6 overflow-x-auto px-4 py-5 sm:px-6">
            {isGrande && top.length > 0 ? (
              <ZoneBlock
                title={t(locale, "zoneTop")}
                tables={top}
                selectedId={selectedId}
                locale={locale}
                columns="grid-cols-4 sm:grid-cols-7"
                onSelect={setSelectedId}
              />
            ) : null}

            {center.length > 0 ? (
              <ZoneBlock
                title={t(locale, "zoneCenter")}
                tables={center}
                selectedId={selectedId}
                locale={locale}
                columns="grid-cols-1 place-items-center"
                onSelect={setSelectedId}
              />
            ) : null}

            <ZoneBlock
              title={
                isGrande
                  ? t(locale, "zoneBottom")
                  : roomName(event.roomId, locale)
              }
              tables={bottom}
              selectedId={selectedId}
              locale={locale}
              columns={
                event.roomId === "hall-3"
                  ? "grid-cols-3 sm:grid-cols-5"
                  : event.roomId === "hall-2"
                    ? "grid-cols-3 sm:grid-cols-5"
                    : "grid-cols-4 sm:grid-cols-5 lg:grid-cols-10"
              }
              onSelect={setSelectedId}
            />
          </div>

          <aside className="panel h-fit px-4 py-5 lg:sticky lg:top-32">
            {!selected ? (
              <p className="text-sm text-muted">{t(locale, "selectTable")}</p>
            ) : (
              <TablePanel
                eventId={eventId}
                table={selected}
                locale={locale}
                onClear={() => clearTable(eventId, selected.id)}
              />
            )}
          </aside>
        </div>
      </div>

      <SeatingPlanPrint event={event} plan={plan} locale={locale} />
    </>
  );
}

function ZoneBlock({
  title,
  tables,
  selectedId,
  locale,
  columns,
  onSelect,
}: {
  title: string;
  tables: SeatingTable[];
  selectedId: string | null;
  locale: Locale;
  columns: string;
  onSelect: (id: string) => void;
}) {
  return (
    <section>
      <p className="label mb-3">{title}</p>
      <div className={`grid gap-2 ${columns}`}>
        {tables.map((table) => (
          <TableChip
            key={table.id}
            table={table}
            selected={selectedId === table.id}
            locale={locale}
            onSelect={() => onSelect(table.id)}
          />
        ))}
      </div>
    </section>
  );
}

function TableChip({
  table,
  selected,
  locale,
  onSelect,
}: {
  table: SeatingTable;
  selected: boolean;
  locale: Locale;
  onSelect: () => void;
}) {
  const filled = table.seats.filter((seat) => seat.label.trim()).length;
  const total = table.seats.length;
  const title = tableLabel(table, locale);
  const wide = table.kind === "bridal" || table.kind === "head12";

  return (
    <button
      type="button"
      onClick={onSelect}
      title={`${title} · ${filled}/${total}`}
      className={`flex min-h-[3.25rem] flex-col items-center justify-center rounded-[10px] border px-2 py-2 text-center transition-all duration-[var(--duration)] ${
        wide ? "min-w-[8rem] sm:min-w-[10rem]" : ""
      } ${
        selected
          ? "border-accent bg-accent-soft shadow-[0_0_0_2px_var(--accent-soft)]"
          : filled > 0
            ? "border-teal/40 bg-teal-soft/50 hover:bg-teal-soft"
            : "border-border/80 bg-surface-raised/80 hover:border-accent/35 hover:bg-surface"
      }`}
    >
      <span className="text-[12px] font-medium leading-tight">{title}</span>
      <span className="mt-0.5 text-[11px] tabular-nums text-muted">
        {filled}/{total}
      </span>
    </button>
  );
}

function TablePanel({
  eventId,
  table,
  locale,
  onClear,
}: {
  eventId: string;
  table: SeatingTable;
  locale: Locale;
  onClear: () => void;
}) {
  return (
    <div>
      <h2 className="font-display text-xl font-medium">
        {tableLabel(table, locale)}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {table.seats.length} {t(locale, "seats")}
      </p>
      <ul className="mt-4 flex max-h-[min(60vh,28rem)] flex-col gap-2 overflow-y-auto pr-1">
        {table.seats.map((seat, index) => (
          <li key={seat.id}>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-muted">
                {index + 1}. {t(locale, "guestName")}
              </span>
              <input
                value={seat.label}
                onChange={(change) =>
                  updateSeatLabel(
                    eventId,
                    table.id,
                    seat.id,
                    change.target.value,
                  )
                }
                className="border-b border-border bg-transparent py-1.5 text-sm outline-none focus:border-foreground"
              />
            </label>
          </li>
        ))}
      </ul>
      <Button variant="ghost" className="mt-4 w-full" onClick={onClear}>
        {t(locale, "clearTable")}
      </Button>
    </div>
  );
}
