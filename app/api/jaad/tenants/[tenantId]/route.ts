import { NextResponse } from "next/server";
import { z } from "zod";
import { dashUrl } from "@/lib/domains";
import { ensurePlanCatalog } from "@/lib/plan-catalog";
import { requirePlatformAccess } from "@/lib/platform-access";
import { getPlanFromString, toPrismaPlanCode } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    tenantId: string;
  }>;
};

const actionSchema = z.object({
  action: z.enum(["activate", "extend_trial", "disable", "change_plan"]),
  plan: z.string().optional()
});

function backUrl(status: string) {
  return dashUrl(`/jaad/tenants?status=${status}`);
}

export async function POST(request: Request, context: RouteContext) {
  await requirePlatformAccess();

  const { tenantId } = await context.params;
  const parsed = actionSchema.safeParse(Object.fromEntries(await request.formData()));

  if (!parsed.success) {
    return NextResponse.redirect(backUrl("invalid"));
  }

  const now = new Date();
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { subscription: true, plan: true }
  });

  if (!tenant) {
    return NextResponse.redirect(backUrl("missing"));
  }

  if (parsed.data.action === "activate") {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: "ACTIVE",
        subscription: {
          update: {
            status: "ACTIVE",
            activeStartedAt: now,
            cancelledAt: null,
            pastDueAt: null
          }
        }
      }
    });
  }

  if (parsed.data.action === "extend_trial") {
    const currentEnd = tenant.subscription?.trialEndsAt ?? now;
    const base = currentEnd.getTime() > now.getTime() ? currentEnd : now;
    const nextEnd = new Date(base);
    nextEnd.setDate(nextEnd.getDate() + 7);

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: "ACTIVE",
        subscription: {
          update: {
            status: "TRIAL",
            trialEndsAt: nextEnd,
            cancelledAt: null,
            pastDueAt: null
          }
        }
      }
    });
  }

  if (parsed.data.action === "disable") {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: "DISABLED",
        subscription: {
          update: {
            status: "CANCELLED",
            cancelledAt: now
          }
        }
      }
    });
  }

  if (parsed.data.action === "change_plan") {
    await ensurePlanCatalog();
    const selectedPlan = getPlanFromString(parsed.data.plan);
    const nextPlan = await prisma.plan.findUnique({
      where: { code: toPrismaPlanCode(selectedPlan.code) }
    });

    if (!nextPlan) {
      return NextResponse.redirect(backUrl("invalid_plan"));
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        planId: nextPlan.id,
        subscription: {
          update: {
            planId: nextPlan.id
          }
        }
      }
    });
  }

  return NextResponse.redirect(backUrl("updated"));
}
