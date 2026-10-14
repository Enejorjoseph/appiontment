import Link from "next/link";
import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  hint,
  href,
  accent = "navy",
}: {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
  accent?: "navy" | "brand" | "amber" | "red" | "violet" | "slate";
}) {
  const accentBar: Record<string, string> = {
    navy: "bg-navy-500",
    brand: "bg-brand-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    violet: "bg-violet-500",
    slate: "bg-slate-400",
  };

  const content = (
    <>
      <div className={cn("absolute inset-y-0 left-0 w-1", accentBar[accent])} />
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-navy-800">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </>
  );

  const className =
    "relative overflow-hidden rounded-xl border border-navy-100 bg-white pl-5 pr-4 py-4 shadow-sm";

  if (href) {
    return (
      <Link href={href} className={cn(className, "transition hover:border-brand-200 hover:shadow")}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}
