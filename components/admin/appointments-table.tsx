import Link from "next/link";
import { confirmAppointmentAction, completeAppointmentAction } from "@/app/actions/admin";
import { StatusBadge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateMedium, formatTimeRange } from "@/lib/datetime";
import { formatNaira } from "@/lib/format";
import type { Appointment } from "@/lib/types";

export function AppointmentsTable({
  appointments,
  emptyTitle = "No appointments found",
  emptyDescription = "Appointments will appear here once patients book.",
  compact = false,
}: {
  appointments: Appointment[];
  emptyTitle?: string;
  emptyDescription?: string;
  compact?: boolean;
}) {
  if (appointments.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto">
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
                <StatusBadge status={appointment.status} />
              </td>
              <td className="py-3">
                <div className="flex items-center justify-end gap-2">
                  {appointment.status === "pending" ? (
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
                  <Link
                    href={`/admin/appointments/${appointment.id}`}
                    className={buttonClass({ variant: "ghost", size: "sm" })}
                  >
                    View
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
