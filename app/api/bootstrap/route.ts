import { NextRequest } from "next/server";
import {
  coordinatorView,
  createCircle,
  deleteCircle,
  donorBloodView,
  donorEnquiries,
  getCircle,
  getHospital,
  resetDemoData,
  safeDonorView,
  withWorkspace,
} from "@/lib/store";
import {
  createSession,
  getSession,
  privateJson,
  readBody,
  setSessionCookie,
  type DemoSession,
} from "@/lib/session";
export const runtime = "nodejs";

function view(session: DemoSession) {
  const circle = getCircle(session.donorId);
  return {
    mode: "demo",
    role: session.role,
    hospital: getHospital(),
    donor:
      session.role === "donor" && circle
        ? {
            circle: safeDonorView(circle),
            blood: donorBloodView(circle.id),
            enquiries: donorEnquiries(circle.id),
          }
        : null,
    coordinatorData: session.role === "coordinator" ? coordinatorView() : null,
  };
}
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
      if (session.donorId) deleteCircle(session.donorId);
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
