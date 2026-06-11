import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionToken, sessionCookieName, verifyPassword } from "@/lib/session";

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

  const target = user.tenant && !user.tenant.onboardingCompleted ? "/onboarding" : "/dashboard";
  const response = NextResponse.redirect(new URL(target, request.url));
  response.cookies.set(sessionCookieName, createSessionToken({ userId: user.id, tenantId: user.tenantId, role: user.role }, secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });

  return response;
}
