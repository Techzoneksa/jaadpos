import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { dashboardMetrics, recentOrders, trialDaysLeft } from "@/lib/demo-data";

export default function DashboardPage() {
  return (
    <AppShell title="لوحة التحكم">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="surface rounded-lg p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">آخر الطلبات</h2>
            <span className="rounded-full bg-mint/10 px-3 py-1 text-sm font-bold text-mint">Trial: {trialDaysLeft} يوم متبقي</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
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
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-ink/10">
                    <td className="p-3 font-bold">{order.id}</td>
                    <td className="p-3">{order.invoice}</td>
                    <td className="p-3">{order.cashier}</td>
                    <td className="p-3">{order.type}</td>
                    <td className="p-3">{order.payment}</td>
                    <td className="p-3 font-bold">{order.total}</td>
                    <td className="p-3">{order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="surface rounded-lg p-5">
          <h2 className="text-xl font-black">حالة الاشتراك</h2>
          <div className="mt-4 rounded-lg bg-fog p-4">
            <p className="text-sm text-ink/60">الباقة الحالية</p>
            <p className="mt-1 text-2xl font-black">Growth</p>
            <p className="mt-3 text-sm leading-7 text-ink/65">يمنع النظام تجاوز حدود الباقة في الفروع وأجهزة POS والمستخدمين.</p>
          </div>
          <div className="mt-4 rounded-lg border border-date/30 bg-date/10 p-4 text-sm leading-7 text-date">
            عند انتهاء التجربة لا يتم حذف بيانات العميل، ويتم منع إنشاء طلبات وفواتير جديدة حتى التفعيل أو التمديد.
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
