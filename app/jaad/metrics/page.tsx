import { JaadShell } from "@/components/jaad-shell";
import { StatCard } from "@/components/stat-card";
import { requirePlatformAccess } from "@/lib/platform-access";

export const dynamic = "force-dynamic";

export default async function JaadMetricsPage() {
  await requirePlatformAccess();

  return (
    <JaadShell title="المؤشرات العامة">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="إجمالي الطلبات" value="1,286" hint="عبر المنصة" />
        <StatCard label="إجمالي المبيعات" value="62,986.50 ر.س" hint="تجريبي" />
        <StatCard label="أجهزة POS" value="11" hint="مسجلة" />
        <StatCard label="عملاء منتهية تجربتهم" value="0" hint="تحتاج متابعة" />
      </div>
    </JaadShell>
  );
}
