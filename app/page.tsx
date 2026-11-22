"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, HeartHandshake, RefreshCw } from "lucide-react";
import { tx, type Lang } from "@/lib/translations";
import type {
  Role,
  Section,
  DonorData,
  CoordinatorData,
  Session,
  MutationResult,
} from "@/lib/portal-types";
import {
  AppShell,
  Notice,
  MobileNav,
  LanguageContext,
} from "@/components/portal-ui";
import { NOTTO } from "@/lib/links";
import { requestJson } from "@/lib/client-api";
import dynamic from "next/dynamic";
import Landing from "@/components/landing";
import { useDocumentLanguage } from "@/lib/use-document-language";
const DonorOverview = dynamic(
  () => import("@/components/screens/donor-overview"),
  { loading: () => <p role="status">Loading workspace…</p> },
);
const DonorBlood = dynamic(() => import("@/components/screens/donor-blood"), {
  loading: () => <p role="status">Loading workspace…</p>,
});
const DonorAppointments = dynamic(
  () => import("@/components/screens/donor-appointments"),
  { loading: () => <p role="status">Loading workspace…</p> },
);
const DonorOrgan = dynamic(() => import("@/components/screens/donor-organ"), {
  loading: () => <p role="status">Loading workspace…</p>,
});
const WishEditor = dynamic(() => import("@/components/screens/wish-editor"), {
  loading: () => <p role="status">Loading workspace…</p>,
});
const DonorFamily = dynamic(() => import("@/components/screens/donor-family"), {
  loading: () => <p role="status">Loading workspace…</p>,
});
const DonorEnquiries = dynamic(
  () => import("@/components/screens/donor-enquiries"),
  { loading: () => <p role="status">Loading workspace…</p> },
);
const CoordinatorOverview = dynamic(
  () => import("@/components/screens/coordinator-overview"),
  { loading: () => <p role="status">Loading workspace…</p> },
);
const CoordinatorBlood = dynamic(
  () => import("@/components/screens/coordinator-blood"),
  { loading: () => <p role="status">Loading workspace…</p> },
);
const CoordinatorAppointments = dynamic(
  () => import("@/components/screens/coordinator-appointments"),
  { loading: () => <p role="status">Loading workspace…</p> },
);
const CoordinatorEnquiries = dynamic(
  () => import("@/components/screens/coordinator-enquiries"),
  { loading: () => <p role="status">Loading workspace…</p> },
);
const CoordinatorHospital = dynamic(
  () => import("@/components/screens/coordinator-hospital"),
  { loading: () => <p role="status">Loading workspace…</p> },
);
export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  useDocumentLanguage(lang);
  const [role, setRole] = useState<Role | null>(null);
  const [section, setSection] = useState<Section>("overview");
  const [session, setSession] = useState<Session>({ role: null });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const pending = useRef(false);
  const generation = useRef(0);
  const t = tx[lang];
  useEffect(() => {
    const controller = new AbortController();
    const version = generation.current;
    requestJson<Session>("/api/bootstrap", { signal: controller.signal })
      .then((data: Session) => {
        if (controller.signal.aborted || generation.current !== version) return;
        setSession(data);
        setRole(data.role);
      })
      .catch(() => {
        if (!controller.signal.aborted && generation.current === version)
          setError("Unable to load the demo. Please try again.");
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const refresh = () => {
      if (pending.current) return;
      const version = ++generation.current;
      requestJson<Session>("/api/bootstrap", { signal: controller.signal })
        .then((value) => {
          if (controller.signal.aborted || version !== generation.current)
            return;
          setSession(value);
          setRole(value.role);
        })
        .catch(() => {});
    };
    window.addEventListener("focus", refresh);
    return () => {
      controller.abort();
      window.removeEventListener("focus", refresh);
    };
  }, []);
  async function start(nextRole: Role, reset = false) {
    if (pending.current) return;
    pending.current = true;
    generation.current++;
    setBusy(true);
    setError("");
    try {
      const data = await requestJson<Session>("/api/bootstrap", {
        method: "POST",
        body: JSON.stringify({
          role: nextRole,
          seeded: nextRole === "donor",
          reset,
        }),
      });
      setSession(data);
      setRole(nextRole);
      setSection("overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function mutate(action: Record<string, unknown>) {
    if (pending.current) return false;
    pending.current = true;
    generation.current++;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const circleAction = ["wish", "invite", "delete", "summary"].includes(
        String(action.action),
      );
      const data = await requestJson<MutationResult>(
        circleAction ? "/api/circle" : "/api/portal",
        {
          method: "POST",
          body: JSON.stringify(action),
        },
      );
      const { circle } = data;
      if (circle)
        setSession((current) => ({
          ...current,
          donor: current.donor ? { ...current.donor, circle } : null,
        }));
      if (data.donor)
        setSession((current) => ({
          ...current,
          role: "donor",
          donor: data.donor,
        }));
      if (data.coordinatorData)
        setSession((current) => ({
          ...current,
          role: "coordinator",
          coordinatorData: data.coordinatorData,
        }));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
      return false;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  const switchRole = (nextRole: Role) => {
    start(nextRole);
  };
  if (
    !role ||
    (role === "donor" && !session.donor) ||
    (role === "coordinator" && !session.coordinatorData)
  )
    return (
      <div lang={lang}>
        <div aria-live="polite">
          {busy && <p role="status">Opening demo…</p>}
          {error && <Notice tone="error">{error}</Notice>}
        </div>
        <fieldset className="workspace-controls" disabled={busy}>
          <Landing lang={lang} setLang={setLang} start={start} />
        </fieldset>
      </div>
    );
  const data = role === "donor" ? session.donor! : session.coordinatorData!;
  return (
    <LanguageContext.Provider value={lang}>
      <div className="site-shell" lang={lang} aria-busy={busy}>
        {(busy || !session) && <div className="loading-bar" />}
        <p className="sr-only" role="status">
          {busy
            ? lang === "hi"
              ? "बदलाव सहेजे जा रहे हैं…"
              : "Saving changes…"
            : ""}
        </p>
        <fieldset className="workspace-controls" disabled={busy}>
          <AppShell
            lang={lang}
            setLang={setLang}
            role={role}
            onRoleChange={switchRole}
            section={section}
            setSection={setSection}
          >
            <MobileNav
              role={role}
              section={section}
              setSection={setSection}
              lang={lang}
            />
            <div className="workspace-tools">
              <button
                className="link-button"
                onClick={async () => {
                  try {
                    if (pending.current) return;
                    const version = ++generation.current;
                    const value = await requestJson<Session>("/api/bootstrap");
                    if (version !== generation.current) return;
                    setSession(value);
                    setRole(value.role);
                  } catch {
                    setError("Refresh failed. Please try again.");
                  }
                }}
              >
                <RefreshCw size={14} /> {t.refreshRecords}
              </button>
              <button
                className="link-button"
                onClick={() => {
                  if (window.confirm("Reset only this demo session?"))
                    start(role, true);
                }}
              >
                {t.resetMyDemo}
              </button>
              <button
                className="link-button"
                onClick={() =>
                  window.alert(
                    "Suno stores synthetic demo records in server memory for up to 24 hours. They reset on server restart. Invitation links expire in 24 hours. No invitation messages are sent. The Gemini assistant sends your question to Google when a key is configured. Do not enter personal or medical information into this demo.",
                  )
                }
              >
                Privacy & demo details
              </button>
            </div>
            {notice && <Notice onClose={() => setNotice("")}>{notice}</Notice>}
            {error && (
              <Notice tone="error" onClose={() => setError("")}>
                {error}
              </Notice>
            )}
            {role === "donor" ? (
              <>
                {section === "overview" && (
                  <DonorOverview
                    data={data as DonorData}
                    lang={lang}
                    setSection={setSection}
                  />
                )}
                {section === "blood" && (
                  <DonorBlood
                    data={data as DonorData}
                    lang={lang}
                    mutate={mutate}
                  />
                )}
                {section === "appointments" && (
                  <DonorAppointments
                    data={data as DonorData}
                    lang={lang}
                    mutate={mutate}
                  />
                )}
                {section === "organ" && (
                  <DonorOrgan
                    data={data as DonorData}
                    lang={lang}
                    setSection={setSection}
                  />
                )}
                {section === "wish" && (
                  <WishEditor
                    data={data as DonorData}
                    lang={lang}
                    mutate={mutate}
                    onNotice={setNotice}
                  />
                )}
                {section === "family" && (
                  <DonorFamily
                    data={data as DonorData}
                    lang={lang}
                    mutate={mutate}
                    onNotice={setNotice}
                  />
                )}
                {section === "enquiries" && (
                  <DonorEnquiries
                    data={data as DonorData}
                    lang={lang}
                    mutate={mutate}
                  />
                )}
              </>
            ) : (
              <>
                {section === "overview" && (
                  <CoordinatorOverview
                    data={data as CoordinatorData}
                    lang={lang}
                    setSection={setSection}
                  />
                )}
                {section === "blood" && (
                  <CoordinatorBlood
                    data={data as CoordinatorData}
                    lang={lang}
                    mutate={mutate}
                  />
                )}
                {section === "appointments" && (
                  <CoordinatorAppointments
                    data={data as CoordinatorData}
                    lang={lang}
                    mutate={mutate}
                  />
                )}
                {section === "enquiries" && (
                  <CoordinatorEnquiries
                    data={data as CoordinatorData}
                    lang={lang}
                    mutate={mutate}
                  />
                )}
                {section === "hospital" && (
                  <CoordinatorHospital
                    data={data as CoordinatorData}
                    lang={lang}
                  />
                )}
              </>
            )}
          </AppShell>
        </fieldset>
        <footer className="app-footer">
          <span>
            <HeartHandshake size={15} /> Suno
          </span>
          <span>{t.disclaimer}</span>
          <a href={NOTTO} target="_blank" rel="noopener noreferrer">
            NOTTO <ExternalLink size={12} />
          </a>
        </footer>
      </div>
    </LanguageContext.Provider>
  );
}
