import { NextRequest } from "next/server";
import {
  createCircle,
  releaseWorkspace,
  getCircle,
  resetDemoData,
  withWorkspace,
} from "@/lib/store";
import {
  createSession,
  getSession,
  privateJson,
  readBody,
  setSessionCookie,
} from "@/lib/session";
import { bootstrapView as view } from "@/lib/portal-view";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const session = getSession(req);
  return session
    ? withWorkspace(session.id, () => privateJson(view(session)))
    : privateJson({ mode: "demo", role: null });
}
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await readBody(req);
  } catch {
    return privateJson({ error: "Invalid request." }, 400);
  }
  if (body.role !== "donor" && body.role !== "coordinator")
    return privateJson({ error: "Choose a demo role." }, 400);
  const session = getSession(req) ?? createSession(body.role);
  session.role = body.role;
  return withWorkspace(session.id, () => {
    if (body.reset === true) {
      releaseWorkspace(session.id);
      session.donorId = undefined;
      resetDemoData();
    }
    if (session.role === "donor" && !getCircle(session.donorId))
      session.donorId = createCircle(body.seeded === true).id;
    const response = privateJson(view(session));
    setSessionCookie(response, session);
    return response;
  });
}
