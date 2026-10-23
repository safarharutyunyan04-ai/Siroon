import type { GuestMenuSection } from "@/lib/guest-menu";
import { t } from "@/lib/i18n/messages";
import type { Locale, MenuItem } from "@/types/domain";

export function GuestMenuPrint({
  locale,
  sections,
}: {
  locale: Locale;
  sections: GuestMenuSection[];
}) {
  return (
    <div className="carte-print">
      <header className="carte-print-header">
        <p className="carte-print-eyebrow">{t(locale, "guestMenuEyebrow")}</p>
        <h1 className="carte-print-brand">Le Man</h1>
        <p className="carte-print-script">Wedding hall</p>
        <div className="carte-print-ornament" aria-hidden />
        <p className="carte-print-lead">{t(locale, "guestMenuLead")}</p>
      </header>

      {sections.length === 0 ? (
        <p className="carte-print-empty">{t(locale, "guestMenuEmpty")}</p>
      ) : (
        <div className="carte-print-sections">
          {sections.map(({ category, direct, children }) => (
            <section key={category.id} className="carte-print-section">
              <h2>{category.name}</h2>
              <div className="carte-print-ornament" aria-hidden />
              {direct.length > 0 ? <PrintDishList items={direct} /> : null}
              {children.map(({ category: child, items }) => (
                <div key={child.id} className="carte-print-child">
                  <h3>{child.name}</h3>
                  <PrintDishList items={items} />
                </div>
              ))}
            </section>
          ))}
        </div>
      )}

      <footer className="carte-print-footer">
        <div className="carte-print-ornament" aria-hidden />
        <p className="carte-print-brand-sm">Le Man</p>
        <p className="carte-print-script-sm">Wedding hall</p>
        <p className="carte-print-thanks">{t(locale, "guestMenuFooter")}</p>
      </footer>
    </div>
  );
}

function PrintDishList({ items }: { items: MenuItem[] }) {
  return (
    <ul className="carte-print-list">
      {items.map((item) => (
        <li key={item.id}>
          <span className="carte-print-dish">{item.name}</span>
          {item.description ? (
            <span className="carte-print-desc">{item.description}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
