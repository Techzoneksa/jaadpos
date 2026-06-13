import type { Prisma } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { requireTenantAccess } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";

type ShiftsPageProps = {
  searchParams: Promise<{
    shiftStatus?: string;
    status?: string;
  }>;
};

const money = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR"
});

const statusMessages = {
  opened: "تم فتح الوردية بنجاح.",
  already_open: "لديك وردية مفتوحة بالفعل.",
  closed: "تم إغلاق الوردية بنجاح.",
  invalid: "تعذر تنفيذ الإجراء. تأكد من البيانات وحاول مرة أخرى.",
  forbidden: "لا تملك صلاحية تنفيذ هذا الإجراء.",
  missing: "لا توجد وردية مفتوحة قابلة للإغلاق.",
  missing_setup: "أضف فرعًا وجهاز POS نشطًا قبل فتح الوردية.",
  error: "تعذر تنفيذ الإجراء. حاول مرة أخرى."
} as const;

const shiftInclude = {
  branch: { select: { name: true } },
  device: { select: { code: true, name: true } },
  cashier: { select: { name: true } },
  orders: {
    include: {
      payments: true,
      refunds: true
    }
  }
} satisfies Prisma.ShiftInclude;

export const dynamic = "force-dynamic";

export default async function ShiftsPage({ searchParams }: ShiftsPageProps) {
  const params = await searchParams;
  const session = await requireTenantAccess(["TENANT_OWNER", "BRANCH_MANAGER", "CASHIER", "ACCOUNTANT"]);
  const messageKey = params.shiftStatus ?? params.status;
  const message = messageKey ? statusMessages[messageKey as keyof typeof statusMessages] : null;
  const canOperate = ["TENANT_OWNER", "BRANCH_MANAGER", "CASHIER"].includes(session.role);
  const currentUser = await prisma.user.findFirst({
    where: { id: session.userId, tenantId: session.tenantId! },
    select: { branchId: true }
  });

  const openShiftWhere = {
    tenantId: session.tenantId!,
    status: "OPEN" as const,
    ...(session.role === "CASHIER" ? { cashierId: session.userId } : {}),
    ...(session.role === "BRANCH_MANAGER" && currentUser?.branchId ? { branchId: currentUser.branchId } : {})
  };

  const [openShift, recentShifts, activeBranch, activeDevice] = await Promise.all([
    prisma.shift.findFirst({
      where: openShiftWhere,
      orderBy: { openedAt: "desc" },
      include: shiftInclude
    }),
    prisma.shift.findMany({
      where: {
        tenantId: session.tenantId!,
        ...(session.role === "CASHIER" ? { cashierId: session.userId } : {}),
        ...(session.role === "BRANCH_MANAGER" && currentUser?.branchId ? { branchId: currentUser.branchId } : {})
      },
      orderBy: { openedAt: "desc" },
      take: 12,
      include: shiftInclude
    }),
    prisma.branch.findFirst({
      where: {
        tenantId: session.tenantId!,
        active: true,
        ...(currentUser?.branchId ? { id: currentUser.branchId } : {})
      },
      orderBy: [{ isMain: "desc" }, { createdAt: "asc" }]
    }),
    prisma.posDevice.findFirst({
      where: {
        tenantId: session.tenantId!,
        active: true,
        ...(currentUser?.branchId ? { branchId: currentUser.branchId } : {})
      },
      orderBy: { createdAt: "asc" }
    })
  ]);

  const openSummary = openShift ? summarizeShift(openShift) : null;

  return (
    <AppShell title="الورديات" allowedRoles={["TENANT_OWNER", "BRANCH_MANAGER", "CASHIER", "ACCOUNTANT"]}>
      {message && <p className="mb-5 rounded-lg bg-mint/10 p-4 text-sm font-bold text-mint">{message}</p>}
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <section className="surface rounded-lg p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">{openShift ? `وردية ${openShift.branch.name}` : "لا توجد وردية مفتوحة"}</h2>
              {openShift && <p className="mt-1 text-sm text-ink/60">{openShift.device.name} · {openShift.device.code} · {openShift.cashier.name}</p>}
            </div>
            <span className={openShift ? "rounded-full bg-mint/10 px-3 py-1 text-sm font-bold text-mint" : "rounded-full bg-ink/10 px-3 py-1 text-sm font-bold text-ink/50"}>
              {openShift ? "مفتوحة" : "لا يوجد"}
            </span>
          </div>

          {openSummary ? (
            <SummaryGrid summary={openSummary} openedAt={openShift!.openedAt} closedAt={openShift!.closedAt} />
          ) : (
            <div className="mt-5 rounded-lg bg-fog p-6 text-center text-sm font-bold text-ink/60">افتح وردية قبل بدء البيع من شاشة POS أو من هذه الصفحة.</div>
          )}
        </section>

        <aside className="surface rounded-lg p-5">
          <h2 className="text-xl font-black">{openShift ? "إغلاق الوردية" : "فتح وردية"}</h2>
          {!canOperate ? (
            <div className="mt-4 rounded-lg bg-ink/10 p-4 text-sm font-bold text-ink/55">لا تملك صلاحية تنفيذ هذا الإجراء.</div>
          ) : openShift ? (
            <form action="/api/shifts/close" method="post" className="mt-4">
              <input type="hidden" name="shiftId" value={openShift.id} />
              <input type="hidden" name="returnTo" value="/shifts" />
              <label className="block text-sm font-bold">
                النقد الفعلي
                <input name="closingCash" required type="number" min="0" step="0.01" className="mt-2 w-full rounded-lg border-ink/10" placeholder="0.00" />
              </label>
              <button type="submit" className="mt-4 w-full rounded-lg bg-ink px-4 py-3 font-black text-white">إغلاق الوردية</button>
            </form>
          ) : activeBranch && activeDevice ? (
            <form action="/api/shifts/open" method="post" className="mt-4">
              <input type="hidden" name="returnTo" value="/shifts" />
              <div className="rounded-lg bg-fog p-4 text-sm">
                <p><strong>الفرع:</strong> {activeBranch.name}</p>
                <p className="mt-1"><strong>الجهاز:</strong> {activeDevice.name}</p>
              </div>
              <label className="mt-4 block text-sm font-bold">
                بداية الصندوق
                <input name="openingFloat" required type="number" min="0" step="0.01" className="mt-2 w-full rounded-lg border-ink/10" defaultValue="0" />
              </label>
              <button type="submit" className="mt-4 w-full rounded-lg bg-mint px-4 py-3 font-black text-white">فتح وردية</button>
            </form>
          ) : (
            <div className="mt-4 rounded-lg bg-date/10 p-4 text-sm font-bold text-date">أضف فرعًا وجهاز POS نشطًا قبل فتح الوردية.</div>
          )}
        </aside>
      </div>

      <section className="surface mt-5 rounded-lg p-5">
        <h2 className="text-xl font-black">آخر الورديات</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-fog text-ink/60">
              <tr>
                <th className="p-3 text-right">الافتتاح</th>
                <th className="p-3 text-right">الإغلاق</th>
                <th className="p-3 text-right">الكاشير</th>
                <th className="p-3 text-right">الفرع</th>
                <th className="p-3 text-right">الجهاز</th>
                <th className="p-3 text-right">الطلبات</th>
                <th className="p-3 text-right">المبيعات</th>
                <th className="p-3 text-right">المرتجعات</th>
                <th className="p-3 text-right">الصافي</th>
                <th className="p-3 text-right">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {recentShifts.length ? (
                recentShifts.map((shift) => {
                  const summary = summarizeShift(shift);
                  return (
                    <tr key={shift.id} className="border-b border-ink/10">
                      <td className="p-3">{shift.openedAt.toLocaleString("ar-SA")}</td>
                      <td className="p-3">{shift.closedAt ? shift.closedAt.toLocaleString("ar-SA") : "-"}</td>
                      <td className="p-3">{shift.cashier.name}</td>
                      <td className="p-3">{shift.branch.name}</td>
                      <td className="p-3">{shift.device.code}</td>
                      <td className="p-3">{summary.orderCount}</td>
                      <td className="p-3 font-bold">{money.format(summary.salesTotal)}</td>
                      <td className="p-3">{money.format(summary.refundTotal)}</td>
                      <td className="p-3 font-bold">{money.format(summary.netTotal)}</td>
                      <td className="p-3">{shift.status === "OPEN" ? "مفتوحة" : "مغلقة"}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="p-5 text-center text-ink/55" colSpan={10}>لا توجد ورديات بعد.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

type ShiftWithSummary = Prisma.ShiftGetPayload<{ include: typeof shiftInclude }>;

function summarizeShift(shift: ShiftWithSummary) {
  const paymentTotals = {
    CASH: 0,
    MADA: 0,
    VISA_MASTERCARD: 0,
    APPLE_PAY: 0
  };
  let refundTotal = 0;

  for (const order of shift.orders) {
    for (const payment of order.payments) {
      paymentTotals[payment.method] += Number(payment.amount);
    }
    for (const refund of order.refunds) {
      refundTotal += Number(refund.amount);
    }
  }

  const salesTotal = Object.values(paymentTotals).reduce((sum, value) => sum + value, 0);
  return {
    orderCount: shift.orders.length,
    paymentTotals,
    salesTotal,
    refundTotal,
    netTotal: salesTotal - refundTotal,
    openingFloat: Number(shift.openingFloat),
    closingCash: shift.closingCash === null ? null : Number(shift.closingCash)
  };
}

function SummaryGrid({ summary, openedAt, closedAt }: { summary: ReturnType<typeof summarizeShift>; openedAt: Date; closedAt: Date | null }) {
  const items = [
    ["وقت الفتح", openedAt.toLocaleString("ar-SA")],
    ["وقت الإغلاق", closedAt ? closedAt.toLocaleString("ar-SA") : "لم تغلق بعد"],
    ["عدد الطلبات", String(summary.orderCount)],
    ["إجمالي المبيعات", money.format(summary.salesTotal)],
    ["النقد", money.format(summary.paymentTotals.CASH)],
    ["البطاقة", money.format(summary.paymentTotals.MADA + summary.paymentTotals.VISA_MASTERCARD + summary.paymentTotals.APPLE_PAY)],
    ["المرتجعات", money.format(summary.refundTotal)],
    ["الصافي", money.format(summary.netTotal)],
    ["بداية الصندوق", money.format(summary.openingFloat)],
    ["النقد عند الإغلاق", summary.closingCash === null ? "-" : money.format(summary.closingCash)]
  ];

  return (
    <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-5">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-lg bg-fog p-4">
          <p className="text-sm text-ink/60">{label}</p>
          <p className="mt-2 font-black">{value}</p>
        </div>
      ))}
    </div>
  );
}
