import crypto from "node:crypto";
import bcrypt from "bcryptjs";

export const sessionCookieName = "jaadpos_session";

export type SessionPayload = {
  userId: string;
  tenantId: string | null;
  role: string;
  expiresAt: number;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createSessionToken(payload: Omit<SessionPayload, "expiresAt">, secret: string, ttlSeconds = 60 * 60 * 8) {
  const body: SessionPayload = {
    ...payload,
    expiresAt: Math.floor(Date.now() / 1000) + ttlSeconds
  };
  const encoded = Buffer.from(JSON.stringify(body)).toString("base64url");
  const signature = sign(encoded, secret);
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string, secret: string): SessionPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(sign(encoded, secret)))) {
    return null;
  }

  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
  if (payload.expiresAt < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

function sign(value: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}
