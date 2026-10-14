"use client";

import { useActionState } from "react";
import { createServiceAction, updateServiceAction } from "@/app/actions/admin";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import { EMPTY_FORM_STATE } from "@/lib/action-state";
import type { Service } from "@/lib/types";

export function ServiceForm({ service }: { service?: Service }) {
  const action = service ? updateServiceAction : createServiceAction;
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? <Alert variant={state.ok ? "success" : "error"}>{state.message}</Alert> : null}
      {service ? <input type="hidden" name="id" value={service.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Service name"
          htmlFor={`name-${service?.id ?? "new"}`}
          required
          error={state.errors.name}
        >
          <Input
            id={`name-${service?.id ?? "new"}`}
            name="name"
            defaultValue={service?.name}
            required
            invalid={Boolean(state.errors.name)}
          />
        </Field>
        <Field
          label="Duration (minutes)"
          htmlFor={`duration-${service?.id ?? "new"}`}
          required
          error={state.errors.durationMinutes}
        >
          <Input
            id={`duration-${service?.id ?? "new"}`}
            name="durationMinutes"
            type="number"
            min={5}
            max={600}
            step={5}
            defaultValue={service?.durationMinutes ?? 30}
            required
            invalid={Boolean(state.errors.durationMinutes)}
          />
        </Field>
      </div>

      <Field label="Description" htmlFor={`description-${service?.id ?? "new"}`} error={state.errors.description}>
        <Textarea
          id={`description-${service?.id ?? "new"}`}
          name="description"
          rows={3}
          defaultValue={service?.description}
          invalid={Boolean(state.errors.description)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
        <Field
          label="Price (₦)"
          htmlFor={`price-${service?.id ?? "new"}`}
          required
          error={state.errors.price}
          hint="Whole naira, no decimals."
        >
          <Input
            id={`price-${service?.id ?? "new"}`}
            name="price"
            type="number"
            min={0}
            step={100}
            defaultValue={service?.price ?? 5000}
            required
            invalid={Boolean(state.errors.price)}
          />
        </Field>
        <div className="pb-1">
          <Checkbox
            id={`active-${service?.id ?? "new"}`}
            name="isActive"
            label="Active (bookable by patients)"
            defaultChecked={service ? service.isActive : true}
          />
        </div>
      </div>

      <Button type="submit" disabled={pending} variant={service ? "secondary" : "primary"}>
        {pending ? "Saving…" : service ? "Save changes" : "Create service"}
      </Button>
    </form>
  );
}
