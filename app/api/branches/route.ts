import { NextResponse } from "next/server";
import { z } from "zod";
import { consoleUrl } from "@/lib/domains";
import { assertWithinPlanLimit, PlanLimitError } from "@/lib/plan-limits";
import { getCurrentSession } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}, z.string().nullable());

const isMainInput = z.preprocess((value) => value === "on" || value === "yes", z.boolean());

const createSchema = z.object({
  action: z.literal("create"),
  name: z.string().trim().min(2),
  city: optionalText,
  address: optionalText,
  phone: optionalText,
  isMain: isMainInput
});

const updateSchema = z.object({
  action: z.literal("update"),
  branchId: z.string().min(1),
  name: z.string().trim().min(2),
  city: optionalText,
  address: optionalText,
  phone: optionalText
});

const idActionSchema = z.object({
  action: z.enum(["toggle", "set_main"]),
  branchId: z.string().min(1)
});

function redirectTo(status: string) {
  return NextResponse.redirect(consoleUrl(`/branches?status=${status}`));
}

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.redirect(consoleUrl("/login"));
  }

  if (!session.tenantId || session.role !== "TENANT_OWNER") {
    return redirectTo("forbidden");
  }

  const tenantId = session.tenantId;
  const form = Object.fromEntries(await request.formData());

  try {
    if (form.action === "create") {
      const parsed = createSchema.safeParse(form);
      if (!parsed.success) return redirectTo("invalid");

      await assertWithinPlanLimit(tenantId, "branches");
      const currentCount = await prisma.branch.count({ where: { tenantId } });
      const shouldBeMain = parsed.data.isMain || currentCount === 0;

      await prisma.$transaction(async (tx) => {
        if (shouldBeMain) {
          await tx.branch.updateMany({ where: { tenantId }, data: { isMain: false } });
        }

        await tx.branch.create({
          data: {
            tenantId,
            name: parsed.data.name,
            city: parsed.data.city,
            address: parsed.data.address,
            phone: parsed.data.phone,
            isMain: shouldBeMain
          }
        });
      });

      return redirectTo("created");
    }

    if (form.action === "update") {
      const parsed = updateSchema.safeParse(form);
      if (!parsed.success) return redirectTo("invalid");

      const branch = await prisma.branch.findFirst({ where: { id: parsed.data.branchId, tenantId }, select: { id: true } });
      if (!branch) return redirectTo("missing");

      await prisma.branch.update({
        where: { id: branch.id },
        data: {
          name: parsed.data.name,
          city: parsed.data.city,
          address: parsed.data.address,
          phone: parsed.data.phone
        }
      });

      return redirectTo("updated");
    }

    const parsed = idActionSchema.safeParse(form);
    if (!parsed.success) return redirectTo("invalid");

    const branch = await prisma.branch.findFirst({
      where: { id: parsed.data.branchId, tenantId },
      select: { id: true, isMain: true, active: true }
    });

    if (!branch) return redirectTo("missing");

    if (parsed.data.action === "set_main") {
      await prisma.$transaction([
        prisma.branch.updateMany({ where: { tenantId }, data: { isMain: false } }),
        prisma.branch.update({ where: { id: branch.id }, data: { isMain: true, active: true } })
      ]);
      return redirectTo("main");
    }

    if (branch.active && branch.isMain) {
      return redirectTo("main_required");
    }

    await prisma.branch.update({ where: { id: branch.id }, data: { active: !branch.active } });
    return redirectTo(branch.active ? "disabled" : "enabled");
  } catch (error) {
    if (error instanceof PlanLimitError) {
      return redirectTo("limit");
    }

    return redirectTo("error");
  }
}
