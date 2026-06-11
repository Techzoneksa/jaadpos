import { JaadShell } from "@/components/jaad-shell";
import { StatCard } from "@/components/stat-card";
import { platformTenants } from "@/lib/demo-data";
import { requirePlatformAccess } from "@/lib/platform-access";

export const dynamic = "force-dynamic";

export default async function JaadDashboardPage() {
  await requirePlatformAccess();

  return (
    <JaadShell title="لوحة جاد">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="عدد العملاء الكلي" value="3" hint="تجريبي في MVP" />
        <StatCard label="في التجربة" value="1" hint="Trial active" />
        <StatCard label="نشطين" value="1" hint="اشتراك active" />
        <StatCard label="إجمالي المبيعات" value="62,986.50 ر.س" hint="عبر المنصة" />
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
                <th className="p-3 text-right">المبيعات</th>
              </tr>
            </thead>
            <tbody>
              {platformTenants.map((tenant) => (
                <tr key={tenant.name} className="border-b border-ink/10">
                  <td className="p-3 font-bold">{tenant.name}</td>
                  <td className="p-3">{tenant.owner}</td>
                  <td className="p-3">{tenant.status}</td>
                  <td className="p-3">{tenant.plan}</td>
                  <td className="p-3">{tenant.branches}</td>
                  <td className="p-3">{tenant.devices}</td>
                  <td className="p-3">{tenant.users}</td>
                  <td className="p-3 font-bold">{tenant.sales}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </JaadShell>
  );
}
