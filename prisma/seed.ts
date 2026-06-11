import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/session";
import { trialEndsFrom } from "../lib/subscription";

const prisma = new PrismaClient();

const productSeed = [
  ["قهوة أمريكية", "قهوة", 12],
  ["لاتيه", "قهوة", 16],
  ["كابتشينو", "قهوة", 15],
  ["سبانش لاتيه", "قهوة", 19],
  ["موهيتو فراولة", "مشروبات باردة", 18],
  ["كرواسون زبدة", "مخبوزات", 10],
  ["تشيز كيك", "حلويات", 22],
  ["ساندويتش دجاج", "ساندويتشات", 24]
] as const;

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for seeding`);
  }
  return value;
}

async function main() {
  const now = new Date();
  const platformOwnerPassword = await hashPassword(requireEnv("SEED_PLATFORM_OWNER_PASSWORD"));
  const ownerPassword = await hashPassword(requireEnv("SEED_OWNER_PASSWORD"));
  const cashierPassword = await hashPassword(requireEnv("SEED_CASHIER_PASSWORD"));
  const accountantPassword = await hashPassword(requireEnv("SEED_ACCOUNTANT_PASSWORD"));

  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { code: "STARTER" },
      update: {},
      create: {
        code: "STARTER",
        nameArabic: "ستارتر",
        nameEnglish: "Starter",
        monthlyPrice: 0,
        maxBranches: 1,
        maxPosDevices: 1,
        maxUsers: 2,
        features: ["فرع واحد", "جهاز POS واحد", "مستخدمان", "فواتير ضريبية أساسية مع QR", "تقارير أساسية"]
      }
    }),
    prisma.plan.upsert({
      where: { code: "GROWTH" },
      update: {},
      create: {
        code: "GROWTH",
        nameArabic: "جروث",
        nameEnglish: "Growth",
        monthlyPrice: 0,
        maxBranches: 3,
        maxPosDevices: 5,
        maxUsers: 10,
        features: ["حتى 3 فروع", "حتى 5 أجهزة POS", "حتى 10 مستخدمين", "ورديات", "مرتجعات", "تقارير متقدمة"]
      }
    }),
    prisma.plan.upsert({
      where: { code: "PRO" },
      update: {},
      create: {
        code: "PRO",
        nameArabic: "برو",
        nameEnglish: "Pro",
        monthlyPrice: 0,
        maxBranches: 10,
        maxPosDevices: 20,
        maxUsers: 50,
        features: ["حتى 10 فروع", "حتى 20 جهاز POS", "صلاحيات متقدمة", "تقارير تشغيلية وضريبية أوسع"]
      }
    })
  ]);

  await prisma.permission.createMany({
    data: [
      { key: "platform.manage", description: "إدارة المنصة" },
      { key: "tenant.manage", description: "إدارة المنشأة" },
      { key: "branches.manage", description: "إدارة الفروع" },
      { key: "users.manage", description: "إدارة المستخدمين" },
      { key: "products.manage", description: "إدارة المنتجات" },
      { key: "pos.use", description: "استخدام نقاط البيع" },
      { key: "orders.read", description: "قراءة الطلبات" },
      { key: "reports.read", description: "قراءة التقارير" },
      { key: "refunds.manage", description: "إدارة المرتجعات" },
      { key: "settings.manage", description: "إدارة الإعدادات" }
    ],
    skipDuplicates: true
  });

  await prisma.user.upsert({
    where: { email: "admin@jaadpos.com" },
    update: {},
    create: {
      email: "admin@jaadpos.com",
      name: "JAAD Platform Owner",
      passwordHash: platformOwnerPassword,
      role: "PLATFORM_OWNER"
    }
  });

  const growthPlan = plans.find((plan) => plan.code === "GROWTH");
  if (!growthPlan) throw new Error("Growth plan is required");

  const tenant = await prisma.tenant.upsert({
    where: { id: "demo-tenant-jaad-cafe" },
    update: {},
    create: {
      id: "demo-tenant-jaad-cafe",
      name: "مقهى جاد التجريبي",
      legalName: "شركة مقهى جاد للتغذية",
      vatNumber: "300000000000003",
      city: "الرياض",
      address: "طريق الملك فهد",
      phone: "+966500000000",
      email: "owner@jaadpos.com",
      status: "ACTIVE",
      onboardingCompleted: true,
      planId: growthPlan.id,
      subscription: {
        create: {
          planId: growthPlan.id,
          status: "TRIAL",
          trialStartedAt: now,
          trialEndsAt: trialEndsFrom(now)
        }
      },
      taxSettings: {
        create: {
          defaultTaxRate: 0.15,
          pricesIncludeTax: false
        }
      },
      invoiceSettings: {
        create: {
          footerText: "شكرًا لزيارتكم",
          qrEnabled: true,
          invoicePrefix: "INV",
          eInvoiceMode: "BASIC_QR_ONLY",
          zatcaIntegrationStatus: "NOT_ENABLED"
        }
      }
    }
  });

  const branch = await prisma.branch.upsert({
    where: { id: "demo-branch-main" },
    update: {},
    create: {
      id: "demo-branch-main",
      tenantId: tenant.id,
      name: "الفرع الرئيسي",
      city: "الرياض",
      address: "طريق الملك فهد",
      phone: "+966500000000",
      isMain: true
    }
  });

  const device = await prisma.posDevice.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "POS-01" } },
    update: {},
    create: {
      tenantId: tenant.id,
      branchId: branch.id,
      name: "جهاز الكاشير الرئيسي",
      code: "POS-01"
    }
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@jaadpos.com" },
    update: {},
    create: {
      tenantId: tenant.id,
      branchId: branch.id,
      email: "owner@jaadpos.com",
      name: "مالك مقهى جاد",
      passwordHash: ownerPassword,
      role: "TENANT_OWNER"
    }
  });

  const cashier = await prisma.user.upsert({
    where: { email: "cashier@jaadpos.com" },
    update: {},
    create: {
      tenantId: tenant.id,
      branchId: branch.id,
      email: "cashier@jaadpos.com",
      name: "كاشير مقهى جاد",
      passwordHash: cashierPassword,
      role: "CASHIER"
    }
  });

  await prisma.user.upsert({
    where: { email: "accountant@jaadpos.com" },
    update: {},
    create: {
      tenantId: tenant.id,
      branchId: branch.id,
      email: "accountant@jaadpos.com",
      name: "محاسب مقهى جاد",
      passwordHash: accountantPassword,
      role: "ACCOUNTANT"
    }
  });

  const categories = new Map<string, string>();
  for (const name of ["قهوة", "مشروبات باردة", "حلويات", "مخبوزات", "ساندويتشات"]) {
    const category = await prisma.category.create({
      data: {
        tenantId: tenant.id,
        nameArabic: name,
        sortOrder: categories.size + 1
      }
    });
    categories.set(name, category.id);
  }

  for (const [name, categoryName, price] of productSeed) {
    await prisma.product.create({
      data: {
        tenantId: tenant.id,
        categoryId: categories.get(categoryName)!,
        nameArabic: name,
        price,
        taxRate: 0.15
      }
    });
  }

  const shift = await prisma.shift.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      deviceId: device.id,
      cashierId: cashier.id,
      openingFloat: 500,
      status: "OPEN"
    }
  });

  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      actorId: owner.id,
      action: "seed.demo_created",
      entityType: "Tenant",
      entityId: tenant.id,
      metadata: { branchId: branch.id, deviceId: device.id, shiftId: shift.id }
    }
  });

  console.log("JAADPOS seed completed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
