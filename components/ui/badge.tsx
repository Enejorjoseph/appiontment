import { cn } from "@/lib/cn";
import type { AppointmentPhase } from "@/lib/appointment-phase";
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

export function StatusBadge({
  status,
  phase,
}: {
  status: AppointmentStatus;
  phase?: AppointmentPhase;
}) {
  if (phase === "past") {
    return (
      <Badge className="bg-slate-100 text-slate-600 ring-slate-200">
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
        Past
      </Badge>
    );
  }

  return (
    <Badge className={STATUS_BADGE_STYLES[status]}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </Badge>
  );
}
