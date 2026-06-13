import { Download } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requireTenantAccess } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";

const money = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR"
});

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const session = await requireTenantAccess(["TENANT_OWNER", "BRANCH_MANAGER", "ACCOUNTANT"]);
  const [paidOrders, refunds, invoiceCount] = await Promise.all([
    prisma.order.aggregate({
      where: { tenantId: session.tenantId!, status: "PAID" },
      _sum: { subtotal: true, taxTotal: true, total: true },
      _count: { _all: true }
    }),
    prisma.refund.aggregate({
      where: { tenantId: session.tenantId! },
      _sum: { amount: true, taxAmount: true },
      _count: { _all: true }
    }),
    prisma.invoice.count({ where: { tenantId: session.tenantId! } })
  ]);

  const subtotal = Number(paidOrders._sum.subtotal ?? 0);
  const tax = Number(paidOrders._sum.taxTotal ?? 0);
  const total = Number(paidOrders._sum.total ?? 0);
  const refundTotal = Number(refunds._sum.amount ?? 0);
  const refundTax = Number(refunds._sum.taxAmount ?? 0);
  const netTax = Math.max(0, tax - refundTax);
  const reportRows = [
    { name: "إجمالي المبيعات", total: money.format(total), change: `${paidOrders._count._all} طلب` },
    { name: "الفواتير", total: String(invoiceCount), change: "Basic QR" },
    { name: "المرتجعات", total: money.format(refundTotal), change: `${refunds._count._all} عملية` },
    { name: "صافي VAT", total: money.format(netTax), change: "بعد المرتجعات" }
  ];

  return (
    <AppShell title="التقارير" allowedRoles={["TENANT_OWNER", "BRANCH_MANAGER", "ACCOUNTANT"]}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {reportRows.map((report) => (
          <div key={report.name} className="surface rounded-lg p-5">
            <p className="text-sm text-ink/60">{report.name}</p>
            <p className="mt-2 text-2xl font-black">{report.total}</p>
            <p className="mt-1 text-sm text-mint">{report.change}</p>
            <button
              type="button"
              disabled
              className="mt-4 flex cursor-not-allowed items-center gap-2 rounded-lg border border-ink/10 px-3 py-2 text-sm font-bold text-ink/45"
              title="هذه الميزة غير متاحة في هذه المرحلة."
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              CSV غير متاح
            </button>
          </div>
        ))}
      </div>
      <section className="surface mt-5 rounded-lg p-5">
        <h2 className="text-xl font-black">تقرير VAT</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          {[
            ["قبل الضريبة", money.format(subtotal)],
            ["الضريبة", money.format(tax)],
            ["شامل الضريبة", money.format(total)],
            ["المرتجعات", money.format(refundTotal)],
            ["صافي الضريبة", money.format(netTax)]
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-fog p-4">
              <p className="text-sm text-ink/60">{label}</p>
              <p className="mt-2 font-black">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 rounded-lg bg-sea/10 p-4 leading-7 text-sea">هذا التقرير يساعد المحاسب في مراجعة المبيعات والضريبة قبل تقديم الإقرار عبر القنوات الرسمية.</p>
      </section>
    </AppShell>
  );
}
