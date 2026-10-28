"use client";

import { t } from "@/lib/i18n/messages";
import { useLocale } from "@/lib/hooks";

type LeManLogoProps = {
  size?: "sm" | "md" | "lg" | "hero";
  align?: "left" | "center";
  className?: string;
  as?: "div" | "h1" | "p";
};

const sizeStyles = {
  sm: {
    title: "text-[11px] tracking-[0.42em] font-semibold",
    script: "mt-0.5 text-[15px]",
  },
  md: {
    title: "text-xl tracking-[0.28em] font-semibold sm:text-2xl",
    script: "mt-1 text-2xl sm:text-[1.65rem]",
  },
  lg: {
    title: "text-3xl tracking-[0.22em] font-semibold sm:text-4xl",
    script: "mt-1.5 text-3xl sm:text-4xl",
  },
  hero: {
    title:
      "text-5xl tracking-[0.2em] font-semibold sm:text-6xl md:text-7xl md:tracking-[0.22em]",
    script: "mt-2 text-3xl sm:text-4xl md:text-[2.75rem]",
  },
} as const;

export function LeManLogo({
  size = "md",
  align = "center",
  className = "",
  as: Tag = "div",
}: LeManLogoProps) {
  const { locale } = useLocale();
  const hall = t(locale, "weddingHall");
  const styles = sizeStyles[size];
  const alignClass = align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <Tag
      className={`le-man-logo inline-flex flex-col leading-none ${alignClass} ${className}`.trim()}
      aria-label={`Le Man ${hall}`}
    >
      <span
        className={`font-[family-name:var(--font-leman)] le-man-logo-title uppercase ${styles.title}`}
      >
        Le Man
      </span>
      <span
        className={`font-[family-name:var(--font-leman-script)] le-man-logo-script ${styles.script}`}
      >
        {hall}
      </span>
    </Tag>
  );
}
