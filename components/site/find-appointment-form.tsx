"use client";

import { useActionState } from "react";
import { lookupAppointmentAction } from "@/app/actions/booking";
import { StatusBadge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { EMPTY_LOOKUP_STATE } from "@/lib/action-state";
import { formatDateLong, formatTimeRange } from "@/lib/datetime";
import { formatDuration, formatNaira } from "@/lib/format";

export function FindAppointmentForm({ initialReference = "" }: { initialReference?: string }) {
  const [state, formAction, pending] = useActionState(lookupAppointmentAction, EMPTY_LOOKUP_STATE);
  const appointment = state.appointment;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader
          title="Look up your appointment"
          description="Enter your booking reference and the email address you booked with."
        />
        <CardBody>
          <form action={formAction} className="space-y-4">
            {state.message && !state.ok ? <Alert variant="error">{state.message}</Alert> : null}

            <Field label="Booking reference" htmlFor="reference" required error={state.errors.reference}>
              <Input
                id="reference"
                name="reference"
                placeholder="CP-XXXXXX"
                defaultValue={initialReference}
                autoComplete="off"
                required
                invalid={Boolean(state.errors.reference)}
                className="font-mono uppercase tracking-wider"
              />
            </Field>

            <Field label="Email address" htmlFor="lookup-email" required error={state.errors.email}>
              <Input
                id="lookup-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                invalid={Boolean(state.errors.email)}
              />
            </Field>

            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Searching…" : "Find my appointment"}
            </Button>

            <p className="text-xs text-slate-500">
              For your privacy, both values must match before any details are shown.
            </p>
          </form>
        </CardBody>
      </Card>

      <div>
        {appointment ? (
          <Card className="cp-fade-in">
            <CardHeader
              title="Appointment found"
              action={<StatusBadge status={appointment.status} phase={appointment.phase} />}
            />
            <CardBody className="space-y-4">
              <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                <Info label="Reference" value={appointment.reference} />
                <Info label="Patient" value={appointment.patientName} />
                <Info label="Service" value={appointment.serviceName} />
                <Info label="Fee" value={formatNaira(appointment.servicePrice)} />
                <Info label="Duration" value={formatDuration(appointment.serviceDuration)} />
                <Info label="Date" value={formatDateLong(appointment.appointmentDate)} />
                <Info
                  label="Time"
                  value={formatTimeRange(appointment.startTime, appointment.endTime)}
                  className="sm:col-span-2"
                />
                {appointment.reason ? (
                  <Info label="Reason for visit" value={appointment.reason} className="sm:col-span-2" />
                ) : null}
              </dl>
              <Alert variant="info">
                {appointment.phase === "past"
                  ? "This appointment's date has already passed, so it can no longer be cancelled or rescheduled through the assistant. Contact the clinic if you need help."
                  : "To cancel or reschedule, contact the clinic with your reference. Staff will update the appointment and release the time slot."}
              </Alert>
            </CardBody>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardBody className="py-12 text-center text-sm text-slate-500">
              Your appointment details will appear here once your reference and email are verified.
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-navy-800">{value}</dd>
    </div>
  );
}
