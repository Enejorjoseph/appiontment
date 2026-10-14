import { cn } from "@/lib/cn";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div>
        {eyebrow ? (
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-600">
            <span className="h-1 w-6 rounded-full bg-gradient-to-r from-brand-400 to-brand-600" />
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy-800 sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  );
}
