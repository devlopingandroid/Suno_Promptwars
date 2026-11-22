import { randomBytes } from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";
import { answerConcern, type ConcernResult } from "./sources";

export type InviteStatus =
  | "invited"
  | "viewed"
  | "wish understood"
  | "question open"
  | "conversation completed"
  | "declined to discuss";
export type Invite = {
  token: string;
  name: string;
  expiresAt: number;
  viewedAt?: number;
  status: InviteStatus;
  question?: string;
  result?: ConcernResult;
  response?: "understand" | "question" | "not-ready";
};
export type Circle = {
  id: string;
  workspaceId?: string;
  wish: string;
  summary?: string;
  invites: Invite[];
  createdAt: number;
};
export type RequestStatus = "draft" | "published" | "closed";
export type VolunteerStatus =
  "available" | "withdrawn" | "appointment proposed";
export type AppointmentStatus =
  "proposed" | "confirmed" | "completed" | "declined" | "cancelled";
export type Activity = {
  id: string;
  actor: string;
  actorRole: "coordinator" | "donor" | "system";
  label: string;
  at: number;
};
export type VolunteerResponse = {
  id: string;
  requestId: string;
  donorId: string;
  donorName: string;
  status: VolunteerStatus;
  createdAt: number;
  updatedAt: number;
};
export type Appointment = {
  id: string;
  requestId: string;
  responseId: string;
  donorId: string;
  donorName: string;
  window: string;
  status: AppointmentStatus;
  reason?: string;
  createdAt: number;
  updatedAt: number;
};
export type BloodRequest = {
  id: string;
  title: string;
  hospitalId: string;
  hospitalName: string;
  location: string;
  bloodGroup: string;
  appointmentWindow: string;
  instructions: string;
  status: RequestStatus;
  createdAt: number;
  updatedAt: number;
  coordinatorName: string;
  coordinatorRole: string;
  internalNote: string;
  responses: VolunteerResponse[];
  appointments: Appointment[];
  activity: Activity[];
};
export type Enquiry = {
  id: string;
  donorId: string;
  type: "organ" | "blood";
  subject: string;
  question: string;
  language: "en" | "hi";
  status: "open" | "in progress" | "resolved";
  requestFollowUp: boolean;
  answer?: string;
  internalNote?: string;
  createdAt: number;
  updatedAt: number;
  activity: Activity[];
};
export type Hospital = {
  id: string;
  name: string;
  address: string;
  phone: string;
  coordinatorName: string;
  coordinatorRole: string;
  source: string;
  reviewedAt: string;
  synthetic: boolean;
};

type AppData = {
  circles: Map<string, Circle>;
  requests: Map<string, BloodRequest>;
  enquiries: Map<string, Enquiry>;
  hospital: Hospital;
  initialized: boolean;
};
declare global {
  var sunoDemoStore: Map<string, Circle> | undefined;
  var sunoAppData: AppData | undefined;
}
const circles =
  globalThis.sunoDemoStore ??
  (globalThis.sunoDemoStore = new Map<string, Circle>());
const defaultApp: AppData =
  globalThis.sunoAppData ??
  (globalThis.sunoAppData = {
    circles,
    requests: new Map(),
    enquiries: new Map(),
    hospital: {
      id: "demo-hospital",
      name: "Suno City Hospital",
      address: "14 River Road, New Delhi · East Wing",
      phone: "+91 11 4000 1212",
      coordinatorName: "Dr. Ananya Mehta",
      coordinatorRole: "Donation coordination lead",
      source: "Synthetic demo profile · review process not represented",
      reviewedAt: "22 Nov 2026",
      synthetic: true,
    },
    initialized: false,
  });

const scope = new AsyncLocalStorage<string>();
declare global {
  var sunoWorkspaces: Map<string, AppData> | undefined;
}
const workspaces = (globalThis.sunoWorkspaces ??= new Map());
export function withWorkspace<T>(workspaceId: string, fn: () => T): T {
  return scope.run(workspaceId, fn);
}
const app = new Proxy(defaultApp, {
  get(target, property) {
    const key = scope.getStore();
    if (!key) return Reflect.get(target, property);
    if (!workspaces.has(key))
      workspaces.set(key, {
        ...defaultApp,
        requests: new Map(),
        enquiries: new Map(),
        initialized: false,
      });
    return Reflect.get(workspaces.get(key)!, property);
  },
  set(target, property, value) {
    const key = scope.getStore();
    return Reflect.set(key ? workspaces.get(key)! : target, property, value);
  },
});

export const DEMO_TTL_MS = 24 * 60 * 60 * 1000;
export const DEMO_COORDINATOR_ID = "demo-coordinator";
const id = () => randomBytes(16).toString("base64url");
const now = () => Date.now();
const activity = (
  actor: Activity["actor"],
  actorRole: Activity["actorRole"],
  label: string,
): Activity => ({ id: id(), actor, actorRole, label, at: now() });

export function ensureDemoData() {
  if (app.initialized) return app;
  const request: BloodRequest = {
    id: "req-city-001",
    title: "Volunteer blood donation session",
    hospitalId: app.hospital.id,
    hospitalName: app.hospital.name,
    location: "East Wing · Donation desk",
    bloodGroup: "O+",
    appointmentWindow: "Sat 28 Nov · 09:00–13:00",
    instructions:
      "Bring a photo ID and arrive 10 minutes before your selected time. Hospital screening happens before any donation decision.",
    status: "published",
    createdAt: now() - 1000 * 60 * 38,
    updatedAt: now() - 1000 * 60 * 12,
    coordinatorName: app.hospital.coordinatorName,
    coordinatorRole: app.hospital.coordinatorRole,
    internalNote:
      "Synthetic request for the judge demo. Internal notes never appear in donor responses.",
    responses: [],
    appointments: [],
    activity: [
      activity(
        app.hospital.coordinatorName,
        "coordinator",
        "Published a volunteer request",
      ),
    ],
  };
  app.requests.set(request.id, request);
  app.initialized = true;
  return app;
}
export function resetDemoData() {
  app.requests.clear();
  app.enquiries.clear();
  app.initialized = false;
  ensureDemoData();
}
export function getHospital() {
  ensureDemoData();
  return app.hospital;
}
export function getCircle(idValue: string | undefined) {
  const circle = idValue ? circles.get(idValue) : undefined;
  return circle &&
    (!scope.getStore() || circle.workspaceId === scope.getStore())
    ? circle
    : undefined;
}
export function createCircle(seeded = false) {
  const circle: Circle = {
    id: id(),
    workspaceId: scope.getStore(),
    wish: seeded
      ? "I am considering organ and tissue donation after death. I would like my family to understand my wish and feel free to ask questions."
      : "",
    invites: [],
    createdAt: now(),
  };
  circles.set(circle.id, circle);
  if (seeded) {
    addInvite(circle.id, "Mother");
    addInvite(circle.id, "Brother");
  }
  return circle;
}
export function saveWish(circleId: string, wish: string) {
  const circle = getCircle(circleId);
  if (!circle) return null;
  circle.wish = wish.slice(0, 800);
  return circle;
}
export function addInvite(circleId: string, name: string) {
  const circle = getCircle(circleId);
  if (!circle || circle.invites.length >= 3 || !name.trim()) return null;
  const invite: Invite = {
    token: randomBytes(24).toString("base64url"),
    name: name.trim().slice(0, 40),
    expiresAt: now() + DEMO_TTL_MS,
    status: "invited",
  };
  circle.invites.push(invite);
  return invite;
}
export function findInvite(tokenValue: string, at = now()) {
  for (const circle of circles.values()) {
    const invite = circle.invites.find((item) => item.token === tokenValue);
    if (invite) return invite.expiresAt > at ? { circle, invite } : null;
  }
  return null;
}
export function getInviteView(tokenValue: string) {
  const found = findInvite(tokenValue);
  if (!found) return null;
  found.invite.viewedAt = now();
  if (found.invite.status === "invited") found.invite.status = "viewed";
  return {
    wish: found.circle.wish,
    name: found.invite.name,
    status: found.invite.status,
    question: found.invite.question,
    result: found.invite.result,
    expiresAt: found.invite.expiresAt,
  };
}
export function submitResponse(
  tokenValue: string,
  kind: "understand" | "question" | "not-ready",
  question?: string,
  result?: ConcernResult,
) {
  const found = findInvite(tokenValue);
  if (!found) return null;
  const invite = found.invite;
  if (
    kind === "question" &&
    (!question?.trim() || question.length > 600 || !result)
  )
    return null;
  invite.response = kind;
  invite.question = kind === "question" ? question!.trim() : undefined;
  invite.result = kind === "question" ? result : undefined;
  invite.status =
    kind === "not-ready"
      ? "declined to discuss"
      : kind === "understand"
        ? "wish understood"
        : "question open";
  return getInviteView(tokenValue);
}
export function deleteOwnResponse(tokenValue: string) {
  const found = findInvite(tokenValue);
  if (!found) return false;
  const invite = found.invite;
  invite.response = undefined;
  invite.question = undefined;
  invite.result = undefined;
  invite.status = "viewed";
  return true;
}
export function markDiscussed(tokenValue: string) {
  const found = findInvite(tokenValue);
  if (
    !found ||
    found.invite.response !== "question" ||
    found.invite.result?.status !== "supported"
  )
    return null;
  found.invite.status = "conversation completed";
  return getInviteView(tokenValue);
}
export function deleteCircle(circleId: string) {
  const circle = getCircle(circleId);
  if (!circle) return false;
  circle.wish = "";
  circle.summary = "";
  circle.invites = [];
  return true;
}
export function safeDonorView(circle: Circle) {
  return {
    id: circle.id,
    createdAt: circle.createdAt,
    wish: circle.wish,
    summary: circle.summary,
    invites: circle.invites.map((item) => ({
      name: item.name,
      token: item.token,
      expiresAt: item.expiresAt,
      status: item.status,
      question: item.question,
      result: item.result,
    })),
  };
}
export function safeFamilyView(tokenValue: string) {
  return getInviteView(tokenValue);
}
export function answerForInvite(tokenValue: string, question: string) {
  if (!findInvite(tokenValue) || question.length > 600 || !question.trim())
    return null;
  return answerConcern(question);
}

function publicRequest(item: BloodRequest) {
  return {
    id: item.id,
    title: item.title,
    hospitalName: item.hospitalName,
    location: item.location,
    bloodGroup: item.bloodGroup,
    appointmentWindow: item.appointmentWindow,
    instructions: item.instructions,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    coordinatorName: item.coordinatorName,
    coordinatorRole: item.coordinatorRole,
    activity: item.activity
      .filter((event) => event.actorRole === "coordinator")
      .map((event) => ({ ...event })),
  };
}
export function publicBloodRequests() {
  ensureDemoData();
  return [...app.requests.values()]
    .filter((item) => item.status === "published")
    .map(publicRequest);
}
export function donorBloodView(donorId: string) {
  ensureDemoData();
  const published = publicBloodRequests();
  const responses = [...app.requests.values()].flatMap((request) =>
    request.responses
      .filter((item) => item.donorId === donorId)
      .map((item) => ({
        ...item,
        request:
          published.find((entry) => entry.id === request.id) ??
          publicRequest(request),
      })),
  );
  const appointments = [...app.requests.values()].flatMap((request) =>
    request.appointments
      .filter((item) => item.donorId === donorId)
      .map((item) => ({
        ...item,
        request:
          published.find((entry) => entry.id === request.id) ??
          publicRequest(request),
      })),
  );
  return { requests: published, responses, appointments };
}
export function coordinatorView() {
  ensureDemoData();
  return {
    hospital: app.hospital,
    requests: [...app.requests.values()].map((item) => ({
      ...item,
      activity: [...item.activity].sort((a, b) => b.at - a.at),
    })),
    enquiries: [...app.enquiries.values()]
      .map((item) => ({
        ...item,
        activity: [...item.activity].sort((a, b) => b.at - a.at),
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt),
    recentActivity: [
      ...[...app.requests.values()].flatMap((item) => item.activity),
      ...[...app.enquiries.values()].flatMap((item) => item.activity),
    ]
      .sort((a, b) => b.at - a.at)
      .slice(0, 8),
  };
}
export function createBloodRequest(input: {
  title: string;
  location: string;
  bloodGroup: string;
  appointmentWindow: string;
  instructions: string;
}) {
  ensureDemoData();
  const request: BloodRequest = {
    id: id(),
    title: input.title.slice(0, 100),
    hospitalId: app.hospital.id,
    hospitalName: app.hospital.name,
    location: input.location.slice(0, 120),
    bloodGroup: input.bloodGroup.slice(0, 12),
    appointmentWindow: input.appointmentWindow.slice(0, 120),
    instructions: input.instructions.slice(0, 300),
    status: "draft",
    createdAt: now(),
    updatedAt: now(),
    coordinatorName: app.hospital.coordinatorName,
    coordinatorRole: app.hospital.coordinatorRole,
    internalNote: "Created in synthetic demo mode.",
    responses: [],
    appointments: [],
    activity: [
      activity(
        app.hospital.coordinatorName,
        "coordinator",
        "Created a draft volunteer request",
      ),
    ],
  };
  app.requests.set(request.id, request);
  return request;
}
function getRequest(requestId: string) {
  ensureDemoData();
  return app.requests.get(requestId);
}
export function editBloodRequest(
  requestId: string,
  fields: Pick<
    BloodRequest,
    "title" | "location" | "bloodGroup" | "appointmentWindow" | "instructions"
  >,
) {
  const request = getRequest(requestId);
  if (!request || request.status !== "draft") return null;
  Object.assign(request, fields);
  recordRequest(
    request,
    app.hospital.coordinatorName,
    "coordinator",
    "Edited draft request",
  );
  return request;
}
function recordRequest(
  request: BloodRequest,
  actor: Activity["actor"],
  actorRole: Activity["actorRole"],
  label: string,
) {
  request.updatedAt = now();
  request.activity.push(activity(actor, actorRole, label));
}
export function publishBloodRequest(requestId: string) {
  const request = getRequest(requestId);
  if (!request || request.status !== "draft") return null;
  request.status = "published";
  recordRequest(
    request,
    app.hospital.coordinatorName,
    "coordinator",
    "Published a volunteer request",
  );
  return request;
}
export function closeBloodRequest(requestId: string) {
  const request = getRequest(requestId);
  if (!request || request.status !== "published") return null;
  request.status = "closed";
  recordRequest(
    request,
    app.hospital.coordinatorName,
    "coordinator",
    "Closed the volunteer request",
  );
  return request;
}
export function expressAvailability(
  requestId: string,
  donorId: string,
  donorName = "Demo donor",
) {
  const request = getRequest(requestId);
  if (!request || request.status !== "published")
    return {
      error: "This request is not open for volunteer responses.",
    } as const;
  const existing = request.responses.find(
    (item) => item.donorId === donorId && item.status !== "withdrawn",
  );
  if (existing)
    return {
      error: "You already expressed availability for this request.",
    } as const;
  const response: VolunteerResponse = {
    id: id(),
    requestId,
    donorId,
    donorName,
    status: "available",
    createdAt: now(),
    updatedAt: now(),
  };
  request.responses.push(response);
  recordRequest(request, donorName, "donor", "Expressed availability");
  return { response, request } as const;
}
export function withdrawAvailability(requestId: string, donorId: string) {
  const request = getRequest(requestId);
  const response = request?.responses.find(
    (item) => item.donorId === donorId && item.status === "available",
  );
  if (!request || !response) return null;
  response.status = "withdrawn";
  response.updatedAt = now();
  recordRequest(request, response.donorName, "donor", "Withdrew availability");
  return response;
}
export function proposeAppointment(requestId: string, responseId: string) {
  const request = getRequest(requestId);
  const response = request?.responses.find(
    (item) => item.id === responseId && item.status === "available",
  );
  if (!request || request.status !== "published" || !response) return null;
  const appointment: Appointment = {
    id: id(),
    requestId,
    responseId,
    donorId: response.donorId,
    donorName: response.donorName,
    window: request.appointmentWindow,
    status: "proposed",
    createdAt: now(),
    updatedAt: now(),
  };
  response.status = "appointment proposed";
  request.appointments.push(appointment);
  recordRequest(
    request,
    app.hospital.coordinatorName,
    "coordinator",
    `Proposed an appointment to ${response.donorName}`,
  );
  return appointment;
}
export function updateAppointment(
  appointmentId: string,
  donorId: string | null,
  next: "confirmed" | "declined" | "cancelled" | "completed",
  reason?: string,
) {
  for (const request of app.requests.values()) {
    const appointment = request.appointments.find(
      (item) => item.id === appointmentId,
    );
    if (!appointment || (donorId && appointment.donorId !== donorId)) continue;
    const allowed =
      next === "confirmed"
        ? appointment.status === "proposed"
        : next === "declined"
          ? appointment.status === "proposed"
          : next === "completed"
            ? appointment.status === "confirmed"
            : appointment.status === "proposed" ||
              appointment.status === "confirmed";
    if (!allowed) return null;
    appointment.status = next;
    appointment.reason = reason?.slice(0, 180);
    appointment.updatedAt = now();
    const response = request.responses.find(
      (item) => item.id === appointment.responseId,
    );
    if (response && (next === "cancelled" || next === "declined"))
      response.status = "withdrawn";
    recordRequest(
      request,
      donorId ? appointment.donorName : app.hospital.coordinatorName,
      donorId ? "donor" : "coordinator",
      next === "completed"
        ? "Marked the appointment completed for attendance tracking"
        : `${next[0].toUpperCase()}${next.slice(1)} appointment`,
    );
    return appointment;
  }
  return null;
}
export function addEnquiry(
  donorId: string,
  question: string,
  language: "en" | "hi" = "en",
) {
  ensureDemoData();
  const clean = question.trim().slice(0, 600);
  if (!clean) return null;
  const enquiry: Enquiry = {
    id: id(),
    donorId,
    type: "organ",
    subject: "Information session request",
    question: clean,
    language,
    status: "open",
    requestFollowUp: true,
    createdAt: now(),
    updatedAt: now(),
    activity: [
      activity("Demo donor", "donor", "Requested coordinator follow-up"),
    ],
  };
  app.enquiries.set(enquiry.id, enquiry);
  return enquiry;
}
export function updateEnquiry(
  enquiryId: string,
  next: "in progress" | "resolved",
  answer?: string,
) {
  const enquiry = app.enquiries.get(enquiryId);
  if (
    !enquiry ||
    enquiry.status === "resolved" ||
    (next === "resolved" && !answer?.trim())
  )
    return null;
  enquiry.status = next;
  enquiry.answer = answer?.slice(0, 500);
  enquiry.updatedAt = now();
  enquiry.activity.push(
    activity(
      app.hospital.coordinatorName,
      "coordinator",
      next === "resolved" ? "Resolved the enquiry" : "Started follow-up",
    ),
  );
  return enquiry;
}
export function donorEnquiries(donorId: string) {
  ensureDemoData();
  return [...app.enquiries.values()]
    .filter((item) => item.donorId === donorId)
    .map((item) => ({
      id: item.id,
      type: item.type,
      subject: item.subject,
      question: item.question,
      language: item.language,
      status: item.status,
      requestFollowUp: item.requestFollowUp,
      answer: item.answer,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
}
