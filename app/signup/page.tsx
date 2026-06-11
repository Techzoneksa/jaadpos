import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { marketingUrl } from "@/lib/domains";
import { plans } from "@/lib/plans";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-fog px-5 py-10">
      <section className="mx-auto max-w-4xl">
        <Link href={marketingUrl("/")} className="text-sm font-bold text-mint">JAADPOS</Link>
        <div className="surface mt-5 rounded-lg p-6">
          <h1 className="text-3xl font-black">ابدأ التجربة المجانية</h1>
          <p className="mt-2 text-ink/60">يتم إنشاء حساب عميل جديد على console.jaadsa.com مع Trial لمدة 14 يوم.</p>
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
              <span className="text-sm font-bold">اسم المنشأة</span>
              <input name="tenantName" required className="mt-2 w-full rounded-lg border-ink/10" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-bold">الباقة</span>
              <select name="plan" defaultValue="growth" className="mt-2 w-full rounded-lg border-ink/10">
                {plans.map((plan) => (
                  <option key={plan.code} value={plan.code}>
                    {plan.name} - {plan.priceLabel}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="flex items-center justify-center gap-2 rounded-lg bg-mint px-4 py-3 font-black text-white md:col-span-2">
              إنشاء الحساب
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
