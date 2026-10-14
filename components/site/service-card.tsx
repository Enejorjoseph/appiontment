import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { formatNaira, formatDuration } from "@/lib/format";
import type { Service } from "@/lib/types";

export function ServiceCard({ service }: { service: Service }) {
  return (
    <Card className="group relative flex h-full flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg hover:shadow-navy-900/10">
      <span
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-400 to-brand-600 opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden="true"
      />
      <CardBody className="flex flex-1 flex-col">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
              <path
                d="M8 3v4M16 3v4M3 9h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h3 className="text-base font-semibold text-navy-800">{service.name}</h3>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">{service.description}</p>
        <div className="mt-auto flex items-end justify-between gap-4 pt-5">
          <div>
            <p className="text-lg font-semibold text-navy-800">{formatNaira(service.price)}</p>
            <p className="text-xs text-slate-500">{formatDuration(service.durationMinutes)}</p>
          </div>
          <Link
            href={`/book?service=${service.id}`}
            className={buttonClass({ variant: "primary", size: "sm" })}
          >
            Book
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
              <path
                d="M5 12h14m-6-6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
