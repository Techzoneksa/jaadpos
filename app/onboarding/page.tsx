import { redirect } from "next/navigation";
import { requireTenantAccess } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";
import { OnboardingForm } from "./onboarding-form";

const errorMessages = {
  invalid: "تعذر إكمال التهيئة. تأكد من البيانات وحاول مرة أخرى.",
  plan_limit: "وصلت إلى الحد المسموح في باقتك الحالية. يرجى ترقية الباقة."
} as const;

type OnboardingPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const session = await requireTenantAccess(["TENANT_OWNER"]);
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId! },
    select: {
      name: true,
      legalName: true,
      vatNumber: true,
      commercialRegistration: true,
      city: true,
      address: true,
      phone: true,
      onboardingCompleted: true
    }
  });

  if (tenant?.onboardingCompleted) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const errorMessage = params.error ? errorMessages[params.error as keyof typeof errorMessages] : null;

  return (
    <main className="min-h-screen bg-fog px-5 py-10" dir="rtl">
      <section className="mx-auto max-w-5xl">
        <p className="text-sm font-bold text-mint">Customer Console</p>
        <h1 className="mt-2 text-3xl font-black">استكمال التهيئة</h1>
        <p className="mt-2 max-w-3xl leading-7 text-ink/65">
          أكمل البيانات الأساسية لتجهيز حسابك وبدء استخدام نقاط البيع.
        </p>

        {errorMessage && <p className="mt-5 rounded-lg bg-date/10 p-4 text-sm font-bold text-date">{errorMessage}</p>}

        <OnboardingForm
          defaults={{
            commercialName: tenant?.name ?? "",
            legalName: tenant?.legalName ?? "",
            vatNumber: tenant?.vatNumber ?? "",
            commercialRegistration: tenant?.commercialRegistration ?? "",
            city: tenant?.city ?? "",
            address: tenant?.address ?? "",
            phone: tenant?.phone ?? ""
          }}
        />
      </section>
    </main>
  );
}
