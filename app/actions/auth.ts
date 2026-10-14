"use server";

import { redirect } from "next/navigation";
import {
  destroyPatientSession,
  patientLogin,
  patientSignup,
  purgeExpiredPatientSessions,
} from "@/lib/auth/patient";
import { validateLogin, validateSignup } from "@/lib/validation";
import type { FormState } from "@/lib/action-state";

function fail(message: string, errors: Record<string, string> = {}): FormState {
  return { ok: false, message, errors };
}

function nextPath(formData: FormData): string {
  const next = String(formData.get("next") ?? "").trim();
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export async function patientLoginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = validateLogin({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return fail("Please check your email and password.", parsed.errors);

  const patient = await patientLogin(parsed.data.email, parsed.data.password);
  if (!patient) return fail("Invalid email or password.");

  await purgeExpiredPatientSessions();
  redirect(nextPath(formData));
}

export async function patientSignupAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = validateSignup({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) return fail("Please correct the highlighted fields.", parsed.errors);

  const outcome = await patientSignup(
    parsed.data.name,
    parsed.data.email,
    parsed.data.password,
    parsed.data.phone,
  );
  if (!outcome.ok) {
    return fail(outcome.reason, { email: parsed.data.email });
  }

  await purgeExpiredPatientSessions();
  redirect(nextPath(formData));
}

export async function patientLogoutAction(): Promise<void> {
  await destroyPatientSession();
  redirect("/");
}