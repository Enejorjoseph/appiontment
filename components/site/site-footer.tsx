import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { WEEKDAY_NAMES, WEEKDAY_ORDER, formatTime12 } from "@/lib/datetime";
import type { ClinicSettings, WorkingHour } from "@/lib/types";
import { getWorkingHours } from "@/lib/settings";

export function OpeningHours({ hours }: { hours: WorkingHour[] }) {
  const byWeekday = new Map(hours.map((hour) => [hour.weekday, hour]));
  return (
    <ul className="space-y-1.5 text-sm">
      {WEEKDAY_ORDER.map((weekday) => {
        const hour = byWeekday.get(weekday);
        const open = hour?.isOpen && hour.openTime && hour.closeTime;
        const hasBreak = Boolean(open && hour?.breakStart && hour?.breakEnd);
        return (
          <li key={weekday} className="flex items-start justify-between gap-4">
            <span className="text-slate-500">{WEEKDAY_NAMES[weekday]}</span>
            <span className="text-right">
              <span className={open ? "font-medium text-navy-800" : "text-slate-400"}>
                {open
                  ? `${formatTime12(hour!.openTime!)} – ${formatTime12(hour!.closeTime!)}`
                  : "Closed"}
              </span>
              {hasBreak ? (
                <span className="block text-xs text-slate-400">
                  Break {formatTime12(hour!.breakStart!)}–{formatTime12(hour!.breakEnd!)}
                </span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

const EXPLORE_LINKS = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const BOOKING_LINKS = [
  { href: "/book", label: "Book an appointment" },
  { href: "/appointments", label: "View appointments" },
  { href: "/admin/login", label: "Staff login" },
];

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-widest text-navy-700">{children}</h2>
  );
}

export async function SiteFooter({ settings }: { settings: ClinicSettings }) {
  const hours = await getWorkingHours();

  return (
    <footer className="mt-16 border-t border-navy-100 bg-gradient-to-b from-navy-50 via-white to-brand-50">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-sm shadow-brand-600/30">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                  <path
                    d="M12 5v14M5 12h14"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="text-sm font-semibold leading-tight text-navy-800">
                {settings.clinicName}
                <span className="block text-[11px] font-normal text-slate-500">
                  Appointment System
                </span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">{settings.tagline}</p>
            <p className="mt-4 flex items-start gap-2.5 text-sm text-slate-600">
              <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              {settings.address}
            </p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <a
                className="flex items-center gap-2.5 text-slate-600 hover:text-brand-700"
                href={`tel:${settings.phone.replace(/\s+/g, "")}`}
              >
                <Icon name="phone" className="h-4 w-4 shrink-0 text-brand-600" />
                {settings.phone}
              </a>
              <a
                className="flex items-center gap-2.5 text-slate-600 hover:text-brand-700"
                href={`mailto:${settings.email}`}
              >
                <Icon name="mail" className="h-4 w-4 shrink-0 text-brand-600" />
                {settings.email}
              </a>
            </div>
          </div>

          <div>
            <FooterHeading>Explore</FooterHeading>
            <ul className="mt-4 space-y-2.5 text-sm">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link className="text-slate-600 transition-colors hover:text-brand-700" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <FooterHeading>Bookings</FooterHeading>
            <ul className="mt-4 space-y-2.5 text-sm">
              {BOOKING_LINKS.map((link) => (
                <li key={link.href}>
                  <Link className="text-slate-600 transition-colors hover:text-brand-700" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <FooterHeading>Opening hours</FooterHeading>
            <div className="mt-4">
              <OpeningHours hours={hours} />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-navy-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:px-6">
          <p>
            © {new Date().getFullYear()} {settings.clinicName}. Demonstration project — not a real
            medical service.
          </p>
          <p>Times shown in {settings.timezone}.</p>
        </div>
      </div>
    </footer>
  );
}