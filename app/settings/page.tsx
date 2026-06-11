import { AppShell } from "@/components/app-shell";

export default function SettingsPage() {
  return (
    <AppShell title="إعدادات المنشأة والضريبة والفاتورة">
      <div className="grid gap-5 xl:grid-cols-3">
        <section className="surface rounded-lg p-5">
          <h2 className="text-xl font-black">بيانات المنشأة</h2>
          <div className="mt-4 space-y-3 text-sm">
            {["الاسم التجاري", "الاسم القانوني", "الرقم الضريبي", "السجل التجاري", "العنوان", "المدينة", "الجوال", "البريد"].map((field) => (
              <label key={field} className="block">
                <span className="font-bold">{field}</span>
                <input className="mt-1 w-full rounded-lg border-ink/10" defaultValue={field === "الاسم التجاري" ? "مقهى جاد التجريبي" : ""} />
              </label>
            ))}
          </div>
        </section>
        <section className="surface rounded-lg p-5">
          <h2 className="text-xl font-black">إعدادات الفاتورة</h2>
          <div className="mt-4 space-y-3 text-sm">
            {["الشعار", "نص أسفل الفاتورة", "شكل رقم الفاتورة", "بادئة رقم الفاتورة"].map((field) => (
              <label key={field} className="block">
                <span className="font-bold">{field}</span>
                <input className="mt-1 w-full rounded-lg border-ink/10" />
              </label>
            ))}
            <label className="flex items-center gap-2 rounded-lg bg-fog p-3 font-bold">
              <input type="checkbox" defaultChecked className="rounded border-ink/20 text-mint" />
              تفعيل QR
            </label>
          </div>
        </section>
        <section className="surface rounded-lg p-5">
          <h2 className="text-xl font-black">الضريبة والفوترة الإلكترونية</h2>
          <div className="mt-4 space-y-3 text-sm">
            <label className="block">
              <span className="font-bold">نسبة الضريبة الافتراضية</span>
              <input className="mt-1 w-full rounded-lg border-ink/10" defaultValue="15%" />
            </label>
            <label className="flex items-center gap-2 rounded-lg bg-fog p-3 font-bold">
              <input type="checkbox" className="rounded border-ink/20 text-mint" />
              الأسعار شاملة الضريبة
            </label>
            <div className="rounded-lg bg-fog p-4">
              <p className="font-black">وضع الفوترة الحالي: Basic QR E-Invoice</p>
              <p className="mt-2 text-ink/65">حالة الربط مع منصة فاتورة/ZATCA: غير مفعل</p>
            </div>
            <p className="rounded-lg bg-date/10 p-4 leading-7 text-date">الربط المباشر مع منصة فاتورة/ZATCA Phase 2 غير مفعل في هذه النسخة. يمكن إضافته لاحقًا كخدمة متقدمة حسب طلب العميل.</p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
