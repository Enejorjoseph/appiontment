import { redirect } from "next/navigation";
import { getCurrentAdmin } from "./session";
import type { AdminUser } from "../types";

/**
 * Guarantees an authenticated admin for a protected route. Redirects to the
 * login page when no valid session exists.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
