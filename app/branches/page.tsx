import { AppShell } from "@/components/app-shell";
import { getTenantPlanUsage, isNearLimit, usageText } from "@/lib/plan-limits";
import { requireTenantAccess } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";

type BranchesPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const statusMessages = {
  created: "تمت إضافة الفرع بنجاح.",
  updated: "تم حفظ بيانات الفرع.",
  enabled: "تم تفعيل الفرع.",
  disabled: "تم تعطيل الفرع.",
  main: "تم تعيين الفرع الرئيسي.",
  main_required: "لا يمكن تعطيل الفرع الرئيسي. عيّن فرعًا آخر كرئيسي أولًا.",
  limit: "وصلت إلى حد الفروع في باقتك الحالية.",
  invalid: "تعذر حفظ الفرع. تأكد من البيانات وحاول مرة أخرى.",
  missing: "لم يتم العثور على الفرع.",
  forbidden: "لا تملك صلاحية تنفيذ هذا الإجراء.",
  error: "تعذر تنفيذ الإجراء. حاول مرة أخرى."
} as const;

const inputClass = "mt-2 w-full rounded-lg border-ink/10 bg-white";

export const dynamic = "force-dynamic";

export default async function BranchesPage({ searchParams }: BranchesPageProps) {
  const params = await searchParams;
  const session = await requireTenantAccess(["TENANT_OWNER"]);
  const [{ usage, limits }, branches] = await Promise.all([
    getTenantPlanUsage(session.tenantId!),
    prisma.branch.findMany({
      where: { tenantId: session.tenantId! },
      orderBy: [{ isMain: "desc" }, { createdAt: "asc" }]
    })
  ]);
  const canCreate = usage.branches < limits.branches;
  const message = params.status ? statusMessages[params.status as keyof typeof statusMessages] : null;

  return (
    <AppShell title="إدارة الفروع" allowedRoles={["TENANT_OWNER"]}>
      {message && <p className="mb-5 rounded-lg bg-mint/10 p-4 text-sm font-bold text-mint">{message}</p>}
      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <aside className="surface rounded-lg p-5">
          <div className="rounded-lg bg-fog p-4">
            <p className="text-sm font-bold text-ink/60">استخدام الباقة</p>
            <p className="mt-2 text-xl font-black">{usageText("branches", usage, limits)}</p>
            {isNearLimit("branches", usage, limits) && <p className="mt-2 text-sm font-bold text-date">اقتربت من حد الفروع في الباقة الحالية.</p>}
          </div>
          <h2 className="mt-5 text-xl font-black">إضافة فرع</h2>
          {canCreate ? (
            <form action="/api/branches" method="post" className="mt-4 space-y-4">
              <input type="hidden" name="action" value="create" />
              <label className="block text-sm font-bold">
                اسم الفرع
                <input name="name" required minLength={2} className={inputClass} placeholder="الفرع الرئيسي" />
              </label>
              <label className="block text-sm font-bold">
                المدينة
                <input name="city" className={inputClass} placeholder="الرياض" />
              </label>
              <label className="block text-sm font-bold">
                العنوان
                <input name="address" className={inputClass} />
              </label>
              <label className="block text-sm font-bold">
                رقم التواصل
                <input name="phone" className={inputClass} />
              </label>
              <label className="flex items-center gap-2 rounded-lg bg-fog p-3 text-sm font-bold">
                <input type="checkbox" name="isMain" className="rounded border-ink/20 text-mint" />
                تعيينه كفرع رئيسي
              </label>
              <button type="submit" className="w-full rounded-lg bg-mint px-4 py-3 font-black text-white">
                إضافة فرع
              </button>
            </form>
          ) : (
            <div className="mt-4 rounded-lg bg-date/10 p-4 text-sm font-bold text-date">هذه الميزة غير متاحة في باقتك الحالية لأنك وصلت إلى حد الفروع.</div>
          )}
        </aside>

        <section className="surface rounded-lg p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">فروع المنشأة</h2>
              <p className="mt-1 text-sm text-ink/60">يمكنك تعديل بيانات الفرع، تعيين الفرع الرئيسي، أو تعطيل الفروع غير الرئيسية.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4">
            {branches.length ? (
              branches.map((branch) => (
                <div key={branch.id} className="rounded-lg border border-ink/10 bg-fog p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black">{branch.name}</h3>
                      <p className="mt-1 text-sm text-ink/60">{[branch.city, branch.address, branch.phone].filter(Boolean).join(" · ") || "لا توجد بيانات إضافية"}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {branch.isMain && <span className="rounded-lg bg-sea/10 px-3 py-2 text-sm font-bold text-sea">رئيسي</span>}
                      <span className={branch.active ? "rounded-lg bg-mint/10 px-3 py-2 text-sm font-bold text-mint" : "rounded-lg bg-date/10 px-3 py-2 text-sm font-bold text-date"}>
                        {branch.active ? "نشط" : "معطل"}
                      </span>
                    </div>
                  </div>
                  <form action="/api/branches" method="post" className="mt-4 grid gap-3 md:grid-cols-4">
                    <input type="hidden" name="action" value="update" />
                    <input type="hidden" name="branchId" value={branch.id} />
                    <label className="text-sm font-bold">
                      اسم الفرع
                      <input name="name" required minLength={2} defaultValue={branch.name} className={inputClass} />
                    </label>
                    <label className="text-sm font-bold">
                      المدينة
                      <input name="city" defaultValue={branch.city ?? ""} className={inputClass} />
                    </label>
                    <label className="text-sm font-bold">
                      العنوان
                      <input name="address" defaultValue={branch.address ?? ""} className={inputClass} />
                    </label>
                    <label className="text-sm font-bold">
                      رقم التواصل
                      <input name="phone" defaultValue={branch.phone ?? ""} className={inputClass} />
                    </label>
                    <button type="submit" className="rounded-lg bg-ink px-4 py-3 text-sm font-black text-white md:col-span-4">
                      حفظ التعديل
                    </button>
                  </form>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!branch.isMain && (
                      <form action="/api/branches" method="post">
                        <input type="hidden" name="action" value="set_main" />
                        <input type="hidden" name="branchId" value={branch.id} />
                        <button type="submit" className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm font-bold">
                          تعيين كرئيسي
                        </button>
                      </form>
                    )}
                    {branch.isMain ? (
                      <span className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-ink/55">الفرع الرئيسي لا يعطل</span>
                    ) : (
                      <form action="/api/branches" method="post">
                        <input type="hidden" name="action" value="toggle" />
                        <input type="hidden" name="branchId" value={branch.id} />
                        <button type="submit" className={branch.active ? "rounded-lg bg-date px-3 py-2 text-sm font-bold text-white" : "rounded-lg bg-mint px-3 py-2 text-sm font-bold text-white"}>
                          {branch.active ? "تعطيل" : "تفعيل"}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-lg bg-fog p-6 text-center text-sm font-bold text-ink/60">لا توجد فروع بعد.</p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
