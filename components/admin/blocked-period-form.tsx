"use client";

import { useActionState, useState } from "react";
import { createBlockedPeriodAction } from "@/app/actions/admin";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { EMPTY_FORM_STATE } from "@/lib/action-state";

export function BlockedPeriodForm({ today }: { today: string }) {
  const [state, formAction, pending] = useActionState(createBlockedPeriodAction, EMPTY_FORM_STATE);
  const [mode, setMode] = useState("full-day");

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? <Alert variant={state.ok ? "success" : "error"}>{state.message}</Alert> : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Date" htmlFor="block-date" required error={state.errors.date}>
          <Input
            id="block-date"
            name="date"
            type="date"
            min={today}
            defaultValue={today}
            required
            invalid={Boolean(state.errors.date)}
          />
        </Field>
        <Field label="Type" htmlFor="block-mode">
          <Select
            id="block-mode"
            name="mode"
            value={mode}
            onChange={(event) => setMode(event.target.value)}
          >
            <option value="full-day">Full day (clinic closed)</option>
            <option value="time-range">Specific time range</option>
          </Select>
        </Field>
      </div>

      {mode === "time-range" ? (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="From" htmlFor="block-start" required error={state.errors.startTime}>
            <Input id="block-start" name="startTime" type="time" defaultValue="09:00" invalid={Boolean(state.errors.startTime)} />
          </Field>
          <Field label="To" htmlFor="block-end" required error={state.errors.endTime}>
            <Input id="block-end" name="endTime" type="time" defaultValue="12:00" />
          </Field>
        </div>
      ) : null}

      <Field label="Reason" htmlFor="block-reason" error={state.errors.reason} hint="Shown internally and to patients as the reason a slot is unavailable.">
        <Textarea id="block-reason" name="reason" rows={2} placeholder="Public holiday, training, maintenance…" />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add blocked period"}
      </Button>
    </form>
  );
}
