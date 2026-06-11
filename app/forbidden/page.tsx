import Link from "next/link";
import { consoleUrl } from "@/lib/domains";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-fog px-5 py-10">
      <section className="surface max-w-lg rounded-lg p-6 text-center">
        <h1 className="text-3xl font-black">غير مصرح بالوصول</h1>
        <p className="mt-3 leading-7 text-ink/65">هذه الصفحة مخصصة لفريق جاد الداخلي فقط. حسابات العملاء تستخدم Customer Console.</p>
        <Link href={consoleUrl("/dashboard")} className="mt-5 inline-flex rounded-lg bg-mint px-5 py-3 font-black text-white">
          العودة إلى لوحة العميل
        </Link>
      </section>
    </main>
  );
}
