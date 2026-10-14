import { cn } from "@/lib/cn";

export type AlertVariant = "success" | "error" | "info" | "warning";

const STYLES: Record<AlertVariant, string> = {
  success: "border-brand-200 bg-brand-50 text-brand-800",
  error: "border-red-200 bg-red-50 text-red-700",
  info: "border-navy-200 bg-navy-50 text-navy-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: AlertVariant;
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn("rounded-lg border px-4 py-3 text-sm", STYLES[variant], className)}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={cn(title ? "mt-1" : undefined)}>{children}</div> : null}
    </div>
  );
}
