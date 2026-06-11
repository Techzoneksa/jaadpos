import { AppShell } from "@/components/app-shell";
import { products } from "@/lib/demo-data";

export default function ProductsPage() {
  return (
    <AppShell title="المنتجات والتصنيفات" allowedRoles={["TENANT_OWNER", "BRANCH_MANAGER"]}>
      <section className="surface rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black">منتجات المنشأة</h2>
          <button type="button" className="rounded-lg bg-mint px-4 py-2 text-sm font-black text-white">إضافة منتج</button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => (
            <div key={product.id} className="rounded-lg border border-ink/10 bg-fog p-4">
              <p className="text-xs text-ink/55">{product.category}</p>
              <h3 className="mt-2 text-lg font-black">{product.name}</h3>
              <p className="mt-2 font-bold text-mint">{product.price}.00 ر.س</p>
              <p className="mt-2 text-sm text-ink/60">نشط · متاح · ضريبة 15%</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
