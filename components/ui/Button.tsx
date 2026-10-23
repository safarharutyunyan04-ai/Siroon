import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const sizes = {
  sm: "rounded-[8px] px-3 py-1.5 text-[12px]",
  md: "rounded-[10px] px-4 py-2.5 text-[13px]",
  lg: "rounded-[12px] px-5 py-3 text-[14px]",
} as const;

const variants = {
  primary:
    "inline-flex items-center justify-center gap-1.5 font-medium text-ink bg-accent shadow-[0_8px_20px_rgba(163,68,84,0.22)] transition-[transform,background-color,box-shadow] duration-[var(--duration)] ease-[var(--ease)] hover:-translate-y-0.5 hover:bg-accent-deep hover:shadow-[0_10px_24px_rgba(163,68,84,0.28)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0",
  secondary:
    "inline-flex items-center justify-center gap-1.5 font-medium text-teal border border-accent/55 bg-white/70 transition-[transform,background-color,border-color] duration-[var(--duration)] ease-[var(--ease)] hover:-translate-y-0.5 hover:border-accent hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-30",
  ghost:
    "inline-flex items-center justify-center gap-1.5 font-medium text-teal bg-surface-raised/80 ring-1 ring-border/80 transition-[transform,background-color,color] duration-[var(--duration)] ease-[var(--ease)] hover:-translate-y-0.5 hover:bg-white hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30",
  success:
    "inline-flex items-center justify-center gap-1.5 font-medium text-[#1f4d3a] bg-[#e7f5ee] ring-1 ring-[#2f6b4f]/25 transition-[transform,background-color,box-shadow] duration-[var(--duration)] ease-[var(--ease)] hover:-translate-y-0.5 hover:bg-[#d8efe3] disabled:cursor-not-allowed disabled:opacity-30",
  danger:
    "inline-flex items-center justify-center gap-1.5 font-medium text-danger bg-transparent ring-1 ring-danger/25 transition-[transform,background-color,opacity] duration-[var(--duration)] ease-[var(--ease)] hover:bg-[rgba(180,60,60,0.06)] disabled:cursor-not-allowed disabled:opacity-30",
} as const;

type Shared = {
  children: ReactNode;
  className?: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

type AsButton = Shared &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    href?: undefined;
  };

type AsLink = Shared & { href: string };

export function Button(props: AsButton | AsLink) {
  const {
    children,
    className = "",
    variant = "primary",
    size = "md",
    ...rest
  } = props;
  const classes = `${variants[variant]} ${sizes[size]} ${className}`.trim();

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
