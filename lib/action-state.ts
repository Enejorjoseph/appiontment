import type { AppointmentPhase } from "./appointment-phase";
import type { AppointmentStatus } from "./types";

export type FieldErrors = Record<string, string>;

export interface FormState {
  ok: boolean;
  message?: string;
  errors: FieldErrors;
}

export const EMPTY_FORM_STATE: FormState = { ok: false, errors: {} };

export interface LookupAppointment {
  reference: string;
  patientName: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  phase: AppointmentPhase;
  reason: string | null;
  createdAt: string;
}

export interface LookupState extends FormState {
  appointment?: LookupAppointment;
}

export const EMPTY_LOOKUP_STATE: LookupState = { ok: false, errors: {} };
