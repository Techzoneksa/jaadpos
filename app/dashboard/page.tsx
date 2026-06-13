import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { getTenantPlanUsage } from "@/lib/plan-limits";
import { requireTenantAccess } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";
import { daysRemaining } from "@/lib/subscription";

type DashboardPageProps = {
  searchParams: Promise<{
    onboarded?: string;
  }>;
};

const money = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR"
});

const subscriptionLabels = {
  TRIAL: "تجربة",
  ACTIVE: "نشط",
  EXPIRED: "منتهي",
  CANCELLED: "ملغي",
  PAST_DUE: "متأخر"
} as const;

const orderTypeLabels = {
  DINE_IN: "داخل المحل",
  TAKEAWAY: "سفري",
  DELIVERY: "توصيل"
} as const;

const paymentLabels = {
  CASH: "نقدي",
  MADA: "مدى",
  VISA_MASTERCARD: "Visa/Mastercard",
  APPLE_PAY: "Apple Pay"
} as const;

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const session = await requireTenantAccess(["TENANT_OWNER", "BRANCH_MANAGER"]);
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId! },
    include: {
      plan: true,
      subscription: true,
      orders: {
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          invoice: true,
          payments: true,
          cashier: { select: { name: true } }
        }
      }
    }
  });

  const [todayOrders, refunds, invoiceCount, planUsage] = await Promise.all([
    prisma.order.aggregate({
      where: { tenantId: session.tenantId!, status: "PAID", createdAt: { gte: startOfDay } },
      _sum: { total: true, taxTotal: true },
      _count: { _all: true }
    }),
    prisma.refund.aggregate({
      where: { tenantId: session.tenantId!, createdAt: { gte: startOfDay } },
      _sum: { amount: true, taxAmount: true },
      _count: { _all: true }
    }),
    prisma.invoice.count({ where: { tenantId: session.tenantId!, issuedAt: { gte: startOfDay } } }),
    getTenantPlanUsage(session.tenantId!)
  ]);

  const totalSales = Number(todayOrders._sum.total ?? 0);
  const totalTax = Number(todayOrders._sum.taxTotal ?? 0);
  const refundTotal = Number(refunds._sum.amount ?? 0);
  const netSales = Math.max(0, totalSales - refundTotal);
  const trialDaysLeft = tenant?.subscription ? daysRemaining(tenant.subscription.trialEndsAt) : 0;
  const isTrialNearEnd = tenant?.subscription?.status === "TRIAL" && trialDaysLeft <= 3;

  const metrics = [
    { label: "مبيعات اليوم", value: money.format(totalSales), hint: `${todayOrders._count._all} طلب مدفوع` },
    { label: "الفواتير اليوم", value: String(invoiceCount), hint: "فواتير محفوظة" },
    { label: "ضريبة اليوم", value: money.format(totalTax), hint: "حسب إعدادات الفاتورة" },
    { label: "صافي اليوم", value: money.format(netSales), hint: `${refunds._count._all} مرتجع` }
  ];

  return (
    <AppShell title="لوحة التحكم" allowedRoles={["TENANT_OWNER", "BRANCH_MANAGER"]}>
      {params.onboarded === "1" && (
        <div className="mb-5 rounded-lg border border-mint/20 bg-mint/10 p-4 font-bold text-mint">
          تم تجهيز حسابك بنجاح. يمكنك الآن البدء من لوحة التحكم.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="surface rounded-lg p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">آخر الطلبات</h2>
            {tenant?.subscription && (
              <span className="rounded-full bg-mint/10 px-3 py-1 text-sm font-bold text-mint">
                {subscriptionLabels[tenant.subscription.status]}: {trialDaysLeft} يوم متبقي
              </span>
            )}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[780px] text-sm">
              <thead className="bg-fog text-ink/60">
                <tr>
                  <th className="p-3 text-right">رقم الطلب</th>
                  <th className="p-3 text-right">الفاتورة</th>
                  <th className="p-3 text-right">الكاشير</th>
                  <th className="p-3 text-right">النوع</th>
                  <th className="p-3 text-right">الدفع</th>
                  <th className="p-3 text-right">الإجمالي</th>
                  <th className="p-3 text-right">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {tenant?.orders.length ? (
                  tenant.orders.map((order) => (
                    <tr key={order.id} className="border-b border-ink/10">
                      <td className="p-3 font-bold">
                        <Link href={`/orders/${order.id}`} className="text-mint">{order.orderNumber}</Link>
                      </td>
                      <td className="p-3">
                        {order.invoice ? <Link href={`/invoices/${order.invoice.id}`} className="font-bold text-mint">{order.invoice.invoiceNumber}</Link> : "-"}
                      </td>
                      <td className="p-3">{order.cashier.name}</td>
                      <td className="p-3">{orderTypeLabels[order.orderType]}</td>
                      <td className="p-3">{order.payments[0] ? paymentLabels[order.payments[0].method] : "-"}</td>
                      <td className="p-3 font-bold">{money.format(Number(order.total))}</td>
                      <td className="p-3">{order.status === "PAID" ? "مدفوع" : order.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-5 text-center text-ink/55" colSpan={7}>لا توجد طلبات بعد.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="surface rounded-lg p-5">
          <h2 className="text-xl font-black">حالة الاشتراك</h2>
          <div className="mt-4 rounded-lg bg-fog p-4">
            <p className="text-sm text-ink/60">الباقة الحالية</p>
            <p className="mt-1 text-2xl font-black">{tenant?.plan.nameEnglish ?? "-"}</p>
            <p className="mt-3 text-sm leading-7 text-ink/65">
              الفروع: {planUsage.usage.branches}/{planUsage.limits.branches} · الأجهزة: {planUsage.usage.posDevices}/{planUsage.limits.posDevices} · المستخدمون: {planUsage.usage.users}/{planUsage.limits.users} · المنتجات: {planUsage.usage.products}/{planUsage.limits.products}
            </p>
          </div>
          <div className="mt-4 rounded-lg border border-mint/20 bg-mint/10 p-4 text-sm leading-7 text-mint">
            الحالة: {tenant?.subscription ? subscriptionLabels[tenant.subscription.status] : "-"} · الأيام المتبقية: {trialDaysLeft}
          </div>
          {isTrialNearEnd && (
            <div className="mt-4 rounded-lg border border-date/30 bg-date/10 p-4 text-sm leading-7 text-date">
              التجربة المجانية أوشكت على الانتهاء. يرجى التواصل مع فريق جاد لتفعيل الاشتراك.
            </div>
          )}
        </aside>
      </div>
    </AppShell>
  );
}
