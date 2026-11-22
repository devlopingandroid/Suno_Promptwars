"use client";

import { useEffect, useState } from "react";
import {
  ClipboardList,
  Copy,
  ExternalLink,
  FileText,
  LockKeyhole,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { tx, type Lang } from "@/lib/translations";
import type { DonorData } from "@/lib/portal-types";
import { Status, PageHeader, Panel } from "@/components/portal-ui";

export default function DonorFamily({
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
  const [name, setName] = useState("");
  const [copied, setCopied] = useState("");
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState("");
  useEffect(
    () =>
      setSummary(
        data.circle.summary ??
          data.circle.invites
            .map(
              (invite) =>
                `${invite.name}: ${invite.status}${invite.question ? `\n${invite.question}` : ""}`,
            )
            .join("\n\n"),
      ),
    [data.circle.invites, data.circle.summary],
  );
  async function add() {
    setBusy(true);
    try {
      if (await mutate({ action: "invite", name })) setName("");
    } finally {
      setBusy(false);
    }
  }
  async function copy(token: string) {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/invite/${token}`,
      );
      setCopied(token);
      onNotice("Invitation link copied.");
    } catch {
      onNotice("Copy unavailable. Open the family view and copy its address.");
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="ORGAN & TISSUE"
        title={t.family}
        copy={t.inviteCopy}
        lang={lang}
      />
      <Panel title={t.invite} copy={t.inviteCopy} icon={<Users size={18} />}>
        <div className="invite-form">
          <div>
            <label className="field-label" htmlFor="member-name">
              {t.memberName}
            </label>
            <input
              id="member-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Mother"
              maxLength={40}
            />
          </div>
          <button
            className="button primary"
            disabled={busy || !name.trim() || data.circle.invites.length >= 3}
            onClick={add}
          >
            <Plus size={16} /> {t.addMember}
          </button>
        </div>
        <div className="invite-list">
          {data.circle.invites.length === 0 ? (
            <div className="empty-inline">
              <Users size={20} /> No family invitations yet.
            </div>
          ) : (
            data.circle.invites.map((invite) => (
              <div className="invite-row" key={invite.token}>
                <span className="profile-avatar">
                  {invite.name[0]?.toUpperCase()}
                </span>
                <div className="invite-row-main">
                  <strong>{invite.name}</strong>
                  <Status value={invite.status} />
                  <small>
                    <LockKeyhole size={12} /> Expires in 24 hours
                  </small>
                </div>
                <div className="row-actions">
                  <button
                    className="link-button"
                    onClick={() => copy(invite.token)}
                  >
                    <Copy size={14} />{" "}
                    {copied === invite.token ? "Copied" : t.copyLink}
                  </button>
                  <a
                    className="link-button"
                    href={`/invite/${invite.token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink size={14} /> {t.openView}
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
        <button
          className="danger-button"
          onClick={() => {
            if (
              window.confirm(
                "Delete the wish, invitations, and family responses?",
              )
            )
              mutate({ action: "delete" });
          }}
        >
          <Trash2 size={15} /> {t.deleteCircleBtn}
        </button>
      </Panel>
      <Panel
        className="summary-panel"
        title={t.summary}
        copy={t.summaryCopy}
        icon={<ClipboardList size={18} />}
      >
        <div className="summary-people">
          {data.circle.invites.length === 0 ? (
            <div className="empty-inline">
              Invite family to build a summary.
            </div>
          ) : (
            data.circle.invites.map((invite) => (
              <div className="summary-row" key={invite.token}>
                <div>
                  <strong>{invite.name}</strong>
                  <Status value={invite.status} />
                </div>
                {invite.question ? (
                  <p>{invite.question}</p>
                ) : (
                  <small>No question recorded.</small>
                )}
              </div>
            ))
          )}
        </div>
        <div className="print-summary">
          <h2>Suno conversation summary</h2>
          <p>{data.circle.wish}</p>
          <pre>{summary}</pre>
          <p>{t.disclaimer}</p>
          <p>Official information: https://notto.mohfw.gov.in/</p>
        </div>
        <label className="field-label" htmlFor="summary">
          {t.editableSummary}
        </label>
        <textarea
          id="summary"
          maxLength={4000}
          rows={7}
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
        />
        <div className="summary-footer">
          <button
            className="button outline"
            onClick={() => mutate({ action: "summary", summary })}
          >
            {t.saveSummary}
          </button>
          <p>{t.disclaimer}</p>
          <button className="button outline" onClick={() => window.print()}>
            <FileText size={15} /> {t.print}
          </button>
        </div>
      </Panel>
    </>
  );
}
