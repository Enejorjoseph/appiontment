"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getAppointmentById,
  rescheduleAppointment,
  updateAppointmentStatus,
} from "@/lib/appointments";
import { createBlockedPeriod, deleteBlockedPeriod } from "@/lib/blocked";
import { destroySession, getCurrentAdmin, login, purgeExpiredSessions } from "@/lib/auth/session";
import { statusChangeEmail, notifySafely, cancellationConfirmationEmail } from "@/lib/email";
import { updateSettings, updateWorkingHours } from "@/lib/settings";
import { createService, setServiceActive, updateService } from "@/lib/services";
import {
  validateBlockedPeriod,
  validateLogin,
  validateReschedule,
  validateService,
  validateSettings,
  validateWorkingHours,
} from "@/lib/validation";
import type { WorkingHourInput } from "@/lib/validation";
import type { FormState } from "@/lib/action-state";

async function requireAuth() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

function fail(message: string, errors: Record<string, string> = {}): FormState {
  return { ok: false, message, errors };
}

function ok(message: string): FormState {
  return { ok: true, message, errors: {} };
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = validateLogin({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return fail("Please check your email and password.", parsed.errors);
  }

  const admin = await login(parsed.data.email, parsed.data.password);
  if (!admin) {
    return fail("Invalid email or password.");
  }

  await purgeExpiredSessions();
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

export async function confirmAppointmentAction(formData: FormData): Promise<void> {
  await requireAuth();
  const id = Number(formData.get("id"));
  const appointment = await getAppointmentById(id);
  if (!appointment) return;
  const result = await updateAppointmentStatus(id, "confirmed");
  if (result.ok) {
    const updated = await getAppointmentById(id);
    if (updated) await notifySafely(statusChangeEmail(updated, appointment.status));
  }
  revalidatePath("/admin");
  revalidatePath("/admin/appointments");
  revalidatePath(`/admin/appointments/${id}`);
}

export async function completeAppointmentAction(formData: FormData): Promise<void> {
  await requireAuth();
  const id = Number(formData.get("id"));
  const appointment = await getAppointmentById(id);
  if (!appointment) return;
  const result = await updateAppointmentStatus(id, "completed");
  if (result.ok) {
    const updated = await getAppointmentById(id);
    if (updated) await notifySafely(statusChangeEmail(updated, appointment.status));
  }
  revalidatePath("/admin");
  revalidatePath("/admin/appointments");
  revalidatePath(`/admin/appointments/${id}`);
}

export async function cancelAppointmentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAuth();
  const id = Number(formData.get("id"));
  const reason = String(formData.get("reason") ?? "").trim();
  const appointment = await getAppointmentById(id);
  if (!appointment) return fail("Appointment not found.");

  const result = await updateAppointmentStatus(id, "cancelled", { cancellationReason: reason });
  if (!result.ok) return fail(result.reason);

  const updated = await getAppointmentById(id);
  if (updated) await notifySafely(cancellationConfirmationEmail(updated));

  revalidatePath("/admin");
  revalidatePath("/admin/appointments");
  revalidatePath(`/admin/appointments/${id}`);
  revalidatePath(`/booking/${appointment.reference}`);
  return ok("Appointment cancelled. The time slot has been released.");
}

export async function rescheduleAppointmentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAuth();
  const id = Number(formData.get("id"));
  const parsed = validateReschedule({
    appointmentDate: formData.get("appointmentDate"),
    startTime: formData.get("startTime"),
  });
  if (!parsed.success) return fail("Please choose a valid date and time.", parsed.errors);

  const appointment = await getAppointmentById(id);
  if (!appointment) return fail("Appointment not found.");

  const result = await rescheduleAppointment(id, parsed.data.appointmentDate, parsed.data.startTime);
  if (!result.ok) return fail(result.reason, { startTime: result.reason });

  const updated = await getAppointmentById(id);
  if (updated) await notifySafely(statusChangeEmail(updated, appointment.status));

  revalidatePath("/admin");
  revalidatePath("/admin/appointments");
  revalidatePath("/admin/calendar");
  revalidatePath(`/admin/appointments/${id}`);
  revalidatePath(`/booking/${appointment.reference}`);
  return ok("Appointment rescheduled and the patient slot was updated.");
}

export async function createServiceAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAuth();
  const parsed = validateService({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    durationMinutes: formData.get("durationMinutes"),
    isActive: formData.get("isActive"),
  });
  if (!parsed.success) return fail("Please correct the highlighted fields.", parsed.errors);

  await createService(parsed.data);
  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/");
  return ok(`Service "${parsed.data.name}" was created.`);
}

export async function updateServiceAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAuth();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return fail("Invalid service.");

  const parsed = validateService({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    durationMinutes: formData.get("durationMinutes"),
    isActive: formData.get("isActive"),
  });
  if (!parsed.success) return fail("Please correct the highlighted fields.", parsed.errors);

  await updateService(id, parsed.data);
  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/");
  return ok(`Service "${parsed.data.name}" was updated.`);
}

export async function toggleServiceAction(formData: FormData): Promise<void> {
  await requireAuth();
  const id = Number(formData.get("id"));
  const active = formData.get("active") === "1";
  if (Number.isInteger(id) && id > 0) {
    await setServiceActive(id, active);
    revalidatePath("/admin/services");
    revalidatePath("/services");
    revalidatePath("/");
  }
}

export async function updateSettingsAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAuth();
  const parsed = validateSettings({
    clinicName: formData.get("clinicName"),
    tagline: formData.get("tagline"),
    description: formData.get("description"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    timezone: formData.get("timezone"),
    slotIntervalMinutes: formData.get("slotIntervalMinutes"),
    minNoticeMinutes: formData.get("minNoticeMinutes"),
    maxBookingDays: formData.get("maxBookingDays"),
    autoConfirm: formData.get("autoConfirm"),
    cancellationPolicy: formData.get("cancellationPolicy"),
  });
  if (!parsed.success) return fail("Please correct the highlighted fields.", parsed.errors);

  await updateSettings(parsed.data);
  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/services");
  revalidatePath("/about");
  revalidatePath("/contact");
  return ok("Clinic settings saved.");
}

export async function updateWorkingHoursAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAuth();
  const hours: WorkingHourInput[] = [];
  for (let weekday = 0; weekday < 7; weekday += 1) {
    const isOpen = formData.get(`isOpen-${weekday}`) === "on";
    hours.push({
      weekday,
      isOpen,
      openTime: (formData.get(`openTime-${weekday}`) as string) || null,
      closeTime: (formData.get(`closeTime-${weekday}`) as string) || null,
      breakStart: (formData.get(`breakStart-${weekday}`) as string) || null,
      breakEnd: (formData.get(`breakEnd-${weekday}`) as string) || null,
    });
  }

  const parsed = validateWorkingHours(hours);
  if (!parsed.success) return fail("Please correct the highlighted days.", parsed.errors);

  await updateWorkingHours(parsed.data);
  revalidatePath("/admin/availability");
  revalidatePath("/book");
  revalidatePath("/");
  return ok("Working hours saved.");
}

export async function createBlockedPeriodAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAuth();
  const parsed = validateBlockedPeriod({
    date: formData.get("date"),
    mode: formData.get("mode"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return fail("Please correct the highlighted fields.", parsed.errors);

  await createBlockedPeriod(parsed.data, admin.id);
  revalidatePath("/admin/availability");
  revalidatePath("/book");
  return ok("Blocked period added.");
}

export async function deleteBlockedPeriodAction(formData: FormData): Promise<void> {
  await requireAuth();
  const id = Number(formData.get("id"));
  if (Number.isInteger(id) && id > 0) {
    await deleteBlockedPeriod(id);
    revalidatePath("/admin/availability");
    revalidatePath("/book");
  }
}
