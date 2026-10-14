import { getSupabase, throwIfError } from "./supabase";
import { nowIso } from "./datetime";
import type { Service, ServiceInput } from "./types";

interface ServiceRow {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function mapService(row: ServiceRow): Service {
  return {
    id: Number(row.id),
    name: row.name,
    description: row.description,
    price: Number(row.price),
    durationMinutes: Number(row.duration_minutes),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listServices(options?: { activeOnly?: boolean }): Promise<Service[]> {
  let query = getSupabase().from("services").select("*").order("name", { ascending: true });
  if (options?.activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query;
  throwIfError(error, "Could not load services");
  return (data as ServiceRow[]).map(mapService);
}

export async function getService(id: number): Promise<Service | undefined> {
  const { data, error } = await getSupabase()
    .from("services")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  throwIfError(error, "Could not load service");
  return data ? mapService(data as ServiceRow) : undefined;
}

export async function createService(input: ServiceInput): Promise<number> {
  const now = nowIso();
  const { data, error } = await getSupabase()
    .from("services")
    .insert({
      name: input.name,
      description: input.description,
      price: input.price,
      duration_minutes: input.durationMinutes,
      is_active: input.isActive,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();
  throwIfError(error, "Could not create service");
  return Number((data as { id: number }).id);
}

export async function updateService(id: number, input: ServiceInput): Promise<void> {
  const { error } = await getSupabase()
    .from("services")
    .update({
      name: input.name,
      description: input.description,
      price: input.price,
      duration_minutes: input.durationMinutes,
      is_active: input.isActive,
      updated_at: nowIso(),
    })
    .eq("id", id);
  throwIfError(error, "Could not update service");
}

export async function setServiceActive(id: number, isActive: boolean): Promise<void> {
  const { error } = await getSupabase()
    .from("services")
    .update({ is_active: isActive, updated_at: nowIso() })
    .eq("id", id);
  throwIfError(error, "Could not update service");
}

export async function countAppointmentsForService(id: number): Promise<number> {
  const { count, error } = await getSupabase()
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("service_id", id);
  throwIfError(error, "Could not count appointments");
  return count ?? 0;
}
