import { cookies } from "next/headers";
import { getSupabase, throwIfError } from "../supabase";
import type { PatientUser } from "../types";

const COOKIE_NAME = "carepoint_patient_session";

interface PatientJson {
  id: number;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

function mapPatient(row: PatientJson): PatientUser {
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    phone: row.phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function persistToken(token: string, expiresAt: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt ? new Date(expiresAt) : undefined,
  });
}

async function readToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value;
}

interface AuthResult {
  ok: boolean;
  token?: string;
  expires_at?: string;
  patient?: PatientJson;
  reason?: string;
}

/**
 * Verifies patient credentials in the database and, on success, stores a
 * session token in an httpOnly cookie. Returns the signed-in patient or null.
 */
export async function patientLogin(email: string, password: string): Promise<PatientUser | null> {
  const { data, error } = await getSupabase().rpc("login_patient", {
    p_email: email,
    p_password: password,
  });
  throwIfError(error, "Could not sign in");

  const result = data as AuthResult | null;
  if (!result?.ok || !result.token || !result.patient) return null;

  await persistToken(result.token, result.expires_at ?? "");
  return mapPatient(result.patient);
}

export type PatientSignupOutcome = { ok: true; user: PatientUser } | { ok: false; reason: string };

/**
 * Creates a patient account via the database (bcrypt hashing happens server
 * side) and signs the new patient in immediately.
 */
export async function patientSignup(
  name: string,
  email: string,
  password: string,
  phone: string,
): Promise<PatientSignupOutcome> {
  const { data, error } = await getSupabase().rpc("register_patient", {
    p_name: name,
    p_email: email,
    p_password: password,
    p_phone: phone,
  });
  throwIfError(error, "Could not create your account");

  const result = data as AuthResult | null;
  if (!result?.ok || !result.patient) {
    return { ok: false, reason: result?.reason ?? "Could not create your account." };
  }

  if (result.token && result.expires_at) {
    await persistToken(result.token, result.expires_at);
  }
  return { ok: true, user: mapPatient(result.patient) };
}

export async function getCurrentPatient(): Promise<PatientUser | null> {
  const token = await readToken();
  if (!token) return null;

  const { data, error } = await getSupabase().rpc("current_patient", { p_token: token });
  if (error) return null;
  if (!data) return null;
  return mapPatient(data as PatientJson);
}

export async function destroyPatientSession(): Promise<void> {
  const token = await readToken();
  if (token) {
    await getSupabase().rpc("logout_patient", { p_token: token });
  }
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function purgeExpiredPatientSessions(): Promise<void> {
  await getSupabase().rpc("purge_expired_patient_sessions");
}