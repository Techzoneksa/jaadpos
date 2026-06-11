import Link from "next/link";
import { BarChart3, Headphones, Landmark, LineChart, ListChecks, Users } from "lucide-react";

const navItems = [
  { href: "/jaad", label: "نظرة عامة", icon: LineChart },
  { href: "/jaad/tenants", label: "العملاء", icon: Users },
  { href: "/jaad/subscriptions", label: "الاشتراكات", icon: ListChecks },
  { href: "/jaad/plans", label: "الباقات", icon: Landmark },
  { href: "/jaad/metrics", label: "المؤشرات", icon: BarChart3 },
  { href: "/jaad/support", label: "الدعم الداخلي", icon: Headphones }
] as const;

export function JaadShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-fog">
      <aside className="fixed inset-y-0 right-0 hidden w-64 border-l border-ink/10 bg-ink px-4 py-6 text-white lg:block">
        <Link href="/jaad" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-date text-lg font-black text-ink">J</span>
          <span>
            <strong className="block text-lg">لوحة جاد</strong>
            <span className="text-xs text-white/55">Platform Dashboard</span>
          </span>
        </Link>
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-white/72 hover:bg-white/10 hover:text-white">
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="lg:pr-64">
        <header className="border-b border-ink/10 bg-white px-5 py-4 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-date">JAAD Internal</p>
          <h1 className="text-2xl font-bold text-ink">{title}</h1>
        </header>
        <div className="px-5 py-6 lg:px-8">{children}</div>
      </section>
    </main>
  );
}
