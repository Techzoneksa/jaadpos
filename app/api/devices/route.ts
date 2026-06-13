import { NextResponse } from "next/server";
import { z } from "zod";
import { consoleUrl } from "@/lib/domains";
import { assertWithinPlanLimit, PlanLimitError } from "@/lib/plan-limits";
import { getCurrentSession } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const createSchema = z.object({
  action: z.literal("create"),
  name: z.string().trim().min(2),
  branchId: z.string().min(1)
});

const updateSchema = z.object({
  action: z.literal("update"),
  deviceId: z.string().min(1),
  name: z.string().trim().min(2),
  branchId: z.string().min(1)
});

const toggleSchema = z.object({
  action: z.literal("toggle"),
  deviceId: z.string().min(1)
});

function redirectTo(status: string) {
  return NextResponse.redirect(consoleUrl(`/devices?status=${status}`));
}

async function nextDeviceCode(tenantId: string) {
  const count = await prisma.posDevice.count({ where: { tenantId } });

  for (let index = count + 1; index < count + 1000; index += 1) {
    const code = `POS-${String(index).padStart(2, "0")}`;
    const existing = await prisma.posDevice.findUnique({ where: { tenantId_code: { tenantId, code } }, select: { id: true } });
    if (!existing) return code;
  }

  return `POS-${Date.now().toString(36).toUpperCase()}`;
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

      const branch = await prisma.branch.findFirst({
        where: { id: parsed.data.branchId, tenantId, active: true },
        select: { id: true }
      });
      if (!branch) return redirectTo("branch_missing");

      await assertWithinPlanLimit(tenantId, "posDevices");
      const code = await nextDeviceCode(tenantId);

      await prisma.posDevice.create({
        data: {
          tenantId,
          branchId: branch.id,
          name: parsed.data.name,
          code
        }
      });

      return redirectTo("created");
    }

    if (form.action === "update") {
      const parsed = updateSchema.safeParse(form);
      if (!parsed.success) return redirectTo("invalid");

      const [device, branch] = await Promise.all([
        prisma.posDevice.findFirst({ where: { id: parsed.data.deviceId, tenantId }, select: { id: true } }),
        prisma.branch.findFirst({ where: { id: parsed.data.branchId, tenantId, active: true }, select: { id: true } })
      ]);

      if (!device) return redirectTo("missing");
      if (!branch) return redirectTo("branch_missing");

      await prisma.posDevice.update({
        where: { id: device.id },
        data: {
          name: parsed.data.name,
          branchId: branch.id
        }
      });

      return redirectTo("updated");
    }

    const parsed = toggleSchema.safeParse(form);
    if (!parsed.success) return redirectTo("invalid");

    const device = await prisma.posDevice.findFirst({
      where: { id: parsed.data.deviceId, tenantId },
      select: { id: true, active: true }
    });

    if (!device) return redirectTo("missing");

    await prisma.posDevice.update({ where: { id: device.id }, data: { active: !device.active } });
    return redirectTo(device.active ? "disabled" : "enabled");
  } catch (error) {
    if (error instanceof PlanLimitError) {
      return redirectTo("limit");
    }

    return redirectTo("error");
  }
}
