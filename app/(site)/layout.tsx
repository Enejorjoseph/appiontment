import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getCurrentPatient } from "@/lib/auth/patient";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const patient = await getCurrentPatient();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader clinicName={settings.clinicName} patient={patient} />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} />
    </div>
  );
}
