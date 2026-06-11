import { NextRequest, NextResponse } from "next/server";
import { consoleUrl, getConfiguredHost, isConsolePath, isJaadPath } from "@/lib/domains";

const ignoredPath = /^\/(?:_next|favicon.ico|robots.txt|sitemap.xml|api\/)/;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (ignoredPath.test(pathname)) {
    return NextResponse.next();
  }

  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const marketingHost = getConfiguredHost("NEXT_PUBLIC_MARKETING_URL");
  const consoleHost = getConfiguredHost("NEXT_PUBLIC_CONSOLE_URL");
  const dashHost = getConfiguredHost("NEXT_PUBLIC_DASH_URL");

  if (dashHost && host === dashHost && pathname !== "/forbidden" && !isJaadPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/jaad" : `/jaad${pathname}`;
    return NextResponse.redirect(url);
  }

  if (consoleHost && host === consoleHost && isJaadPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/forbidden";
    return NextResponse.redirect(url);
  }

  if (marketingHost && host === marketingHost && isConsolePath(pathname)) {
    return NextResponse.redirect(consoleUrl(pathname));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"]
};
