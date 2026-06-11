import { JaadShell } from "@/components/jaad-shell";
import { platformTenants } from "@/lib/demo-data";
import { requirePlatformAccess } from "@/lib/platform-access";

export const dynamic = "force-dynamic";

export default async function JaadTenantsPage() {
  await requirePlatformAccess();

  return (
    <JaadShell title="العملاء">
      <section className="surface rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black">Tenants</h2>
          <span className="rounded-lg bg-fog px-3 py-2 text-sm font-bold">تفعيل وتعطيل العملاء من هنا</span>
        </div>
        <div className="mt-4 divide-y divide-ink/10 rounded-lg border border-ink/10">
          {platformTenants.map((tenant) => (
            <div key={tenant.name} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <h3 className="font-black">{tenant.name}</h3>
                <p className="text-sm text-ink/60">{tenant.owner} · {tenant.plan}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="rounded-lg bg-mint px-3 py-2 text-sm font-bold text-white">تفعيل</button>
                <button type="button" className="rounded-lg border border-ink/10 px-3 py-2 text-sm font-bold">تعطيل</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </JaadShell>
  );
}
