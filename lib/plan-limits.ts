import { prisma } from "@/lib/prisma";
import { getPlanFromString, type PlanLimit } from "@/lib/plans";

export type PlanResource = keyof PlanLimit;

export type PlanUsage = Record<PlanResource, number>;

export class PlanLimitError extends Error {
  constructor(
    public resource: PlanResource,
    public limit: number
  ) {
    super("PLAN_LIMIT_REACHED");
  }
}

export const planLimitReachedMessage = "وصلت إلى الحد الأقصى في باقتك الحالية. يمكنك ترقية الباقة من لوحة الاشتراك.";

const resourceLabels: Record<PlanResource, string> = {
  branches: "الفروع",
  posDevices: "أجهزة POS",
  users: "المستخدمون",
  products: "المنتجات"
};

function normalizePlanCode(code: string) {
  return code.toLowerCase();
}

export function getPlanLimits(planCode: string) {
  return getPlanFromString(normalizePlanCode(planCode)).limits;
}

export async function getCurrentUsage(tenantId: string): Promise<PlanUsage> {
  const [branches, posDevices, users, products] = await Promise.all([
    prisma.branch.count({ where: { tenantId } }),
    prisma.posDevice.count({ where: { tenantId } }),
    prisma.user.count({ where: { tenantId } }),
    prisma.product.count({ where: { tenantId } })
  ]);

  return { branches, posDevices, users, products };
}

export async function getTenantPlanUsage(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true }
  });

  if (!tenant) {
    throw new Error("TENANT_NOT_FOUND");
  }

  const limits = getPlanLimits(tenant.plan.code);
  const usage = await getCurrentUsage(tenantId);

  return {
    tenant,
    limits,
    usage
  };
}

export async function assertWithinPlanLimit(tenantId: string, resource: PlanResource, increment = 1) {
  const { limits, usage } = await getTenantPlanUsage(tenantId);
  const nextValue = usage[resource] + increment;

  if (nextValue > limits[resource]) {
    throw new PlanLimitError(resource, limits[resource]);
  }

  return { limits, usage };
}

export function usageText(resource: PlanResource, usage: PlanUsage, limits: PlanLimit) {
  return `${resourceLabels[resource]} المستخدمة: ${usage[resource]} من ${limits[resource]}`;
}

export function isNearLimit(resource: PlanResource, usage: PlanUsage, limits: PlanLimit) {
  return limits[resource] > 0 && usage[resource] / limits[resource] >= 0.8;
}
