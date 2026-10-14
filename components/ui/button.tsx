import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "subtle";

export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 active:translate-y-px";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-sm shadow-brand-600/25 hover:from-brand-600 hover:to-brand-700",
  secondary:
    "bg-gradient-to-b from-navy-700 to-navy-800 text-white shadow-sm shadow-navy-900/25 hover:from-navy-800 hover:to-navy-900",
  outline: "border border-navy-200 bg-white text-navy-700 hover:border-brand-200 hover:bg-navy-50",
  ghost: "text-navy-700 hover:bg-navy-50",
  danger: "bg-gradient-to-b from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700",
  subtle: "bg-brand-50 text-brand-700 hover:bg-brand-100",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export function buttonClass(options?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}): string {
  const { variant = "primary", size = "md", className } = options ?? {};
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return <button type={type} className={buttonClass({ variant, size, className })} {...props} />;
}
