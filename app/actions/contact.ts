"use server";

import { headers } from "next/headers";
import { createContactMessage } from "@/lib/contact";
import { isEmailConfigured } from "@/lib/email";
import { getClientIdentifier, rateLimit } from "@/lib/rate-limit";
import { validateContact } from "@/lib/validation";
import type { FormState } from "@/lib/action-state";

export async function submitContactAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const headerList = await headers();
  const limiter = rateLimit(`contact:${getClientIdentifier(headerList)}`, 5, 60_000);
  if (!limiter.allowed) {
    return {
      ok: false,
      errors: {},
      message: `Too many messages sent. Please wait ${limiter.retryAfterSeconds} seconds.`,
    };
  }

  const parsed = validateContact({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { ok: false, errors: parsed.errors, message: "Please correct the highlighted fields." };
  }

  await createContactMessage(parsed.data);

  return {
    ok: true,
    errors: {},
    message: isEmailConfigured()
      ? "Thank you. Your message was recorded and a notification has been sent to the clinic."
      : "Thank you. Your message was recorded. Email delivery is not configured in this demo, so the clinic will see it in the dashboard.",
  };
}
