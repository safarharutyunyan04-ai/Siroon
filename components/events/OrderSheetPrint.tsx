import { formatLongDate, formatMoney } from "@/lib/format";
import { t } from "@/lib/i18n/messages";
import { getCategory } from "@/lib/menu-store";
import type { EventQuote } from "@/lib/pricing";
import { roomName } from "@/lib/rooms";
import type { Currency, Locale, VenueEvent } from "@/types/domain";

type OrderSheetPrintProps = {
  event: VenueEvent;
  quote: EventQuote;
  locale: Locale;
  currency: Currency;
};

export function OrderSheetPrint({
  event,
  quote,
  locale,
  currency,
}: OrderSheetPrintProps) {
  const groups = new Map<string, EventQuote["lines"]>();
  for (const line of quote.lines) {
    const list = groups.get(line.categoryId) ?? [];
    list.push(line);
    groups.set(line.categoryId, list);
  }

  const meta = [
    formatLongDate(event.date, locale),
    event.startTime || null,
    roomName(event.roomId, locale),
    event.guests > 0 ? `${event.guests} ${t(locale, "guests")}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="order-print">
      <header className="order-print-header">
        <p className="order-print-eyebrow">{t(locale, "orderSheetEyebrow")}</p>
        <h1 className="order-print-brand">Le Man</h1>
        <p className="order-print-script">Wedding hall</p>
        <div className="order-print-ornament" aria-hidden />
        <p className="order-print-lead">{t(locale, "orderSheetLead")}</p>
      </header>

      <section className="order-print-meta">
        <h2 className="order-print-title">{event.title}</h2>
        {event.contact ? (
          <p className="order-print-contact">{event.contact}</p>
        ) : null}
        <p className="order-print-details">{meta}</p>
      </section>

      <div className="order-print-ornament" aria-hidden />

      {quote.lines.length === 0 ? (
        <p className="order-print-empty">{t(locale, "noMenuLines")}</p>
      ) : (
        <div className="order-print-sections">
          {[...groups.entries()].map(([categoryId, lines]) => (
            <section key={categoryId} className="order-print-section">
              <h3>{categoryLabel(categoryId)}</h3>
              <ul className="order-print-list">
                {lines.map((line) => (
                  <li key={line.itemId}>
                    <span className="order-print-dish">{line.name}</span>
                    <span className="order-print-dots" aria-hidden />
                    <span className="order-print-qty">
                      {formatLineQty(line.quantity, line.priceUnit, locale)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {event.notes ? (
        <section className="order-print-notes">
          <p className="order-print-notes-label">{t(locale, "notes")}</p>
          <p className="order-print-notes-body">{event.notes}</p>
        </section>
      ) : null}

      <section className="order-print-total-block">
        <div className="order-print-ornament" aria-hidden />
        {quote.discountAmount > 0 ? (
          <div className="order-print-totals">
            <div className="order-print-row">
              <span>{t(locale, "subtotal")}</span>
              <span>{formatMoney(quote.subtotal, currency, locale)}</span>
            </div>
            <div className="order-print-row">
              <span>
                {quote.discount.kind === "percent"
                  ? `${t(locale, "discount")} (−${quote.discount.value}%)`
                  : t(locale, "discount")}
              </span>
              <span>
                −{formatMoney(quote.discountAmount, currency, locale)}
              </span>
            </div>
          </div>
        ) : null}
        <div className="order-print-total">
          <span>{t(locale, "orderSheetTotal")}</span>
          <strong>{formatMoney(quote.total, currency, locale)}</strong>
        </div>
      </section>

      <footer className="order-print-footer">
        <div className="order-print-ornament" aria-hidden />
        <p className="order-print-brand-sm">Le Man</p>
        <p className="order-print-script-sm">Wedding hall</p>
        <p className="order-print-thanks">{t(locale, "orderSheetThanks")}</p>
      </footer>
    </div>
  );
}

function categoryLabel(categoryId: string) {
  const category = getCategory(categoryId);
  if (!category) return categoryId;
  if (!category.parentId) return category.name;
  const parent = getCategory(category.parentId);
  return parent ? `${parent.name} · ${category.name}` : category.name;
}

function formatLineQty(
  quantity: number,
  priceUnit: EventQuote["lines"][number]["priceUnit"],
  locale: Locale,
) {
  if (priceUnit === "kg") return `${quantity} kg`;
  if (priceUnit === "portion") {
    const unit =
      locale === "hy"
        ? "բաժին"
        : locale === "ru"
          ? "порц."
          : quantity > 1
            ? "portions"
            : "portion";
    return `${quantity} ${unit}`;
  }
  return `× ${quantity}`;
}
