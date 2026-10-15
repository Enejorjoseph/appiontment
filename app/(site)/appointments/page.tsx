import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { listPastPatientAppointments, listUpcomingPatientAppointments } from "@/lib/appointments";
import { getAppointmentPhase } from "@/lib/appointment-phase";
import { getCurrentPatient } from "@/lib/auth/patient";
import { formatDateLong, formatTimeRange, timeInTimeZone, todayInTimeZone } from "@/lib/datetime";
import { PAGE_SIZE, parsePage } from "@/lib/pagination";
import { getSettings } from "@/lib/settings";
import type { Appointment } from "@/lib/types";

export const metadata = { title: "View appointments" };

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const settings = await getSettings();
  const patient = await getCurrentPatient();

  if (!patient) {
    return (
      <>
        <PageHero
          eyebrow={settings.clinicName}
          title="View appointments"
          description="Sign in to see your upcoming and past appointments in one place."
        />
        <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <Card>
            <CardHeader title="Please sign in" />
            <CardBody className="space-y-4 text-sm text-slate-600">
              <p>
                Your appointments are linked to your account, so please sign in to view them.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/login?next=%2Fappointments"
                  className={buttonClass({ variant: "primary", size: "md" })}
                >
                  Sign in
                </Link>
                <Link href="/signup" className={buttonClass({ variant: "outline", size: "md" })}>
                  Create an account
                </Link>
              </div>
            </CardBody>
          </Card>
        </section>
      </>
    );
  }

  const params = await searchParams;
  const today = todayInTimeZone(settings.timezone);
  const now = timeInTimeZone(settings.timezone);

  const upcoming = await listUpcomingPatientAppointments(patient.id, {
    today,
    now,
    page: parsePage(params.upage),
    pageSize: PAGE_SIZE,
  });
  const past = await listPastPatientAppointments(patient.id, {
    today,
    now,
    page: parsePage(params.ppage),
    pageSize: PAGE_SIZE,
  });

  const makeUpcomingHref = (targetPage: number) => {
    const sp = new URLSearchParams();
    if (targetPage > 1) sp.set("upage", String(targetPage));
    if (parsePage(params.ppage) > 1) sp.set("ppage", String(parsePage(params.ppage)));
    const qs = sp.toString();
    return qs ? `/appointments?${qs}` : "/appointments";
  };

  const makePastHref = (targetPage: number) => {
    const sp = new URLSearchParams();
    if (parsePage(params.upage) > 1) sp.set("upage", String(parsePage(params.upage)));
    if (targetPage > 1) sp.set("ppage", String(targetPage));
    const qs = sp.toString();
    return qs ? `/appointments?${qs}` : "/appointments";
  };

  return (
    <>
      <PageHero
        eyebrow={settings.clinicName}
        title="Your appointments"
        description={`Signed in as ${patient.name}. View and manage your appointments at ${settings.clinicName}.`}
        action={
          <Link href="/book" className={buttonClass({ variant: "primary", size: "md" })}>
            Book new appointment
          </Link>
        }
      />

      <section className="mx-auto max-w-4xl space-y-10 px-4 py-14 sm:px-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-navy-800">
            Upcoming{upcoming.total > 0 ? ` (${upcoming.total})` : ""}
          </h2>
          {upcoming.total === 0 ? (
            <EmptyState
              title="No upcoming appointments"
              description="You have no upcoming appointments booked."
              action={
                <Link href="/book" className={buttonClass({ variant: "primary", size: "sm" })}>
                  Book an appointment
                </Link>
              }
            />
          ) : (
            <>
              <div className="space-y-3">
                {upcoming.items.map((appointment) => (
                  <AppointmentRow key={appointment.id} appointment={appointment} today={today} now={now} />
                ))}
              </div>
              <Pagination
                page={upcoming.page}
                totalPages={upcoming.totalPages}
                totalItems={upcoming.total}
                pageSize={upcoming.pageSize}
                makeHref={makeUpcomingHref}
              />
            </>
          )}
        </div>

        {past.total > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-navy-800">Past appointments ({past.total})</h2>
            <div className="space-y-3">
              {past.items.map((appointment) => (
                <AppointmentRow key={appointment.id} appointment={appointment} today={today} now={now} />
              ))}
            </div>
            <Pagination
              page={past.page}
              totalPages={past.totalPages}
              totalItems={past.total}
              pageSize={past.pageSize}
              makeHref={makePastHref}
            />
          </div>
        ) : null}
      </section>
    </>
  );
}

function AppointmentRow({
  appointment,
  today,
  now,
}: {
  appointment: Appointment;
  today: string;
  now: string;
}) {
  const phase = getAppointmentPhase(appointment, today, now);

  return (
    <Card>
      <CardBody className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-sm shadow-brand-600/30">
            <Icon name="calendar" className="h-5 w-5" />
          </span>
          <div>
            <p className="font-medium text-navy-800">{appointment.serviceName}</p>
            <p className="text-sm text-slate-600">
              {formatDateLong(appointment.appointmentDate)} ·{" "}
              {formatTimeRange(appointment.startTime, appointment.endTime)}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Reference: <span className="font-mono">{appointment.reference}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={appointment.status} phase={phase} />
          <Link
            href={`/booking/${appointment.reference}`}
            className={buttonClass({ variant: "outline", size: "sm" })}
          >
            View
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
