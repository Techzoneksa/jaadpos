import Link from "next/link";
import { Eye, ReceiptText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requireTenantAccess } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";

type OrdersPageProps = {
  searchParams: Promise<{
    range?: string;
    status?: string;
    branchId?: string;
    cashierId?: string;
  }>;
};

const money = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR"
});

const orderTypeLabels = {
  DINE_IN: "داخل المحل",
  TAKEAWAY: "سفري",
  DELIVERY: "توصيل"
} as const;

const statusLabels = {
  DRAFT: "مسودة",
  HELD: "معلق",
  PAID: "مدفوع",
  REFUNDED: "مرتجع بالكامل",
  PARTIALLY_REFUNDED: "مرتجع جزئي",
  VOIDED: "ملغي"
} as const;

const paymentLabels = {
  CASH: "نقدي",
  MADA: "مدى",
  VISA_MASTERCARD: "Visa/Mastercard",
  APPLE_PAY: "Apple Pay"
} as const;

const allowedStatuses = new Set(Object.keys(statusLabels));

function startDateForRange(range?: string) {
  const now = new Date();
  if (range === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (range === "7d") {
    const date = new Date(now);
    date.setDate(date.getDate() - 7);
    return date;
  }
  return null;
}

export const dynamic = "force-dynamic";

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;
  const session = await requireTenantAccess(["TENANT_OWNER", "BRANCH_MANAGER", "CASHIER", "ACCOUNTANT"]);
  const user = await prisma.user.findFirst({
    where: { id: session.userId, tenantId: session.tenantId! },
    select: { branchId: true }
  });
  const [branches, cashiers] = await Promise.all([
    prisma.branch.findMany({
      where: { tenantId: session.tenantId! },
      orderBy: [{ isMain: "desc" }, { createdAt: "asc" }],
      select: { id: true, name: true }
    }),
    prisma.user.findMany({
      where: { tenantId: session.tenantId!, role: { in: ["TENANT_OWNER", "BRANCH_MANAGER", "CASHIER"] } },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true }
    })
  ]);

  const createdAt = startDateForRange(params.range);
  const where = {
    tenantId: session.tenantId!,
    ...(createdAt ? { createdAt: { gte: createdAt } } : {}),
    ...(params.status && allowedStatuses.has(params.status) ? { status: params.status as keyof typeof statusLabels } : {}),
    ...(params.branchId ? { branchId: params.branchId } : {}),
    ...(params.cashierId ? { cashierId: params.cashierId } : {})
  };

  if (session.role === "CASHIER") {
    Object.assign(where, { cashierId: session.userId });
  } else if (session.role === "BRANCH_MANAGER" && user?.branchId) {
    Object.assign(where, { branchId: user.branchId });
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      invoice: true,
      payments: true,
      branch: { select: { name: true } },
      cashier: { select: { name: true } }
    }
  });

  return (
    <AppShell title="الطلبات" allowedRoles={["TENANT_OWNER", "BRANCH_MANAGER", "CASHIER", "ACCOUNTANT"]}>
      <section className="surface rounded-lg p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">قائمة الطلبات</h2>
            <p className="mt-1 text-sm text-ink/60">راجع الطلبات الفعلية، افتح التفاصيل، أو انتقل إلى الفاتورة المرتبطة.</p>
          </div>
        </div>

        <form className="mt-5 grid gap-3 md:grid-cols-5" method="get">
          <label className="text-sm font-bold">
            الفترة
            <select name="range" defaultValue={params.range ?? ""} className="mt-2 w-full rounded-lg border-ink/10 bg-white">
              <option value="">كل الطلبات</option>
              <option value="today">اليوم</option>
              <option value="7d">آخر 7 أيام</option>
            </select>
          </label>
          <label className="text-sm font-bold">
            الحالة
            <select name="status" defaultValue={params.status ?? ""} className="mt-2 w-full rounded-lg border-ink/10 bg-white">
              <option value="">كل الحالات</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold">
            الفرع
            <select name="branchId" defaultValue={params.branchId ?? ""} className="mt-2 w-full rounded-lg border-ink/10 bg-white" disabled={session.role === "CASHIER" || Boolean(session.role === "BRANCH_MANAGER" && user?.branchId)}>
              <option value="">كل الفروع</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold">
            الكاشير
            <select name="cashierId" defaultValue={params.cashierId ?? ""} className="mt-2 w-full rounded-lg border-ink/10 bg-white" disabled={session.role === "CASHIER"}>
              <option value="">كل المستخدمين</option>
              {cashiers.map((cashier) => (
                <option key={cashier.id} value={cashier.id}>
                  {cashier.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="self-end rounded-lg bg-ink px-4 py-3 text-sm font-black text-white">
            تطبيق الفلاتر
          </button>
        </form>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-fog text-ink/60">
              <tr>
                <th className="p-3 text-right">رقم الطلب</th>
                <th className="p-3 text-right">التاريخ والوقت</th>
                <th className="p-3 text-right">الفرع</th>
                <th className="p-3 text-right">الكاشير</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-right">النوع</th>
                <th className="p-3 text-right">الدفع</th>
                <th className="p-3 text-right">الإجمالي</th>
                <th className="p-3 text-right">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {orders.length ? (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-ink/10">
                    <td className="p-3 font-bold">{order.orderNumber}</td>
                    <td className="p-3">{order.createdAt.toLocaleString("ar-SA")}</td>
                    <td className="p-3">{order.branch.name}</td>
                    <td className="p-3">{order.cashier.name}</td>
                    <td className="p-3">{statusLabels[order.status]}</td>
                    <td className="p-3">{orderTypeLabels[order.orderType]}</td>
                    <td className="p-3">{order.payments[0] ? paymentLabels[order.payments[0].method] : "-"}</td>
                    <td className="p-3 font-bold">{money.format(Number(order.total))}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/orders/${order.id}`} className="inline-flex items-center gap-2 rounded-lg border border-ink/10 bg-white px-3 py-2 font-bold">
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          عرض
                        </Link>
                        {order.invoice ? (
                          <Link href={`/invoices/${order.invoice.id}`} className="inline-flex items-center gap-2 rounded-lg bg-mint px-3 py-2 font-bold text-white">
                            <ReceiptText className="h-4 w-4" aria-hidden="true" />
                            الفاتورة
                          </Link>
                        ) : (
                          <span className="rounded-lg bg-ink/10 px-3 py-2 font-bold text-ink/45">لا توجد فاتورة</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-5 text-center text-ink/55" colSpan={9}>لا توجد طلبات مطابقة.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
