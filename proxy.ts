import { NextRequest, NextResponse } from "next/server";

declare global {
  var sunoRateLimiter:
    | Map<string, { count: number; resetAt: number }>
    | undefined;
}
const buckets = (globalThis.sunoRateLimiter ??= new Map<
  string,
  { count: number; resetAt: number }
>());
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;

export function proxy(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  let bucket = buckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(ip, bucket);
    // Prune stale entries periodically
    if (buckets.size > 50_000) {
      for (const [key, value] of buckets) {
        if (now > value.resetAt) buckets.delete(key);
      }
    }
  }
  bucket.count++;
  if (bucket.count > MAX_REQUESTS) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }
}

export const config = { matcher: "/api/:path*" };
