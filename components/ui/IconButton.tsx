import type { ButtonHTMLAttributes } from "react";

const variants = {
  add: "border-border/90 bg-white text-teal shadow-[0_1px_0_rgba(26,21,16,0.04)] hover:border-accent/45 hover:bg-white hover:text-accent",
  remove:
    "border-transparent bg-transparent text-danger/80 hover:border-danger/25 hover:bg-danger/5 hover:text-danger",
  soft: "border-border/80 bg-white/80 text-muted hover:border-accent/35 hover:text-accent",
} as const;

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  label: string;
};

export function IconButton({
  variant = "add",
  label,
  className = "",
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-[10px] border text-lg leading-none transition-[transform,background-color,border-color,color,box-shadow] duration-[var(--duration)] ease-[var(--ease)] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-30 ${variants[variant]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
