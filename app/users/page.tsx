import { AppShell } from "@/components/app-shell";

const users = [
  ["مالك مقهى جاد", "Tenant Owner", "owner@jaadpos.com"],
  ["كاشير مقهى جاد", "Cashier", "cashier@jaadpos.com"],
  ["محاسب مقهى جاد", "Accountant", "accountant@jaadpos.com"]
];

export default function UsersPage() {
  return (
    <AppShell title="المستخدمون والصلاحيات">
      <section className="surface rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black">مستخدمو المنشأة</h2>
          <button type="button" className="rounded-lg bg-mint px-4 py-2 text-sm font-black text-white">إضافة مستخدم</button>
        </div>
        <div className="mt-4 divide-y divide-ink/10 rounded-lg border border-ink/10">
          {users.map(([name, role, email]) => (
            <div key={email} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <h3 className="font-black">{name}</h3>
                <p className="text-sm text-ink/60">{email}</p>
              </div>
              <span className="rounded-lg bg-fog px-3 py-2 text-sm font-bold">{role}</span>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
