import { NextResponse } from "next/server";
import { z } from "zod";
import { consoleUrl } from "@/lib/domains";
import { getCurrentSession } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}, z.string().nullable());

const allowedRoles = new Set(["TENANT_OWNER", "BRANCH_MANAGER"]);

const createSchema = z.object({
  action: z.literal("create"),
  nameArabic: z.string().trim().min(2),
  nameEnglish: optionalText
});

const updateSchema = z.object({
  action: z.literal("update"),
  categoryId: z.string().min(1),
  nameArabic: z.string().trim().min(2),
  nameEnglish: optionalText
});

const toggleSchema = z.object({
  action: z.literal("toggle"),
  categoryId: z.string().min(1)
});

function redirectTo(status: string) {
  return NextResponse.redirect(consoleUrl(`/products?categoryStatus=${status}`));
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

      const count = await prisma.category.count({ where: { tenantId } });
      await prisma.category.create({
        data: {
          tenantId,
          nameArabic: parsed.data.nameArabic,
          nameEnglish: parsed.data.nameEnglish,
          sortOrder: count + 1
        }
      });

      return redirectTo("created");
    }

    if (form.action === "update") {
      const parsed = updateSchema.safeParse(form);
      if (!parsed.success) return redirectTo("invalid");

      const category = await prisma.category.findFirst({ where: { id: parsed.data.categoryId, tenantId }, select: { id: true } });
      if (!category) return redirectTo("missing");

      await prisma.category.update({
        where: { id: category.id },
        data: {
          nameArabic: parsed.data.nameArabic,
          nameEnglish: parsed.data.nameEnglish
        }
      });

      return redirectTo("updated");
    }

    const parsed = toggleSchema.safeParse(form);
    if (!parsed.success) return redirectTo("invalid");

    const category = await prisma.category.findFirst({
      where: { id: parsed.data.categoryId, tenantId },
      select: { id: true, status: true }
    });

    if (!category) return redirectTo("missing");

    await prisma.category.update({
      where: { id: category.id },
      data: { status: category.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }
    });

    return redirectTo(category.status === "ACTIVE" ? "disabled" : "enabled");
  } catch {
    return redirectTo("error");
  }
}
