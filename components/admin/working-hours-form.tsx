"use client";

import { useActionState, useState } from "react";
import { updateWorkingHoursAction } from "@/app/actions/admin";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { EMPTY_FORM_STATE } from "@/lib/action-state";
import { WEEKDAY_NAMES, WEEKDAY_ORDER } from "@/lib/datetime";
import type { WorkingHour } from "@/lib/types";

export function WorkingHoursForm({ hours }: { hours: WorkingHour[] }) {
  const [state, formAction, pending] = useActionState(updateWorkingHoursAction, EMPTY_FORM_STATE);
  const byWeekday = new Map(hours.map((hour) => [hour.weekday, hour]));
  const [openMap, setOpenMap] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(hours.map((hour) => [hour.weekday, hour.isOpen])),
  );

  return (
    <form action={formAction} className="space-y-3">
      {state.message ? <Alert variant={state.ok ? "success" : "error"}>{state.message}</Alert> : null}

      <div className="hidden grid-cols-[1fr_auto_auto_auto_auto_auto] gap-2 px-1 text-xs font-medium uppercase tracking-wide text-slate-400 lg:grid">
        <span>Day</span>
        <span>Open</span>
        <span>From</span>
        <span>To</span>
        <span>Break from</span>
        <span>Break to</span>
      </div>

      {WEEKDAY_ORDER.map((weekday) => {
        const hour = byWeekday.get(weekday);
        const isOpen = openMap[weekday] ?? false;
        const error = state.errors[`day-${weekday}`];
        return (
          <div
            key={weekday}
            className="rounded-lg border border-navy-100 bg-white p-3 lg:border-0 lg:bg-transparent lg:p-0"
          >
            <div className="grid gap-2 lg:grid-cols-[1fr_auto_auto_auto_auto_auto] lg:items-center">
              <label className="flex items-center gap-2 text-sm font-medium text-navy-700">
                {WEEKDAY_NAMES[weekday]}
              </label>
              <label className="flex items-center gap-2 text-sm text-navy-600">
                <input
                  type="checkbox"
                  name={`isOpen-${weekday}`}
                  checked={isOpen}
                  onChange={(event) =>
                    setOpenMap((current) => ({ ...current, [weekday]: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-navy-300 text-brand-600 focus:ring-2 focus:ring-brand-100"
                />
                <span className="lg:hidden">Open</span>
              </label>
              <Input
                type="time"
                name={`openTime-${weekday}`}
                defaultValue={hour?.openTime ?? "09:00"}
                disabled={!isOpen}
                aria-label={`${WEEKDAY_NAMES[weekday]} opening time`}
              />
              <Input
                type="time"
                name={`closeTime-${weekday}`}
                defaultValue={hour?.closeTime ?? "17:00"}
                disabled={!isOpen}
                aria-label={`${WEEKDAY_NAMES[weekday]} closing time`}
              />
              <Input
                type="time"
                name={`breakStart-${weekday}`}
                defaultValue={hour?.breakStart ?? ""}
                disabled={!isOpen}
                aria-label={`${WEEKDAY_NAMES[weekday]} break start`}
              />
              <Input
                type="time"
                name={`breakEnd-${weekday}`}
                defaultValue={hour?.breakEnd ?? ""}
                disabled={!isOpen}
                aria-label={`${WEEKDAY_NAMES[weekday]} break end`}
              />
            </div>
            {error ? <p className="mt-1 text-xs font-medium text-red-600">{error}</p> : null}
          </div>
        );
      })}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save working hours"}
      </Button>
    </form>
  );
}
