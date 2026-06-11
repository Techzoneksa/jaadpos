import { JaadShell } from "@/components/jaad-shell";
import { requirePlatformAccess } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";
import { daysRemaining } from "@/lib/subscription";

const subscriptionLabels = {
  TRIAL: "تجربة",
  ACTIVE: "نشط",
  EXPIRED: "منتهي",
  CANCELLED: "ملغي",
  PAST_DUE: "متأخر"
} as const;

export const dynamic = "force-dynamic";

export default async function JaadSubscriptionsPage() {
  await requirePlatformAccess();
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      plan: true,
      subscription: true
    }
  });

  return (
    <JaadShell title="الاشتراكات">
      <section className="surface rounded-lg p-5">
        <h2 className="text-xl font-black">إدارة الاشتراكات والتجارب</h2>
        <div className="mt-4 grid gap-3">
          {tenants.length ? (
            tenants.map((tenant) => (
              <div key={tenant.id} className="rounded-lg border border-ink/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black">{tenant.name}</h3>
                    <p className="text-sm text-ink/60">
                      الحالة: {tenant.subscription ? subscriptionLabels[tenant.subscription.status] : "-"} · الباقة: {tenant.plan.nameEnglish} · المتبقي: {tenant.subscription ? daysRemaining(tenant.subscription.trialEndsAt) : 0} يوم
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={`/api/jaad/tenants/${tenant.id}`} method="post">
                      <input type="hidden" name="action" value="extend_trial" />
                      <button type="submit" className="rounded-lg border border-ink/10 px-3 py-2 text-sm font-bold">تمديد التجربة</button>
                    </form>
                    <form action={`/api/jaad/tenants/${tenant.id}`} method="post">
                      <input type="hidden" name="action" value="activate" />
                      <button type="submit" className="rounded-lg bg-mint px-3 py-2 text-sm font-bold text-white">تحويل إلى active</button>
                    </form>
                    <form action={`/api/jaad/tenants/${tenant.id}`} method="post">
                      <input type="hidden" name="action" value="disable" />
                      <button type="submit" className="rounded-lg bg-date px-3 py-2 text-sm font-bold text-white">تعطيل</button>
                    </form>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-lg bg-fog p-4 text-center text-sm text-ink/55">لا يوجد اشتراكات بعد.</p>
          )}
        </div>
      </section>
    </JaadShell>
  );
}
