import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCircle, releaseWorkspace, withWorkspace } from "./store";
import { SESSION_TTL_MS, MAX_SESSIONS, MAX_BODY_SIZE } from "./constants";

export type DemoSession = {
  id: string;
  role: "donor" | "coordinator";
  donorId?: string;
  expiresAt: number;
};
declare global {
  var sunoSessions: Map<string, DemoSession> | undefined;
}
const sessions = (globalThis.sunoSessions ??= new Map<string, DemoSession>());

function pruneExpiredSessions() {
  const now = Date.now();
  // Fixed TTL + insertion order means expired sessions form a prefix.
  for (const [key, value] of sessions) {
    if (value.expiresAt > now) break;
    sessions.delete(key);
    releaseWorkspace(key);
  }
  // Reserve room before insertion, so the limit is never exceeded.
  while (sessions.size >= MAX_SESSIONS) {
    const key = sessions.keys().next().value!;
    sessions.delete(key);
    releaseWorkspace(key);
  }
}

export function getSession(req: NextRequest) {
  const session = sessions.get(req.cookies.get("suno_session")?.value ?? "");
  if (!session) return undefined;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(session.id);
    releaseWorkspace(session.id);
    return undefined;
  }
  return session;
}
export function createSession(role: DemoSession["role"]): DemoSession {
  pruneExpiredSessions();
  const session = {
    id: randomBytes(24).toString("base64url"),
    role,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  sessions.set(session.id, session);
  return session;
}
export function setSessionCookie(response: NextResponse, session: DemoSession) {
  response.cookies.set("suno_session", session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000)),
  });
}
export function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
export function validOrigin(req: NextRequest) {
  if (req.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = req.headers.get("origin");
  if (!origin) return true;
  // Cloud Run terminates HTTPS before forwarding to Node. Host is the actual
  // request authority; never trust a client-supplied x-forwarded-host.
  const host = req.headers.get("host");
  const protocol =
    req.headers.get("x-forwarded-proto") === "https"
      ? "https:"
      : new URL(req.url).protocol;
  return origin === (host ? `${protocol}//${host}` : new URL(req.url).origin);
}
export async function readBody(req: NextRequest) {
  if (!validOrigin(req))
    throw new Error("Cross-origin writes are not allowed.");
  const contentType = req.headers.get("content-type")?.split(";")[0].trim();
  if (contentType !== "application/json") throw new Error("Expected JSON.");
  const length = req.headers.get("content-length");
  if (length && Number(length) > MAX_BODY_SIZE)
    throw new Error("Request is too large.");
  if (!req.body) throw new Error("Invalid request.");
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_SIZE) {
        await reader.cancel();
        throw new Error("Request is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const text = Buffer.concat(chunks, size).toString("utf8");
  const body: unknown = JSON.parse(text);
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new Error("Invalid request.");
  return body as Record<string, unknown>;
}
export function donorSession(req: NextRequest) {
  const session = getSession(req);
  return session?.role === "donor" &&
    session.donorId &&
    withWorkspace(session.id, () => getCircle(session.donorId))
    ? session
    : undefined;
}
