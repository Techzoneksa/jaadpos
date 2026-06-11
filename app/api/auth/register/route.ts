import { NextResponse } from "next/server";
import { z } from "zod";
import { consoleUrl } from "@/lib/domains";
import { ensurePlanCatalog } from "@/lib/plan-catalog";
import { getPlanFromString, toPrismaPlanCode } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { createSessionToken, getSessionCookieOptions, hashPassword, sessionCookieName } from "@/lib/session";
import { trialEndsFrom } from "@/lib/subscription";

export const runtime = "nodejs";

const registerSchema = z.object({
  ownerName: z.string().min(2),
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8),
  tenantName: z.string().min(2),
  phone: z.string().min(6),
  plan: z.enum(["starter", "growth", "pro"]),
  terms: z.literal("accepted")
});

function signupErrorUrl(plan: string | undefined, error: "invalid" | "email_exists" | "unavailable") {
  const selectedPlan = getPlanFromString(plan);
  return consoleUrl(`/signup?plan=${selectedPlan.code}&error=${error}`);
}

export async function POST(request: Request) {
  const form = Object.fromEntries(await request.formData());
  const parsed = registerSchema.safeParse(form);

  if (!parsed.success) {
    return NextResponse.redirect(signupErrorUrl(String(form.plan ?? "growth"), "invalid"));
  }

  const input = parsed.data;
  const now = new Date();
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    return NextResponse.json({ error: "AUTH_SECRET is required" }, { status: 500 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true }
  });

  if (existingUser) {
    return NextResponse.redirect(signupErrorUrl(input.plan, "email_exists"));
  }

  await ensurePlanCatalog();

  const selectedPlan = getPlanFromString(input.plan);
  const plan = await prisma.plan.findUnique({
    where: { code: toPrismaPlanCode(selectedPlan.code) }
  });

  if (!plan) {
    return NextResponse.redirect(signupErrorUrl(input.plan, "unavailable"));
  }

  const passwordHash = await hashPassword(input.password);

  const tenant = await prisma.tenant.create({
    data: {
      name: input.tenantName,
      phone: input.phone,
      email: input.email,
      status: "ACTIVE",
      planId: plan.id,
      subscription: {
        create: {
          planId: plan.id,
          status: "TRIAL",
          trialStartedAt: now,
          trialEndsAt: trialEndsFrom(now)
        }
      },
      users: {
        create: {
          name: input.ownerName,
          email: input.email,
          passwordHash,
          role: "TENANT_OWNER"
        }
      },
      taxSettings: {
        create: {
          defaultTaxRate: 0.15,
          pricesIncludeTax: false
        }
      },
      invoiceSettings: {
        create: {
          footerText: "شكرًا لزيارتكم",
          qrEnabled: true,
          invoicePrefix: "INV",
          eInvoiceMode: "BASIC_QR_ONLY",
          zatcaIntegrationStatus: "NOT_ENABLED"
        }
      }
    },
    include: { users: true }
  });

  const owner = tenant.users[0];
  const response = NextResponse.redirect(consoleUrl("/onboarding"));
  response.cookies.set(sessionCookieName, createSessionToken({ userId: owner.id, tenantId: tenant.id, role: owner.role }, secret), getSessionCookieOptions());

  return response;
}
