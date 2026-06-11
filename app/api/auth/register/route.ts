import { NextResponse } from "next/server";
import { PlanCode } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionToken, hashPassword, sessionCookieName } from "@/lib/session";
import { trialEndsFrom } from "@/lib/subscription";
import { consoleUrl } from "@/lib/domains";

export const runtime = "nodejs";

const registerSchema = z.object({
  ownerName: z.string().min(2),
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8),
  tenantName: z.string().min(2),
  plan: z.enum(["starter", "growth", "pro"])
});

export async function POST(request: Request) {
  const form = Object.fromEntries(await request.formData());
  const input = registerSchema.parse(form);
  const now = new Date();
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    return NextResponse.json({ error: "AUTH_SECRET is required" }, { status: 500 });
  }

  const planCode = input.plan.toUpperCase() as PlanCode;
  const plan = await prisma.plan.findUniqueOrThrow({
    where: { code: planCode }
  });

  const passwordHash = await hashPassword(input.password);

  const tenant = await prisma.tenant.create({
    data: {
      name: input.tenantName,
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
  response.cookies.set(sessionCookieName, createSessionToken({ userId: owner.id, tenantId: tenant.id, role: owner.role }, secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });

  return response;
}
