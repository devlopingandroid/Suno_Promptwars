import { NextRequest } from "next/server";
import { donorSession, readBody, privateJson } from "@/lib/session";
import { MAX_WISH_LENGTH } from "@/lib/constants";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  if (!donorSession(req))
    return privateJson({ error: "Start a conversation first." }, 401);
  let wish: unknown;
  try {
    wish = (await readBody(req)).wish;
  } catch {
    return privateJson({ error: "Invalid request." }, 400);
  }
  if (typeof wish !== "string" || !wish.trim() || wish.length > MAX_WISH_LENGTH)
    return privateJson({ error: "Write 1–800 characters." }, 400);
  // Demo aid keeps the original statement verbatim and only adds an optional, gentle frame.
  const original = wish.trim().replace(/\s+/g, " ");
  const hindi = /[\u0900-\u097F]/.test(original);
  const opening = hindi
    ? "मैं आपसे अपनी एक निजी बात साझा करना चाहता/चाहती हूँ। "
    : "I would like to share something personal with you. ";
  const closing = hindi
    ? " हम इस पर तब बात कर सकते हैं जब आप सहज हों।"
    : " We can talk about it when you feel ready.";
  const framed = original.startsWith(opening)
    ? original
    : opening + original + closing;
  const suggestion = framed.length <= MAX_WISH_LENGTH ? framed : original;
  return privateJson({
    suggestion,
    mode: "demo",
    note: "Your original words are preserved inside an optional gentle opening and closing. Review and edit before saving.",
  });
}
