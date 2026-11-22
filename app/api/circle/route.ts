import { NextRequest } from "next/server";
import {
  addInvite,
  deleteCircle,
  getCircle,
  safeDonorView,
  saveWish,
  withWorkspace,
} from "@/lib/store";
import { donorSession, privateJson, readBody } from "@/lib/session";
import {
  MAX_WISH_LENGTH,
  MAX_SUMMARY_LENGTH,
  MAX_NAME_LENGTH,
} from "@/lib/constants";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const session = donorSession(req);
  if (!session)
    return privateJson({ error: "Choose the donor demo first." }, 401);
  return withWorkspace(session.id, () =>
    privateJson({ circle: safeDonorView(getCircle(session.donorId)!) }),
  );
}
export async function POST(req: NextRequest) {
  const session = donorSession(req);
  if (!session)
    return privateJson({ error: "Choose the donor demo first." }, 401);
  let body: Record<string, unknown>;
  try {
    body = await readBody(req);
  } catch {
    return privateJson({ error: "Invalid request." }, 400);
  }
  return withWorkspace(session.id, () => {
    const circle = getCircle(session.donorId)!;
    if (
      body.action === "wish" &&
      typeof body.wish === "string" &&
      body.wish.trim() &&
      body.wish.length <= MAX_WISH_LENGTH
    )
      saveWish(circle.id, body.wish);
    else if (
      body.action === "summary" &&
      typeof body.summary === "string" &&
      body.summary.length <= MAX_SUMMARY_LENGTH
    )
      circle.summary = body.summary;
    else if (
      body.action === "invite" &&
      typeof body.name === "string" &&
      body.name.length <= MAX_NAME_LENGTH &&
      addInvite(circle.id, body.name)
    ) {
      /* created */
    } else if (body.action === "delete") deleteCircle(circle.id);
    else
      return privateJson(
        {
          error:
            "Check the fields and limits. A circle has at most three people.",
        },
        400,
      );
    return privateJson({ circle: safeDonorView(circle) });
  });
}
