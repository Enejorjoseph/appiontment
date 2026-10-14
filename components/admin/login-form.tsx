"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/admin";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { EMPTY_FORM_STATE } from "@/lib/action-state";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? <Alert variant="error">{state.message}</Alert> : null}

      <Field label="Email address" htmlFor="email" required error={state.errors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="manager@carepointclinic.com"
          required
          invalid={Boolean(state.errors.email)}
        />
      </Field>

      <Field label="Password" htmlFor="password" required error={state.errors.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          invalid={Boolean(state.errors.password)}
        />
      </Field>

      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
