import { NextResponse } from "next/server";
import { consoleUrl, dashUrl } from "@/lib/domains";
import { platformRoles } from "@/lib/platform-access";
import { getSessionCookieOptions, sessionCookieName, verifySessionToken } from "@/lib/session";

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${sessionCookieName}=`))
    ?.split("=")[1];
  const session = token && process.env.AUTH_SECRET ? verifySessionToken(decodeURIComponent(token), process.env.AUTH_SECRET) : null;
  const response = NextResponse.redirect(session && platformRoles.has(session.role) ? dashUrl("/jaad/login") : consoleUrl("/login"));
  response.cookies.set(sessionCookieName, "", { ...getSessionCookieOptions(), maxAge: 0 });
  return response;
}
