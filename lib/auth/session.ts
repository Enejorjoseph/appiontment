import { cookies } from "next/headers";
import { getSupabase, throwIfError } from "../supabase";
import type { AdminRole, AdminUser } from "../types";

const COOKIE_NAME = "carepoint_session";

interface AdminJson {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  created_at: string;
  updated_at: string;
}

function mapAdmin(row: AdminJson): AdminUser {
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Verifies credentials in the database and, on success, stores a session token
 * in an httpOnly cookie. Returns the signed-in admin or null.
 */
export async function login(email: string, password: string): Promise<AdminUser | null> {
  const { data, error } = await getSupabase().rpc("login_admin", {
    p_email: email,
    p_password: password,
  });
  throwIfError(error, "Could not sign in");

  const result = data as {
    ok: boolean;
    token?: string;
    expires_at?: string;
    admin?: AdminJson;
  } | null;

  if (!result?.ok || !result.token || !result.admin) return null;

  const store = await cookies();
  store.set(COOKIE_NAME, result.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: result.expires_at ? new Date(result.expires_at) : undefined,
  });

  return mapAdmin(result.admin);
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const { data, error } = await getSupabase().rpc("current_admin", { p_token: token });
  if (error) return null;
  if (!data) return null;
  return mapAdmin(data as AdminJson);
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await getSupabase().rpc("logout_admin", { p_token: token });
  }
  store.delete(COOKIE_NAME);
}

export async function purgeExpiredSessions(): Promise<void> {
  await getSupabase().rpc("purge_expired_sessions");
}
