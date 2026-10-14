import { toggleServiceAction } from "@/app/actions/admin";
import { ServiceForm } from "@/components/admin/service-form";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { listServices } from "@/lib/services";
import { countAppointmentsForService } from "@/lib/services";
import { formatDuration, formatNaira } from "@/lib/format";

export const metadata = { title: "Services" };

export default async function AdminServicesPage() {
  const services = await listServices();
  const servicesWithCounts = await Promise.all(
    services.map(async (service) => ({
      service,
      bookingCount: await countAppointmentsForService(service.id),
    })),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Services"
        title="Manage services"
        description="Add, edit, activate and deactivate the services patients can book. Deactivated services keep their historical appointments."
      />

      <Card>
        <CardHeader title="Add a new service" />
        <CardBody>
          <ServiceForm />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={`${servicesWithCounts.length} service${servicesWithCounts.length === 1 ? "" : "s"}`}
          description="Expand a service to edit it."
        />
        <CardBody className="space-y-3">
          {servicesWithCounts.length === 0 ? (
            <EmptyState
              title="No services yet"
              description="Create your first service using the form above."
            />
          ) : (
            servicesWithCounts.map(({ service, bookingCount }) => {
              return (
                <details
                  key={service.id}
                  className="rounded-lg border border-navy-100 bg-white open:ring-1 open:ring-brand-100"
                >
                  <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3">
                    <span className="flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-navy-800">{service.name}</span>
                        <Badge
                          className={
                            service.isActive
                              ? "bg-brand-100 text-brand-800 ring-brand-200"
                              : "bg-slate-100 text-slate-600 ring-slate-200"
                          }
                        >
                          {service.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {formatNaira(service.price)} · {formatDuration(service.durationMinutes)} ·{" "}
                        {bookingCount} appointment{bookingCount === 1 ? "" : "s"}
                      </span>
                    </span>
                    <span className={buttonClass({ variant: "ghost", size: "sm" })}>Edit</span>
                  </summary>
                  <div className="border-t border-navy-100 px-4 py-4">
                    <div className="mb-4 flex justify-end">
                      <form action={toggleServiceAction}>
                        <input type="hidden" name="id" value={service.id} />
                        <input type="hidden" name="active" value={service.isActive ? "0" : "1"} />
                        <ConfirmSubmitButton
                          message={
                            service.isActive
                              ? `Deactivate "${service.name}"? Patients will no longer be able to book it.`
                              : undefined
                          }
                          className={buttonClass({
                            variant: service.isActive ? "danger" : "primary",
                            size: "sm",
                          })}
                        >
                          {service.isActive ? "Deactivate" : "Activate"}
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                    <ServiceForm service={service} />
                  </div>
                </details>
              );
            })
          )}
        </CardBody>
      </Card>
    </div>
  );
}
