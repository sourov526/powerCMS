export const runtime = "nodejs";

import AnalyticsEvents from "@/app/admin/core/AnalyticsEvents";
import { getSessionUser } from "@/lib/auth/auth-server";
import AdminShell from "@/app/admin/core/AdminShell";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminLayoutShell>{children}</AdminLayoutShell>
  );
}

async function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  // Auth pages (and any unauthenticated access) should render without the admin shell.
  // Protected admin pages are responsible for calling `requireSessionUser()` themselves.
  if (!user || user.status !== "active") {
    return <>{children}</>;
  }

  return (
    <AdminShell user={{ email: user.email, role: user.role }}>
      <AnalyticsEvents />
      {children}
    </AdminShell>
  );
}
