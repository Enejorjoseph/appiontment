"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { createBookingAction } from "@/app/actions/booking";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { EMPTY_FORM_STATE } from "@/lib/action-state";
import { formatDateLong, formatTimeRange } from "@/lib/datetime";
import { formatDuration, formatNaira } from "@/lib/format";
import type { PatientUser, Service, SlotResult } from "@/lib/types";

interface BookingFormProps {
  services: Service[];
  initialServiceId: number | null;
  today: string;
  maxDate: string;
  timezone: string;
  patient: PatientUser;
}

export function BookingForm({
  services,
  initialServiceId,
  today,
  maxDate,
  timezone,
  patient,
}: BookingFormProps) {
  const [state, formAction, pending] = useActionState(createBookingAction, EMPTY_FORM_STATE);

  const [serviceId, setServiceId] = useState<string>(
    initialServiceId ? String(initialServiceId) : "",
  );
  const [date, setDate] = useState<string>(today);
  const [slot, setSlot] = useState<string>("");
  const [patientName, setPatientName] = useState(patient.name);
  const [patientPhone, setPatientPhone] = useState(patient.phone);
  const [reason, setReason] = useState("");

  const [slotResult, setSlotResult] = useState<SlotResult | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotLoadError, setSlotLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const service = services.find((item) => String(item.id) === serviceId);

  useEffect(() => {
    if (!serviceId || !date) return;
    const controller = new AbortController();
    let active = true;

    const load = async () => {
      setLoadingSlots(true);
      setSlotLoadError(null);
      try {
        const response = await fetch(`/api/availability?serviceId=${serviceId}&date=${date}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? "Could not load available times.");
        }
        const result = (await response.json()) as SlotResult;
        if (!active) return;
        setSlotResult(result);
        setSlot((current) =>
          result.slots.some((item) => item.time === current && item.available) ? current : "",
        );
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (active) {
          setSlotLoadError(error instanceof Error ? error.message : "Could not load available times.");
        }
      } finally {
        if (active) setLoadingSlots(false);
      }
    };

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [serviceId, date, refreshKey]);

  const canSubmit =
    Boolean(serviceId) &&
    Boolean(date) &&
    Boolean(slot) &&
    patientName.trim().length > 1 &&
    patient.email.length > 3 &&
    patientPhone.trim().length > 6;

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-6">
        {state.message ? (
          <Alert variant={state.ok ? "success" : "error"}>{state.message}</Alert>
        ) : null}

        <Card>
          <CardHeader
            title="1. Choose a service and date"
            description={`Available times are shown in ${timezone}.`}
          />
          <CardBody className="space-y-5">
            <Field label="Service" htmlFor="serviceId" required error={state.errors.serviceId}>
              <Select
                id="serviceId"
                name="serviceId"
                value={serviceId}
                onChange={(event) => {
                  setServiceId(event.target.value);
                  setSlot("");
                }}
                required
                invalid={Boolean(state.errors.serviceId)}
              >
                <option value="">Select a service…</option>
                {services.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} — {formatNaira(item.price)} · {formatDuration(item.durationMinutes)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Appointment date" htmlFor="appointmentDate" required error={state.errors.appointmentDate}>
              <Input
                id="appointmentDate"
                name="appointmentDate"
                type="date"
                min={today}
                max={maxDate}
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setSlot("");
                }}
                required
                invalid={Boolean(state.errors.appointmentDate)}
              />
            </Field>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-navy-700">Available time slots</p>
                {serviceId && date ? (
                  <button
                    type="button"
                    onClick={() => setRefreshKey((key) => key + 1)}
                    className="text-xs font-medium text-brand-700 hover:underline"
                  >
                    Refresh times
                  </button>
                ) : null}
              </div>
              {!serviceId || !date ? (
                <p className="rounded-xl border border-dashed border-navy-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  Select a service and date to see available times.
                </p>
              ) : loadingSlots ? (
                <p className="rounded-xl border border-dashed border-navy-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  Loading available times…
                </p>
              ) : slotLoadError ? (
                <Alert variant="error">{slotLoadError}</Alert>
              ) : slotResult?.isClosed ? (
                <Alert variant="warning">{slotResult.closedReason}</Alert>
              ) : slotResult && slotResult.slots.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {slotResult.slots.map((item) => {
                      const selected = item.time === slot;
                      return (
                        <button
                          key={item.time}
                          type="button"
                          disabled={!item.available}
                          title={item.available ? undefined : item.reason}
                          aria-pressed={selected}
                          onClick={() => setSlot(item.time)}
                          className={
                            selected
                              ? "rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 ring-1 ring-inset ring-brand-600"
                              : item.available
                                ? "rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm text-navy-700 transition hover:-translate-y-0.5 hover:border-brand-400 hover:text-brand-700 hover:shadow-sm"
                                : "cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-400 line-through"
                          }
                        >
                          {item.time}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded border border-navy-200 bg-white" /> Available
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded bg-brand-600" /> Selected
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded border border-slate-200 bg-slate-100" /> Unavailable
                    </span>
                  </div>
                </>
              ) : (
                <p className="rounded-xl border border-dashed border-navy-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No time slots are available on this date for the selected service.
                </p>
              )}
              {state.errors.startTime ? (
                <p className="mt-2 text-xs font-medium text-red-600">{state.errors.startTime}</p>
              ) : null}
              <input type="hidden" name="startTime" value={slot} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="2. Your details"
            description={`Signed in as ${patient.name}. Your contact details are saved to your account.`}
          />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              htmlFor="patientName"
              required
              error={state.errors.patientName}
              className="sm:col-span-2"
            >
              <Input
                id="patientName"
                name="patientName"
                autoComplete="name"
                value={patientName}
                onChange={(event) => setPatientName(event.target.value)}
                required
                invalid={Boolean(state.errors.patientName)}
              />
            </Field>
            <Field
              label="Email address"
              htmlFor="patientEmail"
              required
              error={state.errors.patientEmail}
              hint="This comes from your account and cannot be changed here."
            >
              <Input
                id="patientEmail"
                name="patientEmail"
                type="email"
                autoComplete="email"
                value={patient.email}
                readOnly
                tabIndex={-1}
                aria-readonly="true"
                required
                invalid={Boolean(state.errors.patientEmail)}
              />
            </Field>
            <Field label="Phone number" htmlFor="patientPhone" required error={state.errors.patientPhone}>
              <Input
                id="patientPhone"
                name="patientPhone"
                type="tel"
                autoComplete="tel"
                placeholder="+234 800 000 0000"
                value={patientPhone}
                onChange={(event) => setPatientPhone(event.target.value)}
                required
                invalid={Boolean(state.errors.patientPhone)}
              />
            </Field>
            <Field
              label="Reason for visit (optional)"
              htmlFor="reason"
              error={state.errors.reason}
              className="sm:col-span-2"
              hint="A short note helps the clinic prepare. Do not include sensitive medical details."
            >
              <Textarea
                id="reason"
                name="reason"
                rows={3}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                invalid={Boolean(state.errors.reason)}
              />
            </Field>
          </CardBody>
        </Card>
      </div>

      <div className="lg:sticky lg:top-20 lg:self-start">
        <Card className="border-brand-200 shadow-lg shadow-brand-600/10">
          <CardHeader
            title="3. Review and confirm"
            className="rounded-t-2xl bg-gradient-to-r from-brand-50 to-white"
          />
          <CardBody className="space-y-4">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Service</dt>
                <dd className="text-right font-medium text-navy-800">
                  {service ? service.name : "Not selected"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Fee</dt>
                <dd className="text-right font-medium text-navy-800">
                  {service ? formatNaira(service.price) : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Duration</dt>
                <dd className="text-right font-medium text-navy-800">
                  {service ? formatDuration(service.durationMinutes) : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Date</dt>
                <dd className="text-right font-medium text-navy-800">
                  {date ? formatDateLong(date) : "Not selected"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Time</dt>
                <dd className="text-right font-medium text-navy-800">
                  {slot && service
                    ? formatTimeRange(slot, addMinutes(slot, service.durationMinutes))
                    : "Not selected"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Patient</dt>
                <dd className="text-right font-medium text-navy-800">
                  {patientName || "Not provided"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Email</dt>
                <dd className="max-w-[60%] break-all text-right font-medium text-navy-800">
                  {patient.email}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Phone</dt>
                <dd className="text-right font-medium text-navy-800">
                  {patientPhone || "Not provided"}
                </dd>
              </div>
            </dl>

            <Button type="submit" disabled={!canSubmit || pending} className="w-full" size="lg">
              {pending ? "Booking…" : "Confirm appointment"}
            </Button>
            <p className="text-center text-xs text-slate-500">
              You will receive a booking reference you can use to look up the appointment.
            </p>
            <a href="/appointments" className={buttonClass({ variant: "ghost", size: "sm", className: "w-full" })}>
              Already booked? View appointments
            </a>
          </CardBody>
        </Card>
      </div>
    </form>
  );
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor((((total % 1440) + 1440) % 1440) / 60);
  const mm = ((total % 60) + 60) % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
