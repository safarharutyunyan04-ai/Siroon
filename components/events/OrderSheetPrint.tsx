import { formatLongDate, formatMoney } from "@/lib/format";
import { t } from "@/lib/i18n/messages";
import { getCategory } from "@/lib/menu-store";
import type { EventQuote, QuoteLine } from "@/lib/pricing";
import { roomName } from "@/lib/rooms";
import type { Currency, Locale, VenueEvent } from "@/types/domain";

type OrderSheetPrintProps = {
  event: VenueEvent;
  quote: EventQuote;
  locale: Locale;
  currency: Currency;
};

type OrderSection = {
  id: string;
  name: string;
  direct: QuoteLine[];
  children: { id: string; name: string; lines: QuoteLine[] }[];
};

export function OrderSheetPrint({
  event,
  quote,
  locale,
  currency,
}: OrderSheetPrintProps) {
  const sections = buildOrderSections(quote.lines);

  const meta = [
    formatLongDate(event.date, locale),
    event.startTime || null,
    roomName(event.roomId, locale),
    event.guests > 0 ? `${event.guests} ${t(locale, "guests")}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="carte-print">
      <header className="carte-print-header">
        <p className="carte-print-eyebrow">{t(locale, "orderSheetEyebrow")}</p>
        <h1 className="carte-print-brand">Le Man</h1>
        <p className="carte-print-script">Wedding hall</p>
        <div className="carte-print-ornament" aria-hidden />
        <p className="carte-print-lead">{t(locale, "guestMenuLead")}</p>
      </header>

      <section className="carte-print-section carte-print-order-event">
        <h2>{event.title}</h2>
        <div className="carte-print-ornament" aria-hidden />
        {event.contact ? (
          <p className="carte-print-order-contact">{event.contact}</p>
        ) : null}
        <p className="carte-print-desc">{meta}</p>
      </section>

      {quote.lines.length === 0 ? (
        <p className="carte-print-empty">{t(locale, "noMenuLines")}</p>
      ) : (
        <div className="carte-print-sections">
          {sections.map((section) => (
            <section key={section.id} className="carte-print-section">
              <h2>{section.name}</h2>
              <div className="carte-print-ornament" aria-hidden />
              {section.direct.length > 0 ? (
                <OrderDishList lines={section.direct} locale={locale} />
              ) : null}
              {section.children.map((child) => (
                <div key={child.id} className="carte-print-child">
                  <h3>{child.name}</h3>
                  <OrderDishList lines={child.lines} locale={locale} />
                </div>
              ))}
            </section>
          ))}
        </div>
      )}

      {event.notes ? (
        <section className="carte-print-section carte-print-order-notes">
          <h2>{t(locale, "notes")}</h2>
          <div className="carte-print-ornament" aria-hidden />
          <p className="carte-print-desc">{event.notes}</p>
        </section>
      ) : null}

      <section className="carte-print-section carte-print-order-total">
        <div className="carte-print-ornament" aria-hidden />
        {quote.discountAmount > 0 ? (
          <div className="carte-print-order-breakdown">
            <p>
              {t(locale, "subtotal")} ·{" "}
              {formatMoney(quote.subtotal, currency, locale)}
            </p>
            <p>
              {quote.discount.kind === "percent"
                ? `${t(locale, "discount")} (−${quote.discount.value}%)`
                : t(locale, "discount")}{" "}
              · −{formatMoney(quote.discountAmount, currency, locale)}
            </p>
          </div>
        ) : null}
        <p className="carte-print-order-total-label">
          {t(locale, "orderSheetTotal")}
        </p>
        <p className="carte-print-order-total-value">
          {formatMoney(quote.total, currency, locale)}
        </p>
      </section>

      <footer className="carte-print-footer">
        <div className="carte-print-ornament" aria-hidden />
        <p className="carte-print-brand-sm">Le Man</p>
        <p className="carte-print-script-sm">Wedding hall</p>
        <p className="carte-print-thanks">{t(locale, "guestMenuFooter")}</p>
      </footer>
    </div>
  );
}

function OrderDishList({
  lines,
  locale,
}: {
  lines: QuoteLine[];
  locale: Locale;
}) {
  return (
    <ul className="carte-print-list">
      {lines.map((line) => (
        <li key={line.itemId}>
          <span className="carte-print-dish">{line.name}</span>
          <span className="carte-print-desc">
            {formatLineQty(line.quantity, line.priceUnit, locale)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function buildOrderSections(lines: QuoteLine[]): OrderSection[] {
  const roots = new Map<string, OrderSection>();
  const orphan: QuoteLine[] = [];

  for (const line of lines) {
    const category = getCategory(line.categoryId);
    if (!category) {
      orphan.push(line);
      continue;
    }

    if (!category.parentId) {
      const section = roots.get(category.id) ?? {
        id: category.id,
        name: category.name,
        direct: [],
        children: [],
      };
      section.direct.push(line);
      roots.set(category.id, section);
      continue;
    }

    const parent = getCategory(category.parentId);
    const rootId = parent?.id ?? category.parentId;
    const rootName = parent?.name ?? category.parentId;
    const section = roots.get(rootId) ?? {
      id: rootId,
      name: rootName,
      direct: [],
      children: [],
    };
    let child = section.children.find((entry) => entry.id === category.id);
    if (!child) {
      child = { id: category.id, name: category.name, lines: [] };
      section.children.push(child);
    }
    child.lines.push(line);
    roots.set(rootId, section);
  }

  const sections = [...roots.values()];
  if (orphan.length > 0) {
    sections.push({
      id: "other",
      name: "—",
      direct: orphan,
      children: [],
    });
  }
  return sections;
}

function formatLineQty(
  quantity: number,
  priceUnit: QuoteLine["priceUnit"],
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
