import { ContactForm } from "@/components/site/contact-form";
import { OpeningHours } from "@/components/site/site-footer";
import { PageHero } from "@/components/site/page-hero";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { getSettings, getWorkingHours } from "@/lib/settings";

export const metadata = { title: "Contact" };

export default async function ContactPage() {
  const settings = await getSettings();
  const hours = await getWorkingHours();

  return (
    <>
      <PageHero
        eyebrow={settings.clinicName}
        title="Contact us"
        description="Send the clinic a message, call us, or email us. For appointments, booking online is the fastest option."
      />

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader title="Clinic details" />
              <CardBody className="space-y-4 text-sm text-slate-600">
                <p className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 ring-1 ring-inset ring-brand-100">
                    <Icon name="pin" className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                      Address
                    </span>
                    {settings.address}
                  </span>
                </p>
                <p className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 ring-1 ring-inset ring-brand-100">
                    <Icon name="phone" className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                      Phone
                    </span>
                    <a className="text-navy-700 hover:text-brand-700" href={`tel:${settings.phone.replace(/\s+/g, "")}`}>
                      {settings.phone}
                    </a>
                  </span>
                </p>
                <p className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 ring-1 ring-inset ring-brand-100">
                    <Icon name="mail" className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                      Email
                    </span>
                    <a className="text-navy-700 hover:text-brand-700" href={`mailto:${settings.email}`}>
                      {settings.email}
                    </a>
                  </span>
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Opening hours" />
              <CardBody>
                <OpeningHours hours={hours} />
              </CardBody>
            </Card>
          </div>

          <Card className="border-brand-200 shadow-lg shadow-brand-600/5 lg:sticky lg:top-20 lg:self-start">
            <CardHeader
              title="Send a message"
              description="We record your message for the clinic team."
              className="rounded-t-2xl bg-gradient-to-r from-brand-50 to-white"
            />
            <CardBody>
              <ContactForm />
            </CardBody>
          </Card>
        </div>
      </section>
    </>
  );
}