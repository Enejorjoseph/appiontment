import Link from "next/link";
import { ServiceCard } from "@/components/site/service-card";
import { buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { formatNaira, formatDuration } from "@/lib/format";
import {
  WEEKDAY_ORDER,
  WEEKDAY_SHORT,
  formatTime12,
  todayInTimeZone,
  weekdayOf,
} from "@/lib/datetime";
import { getSettings, getWorkingHours } from "@/lib/settings";
import { listServices } from "@/lib/services";

const TRUST = [
  { icon: "user" as const, label: "Your account", detail: "Sign in once, book anytime" },
  { icon: "check" as const, label: "Instant reference", detail: "Get a code to look up later" },
  { icon: "clock" as const, label: "Real availability", detail: "Only genuinely open slots" },
];

const STEPS = [
  {
    title: "Choose a service",
    body: "Browse the clinic's services and pick the one that matches your visit.",
  },
  {
    title: "Pick a date and time",
    body: "See only the slots that are genuinely open for that service and day.",
  },
  {
    title: "Confirm and keep your code",
    body: "Add your details, review everything, then save your unique booking reference.",
  },
];

const BENEFITS = [
  {
    title: "Live, accurate slots",
    body: "Availability respects opening hours, breaks, blocked dates and existing bookings — no double-booking, ever.",
  },
  {
    title: "Your details, saved",
    body: "Create a patient account and your contact details carry over to every booking — no re-typing.",
  },
  {
    title: "Managed by clinic staff",
    body: "Our team confirms, reschedules or cancels appointments from a secure dashboard so your slot stays accurate.",
  },
];

export default async function HomePage() {
  const settings = await getSettings();
  const allServices = await listServices({ activeOnly: true });
  const services = allServices.slice(0, 4);
  const hours = await getWorkingHours();

  const today = todayInTimeZone(settings.timezone);
  const todayWeekday = weekdayOf(today);
  const todayHour = hours.find((hour) => hour.weekday === todayWeekday);
  const todayIsOpen = Boolean(todayHour?.isOpen && todayHour.openTime && todayHour.closeTime);
  const todayLabel = todayIsOpen
    ? `${formatTime12(todayHour!.openTime!)} – ${formatTime12(todayHour!.closeTime!)}`
    : "Closed today";
  const openDays = hours.filter((hour) => hour.isOpen).length;
  const byWeekday = new Map(hours.map((hour) => [hour.weekday, hour]));

  const stats = [
    { icon: "clock" as const, value: `${openDays}`, label: "days open each week" },
    { icon: "calendar" as const, value: `${allServices.length}`, label: "services you can book" },
    { icon: "shield" as const, value: `${settings.maxBookingDays}`, label: "days booking window" },
    { icon: "check" as const, value: "Instant", label: "booking reference code" },
  ];

  const faqs = [
    {
      q: "Do I need an account to book?",
      a: "Yes — patients sign in with a free account before booking. Create one in a minute and your details are saved for next time.",
    },
    {
      q: "How far ahead can I book?",
      a: `Appointments can be booked up to ${settings.maxBookingDays} days in advance.`,
    },
    {
      q: "How much notice do you need?",
      a: `Please book at least ${formatDuration(settings.minNoticeMinutes)} before your preferred time.`,
    },
    { q: "What if I need to cancel or reschedule?", a: settings.cancellationPolicy },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700">
        <div className="cp-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 12%, rgba(0,209,179,0.65), transparent 45%), radial-gradient(circle at 90% 4%, rgba(18,237,207,0.45), transparent 42%)",
          }}
        />
        <div
          className="pointer-events-none absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-brand-500/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-6xl gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div className="text-white">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-200 ring-1 ring-inset ring-white/15">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-300" aria-hidden="true" />
              {settings.clinicName}
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Book your clinic appointment{" "}
              <span className="cp-gradient-text">in minutes</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-navy-100">
              {settings.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/services" className={buttonClass({ variant: "primary", size: "lg" })}>
                Book an Appointment
              </Link>
              <Link
                href="/find"
                className={buttonClass({
                  variant: "outline",
                  size: "lg",
                  className: "border-white/30 bg-white/10 text-white hover:border-white/40 hover:bg-white/20",
                })}
              >
                Find my appointment
              </Link>
            </div>

            <dl className="mt-10 grid max-w-lg gap-4 border-t border-white/15 pt-6 sm:grid-cols-3">
              {TRUST.map((item) => (
                <div key={item.label}>
                  <dt className="flex items-center gap-1.5 text-sm font-medium text-white">
                    <Icon name={item.icon} className="h-4 w-4 text-brand-300" />
                    {item.label}
                  </dt>
                  <dd className="mt-1 text-xs text-navy-200">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:justify-self-end">
            <div className="relative mx-auto w-full max-w-md">
              <span className="cp-float absolute -top-3 right-6 z-10 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-navy-700 shadow-lg shadow-navy-900/20">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
                </span>
                Live availability
              </span>
              <Card className="overflow-hidden shadow-xl shadow-navy-900/25">
                <CardHeader
                  title="Start a booking"
                  description="Pick a service to see the open times"
                />
                <CardBody className="space-y-3">
                  {services.map((service) => (
                    <Link
                      key={service.id}
                      href={`/book?service=${service.id}`}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-navy-100 px-4 py-3 transition hover:border-brand-200 hover:bg-brand-50/50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-navy-800">
                          {service.name}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {formatDuration(service.durationMinutes)} · {formatNaira(service.price)}
                        </span>
                      </span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-500 transition group-hover:bg-brand-500 group-hover:text-white">
                        <Icon name="arrow" className="h-4 w-4" />
                      </span>
                    </Link>
                  ))}
                  <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-navy-50 to-brand-50 px-4 py-3">
                    <span className="text-sm font-medium text-navy-700">Today</span>
                    <span
                      className={
                        todayIsOpen
                          ? "text-sm font-semibold text-navy-800"
                          : "text-sm font-medium text-slate-500"
                      }
                    >
                      {todayLabel}
                    </span>
                  </div>
                  <Link
                    href="/services"
                    className={buttonClass({ variant: "secondary", size: "md", className: "w-full" })}
                  >
                    See all services
                  </Link>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-navy-100 bg-gradient-to-r from-navy-50 via-white to-brand-50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 ring-1 ring-inset ring-brand-100">
                <Icon name={stat.icon} className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-semibold leading-tight text-navy-800">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured services */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
              Services
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-navy-800">
              Featured services
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              A selection of what you can book at {settings.clinicName}.
            </p>
          </div>
          <Link href="/services" className={buttonClass({ variant: "outline", size: "sm" })}>
            All services
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      {/* How booking works */}
      <section className="relative overflow-hidden border-y border-navy-100 bg-gradient-to-br from-navy-50 via-white to-brand-50 py-16">
        <div className="cp-dots pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
              Getting started
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-navy-800">
              How booking works
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Three simple steps — most patients finish in under two minutes.
            </p>
          </div>
          <div className="relative mt-10 grid gap-6 md:grid-cols-3">
            <span
              className="pointer-events-none absolute left-0 right-0 top-9 hidden border-t border-dashed border-navy-200 md:block"
              aria-hidden="true"
            />
            {STEPS.map((step, index) => (
              <div
                key={step.title}
                className="group relative rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg hover:shadow-navy-900/10"
              >
                <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-semibold text-white shadow-md shadow-brand-600/30 ring-4 ring-white">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-base font-semibold text-navy-800">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link href="/services" className={buttonClass({ variant: "primary", size: "lg" })}>
              Book an Appointment
            </Link>
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 p-8 text-white shadow-xl shadow-navy-900/20">
            <div className="cp-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-300">
                This week at a glance
              </p>
              <h3 className="mt-2 text-2xl font-semibold">Plan around our hours</h3>
              <p className="mt-2 text-sm text-navy-100">
                Times shown in {settings.timezone}. Breaks and blocked dates are handled
                automatically when you pick a slot.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {WEEKDAY_ORDER.map((weekday) => {
                  const hour = byWeekday.get(weekday);
                  const isOpen = Boolean(hour?.isOpen && hour.openTime && hour.closeTime);
                  const isToday = weekday === todayWeekday;
                  return (
                    <div
                      key={weekday}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-center",
                        isToday
                          ? "border-brand-300/60 bg-brand-500/15"
                          : "border-white/10 bg-white/5",
                      )}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-200">
                        {WEEKDAY_SHORT[weekday]}
                      </p>
                      <p className={cn("mt-1 text-[11px]", isOpen ? "text-white" : "text-navy-200")}>
                        {isOpen ? formatTime12(hour!.openTime!) : "Closed"}
                      </p>
                    </div>
                  );
                })}
              </div>
              <Link
                href="/services"
                className={buttonClass({
                  variant: "primary",
                  size: "md",
                  className: "mt-6",
                })}
              >
                Check availability
              </Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
              Why choose us
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-navy-800">
              Why book with us
            </h2>
            <ul className="mt-6 space-y-5">
              {BENEFITS.map((benefit) => (
                <li key={benefit.title} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 ring-1 ring-inset ring-brand-100">
                    <Icon name="check" className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-navy-800">{benefit.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{benefit.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-y border-navy-100 bg-gradient-to-tr from-navy-50 via-white to-brand-50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
              Good to know
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-navy-800">
              Booking questions, answered
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl border border-navy-100 bg-white/80 p-5 backdrop-blur transition hover:border-brand-200 hover:bg-white"
              >
                <h3 className="flex items-start gap-2.5 text-base font-semibold text-navy-800">
                  <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  {faq.q}
                </h3>
                <p className="mt-2 pl-6 text-sm leading-6 text-slate-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing call to action */}
      <section className="px-4 py-16 sm:px-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 px-6 py-14 shadow-xl shadow-navy-900/20 sm:px-12">
          <div className="cp-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            aria-hidden="true"
            style={{
              backgroundImage:
                "radial-gradient(circle at 88% 10%, rgba(0,209,179,0.6), transparent 45%)",
            }}
          />
          <div
            className="pointer-events-none absolute -bottom-16 left-1/3 h-56 w-56 rounded-full bg-brand-500/10 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-xl text-white">
              <h2 className="text-2xl font-semibold sm:text-3xl">Ready to book your visit?</h2>
              <p className="mt-3 text-sm leading-6 text-navy-100">
                {settings.tagline} Pick a service, choose a time that works, and you&apos;re done.
                Already booked? Look up your appointment with your reference and email.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/services" className={buttonClass({ variant: "primary", size: "lg" })}>
                Book an Appointment
              </Link>
              <Link
                href="/find"
                className={buttonClass({
                  variant: "outline",
                  size: "lg",
                  className: "border-white/30 bg-white/10 text-white hover:border-white/40 hover:bg-white/20",
                })}
              >
                Find my appointment
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Visit us */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader title="Visit us" />
            <CardBody className="space-y-3 text-sm text-slate-600">
              <p className="flex items-start gap-2">
                <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                {settings.address}
              </p>
              <p className="flex items-center gap-2">
                <Icon name="phone" className="h-4 w-4 shrink-0 text-brand-600" />
                <a
                  className="font-medium text-navy-700 hover:text-brand-700"
                  href={`tel:${settings.phone.replace(/\s+/g, "")}`}
                >
                  {settings.phone}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Icon name="mail" className="h-4 w-4 shrink-0 text-brand-600" />
                <a
                  className="font-medium text-navy-700 hover:text-brand-700"
                  href={`mailto:${settings.email}`}
                >
                  {settings.email}
                </a>
              </p>
            </CardBody>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader
              title="Need to change an appointment?"
              description={settings.cancellationPolicy}
              action={
                <Link href="/find" className={buttonClass({ variant: "secondary", size: "sm" })}>
                  Find appointment
                </Link>
              }
            />
            <CardBody className="text-sm text-slate-600">
              Enter your booking reference and the email you used to book. We&apos;ll show the
              appointment details so you can contact the clinic to cancel or reschedule.
            </CardBody>
          </Card>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          Prices are demonstration values in Nigerian naira (for example{" "}
          {services[0] ? formatNaira(services[0].price) : formatNaira(5000)} for a{" "}
          {services[0] ? formatDuration(services[0].durationMinutes) : "30 min"} visit).
        </p>
      </section>
    </>
  );
}
