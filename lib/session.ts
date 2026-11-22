import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCircle, withWorkspace } from "./store";
import { SESSION_TTL_MS, MAX_SESSIONS } from "./constants";

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
  for (const [key, value] of sessions) {
    if (value.expiresAt < now) sessions.delete(key);
  }
  if (sessions.size > MAX_SESSIONS) {
    // Evict oldest entries if capacity exceeded
    const toDelete = sessions.size - MAX_SESSIONS;
    let count = 0;
    for (const key of sessions.keys()) {
      if (count++ >= toDelete) break;
      sessions.delete(key);
    }
  }
}

export function getSession(req: NextRequest) {
  const session = sessions.get(req.cookies.get("suno_session")?.value ?? "");
  return session && session.expiresAt > Date.now() ? session : undefined;
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
    maxAge: 86400,
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
  const origin = req.headers.get("origin");
  return !origin || origin === new URL(req.url).origin;
}
export async function readBody(req: NextRequest) {
  if (!validOrigin(req))
    throw new Error("Cross-origin writes are not allowed.");
  const text = await req.text();
  if (text.length > 12000) throw new Error("Request is too large.");
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
