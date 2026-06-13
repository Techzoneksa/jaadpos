import Link from "next/link";
import { consoleUrl } from "@/lib/domains";
import { plans } from "@/lib/plans";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-fog px-5 py-10">
      <section className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-bold text-mint">JAADPOS</Link>
        <h1 className="mt-5 text-4xl font-black">الباقات</h1>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.code} className="surface rounded-lg p-6">
              <h2 className="text-2xl font-black">{plan.name}</h2>
              <p className="mt-2 text-ink/60">{plan.priceLabel}</p>
              <div className="mt-5 grid grid-cols-2 gap-2 text-center text-sm">
                <span className="rounded-lg bg-fog p-3">{plan.limits.branches} فروع</span>
                <span className="rounded-lg bg-fog p-3">{plan.limits.posDevices} أجهزة</span>
                <span className="rounded-lg bg-fog p-3">{plan.limits.users} مستخدم</span>
                <span className="rounded-lg bg-fog p-3">{plan.limits.products} منتج</span>
              </div>
              <Link href={consoleUrl(`/signup?plan=${plan.code}`)} className="mt-5 inline-flex w-full justify-center rounded-lg bg-mint px-5 py-3 font-black text-white">
                ابدأ تجربة {plan.name}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
