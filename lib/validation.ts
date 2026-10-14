import { isValidISODate, isValidTime, timeToMinutes } from "./datetime";
import { isAppointmentStatus, APPOINTMENT_STATUSES } from "./status";
import type {
  AppointmentStatus,
  BookingInput,
  ClinicSettings,
  ServiceInput,
} from "./types";

export type FieldErrors = Record<string, string>;

export type Result<T> = { success: true; data: T } | { success: false; errors: FieldErrors };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  const parsed = Number(str(value));
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function toBool(value: unknown): boolean {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true" ||
    value === "on" ||
    value === "yes"
  );
}

export function isEmail(value: string): boolean {
  const v = value.trim();
  return v.length <= 254 && EMAIL_RE.test(v);
}

export function isPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!/^[+()\-\s\d]+$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export interface LookupInput {
  reference: string;
  email: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export interface WorkingHourInput {
  weekday: number;
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
  breakStart: string | null;
  breakEnd: string | null;
}

export interface BlockedPeriodInput {
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string;
}

export interface RescheduleInput {
  appointmentDate: string;
  startTime: string;
}

export interface ContactInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export function validateBooking(raw: Record<string, unknown>): Result<BookingInput> {
  const errors: FieldErrors = {};

  const serviceId = toNumber(raw.serviceId);
  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    errors.serviceId = "Please choose a valid service.";
  }

  const appointmentDate = str(raw.appointmentDate);
  if (!isValidISODate(appointmentDate)) {
    errors.appointmentDate = "Please choose a valid appointment date.";
  }

  const startTime = str(raw.startTime);
  if (!isValidTime(startTime)) {
    errors.startTime = "Please choose a valid time slot.";
  }

  const patientName = str(raw.patientName);
  if (patientName.length < 2) errors.patientName = "Please enter the patient's full name.";
  else if (patientName.length > 120) errors.patientName = "Name is too long.";

  const patientEmail = normalizeEmail(str(raw.patientEmail));
  if (!isEmail(patientEmail)) errors.patientEmail = "Please enter a valid email address.";

  const patientPhone = str(raw.patientPhone);
  if (!patientPhone) errors.patientPhone = "Please enter a phone number.";
  else if (!isPhone(patientPhone)) errors.patientPhone = "Please enter a valid phone number.";

  const reason = str(raw.reason);
  if (reason.length > 500) errors.reason = "Please keep the reason under 500 characters.";

  if (Object.keys(errors).length > 0) return { success: false, errors };

  return {
    success: true,
    data: {
      serviceId,
      appointmentDate,
      startTime,
      patientName,
      patientEmail,
      patientPhone,
      reason,
    },
  };
}

export function validateLookup(raw: Record<string, unknown>): Result<LookupInput> {
  const errors: FieldErrors = {};
  const reference = str(raw.reference).toUpperCase();
  const email = normalizeEmail(str(raw.email));

  if (!reference) errors.reference = "Please enter your booking reference.";
  else if (reference.length > 40) errors.reference = "Booking reference looks too long.";

  if (!email) errors.email = "Please enter the email used for the booking.";
  else if (!isEmail(email)) errors.email = "Please enter a valid email address.";

  if (Object.keys(errors).length > 0) return { success: false, errors };
  return { success: true, data: { reference, email } };
}

export function validateLogin(raw: Record<string, unknown>): Result<LoginInput> {
  const errors: FieldErrors = {};
  const email = normalizeEmail(str(raw.email));
  const password = typeof raw.password === "string" ? raw.password : "";

  if (!email) errors.email = "Email is required.";
  else if (!isEmail(email)) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Password is required.";
  else if (password.length > 200) errors.password = "Password is too long.";

  if (Object.keys(errors).length > 0) return { success: false, errors };
  return { success: true, data: { email, password } };
}

export function validateSignup(raw: Record<string, unknown>): Result<SignupInput> {
  const errors: FieldErrors = {};
  const name = str(raw.name);
  const email = normalizeEmail(str(raw.email));
  const password = typeof raw.password === "string" ? raw.password : "";
  const phone = str(raw.phone);

  if (name.length < 2) errors.name = "Please enter your full name.";
  else if (name.length > 120) errors.name = "Name is too long.";
  if (!isEmail(email)) errors.email = "Please enter a valid email address.";
  if (password.length < 8) errors.password = "Password must be at least 8 characters.";
  else if (password.length > 200) errors.password = "Password is too long.";
  if (phone && !isPhone(phone)) errors.phone = "Please enter a valid phone number.";

  if (Object.keys(errors).length > 0) return { success: false, errors };
  return { success: true, data: { name, email, password, phone } };
}

export function validateService(raw: Record<string, unknown>): Result<ServiceInput> {
  const errors: FieldErrors = {};
  const name = str(raw.name);
  const description = str(raw.description);
  const price = toNumber(raw.price);
  const durationMinutes = toNumber(raw.durationMinutes);
  const isActive = toBool(raw.isActive);

  if (name.length < 2) errors.name = "Service name is required.";
  else if (name.length > 120) errors.name = "Service name is too long.";
  if (description.length > 1000) errors.description = "Description is too long.";
  if (!Number.isFinite(price) || !Number.isInteger(price) || price < 0) {
    errors.price = "Enter a valid price in naira (0 or more).";
  } else if (price > 10_000_000) {
    errors.price = "Price seems too high.";
  }
  if (!Number.isFinite(durationMinutes) || !Number.isInteger(durationMinutes) || durationMinutes < 5) {
    errors.durationMinutes = "Duration must be at least 5 minutes.";
  } else if (durationMinutes > 600) {
    errors.durationMinutes = "Duration must be 600 minutes or less.";
  }

  if (Object.keys(errors).length > 0) return { success: false, errors };
  return { success: true, data: { name, description, price, durationMinutes, isActive } };
}

export function validateSettings(raw: Record<string, unknown>): Result<ClinicSettings> {
  const errors: FieldErrors = {};
  const clinicName = str(raw.clinicName);
  const tagline = str(raw.tagline);
  const description = str(raw.description);
  const phone = str(raw.phone);
  const email = normalizeEmail(str(raw.email));
  const address = str(raw.address);
  const timezone = str(raw.timezone) || "Africa/Lagos";
  const slotIntervalMinutes = toNumber(raw.slotIntervalMinutes);
  const minNoticeMinutes = toNumber(raw.minNoticeMinutes);
  const maxBookingDays = toNumber(raw.maxBookingDays);
  const autoConfirm = toBool(raw.autoConfirm);
  const cancellationPolicy = str(raw.cancellationPolicy);

  if (clinicName.length < 2) errors.clinicName = "Clinic name is required.";
  else if (clinicName.length > 120) errors.clinicName = "Clinic name is too long.";
  if (tagline.length > 160) errors.tagline = "Tagline is too long.";
  if (description.length > 2000) errors.description = "Description is too long.";
  if (phone && !isPhone(phone)) errors.phone = "Enter a valid phone number.";
  if (email && !isEmail(email)) errors.email = "Enter a valid email address.";
  if (address.length > 300) errors.address = "Address is too long.";
  if (timezone.length > 64) errors.timezone = "Timezone value is too long.";
  if (!Number.isInteger(slotIntervalMinutes) || slotIntervalMinutes < 5 || slotIntervalMinutes > 240) {
    errors.slotIntervalMinutes = "Slot interval must be between 5 and 240 minutes.";
  }
  if (!Number.isInteger(minNoticeMinutes) || minNoticeMinutes < 0 || minNoticeMinutes > 20160) {
    errors.minNoticeMinutes = "Minimum notice must be between 0 and 20160 minutes.";
  }
  if (!Number.isInteger(maxBookingDays) || maxBookingDays < 1 || maxBookingDays > 365) {
    errors.maxBookingDays = "Booking window must be between 1 and 365 days.";
  }
  if (cancellationPolicy.length > 2000) errors.cancellationPolicy = "Policy text is too long.";

  if (Object.keys(errors).length > 0) return { success: false, errors };

  return {
    success: true,
    data: {
      clinicName,
      tagline,
      description,
      phone,
      email,
      address,
      timezone,
      slotIntervalMinutes,
      minNoticeMinutes,
      maxBookingDays,
      autoConfirm,
      cancellationPolicy,
      updatedAt: "",
    },
  };
}

export function validateWorkingHours(raw: WorkingHourInput[]): Result<WorkingHourInput[]> {
  const errors: FieldErrors = {};
  if (!Array.isArray(raw) || raw.length === 0) {
    return { success: false, errors: { workingHours: "Working hours are required." } };
  }
  for (const day of raw) {
    const key = `day-${day.weekday}`;
    if (!Number.isInteger(day.weekday) || day.weekday < 0 || day.weekday > 6) {
      errors[key] = "Invalid weekday.";
      continue;
    }
    if (!day.isOpen) continue;
    if (!isValidTime(day.openTime) || !isValidTime(day.closeTime)) {
      errors[key] = "Opening and closing times are required.";
      continue;
    }
    if (timeToMinutes(day.closeTime) <= timeToMinutes(day.openTime)) {
      errors[key] = "Closing time must be after opening time.";
      continue;
    }
    const hasBreak = day.breakStart || day.breakEnd;
    if (hasBreak) {
      if (!isValidTime(day.breakStart) || !isValidTime(day.breakEnd)) {
        errors[key] = "Both break start and end are required.";
        continue;
      }
      const bs = timeToMinutes(day.breakStart);
      const be = timeToMinutes(day.breakEnd);
      const os = timeToMinutes(day.openTime);
      const oe = timeToMinutes(day.closeTime);
      if (be <= bs) errors[key] = "Break end must be after break start.";
      else if (bs < os || be > oe) errors[key] = "Break must fall within opening hours.";
    }
  }
  if (Object.keys(errors).length > 0) return { success: false, errors };
  return { success: true, data: raw };
}

export function validateBlockedPeriod(raw: Record<string, unknown>): Result<BlockedPeriodInput> {
  const errors: FieldErrors = {};
  const date = str(raw.date);
  const mode = str(raw.mode) || "full-day";
  const startTime = str(raw.startTime) || null;
  const endTime = str(raw.endTime) || null;
  const reason = str(raw.reason);

  if (!isValidISODate(date)) errors.date = "Please choose a valid date.";
  if (mode === "time-range") {
    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      errors.startTime = "Both start and end times are required.";
    } else if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      errors.startTime = "End time must be after start time.";
    }
  }
  if (reason.length > 200) errors.reason = "Reason is too long.";

  if (Object.keys(errors).length > 0) return { success: false, errors };

  return {
    success: true,
    data: {
      date,
      startTime: mode === "time-range" ? startTime : null,
      endTime: mode === "time-range" ? endTime : null,
      reason,
    },
  };
}

export function validateReschedule(raw: Record<string, unknown>): Result<RescheduleInput> {
  const errors: FieldErrors = {};
  const appointmentDate = str(raw.appointmentDate);
  const startTime = str(raw.startTime);
  if (!isValidISODate(appointmentDate)) errors.appointmentDate = "Please choose a valid date.";
  if (!isValidTime(startTime)) errors.startTime = "Please choose a valid time slot.";
  if (Object.keys(errors).length > 0) return { success: false, errors };
  return { success: true, data: { appointmentDate, startTime } };
}

export function validateContact(raw: Record<string, unknown>): Result<ContactInput> {
  const errors: FieldErrors = {};
  const name = str(raw.name);
  const email = normalizeEmail(str(raw.email));
  const subject = str(raw.subject);
  const message = str(raw.message);

  if (name.length < 2) errors.name = "Please enter your name.";
  if (!isEmail(email)) errors.email = "Please enter a valid email address.";
  if (subject.length > 160) errors.subject = "Subject is too long.";
  if (message.length < 10) errors.message = "Please enter a message of at least 10 characters.";
  else if (message.length > 2000) errors.message = "Message is too long.";

  if (Object.keys(errors).length > 0) return { success: false, errors };
  return { success: true, data: { name, email, subject, message } };
}

export function validateStatus(value: unknown): AppointmentStatus | null {
  return isAppointmentStatus(value) ? value : null;
}

export { APPOINTMENT_STATUSES };
