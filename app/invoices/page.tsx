import Link from "next/link";
import { Eye, Printer, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requireTenantAccess } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";

type InvoicesPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const money = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR"
});

const paymentLabels = {
  CASH: "نقدي",
  MADA: "مدى",
  VISA_MASTERCARD: "Visa/Mastercard",
  APPLE_PAY: "Apple Pay"
} as const;

const invoiceStatusLabels = {
  PAID: "مدفوعة",
  PARTIALLY_REFUNDED: "مرتجع جزئي",
  REFUNDED: "مرتجع بالكامل",
  VOIDED: "ملغاة"
} as const;

const allowedStatuses = new Set(Object.keys(invoiceStatusLabels));

export const dynamic = "force-dynamic";

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const params = await searchParams;
  const session = await requireTenantAccess(["TENANT_OWNER", "BRANCH_MANAGER", "CASHIER", "ACCOUNTANT"]);
  const currentUser = await prisma.user.findFirst({
    where: { id: session.userId, tenantId: session.tenantId! },
    select: { branchId: true }
  });
  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId: session.tenantId!,
      ...(params.status && allowedStatuses.has(params.status) ? { invoiceStatus: params.status as keyof typeof invoiceStatusLabels } : {}),
      ...(session.role === "CASHIER" ? { order: { cashierId: session.userId } } : {}),
      ...(session.role === "BRANCH_MANAGER" && currentUser?.branchId ? { order: { branchId: currentUser.branchId } } : {})
    },
    orderBy: { issuedAt: "desc" },
    take: 100,
    include: {
      refunds: true,
      order: {
        include: {
          payments: true,
          branch: { select: { name: true } }
        }
      }
    }
  });

  return (
    <AppShell title="الفواتير" allowedRoles={["TENANT_OWNER", "BRANCH_MANAGER", "CASHIER", "ACCOUNTANT"]}>
      <section className="surface rounded-lg p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">الفواتير المحفوظة</h2>
            <p className="mt-1 text-sm text-ink/60">اعرض الفواتير الفعلية، اطبع الإيصال، أو أنشئ مرتجعًا كاملًا عند السماح.</p>
          </div>
          <form method="get" className="flex items-end gap-2">
            <label className="text-sm font-bold">
              الحالة
              <select name="status" defaultValue={params.status ?? ""} className="mt-2 rounded-lg border-ink/10 bg-white">
                <option value="">كل الحالات</option>
                {Object.entries(invoiceStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="rounded-lg bg-ink px-4 py-3 text-sm font-black text-white">تطبيق</button>
          </form>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-fog text-ink/60">
              <tr>
                <th className="p-3 text-right">رقم الفاتورة</th>
                <th className="p-3 text-right">الإصدار</th>
                <th className="p-3 text-right">العميل</th>
                <th className="p-3 text-right">الفرع</th>
                <th className="p-3 text-right">قبل الضريبة</th>
                <th className="p-3 text-right">الضريبة</th>
                <th className="p-3 text-right">الإجمالي</th>
                <th className="p-3 text-right">الدفع</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-right">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length ? (
                invoices.map((invoice) => {
                  const canRefund = ["TENANT_OWNER", "BRANCH_MANAGER"].includes(session.role) && invoice.invoiceStatus === "PAID";
                  return (
                    <tr key={invoice.id} className="border-b border-ink/10">
                      <td className="p-3 font-bold">{invoice.invoiceNumber}</td>
                      <td className="p-3">{invoice.issuedAt.toLocaleString("ar-SA")}</td>
                      <td className="p-3">عميل نقدي</td>
                      <td className="p-3">{invoice.order.branch.name}</td>
                      <td className="p-3">{money.format(Number(invoice.subtotal))}</td>
                      <td className="p-3">{money.format(Number(invoice.taxTotal))}</td>
                      <td className="p-3 font-bold">{money.format(Number(invoice.total))}</td>
                      <td className="p-3">{invoice.order.payments[0] ? paymentLabels[invoice.order.payments[0].method] : "-"}</td>
                      <td className="p-3">{invoiceStatusLabels[invoice.invoiceStatus]}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/invoices/${invoice.id}`} className="inline-flex items-center gap-2 rounded-lg border border-ink/10 bg-white px-3 py-2 font-bold">
                            <Eye className="h-4 w-4" aria-hidden="true" />
                            عرض
                          </Link>
                          <Link href={`/invoices/${invoice.id}?print=1`} className="inline-flex items-center gap-2 rounded-lg bg-ink px-3 py-2 font-bold text-white">
                            <Printer className="h-4 w-4" aria-hidden="true" />
                            طباعة
                          </Link>
                          {canRefund ? (
                            <Link href={`/invoices/${invoice.id}#refund`} className="inline-flex items-center gap-2 rounded-lg bg-date px-3 py-2 font-bold text-white">
                              <RotateCcw className="h-4 w-4" aria-hidden="true" />
                              مرتجع
                            </Link>
                          ) : (
                            <span className="rounded-lg bg-ink/10 px-3 py-2 font-bold text-ink/45" title="المرتجع متاح للمالك أو مدير الفرع فقط عندما تكون الفاتورة مدفوعة.">
                              لا يتاح المرتجع
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="p-5 text-center text-ink/55" colSpan={10}>لا توجد فواتير مطابقة.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
