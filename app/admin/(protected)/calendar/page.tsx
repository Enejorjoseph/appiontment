import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { listAppointments } from "@/lib/appointments";
import { formatDateLong, formatTimeRange, todayInTimeZone, WEEKDAY_SHORT } from "@/lib/datetime";
import { getSettings } from "@/lib/settings";
import { STATUS_DOT_STYLES } from "@/lib/status";
import type { Appointment } from "@/lib/types";

export const metadata = { title: "Calendar" };

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function monthBounds(month: string): { start: string; end: string; days: number; offset: number } {
  const [year, monthIndex] = month.split("-").map(Number);
  const days = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(year, monthIndex - 1, 1)).getUTCDay();
  return {
    start: `${month}-01`,
    end: `${month}-${String(days).padStart(2, "0")}`,
    days,
    offset: (firstWeekday + 6) % 7,
  };
}

function shiftMonth(month: string, delta: number): string {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthIndex - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string): string {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthIndex - 1, 1)));
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const settings = await getSettings();
  const today = todayInTimeZone(settings.timezone);
  const monthParam = first(params.month);
  const month = /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : today.slice(0, 7);
  const selectedDate = first(params.date);

  const { start, end, days, offset } = monthBounds(month);
  const appointments = await listAppointments({ from: start, to: end, status: undefined });

  const byDate = new Map<string, Appointment[]>();
  for (const appointment of appointments) {
    const list = byDate.get(appointment.appointmentDate) ?? [];
    list.push(appointment);
    byDate.set(appointment.appointmentDate, list);
  }

  const selected = selectedDate ? (byDate.get(selectedDate) ?? []) : [];
  const cells: Array<string | null> = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: days }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Calendar"
        title={monthLabel(month)}
        description="Month view of all appointments. Select a day to see its schedule."
        action={
          <>
            <Link
              href={`/admin/calendar?month=${shiftMonth(month, -1)}`}
              className={buttonClass({ variant: "outline", size: "sm" })}
            >
              ← Prev
            </Link>
            <Link href="/admin/calendar" className={buttonClass({ variant: "ghost", size: "sm" })}>
              Today
            </Link>
            <Link
              href={`/admin/calendar?month=${shiftMonth(month, 1)}`}
              className={buttonClass({ variant: "outline", size: "sm" })}
            >
              Next →
            </Link>
          </>
        }
      />

      <Card>
        <CardBody>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
            {[1, 2, 3, 4, 5, 6, 0].map((weekday) => (
              <div key={weekday} className="py-2">
                {WEEKDAY_SHORT[weekday]}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, index) => {
              if (!date) return <div key={`empty-${index}`} className="min-h-24 rounded-lg bg-slate-50/50" />;
              const dayAppointments = byDate.get(date) ?? [];
              const isToday = date === today;
              const isSelected = date === selectedDate;
              return (
                <Link
                  key={date}
                  href={`/admin/calendar?month=${month}&date=${date}`}
                  className={[
                    "min-h-24 rounded-lg border p-2 transition",
                    isSelected
                      ? "border-brand-400 bg-brand-50"
                      : isToday
                        ? "border-navy-300 bg-white"
                        : "border-navy-100 bg-white hover:border-brand-200",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={[
                        "text-xs font-semibold",
                        isToday ? "text-brand-700" : "text-navy-700",
                      ].join(" ")}
                    >
                      {Number(date.slice(-2))}
                    </span>
                    {dayAppointments.length > 0 ? (
                      <span className="rounded-full bg-navy-100 px-1.5 text-[10px] font-medium text-navy-700">
                        {dayAppointments.length}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 space-y-1">
                    {dayAppointments.slice(0, 3).map((appointment) => (
                      <div key={appointment.id} className="flex items-center gap-1">
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT_STYLES[appointment.status]}`}
                        />
                        <span className="truncate text-[10px] text-slate-600">
                          {appointment.startTime} {appointment.patientName.split(" ")[0]}
                        </span>
                      </div>
                    ))}
                    {dayAppointments.length > 3 ? (
                      <p className="text-[10px] text-slate-400">+{dayAppointments.length - 3} more</p>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {selectedDate ? (
        <Card>
          <CardHeader
            title={formatDateLong(selectedDate)}
            description={`${selected.length} appointment${selected.length === 1 ? "" : "s"}`}
            action={
              <Link
                href={`/admin/appointments?date=${selectedDate}`}
                className={buttonClass({ variant: "ghost", size: "sm" })}
              >
                Open in list
              </Link>
            }
          />
          <CardBody>
            {selected.length === 0 ? (
              <EmptyState title="Nothing booked" description="There are no appointments on this day." />
            ) : (
              <ul className="divide-y divide-navy-50">
                {selected.map((appointment) => (
                  <li key={appointment.id} className="flex flex-wrap items-center gap-3 py-3">
                    <span className="w-28 text-sm font-medium text-navy-700">
                      {formatTimeRange(appointment.startTime, appointment.endTime)}
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-navy-800">
                        {appointment.patientName}
                      </span>
                      <span className="block text-xs text-slate-500">{appointment.serviceName}</span>
                    </span>
                    <StatusBadge status={appointment.status} />
                    <Link
                      href={`/admin/appointments/${appointment.id}`}
                      className={buttonClass({ variant: "outline", size: "sm" })}
                    >
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
