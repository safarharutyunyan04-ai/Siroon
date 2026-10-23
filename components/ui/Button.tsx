import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  primary:
    "inline-flex items-center justify-center rounded-[10px] bg-accent px-4 py-2.5 text-[13px] font-medium text-ink shadow-[0_8px_20px_rgba(163,68,84,0.22)] transition-[transform,background-color,box-shadow] duration-[var(--duration)] ease-[var(--ease)] hover:-translate-y-0.5 hover:bg-accent-deep hover:shadow-[0_10px_24px_rgba(163,68,84,0.28)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0",
  secondary:
    "inline-flex items-center justify-center rounded-[10px] border border-accent/55 bg-white/70 px-4 py-2.5 text-[13px] font-medium text-teal transition-[transform,background-color,border-color] duration-[var(--duration)] ease-[var(--ease)] hover:-translate-y-0.5 hover:border-accent hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-30",
  ghost:
    "inline-flex items-center justify-center rounded-[10px] bg-surface-raised/80 px-3.5 py-2 text-[13px] font-medium text-teal ring-1 ring-border/80 transition-[transform,background-color,color] duration-[var(--duration)] ease-[var(--ease)] hover:-translate-y-0.5 hover:bg-white hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30",
  danger:
    "inline-flex items-center justify-center rounded-[10px] px-3 py-2 text-[13px] font-medium text-danger transition-opacity duration-[var(--duration)] hover:opacity-70",
} as const;

type Shared = {
  children: ReactNode;
  className?: string;
  variant?: keyof typeof variants;
};

type AsButton = Shared &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    href?: undefined;
  };

type AsLink = Shared & { href: string };

export function Button(props: AsButton | AsLink) {
  const { children, className = "", variant = "primary", ...rest } = props;
  const classes = `${variants[variant]} ${className}`.trim();

  if ("href" in rest && rest.href) {
    return (
      <Link href={rest.href} className={classes}>
        {children}
      </Link>
    );
  }

  const button = rest as AsButton;
  return (
    <button type={button.type ?? "button"} className={classes} {...button}>
      {children}
    </button>
  );
}
