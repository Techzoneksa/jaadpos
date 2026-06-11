import { JaadShell } from "@/components/jaad-shell";
import { platformTenants } from "@/lib/demo-data";
import { requirePlatformAccess } from "@/lib/platform-access";

export const dynamic = "force-dynamic";

export default async function JaadSubscriptionsPage() {
  await requirePlatformAccess();

  return (
    <JaadShell title="الاشتراكات">
      <section className="surface rounded-lg p-5">
        <h2 className="text-xl font-black">إدارة الاشتراكات والتجارب</h2>
        <div className="mt-4 grid gap-3">
          {platformTenants.map((tenant) => (
            <div key={tenant.name} className="rounded-lg border border-ink/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-black">{tenant.name}</h3>
                  <p className="text-sm text-ink/60">الحالة: {tenant.status} · الباقة: {tenant.plan}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="rounded-lg border border-ink/10 px-3 py-2 text-sm font-bold">تمديد التجربة</button>
                  <button type="button" className="rounded-lg bg-mint px-3 py-2 text-sm font-bold text-white">تحويل إلى active</button>
                  <button type="button" className="rounded-lg bg-date px-3 py-2 text-sm font-bold text-white">إلغاء</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </JaadShell>
  );
}
