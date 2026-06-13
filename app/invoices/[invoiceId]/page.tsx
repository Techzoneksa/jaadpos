import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { AppShell } from "@/components/app-shell";
import { PrintButton } from "@/components/print-button";
import { PrintOnLoad } from "@/components/print-on-load";
import { requireTenantAccess } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";

type InvoiceDetailsPageProps = {
  params: Promise<{
    invoiceId: string;
  }>;
  searchParams: Promise<{
    print?: string;
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

const statusMessages = {
  refunded: "تم إنشاء المرتجع وحفظه بنجاح.",
  invalid: "تعذر إنشاء المرتجع. تأكد من البيانات وحاول مرة أخرى.",
  forbidden: "لا تملك صلاحية تنفيذ هذا الإجراء.",
  missing: "لم يتم العثور على الفاتورة.",
  not_refundable: "هذه الفاتورة غير قابلة للمرتجع.",
  error: "تعذر تنفيذ الإجراء. حاول مرة أخرى."
} as const;

export const dynamic = "force-dynamic";

export default async function InvoiceDetailsPage({ params, searchParams }: InvoiceDetailsPageProps) {
  const { invoiceId } = await params;
  const query = await searchParams;
  const session = await requireTenantAccess(["TENANT_OWNER", "BRANCH_MANAGER", "CASHIER", "ACCOUNTANT"]);
  const currentUser = await prisma.user.findFirst({
    where: { id: session.userId, tenantId: session.tenantId! },
    select: { branchId: true }
  });
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      tenantId: session.tenantId!,
      ...(session.role === "CASHIER" ? { order: { cashierId: session.userId } } : {}),
      ...(session.role === "BRANCH_MANAGER" && currentUser?.branchId ? { order: { branchId: currentUser.branchId } } : {})
    },
    include: {
      tenant: true,
      refunds: {
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true } },
          items: true
        }
      },
      order: {
        include: {
          branch: true,
          device: true,
          cashier: { select: { name: true } },
          items: true,
          payments: true
        }
      }
    }
  });
  const message = query.status ? statusMessages[query.status as keyof typeof statusMessages] : null;
  const canRefund = Boolean(invoice && ["TENANT_OWNER", "BRANCH_MANAGER"].includes(session.role) && invoice.invoiceStatus === "PAID");

  return (
    <AppShell title="تفاصيل الفاتورة" allowedRoles={["TENANT_OWNER", "BRANCH_MANAGER", "CASHIER", "ACCOUNTANT"]}>
      <PrintOnLoad enabled={query.print === "1" && Boolean(invoice)} />
      {message && <p className="no-print mb-5 rounded-lg bg-mint/10 p-4 text-sm font-bold text-mint">{message}</p>}
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/invoices" className="inline-flex items-center gap-2 rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm font-bold">
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          العودة للفواتير
        </Link>
        {invoice && <PrintButton label="طباعة الإيصال" />}
      </div>

      {!invoice ? (
        <section className="surface rounded-lg p-6 text-center font-bold text-ink/60">لم يتم العثور على الفاتورة أو لا تملك صلاحية عرضها.</section>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
          <section className="surface print-receipt rounded-lg p-5">
            <div className="text-center">
              <h2 className="text-2xl font-black">{invoice.tenant.name}</h2>
              <p className="mt-1 text-sm text-ink/60">{invoice.order.branch.name} · {invoice.order.branch.city ?? ""}</p>
              <p className="mt-1 text-xs text-ink/55">الرقم الضريبي: {invoice.sellerVatNumber}</p>
            </div>

            <div className="mt-5 rounded-lg bg-fog p-4 text-sm">
              <div className="flex justify-between gap-3">
                <span>رقم الفاتورة</span>
                <strong>{invoice.invoiceNumber}</strong>
              </div>
              <div className="mt-2 flex justify-between gap-3">
                <span>رقم الطلب</span>
                <Link href={`/orders/${invoice.order.id}`} className="font-bold text-mint">{invoice.order.orderNumber}</Link>
              </div>
              <div className="mt-2 flex justify-between gap-3">
                <span>التاريخ</span>
                <strong>{invoice.issuedAt.toLocaleString("ar-SA")}</strong>
              </div>
              <div className="mt-2 flex justify-between gap-3">
                <span>الحالة</span>
                <strong>{invoiceStatusLabels[invoice.invoiceStatus]}</strong>
              </div>
              <div className="mt-2 flex justify-between gap-3">
                <span>الكاشير</span>
                <strong>{invoice.order.cashier.name}</strong>
              </div>
            </div>

            <div className="mt-5">
              <table className="w-full text-sm">
                <thead className="border-b border-ink/10 text-ink/60">
                  <tr>
                    <th className="py-2 text-right">الصنف</th>
                    <th className="py-2 text-right">الكمية</th>
                    <th className="py-2 text-right">السعر</th>
                    <th className="py-2 text-right">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.order.items.map((item) => (
                    <tr key={item.id} className="border-b border-ink/10">
                      <td className="py-2 font-bold">{item.productName}</td>
                      <td className="py-2">{Number(item.quantity)}</td>
                      <td className="py-2">{money.format(Number(item.unitPrice))}</td>
                      <td className="py-2 font-bold">{money.format(Number(item.lineTotal))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 space-y-2 text-sm">
              <Row label="قبل الضريبة" value={money.format(Number(invoice.subtotal))} />
              <Row label="الخصم" value={money.format(Number(invoice.discountAmount))} />
              <Row label="ضريبة 15%" value={money.format(Number(invoice.taxTotal))} />
              <div className="flex justify-between border-t border-ink/10 pt-3 text-lg font-black">
                <span>الإجمالي</span>
                <span>{money.format(Number(invoice.total))}</span>
              </div>
            </div>

            <div className="mt-5 rounded-lg bg-fog p-4">
              <h3 className="font-black">المدفوعات</h3>
              <div className="mt-3 grid gap-2 text-sm">
                {invoice.order.payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between">
                    <span>{paymentLabels[payment.method]}</span>
                    <strong>{money.format(Number(payment.amount))}</strong>
                  </div>
                ))}
              </div>
            </div>

            {invoice.qrPayload && (
              <div className="mt-5 flex justify-center">
                <QRCodeSVG value={invoice.qrPayload} size={112} />
              </div>
            )}

            {invoice.footerText && <p className="mt-5 text-center text-sm font-bold text-ink/65">{invoice.footerText}</p>}
          </section>

          <aside className="no-print space-y-5">
            <section className="surface rounded-lg p-5">
              <h2 className="text-xl font-black">المرتجعات</h2>
              {invoice.refunds.length ? (
                <div className="mt-4 grid gap-3">
                  {invoice.refunds.map((refund) => (
                    <div key={refund.id} className="rounded-lg bg-fog p-3 text-sm">
                      <div className="flex justify-between gap-3">
                        <strong>REF-{refund.id.slice(-8).toUpperCase()}</strong>
                        <span>{money.format(Number(refund.amount))}</span>
                      </div>
                      <p className="mt-1 text-ink/60">{refund.user.name} · {refund.createdAt.toLocaleString("ar-SA")}</p>
                      <p className="mt-1 text-ink/60">السبب: {refund.reason || "غير محدد"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-lg bg-fog p-4 text-sm font-bold text-ink/60">لا توجد مرتجعات لهذه الفاتورة.</p>
              )}
            </section>

            <section id="refund" className="surface rounded-lg p-5">
              <h2 className="text-xl font-black">إنشاء مرتجع</h2>
              {canRefund ? (
                <form action="/api/refunds/full" method="post" className="mt-4 space-y-4">
                  <input type="hidden" name="invoiceId" value={invoice.id} />
                  <label className="block text-sm font-bold">
                    السبب
                    <textarea name="reason" rows={3} className="mt-2 w-full rounded-lg border-ink/10" placeholder="اختياري" />
                  </label>
                  <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-date px-4 py-3 font-black text-white">
                    <RotateCcw className="h-5 w-5" aria-hidden="true" />
                    إنشاء مرتجع كامل
                  </button>
                </form>
              ) : (
                <div className="mt-4 rounded-lg bg-ink/10 p-4 text-sm font-bold text-ink/55">
                  {invoice.invoiceStatus === "PAID" ? "لا تملك صلاحية تنفيذ هذا الإجراء." : "هذه الفاتورة غير قابلة للمرتجع."}
                </div>
              )}
            </section>
          </aside>
        </div>
      )}
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
