import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "standalone",
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://generativelanguage.googleapis.com; font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com; frame-ancestors 'none'",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/invite/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
};
export default nextConfig;
