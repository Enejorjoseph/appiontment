import Link from "next/link";
import { OpeningHours } from "@/components/site/site-footer";
import { PageHero, HERO_ACTION_OUTLINE } from "@/components/site/page-hero";
import { BookingChat } from "@/components/site/booking-chat";
import { buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { getCurrentPatient } from "@/lib/auth/patient";
import { formatDuration, formatNaira } from "@/lib/format";
import { getSettings, getWorkingHours } from "@/lib/settings";
import { listServices } from "@/lib/services";

export const metadata = { title: "Book an appointment" };

const STEPS = [
  {
    title: "Choose a service",
    body: "Pick the visit that matches what you need. You can change it on the next screen.",
  },
  {
    title: "Pick a date and time",
    body: "Only genuinely available slots are shown for that service, day and time zone.",
  },
  {
    title: "Enter your details",
    body: "Your name, email and phone are taken from your patient account, so booking is quick.",
  },
];

export default async function BookStartPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const settings = await getSettings();
  const services = await listServices({ activeOnly: true });
  const hours = await getWorkingHours();
  const patient = await getCurrentPatient();

  const rawService = params.service;
  const serviceParam = Array.isArray(rawService) ? rawService[0] : rawService;
  const selected = serviceParam
    ? services.find((service) => String(service.id) === serviceParam)
    : undefined;

  const continueHref = selected ? `/book/details?service=${selected.id}` : "/book/details";

  return (
    <>
      <PageHero
        eyebrow={settings.clinicName}
        title="Book an appointment"
        description="A quick look at how booking works, then you'll be taken to the booking form. It usually takes under two minutes."
        action={
          <Link
            href="/find"
            className={buttonClass({ variant: "outline", size: "lg", className: HERO_ACTION_OUTLINE })}
          >
            Find my appointment
          </Link>
        }
      />

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            {selected ? (
              <Card className="border-brand-200 bg-brand-50/50">
                <CardBody className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-sm shadow-brand-600/30">
                      <Icon name="check" className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                        Selected service
                      </p>
                      <p className="mt-0.5 text-base font-semibold text-navy-800">
                        {selected.name}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-600">
                        {formatNaira(selected.price)} · {formatDuration(selected.durationMinutes)}
                      </p>
                    </div>
                  </div>
                  <Link href="/services" className={buttonClass({ variant: "outline", size: "sm" })}>
                    Change service
                  </Link>
                </CardBody>
              </Card>
            ) : (
              <Card className="border-amber-200 bg-amber-50/60">
                <CardBody className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <Icon name="clock" className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-navy-800">No service selected yet</p>
                      <p className="mt-0.5 text-sm text-slate-600">
                        Choose a service first, or continue and pick one on the booking form.
                      </p>
                    </div>
                  </div>
                  <Link href="/services" className={buttonClass({ variant: "primary", size: "sm" })}>
                    Choose a service
                  </Link>
                </CardBody>
              </Card>
            )}

            <Card>
              <CardHeader title="How booking works" description="Three quick steps, signed in securely." />
              <CardBody className="space-y-5">
                {STEPS.map((step, index) => (
                  <div key={step.title} className="flex gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-semibold text-white shadow-sm shadow-brand-600/30">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-navy-800">{step.title}</p>
                      <p className="mt-0.5 text-sm text-slate-600">{step.body}</p>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="What to expect" />
              <CardBody className="grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
                <div className="rounded-xl border border-navy-100 bg-slate-50/70 px-4 py-3">
                  <p className="flex items-center gap-2 font-medium text-navy-800">
                    <Icon name="clock" className="h-4 w-4 text-brand-600" />
                    Times shown in {settings.timezone}
                  </p>
                  <p className="mt-1">
                    Slots need at least {settings.minNoticeMinutes} minutes notice and can be
                    booked up to {settings.maxBookingDays} days ahead.
                  </p>
                </div>
                <div className="rounded-xl border border-navy-100 bg-slate-50/70 px-4 py-3">
                  <p className="flex items-center gap-2 font-medium text-navy-800">
                    <Icon name="shield" className="h-4 w-4 text-brand-600" />
                    Change or cancel
                  </p>
                  <p className="mt-1">{settings.cancellationPolicy}</p>
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            <Card className="border-brand-200 shadow-lg shadow-brand-600/10">
              <CardHeader
                title="Ready to continue?"
                className="rounded-t-2xl bg-gradient-to-r from-brand-50 to-white"
              />
              <CardBody className="space-y-4">
                <Link
                  href={continueHref}
                  className={buttonClass({ variant: "primary", size: "lg", className: "w-full" })}
                >
                  {selected ? "Continue to booking" : "Go to booking form"}
                </Link>
                <p className="text-center text-xs text-slate-500">
                  You&apos;ll receive a booking reference you can use to look up the appointment.
                </p>
                <Link
                  href="/find"
                  className={buttonClass({ variant: "ghost", size: "sm", className: "w-full" })}
                >
                  Already booked? Find my appointment
                </Link>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Opening hours" description={`Times shown in ${settings.timezone}`} />
              <CardBody>
                <OpeningHours hours={hours} />
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-sm shadow-brand-600/30">
            <Icon name="chat" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-navy-800">Prefer to just ask?</h2>
            <p className="text-sm text-slate-600">
              Chat with our AI assistant and it will find a service and book it for you.
            </p>
          </div>
        </div>
        <BookingChat loggedIn={Boolean(patient)} patientName={patient?.name} />
      </section>
    </>
  );
}