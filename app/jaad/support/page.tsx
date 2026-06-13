import { JaadShell } from "@/components/jaad-shell";
import { requirePlatformAccess } from "@/lib/platform-access";

export const dynamic = "force-dynamic";

export default async function JaadSupportPage() {
  await requirePlatformAccess();

  return (
    <JaadShell title="الدعم الداخلي">
      <section className="surface rounded-lg p-5">
        <h2 className="text-xl font-black">أدوات الدعم</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {["البحث عن Tenant", "مراجعة آخر الطلبات", "تمديد تجربة", "تغيير باقة", "تعطيل عميل", "ملاحظة دعم"].map((item) => (
            <div key={item} className="rounded-lg border border-ink/10 bg-fog p-4 text-right font-bold text-ink/65">
              {item}
            </div>
          ))}
        </div>
      </section>
    </JaadShell>
  );
}
