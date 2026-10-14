import { getSupabase, throwIfError } from "./supabase";
import { nowIso } from "./datetime";
import type { BlockedPeriod } from "./types";
import type { BlockedPeriodInput } from "./validation";

interface BlockedRow {
  id: number;
  date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string;
  created_by: number | null;
  created_at: string;
}

function mapBlocked(row: BlockedRow): BlockedPeriod {
  return {
    id: Number(row.id),
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    reason: row.reason,
    createdBy: row.created_by === null ? null : Number(row.created_by),
    createdAt: row.created_at,
  };
}

export async function listBlockedPeriods(): Promise<BlockedPeriod[]> {
  const { data, error } = await getSupabase()
    .from("blocked_periods")
    .select("*")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });
  throwIfError(error, "Could not load blocked periods");
  return (data as BlockedRow[]).map(mapBlocked);
}

export async function listBlockedForDate(date: string): Promise<BlockedPeriod[]> {
  const { data, error } = await getSupabase()
    .from("blocked_periods")
    .select("*")
    .eq("date", date)
    .order("start_time", { ascending: true });
  throwIfError(error, "Could not load blocked periods");
  return (data as BlockedRow[]).map(mapBlocked);
}

export async function createBlockedPeriod(
  input: BlockedPeriodInput,
  createdBy: number | null,
): Promise<number> {
  const { data, error } = await getSupabase()
    .from("blocked_periods")
    .insert({
      date: input.date,
      start_time: input.startTime,
      end_time: input.endTime,
      reason: input.reason,
      created_by: createdBy,
      created_at: nowIso(),
    })
    .select("id")
    .single();
  throwIfError(error, "Could not add blocked period");
  return Number((data as { id: number }).id);
}

export async function deleteBlockedPeriod(id: number): Promise<void> {
  const { error } = await getSupabase().from("blocked_periods").delete().eq("id", id);
  throwIfError(error, "Could not delete blocked period");
}

export async function getBlockedPeriod(id: number): Promise<BlockedPeriod | undefined> {
  const { data, error } = await getSupabase()
    .from("blocked_periods")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  throwIfError(error, "Could not load blocked period");
  return data ? mapBlocked(data as BlockedRow) : undefined;
}
