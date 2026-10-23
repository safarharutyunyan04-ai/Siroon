import type { Locale } from "@/types/domain";

export function FlagIcon({
  locale,
  className = "h-4 w-5",
}: {
  locale: Locale;
  className?: string;
}) {
  if (locale === "hy") {
    return (
      <svg
        viewBox="0 0 21 15"
        className={`rounded-[2px] ${className}`.trim()}
        aria-hidden
      >
        <rect width="21" height="5" y="0" fill="#D90012" />
        <rect width="21" height="5" y="5" fill="#0033A0" />
        <rect width="21" height="5" y="10" fill="#F2A800" />
      </svg>
    );
  }

  if (locale === "en") {
    return (
      <svg
        viewBox="0 0 21 15"
        className={`rounded-[2px] ${className}`.trim()}
        aria-hidden
      >
        <rect width="21" height="15" fill="#012169" />
        <path d="M0 0 L21 15 M21 0 L0 15" stroke="#fff" strokeWidth="2.5" />
        <path d="M0 0 L21 15 M21 0 L0 15" stroke="#C8102E" strokeWidth="1.2" />
        <path d="M10.5 0 V15 M0 7.5 H21" stroke="#fff" strokeWidth="4" />
        <path d="M10.5 0 V15 M0 7.5 H21" stroke="#C8102E" strokeWidth="2" />
      </svg>
    );
  }

  if (locale === "ru") {
    return (
      <svg
        viewBox="0 0 21 15"
        className={`rounded-[2px] ${className}`.trim()}
        aria-hidden
      >
        <rect width="21" height="5" y="0" fill="#fff" />
        <rect width="21" height="5" y="5" fill="#0039A6" />
        <rect width="21" height="5" y="10" fill="#D52B1E" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 21 15"
      className={`rounded-[2px] ${className}`.trim()}
      aria-hidden
    >
      <rect width="21" height="15" fill="#fff" />
      <rect width="7" height="15" fill="#002395" />
      <rect x="14" width="7" height="15" fill="#ED2939" />
    </svg>
  );
}
