import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-fg hover:brightness-105 active:scale-[0.98] disabled:opacity-50",
  secondary:
    "bg-card-2 text-foreground hover:bg-border/60 active:scale-[0.98] disabled:opacity-50",
  ghost: "bg-transparent text-foreground hover:bg-card-2 active:scale-[0.98] disabled:opacity-50",
  danger: "bg-danger text-white hover:brightness-110 active:scale-[0.98] disabled:opacity-50",
  outline:
    "border border-border bg-card text-foreground hover:bg-card-2 active:scale-[0.98] disabled:opacity-50",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-2.5 text-xs gap-1.5",
  md: "h-10 px-3.5 text-sm gap-2",
  lg: "h-12 px-4 text-sm gap-2",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
