"use client";

import { useActionState } from "react";
import { updateSettingsAction } from "@/app/actions/admin";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import { EMPTY_FORM_STATE } from "@/lib/action-state";
import type { ClinicSettings } from "@/lib/types";

export function SettingsForm({ settings }: { settings: ClinicSettings }) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="space-y-6">
      {state.message ? <Alert variant={state.ok ? "success" : "error"}>{state.message}</Alert> : null}

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-navy-800">Clinic details</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Clinic name" htmlFor="clinicName" required error={state.errors.clinicName}>
            <Input id="clinicName" name="clinicName" defaultValue={settings.clinicName} required invalid={Boolean(state.errors.clinicName)} />
          </Field>
          <Field label="Tagline" htmlFor="tagline" error={state.errors.tagline}>
            <Input id="tagline" name="tagline" defaultValue={settings.tagline} invalid={Boolean(state.errors.tagline)} />
          </Field>
        </div>
        <Field label="Description" htmlFor="description" error={state.errors.description}>
          <Textarea id="description" name="description" rows={4} defaultValue={settings.description} invalid={Boolean(state.errors.description)} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Phone" htmlFor="phone" error={state.errors.phone}>
            <Input id="phone" name="phone" defaultValue={settings.phone} invalid={Boolean(state.errors.phone)} />
          </Field>
          <Field label="Email" htmlFor="email" error={state.errors.email}>
            <Input id="email" name="email" type="email" defaultValue={settings.email} invalid={Boolean(state.errors.email)} />
          </Field>
        </div>
        <Field label="Address" htmlFor="address" error={state.errors.address}>
          <Input id="address" name="address" defaultValue={settings.address} invalid={Boolean(state.errors.address)} />
        </Field>
      </fieldset>

      <fieldset className="space-y-4 border-t border-navy-100 pt-6">
        <legend className="text-sm font-semibold text-navy-800">Booking rules</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Slot interval (minutes)"
            htmlFor="slotIntervalMinutes"
            required
            error={state.errors.slotIntervalMinutes}
            hint="How often appointment start times are offered."
          >
            <Input id="slotIntervalMinutes" name="slotIntervalMinutes" type="number" min={5} max={240} step={5} defaultValue={settings.slotIntervalMinutes} required invalid={Boolean(state.errors.slotIntervalMinutes)} />
          </Field>
          <Field
            label="Minimum notice (minutes)"
            htmlFor="minNoticeMinutes"
            required
            error={state.errors.minNoticeMinutes}
            hint="How soon before an appointment patients may book."
          >
            <Input id="minNoticeMinutes" name="minNoticeMinutes" type="number" min={0} max={20160} step={15} defaultValue={settings.minNoticeMinutes} required invalid={Boolean(state.errors.minNoticeMinutes)} />
          </Field>
          <Field
            label="Maximum booking window (days)"
            htmlFor="maxBookingDays"
            required
            error={state.errors.maxBookingDays}
            hint="How far ahead patients can book."
          >
            <Input id="maxBookingDays" name="maxBookingDays" type="number" min={1} max={365} defaultValue={settings.maxBookingDays} required invalid={Boolean(state.errors.maxBookingDays)} />
          </Field>
          <Field label="Time zone" htmlFor="timezone" error={state.errors.timezone} hint="IANA name, e.g. Africa/Lagos.">
            <Input id="timezone" name="timezone" defaultValue={settings.timezone} invalid={Boolean(state.errors.timezone)} />
          </Field>
        </div>
        <div className="pt-1">
          <Checkbox
            id="autoConfirm"
            name="autoConfirm"
            label="Automatically confirm new bookings (otherwise they start as Pending)"
            defaultChecked={settings.autoConfirm}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-navy-100 pt-6">
        <legend className="text-sm font-semibold text-navy-800">Cancellation policy</legend>
        <Field label="Policy text" htmlFor="cancellationPolicy" error={state.errors.cancellationPolicy}>
          <Textarea id="cancellationPolicy" name="cancellationPolicy" rows={4} defaultValue={settings.cancellationPolicy} invalid={Boolean(state.errors.cancellationPolicy)} />
        </Field>
      </fieldset>

      <Button type="submit" disabled={pending} size="lg">
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
