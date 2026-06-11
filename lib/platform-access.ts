import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionCookieName, verifySessionToken } from "@/lib/session";
import { dashUrl } from "@/lib/domains";

export const platformRoles = new Set(["PLATFORM_OWNER", "PLATFORM_STAFF"]);

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
