import { cn } from "@/lib/cn";

export function PageHero({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700">
      <div className="cp-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle at 10% 0%, rgba(0,209,179,0.5), transparent 45%), radial-gradient(circle at 95% 10%, rgba(18,237,207,0.32), transparent 42%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className={cn("max-w-2xl", action ? "w-full lg:w-auto" : "w-full")}>
            {eyebrow ? (
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-200">
                <span
                  className="h-1 w-6 rounded-full bg-gradient-to-r from-brand-300 to-brand-500"
                  aria-hidden="true"
                />
                {eyebrow}
              </p>
            ) : null}
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 text-sm leading-6 text-navy-100 sm:text-base">{description}</p>
            ) : null}
          </div>
          {action ? <div className="flex flex-wrap items-center gap-3">{action}</div> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

export const HERO_ACTION_OUTLINE =
  "border-white/30 bg-white/10 text-white hover:border-white/40 hover:bg-white/20";
