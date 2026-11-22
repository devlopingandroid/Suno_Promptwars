/** Shared JSON transport. Callers provide the response contract explicitly. */
export async function requestJson<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const headers = new Headers(options?.headers);
  if (options?.body) headers.set("Content-Type", "application/json");
  const response = await fetch(url, { cache: "no-store", ...options, headers });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : "Request failed. Please try again.";
    throw new Error(message);
  }
  if (body === null)
    throw new Error("The server returned an unreadable response.");
  return body as T;
}
