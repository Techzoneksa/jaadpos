import { AppShell } from "@/components/app-shell";
import { requireTenantAccess } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";

type ShiftsPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const money = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR"
});

const paymentLabels = {
  CASH: "مبيعات نقدية",
  MADA: "مدى",
  VISA_MASTERCARD: "Visa/Mastercard",
  APPLE_PAY: "Apple Pay"
} as const;

const statusMessages = {
  closed: "تم إغلاق الوردية بنجاح.",
  invalid: "تعذر إغلاق الوردية. تأكد من النقد الفعلي وحاول مرة أخرى.",
  forbidden: "لا تملك صلاحية تنفيذ هذا الإجراء.",
  missing: "لا توجد وردية مفتوحة قابلة للإغلاق."
} as const;

export const dynamic = "force-dynamic";

export default async function ShiftsPage({ searchParams }: ShiftsPageProps) {
  const params = await searchParams;
  const session = await requireTenantAccess(["TENANT_OWNER", "BRANCH_MANAGER"]);
  const message = params.status ? statusMessages[params.status as keyof typeof statusMessages] : null;
  const shift = await prisma.shift.findFirst({
    where: {
      tenantId: session.tenantId!,
      status: "OPEN"
    },
    orderBy: { openedAt: "desc" },
    include: {
      branch: { select: { name: true } },
      device: { select: { code: true, name: true } },
      cashier: { select: { name: true } },
      orders: {
        where: { status: "PAID" },
        include: { payments: true }
      }
    }
  });

  const paymentTotals = {
    CASH: 0,
    MADA: 0,
    VISA_MASTERCARD: 0,
    APPLE_PAY: 0
  };

  if (shift) {
    for (const order of shift.orders) {
      for (const payment of order.payments) {
        paymentTotals[payment.method] += Number(payment.amount);
      }
    }
  }

  const salesTotal = Object.values(paymentTotals).reduce((sum, value) => sum + value, 0);
  const expectedCash = Number(shift?.openingFloat ?? 0) + paymentTotals.CASH;

  return (
    <AppShell title="الورديات" allowedRoles={["TENANT_OWNER", "BRANCH_MANAGER"]}>
      {message && <p className="mb-5 rounded-lg bg-mint/10 p-4 text-sm font-bold text-mint">{message}</p>}
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="surface rounded-lg p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">{shift ? `وردية ${shift.branch.name}` : "لا توجد وردية مفتوحة"}</h2>
              {shift && <p className="mt-1 text-sm text-ink/60">{shift.device.name} · {shift.device.code} · {shift.cashier.name}</p>}
            </div>
            <span className={shift ? "rounded-full bg-mint/10 px-3 py-1 text-sm font-bold text-mint" : "rounded-full bg-ink/10 px-3 py-1 text-sm font-bold text-ink/50"}>
              {shift ? "مفتوحة" : "لا يوجد"}
            </span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              ["بداية الصندوق", money.format(Number(shift?.openingFloat ?? 0))],
              ["إجمالي المبيعات", money.format(salesTotal)],
              ["النقد المتوقع", money.format(expectedCash)],
              ...Object.entries(paymentTotals).map(([method, value]) => [paymentLabels[method as keyof typeof paymentLabels], money.format(value)])
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
          {shift ? (
            <form action="/api/shifts/close" method="post">
              <input type="hidden" name="shiftId" value={shift.id} />
              <label className="mt-4 block text-sm font-bold">
                النقد الفعلي
                <input name="closingCash" required type="number" min="0" step="0.01" className="mt-2 w-full rounded-lg border-ink/10" placeholder="0.00" />
              </label>
              <button type="submit" className="mt-4 w-full rounded-lg bg-ink px-4 py-3 font-black text-white">إقفال الوردية</button>
            </form>
          ) : (
            <div className="mt-4 rounded-lg bg-fog p-4 text-sm font-bold text-ink/60">
              لا توجد وردية مفتوحة قابلة للإغلاق.
            </div>
          )}
        </aside>
      </div>
    </AppShell>
  );
}
