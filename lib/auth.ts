import crypto from "crypto";
import { cookies } from "next/headers";
import { readJson } from "./storage";

const COOKIE_NAME = "invoice_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

interface User {
  username: string;
  password?: string;
  passwordHash?: string;
}

interface UsersFile {
  users: User[];
}

const EMPTY_USERS: UsersFile = { users: [] };

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET no está definido. Configúralo en .env.local o en las variables de entorno de Vercel."
    );
  }
  return secret;
}

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
}

export function createToken(username: string): string {
  const expires = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = Buffer.from(
    JSON.stringify({ u: username, e: expires })
  ).toString("base64url");
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifyToken(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (expected !== signature) return null;
  try {
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf-8")
    ) as { u: string; e: number };
    if (decoded.e < Date.now()) return null;
    return decoded.u;
  } catch {
    return null;
  }
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function verifyPassword(password: string, stored: string): boolean {
  if (stored.startsWith("scrypt:")) {
    const [, salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const computed = crypto.scryptSync(password, salt, 64).toString("hex");
    return timingSafeEqualHex(computed, hash);
  }
  // Plain-text fallback (only for local development convenience)
  return stored === password;
}

export async function validateCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const envUser = process.env.AUTH_USERNAME;
  const envHash = process.env.AUTH_PASSWORD_HASH;

  if (envUser && envHash) {
    if (username !== envUser) return false;
    return verifyPassword(password, envHash);
  }

  const data = await readJson<UsersFile>("users.json", EMPTY_USERS);
  const found = data.users.find((u) => u.username === username);
  if (!found) return false;
  const stored = found.passwordHash ?? found.password;
  if (!stored) return false;
  return verifyPassword(password, stored);
}

export async function getCurrentUser(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return verifyToken(token);
}

export const SESSION_COOKIE = COOKIE_NAME;
export const SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE;
