import Link from "next/link";
import { consoleUrl } from "@/lib/domains";

const faqs = [
  ["هل توجد تجربة مجانية؟", "نعم، Trial لمدة 14 يوم لكل منشأة جديدة."],
  ["هل الفواتير الأساسية متاحة؟", "نعم. يمكن إصدار فواتير ضريبية إلكترونية أساسية مع QR داخل النظام."],
  ["هل يعمل النظام بدون إنترنت؟", "لا في هذه النسخة. سيتم دعم وضع عدم الاتصال لاحقًا."],
  ["أين يدخل العملاء؟", "كل العملاء يستخدمون Customer Console فقط."]
];

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-fog px-5 py-10">
      <section className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-bold text-mint">JAADPOS</Link>
        <h1 className="mt-5 text-4xl font-black">الأسئلة الشائعة</h1>
        <div className="mt-8 divide-y divide-ink/10 rounded-lg border border-ink/10 bg-white">
          {faqs.map(([question, answer]) => (
            <div key={question} className="p-5">
              <h2 className="font-black">{question}</h2>
              <p className="mt-2 leading-7 text-ink/65">{answer}</p>
            </div>
          ))}
        </div>
        <Link href={consoleUrl("/login")} className="mt-8 inline-flex rounded-lg border border-ink/10 bg-white px-5 py-3 font-black">تسجيل الدخول</Link>
      </section>
    </main>
  );
}
