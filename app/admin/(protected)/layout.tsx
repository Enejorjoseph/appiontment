import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdmin } from "@/lib/auth/guard";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const settings = await getSettings();

  return (
    <div className="min-h-full bg-slate-50 lg:flex">
      <AdminSidebar clinicName={settings.clinicName} adminName={admin.name} role={admin.role} />
      <main className="min-w-0 flex-1 lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
