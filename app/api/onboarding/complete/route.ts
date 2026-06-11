import { NextResponse } from "next/server";
import { z } from "zod";
import { consoleUrl } from "@/lib/domains";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/platform-access";

export const runtime = "nodejs";

type TransactionClient = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

const onboardingSchema = z.object({
  commercialName: z.string().min(2),
  legalName: z.string().optional(),
  vatNumber: z.string().min(8),
  city: z.string().min(2),
  address: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email(),
  branchName: z.string().min(2),
  pricesIncludeTax: z.enum(["yes", "no"]).default("no"),
  footerText: z.string().optional()
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

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session?.tenantId || session.role !== "TENANT_OWNER") {
    return NextResponse.redirect(consoleUrl("/forbidden"));
  }

  const input = onboardingSchema.parse(Object.fromEntries(await request.formData()));

  await prisma.$transaction(async (tx: TransactionClient) => {
    await tx.tenant.update({
      where: { id: session.tenantId! },
      data: {
        name: input.commercialName,
        legalName: input.legalName || null,
        vatNumber: input.vatNumber,
        city: input.city,
        address: input.address,
        phone: input.phone,
        email: input.email,
        onboardingCompleted: true
      }
    });

    const branch =
      (await tx.branch.findFirst({
        where: { tenantId: session.tenantId!, isMain: true }
      })) ??
      (await tx.branch.create({
        data: {
          tenantId: session.tenantId!,
          name: input.branchName,
          city: input.city,
          address: input.address,
          phone: input.phone,
          isMain: true
        }
      }));

    await tx.posDevice.upsert({
      where: { tenantId_code: { tenantId: session.tenantId!, code: "POS-01" } },
      update: { branchId: branch.id, active: true },
      create: {
        tenantId: session.tenantId!,
        branchId: branch.id,
        name: "جهاز الكاشير الرئيسي",
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
    if (productCount === 0) {
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

  return NextResponse.redirect(consoleUrl("/dashboard"));
}
