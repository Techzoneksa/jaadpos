import { QrCode } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requireTenantAccess } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";

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

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const session = await requireTenantAccess(["TENANT_OWNER", "BRANCH_MANAGER", "ACCOUNTANT"]);
  const invoices = await prisma.invoice.findMany({
    where: { tenantId: session.tenantId! },
    orderBy: { issuedAt: "desc" },
    take: 50,
    include: {
      order: {
        include: {
          payments: true
        }
      }
    }
  });

  return (
    <AppShell title="الفواتير" allowedRoles={["TENANT_OWNER", "BRANCH_MANAGER", "ACCOUNTANT"]}>
      <section className="surface rounded-lg p-5">
        <h2 className="text-xl font-black">الفواتير الضريبية الإلكترونية الأساسية</h2>
        <p className="mt-2 rounded-lg bg-date/10 p-4 leading-7 text-date">
          يدعم JAADPOS فواتير ضريبية إلكترونية أساسية مع QR وتقارير VAT. الربط المباشر مع منصة فاتورة/ZATCA Phase 2 خدمة متقدمة لاحقًا حسب حاجة المنشأة.
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-fog text-ink/60">
              <tr>
                <th className="p-3 text-right">رقم الفاتورة</th>
                <th className="p-3 text-right">رقم الطلب</th>
                <th className="p-3 text-right">طريقة الدفع</th>
                <th className="p-3 text-right">الإجمالي</th>
                <th className="p-3 text-right">QR</th>
                <th className="p-3 text-right">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length ? (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-ink/10">
                    <td className="p-3 font-bold">{invoice.invoiceNumber}</td>
                    <td className="p-3">{invoice.order.orderNumber}</td>
                    <td className="p-3">{invoice.order.payments[0] ? paymentLabels[invoice.order.payments[0].method] : "-"}</td>
                    <td className="p-3 font-bold">{money.format(Number(invoice.total))}</td>
                    <td className="p-3"><QrCode className="h-5 w-5 text-mint" aria-hidden="true" /></td>
                    <td className="p-3">{invoice.invoiceStatus === "PAID" ? "مدفوعة" : invoice.invoiceStatus}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-5 text-center text-ink/55" colSpan={6}>لا توجد فواتير بعد.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
