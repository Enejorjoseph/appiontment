"use client";

import { useActionState, useEffect, useState } from "react";
import { cancelAppointmentAction, rescheduleAppointmentAction } from "@/app/actions/admin";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClass } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { EMPTY_FORM_STATE } from "@/lib/action-state";
import type { SlotResult } from "@/lib/types";

interface RescheduleFormProps {
  id: number;
  serviceId: number | null;
  currentDate: string;
  today: string;
  maxDate: string;
}

export function RescheduleForm({ id, serviceId, currentDate, today, maxDate }: RescheduleFormProps) {
  const [state, formAction, pending] = useActionState(rescheduleAppointmentAction, EMPTY_FORM_STATE);
  const [date, setDate] = useState(currentDate < today ? today : currentDate);
  const [slot, setSlot] = useState("");
  const [result, setResult] = useState<SlotResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceId || !date) return;
    const controller = new AbortController();
    let active = true;

    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await fetch(
          `/api/availability?serviceId=${serviceId}&date=${date}&excludeId=${id}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? "Could not load times.");
        }
        const slots = (await response.json()) as SlotResult;
        if (!active) return;
        setResult(slots);
        setSlot("");
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (active) setLoadError(error instanceof Error ? error.message : "Could not load times.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [serviceId, date, id]);

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? <Alert variant={state.ok ? "success" : "error"}>{state.message}</Alert> : null}
      <input type="hidden" name="id" value={id} />

      <Field label="New date" htmlFor="reschedule-date" required error={state.errors.appointmentDate}>
        <Input
          id="reschedule-date"
          name="appointmentDate"
          type="date"
          min={today}
          max={maxDate}
          value={date}
          onChange={(event) => setDate(event.target.value)}
          required
        />
      </Field>

      <div>
        <p className="mb-2 text-sm font-medium text-navy-700">Available time slots</p>
        {loading ? (
          <p className="rounded-lg bg-slate-50 px-4 py-4 text-center text-sm text-slate-500">
            Loading…
          </p>
        ) : !serviceId ? (
          <Alert variant="info">This appointment has no linked service, so it cannot be rescheduled.</Alert>
        ) : loadError ? (
          <Alert variant="error">{loadError}</Alert>
        ) : result?.isClosed ? (
          <Alert variant="warning">{result.closedReason}</Alert>
        ) : result && result.slots.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {result.slots.map((item) => {
              const selected = item.time === slot;
              return (
                <button
                  key={item.time}
                  type="button"
                  disabled={!item.available}
                  title={item.available ? undefined : item.reason}
                  onClick={() => setSlot(item.time)}
                  className={
                    selected
                      ? "rounded-lg bg-brand-600 px-2 py-2 text-xs font-medium text-white"
                      : item.available
                        ? "rounded-lg border border-navy-200 bg-white px-2 py-2 text-xs text-navy-700 hover:border-brand-400"
                        : "cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-2 py-2 text-xs text-slate-400 line-through"
                  }
                >
                  {item.time}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="rounded-lg bg-slate-50 px-4 py-4 text-center text-sm text-slate-500">
            No available times on this date.
          </p>
        )}
        {state.errors.startTime ? (
          <p className="mt-2 text-xs font-medium text-red-600">{state.errors.startTime}</p>
        ) : null}
        <input type="hidden" name="startTime" value={slot} />
      </div>

      <Button type="submit" disabled={pending || !slot} className="w-full">
        {pending ? "Rescheduling…" : "Reschedule appointment"}
      </Button>
    </form>
  );
}

export function CancelForm({ id }: { id: number }) {
  const [state, formAction, pending] = useActionState(cancelAppointmentAction, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? <Alert variant={state.ok ? "success" : "error"}>{state.message}</Alert> : null}
      <input type="hidden" name="id" value={id} />
      <Field
        label="Cancellation reason (optional)"
        htmlFor="cancel-reason"
        hint="Recorded on the appointment for reference."
      >
        <Textarea id="cancel-reason" name="reason" rows={3} placeholder="Reason for cancelling…" />
      </Field>
      <ConfirmSubmitButton
        message="Cancel this appointment? The patient will be notified and the slot will be released."
        disabled={pending}
        className={buttonClass({ variant: "danger", className: "w-full" })}
      >
        {pending ? "Cancelling…" : "Cancel appointment"}
      </ConfirmSubmitButton>
    </form>
  );
}
