import { JaadShell } from "@/components/jaad-shell";
import { requirePlatformAccess } from "@/lib/platform-access";
import { plans } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { daysRemaining } from "@/lib/subscription";

type JaadTenantsPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const statusMessages = {
  updated: "تم تحديث العميل بنجاح.",
  invalid: "تعذر تنفيذ الإجراء. تحقق من البيانات.",
  missing: "لم يتم العثور على العميل.",
  invalid_plan: "الباقة المختارة غير صحيحة."
} as const;

const subscriptionLabels = {
  TRIAL: "تجربة",
  ACTIVE: "نشط",
  EXPIRED: "منتهي",
  CANCELLED: "ملغي",
  PAST_DUE: "متأخر"
} as const;

function dateLabel(value: Date | null | undefined) {
  return value ? value.toLocaleDateString("ar-SA") : "-";
}

export const dynamic = "force-dynamic";

export default async function JaadTenantsPage({ searchParams }: JaadTenantsPageProps) {
  await requirePlatformAccess();
  const params = await searchParams;
  const message = params.status ? statusMessages[params.status as keyof typeof statusMessages] : null;
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      plan: true,
      subscription: true,
      users: {
        where: { role: "TENANT_OWNER" },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { name: true, email: true }
      },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true }
      },
      _count: {
        select: {
          branches: true,
          posDevices: true,
          users: true,
          orders: true
        }
      }
    }
  });

  return (
    <JaadShell title="العملاء">
      <section className="surface rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black">Tenants</h2>
          <span className="rounded-lg bg-fog px-3 py-2 text-sm font-bold">تفعيل، تمديد، تعطيل، وتغيير باقة يدويًا</span>
        </div>
        {message && <p className="mt-4 rounded-lg bg-mint/10 p-3 text-sm font-bold text-mint">{message}</p>}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1180px] text-sm">
            <thead className="bg-fog text-ink/60">
              <tr>
                <th className="p-3 text-right">المنشأة</th>
                <th className="p-3 text-right">المالك</th>
                <th className="p-3 text-right">التواصل</th>
                <th className="p-3 text-right">الباقة</th>
                <th className="p-3 text-right">الاشتراك</th>
                <th className="p-3 text-right">التجربة</th>
                <th className="p-3 text-right">الأعداد</th>
                <th className="p-3 text-right">آخر نشاط</th>
                <th className="p-3 text-right">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {tenants.length ? (
                tenants.map((tenant) => {
                  const owner = tenant.users[0];
                  const trialDays = tenant.subscription ? daysRemaining(tenant.subscription.trialEndsAt) : 0;

                  return (
                    <tr key={tenant.id} className="border-b border-ink/10 align-top">
                      <td className="p-3">
                        <strong className="block">{tenant.name}</strong>
                        <span className="text-xs text-ink/50">{tenant.status === "ACTIVE" ? "نشط" : "معطل"}</span>
                      </td>
                      <td className="p-3">
                        <strong className="block">{owner?.name ?? "-"}</strong>
                        <span className="text-xs text-ink/50">{owner?.email ?? "-"}</span>
                      </td>
                      <td className="p-3">
                        <span className="block">{tenant.email ?? owner?.email ?? "-"}</span>
                        <span className="text-xs text-ink/50">{tenant.phone ?? "-"}</span>
                      </td>
                      <td className="p-3">{tenant.plan.nameEnglish}</td>
                      <td className="p-3">{tenant.subscription ? subscriptionLabels[tenant.subscription.status] : "-"}</td>
                      <td className="p-3">
                        <span className="block">من {dateLabel(tenant.subscription?.trialStartedAt)}</span>
                        <span className="block">إلى {dateLabel(tenant.subscription?.trialEndsAt)}</span>
                        <strong>{trialDays} يوم</strong>
                      </td>
                      <td className="p-3 leading-7">
                        فروع {tenant._count.branches}/{tenant.plan.maxBranches}<br />
                        أجهزة {tenant._count.posDevices}/{tenant.plan.maxPosDevices}<br />
                        مستخدمون {tenant._count.users}/{tenant.plan.maxUsers}<br />
                        طلبات {tenant._count.orders}
                      </td>
                      <td className="p-3">{dateLabel(tenant.orders[0]?.createdAt ?? tenant.updatedAt)}</td>
                      <td className="p-3">
                        <div className="flex min-w-60 flex-wrap gap-2">
                          <form action={`/api/jaad/tenants/${tenant.id}`} method="post">
                            <input type="hidden" name="action" value="activate" />
                            <button type="submit" className="rounded-lg bg-mint px-3 py-2 text-xs font-bold text-white">تفعيل</button>
                          </form>
                          <form action={`/api/jaad/tenants/${tenant.id}`} method="post">
                            <input type="hidden" name="action" value="extend_trial" />
                            <button type="submit" className="rounded-lg border border-ink/10 px-3 py-2 text-xs font-bold">تمديد 7 أيام</button>
                          </form>
                          <form action={`/api/jaad/tenants/${tenant.id}`} method="post">
                            <input type="hidden" name="action" value="disable" />
                            <button type="submit" className="rounded-lg bg-date px-3 py-2 text-xs font-bold text-white">تعطيل</button>
                          </form>
                          <form action={`/api/jaad/tenants/${tenant.id}`} method="post" className="flex gap-2">
                            <input type="hidden" name="action" value="change_plan" />
                            <select name="plan" defaultValue={tenant.plan.code.toLowerCase()} className="rounded-lg border-ink/10 text-xs">
                              {plans.map((plan) => (
                                <option key={plan.code} value={plan.code}>{plan.name}</option>
                              ))}
                            </select>
                            <button type="submit" className="rounded-lg border border-ink/10 px-3 py-2 text-xs font-bold">تغيير</button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="p-5 text-center text-ink/55" colSpan={9}>لا يوجد عملاء بعد.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </JaadShell>
  );
}
