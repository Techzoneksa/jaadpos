import { AppShell } from "@/components/app-shell";
import { getTenantPlanUsage, isNearLimit, usageText } from "@/lib/plan-limits";
import { requireTenantAccess } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";

type UsersPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const roleLabels = {
  TENANT_OWNER: "مالك المنشأة",
  BRANCH_MANAGER: "مدير فرع",
  CASHIER: "كاشير",
  ACCOUNTANT: "محاسب"
} as const;

const roles = [
  ["TENANT_OWNER", roleLabels.TENANT_OWNER],
  ["BRANCH_MANAGER", roleLabels.BRANCH_MANAGER],
  ["CASHIER", roleLabels.CASHIER],
  ["ACCOUNTANT", roleLabels.ACCOUNTANT]
] as const;

const statusMessages = {
  created: "تمت إضافة المستخدم بنجاح.",
  updated: "تم حفظ بيانات المستخدم.",
  enabled: "تم تفعيل المستخدم.",
  disabled: "تم تعطيل المستخدم.",
  limit: "وصلت إلى حد المستخدمين في باقتك الحالية.",
  duplicate: "البريد الإلكتروني مستخدم مسبقًا.",
  branch_missing: "اختر فرعًا نشطًا أو اترك الفرع فارغًا.",
  last_owner: "لا يمكن تعطيل أو تغيير آخر مالك نشط للمنشأة.",
  invalid: "تعذر حفظ المستخدم. تأكد من البيانات وحاول مرة أخرى.",
  missing: "لم يتم العثور على المستخدم.",
  forbidden: "لا تملك صلاحية تنفيذ هذا الإجراء.",
  error: "تعذر تنفيذ الإجراء. حاول مرة أخرى."
} as const;

const inputClass = "mt-2 w-full rounded-lg border-ink/10 bg-white";

export const dynamic = "force-dynamic";

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;
  const session = await requireTenantAccess(["TENANT_OWNER"]);
  const [{ usage, limits }, branches, users] = await Promise.all([
    getTenantPlanUsage(session.tenantId!),
    prisma.branch.findMany({
      where: { tenantId: session.tenantId!, active: true },
      orderBy: [{ isMain: "desc" }, { createdAt: "asc" }],
      select: { id: true, name: true }
    }),
    prisma.user.findMany({
      where: { tenantId: session.tenantId! },
      orderBy: { createdAt: "asc" },
      include: { branch: { select: { id: true, name: true } } }
    })
  ]);
  const canCreate = usage.users < limits.users;
  const message = params.status ? statusMessages[params.status as keyof typeof statusMessages] : null;

  return (
    <AppShell title="المستخدمون والصلاحيات" allowedRoles={["TENANT_OWNER"]}>
      {message && <p className="mb-5 rounded-lg bg-mint/10 p-4 text-sm font-bold text-mint">{message}</p>}
      <div className="grid gap-5 xl:grid-cols-[400px_1fr]">
        <aside className="surface rounded-lg p-5">
          <div className="rounded-lg bg-fog p-4">
            <p className="text-sm font-bold text-ink/60">استخدام الباقة</p>
            <p className="mt-2 text-xl font-black">{usageText("users", usage, limits)}</p>
            {isNearLimit("users", usage, limits) && <p className="mt-2 text-sm font-bold text-date">اقتربت من حد المستخدمين في الباقة الحالية.</p>}
          </div>
          <h2 className="mt-5 text-xl font-black">إضافة مستخدم</h2>
          {canCreate ? (
            <form action="/api/users" method="post" className="mt-4 space-y-4">
              <input type="hidden" name="action" value="create" />
              <label className="block text-sm font-bold">
                الاسم
                <input name="name" required minLength={2} className={inputClass} />
              </label>
              <label className="block text-sm font-bold">
                البريد الإلكتروني
                <input name="email" type="email" required className={inputClass} dir="ltr" />
              </label>
              <label className="block text-sm font-bold">
                كلمة المرور الأولية
                <input name="password" type="password" required minLength={8} className={inputClass} />
              </label>
              <label className="block text-sm font-bold">
                الدور
                <select name="role" required className={inputClass} defaultValue="CASHIER">
                  {roles.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-bold">
                الفرع
                <select name="branchId" className={inputClass} defaultValue="">
                  <option value="">بدون ربط بفرع</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="w-full rounded-lg bg-mint px-4 py-3 font-black text-white">
                إضافة مستخدم
              </button>
            </form>
          ) : (
            <div className="mt-4 rounded-lg bg-date/10 p-4 text-sm font-bold text-date">هذه الميزة غير متاحة في باقتك الحالية لأنك وصلت إلى حد المستخدمين.</div>
          )}
        </aside>

        <section className="surface rounded-lg p-5">
          <div>
            <h2 className="text-xl font-black">مستخدمو المنشأة</h2>
            <p className="mt-1 text-sm text-ink/60">يمكن للمالك إضافة المستخدمين وتعديل أدوارهم بدون أي صلاحيات منصة.</p>
          </div>
          <div className="mt-5 grid gap-4">
            {users.length ? (
              users.map((user) => (
                <div key={user.id} className="rounded-lg border border-ink/10 bg-fog p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black">{user.name}</h3>
                      <p className="mt-1 text-sm text-ink/60" dir="ltr">{user.email}</p>
                      <p className="mt-1 text-sm text-ink/55">{user.branch?.name ?? "غير مربوط بفرع"}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-white px-3 py-2 text-sm font-bold">{roleLabels[user.role as keyof typeof roleLabels] ?? user.role}</span>
                      <span className={user.active ? "rounded-lg bg-mint/10 px-3 py-2 text-sm font-bold text-mint" : "rounded-lg bg-date/10 px-3 py-2 text-sm font-bold text-date"}>
                        {user.active ? "نشط" : "معطل"}
                      </span>
                    </div>
                  </div>
                  <form action="/api/users" method="post" className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <input type="hidden" name="action" value="update" />
                    <input type="hidden" name="userId" value={user.id} />
                    <label className="text-sm font-bold">
                      الاسم
                      <input name="name" required minLength={2} defaultValue={user.name} className={inputClass} />
                    </label>
                    <label className="text-sm font-bold">
                      الدور
                      <select name="role" required defaultValue={user.role} className={inputClass}>
                        {roles.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm font-bold">
                      الفرع
                      <select name="branchId" defaultValue={branches.some((branch) => branch.id === user.branchId) ? user.branchId ?? "" : ""} className={inputClass}>
                        <option value="">بدون ربط بفرع</option>
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm font-bold">
                      كلمة مرور جديدة
                      <input name="password" type="password" minLength={8} className={inputClass} placeholder="اختياري" />
                    </label>
                    <button type="submit" className="rounded-lg bg-ink px-4 py-3 text-sm font-black text-white md:col-span-2 xl:col-span-4">
                      حفظ التعديل
                    </button>
                  </form>
                  <form action="/api/users" method="post" className="mt-3">
                    <input type="hidden" name="action" value="toggle" />
                    <input type="hidden" name="userId" value={user.id} />
                    <button type="submit" className={user.active ? "rounded-lg bg-date px-3 py-2 text-sm font-bold text-white" : "rounded-lg bg-mint px-3 py-2 text-sm font-bold text-white"}>
                      {user.active ? "تعطيل" : "تفعيل"}
                    </button>
                  </form>
                </div>
              ))
            ) : (
              <p className="rounded-lg bg-fog p-6 text-center text-sm font-bold text-ink/60">لا يوجد مستخدمون بعد.</p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
