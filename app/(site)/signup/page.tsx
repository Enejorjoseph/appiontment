import Link from "next/link";
import { redirect } from "next/navigation";
import { PatientSignupForm } from "@/components/site/signup-form";
import { PageHero } from "@/components/site/page-hero";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getCurrentPatient } from "@/lib/auth/patient";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Create an account" };

export default async function SignupPage({
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
        title="Create your patient account"
        description="Sign in once and book appointments without re-entering your details."
      />
      <section className="mx-auto max-w-md px-4 pb-14 sm:px-6">
        <Card className="border-brand-200">
          <CardHeader title="Sign up" />
          <CardBody>
            <PatientSignupForm next={next} />
          </CardBody>
        </Card>

        <p className="mt-4 text-center text-sm text-navy-600">
          Already have an account?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="font-medium text-brand-700 hover:underline"
          >
            Log in
          </Link>
        </p>
      </section>
    </>
  );
}