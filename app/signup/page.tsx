import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { marketingUrl } from "@/lib/domains";
import { getPlanFromString, plans } from "@/lib/plans";

type SignupPageProps = {
  searchParams: Promise<{
    plan?: string;
    error?: string;
  }>;
};

const errorMessages = {
  invalid: "تأكد من تعبئة البيانات المطلوبة والموافقة على الشروط.",
  email_exists: "هذا البريد مسجل مسبقًا. يمكنك تسجيل الدخول أو استخدام بريد آخر.",
  unavailable: "تعذر إنشاء الحساب حاليًا. حاول مرة أخرى بعد قليل."
} as const;

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const selectedPlan = getPlanFromString(params.plan);
  const errorMessage = params.error ? errorMessages[params.error as keyof typeof errorMessages] : null;

  return (
    <main className="min-h-screen bg-fog px-5 py-10">
      <section className="mx-auto max-w-5xl">
        <Link href={marketingUrl("/")} className="text-sm font-bold text-mint">JAADPOS</Link>
        <div className="surface mt-5 rounded-lg p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div>
              <h1 className="text-3xl font-black">ابدأ التجربة المجانية</h1>
              <p className="mt-2 leading-7 text-ink/60">
                أنشئ حساب منشأتك، واحصل على تجربة 14 يومًا بدون بوابة دفع. التفعيل بعد التجربة يتم يدويًا من فريق جاد.
              </p>
            </div>
            <aside className="rounded-lg border border-mint/20 bg-mint/5 p-4">
              <p className="text-sm font-bold text-mint">الباقة المختارة</p>
              <h2 className="mt-2 text-2xl font-black">{selectedPlan.name}</h2>
              <p className="mt-1 text-sm leading-6 text-ink/65">{selectedPlan.priceLabel}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-bold">
                <span className="rounded-md bg-white p-2">{selectedPlan.limits.branches} فروع</span>
                <span className="rounded-md bg-white p-2">{selectedPlan.limits.posDevices} أجهزة</span>
                <span className="rounded-md bg-white p-2">{selectedPlan.limits.users} مستخدم</span>
              </div>
            </aside>
          </div>

          {errorMessage && <p className="mt-5 rounded-lg bg-date/10 p-4 text-sm font-bold text-date">{errorMessage}</p>}

          <form action="/api/auth/register" method="post" className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold">اسم مالك الحساب</span>
              <input name="ownerName" required className="mt-2 w-full rounded-lg border-ink/10" />
            </label>
            <label className="block">
              <span className="text-sm font-bold">البريد الإلكتروني</span>
              <input name="email" type="email" required className="mt-2 w-full rounded-lg border-ink/10" />
            </label>
            <label className="block">
              <span className="text-sm font-bold">كلمة المرور</span>
              <input name="password" type="password" minLength={8} required className="mt-2 w-full rounded-lg border-ink/10" />
            </label>
            <label className="block">
              <span className="text-sm font-bold">اسم المنشأة التجاري</span>
              <input name="tenantName" required className="mt-2 w-full rounded-lg border-ink/10" />
            </label>
            <label className="block">
              <span className="text-sm font-bold">رقم الجوال</span>
              <input name="phone" type="tel" required className="mt-2 w-full rounded-lg border-ink/10" placeholder="+9665xxxxxxxx" />
            </label>
            <label className="block">
              <span className="text-sm font-bold">الباقة</span>
              <select name="plan" defaultValue={selectedPlan.code} className="mt-2 w-full rounded-lg border-ink/10">
                {plans.map((plan) => (
                  <option key={plan.code} value={plan.code}>
                    {plan.name} - {plan.priceLabel}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-start gap-3 rounded-lg border border-ink/10 bg-fog p-4 text-sm font-bold leading-7 md:col-span-2">
              <input name="terms" value="accepted" type="checkbox" required className="mt-1 rounded border-ink/20 text-mint" />
              أوافق على بدء تجربة مجانية لمدة 14 يومًا، وأفهم أن الربط المباشر مع منصة فاتورة/ZATCA Phase 2 وخدمات الدفع ليست مفعلة في هذه المرحلة.
            </label>

            <div className="rounded-lg bg-white p-4 text-sm leading-7 text-ink/65 md:col-span-2">
              <div className="mb-2 flex items-center gap-2 font-black text-mint">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                بعد إنشاء الحساب
              </div>
              سيتم تحويلك إلى التهيئة لإضافة بيانات المنشأة والفرع الأول وجهاز POS والمنتجات التجريبية عند اختيارها.
            </div>

            <button type="submit" className="flex items-center justify-center gap-2 rounded-lg bg-mint px-4 py-3 font-black text-white md:col-span-2">
              إنشاء الحساب وبدء التجربة
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
