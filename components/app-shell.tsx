import Link from "next/link";
import { BarChart3, Boxes, Building2, Clock3, LayoutDashboard, ReceiptText, Settings, Store, Users } from "lucide-react";
import { requireTenantAccess, type TenantRole } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";

const navItems = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/pos", label: "POS", icon: Store },
  { href: "/products", label: "المنتجات", icon: Boxes },
  { href: "/orders", label: "الطلبات", icon: ReceiptText },
  { href: "/invoices", label: "الفواتير", icon: ReceiptText },
  { href: "/shifts", label: "الورديات", icon: Clock3 },
  { href: "/reports", label: "التقارير", icon: BarChart3 },
  { href: "/settings", label: "الإعدادات", icon: Settings },
  { href: "/users", label: "المستخدمون", icon: Users }
] as const;

const navByRole: Record<TenantRole, Array<(typeof navItems)[number]["href"]>> = {
  TENANT_OWNER: navItems.map((item) => item.href),
  BRANCH_MANAGER: ["/dashboard", "/pos", "/products", "/orders", "/invoices", "/shifts", "/reports"],
  CASHIER: ["/pos"],
  ACCOUNTANT: ["/invoices", "/reports"]
};

export async function AppShell({ title, children, allowedRoles }: { title: string; children: React.ReactNode; allowedRoles?: TenantRole[] }) {
  const session = await requireTenantAccess(allowedRoles);
  const role = session.role as TenantRole;
  const tenant = session.tenantId
    ? await prisma.tenant.findUnique({
        where: { id: session.tenantId },
        select: { name: true }
      })
    : null;
  const visibleNavItems = navItems.filter((item) => navByRole[role]?.includes(item.href));

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
          {visibleNavItems.map((item) => (
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
              {tenant?.name ?? "منشأة JAADPOS"}
            </div>
          </div>
        </header>
        <div className="px-5 py-6 lg:px-8">{children}</div>
      </section>
    </main>
  );
}
