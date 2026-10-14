"use client";

import { useActionState } from "react";
import { submitContactAction } from "@/app/actions/contact";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { EMPTY_FORM_STATE } from "@/lib/action-state";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactAction, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? (
        <Alert variant={state.ok ? "success" : "error"}>{state.message}</Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor="contact-name" required error={state.errors.name}>
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            required
            invalid={Boolean(state.errors.name)}
          />
        </Field>
        <Field label="Email address" htmlFor="contact-email" required error={state.errors.email}>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            invalid={Boolean(state.errors.email)}
          />
        </Field>
      </div>

      <Field label="Subject" htmlFor="contact-subject" error={state.errors.subject}>
        <Input id="contact-subject" name="subject" invalid={Boolean(state.errors.subject)} />
      </Field>

      <Field label="Message" htmlFor="contact-message" required error={state.errors.message}>
        <Textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          invalid={Boolean(state.errors.message)}
        />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
