import { NextResponse } from "next/server";
import { z } from "zod";
import { consoleUrl } from "@/lib/domains";
import { getCurrentSession } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const closeShiftSchema = z.object({
  shiftId: z.string().min(1),
  closingCash: z.coerce.number().min(0)
});

const allowedRoles = new Set(["TENANT_OWNER", "BRANCH_MANAGER"]);

function redirectWithStatus(status: "closed" | "invalid" | "forbidden" | "missing") {
  return NextResponse.redirect(consoleUrl(`/shifts?status=${status}`));
}

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session?.tenantId || !allowedRoles.has(session.role)) {
    return redirectWithStatus("forbidden");
  }

  const parsed = closeShiftSchema.safeParse(Object.fromEntries(await request.formData()));
  if (!parsed.success) {
    return redirectWithStatus("invalid");
  }

  const shift = await prisma.shift.findFirst({
    where: {
      id: parsed.data.shiftId,
      tenantId: session.tenantId,
      status: "OPEN"
    },
    select: {
      id: true,
      openingFloat: true
    }
  });

  if (!shift) {
    return redirectWithStatus("missing");
  }

  const cashPayments = await prisma.payment.aggregate({
    where: {
      tenantId: session.tenantId,
      method: "CASH",
      status: "PAID",
      order: {
        shiftId: shift.id
      }
    },
    _sum: {
      amount: true
    }
  });

  const expectedCash = Number(shift.openingFloat) + Number(cashPayments._sum.amount ?? 0);
  const closingCash = parsed.data.closingCash;

  await prisma.shift.update({
    where: { id: shift.id },
    data: {
      status: "CLOSED",
      closingCash,
      cashDifference: closingCash - expectedCash,
      closedAt: new Date()
    }
  });

  return redirectWithStatus("closed");
}
