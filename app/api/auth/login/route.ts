import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionToken, getSessionCookieOptions, sessionCookieName, verifyPassword } from "@/lib/session";
import { consoleUrl, dashUrl } from "@/lib/domains";
import { platformRoles } from "@/lib/platform-access";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  const form = Object.fromEntries(await request.formData());
  const input = loginSchema.parse(form);
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    return NextResponse.json({ error: "AUTH_SECRET is required" }, { status: 500 });
  }

  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { tenant: true }
  });

  if (!user || !user.active || !(await verifyPassword(input.password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const target = platformRoles.has(user.role)
    ? dashUrl("/jaad")
    : user.role === "CASHIER"
      ? consoleUrl("/pos")
      : user.tenant && !user.tenant.onboardingCompleted
        ? consoleUrl("/onboarding")
        : consoleUrl("/dashboard");
  const response = NextResponse.redirect(target);
  response.cookies.set(sessionCookieName, createSessionToken({ userId: user.id, tenantId: user.tenantId, role: user.role }, secret), getSessionCookieOptions());

  return response;
}
