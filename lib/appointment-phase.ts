import type { AppointmentStatus } from "./types";

/**
 * A display-only phase for an appointment. Unlike the stored status, "past"
 * is derived from the clock: an appointment that is still pending, confirmed
 * or rescheduled but whose end time has already passed.
 */
export type AppointmentPhase = "upcoming" | "past" | "completed" | "cancelled" | "no_show";

interface PhaseInput {
  status: AppointmentStatus;
  appointmentDate: string;
  endTime: string;
}

/**
 * Derives the display phase for an appointment given the clinic's current
 * local date (`YYYY-MM-DD`) and time (`HH:MM`).
 */
export function getAppointmentPhase(input: PhaseInput, today: string, nowTime: string): AppointmentPhase {
  if (input.status === "completed") return "completed";
  if (input.status === "cancelled") return "cancelled";
  if (input.status === "no_show") return "no_show";

  const ended =
    input.appointmentDate < today ||
    (input.appointmentDate === today && input.endTime <= nowTime);

  return ended ? "past" : "upcoming";
}

/**
 * True when an appointment is still active (not completed, cancelled or
 * no-show) but its time has already passed.
 */
export function isPastAppointment(input: PhaseInput, today: string, nowTime: string): boolean {
  return getAppointmentPhase(input, today, nowTime) === "past";
}

/**
 * True when an appointment can be deleted: anything that is no longer
 * upcoming (a past consultation, or one already closed as completed,
 * cancelled or a no-show). Upcoming appointments must be cancelled instead.
 */
export function isDeletableAppointment(input: PhaseInput, today: string, nowTime: string): boolean {
  return getAppointmentPhase(input, today, nowTime) !== "upcoming";
}
