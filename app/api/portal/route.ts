import { NextRequest } from "next/server";
import { z } from "zod";
import {
  addEnquiry,
  closeBloodRequest,
  coordinatorView,
  createBloodRequest,
  donorBloodView,
  donorEnquiries,
  expressAvailability,
  getCircle,
  proposeAppointment,
  publishBloodRequest,
  safeDonorView,
  updateAppointment,
  updateEnquiry,
  withdrawAvailability,
  withWorkspace,
  editBloodRequest,
} from "@/lib/store";
import {
  getSession,
  privateJson,
  readBody,
  type DemoSession,
} from "@/lib/session";
export const runtime = "nodejs";
const requestFields = z.object({
  title: z.string().trim().min(1).max(100),
  location: z.string().trim().min(1).max(120),
  bloodGroup: z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]),
  appointmentWindow: z.string().trim().min(1).max(120),
  instructions: z.string().trim().max(300),
});
function view(session: DemoSession) {
  if (session.role === "coordinator")
    return { coordinatorData: coordinatorView() };
  const circle = getCircle(session.donorId);
  return circle
    ? {
        donor: {
          circle: safeDonorView(circle),
          blood: donorBloodView(circle.id),
          enquiries: donorEnquiries(circle.id),
        },
      }
    : null;
}
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
        if (body.action === "cancel" && (!reason || reason.length > 180))
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
        if (answer.length > 500 || (body.action === "resolve" && !answer))
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
        body.question.length > 600
      )
        return fail("Write a question of 1–600 characters.");
      addEnquiry(donorId, body.question, body.language === "hi" ? "hi" : "en");
      return finish();
    }
    return fail("Unknown donor action.");
  });
}
