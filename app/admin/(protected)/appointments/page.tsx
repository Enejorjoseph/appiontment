import Link from "next/link";
import { AppointmentsTable } from "@/components/admin/appointments-table";
import { buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { listAppointments } from "@/lib/appointments";
import { isAppointmentStatus, STATUS_LABELS } from "@/lib/status";
import { listServices } from "@/lib/services";

export const metadata = { title: "Appointments" };

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = first(params.query);
  const date = first(params.date);
  const statusParam = first(params.status);
  const serviceParam = first(params.service);
  const status = isAppointmentStatus(statusParam) ? statusParam : undefined;
  const serviceId = serviceParam && Number.isInteger(Number(serviceParam)) ? Number(serviceParam) : undefined;

  const appointments = await listAppointments({
    query: query || undefined,
    date: date || undefined,
    status,
    serviceId,
  });
  const services = await listServices();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Appointments"
        title="All appointments"
        description="Search by booking reference or patient name, and filter by date, service or status."
        action={
          <Link href="/admin/calendar" className={buttonClass({ variant: "outline", size: "sm" })}>
            Calendar view
          </Link>
        }
      />

      <Card>
        <CardHeader title="Search & filter" />
        <CardBody>
          <form method="get" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
            <Field label="Search" htmlFor="query" className="lg:col-span-2">
              <Input
                id="query"
                name="query"
                placeholder="Reference or patient name"
                defaultValue={query}
              />
            </Field>
            <Field label="Date" htmlFor="date">
              <Input id="date" name="date" type="date" defaultValue={date} />
            </Field>
            <Field label="Service" htmlFor="service">
              <Select id="service" name="service" defaultValue={serviceParam}>
                <option value="">All services</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status" htmlFor="status">
              <Select id="status" name="status" defaultValue={statusParam}>
                <option value="">All statuses</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex gap-2 lg:col-span-5">
              <button type="submit" className={buttonClass({ variant: "secondary", size: "md" })}>
                Apply filters
              </button>
              <Link href="/admin/appointments" className={buttonClass({ variant: "ghost", size: "md" })}>
                Reset
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={`${appointments.length} appointment${appointments.length === 1 ? "" : "s"}`} />
        <CardBody>
          <AppointmentsTable
            appointments={appointments}
            emptyTitle="No matching appointments"
            emptyDescription="Try adjusting the search text or filters."
          />
        </CardBody>
      </Card>
    </div>
  );
}
