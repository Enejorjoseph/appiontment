import { getSupabase, throwIfError } from "./supabase";
import { checkSlotBookable } from "./availability";
import { todayInTimeZone } from "./datetime";
import { getSettings } from "./settings";
import { ACTIVE_STATUSES, canTransition, isActiveStatus } from "./status";
import type {
  Appointment,
  AppointmentStats,
  AppointmentStatus,
  BookingInput,
} from "./types";
import { getService } from "./services";

interface AppointmentRow {
  id: number;
  reference: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  reason: string | null;
  service_id: number | null;
  service_name: string;
  service_price: number;
  service_duration: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export function mapAppointment(row: AppointmentRow): Appointment {
  return {
    id: Number(row.id),
    reference: row.reference,
    patientName: row.patient_name,
    patientEmail: row.patient_email,
    patientPhone: row.patient_phone,
    reason: row.reason,
    serviceId: row.service_id === null ? null : Number(row.service_id),
    serviceName: row.service_name,
    servicePrice: Number(row.service_price),
    serviceDuration: Number(row.service_duration),
    appointmentDate: row.appointment_date,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    cancellationReason: row.cancellation_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type CreateAppointmentOutcome =
  | { ok: true; reference: string; autoConfirmed: boolean }
  | {
      ok: false;
      code: "slot_taken" | "service_inactive" | "service_missing" | "unavailable";
      reason: string;
    };

interface BookRpcResult {
  ok: boolean;
  code?: string;
  reason?: string;
  reference?: string;
  autoConfirmed?: boolean;
}

export async function createAppointment(
  input: BookingInput,
  patientUserId: number | null = null,
): Promise<CreateAppointmentOutcome> {
  const service = await getService(input.serviceId);
  if (!service) {
    return { ok: false, code: "service_missing", reason: "The selected service could not be found." };
  }
  if (!service.isActive) {
    return {
      ok: false,
      code: "service_inactive",
      reason: "The selected service is not currently available for booking.",
    };
  }

  const preflight = await checkSlotBookable(
    input.appointmentDate,
    input.startTime,
    service.durationMinutes,
  );
  if (!preflight.ok) {
    return { ok: false, code: "unavailable", reason: preflight.reason };
  }

  const { data, error } = await getSupabase().rpc("book_appointment", {
    p_service_id: input.serviceId,
    p_date: input.appointmentDate,
    p_start: input.startTime,
    p_patient_user_id: patientUserId,
    p_name: input.patientName,
    p_email: input.patientEmail,
    p_phone: input.patientPhone,
    p_reason: input.reason,
  });
  throwIfError(error, "Could not create the appointment");

  const result = data as BookRpcResult;
  if (!result.ok || !result.reference) {
    const code = (result.code ?? "slot_taken") as "slot_taken" | "service_inactive" | "service_missing";
    return {
      ok: false,
      code,
      reason: result.reason ?? "That time slot is no longer available.",
    };
  }

  return { ok: true, reference: result.reference, autoConfirmed: Boolean(result.autoConfirmed) };
}

export async function getAppointmentById(id: number): Promise<Appointment | undefined> {
  const { data, error } = await getSupabase()
    .from("appointments")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  throwIfError(error, "Could not load appointment");
  return data ? mapAppointment(data as AppointmentRow) : undefined;
}

export async function getAppointmentByReference(reference: string): Promise<Appointment | undefined> {
  const { data, error } = await getSupabase()
    .from("appointments")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();
  throwIfError(error, "Could not load appointment");
  return data ? mapAppointment(data as AppointmentRow) : undefined;
}

export async function findAppointmentForPatient(
  reference: string,
  email: string,
): Promise<Appointment | undefined> {
  const { data, error } = await getSupabase()
    .from("appointments")
    .select("*")
    .eq("reference", reference)
    .eq("patient_email", email)
    .maybeSingle();
  throwIfError(error, "Could not load appointment");
  return data ? mapAppointment(data as AppointmentRow) : undefined;
}

export interface AppointmentFilters {
  query?: string;
  date?: string;
  serviceId?: number;
  status?: AppointmentStatus;
  from?: string;
  to?: string;
}

export async function listAppointments(filters: AppointmentFilters = {}): Promise<Appointment[]> {
  let query = getSupabase()
    .from("appointments")
    .select("*")
    .order("appointment_date", { ascending: false })
    .order("start_time", { ascending: false });

  if (filters.query) {
    const safe = filters.query.replace(/[,%()]/g, " ").trim();
    if (safe) query = query.or(`reference.ilike.%${safe}%,patient_name.ilike.%${safe}%`);
  }
  if (filters.date) query = query.eq("appointment_date", filters.date);
  if (filters.serviceId) query = query.eq("service_id", filters.serviceId);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.from) query = query.gte("appointment_date", filters.from);
  if (filters.to) query = query.lte("appointment_date", filters.to);

  const { data, error } = await query;
  throwIfError(error, "Could not load appointments");
  return (data as AppointmentRow[]).map(mapAppointment);
}

export async function todayAppointments(date: string): Promise<Appointment[]> {
  const { data, error } = await getSupabase()
    .from("appointments")
    .select("*")
    .eq("appointment_date", date)
    .order("start_time", { ascending: true });
  throwIfError(error, "Could not load appointments");
  return (data as AppointmentRow[]).map(mapAppointment);
}

export async function upcomingAppointments(today: string, limit = 5): Promise<Appointment[]> {
  const { data, error } = await getSupabase()
    .from("appointments")
    .select("*")
    .gte("appointment_date", today)
    .in("status", ACTIVE_STATUSES)
    .order("appointment_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(limit);
  throwIfError(error, "Could not load appointments");
  return (data as AppointmentRow[]).map(mapAppointment);
}

export async function recentAppointments(limit = 5): Promise<Appointment[]> {
  const { data, error } = await getSupabase()
    .from("appointments")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);
  throwIfError(error, "Could not load appointments");
  return (data as AppointmentRow[]).map(mapAppointment);
}

export async function getStats(): Promise<AppointmentStats> {
  const settings = await getSettings();
  const today = todayInTimeZone(settings.timezone);
  const { data, error } = await getSupabase()
    .from("appointments")
    .select("status, appointment_date");
  throwIfError(error, "Could not load statistics");

  const rows = (data ?? []) as Array<{ status: AppointmentStatus; appointment_date: string }>;
  const byStatus: Record<string, number> = {};
  let todayCount = 0;
  let upcoming = 0;

  for (const row of rows) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
    if (row.appointment_date === today) todayCount += 1;
    if (
      row.appointment_date > today &&
      (row.status === "pending" || row.status === "confirmed" || row.status === "rescheduled")
    ) {
      upcoming += 1;
    }
  }

  return {
    total: rows.length,
    today: todayCount,
    upcoming,
    pending: byStatus.pending ?? 0,
    confirmed: byStatus.confirmed ?? 0,
    completed: byStatus.completed ?? 0,
    cancelled: byStatus.cancelled ?? 0,
    rescheduled: byStatus.rescheduled ?? 0,
  };
}

export type UpdateStatusOutcome = { ok: true } | { ok: false; reason: string };

export async function updateAppointmentStatus(
  id: number,
  nextStatus: AppointmentStatus,
  options?: { cancellationReason?: string },
): Promise<UpdateStatusOutcome> {
  const appointment = await getAppointmentById(id);
  if (!appointment) return { ok: false, reason: "Appointment not found." };
  if (nextStatus === appointment.status) {
    return { ok: true };
  }
  if (!canTransition(appointment.status, nextStatus)) {
    return {
      ok: false,
      reason: `Cannot change a ${appointment.status} appointment to ${nextStatus}.`,
    };
  }

  const cancellationReason =
    nextStatus === "cancelled" ? options?.cancellationReason?.trim() || null : null;

  const { error } = await getSupabase()
    .from("appointments")
    .update({
      status: nextStatus,
      cancellation_reason: cancellationReason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  throwIfError(error, "Could not update the appointment");
  return { ok: true };
}

export type RescheduleOutcome = { ok: true } | { ok: false; reason: string };

export async function rescheduleAppointment(
  id: number,
  date: string,
  startTime: string,
): Promise<RescheduleOutcome> {
  const appointment = await getAppointmentById(id);
  if (!appointment) return { ok: false, reason: "Appointment not found." };
  if (!isActiveStatus(appointment.status)) {
    return { ok: false, reason: "Cancelled appointments cannot be rescheduled." };
  }

  const check = await checkSlotBookable(date, startTime, appointment.serviceDuration, {
    excludeAppointmentId: id,
  });
  if (!check.ok) return { ok: false, reason: check.reason };

  const { data, error } = await getSupabase().rpc("reschedule_appointment", {
    p_id: id,
    p_date: date,
    p_start: startTime,
  });
  throwIfError(error, "Could not reschedule the appointment");

  const result = data as { ok: boolean; reason?: string };
  if (!result.ok) return { ok: false, reason: result.reason ?? "That slot is no longer available." };
  return { ok: true };
}

export async function countAppointmentsToday(date: string): Promise<number> {
  const { count, error } = await getSupabase()
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("appointment_date", date);
  throwIfError(error, "Could not count appointments");
  return count ?? 0;
}
