import { NextRequest } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://foursight-backend.harshiyer.workers.dev/api/v1";

export interface AuthUser {
  username: string;
  email?: string;
}

/**
 * Validates the JWT `token` cookie against the existing Foursight backend.
 * Returns the authenticated user or null.
 */
export async function getAuthUser(
  req: NextRequest
): Promise<AuthUser | null> {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${BACKEND_URL}/auth/verifyToken`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      // Short timeout to avoid hanging
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    // Decode JWT payload to get username (the backend already verified it)
    const payload = parseJwt(token);
    if (!payload?.username) return null;
    return { username: payload.username, email: payload.email };
  } catch {
    return null;
  }
}

/**
 * Validates the admin session cookie.
 */
export async function getAdminAuth(req: NextRequest): Promise<boolean> {
  const adminToken = req.cookies.get("adminToken")?.value;
  if (!adminToken) return false;

  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;

  // We store a hashed version; for simplicity compare directly.
  // In production you'd store in DB with expiry.
  return adminToken === Buffer.from(secret).toString("base64");
}

function parseJwt(token: string): Record<string, any> | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}
