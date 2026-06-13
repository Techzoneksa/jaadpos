import { NextResponse } from "next/server";
import { z } from "zod";
import { consoleUrl } from "@/lib/domains";
import { assertWithinPlanLimit, PlanLimitError } from "@/lib/plan-limits";
import { getCurrentSession } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const allowedRoles = new Set(["TENANT_OWNER", "BRANCH_MANAGER"]);

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}, z.string().nullable());

const createSchema = z.object({
  action: z.literal("create"),
  categoryId: z.string().min(1),
  nameArabic: z.string().trim().min(2),
  nameEnglish: optionalText,
  sku: optionalText,
  price: z.coerce.number().min(0.01),
  pricesIncludeTax: z.enum(["yes", "no"]).default("no")
});

const updateSchema = z.object({
  action: z.literal("update"),
  productId: z.string().min(1),
  categoryId: z.string().min(1),
  nameArabic: z.string().trim().min(2),
  nameEnglish: optionalText,
  sku: optionalText,
  price: z.coerce.number().min(0.01),
  pricesIncludeTax: z.enum(["yes", "no"]).default("no"),
  status: z.enum(["ACTIVE", "INACTIVE"])
});

const toggleSchema = z.object({
  action: z.literal("toggle"),
  productId: z.string().min(1)
});

function redirectTo(status: string) {
  return NextResponse.redirect(consoleUrl(`/products?status=${status}`));
}

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.redirect(consoleUrl("/login"));
  }

  if (!session.tenantId || !allowedRoles.has(session.role)) {
    return redirectTo("forbidden");
  }

  const tenantId = session.tenantId;
  const form = Object.fromEntries(await request.formData());

  try {
    if (form.action === "create") {
      const parsed = createSchema.safeParse(form);
      if (!parsed.success) return redirectTo("invalid");

      const category = await prisma.category.findFirst({
        where: { id: parsed.data.categoryId, tenantId, status: "ACTIVE" },
        select: { id: true }
      });
      if (!category) return redirectTo("category_missing");

      await assertWithinPlanLimit(tenantId, "products");

      await prisma.product.create({
        data: {
          tenantId,
          categoryId: category.id,
          nameArabic: parsed.data.nameArabic,
          nameEnglish: parsed.data.nameEnglish,
          sku: parsed.data.sku,
          price: parsed.data.price,
          pricesIncludeTax: parsed.data.pricesIncludeTax === "yes",
          taxRate: 0.15,
          status: "ACTIVE",
          available: true
        }
      });

      return redirectTo("created");
    }

    if (form.action === "update") {
      const parsed = updateSchema.safeParse(form);
      if (!parsed.success) return redirectTo("invalid");

      const [product, category] = await Promise.all([
        prisma.product.findFirst({ where: { id: parsed.data.productId, tenantId }, select: { id: true } }),
        prisma.category.findFirst({ where: { id: parsed.data.categoryId, tenantId }, select: { id: true } })
      ]);

      if (!product) return redirectTo("missing");
      if (!category) return redirectTo("category_missing");

      await prisma.product.update({
        where: { id: product.id },
        data: {
          categoryId: category.id,
          nameArabic: parsed.data.nameArabic,
          nameEnglish: parsed.data.nameEnglish,
          sku: parsed.data.sku,
          price: parsed.data.price,
          pricesIncludeTax: parsed.data.pricesIncludeTax === "yes",
          status: parsed.data.status,
          available: parsed.data.status === "ACTIVE"
        }
      });

      return redirectTo("updated");
    }

    const parsed = toggleSchema.safeParse(form);
    if (!parsed.success) return redirectTo("invalid");

    const product = await prisma.product.findFirst({
      where: { id: parsed.data.productId, tenantId },
      select: { id: true, status: true }
    });
    if (!product) return redirectTo("missing");

    const status = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await prisma.product.update({
      where: { id: product.id },
      data: {
        status,
        available: status === "ACTIVE"
      }
    });

    return redirectTo(status === "ACTIVE" ? "enabled" : "disabled");
  } catch (error) {
    if (error instanceof PlanLimitError) {
      return redirectTo("limit");
    }

    return redirectTo("error");
  }
}
