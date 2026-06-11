export type PlanCode = "starter" | "growth" | "pro";

export type PlanLimit = {
  branches: number;
  posDevices: number;
  users: number;
};

export type PlanDefinition = {
  code: PlanCode;
  name: string;
  nameArabic: string;
  priceLabel: string;
  limits: PlanLimit;
  features: string[];
};

export const plans: PlanDefinition[] = [
  {
    code: "starter",
    name: "Starter",
    nameArabic: "ستارتر",
    priceLabel: "مناسب لبداية فرع واحد",
    limits: { branches: 1, posDevices: 1, users: 2 },
    features: ["فرع واحد", "جهاز POS واحد", "مستخدمان", "منتجات غير محدودة", "فواتير ضريبية أساسية مع QR", "تقارير أساسية"]
  },
  {
    code: "growth",
    name: "Growth",
    nameArabic: "جروث",
    priceLabel: "للمطاعم والكافيهات النامية",
    limits: { branches: 3, posDevices: 5, users: 10 },
    features: ["حتى 3 فروع", "حتى 5 أجهزة POS", "حتى 10 مستخدمين", "ورديات", "مرتجعات", "تقارير متقدمة"]
  },
  {
    code: "pro",
    name: "Pro",
    nameArabic: "برو",
    priceLabel: "لتوسع تشغيلي أوسع",
    limits: { branches: 10, posDevices: 20, users: 50 },
    features: ["حتى 10 فروع", "حتى 20 جهاز POS", "مستخدمون أكثر", "صلاحيات متقدمة", "تقارير تشغيلية وضريبية أوسع"]
  }
];

export function getPlan(code: PlanCode) {
  return plans.find((plan) => plan.code === code) ?? plans[0];
}

export function isPlanCode(value: string | undefined): value is PlanCode {
  return value === "starter" || value === "growth" || value === "pro";
}

export function getPlanFromString(value: string | undefined) {
  return getPlan(isPlanCode(value) ? value : "growth");
}

export function toPrismaPlanCode(code: PlanCode) {
  return code.toUpperCase() as "STARTER" | "GROWTH" | "PRO";
}

export function canCreateWithinPlan(plan: PlanDefinition, current: number, resource: keyof PlanLimit) {
  return current < plan.limits[resource];
}

export const planLimitMessage = "وصلت إلى الحد المسموح في باقتك الحالية. يرجى ترقية الباقة.";
