import Link from "next/link";
import { AppointmentsTable } from "@/components/admin/appointments-table";
import { StatusBadge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import {
  getStats,
  recentAppointments,
  todayAppointments,
  upcomingAppointments,
} from "@/lib/appointments";
import { formatDateMedium, formatTime12, formatTimestamp, todayInTimeZone } from "@/lib/datetime";
import { isEmailConfigured } from "@/lib/email";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const settings = await getSettings();
  const today = todayInTimeZone(settings.timezone);
  const stats = await getStats();
  const todays = await todayAppointments(today);
  const upcoming = await upcomingAppointments(today, 6);
  const recent = await recentAppointments(6);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Dashboard"
        title="Clinic overview"
        description={`Live figures from the appointment database. Today is ${formatDateMedium(today)} (${settings.timezone}).`}
        action={
          <>
            <Link href="/admin/services" className={buttonClass({ variant: "outline", size: "sm" })}>
              Manage services
            </Link>
            <Link href="/admin/availability" className={buttonClass({ variant: "secondary", size: "sm" })}>
              Availability
            </Link>
          </>
        }
      />

      {!isEmailConfigured() ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Email delivery is not configured, so booking and status-change emails are not being sent.
          In-app records are still saved.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total" value={stats.total} accent="navy" />
        <StatCard label="Today" value={stats.today} accent="brand" hint={formatDateMedium(today)} />
        <StatCard label="Upcoming" value={stats.upcoming} accent="violet" hint="Future active bookings" />
        <StatCard label="Pending" value={stats.pending} accent="amber" />
        <StatCard label="Confirmed" value={stats.confirmed} accent="brand" />
        <StatCard label="Completed" value={stats.completed} accent="slate" />
      </div>

      <Card>
        <CardHeader
          title="Today's appointments"
          description={`${todays.length} scheduled for ${formatDateMedium(today)}`}
          action={
            <Link href="/admin/appointments" className={buttonClass({ variant: "ghost", size: "sm" })}>
              View all
            </Link>
          }
        />
        <CardBody>
          <AppointmentsTable
            appointments={todays}
            compact
            emptyTitle="No appointments today"
            emptyDescription="Nothing is booked for today. New bookings will appear here."
          />
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Upcoming appointments"
            description="The next active appointments on the schedule."
            action={
              <Link href="/admin/calendar" className={buttonClass({ variant: "ghost", size: "sm" })}>
                Calendar
              </Link>
            }
          />
          <CardBody>
            <AppointmentsTable
              appointments={upcoming}
              compact
              emptyTitle="No upcoming appointments"
              emptyDescription="There are no future active appointments yet."
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent booking activity" description="Newest bookings first." />
          <CardBody>
            {recent.length === 0 ? (
              <EmptyState title="No activity yet" description="New bookings will show here." />
            ) : (
              <ul className="space-y-3">
                {recent.map((appointment) => (
                  <li key={appointment.id} className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-navy-800">
                        {appointment.patientName}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {appointment.serviceName} · {formatDateMedium(appointment.appointmentDate)} ·{" "}
                        {formatTime12(appointment.startTime)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Booked {formatTimestamp(appointment.createdAt)}
                      </p>
                    </div>
                    <span className="ml-auto">
                      <StatusBadge status={appointment.status} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
