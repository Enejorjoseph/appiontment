import { getSupabase, throwIfError } from "./supabase";
import { getSettings, getWorkingHourForWeekday } from "./settings";
import { listBlockedForDate } from "./blocked";
import {
  daysBetween,
  minutesToTime,
  timeInTimeZone,
  timeToMinutes,
  todayInTimeZone,
  weekdayOf,
} from "./datetime";
import { ACTIVE_STATUSES } from "./status";
import type { Slot, SlotResult } from "./types";

interface BusyRow {
  id: number;
  start_time: string;
  end_time: string;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export async function activeAppointmentsForDate(
  date: string,
  excludeId?: number,
): Promise<BusyRow[]> {
  let query = getSupabase()
    .from("appointments")
    .select("id, start_time, end_time")
    .eq("appointment_date", date)
    .in("status", ACTIVE_STATUSES);
  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  throwIfError(error, "Could not load appointments for the date");
  return (data as BusyRow[]).map((row) => ({
    id: Number(row.id),
    start_time: row.start_time,
    end_time: row.end_time,
  }));
}

/**
 * Computes every candidate slot for a date and marks each as available or not,
 * applying working hours, breaks, blocked periods, existing appointments,
 * the minimum booking notice and the maximum booking window.
 */
export async function computeSlots(
  date: string,
  durationMinutes: number,
  options?: { excludeAppointmentId?: number },
): Promise<SlotResult> {
  const settings = await getSettings();
  const today = todayInTimeZone(settings.timezone);

  if (date < today) {
    return { date, slots: [], isClosed: true, closedReason: "This date is in the past." };
  }
  if (daysBetween(today, date) > settings.maxBookingDays) {
    return {
      date,
      slots: [],
      isClosed: true,
      closedReason: `Bookings can only be made up to ${settings.maxBookingDays} days in advance.`,
    };
  }

  const workingHour = await getWorkingHourForWeekday(weekdayOf(date));
  if (!workingHour || !workingHour.isOpen || !workingHour.openTime || !workingHour.closeTime) {
    return { date, slots: [], isClosed: true, closedReason: "The clinic is closed on this day." };
  }

  const blocked = await listBlockedForDate(date);
  const fullDayBlock = blocked.find((period) => !period.startTime || !period.endTime);
  if (fullDayBlock) {
    return {
      date,
      slots: [],
      isClosed: true,
      closedReason: fullDayBlock.reason
        ? `Clinic closed: ${fullDayBlock.reason}`
        : "The clinic is closed on this date.",
    };
  }

  const busy = await activeAppointmentsForDate(date, options?.excludeAppointmentId);

  const openMinutes = timeToMinutes(workingHour.openTime);
  const closeMinutes = timeToMinutes(workingHour.closeTime);
  const breakStart = workingHour.breakStart ? timeToMinutes(workingHour.breakStart) : null;
  const breakEnd = workingHour.breakEnd ? timeToMinutes(workingHour.breakEnd) : null;

  let minStartMinutes = -1;
  if (date === today) {
    minStartMinutes = timeToMinutes(timeInTimeZone(settings.timezone)) + settings.minNoticeMinutes;
  }

  const slots: Slot[] = [];
  const interval = settings.slotIntervalMinutes;

  for (let start = openMinutes; start + durationMinutes <= closeMinutes; start += interval) {
    const end = start + durationMinutes;
    const time = minutesToTime(start);
    const endTime = minutesToTime(end);

    let reason: string | undefined;

    if (breakStart !== null && breakEnd !== null && overlaps(start, end, breakStart, breakEnd)) {
      reason = "Clinic break";
    } else {
      const overlapBlock = blocked.find(
        (period) =>
          period.startTime &&
          period.endTime &&
          overlaps(start, end, timeToMinutes(period.startTime), timeToMinutes(period.endTime)),
      );
      if (overlapBlock) {
        reason = overlapBlock.reason ? `Blocked: ${overlapBlock.reason}` : "Unavailable";
      } else if (
        busy.some((row) => overlaps(start, end, timeToMinutes(row.start_time), timeToMinutes(row.end_time)))
      ) {
        reason = "Already booked";
      } else if (minStartMinutes >= 0 && start < minStartMinutes) {
        reason = "Too soon to book";
      }
    }

    slots.push({ time, endTime, available: !reason, reason });
  }

  return { date, slots, isClosed: false };
}

export async function availableSlotTimes(
  date: string,
  durationMinutes: number,
  options?: { excludeAppointmentId?: number },
): Promise<string[]> {
  const result = await computeSlots(date, durationMinutes, options);
  return result.slots.filter((slot) => slot.available).map((slot) => slot.time);
}

/**
 * Rechecks whether a specific slot is bookable, returning a human-readable
 * reason when it is not.
 */
export async function checkSlotBookable(
  date: string,
  startTime: string,
  durationMinutes: number,
  options?: { excludeAppointmentId?: number },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const result = await computeSlots(date, durationMinutes, options);
  if (result.isClosed) {
    return { ok: false, reason: result.closedReason ?? "The clinic is closed on this date." };
  }
  const slot = result.slots.find((candidate) => candidate.time === startTime);
  if (!slot) {
    return { ok: false, reason: "That time is outside the clinic's opening hours for the selected service." };
  }
  if (!slot.available) {
    return { ok: false, reason: slot.reason ?? "That time slot is no longer available." };
  }
  return { ok: true };
}
