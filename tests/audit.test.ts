import { describe, expect, it, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import {
  POST as bootstrap,
  GET as bootstrapGet,
} from "../app/api/bootstrap/route";
import { POST as portal, GET as portalGet } from "../app/api/portal/route";
import { POST as circleWrite } from "../app/api/circle/route";
import { POST as familyWrite } from "../app/api/invite/[token]/route";
import { createSession } from "../lib/session";
import { createCircle, withWorkspace } from "../lib/store";
import { validateCitation, resolveConcern } from "../lib/ai";
import { sources } from "../lib/sources";

const req = (
  path: string,
  sessionId?: string,
  body?: unknown,
  origin?: string,
) =>
  new NextRequest(`http://localhost:3000/api/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      ...(sessionId ? { cookie: `suno_session=${sessionId}` } : {}),
      ...(origin ? { origin } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
function actor(role: "donor" | "coordinator" = "donor") {
  const session = createSession(role);
  withWorkspace(session.id, () => {
    session.donorId = createCircle(true).id;
  });
  return session;
}
const fields = {
  title: "Audit request",
  location: "Demo wing",
  bloodGroup: "O-",
  appointmentWindow: "28 Nov, 10:00",
  instructions: "Check in at reception.",
};
afterEach(() => vi.unstubAllGlobals());

describe("complete connected workflow", () => {
  it("saves wishes, summaries, invitations and clears the circle", async () => {
    const s = actor();
    for (const body of [
      { action: "wish", wish: "My edited synthetic wish" },
      { action: "summary", summary: "An edited summary" },
      { action: "invite", name: "Sister" },
    ])
      expect((await circleWrite(req("circle", s.id, body))).status).toBe(200);
    const view = await (await bootstrapGet(req("bootstrap", s.id))).json();
    expect(view.donor.circle.wish).toContain("edited");
    expect(view.donor.circle.summary).toContain("edited");
    expect(view.donor.circle.invites).toHaveLength(3);
    const token = view.donor.circle.invites[0].token;
    expect(
      (
        await familyWrite(
          req(`invite/${token}`, undefined, {
            action: "respond",
            kind: "understand",
          }),
          { params: Promise.resolve({ token }) },
        )
      ).status,
    ).toBe(200);
    await circleWrite(req("circle", s.id, { action: "delete" }));
    expect(
      (
        await familyWrite(
          req(`invite/${token}`, undefined, { action: "delete" }),
          { params: Promise.resolve({ token }) },
        )
      ).status,
    ).toBe(404);
  });
  it("creates, edits, publishes, volunteers, proposes, confirms and completes", async () => {
    const s = actor("coordinator");
    let result = await (
      await portal(req("portal", s.id, { action: "create-request", ...fields }))
    ).json();
    const record = result.coordinatorData.requests.find(
      (r: { title: string }) => r.title === fields.title,
    );
    expect(record.status).toBe("draft");
    expect(
      (
        await portal(
          req("portal", s.id, {
            action: "edit-request",
            requestId: record.id,
            ...fields,
            title: "Edited audit request",
          }),
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await portal(
          req("portal", s.id, { action: "publish", requestId: record.id }),
        )
      ).status,
    ).toBe(200);
    s.role = "donor";
    expect(
      (
        await portal(
          req("portal", s.id, { action: "volunteer", requestId: record.id }),
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await portal(
          req("portal", s.id, { action: "volunteer", requestId: record.id }),
        )
      ).status,
    ).toBe(400);
    s.role = "coordinator";
    result = await (await portalGet(req("portal", s.id))).json();
    const response = result.coordinatorData.requests.find(
      (r: { id: string }) => r.id === record.id,
    ).responses[0];
    result = await (
      await portal(
        req("portal", s.id, {
          action: "propose",
          requestId: record.id,
          responseId: response.id,
        }),
      )
    ).json();
    const appointment = result.coordinatorData.requests.find(
      (r: { id: string }) => r.id === record.id,
    ).appointments[0];
    s.role = "donor";
    expect(
      (
        await portal(
          req("portal", s.id, {
            action: "confirm",
            appointmentId: appointment.id,
          }),
        )
      ).status,
    ).toBe(200);
    s.role = "coordinator";
    expect(
      (
        await portal(
          req("portal", s.id, {
            action: "complete",
            appointmentId: appointment.id,
          }),
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await portal(
          req("portal", s.id, {
            action: "cancel",
            appointmentId: appointment.id,
            reason: "Test",
          }),
        )
      ).status,
    ).toBe(400);
  });
  it.each(["decline", "cancel"])(
    "allows %s and re-volunteering without an orphaned response",
    async (action) => {
      const s = actor();
      await portal(
        req("portal", s.id, { action: "volunteer", requestId: "req-city-001" }),
      );
      s.role = "coordinator";
      const data = await (await portalGet(req("portal", s.id))).json();
      const response = data.coordinatorData.requests[0].responses[0];
      const proposed = await (
        await portal(
          req("portal", s.id, {
            action: "propose",
            requestId: "req-city-001",
            responseId: response.id,
          }),
        )
      ).json();
      const appointment = proposed.coordinatorData.requests[0].appointments[0];
      s.role = "donor";
      expect(
        (
          await portal(
            req("portal", s.id, { action, appointmentId: appointment.id }),
          )
        ).status,
      ).toBe(200);
      expect(
        (
          await portal(
            req("portal", s.id, {
              action: "volunteer",
              requestId: "req-city-001",
            }),
          )
        ).status,
      ).toBe(200);
    },
  );
});
describe("isolation and invalid writes", () => {
  it("isolates hospital workspaces, questions and resets", async () => {
    const a = actor(),
      b = actor();
    await portal(
      req("portal", a.id, {
        action: "request-follow-up",
        question: "Private synthetic question",
      }),
    );
    a.role = "coordinator";
    b.role = "coordinator";
    expect(
      JSON.stringify(await (await portalGet(req("portal", b.id))).json()),
    ).not.toContain("Private synthetic question");
    await bootstrap(
      req("bootstrap", b.id, { role: "coordinator", reset: true }),
    );
    expect(
      JSON.stringify(await (await portalGet(req("portal", a.id))).json()),
    ).toContain("Private synthetic question");
  });
  it.each([
    null,
    [],
    { action: "create-request", ...fields, title: " " },
    { action: "create-request", ...fields, bloodGroup: "invalid" },
  ])("rejects malformed coordinator writes: %j", async (body) => {
    const s = actor("coordinator");
    expect((await portal(req("portal", s.id, body))).status).toBe(400);
  });
  it("rejects forged legacy role cookies and cross-origin writes", async () => {
    expect(
      (
        await portalGet(
          new NextRequest("http://localhost:3000/api/portal", {
            headers: {
              cookie:
                "suno_active_role=coordinator; suno_coordinator=demo-coordinator",
            },
          }),
        )
      ).status,
    ).toBe(401);
    const s = actor();
    expect(
      (
        await portal(
          req(
            "portal",
            s.id,
            { action: "volunteer", requestId: "req-city-001" },
            "https://untrusted.example",
          ),
        )
      ).status,
    ).toBe(400);
  });
  it("does not resolve an enquiry without a donor-visible answer", async () => {
    const s = actor();
    const data = await (
      await portal(
        req("portal", s.id, {
          action: "request-follow-up",
          question: "Please follow up",
        }),
      )
    ).json();
    s.role = "coordinator";
    const enquiryId = data.donor.enquiries[0].id;
    expect(
      (await portal(req("portal", s.id, { action: "resolve", enquiryId })))
        .status,
    ).toBe(400);
    expect(
      (
        await portal(
          req("portal", s.id, {
            action: "resolve",
            enquiryId,
            answer: "Please use the official information service.",
          }),
        )
      ).status,
    ).toBe(200);
  });
});
describe("AI evidence validation", () => {
  it("rejects a real citation attached to an unsupported clinical question", () => {
    expect(() =>
      validateCitation("Will my face look normal if I have cancer?", {
        category: "body",
        sourceId: sources[0].id,
        supportingExcerpt: sources[0].excerpt,
      }),
    ).toThrow();
  });
  it("rejects altered excerpts and accepts the supported Hindi example", () => {
    const question = "क्या अंगदान के बाद शरीर का चेहरा बदल जाएगा?";
    expect(() =>
      validateCitation(question, {
        category: "body",
        sourceId: sources[0].id,
        supportingExcerpt: "Invented excerpt",
      }),
    ).toThrow();
    expect(
      validateCitation(question, {
        category: "body",
        sourceId: sources[0].id,
        supportingExcerpt: sources[0].excerpt,
      }).status,
    ).toBe("supported");
  });
});
