import { FindAppointmentForm } from "@/components/site/find-appointment-form";
import { PageHero } from "@/components/site/page-hero";
import { Icon } from "@/components/ui/icon";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Find my appointment" };

export default async function FindPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const settings = await getSettings();
  const rawReference = params.reference;
  const initialReference = (Array.isArray(rawReference) ? rawReference[0] : rawReference) ?? "";

  return (
    <>
      <PageHero
        eyebrow={settings.clinicName}
        title="Find my appointment"
        description="Already booked? Enter your booking reference and email address to view your appointment status and plan your visit."
      />

      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/5 sm:p-8">
          <FindAppointmentForm initialReference={initialReference.toUpperCase()} />
        </div>
        <p className="mt-6 flex items-start gap-2 text-xs text-slate-500">
          <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          Looking up an appointment only needs the reference code and the email you booked with —
          no account or password required.
        </p>
      </section>
    </>
  );
}