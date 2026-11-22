import { NextRequest } from "next/server";
import {
  answerForInvite,
  deleteOwnResponse,
  markDiscussed,
  safeFamilyView,
  submitResponse,
  findInvite,
  addEnquiry,
  withWorkspace,
} from "@/lib/store";
import { resolveConcern } from "@/lib/ai";
import { readBody, privateJson } from "@/lib/session";
export const runtime = "nodejs";
type Context = { params: Promise<{ token: string }> };
const unavailable = () =>
  privateJson({ error: "This invitation is invalid or has expired." }, 404);
export async function GET(_req: NextRequest, { params }: Context) {
  const { token } = await params;
  const view = safeFamilyView(token);
  return view ? privateJson({ invite: view, mode: "demo" }) : unavailable();
}
export async function POST(req: NextRequest, { params }: Context) {
  const { token } = await params;
  if (!safeFamilyView(token)) return unavailable();
  let b: Record<string, unknown>;
  try {
    b = await readBody(req);
  } catch {
    return privateJson({ error: "Invalid request." }, 400);
  }
  if (b.action === "follow-up") {
    const found = findInvite(token);
    if (!found?.invite.question || !found.circle.workspaceId)
      return privateJson({ error: "Ask a question first." }, 400);
    withWorkspace(found.circle.workspaceId, () =>
      addEnquiry(
        found.circle.id,
        found.invite.question!,
        found.invite.result?.language,
      ),
    );
    return privateJson({
      invite: safeFamilyView(token),
      followUpRequested: true,
    });
  }
  if (b.action === "delete") {
    deleteOwnResponse(token);
    return privateJson({ invite: safeFamilyView(token) });
  }
  if (b.action === "discussed") {
    const view = markDiscussed(token);
    return view
      ? privateJson({ invite: view })
      : privateJson({ error: "Ask a question first." }, 400);
  }
  if (
    b.action === "respond" &&
    (b.kind === "understand" || b.kind === "not-ready")
  ) {
    return privateJson({ invite: submitResponse(token, b.kind) });
  }
  if (
    b.action === "respond" &&
    b.kind === "question" &&
    typeof b.question === "string"
  ) {
    const valid = answerForInvite(token, b.question);
    if (!valid)
      return privateJson(
        { error: "Please enter a question under 600 characters." },
        400,
      );
    const revision = findInvite(token)!.invite.revision;
    const { result, mode } = await resolveConcern(b.question);
    const latest = findInvite(token);
    if (!latest) return unavailable();
    if (latest.invite.revision !== revision)
      return privateJson(
        {
          error:
            "Your response changed while this answer was loading. Please try again.",
        },
        409,
      );
    const view = submitResponse(token, "question", b.question, result);
    return privateJson({ invite: view, mode });
  }
  return privateJson({ error: "Invalid request." }, 400);
}
