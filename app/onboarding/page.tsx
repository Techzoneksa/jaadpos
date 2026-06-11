import { CheckCircle2 } from "lucide-react";
import { requireTenantAccess } from "@/lib/platform-access";

const steps = ["بيانات المنشأة", "أول فرع", "الضريبة والفاتورة", "أول جهاز POS", "منتجات تجريبية"];

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  await requireTenantAccess(["TENANT_OWNER"]);

  return (
    <main className="min-h-screen bg-fog px-5 py-10">
      <section className="mx-auto max-w-5xl">
        <p className="text-sm font-bold text-mint">Customer Console</p>
        <h1 className="mt-2 text-3xl font-black">استكمال تهيئة JAADPOS</h1>
        <p className="mt-2 max-w-3xl leading-7 text-ink/65">
          هذه الخطوة تجهز منشأتك للديمو العملي: بيانات المنشأة، الفرع الرئيسي، إعدادات الضريبة، جهاز POS، ومنتجات تجريبية.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-5">
          {steps.map((step, index) => (
            <div key={step} className="rounded-lg border border-ink/10 bg-white p-3 text-sm font-bold">
              <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-md bg-mint text-white">{index + 1}</span>
              {step}
            </div>
          ))}
        </div>

        <form action="/api/onboarding/complete" method="post" className="surface mt-6 grid gap-4 rounded-lg p-6 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold">الاسم التجاري</span>
            <input name="commercialName" required defaultValue="مقهى جاد التجريبي" className="mt-2 w-full rounded-lg border-ink/10" />
          </label>
          <label className="block">
            <span className="text-sm font-bold">الاسم القانوني</span>
            <input name="legalName" defaultValue="شركة مقهى جاد للتغذية" className="mt-2 w-full rounded-lg border-ink/10" />
          </label>
          <label className="block">
            <span className="text-sm font-bold">الرقم الضريبي</span>
            <input name="vatNumber" required defaultValue="300000000000003" className="mt-2 w-full rounded-lg border-ink/10" />
          </label>
          <label className="block">
            <span className="text-sm font-bold">اسم الفرع الرئيسي</span>
            <input name="branchName" required defaultValue="الفرع الرئيسي" className="mt-2 w-full rounded-lg border-ink/10" />
          </label>
          <label className="block">
            <span className="text-sm font-bold">المدينة</span>
            <input name="city" required defaultValue="الرياض" className="mt-2 w-full rounded-lg border-ink/10" />
          </label>
          <label className="block">
            <span className="text-sm font-bold">العنوان</span>
            <input name="address" required defaultValue="طريق الملك فهد" className="mt-2 w-full rounded-lg border-ink/10" />
          </label>
          <label className="block">
            <span className="text-sm font-bold">الجوال</span>
            <input name="phone" required defaultValue="+966500000000" className="mt-2 w-full rounded-lg border-ink/10" />
          </label>
          <label className="block">
            <span className="text-sm font-bold">البريد الإلكتروني</span>
            <input name="email" type="email" required defaultValue="owner@jaadpos.com" className="mt-2 w-full rounded-lg border-ink/10" />
          </label>
          <label className="block">
            <span className="text-sm font-bold">هل الأسعار شاملة الضريبة؟</span>
            <select name="pricesIncludeTax" defaultValue="no" className="mt-2 w-full rounded-lg border-ink/10">
              <option value="no">لا، أضف ضريبة 15%</option>
              <option value="yes">نعم، الأسعار شاملة الضريبة</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-bold">نص أسفل الفاتورة</span>
            <input name="footerText" defaultValue="شكرًا لزيارتكم" className="mt-2 w-full rounded-lg border-ink/10" />
          </label>

          <div className="rounded-lg border border-date/30 bg-date/10 p-4 text-sm leading-7 text-date md:col-span-2">
            <div className="mb-2 flex items-center gap-2 font-black">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              ملاحظة الفوترة الإلكترونية
            </div>
            فواتير ضريبية إلكترونية أساسية مع QR. الربط المباشر مع منصة فاتورة/ZATCA Phase 2 خدمة متقدمة لاحقًا.
          </div>

          <button type="submit" className="rounded-lg bg-mint px-5 py-3 font-black text-white md:col-span-2">
            إنهاء التهيئة والدخول إلى لوحة التحكم
          </button>
        </form>
      </section>
    </main>
  );
}
