import { computeSlots } from "@/lib/availability";
import { createAppointment, getAppointmentByReference } from "@/lib/appointments";
import { isValidISODate, isValidTime, todayInTimeZone, formatDateLong } from "@/lib/datetime";
import { bookingConfirmationEmail, notifySafely } from "@/lib/email";
import { getService, listServices } from "@/lib/services";
import { getSettings } from "@/lib/settings";
import type { ClinicSettings, PatientUser } from "@/lib/types";
import { generateContent, type GeminiContent, type GeminiFunctionDeclaration, type GeminiPart } from "./gemini";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface BookingResult {
  reference: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  autoConfirmed: boolean;
}

export interface ChatResult {
  reply: string;
  booking?: BookingResult;
}

const TOOLS: GeminiFunctionDeclaration[] = [
  {
    name: "list_services",
    description: "List the clinic services that can currently be booked.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "get_available_slots",
    description:
      "Get the appointment times that are genuinely available for a service on a given date.",
    parameters: {
      type: "object",
      properties: {
        serviceId: { type: "integer", description: "The numeric id of the chosen service." },
        date: { type: "string", description: "The date in YYYY-MM-DD format." },
      },
      required: ["serviceId", "date"],
    },
  },
  {
    name: "book_appointment",
    description:
      "Book an appointment. Only call this after the patient has confirmed the service, date and time.",
    parameters: {
      type: "object",
      properties: {
        serviceId: { type: "integer", description: "The numeric id of the chosen service." },
        date: { type: "string", description: "The date in YYYY-MM-DD format." },
        startTime: { type: "string", description: "The start time in 24-hour HH:MM format." },
        reason: { type: "string", description: "Optional short reason for the visit." },
      },
      required: ["serviceId", "date", "startTime"],
    },
  },
];

function systemInstruction(settings: ClinicSettings, patient: PatientUser, today: string): string {
  return [
    `You are the booking assistant for ${settings.clinicName}.`,
    "You help patients book an appointment through a short, friendly chat.",
    "",
    `Today's date is ${today} (time zone: ${settings.timezone}).`,
    `Appointments need at least ${settings.minNoticeMinutes} minutes notice and can be booked up to ${settings.maxBookingDays} days ahead.`,
    `The clinic is closed on days with no opening hours; only offer times returned by get_available_slots.`,
    "",
    "The patient is already signed in, so never ask for their name, email or phone number:",
    `- Name: ${patient.name}`,
    `- Email: ${patient.email}`,
    `- Phone: ${patient.phone}`,
    "",
    "Rules:",
    "1. If the patient has not chosen a service, call list_services and help them pick one.",
    "2. To offer times, call get_available_slots with the service id and a YYYY-MM-DD date. Never invent times.",
    "3. Present at most 6 available times and ask the patient to choose one.",
    "4. Before booking, summarise the service, date and time and ask the patient to confirm.",
    "5. Only call book_appointment after the patient confirms.",
    "6. After booking, share the booking reference and that a confirmation email was sent.",
    "7. Keep replies short (1-3 sentences). Do not discuss anything unrelated to the clinic.",
    `8. The clinic's cancellation policy: ${settings.cancellationPolicy}`,
  ].join("\n");
}

interface ToolOutcome {
  response: Record<string, unknown>;
  booking?: BookingResult;
}

async function executeTool(
  name: string,
  args: Record<string, unknown>,
  patient: PatientUser,
): Promise<ToolOutcome> {
  try {
    if (name === "list_services") {
      const services = await listServices({ activeOnly: true });
      return {
        response: {
          services: services.map((service) => ({
            id: service.id,
            name: service.name,
            description: service.description,
            price: service.price,
            durationMinutes: service.durationMinutes,
          })),
        },
      };
    }

    if (name === "get_available_slots") {
      const serviceId = Number(args.serviceId);
      const date = String(args.date ?? "");
      if (!Number.isInteger(serviceId) || serviceId <= 0) {
        return { response: { ok: false, error: "Invalid service id." } };
      }
      if (!isValidISODate(date)) {
        return { response: { ok: false, error: "Invalid date. Use YYYY-MM-DD." } };
      }
      const service = await getService(serviceId);
      if (!service || !service.isActive) {
        return { response: { ok: false, error: "That service is not available for booking." } };
      }
      const result = await computeSlots(date, service.durationMinutes);
      if (result.isClosed) {
        return {
          response: { ok: false, closed: true, reason: result.closedReason ?? "The clinic is closed." },
        };
      }
      const availableTimes = result.slots.filter((slot) => slot.available).map((slot) => slot.time);
      return {
        response: {
          ok: true,
          service: service.name,
          durationMinutes: service.durationMinutes,
          date,
          availableTimes,
          note: availableTimes.length === 0 ? "No free times on that date." : undefined,
        },
      };
    }

    if (name === "book_appointment") {
      const serviceId = Number(args.serviceId);
      const date = String(args.date ?? "");
      const startTime = String(args.startTime ?? "");
      const reason = typeof args.reason === "string" ? args.reason : "";
      if (!Number.isInteger(serviceId) || serviceId <= 0) {
        return { response: { ok: false, error: "Invalid service id." } };
      }
      if (!isValidISODate(date)) {
        return { response: { ok: false, error: "Invalid date. Use YYYY-MM-DD." } };
      }
      if (!isValidTime(startTime)) {
        return { response: { ok: false, error: "Invalid time. Use 24-hour HH:MM." } };
      }

      const outcome = await createAppointment(
        {
          serviceId,
          appointmentDate: date,
          startTime,
          patientName: patient.name,
          patientEmail: patient.email,
          patientPhone: patient.phone,
          reason,
        },
        patient.id,
      );
      if (!outcome.ok) {
        return { response: { ok: false, error: outcome.reason } };
      }

      const created = await getAppointmentByReference(outcome.reference);
      if (created) await notifySafely(bookingConfirmationEmail(created));

      const booking: BookingResult = created
        ? {
            reference: created.reference,
            serviceName: created.serviceName,
            date: created.appointmentDate,
            startTime: created.startTime,
            endTime: created.endTime,
            autoConfirmed: outcome.autoConfirmed,
          }
        : {
            reference: outcome.reference,
            serviceName: "",
            date,
            startTime,
            endTime: "",
            autoConfirmed: outcome.autoConfirmed,
          };

      return {
        response: {
          ok: true,
          reference: outcome.reference,
          autoConfirmed: outcome.autoConfirmed,
          dateLabel: formatDateLong(date),
        },
        booking,
      };
    }

    return { response: { ok: false, error: `Unknown tool: ${name}` } };
  } catch (error) {
    return { response: { ok: false, error: error instanceof Error ? error.message : "Tool failed." } };
  }
}

const MAX_STEPS = 6;

/**
 * Runs one turn of the booking conversation: sends the history to Gemini,
 * executes any requested tools, and continues until the model produces a
 * text reply.
 */
export async function runBookingChat(
  messages: ChatMessage[],
  patient: PatientUser,
): Promise<ChatResult> {
  const settings = await getSettings();
  const today = todayInTimeZone(settings.timezone);
  const system = systemInstruction(settings, patient, today);

  const contents: GeminiContent[] = messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));

  let booking: BookingResult | undefined;

  for (let step = 0; step < MAX_STEPS; step += 1) {
    const candidate = await generateContent({
      contents,
      tools: [{ functionDeclarations: TOOLS }],
      systemInstruction: system,
    });

    const parts = candidate.content.parts ?? [];
    const calls = parts.filter((part) => part.functionCall);

    if (calls.length === 0) {
      const reply = parts
        .map((part) => part.text ?? "")
        .join("")
        .trim();
      return {
        reply: reply || "Sorry, I didn't catch that. Could you rephrase?",
        booking,
      };
    }

    // Echo the model turn verbatim so the thought signature is preserved.
    contents.push({ role: "model", parts });

    const responseParts: GeminiPart[] = [];
    for (const part of calls) {
      const call = part.functionCall!;
      const outcome = await executeTool(call.name, call.args ?? {}, patient);
      if (outcome.booking) booking = outcome.booking;
      responseParts.push({
        functionResponse: {
          name: call.name,
          response: outcome.response,
          ...(call.id ? { id: call.id } : {}),
        },
      });
    }
    contents.push({ role: "user", parts: responseParts });
  }

  return {
    reply: "Sorry, that's taking longer than expected. Please try again or use the booking form.",
    booking,
  };
}
