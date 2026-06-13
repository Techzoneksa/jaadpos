import { AppShell } from "@/components/app-shell";
import { UnavailableAction } from "@/components/unavailable-action";
import { requireTenantAccess } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";

const roleLabels = {
  TENANT_OWNER: "مالك المنشأة",
  BRANCH_MANAGER: "مدير فرع",
  CASHIER: "كاشير",
  ACCOUNTANT: "محاسب"
} as const;

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await requireTenantAccess(["TENANT_OWNER"]);
  const users = await prisma.user.findMany({
    where: { tenantId: session.tenantId! },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      role: true,
      email: true,
      active: true
    }
  });

  return (
    <AppShell title="المستخدمون والصلاحيات" allowedRoles={["TENANT_OWNER"]}>
      <section className="surface rounded-lg p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">مستخدمو المنشأة</h2>
            <p className="mt-1 text-sm text-ink/60">يعرض هذا القسم المستخدمين الحاليين وصلاحياتهم داخل المنشأة.</p>
          </div>
          <UnavailableAction label="إضافة مستخدم" />
        </div>
        <div className="mt-4 divide-y divide-ink/10 rounded-lg border border-ink/10">
          {users.map((user) => (
            <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <h3 className="font-black">{user.name}</h3>
                <p className="text-sm text-ink/60">{user.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-fog px-3 py-2 text-sm font-bold">{roleLabels[user.role as keyof typeof roleLabels] ?? user.role}</span>
                <span className={user.active ? "rounded-lg bg-mint/10 px-3 py-2 text-sm font-bold text-mint" : "rounded-lg bg-date/10 px-3 py-2 text-sm font-bold text-date"}>
                  {user.active ? "نشط" : "معطل"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
