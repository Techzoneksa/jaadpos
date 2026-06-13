import Link from "next/link";
import { ArrowRight, ReceiptText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PrintButton } from "@/components/print-button";
import { requireTenantAccess } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";

type OrderDetailsPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

const money = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR"
});

const statusLabels = {
  DRAFT: "مسودة",
  HELD: "معلق",
  PAID: "مدفوع",
  REFUNDED: "مرتجع بالكامل",
  PARTIALLY_REFUNDED: "مرتجع جزئي",
  VOIDED: "ملغي"
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

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { orderId } = await params;
  const session = await requireTenantAccess(["TENANT_OWNER", "BRANCH_MANAGER", "CASHIER", "ACCOUNTANT"]);
  const currentUser = await prisma.user.findFirst({
    where: { id: session.userId, tenantId: session.tenantId! },
    select: { branchId: true }
  });
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      tenantId: session.tenantId!,
      ...(session.role === "CASHIER" ? { cashierId: session.userId } : {}),
      ...(session.role === "BRANCH_MANAGER" && currentUser?.branchId ? { branchId: currentUser.branchId } : {})
    },
    include: {
      branch: true,
      device: true,
      cashier: { select: { name: true, email: true } },
      items: true,
      payments: true,
      invoice: true,
      refunds: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } }
      }
    }
  });

  return (
    <AppShell title="تفاصيل الطلب" allowedRoles={["TENANT_OWNER", "BRANCH_MANAGER", "CASHIER", "ACCOUNTANT"]}>
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/orders" className="inline-flex items-center gap-2 rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm font-bold">
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          العودة للطلبات
        </Link>
        {order?.invoice ? (
          <Link href={`/invoices/${order.invoice.id}`} className="inline-flex items-center gap-2 rounded-lg bg-mint px-4 py-2 text-sm font-black text-white">
            <ReceiptText className="h-4 w-4" aria-hidden="true" />
            عرض الفاتورة
          </Link>
        ) : null}
      </div>

      {!order ? (
        <section className="surface rounded-lg p-6 text-center font-bold text-ink/60">لم يتم العثور على الطلب أو لا تملك صلاحية عرضه.</section>
      ) : (
        <section className="surface print-receipt rounded-lg p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink/10 pb-4">
            <div>
              <p className="text-sm text-ink/60">رقم الطلب</p>
              <h2 className="text-2xl font-black">{order.orderNumber}</h2>
              <p className="mt-1 text-sm text-ink/60">{order.createdAt.toLocaleString("ar-SA")}</p>
            </div>
            <div className="text-sm">
              <p className="font-bold">{statusLabels[order.status]}</p>
              <p className="mt-1 text-ink/60">{orderTypeLabels[order.orderType]}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <InfoCard label="الفرع" value={order.branch.name} />
            <InfoCard label="الجهاز" value={`${order.device.name} · ${order.device.code}`} />
            <InfoCard label="الكاشير" value={order.cashier.name} />
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-fog text-ink/60">
                <tr>
                  <th className="p-3 text-right">المنتج</th>
                  <th className="p-3 text-right">الكمية</th>
                  <th className="p-3 text-right">السعر</th>
                  <th className="p-3 text-right">الضريبة</th>
                  <th className="p-3 text-right">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-ink/10">
                    <td className="p-3 font-bold">{item.productName}</td>
                    <td className="p-3">{Number(item.quantity)}</td>
                    <td className="p-3">{money.format(Number(item.unitPrice))}</td>
                    <td className="p-3">{money.format(Number(item.taxAmount))}</td>
                    <td className="p-3 font-bold">{money.format(Number(item.lineTotal))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <InfoCard label="قبل الضريبة" value={money.format(Number(order.subtotal))} />
            <InfoCard label="الخصم" value={money.format(Number(order.discountAmount))} />
            <InfoCard label="الضريبة" value={money.format(Number(order.taxTotal))} />
            <InfoCard label="الإجمالي" value={money.format(Number(order.total))} strong />
          </div>

          <div className="mt-5 rounded-lg bg-fog p-4">
            <h3 className="font-black">الدفع</h3>
            <div className="mt-3 grid gap-2 text-sm">
              {order.payments.length ? (
                order.payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between">
                    <span>{paymentLabels[payment.method]}</span>
                    <strong>{money.format(Number(payment.amount))}</strong>
                  </div>
                ))
              ) : (
                <p className="text-ink/55">لا توجد دفعات مسجلة.</p>
              )}
            </div>
          </div>

          {order.invoice && (
            <div className="mt-5 rounded-lg border border-mint/20 bg-mint/5 p-4">
              <h3 className="font-black text-mint">الفاتورة المرتبطة</h3>
              <p className="mt-2 text-sm">رقم الفاتورة: <strong>{order.invoice.invoiceNumber}</strong></p>
              <div className="no-print mt-3 flex flex-wrap gap-2">
                <Link href={`/invoices/${order.invoice.id}`} className="rounded-lg bg-mint px-3 py-2 text-sm font-bold text-white">عرض الفاتورة</Link>
                <Link href={`/invoices/${order.invoice.id}?print=1`} className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm font-bold">طباعة الفاتورة</Link>
              </div>
            </div>
          )}

          {order.refunds.length > 0 && (
            <div className="mt-5 rounded-lg bg-date/10 p-4 text-date">
              <h3 className="font-black">المرتجعات</h3>
              <div className="mt-3 grid gap-2 text-sm">
                {order.refunds.map((refund) => (
                  <div key={refund.id} className="flex flex-wrap justify-between gap-2">
                    <span>REF-{refund.id.slice(-8).toUpperCase()} · {refund.user.name}</span>
                    <strong>{money.format(Number(refund.amount))}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="no-print mt-5">
            <PrintButton label="طباعة ملخص الطلب" />
          </div>
        </section>
      )}
    </AppShell>
  );
}

function InfoCard({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-lg bg-fog p-4">
      <p className="text-sm text-ink/60">{label}</p>
      <p className={strong ? "mt-2 text-lg font-black" : "mt-2 font-bold"}>{value}</p>
    </div>
  );
}
