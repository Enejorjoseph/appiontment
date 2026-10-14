"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  createAppointment,
  findAppointmentForPatient,
  getAppointmentByReference,
} from "@/lib/appointments";
import { getCurrentPatient } from "@/lib/auth/patient";
import { bookingConfirmationEmail, notifySafely } from "@/lib/email";
import { getClientIdentifier, rateLimit } from "@/lib/rate-limit";
import { STATUS_LABELS } from "@/lib/status";
import { validateBooking, validateLookup } from "@/lib/validation";
import type { FormState, LookupState } from "@/lib/action-state";

export async function createBookingAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const headerList = await headers();
  const limiter = rateLimit(
    `booking:${getClientIdentifier(headerList)}`,
    10,
    60_000,
  );
  if (!limiter.allowed) {
    return {
      ok: false,
      errors: {},
      message: `Too many booking attempts. Please wait ${limiter.retryAfterSeconds} seconds and try again.`,
    };
  }

  const raw = {
    serviceId: formData.get("serviceId"),
    appointmentDate: formData.get("appointmentDate"),
    startTime: formData.get("startTime"),
    patientName: formData.get("patientName"),
    patientEmail: formData.get("patientEmail"),
    patientPhone: formData.get("patientPhone"),
    reason: formData.get("reason"),
  };

  const parsed = validateBooking(raw);
  if (!parsed.success) {
    return { ok: false, errors: parsed.errors, message: "Please correct the highlighted fields." };
  }

  const patient = await getCurrentPatient();
  if (!patient) {
    const serviceParam = raw.serviceId
      ? `?service=${encodeURIComponent(String(raw.serviceId))}`
      : "";
    redirect(`/login?next=${encodeURIComponent(`/book/details${serviceParam}`)}`);
  }

  parsed.data.patientEmail = patient.email;
  const outcome = await createAppointment(parsed.data, patient.id);
  if (!outcome.ok) {
    return {
      ok: false,
      errors: outcome.code === "unavailable" || outcome.code === "slot_taken" ? { startTime: outcome.reason } : {},
      message: outcome.reason,
    };
  }

  const created = await getAppointmentByReference(outcome.reference);
  if (created) {
    await notifySafely(bookingConfirmationEmail(created));
  }

  redirect(`/booking/${outcome.reference}`);
}

export async function lookupAppointmentAction(
  _prev: LookupState,
  formData: FormData,
): Promise<LookupState> {
  const headerList = await headers();
  const limiter = rateLimit(`lookup:${getClientIdentifier(headerList)}`, 15, 60_000);
  if (!limiter.allowed) {
    return {
      ok: false,
      errors: {},
      message: `Too many lookups. Please wait ${limiter.retryAfterSeconds} seconds and try again.`,
    };
  }

  const parsed = validateLookup({
    reference: formData.get("reference"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { ok: false, errors: parsed.errors, message: "Please check the details you entered." };
  }

  const appointment = await findAppointmentForPatient(parsed.data.reference, parsed.data.email);
  if (!appointment) {
    return {
      ok: false,
      errors: {},
      message:
        "We could not find an appointment matching that reference and email address. Please check both values and try again.",
    };
  }

  return {
    ok: true,
    errors: {},
    message: `Appointment found. Current status: ${STATUS_LABELS[appointment.status]}.`,
    appointment: {
      reference: appointment.reference,
      patientName: appointment.patientName,
      serviceName: appointment.serviceName,
      servicePrice: appointment.servicePrice,
      serviceDuration: appointment.serviceDuration,
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      reason: appointment.reason,
      createdAt: appointment.createdAt,
    },
  };
}
