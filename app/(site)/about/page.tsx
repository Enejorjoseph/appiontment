import Link from "next/link";
import { OpeningHours } from "@/components/site/site-footer";
import { buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { PageHero } from "@/components/site/page-hero";
import { formatDuration, formatNaira } from "@/lib/format";
import { getSettings, getWorkingHours } from "@/lib/settings";
import { listServices } from "@/lib/services";

export const metadata = { title: "About the clinic" };

const HIGHLIGHTS = [
  {
    icon: "calendar" as const,
    title: "Clear availability",
    body: "Unavailable slots are shown as disabled, so you always see the real schedule.",
  },
  {
    icon: "user" as const,
    title: "Patient account",
    body: "Sign in once and your contact details are carried over to every booking.",
  },
  {
    icon: "shield" as const,
    title: "Managed by staff",
    body: "Clinic staff confirm, reschedule or cancel appointments from a secure dashboard.",
  },
];

export default async function AboutPage() {
  const settings = await getSettings();
  const services = await listServices({ activeOnly: true });
  const hours = await getWorkingHours();

  return (
    <>
      <PageHero
        eyebrow={`About ${settings.clinicName}`}
        title="A clinic built around your time"
        description={settings.description}
      />

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold tracking-tight text-navy-800">
              Your time, respected
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              We serve one location with a small, focused team. Booking online lets you see
              genuinely available times for the service you need, so you can plan your visit
              without waiting on the phone.
            </p>

            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {HIGHLIGHTS.map((highlight) => (
                <div
                  key={highlight.title}
                  className="rounded-2xl border border-navy-100 bg-white p-5 shadow-sm shadow-navy-900/5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg hover:shadow-navy-900/10"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 ring-1 ring-inset ring-brand-100">
                    <Icon name={highlight.icon} className="h-5 w-5" />
                  </span>
                  <p className="mt-4 text-base font-semibold text-navy-800">{highlight.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{highlight.body}</p>
                </div>
              ))}
            </div>

            <Card className="mt-8">
              <CardHeader
                title="Services and pricing"
                description="Demonstration prices in Nigerian naira."
                action={
                  <Link href="/services" className={buttonClass({ variant: "outline", size: "sm" })}>
                    Browse services
                  </Link>
                }
              />
              <CardBody className="divide-y divide-navy-100">
                {services.length === 0 ? (
                  <p className="py-3 text-sm text-slate-500">No services published yet.</p>
                ) : (
                  services.map((service) => (
                    <div key={service.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                          <Icon name="calendar" className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-navy-800">{service.name}</p>
                          <p className="text-xs text-slate-500">
                            {formatDuration(service.durationMinutes)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-navy-800">
                        {formatNaira(service.price)}
                      </p>
                    </div>
                  ))
                )}
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader title="Opening hours" />
              <CardBody>
                <OpeningHours hours={hours} />
              </CardBody>
            </Card>

            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 text-white shadow-xl shadow-navy-900/20">
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-200">
                  Get in touch
                </p>
                <div className="mt-4 space-y-3 text-sm">
                  <p className="flex items-start gap-2.5">
                    <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
                    {settings.address}
                  </p>
                  <p className="flex items-center gap-2.5">
                    <Icon name="phone" className="h-4 w-4 shrink-0 text-brand-300" />
                    <a className="text-white hover:text-brand-200" href={`tel:${settings.phone.replace(/\s+/g, "")}`}>
                      {settings.phone}
                    </a>
                  </p>
                  <p className="flex items-center gap-2.5">
                    <Icon name="mail" className="h-4 w-4 shrink-0 text-brand-300" />
                    <a className="text-white hover:text-brand-200" href={`mailto:${settings.email}`}>
                      {settings.email}
                    </a>
                  </p>
                </div>
                <Link
                  href="/services"
                  className={buttonClass({ variant: "primary", size: "md", className: "mt-5 w-full" })}
                >
                  Book an Appointment
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}