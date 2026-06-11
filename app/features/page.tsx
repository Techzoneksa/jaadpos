import Link from "next/link";
import { BarChart3, QrCode, Store, Users } from "lucide-react";
import { consoleUrl } from "@/lib/domains";

const features = [
  ["POS سريع", "واجهة بيع عملية للمطاعم والكافيهات.", Store],
  ["فواتير أساسية مع QR", "إصدار وحفظ فواتير ضريبية داخل النظام.", QrCode],
  ["تقارير VAT", "تقارير تساعد المحاسب في المراجعة.", BarChart3],
  ["Multi-Tenant", "عزل بيانات كل منشأة منذ البداية.", Users]
] as const;

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-fog px-5 py-10">
      <section className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-bold text-mint">JAADPOS</Link>
        <h1 className="mt-5 text-4xl font-black">المزايا</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {features.map(([title, text, Icon]) => (
            <div key={title} className="surface rounded-lg p-5">
              <Icon className="h-6 w-6 text-mint" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-black">{title}</h2>
              <p className="mt-2 leading-7 text-ink/65">{text}</p>
            </div>
          ))}
        </div>
        <Link href={consoleUrl("/signup")} className="mt-8 inline-flex rounded-lg bg-mint px-5 py-3 font-black text-white">ابدأ التجربة المجانية</Link>
      </section>
    </main>
  );
}
