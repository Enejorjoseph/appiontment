import Link from "next/link";
import { notFound } from "next/navigation";
import {
  confirmAppointmentAction,
  completeAppointmentAction,
  deleteAppointmentAction,
  noShowAppointmentAction,
} from "@/app/actions/admin";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { CancelForm, RescheduleForm } from "@/components/admin/appointment-actions";
import { StatusBadge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getAppointmentById } from "@/lib/appointments";
import { getAppointmentPhase } from "@/lib/appointment-phase";
import { addDays, formatDateLong, formatTimeRange, formatTimestamp, timeInTimeZone, todayInTimeZone } from "@/lib/datetime";
import { formatDuration, formatNaira } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { ALLOWED_TRANSITIONS, STATUS_DESCRIPTIONS } from "@/lib/status";

export const metadata = { title: "Appointment details" };

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) notFound();

  const appointment = await getAppointmentById(numericId);
  if (!appointment) notFound();

  const settings = await getSettings();
  const today = todayInTimeZone(settings.timezone);
  const now = timeInTimeZone(settings.timezone);
  const maxDate = addDays(today, settings.maxBookingDays);
  const transitions = ALLOWED_TRANSITIONS[appointment.status];
  const phase = getAppointmentPhase(appointment, today, now);
  const canConfirm = phase !== "past" && transitions.includes("confirmed");
  const canComplete = transitions.includes("completed");
  const canMarkNoShow = phase === "past" && transitions.includes("no_show");
  const canReschedule = phase !== "past" && transitions.includes("rescheduled");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/appointments" className="text-sm text-brand-700 hover:underline">
          ← Back to appointments
        </Link>
      </div>

      <PageHeader
        eyebrow={appointment.reference}
        title={appointment.patientName}
        description={`${appointment.serviceName} · ${formatDateLong(appointment.appointmentDate)}`}
        action={<StatusBadge status={appointment.status} phase={phase} />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Appointment information" />
            <CardBody>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Detail label="Reference" value={<span className="font-mono">{appointment.reference}</span>} />
                <Detail label="Status" value={<StatusBadge status={appointment.status} />} />
                <Detail label="Service" value={appointment.serviceName} />
                <Detail label="Fee" value={formatNaira(appointment.servicePrice)} />
                <Detail label="Duration" value={formatDuration(appointment.serviceDuration)} />
                <Detail label="Date" value={formatDateLong(appointment.appointmentDate)} />
                <Detail
                  label="Time"
                  value={formatTimeRange(appointment.startTime, appointment.endTime)}
                />
                <Detail label="Booked" value={formatTimestamp(appointment.createdAt)} />
                <Detail label="Last updated" value={formatTimestamp(appointment.updatedAt)} />
                {appointment.reason ? (
                  <Detail label="Reason for visit" value={appointment.reason} className="sm:col-span-2" />
                ) : null}
                {appointment.cancellationReason ? (
                  <Detail
                    label="Cancellation reason"
                    value={appointment.cancellationReason}
                    className="sm:col-span-2"
                  />
                ) : null}
              </dl>
              <p className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500">
                {phase === "past"
                  ? "This appointment's time has already passed and it has not been marked as completed, cancelled or a no-show."
                  : STATUS_DESCRIPTIONS[appointment.status]}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Patient contact" description="Information needed to manage this appointment." />
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Detail label="Name" value={appointment.patientName} />
              <Detail
                label="Email"
                value={
                  <a className="text-brand-700 hover:underline" href={`mailto:${appointment.patientEmail}`}>
                    {appointment.patientEmail}
                  </a>
                }
              />
              <Detail
                label="Phone"
                value={
                  <a
                    className="text-brand-700 hover:underline"
                    href={`tel:${appointment.patientPhone.replace(/\s+/g, "")}`}
                  >
                    {appointment.patientPhone}
                  </a>
                }
              />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Status actions" />
            <CardBody className="space-y-3">
              {transitions.length === 0 ? (
                <p className="text-sm text-slate-500">
                  This appointment is {appointment.status} and cannot be changed further.
                </p>
              ) : (
                <>
                  {canConfirm ? (
                    <form action={confirmAppointmentAction}>
                      <input type="hidden" name="id" value={appointment.id} />
                      <button type="submit" className={buttonClass({ variant: "primary", size: "md", className: "w-full" })}>
                        Confirm appointment
                      </button>
                    </form>
                  ) : null}
                  {canComplete ? (
                    <form action={completeAppointmentAction}>
                      <input type="hidden" name="id" value={appointment.id} />
                      <button type="submit" className={buttonClass({ variant: "secondary", size: "md", className: "w-full" })}>
                        Mark as completed
                      </button>
                    </form>
                  ) : null}
                  {canMarkNoShow ? (
                    <form action={noShowAppointmentAction}>
                      <input type="hidden" name="id" value={appointment.id} />
                      <button type="submit" className={buttonClass({ variant: "ghost", size: "md", className: "w-full" })}>
                        Mark as no-show
                      </button>
                    </form>
                  ) : null}
                  {!canConfirm && !canComplete && !canMarkNoShow ? (
                    <p className="text-sm text-slate-500">
                      No quick status actions are available for this state.
                    </p>
                  ) : null}
                </>
              )}
            </CardBody>
          </Card>

          {canReschedule ? (
            <Card>
              <CardHeader title="Reschedule" description="Availability excludes this appointment's current slot." />
              <CardBody>
                <RescheduleForm
                  id={appointment.id}
                  serviceId={appointment.serviceId}
                  currentDate={appointment.appointmentDate}
                  today={today}
                  maxDate={maxDate}
                />
              </CardBody>
            </Card>
          ) : null}

          {transitions.includes("cancelled") ? (
            <Card>
              <CardHeader title="Cancel appointment" description="The slot is released immediately." />
              <CardBody>
                <CancelForm id={appointment.id} />
              </CardBody>
            </Card>
          ) : null}

          {phase !== "upcoming" ? (
            <Card>
              <CardHeader
                title="Delete appointment"
                description="Permanently remove this past appointment and its record."
              />
              <CardBody>
                <form action={deleteAppointmentAction}>
                  <input type="hidden" name="id" value={appointment.id} />
                  <ConfirmSubmitButton
                    className={buttonClass({ variant: "danger", size: "md", className: "w-full" })}
                    title="Delete appointment?"
                    message="This permanently removes the appointment record. This cannot be undone."
                    confirmLabel="Delete appointment"
                    cancelLabel="Keep"
                    destructive
                  >
                    Delete appointment
                  </ConfirmSubmitButton>
                </form>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Detail({
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
      <dd className="mt-0.5 text-sm font-medium text-navy-800">{value}</dd>
    </div>
  );
}
