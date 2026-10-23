"use client";

import { FlagIcon } from "@/components/i18n/FlagIcon";
import { locales, t } from "@/lib/i18n/messages";
import { useLocale } from "@/lib/hooks";
import { setLocale } from "@/lib/settings-store";
import type { Locale } from "@/types/domain";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale } = useLocale();

  return (
    <div
      role="group"
      aria-label={t(locale, "language")}
      className={`flex items-center gap-0.5 rounded-[10px] bg-surface-raised/80 p-0.5 ring-1 ring-border/70 ${className}`.trim()}
    >
      {locales.map((entry) => {
        const active = locale === entry.id;
        return (
          <button
            key={entry.id}
            type="button"
            title={entry.label}
            aria-label={entry.label}
            aria-pressed={active}
            onClick={() => setLocale(entry.id as Locale)}
            className={`flex h-7 w-7 items-center justify-center rounded-[8px] transition-all duration-[var(--duration)] ${
              active
                ? "bg-white shadow-[0_2px_8px_rgba(26,21,16,0.08)] ring-1 ring-border"
                : "opacity-55 hover:opacity-100"
            }`}
          >
            <FlagIcon locale={entry.id} />
          </button>
        );
      })}
    </div>
  );
}
