"use client";

import Link from "next/link";
import { useMemo } from "react";
import { GuestMenuPrint } from "@/components/carte/GuestMenuPrint";
import { LeManLogo } from "@/components/brand/LeManLogo";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { buildGuestMenuSections } from "@/lib/guest-menu";
import { categoryName, itemTexts } from "@/lib/menu-i18n";
import { t } from "@/lib/i18n/messages";
import { useLocale, useMenu } from "@/lib/hooks";
import type { Locale, MenuItem } from "@/types/domain";

export function GuestMenu() {
  const { locale } = useLocale();
  const { items, categories, ready } = useMenu();

  const roots = useMemo(
    () => buildGuestMenuSections(categories, items),
    [categories, items],
  );

  return (
    <>
      <div className="le-man le-man-screen relative min-h-dvh text-[#f3eee6]">
        <div
          aria-hidden
          className="fixed inset-0 -z-10 bg-[#0c0c0c] bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url(/le-man/hero.png)" }}
        />
        <div aria-hidden className="le-man-page-veil fixed inset-0 -z-10" />

        <header className="no-print absolute top-0 right-0 left-0 z-20 flex items-center justify-between px-5 py-4 sm:px-8">
          <LeManLogo size="sm" align="left" className="le-man-logo--compact" />
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="border border-[#d4b56a]/40 px-3 py-1.5 text-[10px] tracking-[0.22em] text-[#d4b56a] uppercase transition-colors hover:border-[#d4b56a] hover:bg-[#d4b56a]/10"
            >
              {t(locale, "printMenu")}
            </button>
            <LanguageSwitcher className="bg-black/45 ring-[#d4b56a]/25" />
            <Link
              href="/menu"
              className="text-[10px] tracking-[0.18em] text-[#f3eee6]/45 uppercase transition-colors hover:text-[#d4b56a]"
            >
              Siroon
            </Link>
          </div>
        </header>

        <section className="relative flex min-h-[72dvh] items-end px-6 pb-12 sm:min-h-[78dvh] sm:px-10 sm:pb-16">
          <div className="relative mx-auto w-full max-w-4xl animate-wash">
            <div className="le-man-frame px-6 py-10 sm:px-10 sm:py-14">
              <p className="text-center text-[10px] tracking-[0.45em] text-[#d4b56a]/80 uppercase sm:text-[11px]">
                {t(locale, "guestMenuEyebrow")}
              </p>
              <LeManLogo size="hero" as="h1" className="mx-auto mt-5" />
              <div className="le-man-ornament mx-auto mt-7" aria-hidden />
              <p className="font-[family-name:var(--font-leman-body)] mx-auto mt-6 max-w-lg text-center text-lg leading-relaxed text-[#f3eee6]/78 sm:text-xl">
                {t(locale, "guestMenuLead")}
              </p>
              <div className="no-print mt-10 flex justify-center">
                <a
                  href="#carte"
                  className="inline-flex items-center gap-3 border border-[#d4b56a]/45 px-5 py-2.5 text-[10px] tracking-[0.28em] text-[#d4b56a] uppercase transition-colors hover:border-[#d4b56a] hover:bg-[#d4b56a]/10"
                >
                  {t(locale, "guestMenuBrowse")}
                  <span aria-hidden>↓</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        <main id="carte" className="relative px-6 py-16 sm:px-10 sm:py-24">
          <div className="relative mx-auto max-w-3xl">
            <div className="le-man-frame px-6 py-12 sm:px-10 sm:py-16">
              {!ready ? (
                <p className="text-center text-sm text-[#f3eee6]/45">
                  {t(locale, "loading")}
                </p>
              ) : roots.length === 0 ? (
                <p className="font-[family-name:var(--font-leman-body)] text-center text-2xl text-[#f3eee6]/40">
                  {t(locale, "guestMenuEmpty")}
                </p>
              ) : (
                <div className="flex flex-col gap-20 sm:gap-24">
                  {roots.map(({ category, direct, children }, index) => (
                    <section
                      key={category.id}
                      className="le-man-section animate-rise"
                      style={{
                        animationDelay: `${Math.min(index, 6) * 70}ms`,
                      }}
                    >
                      <header className="mb-9 text-center">
                        <h2 className="font-[family-name:var(--font-leman)] text-2xl tracking-[0.22em] text-[#d4b56a] uppercase sm:text-3xl">
                          {categoryName(category, locale)}
                        </h2>
                        <div
                          className="le-man-ornament mx-auto mt-4"
                          aria-hidden
                        />
                      </header>

                      {direct.length > 0 ? (
                        <DishList items={direct} locale={locale} />
                      ) : null}

                      {children.map(({ category: child, items: childItems }) => (
                        <div key={child.id} className="mt-12">
                          <h3 className="font-[family-name:var(--font-leman-script)] mb-6 text-center text-2xl text-[#f3eee6]/85 sm:text-3xl">
                            {categoryName(child, locale)}
                          </h3>
                          <DishList items={childItems} locale={locale} />
                        </div>
                      ))}
                    </section>
                  ))}
                </div>
              )}

              <footer className="mt-20 text-center">
                <div className="le-man-ornament mx-auto mb-6" aria-hidden />
                <LeManLogo size="md" className="mx-auto" />
                <p className="mt-4 text-[10px] tracking-[0.24em] text-[#f3eee6]/35 uppercase">
                  {t(locale, "guestMenuFooter")}
                </p>
              </footer>
            </div>
          </div>
        </main>
      </div>

      <GuestMenuPrint locale={locale} sections={roots} />
    </>
  );
}

function DishList({
  items,
  locale,
}: {
  items: MenuItem[];
  locale: Locale;
}) {
  return (
    <ul className="mx-auto flex max-w-xl flex-col gap-0">
      {items.map((item) => {
        const texts = itemTexts(item, locale);
        return (
          <li
            key={item.id}
            className="group border-b border-[#d4b56a]/12 py-4 text-center last:border-b-0"
          >
            <span className="font-[family-name:var(--font-leman-body)] text-[17px] leading-snug text-[#f3eee6]/92 transition-colors group-hover:text-[#d4b56a] sm:text-lg">
              {texts.name}
            </span>
            {texts.description ? (
              <span className="mt-1.5 block font-[family-name:var(--font-leman-body)] text-[13px] leading-relaxed text-[#f3eee6]/48 sm:text-sm">
                {texts.description}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
