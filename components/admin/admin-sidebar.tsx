"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/actions/admin";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { cn } from "@/lib/cn";

const NAV = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: "M3 12l9-8 9 8M5 10v10h14V10",
  },
  {
    href: "/admin/appointments",
    label: "Appointments",
    icon: "M8 7V3m8 4V3M3 11h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z",
  },
  {
    href: "/admin/calendar",
    label: "Calendar",
    icon: "M4 5h16v16H4zM8 3v4m8-4v4M4 10h16",
  },
  {
    href: "/admin/services",
    label: "Services",
    icon: "M4 7h16M4 12h16M4 17h10",
  },
  {
    href: "/admin/availability",
    label: "Availability",
    icon: "M12 8v4l3 2M12 3a9 9 0 100 18 9 9 0 000-18z",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: "M10.3 4h3.4l.4 2.3 2 .8 1.9-1.3 2.4 2.4-1.3 1.9.8 2 2.3.4v3.4l-2.3.4-.8 2 1.3 1.9-2.4 2.4-1.9-1.3-2 .8-.4 2.3h-3.4l-.4-2.3-2-.8-1.9 1.3-2.4-2.4 1.3-1.9-.8-2L3 13.7v-3.4l2.3-.4.8-2L4.8 6l2.4-2.4L9.1 5l2-.8z",
  },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function NavIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" aria-hidden="true">
      <path d={path} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Links({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            isActive(pathname, item.href)
              ? "bg-brand-600 text-white"
              : "text-navy-200 hover:bg-navy-700 hover:text-white",
          )}
        >
          <NavIcon path={item.icon} />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function AdminSidebar({
  clinicName,
  adminName,
  role,
}: {
  clinicName: string;
  adminName: string;
  role: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between border-b border-navy-100 bg-navy-800 px-4 py-3 text-white lg:hidden">
        <span className="text-sm font-semibold">{clinicName}</span>
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-navy-600"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path
              d={open ? "M6 6l12 12M6 18L18 6" : "M4 7h16M4 12h16M4 17h16"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {open ? (
        <div className="border-b border-navy-700 bg-navy-800 px-3 py-3 lg:hidden">
          <Links onNavigate={() => setOpen(false)} />
          <LogoutForm />
        </div>
      ) : null}

      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:bg-navy-800 lg:px-3 lg:py-5">
        <div className="px-3 pb-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </span>
            {clinicName}
          </p>
          <p className="mt-1 pl-10 text-xs text-navy-300">Staff dashboard</p>
        </div>

        <div className="flex-1 overflow-y-auto px-1">
          <Links />
        </div>

        <div className="mt-4 border-t border-navy-700 px-3 pt-4">
          <p className="text-sm font-medium text-white">{adminName}</p>
          <p className="mb-3 text-xs capitalize text-navy-300">{role}</p>
          <LogoutForm />
        </div>
      </aside>
    </>
  );
}

function LogoutForm() {
  return (
    <form action={logoutAction}>
      <ConfirmSubmitButton
        title="Log out"
        message="You'll be signed out of the staff dashboard."
        confirmLabel="Log out"
        className="w-full rounded-lg border border-navy-600 px-3 py-2 text-sm font-medium text-navy-100 transition-colors hover:bg-navy-700 hover:text-white"
      >
        Log out
      </ConfirmSubmitButton>
    </form>
  );
}
