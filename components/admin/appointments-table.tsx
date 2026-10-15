import Link from "next/link";
import {
  confirmAppointmentAction,
  completeAppointmentAction,
  deleteAppointmentAction,
  noShowAppointmentAction,
} from "@/app/actions/admin";
import { StatusBadge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import { getAppointmentPhase } from "@/lib/appointment-phase";
import { formatDateMedium, formatTimeRange } from "@/lib/datetime";
import { formatNaira } from "@/lib/format";
import type { Appointment } from "@/lib/types";

function Actions({ appointment, today, now }: { appointment: Appointment; today: string; now: string }) {
  const phase = getAppointmentPhase(appointment, today, now);
  const past = phase === "past";

  return (
    <>
      {!past && appointment.status === "pending" ? (
        <form action={confirmAppointmentAction}>
          <input type="hidden" name="id" value={appointment.id} />
          <button type="submit" className={buttonClass({ variant: "primary", size: "sm" })}>
            Confirm
          </button>
        </form>
      ) : null}
      {appointment.status === "confirmed" || appointment.status === "rescheduled" ? (
        <form action={completeAppointmentAction}>
          <input type="hidden" name="id" value={appointment.id} />
          <button type="submit" className={buttonClass({ variant: "outline", size: "sm" })}>
            Complete
          </button>
        </form>
      ) : null}
      {past &&
      (appointment.status === "pending" ||
        appointment.status === "confirmed" ||
        appointment.status === "rescheduled") ? (
        <form action={noShowAppointmentAction}>
          <input type="hidden" name="id" value={appointment.id} />
          <button type="submit" className={buttonClass({ variant: "ghost", size: "sm" })}>
            No-show
          </button>
        </form>
      ) : null}
      {phase !== "upcoming" ? (
        <form action={deleteAppointmentAction}>
          <input type="hidden" name="id" value={appointment.id} />
          <ConfirmSubmitButton
            className={buttonClass({ variant: "ghost", size: "sm", className: "text-red-600 hover:bg-red-50" })}
            title="Delete appointment?"
            message="This permanently removes the appointment record. This cannot be undone."
            confirmLabel="Delete"
            cancelLabel="Keep"
            destructive
          >
            Delete
          </ConfirmSubmitButton>
        </form>
      ) : null}
      <Link
        href={`/admin/appointments/${appointment.id}`}
        className={buttonClass({ variant: "ghost", size: "sm" })}
      >
        View
      </Link>
    </>
  );
}

export function AppointmentsTable({
  appointments,
  today,
  now,
  emptyTitle = "No appointments found",
  emptyDescription = "Appointments will appear here once patients book.",
  compact = false,
}: {
  appointments: Appointment[];
  today: string;
  now: string;
  emptyTitle?: string;
  emptyDescription?: string;
  compact?: boolean;
}) {
  if (appointments.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {appointments.map((appointment) => (
          <li key={appointment.id} className="rounded-xl border border-navy-100 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs text-navy-700">{appointment.reference}</p>
                <p className="mt-0.5 truncate font-medium text-navy-800">{appointment.patientName}</p>
                {!compact ? (
                  <p className="truncate text-xs text-slate-500">{appointment.patientEmail}</p>
                ) : null}
              </div>
              <StatusBadge status={appointment.status} phase={getAppointmentPhase(appointment, today, now)} />
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="min-w-0">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Service
                </dt>
                <dd className="truncate text-navy-700">{appointment.serviceName}</dd>
                <dd className="text-xs text-slate-500">{formatNaira(appointment.servicePrice)}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Date &amp; time
                </dt>
                <dd className="text-navy-700">{formatDateMedium(appointment.appointmentDate)}</dd>
                <dd className="text-xs text-slate-500">
                  {formatTimeRange(appointment.startTime, appointment.endTime)}
                </dd>
              </div>
            </dl>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Actions appointment={appointment} today={today} now={now} />
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2.5 pr-4 font-medium">Reference</th>
              <th className="py-2.5 pr-4 font-medium">Patient</th>
              <th className="py-2.5 pr-4 font-medium">Service</th>
              <th className="py-2.5 pr-4 font-medium">Date &amp; time</th>
              <th className="py-2.5 pr-4 font-medium">Status</th>
              <th className="py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-50">
            {appointments.map((appointment) => (
              <tr key={appointment.id} className="align-top hover:bg-slate-50">
                <td className="py-3 pr-4 font-mono text-xs text-navy-700">{appointment.reference}</td>
                <td className="py-3 pr-4">
                  <p className="font-medium text-navy-800">{appointment.patientName}</p>
                  {!compact ? <p className="text-xs text-slate-500">{appointment.patientEmail}</p> : null}
                </td>
                <td className="py-3 pr-4">
                  <p className="text-navy-700">{appointment.serviceName}</p>
                  <p className="text-xs text-slate-500">{formatNaira(appointment.servicePrice)}</p>
                </td>
                <td className="py-3 pr-4 text-navy-700">
                  <p>{formatDateMedium(appointment.appointmentDate)}</p>
                  <p className="text-xs text-slate-500">
                    {formatTimeRange(appointment.startTime, appointment.endTime)}
                  </p>
                </td>
                <td className="py-3 pr-4">
                  <StatusBadge status={appointment.status} phase={getAppointmentPhase(appointment, today, now)} />
                </td>
                <td className="py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Actions appointment={appointment} today={today} now={now} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
