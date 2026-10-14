import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { getAppointmentByReference } from "@/lib/appointments";
import { formatDateLong, formatTimeRange } from "@/lib/datetime";
import { formatDuration, formatNaira } from "@/lib/format";
import { isEmailConfigured } from "@/lib/email";
import { getSettings } from "@/lib/settings";
import { STATUS_DESCRIPTIONS } from "@/lib/status";

export const metadata = { title: "Booking confirmation" };

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const appointment = await getAppointmentByReference(reference.toUpperCase());
  if (!appointment) notFound();

  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="cp-fade-in relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 p-8 text-white shadow-xl shadow-navy-900/20 sm:p-10">
        <div className="cp-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 0%, rgba(0,209,179,0.55), transparent 45%), radial-gradient(circle at 95% 15%, rgba(18,237,207,0.3), transparent 42%)",
          }}
        />
        <div className="relative">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg shadow-brand-600/40">
            <Icon name="check" className="h-7 w-7" />
          </span>
          <p className="mt-5 text-sm font-medium uppercase tracking-widest text-brand-200">
            Appointment received
          </p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
            Thank you, {appointment.patientName}
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-navy-100">
            Your appointment request has been saved at {settings.clinicName}. Keep the booking
            reference below safe — you will need it to look up or manage this appointment.
          </p>
          <p className="mt-6 inline-flex items-center rounded-xl bg-white px-5 py-2.5 font-mono text-xl font-semibold tracking-wider text-navy-800 shadow-lg">
            {appointment.reference}
          </p>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Appointment details"
          action={<StatusBadge status={appointment.status} />}
        />
        <CardBody>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Detail label="Clinic" value={settings.clinicName} />
            <Detail label="Patient" value={appointment.patientName} />
            <Detail label="Service" value={appointment.serviceName} />
            <Detail label="Fee" value={formatNaira(appointment.servicePrice)} />
            <Detail label="Duration" value={formatDuration(appointment.serviceDuration)} />
            <Detail label="Email" value={appointment.patientEmail} />
            <Detail label="Phone" value={appointment.patientPhone} />
            <Detail label="Date" value={formatDateLong(appointment.appointmentDate)} />
            <Detail
              label="Time"
              value={formatTimeRange(appointment.startTime, appointment.endTime)}
            />
            {appointment.reason ? (
              <Detail label="Reason for visit" value={appointment.reason} className="sm:col-span-2" />
            ) : null}
          </dl>
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader title="What happens next?" />
        <CardBody className="space-y-4 text-sm text-slate-600">
          <p>{STATUS_DESCRIPTIONS[appointment.status]}</p>
          <p>{settings.cancellationPolicy}</p>
          <div className="flex items-start gap-2.5 rounded-xl border border-navy-100 bg-slate-50/70 px-4 py-3 text-xs text-slate-500">
            <Icon name="mail" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <span>
              {isEmailConfigured()
                ? "A confirmation email has been requested through the clinic's email provider."
                : "Email delivery is not configured in this demonstration environment, so no email was sent. Your booking is safely stored and visible to clinic staff."}
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/find?reference=${encodeURIComponent(appointment.reference)}`}
              className={buttonClass({ variant: "secondary", size: "md" })}
            >
              Manage this appointment
            </Link>
            <Link href="/" className={buttonClass({ variant: "outline", size: "md" })}>
              Back to home
            </Link>
          </div>
        </CardBody>
      </Card>
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