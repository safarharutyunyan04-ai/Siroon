"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SiroonMark } from "@/components/brand/SiroonMark";
import { DisplayBoard } from "@/components/ecran/DisplayBoard";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { ExpandIcon } from "@/components/ui/ExpandIcon";
import { t } from "@/lib/i18n/messages";
import { useLocale } from "@/lib/hooks";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useLocale();
  const onEcranRoute = pathname.startsWith("/ecran");
  const onCarteRoute = pathname.startsWith("/carte");
  const onPlanning = pathname.startsWith("/planning");
  const [boardPath, setBoardPath] = useState<string | null>(null);
  const boardOpen = boardPath === pathname;

  const links = [
    { href: "/", label: t(locale, "navToday") },
    { href: "/planning", label: t(locale, "navPlanning") },
    { href: "/menu", label: t(locale, "navMenu") },
    { href: "/bilan", label: t(locale, "navBilan") },
  ] as const;

  if (onEcranRoute) {
    return (
      <div className="relative flex min-h-dvh flex-col">
        <DisplayBoard onClose={() => router.push("/")} />
      </div>
    );
  }

  if (onCarteRoute) {
    return <div className="relative flex min-h-dvh flex-col">{children}</div>;
  }

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border/70 bg-surface-raised/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-5">
          <Link href="/" className="group flex shrink-0 items-center gap-2">
            <SiroonMark
              size={26}
              className="transition-transform duration-[var(--duration)] group-hover:scale-105"
            />
            <span className="font-brand hidden text-[13px] font-semibold tracking-[0.28em] text-accent uppercase sm:inline">
              Siroon
            </span>
          </Link>

          <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {links.map((link) => {
              const current =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`shrink-0 rounded-[8px] px-2.5 py-1.5 text-[11px] font-medium tracking-[0.06em] uppercase transition-colors duration-[var(--duration)] sm:px-3 ${
                    current
                      ? "bg-accent text-ink"
                      : "text-muted hover:bg-teal-soft hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5">
            <Link
              href="/events/new"
              className="inline-flex h-8 items-center rounded-[8px] bg-accent px-2.5 text-[11px] font-medium tracking-[0.04em] text-ink uppercase transition-opacity hover:opacity-90"
            >
              {t(locale, "navNewEvent")}
            </Link>
            <button
              type="button"
              onClick={() => setBoardPath(pathname)}
              aria-label={t(locale, "bigScreen")}
              title={t(locale, "bigScreen")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-border/80 bg-white text-accent transition-colors hover:border-accent/40 hover:bg-accent-soft"
            >
              <ExpandIcon className="h-4 w-4" />
            </button>
            <LanguageSwitcher className="bg-surface-raised/80 ring-border/60" />
          </div>
        </div>
      </header>
      <main
        className={`mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col px-3 sm:px-5 ${
          onPlanning ? "py-3 sm:py-4" : "py-6 sm:py-8"
        }`}
      >
        {children}
      </main>

      {boardOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[var(--background)]">
          <DisplayBoard onClose={() => setBoardPath(null)} />
        </div>
      ) : null}
    </>
  );
}
