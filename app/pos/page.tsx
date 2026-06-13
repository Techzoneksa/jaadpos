import { AppShell } from "@/components/app-shell";
import { PosTerminal, type PosProduct } from "@/components/pos-terminal";
import { requireTenantAccess } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";
import { canCreateFinancialRecords, expiredTrialMessage, normalizeSubscriptionStatus } from "@/lib/subscription";

export const dynamic = "force-dynamic";

type PosPageProps = {
  searchParams: Promise<{
    shiftStatus?: string;
  }>;
};

const shiftMessages = {
  opened: "تم فتح الوردية بنجاح.",
  already_open: "لديك وردية مفتوحة بالفعل.",
  forbidden: "لا تملك صلاحية تنفيذ هذا الإجراء.",
  invalid: "تعذر فتح الوردية. تأكد من البيانات وحاول مرة أخرى.",
  missing_setup: "أضف فرعًا وجهاز POS نشطًا قبل فتح الوردية.",
  error: "تعذر تنفيذ الإجراء. حاول مرة أخرى."
} as const;

export default async function PosPage({ searchParams }: PosPageProps) {
  const params = await searchParams;
  const session = await requireTenantAccess(["TENANT_OWNER", "BRANCH_MANAGER", "CASHIER"]);
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId! },
    include: {
      subscription: true,
      branches: {
        where: { active: true },
        orderBy: [{ isMain: "desc" }, { createdAt: "asc" }],
        take: 1
      },
      posDevices: {
        where: { active: true },
        orderBy: { createdAt: "asc" },
        take: 1
      },
      products: {
        where: { status: "ACTIVE", available: true, category: { status: "ACTIVE" } },
        orderBy: { createdAt: "asc" },
        include: { category: true }
      }
    }
  });

  const canSell = Boolean(
    tenant?.subscription &&
      canCreateFinancialRecords({
        status: normalizeSubscriptionStatus(tenant.subscription.status),
        trialEndsAt: tenant.subscription.trialEndsAt,
        tenantActive: tenant.status === "ACTIVE"
      })
  );

  const branch = tenant?.branches[0];
  const device = tenant?.posDevices[0];
  const openShift =
    tenant && branch && device
      ? await prisma.shift.findFirst({
          where: {
            tenantId: session.tenantId!,
            branchId: branch.id,
            deviceId: device.id,
            cashierId: session.userId,
            status: "OPEN"
          },
          select: { id: true }
        })
      : null;
  const products: PosProduct[] =
    tenant?.products.map((product) => ({
      id: product.id,
      name: product.nameArabic,
      category: product.category.nameArabic,
      price: Number(product.price)
    })) ?? [];
  const categories = [...new Set(products.map((product) => product.category))];

  return (
    <AppShell title="شاشة نقاط البيع" allowedRoles={["TENANT_OWNER", "BRANCH_MANAGER", "CASHIER"]}>
      {!tenant || !branch || !device ? (
        <section className="surface rounded-lg p-6">
          <h2 className="text-xl font-black">أكمل التهيئة أولًا</h2>
          <p className="mt-2 leading-7 text-ink/65">يجب إنشاء الفرع الرئيسي وجهاز POS من صفحة التهيئة قبل بدء البيع.</p>
        </section>
      ) : (
        <PosTerminal
          products={products}
          categories={categories}
          tenant={{
            name: tenant.name,
            vatNumber: tenant.vatNumber || "000000000000000",
            branchName: branch.name,
            deviceCode: device.code
          }}
          canSell={canSell}
          shiftOpen={Boolean(openShift)}
          blockedMessage={expiredTrialMessage}
          shiftMessage={params.shiftStatus ? shiftMessages[params.shiftStatus as keyof typeof shiftMessages] : null}
        />
      )}
    </AppShell>
  );
}
