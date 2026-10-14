"use client";

import { useActionState } from "react";
import { patientSignupAction } from "@/app/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { EMPTY_FORM_STATE } from "@/lib/action-state";

export function PatientSignupForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(patientSignupAction, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? <Alert variant="error">{state.message}</Alert> : null}
      <input type="hidden" name="next" value={next} />

      <Field label="Full name" htmlFor="name" required error={state.errors.name}>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          placeholder="Ada Patient"
          required
          invalid={Boolean(state.errors.name)}
        />
      </Field>

      <Field label="Email address" htmlFor="email" required error={state.errors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          invalid={Boolean(state.errors.email)}
        />
      </Field>

      <Field label="Phone number" htmlFor="phone" error={state.errors.phone}>
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+234 800 000 0000"
          invalid={Boolean(state.errors.phone)}
        />
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        required
        error={state.errors.password}
        hint="At least 8 characters."
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          invalid={Boolean(state.errors.password)}
        />
      </Field>

      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-xs text-slate-500">
        By creating an account you will receive booking confirmations by email.
      </p>
    </form>
  );
}