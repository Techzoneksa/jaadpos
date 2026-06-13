import { AppShell } from "@/components/app-shell";
import { getTenantPlanUsage, isNearLimit, usageText } from "@/lib/plan-limits";
import { requireTenantAccess } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";

type ProductsPageProps = {
  searchParams: Promise<{
    status?: string;
    categoryStatus?: string;
  }>;
};

const money = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR"
});

const productMessages = {
  created: "تمت إضافة المنتج بنجاح.",
  updated: "تم حفظ بيانات المنتج.",
  enabled: "تم تفعيل المنتج.",
  disabled: "تم تعطيل المنتج.",
  limit: "وصلت إلى حد المنتجات في باقتك الحالية.",
  category_missing: "اختر تصنيفًا صحيحًا قبل حفظ المنتج.",
  invalid: "تعذر حفظ المنتج. تأكد من البيانات وحاول مرة أخرى.",
  missing: "لم يتم العثور على المنتج.",
  forbidden: "لا تملك صلاحية تنفيذ هذا الإجراء.",
  error: "تعذر تنفيذ الإجراء. حاول مرة أخرى."
} as const;

const categoryMessages = {
  created: "تمت إضافة التصنيف بنجاح.",
  updated: "تم حفظ التصنيف.",
  enabled: "تم تفعيل التصنيف.",
  disabled: "تم تعطيل التصنيف. لن تظهر منتجاته في شاشة البيع.",
  invalid: "تعذر حفظ التصنيف. تأكد من البيانات وحاول مرة أخرى.",
  missing: "لم يتم العثور على التصنيف.",
  forbidden: "لا تملك صلاحية تنفيذ هذا الإجراء.",
  error: "تعذر تنفيذ الإجراء. حاول مرة أخرى."
} as const;

const inputClass = "mt-2 w-full rounded-lg border-ink/10 bg-white";

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const session = await requireTenantAccess(["TENANT_OWNER", "BRANCH_MANAGER"]);
  const [{ usage, limits }, categories, products] = await Promise.all([
    getTenantPlanUsage(session.tenantId!),
    prisma.category.findMany({
      where: { tenantId: session.tenantId! },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { products: true } } }
    }),
    prisma.product.findMany({
      where: { tenantId: session.tenantId! },
      orderBy: { createdAt: "desc" },
      include: { category: true }
    })
  ]);
  const activeCategories = categories.filter((category) => category.status === "ACTIVE");
  const canCreateProduct = usage.products < limits.products && activeCategories.length > 0;
  const productMessage = params.status ? productMessages[params.status as keyof typeof productMessages] : null;
  const categoryMessage = params.categoryStatus ? categoryMessages[params.categoryStatus as keyof typeof categoryMessages] : null;

  return (
    <AppShell title="المنتجات والتصنيفات" allowedRoles={["TENANT_OWNER", "BRANCH_MANAGER"]}>
      {productMessage && <p className="mb-5 rounded-lg bg-mint/10 p-4 text-sm font-bold text-mint">{productMessage}</p>}
      {categoryMessage && <p className="mb-5 rounded-lg bg-sea/10 p-4 text-sm font-bold text-sea">{categoryMessage}</p>}
      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <aside className="space-y-5">
          <section className="surface rounded-lg p-5">
            <div className="rounded-lg bg-fog p-4">
              <p className="text-sm font-bold text-ink/60">استخدام الباقة</p>
              <p className="mt-2 text-xl font-black">{usageText("products", usage, limits)}</p>
              {isNearLimit("products", usage, limits) && <p className="mt-2 text-sm font-bold text-date">اقتربت من حد المنتجات في الباقة الحالية.</p>}
            </div>
            <h2 className="mt-5 text-xl font-black">إضافة منتج</h2>
            {canCreateProduct ? (
              <form action="/api/products" method="post" className="mt-4 space-y-4">
                <input type="hidden" name="action" value="create" />
                <label className="block text-sm font-bold">
                  التصنيف
                  <select name="categoryId" required className={inputClass} defaultValue={activeCategories[0]?.id ?? ""}>
                    {activeCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.nameArabic}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-bold">
                  اسم المنتج
                  <input name="nameArabic" required minLength={2} className={inputClass} />
                </label>
                <label className="block text-sm font-bold">
                  الاسم الإنجليزي
                  <input name="nameEnglish" className={inputClass} />
                </label>
                <label className="block text-sm font-bold">
                  SKU
                  <input name="sku" className={inputClass} dir="ltr" />
                </label>
                <label className="block text-sm font-bold">
                  السعر
                  <input name="price" type="number" required min="0.01" step="0.01" className={inputClass} />
                </label>
                <label className="block text-sm font-bold">
                  الأسعار شاملة الضريبة؟
                  <select name="pricesIncludeTax" className={inputClass} defaultValue="no">
                    <option value="no">لا</option>
                    <option value="yes">نعم</option>
                  </select>
                </label>
                <button type="submit" className="w-full rounded-lg bg-mint px-4 py-3 font-black text-white">
                  إضافة منتج
                </button>
              </form>
            ) : (
              <div className="mt-4 rounded-lg bg-date/10 p-4 text-sm font-bold text-date">
                {activeCategories.length === 0 ? "أضف تصنيفًا نشطًا قبل إنشاء المنتجات." : "هذه الميزة غير متاحة في باقتك الحالية لأنك وصلت إلى حد المنتجات."}
              </div>
            )}
          </section>

          <section className="surface rounded-lg p-5">
            <h2 className="text-xl font-black">التصنيفات</h2>
            <form action="/api/categories" method="post" className="mt-4 grid gap-3">
              <input type="hidden" name="action" value="create" />
              <label className="text-sm font-bold">
                اسم التصنيف
                <input name="nameArabic" required minLength={2} className={inputClass} />
              </label>
              <label className="text-sm font-bold">
                الاسم الإنجليزي
                <input name="nameEnglish" className={inputClass} />
              </label>
              <button type="submit" className="rounded-lg bg-ink px-4 py-3 text-sm font-black text-white">
                إضافة تصنيف
              </button>
            </form>
            <div className="mt-5 space-y-3">
              {categories.length ? (
                categories.map((category) => (
                  <div key={category.id} className="rounded-lg bg-fog p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-black">{category.nameArabic}</h3>
                        <p className="text-xs text-ink/55">{category._count.products} منتج</p>
                      </div>
                      <span className={category.status === "ACTIVE" ? "rounded-lg bg-mint/10 px-3 py-1 text-xs font-bold text-mint" : "rounded-lg bg-date/10 px-3 py-1 text-xs font-bold text-date"}>
                        {category.status === "ACTIVE" ? "نشط" : "معطل"}
                      </span>
                    </div>
                    <form action="/api/categories" method="post" className="mt-3 grid gap-2">
                      <input type="hidden" name="action" value="update" />
                      <input type="hidden" name="categoryId" value={category.id} />
                      <input name="nameArabic" required minLength={2} defaultValue={category.nameArabic} className="w-full rounded-lg border-ink/10 bg-white text-sm" />
                      <input name="nameEnglish" defaultValue={category.nameEnglish ?? ""} className="w-full rounded-lg border-ink/10 bg-white text-sm" />
                      <button type="submit" className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm font-bold">
                        حفظ التصنيف
                      </button>
                    </form>
                    <form action="/api/categories" method="post" className="mt-2">
                      <input type="hidden" name="action" value="toggle" />
                      <input type="hidden" name="categoryId" value={category.id} />
                      <button type="submit" className={category.status === "ACTIVE" ? "rounded-lg bg-date px-3 py-2 text-sm font-bold text-white" : "rounded-lg bg-mint px-3 py-2 text-sm font-bold text-white"}>
                        {category.status === "ACTIVE" ? "تعطيل التصنيف" : "تفعيل التصنيف"}
                      </button>
                    </form>
                  </div>
                ))
              ) : (
                <p className="rounded-lg bg-fog p-4 text-center text-sm font-bold text-ink/60">لا توجد تصنيفات بعد.</p>
              )}
            </div>
          </section>
        </aside>

        <section className="surface rounded-lg p-5">
          <div>
            <h2 className="text-xl font-black">منتجات المنشأة</h2>
            <p className="mt-1 text-sm text-ink/60">المنتجات النشطة ضمن التصنيفات النشطة فقط تظهر في شاشة البيع.</p>
          </div>
          <div className="mt-5 grid gap-4">
            {products.length ? (
              products.map((product) => (
                <div key={product.id} className="rounded-lg border border-ink/10 bg-fog p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-ink/55">{product.category.nameArabic}</p>
                      <h3 className="mt-1 text-lg font-black">{product.nameArabic}</h3>
                      <p className="mt-1 font-bold text-mint">{money.format(Number(product.price))}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={product.status === "ACTIVE" ? "rounded-lg bg-mint/10 px-3 py-2 text-sm font-bold text-mint" : "rounded-lg bg-date/10 px-3 py-2 text-sm font-bold text-date"}>
                        {product.status === "ACTIVE" ? "منتج نشط" : "منتج معطل"}
                      </span>
                      <span className={product.category.status === "ACTIVE" ? "rounded-lg bg-sea/10 px-3 py-2 text-sm font-bold text-sea" : "rounded-lg bg-date/10 px-3 py-2 text-sm font-bold text-date"}>
                        {product.category.status === "ACTIVE" ? "تصنيف نشط" : "تصنيف معطل"}
                      </span>
                    </div>
                  </div>
                  <form action="/api/products" method="post" className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <input type="hidden" name="action" value="update" />
                    <input type="hidden" name="productId" value={product.id} />
                    <label className="text-sm font-bold">
                      التصنيف
                      <select name="categoryId" required defaultValue={product.categoryId} className={inputClass}>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.nameArabic}{category.status === "INACTIVE" ? " - معطل" : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm font-bold">
                      اسم المنتج
                      <input name="nameArabic" required minLength={2} defaultValue={product.nameArabic} className={inputClass} />
                    </label>
                    <label className="text-sm font-bold">
                      الاسم الإنجليزي
                      <input name="nameEnglish" defaultValue={product.nameEnglish ?? ""} className={inputClass} />
                    </label>
                    <label className="text-sm font-bold">
                      SKU
                      <input name="sku" defaultValue={product.sku ?? ""} className={inputClass} dir="ltr" />
                    </label>
                    <label className="text-sm font-bold">
                      السعر
                      <input name="price" required type="number" min="0.01" step="0.01" defaultValue={Number(product.price).toFixed(2)} className={inputClass} />
                    </label>
                    <label className="text-sm font-bold">
                      الأسعار شاملة الضريبة؟
                      <select name="pricesIncludeTax" defaultValue={product.pricesIncludeTax ? "yes" : "no"} className={inputClass}>
                        <option value="no">لا</option>
                        <option value="yes">نعم</option>
                      </select>
                    </label>
                    <label className="text-sm font-bold">
                      حالة المنتج
                      <select name="status" defaultValue={product.status} className={inputClass}>
                        <option value="ACTIVE">نشط</option>
                        <option value="INACTIVE">معطل</option>
                      </select>
                    </label>
                    <button type="submit" className="rounded-lg bg-ink px-4 py-3 text-sm font-black text-white md:col-span-2 xl:col-span-3">
                      حفظ المنتج
                    </button>
                  </form>
                  <form action="/api/products" method="post" className="mt-3">
                    <input type="hidden" name="action" value="toggle" />
                    <input type="hidden" name="productId" value={product.id} />
                    <button type="submit" className={product.status === "ACTIVE" ? "rounded-lg bg-date px-3 py-2 text-sm font-bold text-white" : "rounded-lg bg-mint px-3 py-2 text-sm font-bold text-white"}>
                      {product.status === "ACTIVE" ? "تعطيل المنتج" : "تفعيل المنتج"}
                    </button>
                  </form>
                </div>
              ))
            ) : (
              <p className="rounded-lg bg-fog p-6 text-center text-sm font-bold text-ink/60">لا توجد منتجات بعد.</p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
