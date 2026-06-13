import { AppShell } from "@/components/app-shell";
import { getTenantPlanUsage, isNearLimit, usageText } from "@/lib/plan-limits";
import { requireTenantAccess } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";

type DevicesPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const statusMessages = {
  created: "تمت إضافة جهاز POS بنجاح.",
  updated: "تم حفظ بيانات الجهاز.",
  enabled: "تم تفعيل الجهاز.",
  disabled: "تم تعطيل الجهاز.",
  limit: "وصلت إلى حد أجهزة POS في باقتك الحالية.",
  invalid: "تعذر حفظ الجهاز. تأكد من البيانات وحاول مرة أخرى.",
  missing: "لم يتم العثور على الجهاز.",
  branch_missing: "اختر فرعًا نشطًا قبل حفظ الجهاز.",
  forbidden: "لا تملك صلاحية تنفيذ هذا الإجراء.",
  error: "تعذر تنفيذ الإجراء. حاول مرة أخرى."
} as const;

const inputClass = "mt-2 w-full rounded-lg border-ink/10 bg-white";

export const dynamic = "force-dynamic";

export default async function DevicesPage({ searchParams }: DevicesPageProps) {
  const params = await searchParams;
  const session = await requireTenantAccess(["TENANT_OWNER"]);
  const [{ usage, limits }, branches, devices] = await Promise.all([
    getTenantPlanUsage(session.tenantId!),
    prisma.branch.findMany({
      where: { tenantId: session.tenantId! },
      orderBy: [{ isMain: "desc" }, { createdAt: "asc" }]
    }),
    prisma.posDevice.findMany({
      where: { tenantId: session.tenantId! },
      orderBy: { createdAt: "asc" },
      include: { branch: true }
    })
  ]);
  const activeBranches = branches.filter((branch) => branch.active);
  const canCreate = usage.posDevices < limits.posDevices && activeBranches.length > 0;
  const message = params.status ? statusMessages[params.status as keyof typeof statusMessages] : null;

  return (
    <AppShell title="إدارة أجهزة POS" allowedRoles={["TENANT_OWNER"]}>
      {message && <p className="mb-5 rounded-lg bg-mint/10 p-4 text-sm font-bold text-mint">{message}</p>}
      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <aside className="surface rounded-lg p-5">
          <div className="rounded-lg bg-fog p-4">
            <p className="text-sm font-bold text-ink/60">استخدام الباقة</p>
            <p className="mt-2 text-xl font-black">{usageText("posDevices", usage, limits)}</p>
            {isNearLimit("posDevices", usage, limits) && <p className="mt-2 text-sm font-bold text-date">اقتربت من حد الأجهزة في الباقة الحالية.</p>}
          </div>
          <h2 className="mt-5 text-xl font-black">إضافة جهاز</h2>
          {canCreate ? (
            <form action="/api/devices" method="post" className="mt-4 space-y-4">
              <input type="hidden" name="action" value="create" />
              <label className="block text-sm font-bold">
                اسم الجهاز
                <input name="name" required minLength={2} className={inputClass} placeholder="الكاشير الرئيسي" />
              </label>
              <label className="block text-sm font-bold">
                الفرع
                <select name="branchId" required className={inputClass} defaultValue={activeBranches[0]?.id ?? ""}>
                  {activeBranches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="w-full rounded-lg bg-mint px-4 py-3 font-black text-white">
                إضافة جهاز
              </button>
            </form>
          ) : (
            <div className="mt-4 rounded-lg bg-date/10 p-4 text-sm font-bold text-date">
              {activeBranches.length === 0 ? "أضف فرعًا نشطًا قبل إنشاء جهاز POS." : "هذه الميزة غير متاحة في باقتك الحالية لأنك وصلت إلى حد الأجهزة."}
            </div>
          )}
        </aside>

        <section className="surface rounded-lg p-5">
          <div>
            <h2 className="text-xl font-black">أجهزة نقطة البيع</h2>
            <p className="mt-1 text-sm text-ink/60">اربط كل جهاز بفرع نشط، وفعّل أو عطّل الأجهزة حسب الحاجة.</p>
          </div>
          <div className="mt-5 grid gap-4">
            {devices.length ? (
              devices.map((device) => (
                <div key={device.id} className="rounded-lg border border-ink/10 bg-fog p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black">{device.name}</h3>
                      <p className="mt-1 text-sm text-ink/60">{device.code} · {device.branch.name}</p>
                    </div>
                    <span className={device.active ? "rounded-lg bg-mint/10 px-3 py-2 text-sm font-bold text-mint" : "rounded-lg bg-date/10 px-3 py-2 text-sm font-bold text-date"}>
                      {device.active ? "نشط" : "معطل"}
                    </span>
                  </div>
                  <form action="/api/devices" method="post" className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                    <input type="hidden" name="action" value="update" />
                    <input type="hidden" name="deviceId" value={device.id} />
                    <label className="text-sm font-bold">
                      اسم الجهاز
                      <input name="name" required minLength={2} defaultValue={device.name} className={inputClass} />
                    </label>
                    <label className="text-sm font-bold">
                      الفرع
                      <select name="branchId" required defaultValue={activeBranches.some((branch) => branch.id === device.branchId) ? device.branchId : activeBranches[0]?.id} className={inputClass}>
                        {activeBranches.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="submit" disabled={activeBranches.length === 0} title={activeBranches.length === 0 ? "أضف فرعًا نشطًا قبل تعديل الجهاز." : undefined} className="self-end rounded-lg bg-ink px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-ink/30">
                      حفظ
                    </button>
                  </form>
                  {activeBranches.length === 0 && <p className="mt-3 rounded-lg bg-date/10 p-3 text-sm font-bold text-date">أضف فرعًا نشطًا قبل تعديل الجهاز.</p>}
                  <form action="/api/devices" method="post" className="mt-3">
                    <input type="hidden" name="action" value="toggle" />
                    <input type="hidden" name="deviceId" value={device.id} />
                    <button type="submit" className={device.active ? "rounded-lg bg-date px-3 py-2 text-sm font-bold text-white" : "rounded-lg bg-mint px-3 py-2 text-sm font-bold text-white"}>
                      {device.active ? "تعطيل" : "تفعيل"}
                    </button>
                  </form>
                </div>
              ))
            ) : (
              <p className="rounded-lg bg-fog p-6 text-center text-sm font-bold text-ink/60">لا توجد أجهزة POS بعد.</p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
