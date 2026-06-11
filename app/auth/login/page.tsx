import Link from "next/link";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-fog px-5 py-10">
      <section className="surface w-full max-w-md rounded-lg p-6">
        <Link href="/" className="text-sm font-bold text-mint">JAADPOS</Link>
        <h1 className="mt-4 text-3xl font-black">تسجيل الدخول</h1>
        <p className="mt-2 text-ink/60">ادخل إلى لوحة التحكم أو شاشة POS حسب صلاحيتك.</p>
        <form action="/api/auth/login" method="post" className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-bold">البريد الإلكتروني</span>
            <input name="email" type="email" required className="mt-2 w-full rounded-lg border-ink/10" placeholder="owner@example.com" />
          </label>
          <label className="block">
            <span className="text-sm font-bold">كلمة المرور</span>
            <input name="password" type="password" required className="mt-2 w-full rounded-lg border-ink/10" />
          </label>
          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-mint px-4 py-3 font-black text-white">
            <LogIn className="h-5 w-5" aria-hidden="true" />
            دخول
          </button>
        </form>
        <div className="mt-5 flex justify-between text-sm font-bold">
          <Link href="/auth/register" className="text-mint">حساب جديد</Link>
          <Link href="/auth/forgot-password" className="text-ink/60">نسيت كلمة المرور؟</Link>
        </div>
      </section>
    </main>
  );
}
