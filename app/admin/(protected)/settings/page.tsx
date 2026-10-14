import { SettingsForm } from "@/components/admin/settings-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { formatTimestamp } from "@/lib/datetime";
import { isEmailConfigured } from "@/lib/email";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Clinic settings"
        description="Control the clinic's public information and the rules used to calculate appointment availability."
      />

      <Card>
        <CardHeader
          title="Configuration"
          description={`Last updated ${formatTimestamp(settings.updatedAt)}`}
        />
        <CardBody>
          <SettingsForm settings={settings} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Notifications" />
        <CardBody className="text-sm text-slate-600">
          {isEmailConfigured() ? (
            <p>
              Email delivery is configured. Booking confirmations and status changes are sent to
              patients through the configured provider.
            </p>
          ) : (
            <p>
              Email delivery is not configured. Set <code className="rounded bg-slate-100 px-1">RESEND_API_KEY</code>{" "}
              and <code className="rounded bg-slate-100 px-1">EMAIL_FROM</code> to enable patient
              emails. Until then, all bookings and status changes are recorded in the dashboard and
              reported honestly to patients.
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
