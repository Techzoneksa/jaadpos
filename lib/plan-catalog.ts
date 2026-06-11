import { prisma } from "@/lib/prisma";
import { plans, toPrismaPlanCode } from "@/lib/plans";

export async function ensurePlanCatalog() {
  await Promise.all(
    plans.map((plan) =>
      prisma.plan.upsert({
        where: { code: toPrismaPlanCode(plan.code) },
        update: {
          nameArabic: plan.nameArabic,
          nameEnglish: plan.name,
          maxBranches: plan.limits.branches,
          maxPosDevices: plan.limits.posDevices,
          maxUsers: plan.limits.users,
          features: plan.features
        },
        create: {
          code: toPrismaPlanCode(plan.code),
          nameArabic: plan.nameArabic,
          nameEnglish: plan.name,
          monthlyPrice: 0,
          maxBranches: plan.limits.branches,
          maxPosDevices: plan.limits.posDevices,
          maxUsers: plan.limits.users,
          features: plan.features
        }
      })
    )
  );
}
