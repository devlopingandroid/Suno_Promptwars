import { NextRequest, NextResponse } from "next/server";
import { createRateLimiter } from "./lib/rate-limit";
const limiter = createRateLimiter();

export function proxy(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const retryAfter = limiter.consume(ip);
  if (retryAfter) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "Cache-Control": "private, no-store",
        },
      },
    );
  }
}

export const config = { matcher: "/api/:path*" };
