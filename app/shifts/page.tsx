import { AppShell } from "@/components/app-shell";

export default function ShiftsPage() {
  return (
    <AppShell title="الورديات" allowedRoles={["TENANT_OWNER", "BRANCH_MANAGER"]}>
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="surface rounded-lg p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black">وردية الفرع الرئيسي</h2>
            <span className="rounded-full bg-mint/10 px-3 py-1 text-sm font-bold text-mint">مفتوحة</span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              ["بداية الصندوق", "500.00 ر.س"],
              ["إجمالي المبيعات", "2,846.00 ر.س"],
              ["مبيعات نقدية", "720.00 ر.س"],
              ["مدى", "1,108.00 ر.س"],
              ["Visa/Mastercard", "642.00 ر.س"],
              ["Apple Pay", "376.00 ر.س"]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-fog p-4">
                <p className="text-sm text-ink/60">{label}</p>
                <p className="mt-2 font-black">{value}</p>
              </div>
            ))}
          </div>
        </section>
        <aside className="surface rounded-lg p-5">
          <h2 className="text-xl font-black">إغلاق الوردية</h2>
          <label className="mt-4 block text-sm font-bold">
            النقد الفعلي
            <input className="mt-2 w-full rounded-lg border-ink/10" placeholder="0.00" />
          </label>
          <button type="button" className="mt-4 w-full rounded-lg bg-ink px-4 py-3 font-black text-white">إقفال الوردية</button>
        </aside>
      </div>
    </AppShell>
  );
}
