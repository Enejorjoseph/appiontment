import type { Appointment } from "./types";
import { formatDateLong, formatTimeRange } from "./datetime";
import { formatNaira } from "./format";
import { STATUS_LABELS } from "./status";

export interface EmailResult {
  configured: boolean;
  sent: boolean;
  message: string;
}

interface ProviderConfig {
  apiKey: string;
  from: string;
}

function providerConfig(): ProviderConfig | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) return null;
  return { apiKey, from };
}

export function isEmailConfigured(): boolean {
  return providerConfig() !== null;
}

interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
}

/**
 * Sends an email through the configured provider. When no provider is
 * configured the function reports this honestly instead of pretending a
 * message was delivered.
 */
export async function sendEmail({ to, subject, text }: SendEmailInput): Promise<EmailResult> {
  const config = providerConfig();
  if (!config) {
    return {
      configured: false,
      sent: false,
      message: "Email delivery is not configured, so no email was sent.",
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: config.from, to, subject, text }),
    });
    if (!response.ok) {
      return {
        configured: true,
        sent: false,
        message: `The email provider rejected the request (status ${response.status}).`,
      };
    }
    return { configured: true, sent: true, message: "Email sent." };
  } catch {
    return {
      configured: true,
      sent: false,
      message: "The email provider could not be reached.",
    };
  }
}

function appointmentSummary(appointment: Appointment): string {
  return [
    `Reference: ${appointment.reference}`,
    `Service: ${appointment.serviceName}`,
    `Date: ${formatDateLong(appointment.appointmentDate)}`,
    `Time: ${formatTimeRange(appointment.startTime, appointment.endTime)}`,
    `Status: ${STATUS_LABELS[appointment.status]}`,
    `Fee: ${formatNaira(appointment.servicePrice)}`,
  ].join("\n");
}

export function bookingConfirmationEmail(appointment: Appointment): SendEmailInput {
  return {
    to: appointment.patientEmail,
    subject: `Appointment received — ${appointment.reference}`,
    text: `Hello ${appointment.patientName},\n\nWe received your appointment request at CarePoint Clinic.\n\n${appointmentSummary(
      appointment,
    )}\n\nKeep your booking reference safe. You can manage this appointment on our website using the reference and your email address.`,
  };
}

export function statusChangeEmail(
  appointment: Appointment,
  previousStatus: string,
): SendEmailInput {
  const verb =
    appointment.status === "cancelled"
      ? "cancelled"
      : appointment.status === "confirmed"
        ? "confirmed"
        : appointment.status === "completed"
          ? "marked as completed"
          : appointment.status === "rescheduled"
            ? "rescheduled"
            : "updated";

  return {
    to: appointment.patientEmail,
    subject: `Appointment ${verb} — ${appointment.reference}`,
    text: `Hello ${appointment.patientName},\n\nYour appointment has been ${verb} (previously ${previousStatus}).\n\n${appointmentSummary(
      appointment,
    )}\n\nCarePoint Clinic`,
  };
}

export function cancellationConfirmationEmail(appointment: Appointment): SendEmailInput {
  return statusChangeEmail(appointment, "active");
}

export async function notifySafely(input: SendEmailInput | null): Promise<EmailResult> {
  if (!input) {
    return { configured: isEmailConfigured(), sent: false, message: "No notification was required." };
  }
  return sendEmail(input);
}
