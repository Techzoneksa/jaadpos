import { RotateCcw, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requireTenantAccess } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";

const money = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR"
});

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

export default async function OrdersPage() {
  const session = await requireTenantAccess(["TENANT_OWNER", "BRANCH_MANAGER"]);
  const orders = await prisma.order.findMany({
    where: { tenantId: session.tenantId! },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      invoice: true,
      payments: true,
      branch: { select: { name: true } },
      cashier: { select: { name: true } }
    }
  });

  return (
    <AppShell title="الطلبات والفواتير" allowedRoles={["TENANT_OWNER", "BRANCH_MANAGER"]}>
      <section className="surface rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black">قائمة الطلبات</h2>
          <div className="flex flex-wrap gap-2">
            {["اليوم", "الفرع", "الكاشير", "الحالة", "طريقة الدفع", "نوع الطلب"].map((filter) => (
              <button key={filter} type="button" className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm font-bold">
                {filter}
              </button>
            ))}
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 rounded-lg border border-ink/10 bg-fog px-3 py-2">
          <Search className="h-4 w-4 text-ink/50" aria-hidden="true" />
          <input className="w-full border-0 bg-transparent focus:ring-0" placeholder="ابحث برقم الطلب أو الفاتورة" />
        </label>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-fog text-ink/60">
              <tr>
                <th className="p-3 text-right">رقم الطلب</th>
                <th className="p-3 text-right">رقم الفاتورة</th>
                <th className="p-3 text-right">التاريخ</th>
                <th className="p-3 text-right">الفرع</th>
                <th className="p-3 text-right">الكاشير</th>
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
                    <td className="p-3">{order.invoice?.invoiceNumber ?? "-"}</td>
                    <td className="p-3">{order.createdAt.toLocaleDateString("ar-SA")}</td>
                    <td className="p-3">{order.branch.name}</td>
                    <td className="p-3">{order.cashier.name}</td>
                    <td className="p-3">{orderTypeLabels[order.orderType]}</td>
                    <td className="p-3">{order.payments[0] ? paymentLabels[order.payments[0].method] : "-"}</td>
                    <td className="p-3 font-bold">{money.format(Number(order.total))}</td>
                    <td className="p-3">
                      <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-fog px-3 py-2 font-bold text-ink">
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        استرجاع
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-5 text-center text-ink/55" colSpan={9}>لا توجد طلبات بعد.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
