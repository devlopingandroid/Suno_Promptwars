import { NextRequest, NextResponse } from "next/server";
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
  NextResponse.json(
    { error: "This invitation is invalid or has expired." },
    { status: 404, headers: { "Cache-Control": "no-store" } },
  );
export async function GET(_req: NextRequest, { params }: Context) {
  const { token } = await params;
  const view = safeFamilyView(token);
  return view
    ? NextResponse.json(
        { invite: view, mode: "demo" },
        {
          headers: {
            "Cache-Control": "no-store",
            "Referrer-Policy": "no-referrer",
          },
        },
      )
    : unavailable();
}
export async function POST(req: NextRequest, { params }: Context) {
  const { token } = await params;
  if (!safeFamilyView(token)) return unavailable();
  let b: Record<string, unknown>;
  try {
    b = await readBody(req);
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
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
    return NextResponse.json({ invite: safeFamilyView(token) });
  }
  if (b.action === "discussed") {
    const view = markDiscussed(token);
    return view
      ? NextResponse.json({ invite: view })
      : NextResponse.json({ error: "Ask a question first." }, { status: 400 });
  }
  if (
    b.action === "respond" &&
    (b.kind === "understand" || b.kind === "not-ready")
  ) {
    return NextResponse.json({ invite: submitResponse(token, b.kind) });
  }
  if (
    b.action === "respond" &&
    b.kind === "question" &&
    typeof b.question === "string"
  ) {
    const valid = answerForInvite(token, b.question);
    if (!valid)
      return NextResponse.json(
        { error: "Please enter a question under 600 characters." },
        { status: 400 },
      );
    const { result, mode } = await resolveConcern(b.question);
    const view = submitResponse(token, "question", b.question, result);
    return NextResponse.json({ invite: view, mode });
  }
  return NextResponse.json({ error: "Invalid request." }, { status: 400 });
}
