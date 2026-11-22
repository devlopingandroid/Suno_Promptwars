import { NextRequest } from "next/server";
import { z } from "zod";
import {
  addEnquiry,
  closeBloodRequest,
  createBloodRequest,
  expressAvailability,
  getCircle,
  proposeAppointment,
  publishBloodRequest,
  updateAppointment,
  updateEnquiry,
  withdrawAvailability,
  withWorkspace,
  editBloodRequest,
} from "@/lib/store";
import { getSession, privateJson, readBody } from "@/lib/session";
import { portalView as view } from "@/lib/portal-view";
import {
  MAX_TITLE_LENGTH,
  MAX_LOCATION_LENGTH,
  MAX_INSTRUCTION_LENGTH,
  MAX_CANCEL_REASON_LENGTH,
  MAX_ANSWER_LENGTH,
  MAX_QUESTION_LENGTH,
} from "@/lib/constants";
export const runtime = "nodejs";
const requestFields = z.object({
  title: z.string().trim().min(1).max(MAX_TITLE_LENGTH),
  location: z.string().trim().min(1).max(MAX_LOCATION_LENGTH),
  bloodGroup: z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]),
  appointmentWindow: z.string().trim().min(1).max(120),
  instructions: z.string().trim().max(MAX_INSTRUCTION_LENGTH),
});
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return privateJson({ error: "Choose a demo role first." }, 401);
  return withWorkspace(session.id, () =>
    privateJson({ role: session.role, ...view(session) }),
  );
}
export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return privateJson({ error: "Choose a demo role first." }, 401);
  let body: Record<string, unknown>;
  try {
    body = await readBody(req);
  } catch {
    return privateJson({ error: "Invalid request." }, 400);
  }
  return withWorkspace(session.id, () => {
    const fail = (message: string) => privateJson({ error: message }, 400);
    const finish = () => privateJson(view(session));
    const requestId = typeof body.requestId === "string" ? body.requestId : "";
    const appointmentId =
      typeof body.appointmentId === "string" ? body.appointmentId : "";
    if (session.role === "coordinator") {
      if (body.action === "create-request" || body.action === "edit-request") {
        const fields = requestFields.safeParse(body);
        if (!fields.success)
          return fail(
            "Enter valid request fields within the character limits.",
          );
        if (body.action === "edit-request") {
          if (!editBloodRequest(requestId, fields.data))
            return fail("Only draft requests can be edited.");
        } else createBloodRequest(fields.data);
        return finish();
      }
      if (body.action === "publish")
        return publishBloodRequest(requestId)
          ? finish()
          : fail("Only draft requests can be published.");
      if (body.action === "close")
        return closeBloodRequest(requestId)
          ? finish()
          : fail("Only published requests can be closed.");
      if (body.action === "propose")
        return typeof body.responseId === "string" &&
          proposeAppointment(requestId, body.responseId)
          ? finish()
          : fail("This response is no longer available.");
      if (body.action === "cancel" || body.action === "complete") {
        const reason =
          typeof body.reason === "string" ? body.reason.trim() : "";
        if (
          body.action === "cancel" &&
          (!reason || reason.length > MAX_CANCEL_REASON_LENGTH)
        )
          return fail("Enter a cancellation explanation (1–180 characters).");
        return updateAppointment(
          appointmentId,
          null,
          body.action === "complete" ? "completed" : "cancelled",
          reason,
        )
          ? finish()
          : fail("Invalid appointment transition.");
      }
      if (body.action === "start-follow-up" || body.action === "resolve") {
        const answer =
          typeof body.answer === "string" ? body.answer.trim() : "";
        if (
          answer.length > MAX_ANSWER_LENGTH ||
          (body.action === "resolve" && !answer)
        )
          return fail(
            "Write a donor-visible message before resolving (up to 500 characters).",
          );
        return typeof body.enquiryId === "string" &&
          updateEnquiry(
            body.enquiryId,
            body.action === "resolve" ? "resolved" : "in progress",
            answer,
          )
          ? finish()
          : fail("Invalid enquiry transition.");
      }
      return fail("Unknown coordinator action.");
    }
    const donorId = session.donorId;
    if (!donorId || !getCircle(donorId))
      return fail("Start the donor demo first.");
    if (body.action === "volunteer") {
      const result = expressAvailability(requestId, donorId);
      return result.error ? fail(result.error) : finish();
    }
    if (body.action === "withdraw")
      return withdrawAvailability(requestId, donorId)
        ? finish()
        : fail("Only an available response can be withdrawn.");
    if (
      body.action === "confirm" ||
      body.action === "decline" ||
      body.action === "cancel"
    )
      return updateAppointment(
        appointmentId,
        donorId,
        body.action === "confirm"
          ? "confirmed"
          : body.action === "decline"
            ? "declined"
            : "cancelled",
      )
        ? finish()
        : fail("Invalid appointment transition.");
    if (body.action === "request-follow-up") {
      if (
        typeof body.question !== "string" ||
        !body.question.trim() ||
        body.question.length > MAX_QUESTION_LENGTH
      )
        return fail("Write a question of 1–600 characters.");
      addEnquiry(donorId, body.question, body.language === "hi" ? "hi" : "en");
      return finish();
    }
    return fail("Unknown donor action.");
  });
}
