"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks-auth";
import { t } from "@/lib/i18n/messages";
import { useLocale } from "@/lib/hooks";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale();
  const { ready, user, requiresAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready || !requiresAuth) return;
    if (!user) {
      const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
    }
  }, [ready, requiresAuth, user, router, pathname]);

  if (!requiresAuth) return children;

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-sm text-muted">
        {t(locale, "loading")}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-sm text-muted">
        {t(locale, "loading")}
      </div>
    );
  }

  return children;
}
