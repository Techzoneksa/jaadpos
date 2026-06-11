import { Download } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { reportRows } from "@/lib/demo-data";

export default function ReportsPage() {
  return (
    <AppShell title="التقارير" allowedRoles={["TENANT_OWNER", "BRANCH_MANAGER", "ACCOUNTANT"]}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {reportRows.map((report) => (
          <div key={report.name} className="surface rounded-lg p-5">
            <p className="text-sm text-ink/60">{report.name}</p>
            <p className="mt-2 text-2xl font-black">{report.total}</p>
            <p className="mt-1 text-sm text-mint">{report.change}</p>
            <button type="button" className="mt-4 flex items-center gap-2 rounded-lg border border-ink/10 px-3 py-2 text-sm font-bold">
              <Download className="h-4 w-4" aria-hidden="true" />
              CSV
            </button>
          </div>
        ))}
      </div>
      <section className="surface mt-5 rounded-lg p-5">
        <h2 className="text-xl font-black">تقرير VAT</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          {[
            ["قبل الضريبة", "2,474.78 ر.س"],
            ["الضريبة", "371.22 ر.س"],
            ["شامل الضريبة", "2,846.00 ر.س"],
            ["المرتجعات", "360.00 ر.س"],
            ["صافي الضريبة", "324.26 ر.س"]
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-fog p-4">
              <p className="text-sm text-ink/60">{label}</p>
              <p className="mt-2 font-black">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 rounded-lg bg-sea/10 p-4 leading-7 text-sea">هذا التقرير يساعد المحاسب في مراجعة المبيعات والضريبة. تقديم الإقرار الضريبي يتم عبر بوابة زاتكا بواسطة المنشأة أو المحاسب.</p>
      </section>
    </AppShell>
  );
}
