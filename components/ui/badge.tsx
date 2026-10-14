import { cn } from "@/lib/cn";
import { STATUS_BADGE_STYLES, STATUS_LABELS } from "@/lib/status";
import type { AppointmentStatus } from "@/lib/types";

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <Badge className={STATUS_BADGE_STYLES[status]}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </Badge>
  );
}
