import Link from "next/link";
import { ArrowLeft, BarChart3, CheckCircle2, Clock3, QrCode, ReceiptText, Store, Users } from "lucide-react";
import { MarketingVisual } from "@/components/marketing-visual";
import { consoleUrl } from "@/lib/domains";
import { plans } from "@/lib/plans";

const features = [
  { title: "POS سريع", text: "واجهة بيع مختصرة للكاشير مع سلة واضحة وطرق دفع متعددة.", icon: Store },
  { title: "فواتير ضريبية أساسية مع QR", text: "إصدار وحفظ فواتير داخل النظام مع QR وتقارير واضحة.", icon: QrCode },
  { title: "تقارير يومية وVAT", text: "مبيعات، ضريبة، طرق دفع، مرتجعات، ورديات، ومنتجات أكثر مبيعًا.", icon: BarChart3 },
  { title: "فروع وكاشيرات", text: "Multi-Tenant من البداية مع عزل بيانات كل منشأة وصلاحيات حسب الدور.", icon: Users },
  { title: "مرتجعات وورديات", text: "فتح وإغلاق ورديات وربط كل طلب وفاتورة بسجل مالي واضح.", icon: ReceiptText },
  { title: "تجربة مجانية 14 يوم", text: "اشتراك داخلي قابل للترقية اليدوية وربطه لاحقًا ببوابة دفع.", icon: Clock3 }
];

const faqs = [
  ["هل الفواتير الأساسية متاحة؟", "نعم. يمكنك إصدار فواتير ضريبية إلكترونية أساسية مع QR داخل النظام."],
  ["هل يعمل بدون إنترنت؟", "لا في MVP. يتطلب النظام اتصالًا بالإنترنت، وتم تجهيز البنية لإضافة Offline لاحقًا."],
  ["هل الدفع الحقيقي موجود الآن؟", "الدفع الحقيقي خارج نطاق MVP، لكن منطق الاشتراك والباقات جاهز للربط لاحقًا."],
  ["هل البيانات معزولة بين العملاء؟", "نعم. التصميم يعتمد tenantId في الجداول التشغيلية وطبقات الاستعلام والصلاحيات."]
];

export default function Home() {
  return (
    <main className="bg-fog">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-mint text-lg font-black text-white">J</span>
            <span>
              <strong className="block text-lg">JAADPOS</strong>
              <span className="text-xs text-ink/55">للمطاعم والكافيهات</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-bold text-ink/65 md:flex">
            <a href="#features">المزايا</a>
            <a href="#plans">الباقات</a>
            <a href="#faq">الأسئلة</a>
          </nav>
          <Link href={consoleUrl("/login")} className="rounded-lg border border-ink/10 px-4 py-2 text-sm font-bold">
            تسجيل الدخول
          </Link>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-78px)] max-w-7xl items-center gap-10 px-5 py-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <p className="mb-4 inline-flex rounded-full bg-mint/10 px-4 py-2 text-sm font-bold text-mint">تجربة مجانية 14 يوم · Online POS</p>
          <h1 className="text-4xl font-black leading-tight text-ink md:text-6xl">JAADPOS — نظام نقاط بيع سحابي للمطاعم والكافيهات</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/70">كاشير، فواتير ضريبية، QR، ورديات، تقارير، وفروع في منصة واحدة.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={consoleUrl("/signup?plan=growth")} className="inline-flex items-center gap-2 rounded-lg bg-mint px-5 py-3 font-black text-white">
              ابدأ التجربة المجانية
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link href={consoleUrl("/dashboard")} className="rounded-lg border border-ink/10 bg-white px-5 py-3 font-black">
              عرض تجربة النظام
            </Link>
          </div>
          <p className="mt-5 text-sm text-ink/55">الفوترة الإلكترونية الأساسية مع QR مفعلة داخل النظام.</p>
        </div>
        <MarketingVisual />
      </section>

      <section id="features" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="max-w-2xl">
            <p className="font-bold text-mint">المزايا</p>
            <h2 className="mt-2 text-3xl font-black">أساس MVP تجاري لأول 20 عميل SaaS</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-lg border border-ink/10 bg-fog p-5">
                <feature.icon className="h-6 w-6 text-mint" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-black">{feature.title}</h3>
                <p className="mt-2 leading-7 text-ink/65">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="plans" className="py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="max-w-2xl">
            <p className="font-bold text-sea">الباقات</p>
            <h2 className="mt-2 text-3xl font-black">حدود واضحة للفروع والأجهزة والمستخدمين</h2>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.code} className="surface rounded-lg p-6">
                <h3 className="text-2xl font-black">{plan.name}</h3>
                <p className="mt-2 text-ink/60">{plan.priceLabel}</p>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center text-sm">
                  <span className="rounded-lg bg-fog p-3">{plan.limits.branches} فروع</span>
                  <span className="rounded-lg bg-fog p-3">{plan.limits.posDevices} أجهزة</span>
                  <span className="rounded-lg bg-fog p-3">{plan.limits.users} مستخدم</span>
                </div>
                <ul className="mt-5 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-ink/70">
                      <CheckCircle2 className="h-4 w-4 text-mint" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href={consoleUrl(`/signup?plan=${plan.code}`)} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-mint px-4 py-3 font-black text-white">
                  ابدأ تجربة {plan.name}
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-5">
          <h2 className="text-3xl font-black">أسئلة شائعة</h2>
          <div className="mt-6 divide-y divide-ink/10 rounded-lg border border-ink/10">
            {faqs.map(([question, answer]) => (
              <div key={question} className="p-5">
                <h3 className="font-black">{question}</h3>
                <p className="mt-2 leading-7 text-ink/65">{answer}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={consoleUrl("/signup?plan=growth")} className="rounded-lg bg-mint px-5 py-3 font-black text-white">
              ابدأ التجربة المجانية
            </Link>
            <Link href={consoleUrl("/login")} className="rounded-lg border border-ink/10 px-5 py-3 font-black">
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
