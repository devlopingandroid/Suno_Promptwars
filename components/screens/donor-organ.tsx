"use client";

import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import { tx, type Lang } from "@/lib/translations";
import type { Section, DonorData } from "@/lib/portal-types";
import { PageHeader, Panel } from "@/components/portal-ui";
import { NOTTO, PLEDGE } from "@/lib/links";

export default function DonorOrgan({
  data,
  lang,
  setSection,
}: {
  data: DonorData;
  lang: Lang;
  setSection: (section: Section) => void;
}) {
  const t = tx[lang];
  return (
    <>
      <PageHeader
        eyebrow="ORGAN & TISSUE"
        title={t.organTitle}
        copy={t.organCopy}
        lang={lang}
      />
      <div className="organ-grid">
        <article className="organ-card accent">
          <span className="organ-card-icon">
            <BookOpen size={20} />
          </span>
          <h2>{t.official}</h2>
          <p>{t.officialCopy}</p>
          <div className="card-actions">
            <a
              className="button primary small"
              href={NOTTO}
              target="_blank"
              rel="noopener noreferrer"
            >
              NOTTO information <ExternalLink size={14} />
            </a>
            <a
              className="link-button"
              href={PLEDGE}
              target="_blank"
              rel="noopener noreferrer"
            >
              Official pledge route <ExternalLink size={13} />
            </a>
          </div>
        </article>
        <article className="organ-card">
          <span className="organ-card-icon peach">
            <MessageCircle size={20} />
          </span>
          <h2>{t.bodyCard}</h2>
          <p>{t.bodyCopy}</p>
          <button
            className="button outline small"
            onClick={() => setSection("family")}
          >
            Open Family Circle <ArrowRight size={14} />
          </button>
        </article>
        <article className="organ-card">
          <span className="organ-card-icon blue">
            <Stethoscope size={20} />
          </span>
          <h2>{t.session}</h2>
          <p>{t.sessionCopy}</p>
          <button
            className="button outline small"
            onClick={() => setSection("enquiries")}
          >
            Ask a coordinator <ArrowRight size={14} />
          </button>
        </article>
      </div>
      <div className="boundary-note">
        <ShieldCheck size={16} />
        <span>
          The organ flow does not list recipients, decide suitability, match
          organs, or create a pledge. Family acknowledgement is not consent.
        </span>
      </div>
      <Panel
        title="Your current conversation status"
        icon={<Users size={18} />}
      >
        <div className="mini-status-grid">
          <div>
            <span>Family members invited</span>
            <strong>{data.circle.invites.length}/3</strong>
          </div>
          <div>
            <span>Questions open</span>
            <strong>
              {
                data.circle.invites.filter(
                  (invite) => invite.status === "question open",
                ).length
              }
            </strong>
          </div>
          <div>
            <span>Official pledge</span>
            <strong>External route</strong>
          </div>
        </div>
      </Panel>
    </>
  );
}
