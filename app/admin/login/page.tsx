import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getCurrentAdmin } from "@/lib/auth/session";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Staff login" };

export default async function AdminLoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");
  const settings = await getSettings();

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-navy-800 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-300">
            {settings.clinicName}
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Staff sign in</h1>
          <p className="mt-1 text-sm text-navy-200">Authorized clinic staff only.</p>
        </div>

        <Card>
          <CardHeader title="Sign in to the dashboard" />
          <CardBody>
            <LoginForm />
          </CardBody>
        </Card>

        <p className="mt-4 text-center text-sm">
          <Link href="/" className="text-navy-200 hover:text-white">
            ← Back to the public site
          </Link>
        </p>
      </div>
    </div>
  );
}
