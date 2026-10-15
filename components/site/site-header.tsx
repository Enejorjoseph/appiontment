"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { patientLogoutAction } from "@/app/actions/auth";
import { buttonClass } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/appointments", label: "View appointments" },
];

function Logo() {
  return (
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
  );
}

export function SiteHeader({
  clinicName,
  patient,
}: {
  clinicName: string;
  patient: { name: string } | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const greetings = patient ? `Hi, ${patient.name.split(" ")[0]}` : null;

  return (
    <header className="sticky top-0 z-40 border-b border-navy-100 bg-white/90 shadow-sm shadow-navy-900/5 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Logo />
          <span className="text-sm font-semibold leading-tight text-navy-800">
            {clinicName}
            <span className="hidden text-[11px] font-normal text-slate-500 sm:block">
              Appointment System
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100"
                    : "text-navy-600 hover:bg-navy-50",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {patient ? (
            <div className="hidden items-center gap-2 lg:flex">
              <span
                className="max-w-[10rem] truncate text-sm font-medium text-navy-700"
                title={patient.name}
              >
                {greetings}
              </span>
              <form action={patientLogoutAction}>
                <ConfirmSubmitButton
                  title="Log out"
                  message="You'll need to sign in again to book or manage appointments."
                  confirmLabel="Log out"
                  className={cn(buttonClass({ variant: "ghost", size: "sm" }))}
                >
                  Log out
                </ConfirmSubmitButton>
              </form>
            </div>
          ) : (
            <div className="hidden items-center gap-2 lg:flex">
              <Link
                href="/login"
                className={cn(buttonClass({ variant: "ghost", size: "sm" }))}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className={cn(buttonClass({ variant: "subtle", size: "sm" }))}
              >
                Sign up
              </Link>
            </div>
          )}
          <Link
            href="/services"
            className={cn(buttonClass({ variant: "primary", size: "md" }), "hidden sm:inline-flex")}
          >
            Book an Appointment
          </Link>
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-navy-200 text-navy-700 lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
              {open ? (
                <path
                  d="M6 6l12 12M6 18L18 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-navy-100 bg-white lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-3 sm:px-6">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-50"
              >
                {item.label}
              </Link>
            ))}
            {patient ? (
              <>
                <p className="px-3 pt-2 text-sm font-medium text-navy-700">{greetings}</p>
                <form action={patientLogoutAction}>
                  <ConfirmSubmitButton
                    title="Log out"
                    message="You'll need to sign in again to book or manage appointments."
                    confirmLabel="Log out"
                    className={cn(buttonClass({ variant: "ghost", size: "md" }), "mt-1 w-full")}
                  >
                    Log out
                  </ConfirmSubmitButton>
                </form>
              </>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className={cn(buttonClass({ variant: "ghost", size: "md" }))}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className={cn(buttonClass({ variant: "subtle", size: "md" }))}
                >
                  Sign up
                </Link>
              </div>
            )}
            <Link
              href="/services"
              onClick={() => setOpen(false)}
              className={cn(buttonClass({ variant: "primary", size: "md" }), "mt-2")}
            >
              Book an Appointment
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
