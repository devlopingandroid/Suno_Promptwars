import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  createSession,
  getSession,
  readBody,
  setSessionCookie,
  validOrigin,
  privateJson,
} from "../lib/session";
import {
  addEnquiry,
  createCircle,
  deleteCircle,
  deleteOwnResponse,
  donorBloodView,
  findInvite,
  getCircle,
  releaseWorkspace,
  updateEnquiry,
  withWorkspace,
} from "../lib/store";
import { MAX_BODY_SIZE, MAX_SESSIONS, SESSION_TTL_MS } from "../lib/constants";
import { createRateLimiter } from "../lib/rate-limit";
import { resolveConcern } from "../lib/ai";
import { sources } from "../lib/sources";
import { POST as assist } from "../app/api/assist/route";
import { POST as bootstrap } from "../app/api/bootstrap/route";
import { POST as circleWrite } from "../app/api/circle/route";
import { POST as familyWrite } from "../app/api/invite/[token]/route";

const url = "http://localhost:3000/api/assist";
function json(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}
const ownedSessions: string[] = [];
function actor() {
  const session = createSession("donor");
  ownedSessions.push(session.id);
  const circle = withWorkspace(session.id, () => createCircle(true));
  session.donorId = circle.id;
  return { session, circle, cookie: `suno_session=${session.id}` };
}
afterEach(() => {
  for (const id of ownedSessions.splice(0)) {
    releaseWorkspace(id);
    globalThis.sunoSessions?.delete(id);
  }
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("request boundaries", () => {
  it("accepts a full 4000-character Hindi summary", async () => {
    const { cookie } = actor();
    const summary = "अ".repeat(4000);
    const response = await circleWrite(json({action:"summary", summary}, {cookie}));
    expect(response.status).toBe(200);
    expect((await response.json()).circle.summary).toBe(summary);
  });
  it("accepts Cloud Run HTTPS termination without trusting forwarded host", () => {
    const headers = {
      host: "suno.example.run.app",
      "x-forwarded-proto": "https",
      origin: "https://suno.example.run.app",
    };
    expect(
      validOrigin(
        new NextRequest("http://localhost:8080/api/bootstrap", { headers }),
      ),
    ).toBe(true);
    expect(
      validOrigin(
        new NextRequest("http://localhost:8080/api/bootstrap", {
          headers: {
            ...headers,
            origin: "https://attacker.example",
            "x-forwarded-host": "attacker.example",
          },
        }),
      ),
    ).toBe(false);
  });
  it.each<Record<string, string>>([
    { origin: "null" },
    { origin: "https://attacker.example" },
    { "sec-fetch-site": "cross-site" },
  ])("rejects cross-site writes: %j", async (headers) => {
    await expect(readBody(json({ role: "donor" }, headers))).rejects.toThrow(
      "Cross-origin",
    );
  });
  it.each([null, [], "text", 12])(
    "requires a JSON object: %j",
    async (body) => {
      await expect(readBody(json(body))).rejects.toThrow("Invalid request");
    },
  );
  it("rejects non-JSON writes before parsing", async () => {
    await expect(
      readBody(json({ role: "donor" }, { "content-type": "text/plain" })),
    ).rejects.toThrow("Expected JSON");
  });
  it("measures bytes, including multi-byte Hindi text", async () => {
    await expect(readBody(json({ text: "अ".repeat(Math.ceil(MAX_BODY_SIZE / 3)) }))).rejects.toThrow(
      "too large",
    );
    const overhead = JSON.stringify({ text: "" }).length;
    expect(
      await readBody(json({ text: "x".repeat(MAX_BODY_SIZE - overhead) })),
    ).toHaveProperty("text");
  });
  it("stops a streamed body even when content-length understates it", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"text":"'));
        controller.enqueue(new Uint8Array(MAX_BODY_SIZE));
        controller.close();
      },
    });
    const request = new NextRequest(url, {
      method: "POST",
      headers: { "content-type": "application/json", "content-length": "1" },
      body: stream,
      duplex: "half",
    } as ConstructorParameters<typeof NextRequest>[1]);
    await expect(readBody(request)).rejects.toThrow("too large");
  });
  it("returns 400 for malformed assistance rather than generating an empty suggestion", async () => {
    const { cookie } = actor();
    const malformed = new NextRequest(url, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: "broken",
    });
    expect((await assist(malformed)).status).toBe(400);
    expect((await assist(json({ wish: "   " }, { cookie }))).status).toBe(400);
    const response = await assist(
      json({ wish: "My synthetic wish" }, { cookie }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect((await response.json()).suggestion).toContain("My synthetic wish");
  });
});

describe("bounded lifecycle and privacy", () => {
  it("repeated demo resets remove old circles rather than retaining empty records", async () => {
    const { session, cookie } = actor();
    for (let i = 0; i < 3; i++) {
      const previous = session.donorId!;
      const response = await bootstrap(
        json({ role: "donor", reset: true, seeded: true }, { cookie }),
      );
      expect(response.status).toBe(200);
      expect(session.donorId).not.toBe(previous);
      expect(getCircle(previous)).toBeUndefined();
      expect(globalThis.sunoWorkspaceCircles!.get(session.id)!.size).toBe(1);
    }
  });
  it("expires sessions at the boundary and releases their circles and invitation tokens", () => {
    vi.useFakeTimers();
    const { session, circle, cookie } = actor();
    const token = circle.invites[0].token;
    withWorkspace(session.id, () => donorBloodView(circle.id));
    vi.setSystemTime(session.expiresAt);
    expect(
      getSession(new NextRequest(url, { headers: { cookie } })),
    ).toBeUndefined();
    expect(findInvite(token)).toBeNull();
    expect(getCircle(circle.id)).toBeUndefined();
    expect(globalThis.sunoWorkspaces?.has(session.id)).toBe(false);
  });
  it("keeps the cookie lifetime aligned after a role switch", () => {
    vi.useFakeTimers();
    const { session } = actor();
    vi.setSystemTime(Date.now() + SESSION_TTL_MS / 2);
    const response = privateJson({});
    setSessionCookie(response, session);
    expect(response.cookies.get("suno_session")?.maxAge).toBe(
      SESSION_TTL_MS / 2000,
    );
  });
  it("never exceeds session capacity and revokes evicted workspace tokens", () => {
    const { session, circle } = actor();
    const token = circle.invites[0].token;
    for (let i = 0; i < MAX_SESSIONS; i++) {
      const next = createSession("donor");
      ownedSessions.push(next.id);
      expect(globalThis.sunoSessions!.size).toBeLessThanOrEqual(MAX_SESSIONS);
    }
    expect(globalThis.sunoSessions!.has(session.id)).toBe(false);
    expect(findInvite(token)).toBeNull();
    expect(getCircle(circle.id)).toBeUndefined();
  });
  it("revokes all indexed links on deletion while leaving another workspace intact", () => {
    const a = actor(),
      b = actor();
    const token = a.circle.invites[0].token;
    withWorkspace(a.session.id, () => deleteCircle(a.circle.id));
    expect(findInvite(token)).toBeNull();
    expect(findInvite(b.circle.invites[0].token)?.circle.id).toBe(b.circle.id);
  });
  it("deduplicates open follow-ups and permits a new enquiry after resolution", () => {
    const { session, circle } = actor();
    withWorkspace(session.id, () => {
      const first = addEnquiry(circle.id, "A synthetic question")!;
      expect(addEnquiry(circle.id, " A synthetic question ")?.id).toBe(
        first.id,
      );
      updateEnquiry(first.id, "resolved", "Contact the information desk.");
      expect(addEnquiry(circle.id, "A synthetic question")?.id).not.toBe(
        first.id,
      );
    });
  });
});

describe("rate limiter", () => {
  it("enforces the exact request limit and resets at the exact window boundary", () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 1000 });
    expect(limiter.consume("a", 0)).toBe(0);
    expect(limiter.consume("a", 100)).toBe(0);
    expect(limiter.consume("a", 200)).toBe(1);
    expect(limiter.consume("b", 200)).toBe(0);
    expect(limiter.consume("a", 1000)).toBe(0);
  });
  it("refuses new buckets at capacity without resetting an active client's limit", () => {
    const limiter = createRateLimiter({
      maxRequests: 1,
      maxBuckets: 2,
      windowMs: 1000,
    });
    expect(limiter.consume("a", 0)).toBe(0);
    expect(limiter.consume("b", 0)).toBe(0);
    expect(limiter.consume("c", 0)).toBe(1);
    expect(limiter.consume("a", 0)).toBe(1);
    expect(limiter.consume("c", 1000)).toBe(0);
  });
});

describe("remote AI boundaries", () => {
  it("keeps unsupported questions local, even when AI is configured", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    const result = await resolveConcern("Can I donate if I have cancer?");
    expect(result.result.status).toBe("unsupported");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("falls back safely on a remote failure without logging private question content", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("sensitive remote payload")),
    );
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await resolveConcern("Will the body look different?");
    expect(result.mode).toBe("demo");
    expect(result.result.confidence).toBe("insufficient");
    expect(JSON.stringify(warning.mock.calls)).not.toContain("sensitive");
  });
  it.each(["delete-response", "delete-circle"])(
    "never restores a response after %s while AI was loading",
    async (action) => {
      vi.stubEnv("GEMINI_API_KEY", "test-key");
      const { circle, session } = actor();
      const token = circle.invites[0].token;
      let finish!: (value: Response) => void;
      let started!: () => void;
      const entered = new Promise<void>((resolve) => {
        started = resolve;
      });
      vi.stubGlobal(
        "fetch",
        vi.fn(() => {
          started();
          return new Promise<Response>((resolve) => {
            finish = resolve;
          });
        }),
      );
      const pending = familyWrite(
        json({
          action: "respond",
          kind: "question",
          question: "Will the body look different?",
        }),
        { params: Promise.resolve({ token }) },
      );
      await entered;
      if (action === "delete-response") deleteOwnResponse(token);
      else withWorkspace(session.id, () => deleteCircle(circle.id));
      finish(
        Response.json({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      category: "body",
                      sourceId: sources[0].id,
                      supportingExcerpt: sources[0].excerpt,
                    }),
                  },
                ],
              },
            },
          ],
        }),
      );
      const response = await pending;
      expect(response.status).toBe(action === "delete-response" ? 409 : 404);
      expect(findInvite(token)?.invite.question).toBeUndefined();
    },
  );
});
