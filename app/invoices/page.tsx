import { QrCode } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { recentOrders } from "@/lib/demo-data";

export default function InvoicesPage() {
  return (
    <AppShell title="الفواتير" allowedRoles={["TENANT_OWNER", "BRANCH_MANAGER", "CASHIER", "ACCOUNTANT"]}>
      <section className="surface rounded-lg p-5">
        <h2 className="text-xl font-black">الفواتير الضريبية الإلكترونية الأساسية</h2>
        <p className="mt-2 rounded-lg bg-date/10 p-4 leading-7 text-date">الفوترة الإلكترونية الأساسية مفعلة. الربط المباشر مع منصة فاتورة/ZATCA غير مفعل حاليًا.</p>
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
              {recentOrders.map((order) => (
                <tr key={order.invoice} className="border-b border-ink/10">
                  <td className="p-3 font-bold">{order.invoice}</td>
                  <td className="p-3">{order.id}</td>
                  <td className="p-3">{order.payment}</td>
                  <td className="p-3 font-bold">{order.total}</td>
                  <td className="p-3"><QrCode className="h-5 w-5 text-mint" aria-hidden="true" /></td>
                  <td className="p-3">{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
