"use client";

export default function ErrorPage({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <main id="main-content" className="family-container" tabIndex={-1}>
      <h1>We couldn’t open this workspace.</h1>
      <p role="alert">
        Please try again. If the demo restarted, start a new session from the
        home page.
      </p>
      <button className="button primary" onClick={retry}>
        Try again
      </button>
      <a className="button outline" href="/">
        Back to Suno
      </a>
    </main>
  );
}
