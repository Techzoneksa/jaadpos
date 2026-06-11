import Link from "next/link";
import { BarChart3, Building2, LayoutDashboard, ReceiptText, Settings, ShieldCheck, Store } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/pos", label: "POS", icon: Store },
  { href: "/orders", label: "الطلبات", icon: ReceiptText },
  { href: "/reports", label: "التقارير", icon: BarChart3 },
  { href: "/settings", label: "الإعدادات", icon: Settings },
  { href: "/admin", label: "إدارة المنصة", icon: ShieldCheck }
] as const;

export function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-fog">
      <aside className="fixed inset-y-0 right-0 hidden w-64 border-l border-ink/10 bg-white px-4 py-6 lg:block">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-mint text-lg font-black text-white">J</span>
          <span>
            <strong className="block text-lg">JAADPOS</strong>
            <span className="text-xs text-ink/55">SaaS Online POS</span>
          </span>
        </Link>
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-ink/70 hover:bg-fog hover:text-ink">
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <section className="lg:pr-64">
        <header className="border-b border-ink/10 bg-white px-5 py-4 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint">JAADPOS MVP</p>
              <h1 className="text-2xl font-bold text-ink">{title}</h1>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-ink/10 bg-fog px-3 py-2 text-sm text-ink/70">
              <Building2 className="h-4 w-4 text-mint" aria-hidden="true" />
              مقهى جاد التجريبي
            </div>
          </div>
        </header>
        <div className="px-5 py-6 lg:px-8">{children}</div>
      </section>
    </main>
  );
}
