import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";

// Run after `npm run build`. This measures script tags on the initial landing
// page, not lazy portal chunks or real-user network/Core Web Vitals timings.
const root = resolve(process.argv[2] || ".");
const html = readFileSync(resolve(root, ".next/server/app/index.html"), "utf8");
const scripts = [
  ...new Set(
    [...html.matchAll(/<script[^>]+src="([^"?]+\.js)(?:\?[^"]*)?"/g)]
      .map((match) => match[1])
      .filter((src) => src.startsWith("/_next/")),
  ),
];
const files = scripts.map((src) => {
  const bytes = readFileSync(
    resolve(root, ".next", src.slice("/_next/".length)),
  );
  return {
    src,
    bytes: bytes.byteLength,
    gzipBytes: gzipSync(bytes).byteLength,
  };
});
console.log(
  JSON.stringify(
    {
      route: "/",
      scriptCount: files.length,
      bytes: files.reduce((sum, file) => sum + file.bytes, 0),
      gzipBytes: files.reduce((sum, file) => sum + file.gzipBytes, 0),
      files,
    },
    null,
    2,
  ),
);
