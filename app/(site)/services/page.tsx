import Link from "next/link";
import { ServiceCard } from "@/components/site/service-card";
import { PageHero, HERO_ACTION_OUTLINE } from "@/components/site/page-hero";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { listServices } from "@/lib/services";

export const metadata = { title: "Services" };

export default async function ServicesPage() {
  const services = await listServices({ activeOnly: true });

  return (
    <>
      <PageHero
        eyebrow="CarePoint Clinic"
        title="Services you can book"
        description="Every listed service shows its price in Nigerian naira and how long the appointment lasts. Pick one and we'll show you only the genuinely open slots."
        action={
          <Link
            href="/appointments"
            className={buttonClass({ variant: "outline", size: "lg", className: HERO_ACTION_OUTLINE })}
          >
            View appointments
          </Link>
        }
      />

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        {services.length === 0 ? (
          <EmptyState
            className="mt-4"
            title="No services are currently available"
            description="The clinic has not published any active services yet. Please check back shortly."
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 ring-1 ring-inset ring-brand-100">
                  <Icon name="calendar" className="h-4 w-4" />
                </span>
                <span>
                  <span className="font-semibold text-navy-800">{services.length}</span> active{" "}
                  {services.length === 1 ? "service" : "services"} — pick one to see open times
                </span>
              </div>
              <Link href="/book" className={buttonClass({ variant: "primary", size: "md" })}>
                Book an appointment
              </Link>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </>
        )}

        <p className="mt-10 flex items-center gap-2 rounded-xl border border-navy-100 bg-white px-4 py-3 text-sm text-navy-700">
          <Icon name="shield" className="h-4 w-4 shrink-0 text-brand-600" />
          Prices are demonstration values in Nigerian naira. The final fee is confirmed at the
          clinic.
        </p>
      </section>
    </>
  );
}