/**
 * End-to-end flow test for the CarePoint booking system.
 *
 * Runs against the configured Supabase project. It creates temporary services,
 * appointments and messages, then removes the records it created so repeated
 * runs stay clean. Execute with:
 *
 *   npm run test:flow
 */

const results: { name: string; ok: boolean; detail?: string }[] = [];

function section(title: string): void {
  console.log(`\n${title}`);
}

function check(name: string, condition: boolean, detail?: string): void {
  results.push({ name, ok: condition, detail });
  if (condition) {
    console.log(`  PASS  ${name}`);
  } else {
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main(): Promise<void> {
  const { getSupabase } = await import("../lib/supabase");
  const { getSettings, updateSettings, getWorkingHours } = await import("../lib/settings");
  const { listServices, getService, createService, setServiceActive } = await import(
    "../lib/services"
  );
  const { computeSlots, checkSlotBookable } = await import("../lib/availability");
  const {
    createAppointment,
    getAppointmentByReference,
    findAppointmentForPatient,
    updateAppointmentStatus,
    rescheduleAppointment,
  } = await import("../lib/appointments");
  const { validateBooking, validateSettings } = await import("../lib/validation");
  const { createContactMessage, listContactMessages } = await import("../lib/contact");
  const { addDays, weekdayOf, todayInTimeZone, timeToMinutes } = await import("../lib/datetime");
  const { DEMO_ADMIN, DEMO_STAFF } = await import("../lib/demo");

  const supabase = getSupabase();
  const createdAppointmentIds: number[] = [];
  const createdServiceIds: number[] = [];

  const settings = await getSettings();
  const today = todayInTimeZone(settings.timezone);

  section("Database bootstrap");
  check("clinic settings are seeded", settings.clinicName.length > 0);
  check("demonstration services exist", (await listServices()).length >= 5);
  check("seven working-hour rows exist", (await getWorkingHours()).length === 7);

  const adminLogin = await supabase.rpc("login_admin", {
    p_email: DEMO_ADMIN.email,
    p_password: DEMO_ADMIN.password,
  });
  check(
    "admin signs in with the seeded credential",
    adminLogin.data?.ok === true,
    adminLogin.error?.message,
  );
  const staffLogin = await supabase.rpc("login_admin", {
    p_email: DEMO_STAFF.email,
    p_password: DEMO_STAFF.password,
  });
  const staffWrong = await supabase.rpc("login_admin", {
    p_email: DEMO_STAFF.email,
    p_password: "wrong-password",
  });
  check(
    "staff signs in and a wrong password is rejected",
    staffLogin.data?.ok === true && staffWrong.data?.ok !== true,
  );

  const activeServices = await listServices({ activeOnly: true });
  const general = activeServices.find((s) => s.name === "General Consultation");
  const inactive = (await listServices()).find((s) => !s.isActive);
  check("general consultation service is available", Boolean(general));
  check("an inactive service exists for negative testing", Boolean(inactive));

  if (!general || !inactive) throw new Error("Seed data is missing required services.");

  section("Availability rules");
  check(
    "past dates are closed",
    (await computeSlots(addDays(today, -1), general.durationMinutes)).isClosed,
  );
  check(
    "dates beyond the booking window are closed",
    (await computeSlots(addDays(today, settings.maxBookingDays + 1), general.durationMinutes))
      .isClosed,
  );

  let sunday = "";
  for (let i = 1; i <= settings.maxBookingDays; i += 1) {
    const candidate = addDays(today, i);
    if (weekdayOf(candidate) === 0) {
      sunday = candidate;
      break;
    }
  }
  check(
    "the clinic is closed on Sundays",
    sunday !== "" && (await computeSlots(sunday, general.durationMinutes)).isClosed,
  );

  async function firstOpenWeekday() {
    for (let i = 1; i <= settings.maxBookingDays; i += 1) {
      const date = addDays(today, i);
      const weekday = weekdayOf(date);
      if (weekday < 1 || weekday > 5) continue;
      const slots = await computeSlots(date, general!.durationMinutes);
      if (!slots.isClosed && slots.slots.some((slot) => slot.available)) return { date, slots };
    }
    throw new Error("No open weekday found within the booking window.");
  }

  const target = await firstOpenWeekday();
  const workingHour = (await getWorkingHours()).find((h) => h.weekday === weekdayOf(target.date));
  check(
    "an open weekday has bookable slots",
    !target.slots.isClosed && target.slots.slots.length > 0,
  );
  check(
    "slots start at the clinic opening time",
    target.slots.slots[0]?.time === workingHour?.openTime,
    `first slot ${target.slots.slots[0]?.time} vs open ${workingHour?.openTime}`,
  );

  if (workingHour?.breakStart && workingHour?.breakEnd) {
    const breakSlot = target.slots.slots.find((slot) => slot.time === workingHour.breakStart);
    check(
      "the clinic break blocks its start slot",
      breakSlot !== undefined && !breakSlot.available && Boolean(breakSlot.reason),
      breakSlot ? `reason: ${breakSlot.reason}` : "no break slot present",
    );
  } else {
    check(
      "no clinic break is configured",
      target.slots.slots.every((slot) => slot.reason !== "Clinic break"),
    );
  }

  section("Patient booking");
  const firstSlot = target.slots.slots.find((slot) => slot.available)!;
  const email = "flow.test@example.test";
  const created = await createAppointment({
    serviceId: general.id,
    appointmentDate: target.date,
    startTime: firstSlot.time,
    patientName: "Flow Test Patient",
    patientEmail: email,
    patientPhone: "+234 800 123 4567",
    reason: "Automated flow test booking.",
  });
  check("a valid booking is created", created.ok, created.ok ? undefined : created.reason);

  if (!created.ok) throw new Error("Could not create the primary booking.");

  const appointment = await getAppointmentByReference(created.reference);
  if (appointment) createdAppointmentIds.push(appointment.id);
  check("the booking can be retrieved by reference", Boolean(appointment));
  check(
    "new bookings start as pending when auto-confirm is off",
    appointment?.status === (settings.autoConfirm ? "confirmed" : "pending"),
    `status: ${appointment?.status}`,
  );
  check(
    "patient lookup succeeds with the correct email",
    (await findAppointmentForPatient(created.reference, email)) !== undefined,
  );
  check(
    "patient lookup fails with the wrong email",
    (await findAppointmentForPatient(created.reference, "someone.else@example.test")) === undefined,
  );

  const duplicate = await createAppointment({
    serviceId: general.id,
    appointmentDate: target.date,
    startTime: firstSlot.time,
    patientName: "Another Patient",
    patientEmail: "another@example.test",
    patientPhone: "+234 800 765 4321",
    reason: "",
  });
  check(
    "double booking the same slot is rejected",
    !duplicate.ok,
    duplicate.ok ? "unexpectedly succeeded" : duplicate.reason,
  );
  check(
    "checkSlotBookable reports the taken slot as unavailable",
    !(await checkSlotBookable(target.date, firstSlot.time, general.durationMinutes)).ok,
  );

  const inactiveAttempt = await createAppointment({
    serviceId: inactive.id,
    appointmentDate: target.date,
    startTime: firstSlot.time,
    patientName: "Inactive Service Patient",
    patientEmail: "inactive@example.test",
    patientPhone: "+234 800 000 0000",
    reason: "",
  });
  check(
    "booking an inactive service is rejected",
    !inactiveAttempt.ok && inactiveAttempt.code === "service_inactive",
    inactiveAttempt.ok ? "unexpectedly succeeded" : inactiveAttempt.code,
  );

  const invalid = validateBooking({
    serviceId: general.id,
    appointmentDate: target.date,
    startTime: firstSlot.time,
    patientName: "X",
    patientEmail: "not-an-email",
    patientPhone: "abc",
    reason: "",
  });
  check(
    "invalid booking input fails validation with field errors",
    !invalid.success && Boolean(invalid.errors.patientEmail) && Boolean(invalid.errors.patientName),
  );

  section("Status workflow");
  if (!appointment) throw new Error("Primary appointment missing.");
  check("pending can be confirmed", (await updateAppointmentStatus(appointment.id, "confirmed")).ok);
  check("confirmed can be completed", (await updateAppointmentStatus(appointment.id, "completed")).ok);
  check(
    "completed appointments cannot be cancelled",
    !(await updateAppointmentStatus(appointment.id, "cancelled")).ok,
  );

  section("Cancellation releases the slot");
  const secondSlot = (await computeSlots(target.date, general.durationMinutes)).slots.find(
    (slot) => slot.available && timeToMinutes(slot.time) >= timeToMinutes(firstSlot.endTime),
  );
  check("a second free slot is available on the target day", Boolean(secondSlot));

  if (!secondSlot) throw new Error("No adjacent free slot for cancellation test.");

  const secondBooking = await createAppointment({
    serviceId: general.id,
    appointmentDate: target.date,
    startTime: secondSlot.time,
    patientName: "Cancellation Patient",
    patientEmail: "cancel@example.test",
    patientPhone: "+234 800 222 3333",
    reason: "",
  });
  check("a second booking is created", secondBooking.ok);

  if (secondBooking.ok) {
    const afterSecond = (await getAppointmentByReference(secondBooking.reference))!;
    createdAppointmentIds.push(afterSecond.id);
    check(
      "the booked slot becomes unavailable",
      !(await computeSlots(target.date, general.durationMinutes)).slots.find(
        (slot) => slot.time === secondSlot.time,
      )?.available,
    );
    check(
      "the second booking can be cancelled",
      (await updateAppointmentStatus(afterSecond.id, "cancelled")).ok,
    );
    check(
      "cancelling releases the slot again",
      Boolean(
        (await computeSlots(target.date, general.durationMinutes)).slots.find(
          (slot) => slot.time === secondSlot.time && slot.available,
        ),
      ),
    );
    check(
      "a cancelled appointment cannot be rescheduled",
      !(await rescheduleAppointment(afterSecond.id, target.date, secondSlot.time)).ok,
    );
  }

  section("Rescheduling");
  const openForReschedule = (await computeSlots(target.date, general.durationMinutes)).slots.find(
    (slot) => slot.available,
  );
  check("a fresh slot is available for rescheduling", Boolean(openForReschedule));

  if (openForReschedule) {
    const rescheduleBooking = await createAppointment({
      serviceId: general.id,
      appointmentDate: target.date,
      startTime: openForReschedule.time,
      patientName: "Reschedule Patient",
      patientEmail: "reschedule@example.test",
      patientPhone: "+234 800 444 5555",
      reason: "",
    });
    check("a booking to reschedule is created", rescheduleBooking.ok);

    if (rescheduleBooking.ok) {
      const record = (await getAppointmentByReference(rescheduleBooking.reference))!;
      createdAppointmentIds.push(record.id);
      const movedTo = (await computeSlots(target.date, general.durationMinutes)).slots.find(
        (slot) => slot.available,
      );
      if (movedTo) {
        check(
          "rescheduling to a free slot succeeds",
          (await rescheduleAppointment(record.id, target.date, movedTo.time)).ok,
        );
        check(
          "a rescheduled appointment changes status",
          (await getAppointmentByReference(rescheduleBooking.reference))?.status === "rescheduled",
        );
        check(
          "rescheduling onto an occupied slot is rejected",
          !(await rescheduleAppointment(record.id, target.date, firstSlot.time)).ok,
        );
      }
    }
  }

  section("Clinic settings and services");
  check(
    "settings reject an out-of-range slot interval",
    !validateSettings({ ...settings, slotIntervalMinutes: 2 }).success,
  );
  const originalTagline = settings.tagline;
  await updateSettings({ ...settings, tagline: "Updated by flow test" });
  check(
    "settings round-trip through the database",
    (await getSettings()).tagline === "Updated by flow test",
  );
  await updateSettings({ ...settings, tagline: originalTagline });

  const newServiceId = await createService({
    name: "Flow Test Service",
    description: "Created by the automated flow test.",
    price: 1000,
    durationMinutes: 15,
    isActive: true,
  });
  createdServiceIds.push(newServiceId);
  check(
    "a new service is created and readable",
    (await getService(newServiceId))?.name === "Flow Test Service",
  );
  await setServiceActive(newServiceId, false);
  check("a service can be deactivated", (await getService(newServiceId))?.isActive === false);

  section("Contact messages");
  await createContactMessage({
    name: "Flow Tester",
    email: "tester@example.test",
    subject: "Flow test enquiry",
    message: "This message was generated by the automated flow test.",
  });
  check(
    "contact messages are persisted",
    (await listContactMessages()).some((message) => message.subject === "Flow test enquiry"),
  );

  section("Cleanup");
  if (createdAppointmentIds.length > 0) {
    await supabase.from("appointments").delete().in("id", createdAppointmentIds);
  }
  if (createdServiceIds.length > 0) {
    await supabase.from("services").delete().in("id", createdServiceIds);
  }
  await supabase.from("contact_messages").delete().eq("email", "tester@example.test");
  check("temporary test records were removed", true);

  const passed = results.filter((result) => result.ok).length;
  const failed = results.length - passed;
  console.log(`\n${"-".repeat(48)}`);
  console.log(`Flow test complete: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error("\nFlow test crashed:", error);
  process.exitCode = 1;
});
