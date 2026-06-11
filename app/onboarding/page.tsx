import { CheckCircle2 } from "lucide-react";

const steps = [
  ["بيانات المنشأة", "الاسم التجاري، الاسم القانوني، الرقم الضريبي، السجل التجاري، المدينة، العنوان، الجوال، البريد."],
  ["إنشاء أول فرع", "اسم الفرع، المدينة، العنوان، رقم التواصل، وتحديد الفرع الرئيسي."],
  ["إعدادات الضريبة والفاتورة", "ضريبة 15%، شمول الضريبة، الرقم الضريبي، نص أسفل الفاتورة، وتفعيل QR."],
  ["أول كاشير", "إنشاء أو تأكيد مستخدم كاشير لبدء تشغيل POS."],
  ["المنتجات الأولية", "إضافة منتجات حقيقية أو استخدام منتجات تجريبية."]
];

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-fog px-5 py-10">
      <section className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-black">استكمال التهيئة</h1>
        <p className="mt-2 text-ink/60">تظهر هذه الصفحة تلقائيًا إذا كان onboarding غير مكتمل.</p>
        <div className="mt-6 space-y-3">
          {steps.map(([title, text], index) => (
            <div key={title} className="surface rounded-lg p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-mint text-sm font-black text-white">{index + 1}</span>
                <div>
                  <h2 className="font-black">{title}</h2>
                  <p className="mt-1 leading-7 text-ink/65">{text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-lg border border-date/30 bg-date/10 p-5 leading-7 text-date">
          <div className="mb-2 flex items-center gap-2 font-black">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            ملاحظة الفوترة الإلكترونية
          </div>
          JAADPOS في هذه النسخة يصدر فواتير ضريبية إلكترونية أساسية مع QR وحفظ وتقارير. الربط المباشر مع منصة فاتورة/ZATCA Phase 2 غير مفعل حاليًا، ويمكن توفيره لاحقًا كخدمة متقدمة حسب طلب العميل وحالة منشأته.
        </div>
      </section>
    </main>
  );
}
