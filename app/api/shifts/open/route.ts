import { NextResponse } from "next/server";
import { z } from "zod";
import { consoleUrl } from "@/lib/domains";
import { getCurrentSession } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const openShiftSchema = z.object({
  openingFloat: z.coerce.number().min(0).default(0),
  returnTo: z.enum(["/pos", "/shifts"]).default("/shifts")
});

const allowedRoles = new Set(["TENANT_OWNER", "BRANCH_MANAGER", "CASHIER"]);

function redirectWithStatus(returnTo: "/pos" | "/shifts", status: string) {
  return NextResponse.redirect(consoleUrl(`${returnTo}?shiftStatus=${status}`));
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  const parsed = openShiftSchema.safeParse(Object.fromEntries(await request.formData()));
  const returnTo = parsed.success ? parsed.data.returnTo : "/shifts";

  if (!session?.tenantId || !allowedRoles.has(session.role)) {
    return redirectWithStatus(returnTo, "forbidden");
  }

  if (!parsed.success) {
    return redirectWithStatus(returnTo, "invalid");
  }

  try {
    const user = await prisma.user.findFirst({
      where: { id: session.userId, tenantId: session.tenantId, active: true },
      select: { branchId: true }
    });

    const branch = await prisma.branch.findFirst({
      where: {
        tenantId: session.tenantId,
        active: true,
        ...(user?.branchId ? { id: user.branchId } : {})
      },
      orderBy: [{ isMain: "desc" }, { createdAt: "asc" }]
    });

    if (!branch) {
      return redirectWithStatus(parsed.data.returnTo, "missing_setup");
    }

    const device = await prisma.posDevice.findFirst({
      where: {
        tenantId: session.tenantId,
        branchId: branch.id,
        active: true
      },
      orderBy: { createdAt: "asc" }
    });

    if (!device) {
      return redirectWithStatus(parsed.data.returnTo, "missing_setup");
    }

    const existingShift = await prisma.shift.findFirst({
      where: {
        tenantId: session.tenantId,
        cashierId: session.userId,
        status: "OPEN"
      },
      select: { id: true }
    });

    if (existingShift) {
      return redirectWithStatus(parsed.data.returnTo, "already_open");
    }

    await prisma.shift.create({
      data: {
        tenantId: session.tenantId,
        branchId: branch.id,
        deviceId: device.id,
        cashierId: session.userId,
        openingFloat: parsed.data.openingFloat,
        status: "OPEN"
      }
    });

    return redirectWithStatus(parsed.data.returnTo, "opened");
  } catch {
    return redirectWithStatus(returnTo, "error");
  }
}
