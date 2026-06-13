type PublicUrlKey = "NEXT_PUBLIC_MARKETING_URL" | "NEXT_PUBLIC_CONSOLE_URL" | "NEXT_PUBLIC_DASH_URL";

function joinPublicUrl(key: PublicUrlKey, path = "/") {
  const base = process.env[key];
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!base) {
    return normalizedPath;
  }

  return new URL(normalizedPath, base).toString();
}

export function marketingUrl(path = "/") {
  return joinPublicUrl("NEXT_PUBLIC_MARKETING_URL", path);
}

export function consoleUrl(path = "/") {
  return joinPublicUrl("NEXT_PUBLIC_CONSOLE_URL", path);
}

export function dashUrl(path = "/") {
  return joinPublicUrl("NEXT_PUBLIC_DASH_URL", path);
}

export function getConfiguredHost(key: PublicUrlKey) {
  const value = process.env[key];
  return value ? new URL(value).hostname : null;
}

export function isConsolePath(pathname: string) {
  return [
    "/login",
    "/signup",
    "/onboarding",
    "/dashboard",
    "/pos",
    "/branches",
    "/devices",
    "/products",
    "/orders",
    "/invoices",
    "/shifts",
    "/reports",
    "/settings",
    "/users"
  ].some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function isJaadPath(pathname: string) {
  return pathname === "/jaad" || pathname.startsWith("/jaad/");
}
