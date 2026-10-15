import type { AppointmentStatus } from "./types";

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "rescheduled",
  "completed",
  "no_show",
  "cancelled",
];

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
  rescheduled: "Rescheduled",
  no_show: "No-show",
};

export const STATUS_DESCRIPTIONS: Record<AppointmentStatus, string> = {
  pending: "Submitted and awaiting confirmation from clinic staff.",
  confirmed: "Confirmed by clinic staff and expected to take place.",
  cancelled: "Cancelled. The time slot has been released.",
  completed: "The patient attended and the appointment is finished.",
  rescheduled: "The appointment time was changed to a new slot.",
  no_show: "The patient did not attend. The time slot has been released.",
};

export const STATUS_BADGE_STYLES: Record<AppointmentStatus, string> = {
  pending: "bg-amber-100 text-amber-800 ring-amber-200",
  confirmed: "bg-brand-100 text-brand-800 ring-brand-200",
  cancelled: "bg-red-100 text-red-700 ring-red-200",
  completed: "bg-navy-100 text-navy-700 ring-navy-200",
  rescheduled: "bg-violet-100 text-violet-700 ring-violet-200",
  no_show: "bg-slate-100 text-slate-600 ring-slate-200",
};

export const STATUS_DOT_STYLES: Record<AppointmentStatus, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-brand-500",
  cancelled: "bg-red-500",
  completed: "bg-navy-500",
  rescheduled: "bg-violet-500",
  no_show: "bg-slate-400",
};

export const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ["confirmed", "rescheduled", "cancelled", "no_show"],
  confirmed: ["completed", "rescheduled", "cancelled", "no_show"],
  rescheduled: ["confirmed", "completed", "cancelled", "no_show"],
  completed: [],
  no_show: [],
  cancelled: [],
};

export function isAppointmentStatus(value: unknown): value is AppointmentStatus {
  return typeof value === "string" && (APPOINTMENT_STATUSES as string[]).includes(value);
}

export function canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
  if (from === to) return false;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function isActiveStatus(status: AppointmentStatus): boolean {
  return status !== "cancelled" && status !== "no_show";
}

export const ACTIVE_STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "rescheduled",
  "completed",
];
