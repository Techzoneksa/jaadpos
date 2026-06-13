import { NextResponse } from "next/server";
import { z } from "zod";
import { consoleUrl } from "@/lib/domains";
import { getCurrentSession } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const closeShiftSchema = z.object({
  shiftId: z.string().min(1),
  closingCash: z.coerce.number().min(0),
  returnTo: z.enum(["/pos", "/shifts"]).default("/shifts")
});

const allowedRoles = new Set(["TENANT_OWNER", "BRANCH_MANAGER", "CASHIER"]);

function redirectWithStatus(returnTo: "/pos" | "/shifts", status: "closed" | "invalid" | "forbidden" | "missing" | "error") {
  return NextResponse.redirect(consoleUrl(`${returnTo}?shiftStatus=${status}`));
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  const form = Object.fromEntries(await request.formData());
  const parsed = closeShiftSchema.safeParse(form);
  const returnTo = parsed.success ? parsed.data.returnTo : "/shifts";

  if (!session?.tenantId || !allowedRoles.has(session.role)) {
    return redirectWithStatus(returnTo, "forbidden");
  }

  if (!parsed.success) {
    return redirectWithStatus(returnTo, "invalid");
  }

  const shift = await prisma.shift.findFirst({
    where: {
      id: parsed.data.shiftId,
      tenantId: session.tenantId,
      status: "OPEN"
    },
    select: {
      id: true,
      openingFloat: true,
      cashierId: true
    }
  });

  if (!shift) {
    return redirectWithStatus(parsed.data.returnTo, "missing");
  }

  if (session.role === "CASHIER" && shift.cashierId !== session.userId) {
    return redirectWithStatus(parsed.data.returnTo, "forbidden");
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

  try {
    await prisma.shift.update({
      where: { id: shift.id },
      data: {
        status: "CLOSED",
        closingCash,
        cashDifference: closingCash - expectedCash,
        closedAt: new Date()
      }
    });
  } catch {
    return redirectWithStatus(parsed.data.returnTo, "error");
  }

  return redirectWithStatus(parsed.data.returnTo, "closed");
}
