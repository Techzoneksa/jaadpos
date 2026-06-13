"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

type OnboardingFormProps = {
  defaults: {
    commercialName: string;
    legalName: string;
    vatNumber: string;
    commercialRegistration: string;
    city: string;
    address: string;
    phone: string;
  };
};

const inputClass = "mt-2 w-full rounded-lg border-ink/10";

export function OnboardingForm({ defaults }: OnboardingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form
      action="/api/onboarding/complete"
      method="post"
      className="mt-6 space-y-5"
      onSubmit={() => setIsSubmitting(true)}
    >
      <section className="surface rounded-lg p-6">
        <h2 className="text-xl font-black">بيانات المنشأة</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold">الاسم التجاري</span>
            <input name="commercialName" required defaultValue={defaults.commercialName} className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm font-bold">الاسم القانوني</span>
            <input name="legalName" defaultValue={defaults.legalName} placeholder="اختياري" className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm font-bold">الرقم الضريبي</span>
            <input name="vatNumber" defaultValue={defaults.vatNumber} placeholder="اختياري" className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm font-bold">السجل التجاري</span>
            <input name="commercialRegistration" defaultValue={defaults.commercialRegistration} placeholder="اختياري" className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm font-bold">المدينة</span>
            <input name="city" required defaultValue={defaults.city} className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm font-bold">العنوان</span>
            <input name="address" defaultValue={defaults.address} placeholder="اختياري" className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm font-bold">رقم الجوال</span>
            <input name="phone" type="tel" defaultValue={defaults.phone} placeholder="اختياري" className={inputClass} />
          </label>
        </div>
      </section>

      <section className="surface rounded-lg p-6">
        <h2 className="text-xl font-black">الفرع الأول</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold">اسم الفرع</span>
            <input name="branchName" required defaultValue="الفرع الرئيسي" className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm font-bold">المدينة</span>
            <input name="branchCity" defaultValue={defaults.city} placeholder="اختياري" className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm font-bold">العنوان</span>
            <input name="branchAddress" defaultValue={defaults.address} placeholder="اختياري" className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm font-bold">رقم التواصل</span>
            <input name="branchPhone" type="tel" defaultValue={defaults.phone} placeholder="اختياري" className={inputClass} />
          </label>
        </div>
      </section>

      <section className="surface rounded-lg p-6">
        <h2 className="text-xl font-black">إعدادات الفاتورة والضريبة</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold">نسبة الضريبة الافتراضية</span>
            <input value="15%" readOnly className={`${inputClass} bg-fog font-bold text-ink/70`} />
          </label>
          <label className="block">
            <span className="text-sm font-bold">هل الأسعار شاملة الضريبة؟</span>
            <select name="pricesIncludeTax" defaultValue="no" className={inputClass}>
              <option value="no">لا</option>
              <option value="yes">نعم</option>
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-bold">نص أسفل الفاتورة</span>
            <input name="footerText" placeholder="اختياري" className={inputClass} />
          </label>
        </div>
      </section>

      <section className="surface rounded-lg p-6">
        <h2 className="text-xl font-black">جهاز نقطة البيع</h2>
        <label className="mt-4 block">
          <span className="text-sm font-bold">اسم جهاز POS</span>
          <input name="posDeviceName" required defaultValue="الكاشير الرئيسي" className={inputClass} />
        </label>
      </section>

      <section className="surface rounded-lg p-6">
        <h2 className="text-xl font-black">المنتجات الأولية</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-lg border border-ink/10 bg-fog p-4 font-bold">
            <input name="createDemoProducts" type="radio" value="yes" defaultChecked className="text-mint" />
            إنشاء منتجات تجريبية
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-ink/10 bg-fog p-4 font-bold">
            <input name="createDemoProducts" type="radio" value="no" className="text-mint" />
            البدء بدون منتجات
          </label>
        </div>
        <p className="mt-4 rounded-lg bg-fog p-4 text-sm leading-7 text-ink/65">
          يمكنك تعديل بيانات المنشأة والفاتورة لاحقًا من الإعدادات.
        </p>
      </section>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-mint px-5 py-4 font-black text-white disabled:cursor-not-allowed disabled:bg-ink/30"
      >
        {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
        {isSubmitting ? "جارٍ إنهاء التهيئة..." : "إنهاء التهيئة والدخول للوحة التحكم"}
      </button>
    </form>
  );
}
