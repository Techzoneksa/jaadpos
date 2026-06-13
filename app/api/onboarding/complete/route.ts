import { NextResponse } from "next/server";
import { z } from "zod";
import { consoleUrl } from "@/lib/domains";
import { getCurrentSession } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type TransactionClient = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

const requiredText = z.string().trim().min(2);
const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}, z.string().nullable());

const onboardingSchema = z.object({
  commercialName: requiredText,
  legalName: optionalText,
  vatNumber: optionalText,
  commercialRegistration: optionalText,
  city: requiredText,
  address: optionalText,
  phone: optionalText,
  branchName: requiredText,
  branchCity: optionalText,
  branchAddress: optionalText,
  branchPhone: optionalText,
  posDeviceName: requiredText,
  pricesIncludeTax: z.enum(["yes", "no"]).default("no"),
  footerText: optionalText,
  createDemoProducts: z.enum(["yes", "no"]).default("yes")
});

const demoProducts = [
  ["قهوة أمريكية", "قهوة", 12],
  ["لاتيه", "قهوة", 16],
  ["كابتشينو", "قهوة", 15],
  ["سبانش لاتيه", "قهوة", 19],
  ["موهيتو فراولة", "مشروبات باردة", 18],
  ["كرواسون زبدة", "مخبوزات", 10],
  ["تشيز كيك", "حلويات", 22],
  ["ساندويتش دجاج", "ساندويتشات", 24]
] as const;

function onboardingErrorUrl(error: "invalid" | "plan_limit") {
  return consoleUrl(`/onboarding?error=${error}`);
}

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session?.tenantId || session.role !== "TENANT_OWNER") {
    return NextResponse.redirect(consoleUrl("/forbidden"));
  }

  const parsed = onboardingSchema.safeParse(Object.fromEntries(await request.formData()));
  if (!parsed.success) {
    return NextResponse.redirect(onboardingErrorUrl("invalid"));
  }

  const input = parsed.data;

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      const tenant = await tx.tenant.findUnique({
        where: { id: session.tenantId! },
        include: {
          plan: true,
          _count: {
            select: {
              branches: true,
              posDevices: true,
              users: true
            }
          }
        }
      });

      if (!tenant) {
        throw new Error("tenant_not_found");
      }

      const mainBranch = await tx.branch.findFirst({
        where: { tenantId: session.tenantId!, isMain: true }
      });
      const mainDevice = await tx.posDevice.findFirst({
        where: { tenantId: session.tenantId!, code: "POS-01" }
      });

      if (!mainBranch && tenant._count.branches >= tenant.plan.maxBranches) {
        throw new Error("plan_limit");
      }

      if (!mainDevice && tenant._count.posDevices >= tenant.plan.maxPosDevices) {
        throw new Error("plan_limit");
      }

      if (tenant._count.users > tenant.plan.maxUsers) {
        throw new Error("plan_limit");
      }

      await tx.tenant.update({
        where: { id: session.tenantId! },
        data: {
          name: input.commercialName,
          legalName: input.legalName,
          vatNumber: input.vatNumber,
          commercialRegistration: input.commercialRegistration,
          city: input.city,
          address: input.address,
          phone: input.phone,
          onboardingCompleted: true
        }
      });

      const branchCity = input.branchCity ?? input.city;
      const branchAddress = input.branchAddress ?? input.address;
      const branchPhone = input.branchPhone ?? input.phone;

      const branch = mainBranch
        ? await tx.branch.update({
            where: { id: mainBranch.id },
            data: {
              name: input.branchName,
              city: branchCity,
              address: branchAddress,
              phone: branchPhone,
              active: true
            }
          })
        : await tx.branch.create({
            data: {
              tenantId: session.tenantId!,
              name: input.branchName,
              city: branchCity,
              address: branchAddress,
              phone: branchPhone,
              isMain: true
            }
          });

      await tx.posDevice.upsert({
        where: { tenantId_code: { tenantId: session.tenantId!, code: "POS-01" } },
        update: { branchId: branch.id, name: input.posDeviceName, active: true },
        create: {
          tenantId: session.tenantId!,
          branchId: branch.id,
          name: input.posDeviceName,
          code: "POS-01"
        }
      });

      await tx.taxSetting.upsert({
        where: { tenantId: session.tenantId! },
        update: {
          defaultTaxRate: 0.15,
          pricesIncludeTax: input.pricesIncludeTax === "yes"
        },
        create: {
          tenantId: session.tenantId!,
          defaultTaxRate: 0.15,
          pricesIncludeTax: input.pricesIncludeTax === "yes"
        }
      });

      await tx.invoiceSetting.upsert({
        where: { tenantId: session.tenantId! },
        update: {
          footerText: input.footerText || "شكرًا لزيارتكم",
          qrEnabled: true,
          eInvoiceMode: "BASIC_QR_ONLY",
          zatcaIntegrationStatus: "NOT_ENABLED"
        },
        create: {
          tenantId: session.tenantId!,
          footerText: input.footerText || "شكرًا لزيارتكم",
          qrEnabled: true,
          invoicePrefix: "INV",
          eInvoiceMode: "BASIC_QR_ONLY",
          zatcaIntegrationStatus: "NOT_ENABLED"
        }
      });

      const productCount = await tx.product.count({ where: { tenantId: session.tenantId! } });
      if (input.createDemoProducts === "yes" && productCount === 0) {
        const categories = new Map<string, string>();

        for (const name of ["قهوة", "مشروبات باردة", "حلويات", "مخبوزات", "ساندويتشات"]) {
          const category = await tx.category.create({
            data: {
              tenantId: session.tenantId!,
              nameArabic: name,
              sortOrder: categories.size + 1
            }
          });
          categories.set(name, category.id);
        }

        for (const [name, categoryName, price] of demoProducts) {
          await tx.product.create({
            data: {
              tenantId: session.tenantId!,
              categoryId: categories.get(categoryName)!,
              nameArabic: name,
              price,
              taxRate: 0.15
            }
          });
        }
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "plan_limit") {
      return NextResponse.redirect(onboardingErrorUrl("plan_limit"));
    }

    throw error;
  }

  return NextResponse.redirect(consoleUrl("/dashboard?onboarded=1"));
}
