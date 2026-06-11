import { RotateCcw, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { recentOrders } from "@/lib/demo-data";

export default function OrdersPage() {
  return (
    <AppShell title="الطلبات والفواتير">
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
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-ink/10">
                  <td className="p-3 font-bold">{order.id}</td>
                  <td className="p-3">{order.invoice}</td>
                  <td className="p-3">2026-06-11</td>
                  <td className="p-3">الفرع الرئيسي</td>
                  <td className="p-3">{order.cashier}</td>
                  <td className="p-3">{order.type}</td>
                  <td className="p-3">{order.payment}</td>
                  <td className="p-3 font-bold">{order.total}</td>
                  <td className="p-3">
                    <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-fog px-3 py-2 font-bold text-ink">
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      استرجاع
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
