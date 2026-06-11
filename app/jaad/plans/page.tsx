import { JaadShell } from "@/components/jaad-shell";
import { plans } from "@/lib/plans";
import { requirePlatformAccess } from "@/lib/platform-access";

export const dynamic = "force-dynamic";

export default async function JaadPlansPage() {
  await requirePlatformAccess();

  return (
    <JaadShell title="الباقات">
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <section key={plan.code} className="surface rounded-lg p-5">
            <h2 className="text-2xl font-black">{plan.name}</h2>
            <p className="mt-2 text-ink/60">{plan.priceLabel}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
              <span className="rounded-lg bg-fog p-3">{plan.limits.branches} فروع</span>
              <span className="rounded-lg bg-fog p-3">{plan.limits.posDevices} أجهزة</span>
              <span className="rounded-lg bg-fog p-3">{plan.limits.users} مستخدم</span>
            </div>
          </section>
        ))}
      </div>
    </JaadShell>
  );
}
