import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-fog px-5 py-10">
      <section className="surface w-full max-w-md rounded-lg p-6">
        <Link href="/" className="text-sm font-bold text-mint">JAADPOS</Link>
        <h1 className="mt-4 text-3xl font-black">استعادة كلمة المرور</h1>
        <p className="mt-2 leading-7 text-ink/60">واجهة الاستعادة موجودة في MVP، وإرسال البريد الفعلي يمكن ربطه لاحقًا بخدمة بريد على Hostinger أو مزود خارجي.</p>
        <form className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-bold">البريد الإلكتروني</span>
            <input type="email" className="mt-2 w-full rounded-lg border-ink/10" />
          </label>
          <button type="button" disabled className="w-full cursor-not-allowed rounded-lg bg-ink/30 px-4 py-3 font-black text-white">استعادة كلمة المرور غير متاحة</button>
          <p className="mt-3 text-center text-sm font-bold text-date">هذه الميزة غير متاحة في هذه المرحلة.</p>
        </form>
      </section>
    </main>
  );
}
