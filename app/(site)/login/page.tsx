import Link from "next/link";
import { redirect } from "next/navigation";
import { PatientLoginForm } from "@/components/site/login-form";
import { PageHero } from "@/components/site/page-hero";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getCurrentPatient } from "@/lib/auth/patient";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  const patient = await getCurrentPatient();
  if (patient) redirect(next);

  const settings = await getSettings();

  return (
    <>
      <PageHero
        eyebrow={settings.clinicName}
        title="Log in to your account"
        description="Book and manage appointments faster with your saved details."
      />
      <section className="mx-auto max-w-md px-4 pb-14 sm:px-6">
        <Card className="border-brand-200">
          <CardHeader title="Welcome back" />
          <CardBody>
            <PatientLoginForm next={next} />
          </CardBody>
        </Card>

        <p className="mt-4 text-center text-sm text-navy-600">
          New here?{" "}
          <Link
            href={`/signup?next=${encodeURIComponent(next)}`}
            className="font-medium text-brand-700 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </section>
    </>
  );
}