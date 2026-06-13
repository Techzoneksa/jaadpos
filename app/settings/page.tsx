import { AppShell } from "@/components/app-shell";
import { requireTenantAccess } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";

const readonlyClass = "mt-1 w-full cursor-not-allowed rounded-lg border-ink/10 bg-fog text-ink/70";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireTenantAccess(["TENANT_OWNER"]);
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId! },
    include: {
      taxSettings: true,
      invoiceSettings: true
    }
  });

  return (
    <AppShell title="إعدادات المنشأة والضريبة والفاتورة" allowedRoles={["TENANT_OWNER"]}>
      <div className="mb-5 rounded-lg bg-date/10 p-4 text-sm font-bold text-date">
        تعديل الإعدادات من هذه الصفحة غير متاح في هذه المرحلة.
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <section className="surface rounded-lg p-5">
          <h2 className="text-xl font-black">بيانات المنشأة</h2>
          <div className="mt-4 space-y-3 text-sm">
            {[
              ["الاسم التجاري", tenant?.name ?? ""],
              ["الاسم القانوني", tenant?.legalName ?? ""],
              ["الرقم الضريبي", tenant?.vatNumber ?? ""],
              ["السجل التجاري", tenant?.commercialRegistration ?? ""],
              ["العنوان", tenant?.address ?? ""],
              ["المدينة", tenant?.city ?? ""],
              ["الجوال", tenant?.phone ?? ""],
              ["البريد", tenant?.email ?? ""]
            ].map(([field, value]) => (
              <label key={field} className="block">
                <span className="font-bold">{field}</span>
                <input readOnly className={readonlyClass} value={value} />
              </label>
            ))}
          </div>
        </section>
        <section className="surface rounded-lg p-5">
          <h2 className="text-xl font-black">إعدادات الفاتورة</h2>
          <div className="mt-4 space-y-3 text-sm">
            {[
              ["نص أسفل الفاتورة", tenant?.invoiceSettings?.footerText ?? ""],
              ["بادئة رقم الفاتورة", tenant?.invoiceSettings?.invoicePrefix ?? "INV"],
              ["شكل رقم الفاتورة", tenant?.invoiceSettings?.invoiceNumberFormat ?? "YYYY-00000"]
            ].map(([field, value]) => (
              <label key={field} className="block">
                <span className="font-bold">{field}</span>
                <input readOnly className={readonlyClass} value={value} />
              </label>
            ))}
            <label className="flex items-center gap-2 rounded-lg bg-fog p-3 font-bold text-ink/70">
              <input type="checkbox" checked={tenant?.invoiceSettings?.qrEnabled ?? true} readOnly className="rounded border-ink/20 text-mint" />
              تفعيل QR
            </label>
          </div>
        </section>
        <section className="surface rounded-lg p-5">
          <h2 className="text-xl font-black">الضريبة والفوترة</h2>
          <div className="mt-4 space-y-3 text-sm">
            <label className="block">
              <span className="font-bold">نسبة الضريبة الافتراضية</span>
              <input readOnly className={readonlyClass} value={`${Number(tenant?.taxSettings?.defaultTaxRate ?? 0.15) * 100}%`} />
            </label>
            <label className="flex items-center gap-2 rounded-lg bg-fog p-3 font-bold text-ink/70">
              <input type="checkbox" checked={tenant?.taxSettings?.pricesIncludeTax ?? false} readOnly className="rounded border-ink/20 text-mint" />
              الأسعار شاملة الضريبة
            </label>
            <div className="rounded-lg bg-fog p-4">
              <p className="font-black">وضع الفوترة الحالي: Basic QR E-Invoice</p>
              <p className="mt-2 text-ink/65">يمكنك مراجعة بيانات الفاتورة والضريبة الحالية من هذه الصفحة.</p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
