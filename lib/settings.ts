import { getSupabase, throwIfError } from "./supabase";
import { nowIso } from "./datetime";
import type { ClinicSettings, WorkingHour } from "./types";
import type { WorkingHourInput } from "./validation";

interface SettingsRow {
  clinic_name: string;
  tagline: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  timezone: string;
  slot_interval_minutes: number;
  min_notice_minutes: number;
  max_booking_days: number;
  auto_confirm: boolean;
  cancellation_policy: string;
  updated_at: string;
}

interface WorkingHourRow {
  id: number;
  weekday: number;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
  break_start: string | null;
  break_end: string | null;
}

function mapSettings(row: SettingsRow): ClinicSettings {
  return {
    clinicName: row.clinic_name,
    tagline: row.tagline,
    description: row.description,
    phone: row.phone,
    email: row.email,
    address: row.address,
    timezone: row.timezone,
    slotIntervalMinutes: Number(row.slot_interval_minutes),
    minNoticeMinutes: Number(row.min_notice_minutes),
    maxBookingDays: Number(row.max_booking_days),
    autoConfirm: Boolean(row.auto_confirm),
    cancellationPolicy: row.cancellation_policy,
    updatedAt: row.updated_at,
  };
}

function mapWorkingHour(row: WorkingHourRow): WorkingHour {
  return {
    id: Number(row.id),
    weekday: Number(row.weekday),
    isOpen: Boolean(row.is_open),
    openTime: row.open_time,
    closeTime: row.close_time,
    breakStart: row.break_start,
    breakEnd: row.break_end,
  };
}

export async function getSettings(): Promise<ClinicSettings> {
  const { data, error } = await getSupabase()
    .from("clinic_settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (error || !data) throw new Error("Clinic settings are not initialized.");
  return mapSettings(data as SettingsRow);
}

export async function updateSettings(input: ClinicSettings): Promise<void> {
  const { error } = await getSupabase()
    .from("clinic_settings")
    .update({
      clinic_name: input.clinicName,
      tagline: input.tagline,
      description: input.description,
      phone: input.phone,
      email: input.email,
      address: input.address,
      timezone: input.timezone,
      slot_interval_minutes: input.slotIntervalMinutes,
      min_notice_minutes: input.minNoticeMinutes,
      max_booking_days: input.maxBookingDays,
      auto_confirm: input.autoConfirm,
      cancellation_policy: input.cancellationPolicy,
      updated_at: nowIso(),
    })
    .eq("id", 1);
  throwIfError(error, "Could not update clinic settings");
}

export async function getWorkingHours(): Promise<WorkingHour[]> {
  const { data, error } = await getSupabase()
    .from("working_hours")
    .select("*")
    .order("weekday", { ascending: true });
  throwIfError(error, "Could not load working hours");
  return (data as WorkingHourRow[]).map(mapWorkingHour);
}

export async function getWorkingHourForWeekday(weekday: number): Promise<WorkingHour | undefined> {
  const { data, error } = await getSupabase()
    .from("working_hours")
    .select("*")
    .eq("weekday", weekday)
    .maybeSingle();
  throwIfError(error, "Could not load working hours");
  return data ? mapWorkingHour(data as WorkingHourRow) : undefined;
}

export async function updateWorkingHours(hours: WorkingHourInput[]): Promise<void> {
  const rows = hours.map((day) => ({
    weekday: day.weekday,
    is_open: day.isOpen,
    open_time: day.isOpen ? day.openTime : null,
    close_time: day.isOpen ? day.closeTime : null,
    break_start: day.isOpen ? day.breakStart : null,
    break_end: day.isOpen ? day.breakEnd : null,
  }));
  const { error } = await getSupabase().from("working_hours").upsert(rows, { onConflict: "weekday" });
  throwIfError(error, "Could not save working hours");
}
