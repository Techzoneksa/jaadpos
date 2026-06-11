import { JaadShell } from "@/components/jaad-shell";
import { StatCard } from "@/components/stat-card";
import { requirePlatformAccess } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";

const money = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR"
});

const subscriptionLabels = {
  TRIAL: "تجربة",
  ACTIVE: "نشط",
  EXPIRED: "منتهي",
  CANCELLED: "ملغي",
  PAST_DUE: "متأخر"
} as const;

export const dynamic = "force-dynamic";

export default async function JaadDashboardPage() {
  await requirePlatformAccess();
  const [tenantCount, trialCount, activeCount, sales, tenants] = await Promise.all([
    prisma.tenant.count(),
    prisma.subscription.count({ where: { status: "TRIAL" } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.order.aggregate({ where: { status: "PAID" }, _sum: { total: true } }),
    prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        plan: true,
        subscription: true,
        users: {
          where: { role: "TENANT_OWNER" },
          take: 1,
          select: { name: true }
        },
        _count: {
          select: {
            branches: true,
            posDevices: true,
            users: true
          }
        }
      }
    })
  ]);

  return (
    <JaadShell title="لوحة جاد">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="عدد العملاء الكلي" value={String(tenantCount)} hint="Tenants" />
        <StatCard label="في التجربة" value={String(trialCount)} hint="Trial active" />
        <StatCard label="نشطين" value={String(activeCount)} hint="اشتراك active" />
        <StatCard label="إجمالي المبيعات" value={money.format(Number(sales._sum.total ?? 0))} hint="عبر المنصة" />
      </div>
      <section className="surface mt-5 rounded-lg p-5">
        <h2 className="text-xl font-black">عملاء المنصة</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-fog text-ink/60">
              <tr>
                <th className="p-3 text-right">المنشأة</th>
                <th className="p-3 text-right">المالك</th>
                <th className="p-3 text-right">الاشتراك</th>
                <th className="p-3 text-right">الباقة</th>
                <th className="p-3 text-right">الفروع</th>
                <th className="p-3 text-right">الأجهزة</th>
                <th className="p-3 text-right">المستخدمون</th>
              </tr>
            </thead>
            <tbody>
              {tenants.length ? (
                tenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b border-ink/10">
                    <td className="p-3 font-bold">{tenant.name}</td>
                    <td className="p-3">{tenant.users[0]?.name ?? "-"}</td>
                    <td className="p-3">{tenant.subscription ? subscriptionLabels[tenant.subscription.status] : "-"}</td>
                    <td className="p-3">{tenant.plan.nameEnglish}</td>
                    <td className="p-3">{tenant._count.branches}</td>
                    <td className="p-3">{tenant._count.posDevices}</td>
                    <td className="p-3">{tenant._count.users}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-5 text-center text-ink/55" colSpan={7}>لا يوجد عملاء بعد.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </JaadShell>
  );
}
