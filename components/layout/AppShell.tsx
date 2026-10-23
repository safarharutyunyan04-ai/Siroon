"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AuthGate } from "@/components/auth/AuthGate";
import { SiroonMark } from "@/components/brand/SiroonMark";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { signOut } from "@/lib/auth-store";
import { useAuth } from "@/lib/hooks-auth";
import { t } from "@/lib/i18n/messages";
import { useLocale } from "@/lib/hooks";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useLocale();
  const { user, requiresAuth } = useAuth();
  const onCarteRoute = pathname.startsWith("/carte");
  const onLoginRoute = pathname.startsWith("/login");
  const onPlanning = pathname.startsWith("/planning");
  const onHome = pathname === "/";

  const links = [
    { href: "/", label: t(locale, "navToday") },
    { href: "/planning", label: t(locale, "navPlanning") },
    { href: "/menu", label: t(locale, "navMenu") },
    { href: "/bilan", label: t(locale, "navBilan") },
  ] as const;

  if (onCarteRoute || onLoginRoute) {
    return <div className="relative flex min-h-dvh flex-col">{children}</div>;
  }

  return (
    <AuthGate>
      <div
        className={
          onHome
            ? "flex h-dvh max-h-dvh flex-col overflow-hidden"
            : "flex min-h-dvh flex-col"
        }
      >
      <header className="sticky top-0 z-20 shrink-0 border-b border-border/70 bg-surface-raised/90 backdrop-blur-xl">
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
            <LanguageSwitcher className="bg-surface-raised/80 ring-border/60" />
            {requiresAuth && user ? (
              <button
                type="button"
                onClick={() =>
                  void signOut().then(() => router.replace("/login"))
                }
                className="hidden h-8 items-center rounded-[8px] px-2 text-[11px] font-medium tracking-[0.04em] text-muted uppercase transition-colors hover:text-foreground sm:inline-flex"
              >
                {t(locale, "logout")}
              </button>
            ) : null}
          </div>
        </div>
      </header>
      <main
        className={
          onHome
            ? "flex min-h-0 w-full flex-1 flex-col overflow-hidden"
            : `mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col px-3 sm:px-5 ${
                onPlanning ? "py-3 sm:py-4" : "py-6 sm:py-8"
              }`
        }
      >
        {children}
      </main>
      </div>
    </AuthGate>
  );
}
