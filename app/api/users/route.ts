import { NextResponse } from "next/server";
import { z } from "zod";
import { consoleUrl } from "@/lib/domains";
import { assertWithinPlanLimit, PlanLimitError } from "@/lib/plan-limits";
import { getCurrentSession } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/session";

export const runtime = "nodejs";

const tenantRoleSchema = z.enum(["TENANT_OWNER", "BRANCH_MANAGER", "CASHIER", "ACCOUNTANT"]);

const optionalBranchId = z.preprocess((value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}, z.string().nullable());

const optionalPassword = z.preprocess((value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}, z.string().min(8).nullable());

const createSchema = z.object({
  action: z.literal("create"),
  name: z.string().trim().min(2),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8),
  role: tenantRoleSchema,
  branchId: optionalBranchId
});

const updateSchema = z.object({
  action: z.literal("update"),
  userId: z.string().min(1),
  name: z.string().trim().min(2),
  role: tenantRoleSchema,
  branchId: optionalBranchId,
  password: optionalPassword
});

const toggleSchema = z.object({
  action: z.literal("toggle"),
  userId: z.string().min(1)
});

function redirectTo(status: string) {
  return NextResponse.redirect(consoleUrl(`/users?status=${status}`));
}

async function branchBelongsToTenant(tenantId: string, branchId: string | null) {
  if (!branchId) return true;
  const branch = await prisma.branch.findFirst({ where: { id: branchId, tenantId, active: true }, select: { id: true } });
  return Boolean(branch);
}

async function hasAnotherActiveOwner(tenantId: string, userId: string) {
  const activeOwners = await prisma.user.count({
    where: {
      tenantId,
      role: "TENANT_OWNER",
      active: true,
      id: { not: userId }
    }
  });

  return activeOwners > 0;
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

      const duplicate = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
      if (duplicate) return redirectTo("duplicate");

      if (!(await branchBelongsToTenant(tenantId, parsed.data.branchId))) {
        return redirectTo("branch_missing");
      }

      await assertWithinPlanLimit(tenantId, "users");
      const passwordHash = await hashPassword(parsed.data.password);

      await prisma.user.create({
        data: {
          tenantId,
          branchId: parsed.data.branchId,
          name: parsed.data.name,
          email: parsed.data.email,
          passwordHash,
          role: parsed.data.role
        }
      });

      return redirectTo("created");
    }

    if (form.action === "update") {
      const parsed = updateSchema.safeParse(form);
      if (!parsed.success) return redirectTo("invalid");

      const user = await prisma.user.findFirst({
        where: { id: parsed.data.userId, tenantId },
        select: { id: true, role: true, active: true }
      });
      if (!user) return redirectTo("missing");

      if (!(await branchBelongsToTenant(tenantId, parsed.data.branchId))) {
        return redirectTo("branch_missing");
      }

      if (user.active && user.role === "TENANT_OWNER" && parsed.data.role !== "TENANT_OWNER" && !(await hasAnotherActiveOwner(tenantId, user.id))) {
        return redirectTo("last_owner");
      }

      const updateData: {
        name: string;
        role: typeof parsed.data.role;
        branchId: string | null;
        passwordHash?: string;
      } = {
        name: parsed.data.name,
        role: parsed.data.role,
        branchId: parsed.data.branchId
      };

      if (parsed.data.password) {
        updateData.passwordHash = await hashPassword(parsed.data.password);
      }

      await prisma.user.update({ where: { id: user.id }, data: updateData });
      return redirectTo("updated");
    }

    const parsed = toggleSchema.safeParse(form);
    if (!parsed.success) return redirectTo("invalid");

    const user = await prisma.user.findFirst({
      where: { id: parsed.data.userId, tenantId },
      select: { id: true, role: true, active: true }
    });
    if (!user) return redirectTo("missing");

    if (user.active && user.role === "TENANT_OWNER" && !(await hasAnotherActiveOwner(tenantId, user.id))) {
      return redirectTo("last_owner");
    }

    await prisma.user.update({ where: { id: user.id }, data: { active: !user.active } });
    return redirectTo(user.active ? "disabled" : "enabled");
  } catch (error) {
    if (error instanceof PlanLimitError) {
      return redirectTo("limit");
    }

    return redirectTo("error");
  }
}
