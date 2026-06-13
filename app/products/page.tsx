import { AppShell } from "@/components/app-shell";
import { UnavailableAction } from "@/components/unavailable-action";
import { requireTenantAccess } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";

const money = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR"
});

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const session = await requireTenantAccess(["TENANT_OWNER", "BRANCH_MANAGER"]);
  const products = await prisma.product.findMany({
    where: { tenantId: session.tenantId! },
    orderBy: { createdAt: "desc" },
    include: { category: true }
  });

  return (
    <AppShell title="المنتجات والتصنيفات" allowedRoles={["TENANT_OWNER", "BRANCH_MANAGER"]}>
      <section className="surface rounded-lg p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">منتجات المنشأة</h2>
            <p className="mt-1 text-sm text-ink/60">تظهر هنا المنتجات التي أُنشئت أثناء التهيئة أو من قاعدة بيانات المنشأة.</p>
          </div>
          <UnavailableAction label="إضافة منتج" />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {products.length ? (
            products.map((product) => (
              <div key={product.id} className="rounded-lg border border-ink/10 bg-fog p-4">
                <p className="text-xs text-ink/55">{product.category.nameArabic}</p>
                <h3 className="mt-2 text-lg font-black">{product.nameArabic}</h3>
                <p className="mt-2 font-bold text-mint">{money.format(Number(product.price))}</p>
                <p className="mt-2 text-sm text-ink/60">
                  {product.status === "ACTIVE" ? "نشط" : "غير نشط"} · {product.available ? "متاح" : "غير متاح"} · ضريبة {Number(product.taxRate) * 100}%
                </p>
              </div>
            ))
          ) : (
            <p className="rounded-lg bg-fog p-5 text-center text-sm font-bold text-ink/60 md:col-span-2 xl:col-span-4">
              لا توجد منتجات بعد. يمكنك استخدام خيار المنتجات التجريبية أثناء التهيئة.
            </p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
