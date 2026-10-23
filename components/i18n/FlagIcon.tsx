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
