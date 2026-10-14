import { deleteBlockedPeriodAction } from "@/app/actions/admin";
import { BlockedPeriodForm } from "@/components/admin/blocked-period-form";
import { WorkingHoursForm } from "@/components/admin/working-hours-form";
import { buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { listBlockedPeriods } from "@/lib/blocked";
import { formatDateLong, formatTime12, todayInTimeZone } from "@/lib/datetime";
import { getSettings, getWorkingHours } from "@/lib/settings";

export const metadata = { title: "Availability" };

export default async function AdminAvailabilityPage() {
  const settings = await getSettings();
  const hours = await getWorkingHours();
  const blocked = await listBlockedPeriods();
  const today = todayInTimeZone(settings.timezone);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Availability"
        title="Working hours & blocked dates"
        description={`Availability is calculated from these settings using the "${settings.timezone}" time zone, a ${settings.slotIntervalMinutes}-minute slot interval and a ${settings.minNoticeMinutes}-minute minimum notice.`}
      />

      <Card>
        <CardHeader
          title="Opening hours"
          description="Set opening and closing times per weekday, plus an optional break."
        />
        <CardBody>
          <WorkingHoursForm hours={hours} />
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Block a date or time"
            description="Blocked periods are removed from the slots patients can book."
          />
          <CardBody>
            <BlockedPeriodForm today={today} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={`Blocked periods (${blocked.length})`} />
          <CardBody>
            {blocked.length === 0 ? (
              <EmptyState
                title="No blocked periods"
                description="Add holidays, training days or maintenance windows here."
              />
            ) : (
              <ul className="divide-y divide-navy-50">
                {blocked.map((period) => (
                  <li key={period.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-navy-800">
                        {formatDateLong(period.date)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {period.startTime && period.endTime
                          ? `${formatTime12(period.startTime)} – ${formatTime12(period.endTime)}`
                          : "All day"}
                        {period.reason ? ` · ${period.reason}` : ""}
                      </p>
                    </div>
                    <form action={deleteBlockedPeriodAction}>
                      <input type="hidden" name="id" value={period.id} />
                      <ConfirmSubmitButton
                        message="Remove this blocked period?"
                        className={buttonClass({ variant: "ghost", size: "sm", className: "text-red-600 hover:bg-red-50" })}
                      >
                        Remove
                      </ConfirmSubmitButton>
                    </form>
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
