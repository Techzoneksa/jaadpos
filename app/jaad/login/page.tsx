import Link from "next/link";
import { LogIn } from "lucide-react";
import { marketingUrl } from "@/lib/domains";

export default function JaadLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-5 py-10 text-white">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white p-6 text-ink shadow-soft">
        <Link href={marketingUrl("/")} className="text-sm font-bold text-date">لوحة جاد</Link>
        <h1 className="mt-4 text-3xl font-black">دخول فريق جاد</h1>
        <p className="mt-2 text-ink/60">هذا المدخل مخصص لفريق المنصة الداخلي فقط.</p>
        <form action="/api/auth/login" method="post" className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-bold">البريد الإلكتروني</span>
            <input name="email" type="email" required className="mt-2 w-full rounded-lg border-ink/10" placeholder="admin@jaadpos.com" />
          </label>
          <label className="block">
            <span className="text-sm font-bold">كلمة المرور</span>
            <input name="password" type="password" required className="mt-2 w-full rounded-lg border-ink/10" />
          </label>
          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 font-black text-white">
            <LogIn className="h-5 w-5" aria-hidden="true" />
            دخول
          </button>
        </form>
      </section>
    </main>
  );
}
