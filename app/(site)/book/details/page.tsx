import { BookingForm } from "@/components/site/booking-form";
import { PageHero } from "@/components/site/page-hero";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentPatient } from "@/lib/auth/patient";
import { addDays, todayInTimeZone } from "@/lib/datetime";
import { getSettings } from "@/lib/settings";
import { listServices } from "@/lib/services";
import { redirect } from "next/navigation";

export const metadata = { title: "Booking details" };

export default async function BookDetailsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const settings = await getSettings();
  const services = await listServices({ activeOnly: true });
  const today = todayInTimeZone(settings.timezone);
  const maxDate = addDays(today, settings.maxBookingDays);

  const rawService = params.service;
  const serviceParam = Array.isArray(rawService) ? rawService[0] : rawService;

  const patient = await getCurrentPatient();
  if (!patient) {
    const next = serviceParam
      ? `/book/details?service=${encodeURIComponent(serviceParam)}`
      : "/book/details";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const initialServiceId =
    serviceParam && services.some((service) => String(service.id) === serviceParam)
      ? Number(serviceParam)
      : null;

  return (
    <>
      <PageHero
        eyebrow={settings.clinicName}
        title="Book an appointment"
        description="Choose a service, pick a date, and select a time that is genuinely available."
      />
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        {services.length === 0 ? (
          <EmptyState
            title="Booking is temporarily unavailable"
            description="The clinic has no active services right now. Please contact the clinic directly."
          />
        ) : (
          <BookingForm
            services={services}
            initialServiceId={initialServiceId}
            today={today}
            maxDate={maxDate}
            timezone={settings.timezone}
            patient={patient}
          />
        )}
      </section>
    </>
  );
}