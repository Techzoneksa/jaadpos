import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionCookieName, verifySessionToken } from "@/lib/session";
import { consoleUrl, dashUrl } from "@/lib/domains";

export const platformRoles = new Set(["PLATFORM_OWNER", "PLATFORM_STAFF"]);
export const tenantRoles = new Set(["TENANT_OWNER", "BRANCH_MANAGER", "CASHIER", "ACCOUNTANT"]);
export type TenantRole = "TENANT_OWNER" | "BRANCH_MANAGER" | "CASHIER" | "ACCOUNTANT";

export async function getCurrentSession() {
  const token = (await cookies()).get(sessionCookieName)?.value;
  const secret = process.env.AUTH_SECRET;

  if (!token || !secret) {
    return null;
  }

  return verifySessionToken(token, secret);
}

export async function requirePlatformAccess() {
  const session = await getCurrentSession();

  if (!session) {
    redirect(dashUrl("/jaad/login"));
  }

  if (!platformRoles.has(session.role)) {
    redirect("/forbidden");
  }

  return session;
}

export async function requireTenantAccess(allowedRoles?: TenantRole[]) {
  const session = await getCurrentSession();

  if (!session) {
    redirect(consoleUrl("/login"));
  }

  if (platformRoles.has(session.role)) {
    redirect(dashUrl("/jaad"));
  }

  if (!session.tenantId || !tenantRoles.has(session.role)) {
    redirect(consoleUrl("/login"));
  }

  if (allowedRoles && !allowedRoles.includes(session.role as TenantRole)) {
    redirect("/forbidden");
  }

  return session;
}
