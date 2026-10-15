import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";

function pageItems(page: number, totalPages: number): Array<number | "gap"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: Array<number | "gap"> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) items.push("gap");
  for (let value = start; value <= end; value += 1) items.push(value);
  if (end < totalPages - 1) items.push("gap");
  items.push(totalPages);

  return items;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  makeHref,
  className,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  makeHref: (page: number) => string;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalItems);
  const items = pageItems(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex flex-wrap items-center justify-between gap-3", className)}
    >
      <p className="text-xs text-slate-500">
        Showing <span className="font-medium text-navy-700">{first}</span>–
        <span className="font-medium text-navy-700">{last}</span> of{" "}
        <span className="font-medium text-navy-700">{totalItems}</span>
      </p>

      <div className="flex flex-wrap items-center gap-1">
        {page > 1 ? (
          <Link
            href={makeHref(page - 1)}
            className={buttonClass({ variant: "ghost", size: "sm" })}
            rel="prev"
          >
            Previous
          </Link>
        ) : (
          <span className={buttonClass({ variant: "ghost", size: "sm", className: "pointer-events-none opacity-40" })}>
            Previous
          </span>
        )}

        {items.map((item, index) =>
          item === "gap" ? (
            <span key={`gap-${index}`} className="px-2 text-sm text-slate-400" aria-hidden="true">
              …
            </span>
          ) : item === page ? (
            <span
              key={item}
              aria-current="page"
              className={buttonClass({ variant: "primary", size: "sm", className: "pointer-events-none" })}
            >
              {item}
            </span>
          ) : (
            <Link
              key={item}
              href={makeHref(item)}
              className={buttonClass({ variant: "ghost", size: "sm" })}
            >
              {item}
            </Link>
          ),
        )}

        {page < totalPages ? (
          <Link
            href={makeHref(page + 1)}
            className={buttonClass({ variant: "ghost", size: "sm" })}
            rel="next"
          >
            Next
          </Link>
        ) : (
          <span className={buttonClass({ variant: "ghost", size: "sm", className: "pointer-events-none opacity-40" })}>
            Next
          </span>
        )}
      </div>
    </nav>
  );
}
