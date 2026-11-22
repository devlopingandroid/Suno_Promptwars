"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Check,
  ExternalLink,
  FileText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { tx, type Lang } from "@/lib/translations";
import type { DonorData } from "@/lib/portal-types";
import { PageHeader, Panel } from "@/components/portal-ui";
import { PLEDGE } from "@/lib/links";
import { requestJson } from "@/lib/client-api";

export default function WishEditor({
  data,
  lang,
  mutate,
  onNotice,
}: {
  data: DonorData;
  lang: Lang;
  mutate: (action: Record<string, unknown>) => Promise<boolean>;
  onNotice: (message: string) => void;
}) {
  const t = tx[lang];
  const [wish, setWish] = useState(data.circle.wish);
  const [busy, setBusy] = useState(false);
  useEffect(() => setWish(data.circle.wish), [data.circle.wish]);
  async function save() {
    setBusy(true);
    try {
      if (await mutate({ action: "wish", wish })) onNotice(t.saved);
    } finally {
      setBusy(false);
    }
  }
  async function assist() {
    setBusy(true);
    try {
      const body = await requestJson<{ suggestion: string }>("/api/assist", {
        method: "POST",
        body: JSON.stringify({ wish }),
      });
      setWish(body.suggestion);
      onNotice("Review the suggestion before saving.");
    } catch {
      onNotice(
        "Writing assistance is unavailable. Your original text is unchanged.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="ORGAN & TISSUE"
        title={t.wish}
        copy={t.wishCopy}
        lang={lang}
      />
      <Panel
        title="Your words"
        copy="No medical record, pledge ID, Aadhaar number, or emergency contact is requested."
        icon={<FileText size={18} />}
      >
        <label className="field-label" htmlFor="wish">
          Personal wish
        </label>
        <textarea
          id="wish"
          value={wish}
          onChange={(event) => setWish(event.target.value)}
          maxLength={800}
          rows={7}
          placeholder="I would like my family to understand my wish…"
        />
        <div className="field-meta">
          <span>{wish.length}/800</span>
          <span>Editable before saving</span>
        </div>
        <div className="button-row">
          <button
            className="button outline"
            onClick={assist}
            disabled={busy || !wish.trim()}
          >
            <Sparkles size={15} /> {t.assist}
          </button>
          <button
            className="button primary"
            onClick={save}
            disabled={busy || !wish.trim()}
          >
            <Check size={15} /> {t.saveWish}
          </button>
        </div>
      </Panel>
      <Panel
        title={t.official}
        copy={t.officialCopy}
        icon={<BookOpen size={18} />}
      >
        <div className="official-row">
          <span className="source-mark">
            <ShieldCheck size={18} />
          </span>
          <div>
            <strong>NOTTO information and official pledge route</strong>
            <p>
              Review the official service directly. Suno only records a personal
              conversation wish.
            </p>
          </div>
          <a
            className="link-button"
            href={PLEDGE}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open route <ExternalLink size={14} />
          </a>
        </div>
      </Panel>
    </>
  );
}
