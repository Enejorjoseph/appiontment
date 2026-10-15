export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "rescheduled"
  | "no_show";

export type AdminRole = "admin" | "staff";

export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: number;
  reference: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  reason: string | null;
  serviceId: number | null;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Appointment shape safe for unauthenticated patients after verification.
 * Contains no internal identifiers or staff-only notes.
 */
export interface PublicAppointment {
  reference: string;
  patientName: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reason: string | null;
  createdAt: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  createdAt: string;
  updatedAt: string;
}

export interface PatientUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicSettings {
  clinicName: string;
  tagline: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  timezone: string;
  slotIntervalMinutes: number;
  minNoticeMinutes: number;
  maxBookingDays: number;
  autoConfirm: boolean;
  cancellationPolicy: string;
  updatedAt: string;
}

export interface WorkingHour {
  id: number;
  weekday: number;
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
  breakStart: string | null;
  breakEnd: string | null;
}

export interface BlockedPeriod {
  id: number;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string;
  createdBy: number | null;
  createdAt: string;
}

export interface Slot {
  time: string;
  endTime: string;
  available: boolean;
  reason?: string;
}

export interface SlotResult {
  date: string;
  slots: Slot[];
  isClosed: boolean;
  closedReason?: string;
}

export interface AppointmentStats {
  total: number;
  today: number;
  upcoming: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  rescheduled: number;
  noShow: number;
}

export interface ServiceInput {
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
}

export interface BookingInput {
  serviceId: number;
  appointmentDate: string;
  startTime: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  reason: string;
}

export interface CreateAppointmentResult {
  ok: true;
  reference: string;
  autoConfirmed: boolean;
}

export interface ActionError {
  ok: false;
  message: string;
  errors: Record<string, string>;
}
