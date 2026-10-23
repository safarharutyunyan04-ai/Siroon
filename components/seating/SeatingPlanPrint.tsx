import { formatLongDate } from "@/lib/format";
import { t } from "@/lib/i18n/messages";
import { tableLabel } from "@/lib/seating-labels";
import { roomName } from "@/lib/rooms";
import type { Locale, SeatingPlan, VenueEvent } from "@/types/domain";

export function SeatingPlanPrint({
  event,
  plan,
  locale,
}: {
  event: VenueEvent;
  plan: SeatingPlan;
  locale: Locale;
}) {
  const tables = [...plan.tables].sort((a, b) => {
    const zoneOrder = { top: 0, center: 1, bottom: 2 };
    const zone = zoneOrder[a.zone] - zoneOrder[b.zone];
    if (zone !== 0) return zone;
    return a.number - b.number;
  });

  return (
    <div className="seating-print hidden print:block">
      <header className="seating-print-header">
        <p className="seating-print-brand">Siroon</p>
        <h1>{t(locale, "seatingPlan")}</h1>
        <p>
          {event.title}
          {" · "}
          {formatLongDate(event.date, locale)}
          {event.startTime ? ` · ${event.startTime}` : ""}
          {" · "}
          {roomName(event.roomId, locale)}
        </p>
      </header>

      <div className="seating-print-grid">
        {tables.map((table) => {
          const names = table.seats
            .map((seat) => seat.label.trim())
            .filter(Boolean);
          return (
            <section key={table.id} className="seating-print-card">
              <h2>{tableLabel(table, locale)}</h2>
              {names.length === 0 ? (
                <p className="seating-print-empty">—</p>
              ) : (
                <ol>
                  {names.map((name, index) => (
                    <li key={`${table.id}-${index}`}>{name}</li>
                  ))}
                </ol>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
