"use client";

import {
  Activity,
  ArrowRight,
  BookOpen,
  ExternalLink,
  HeartHandshake,
  Hospital,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";
import { tx, type Lang } from "@/lib/translations";
import type { Role } from "@/lib/portal-types";
import { Header, DropletIcon } from "@/components/portal-ui";
import { NOTTO, PLEDGE } from "@/lib/links";

export default function Landing({
  lang,
  setLang,
  start,
}: {
  lang: Lang;
  setLang: (lang: Lang) => void;
  start: (role: Role) => void;
}) {
  const t = tx[lang];
  return (
    <div className="landing">
      <Header lang={lang} setLang={setLang} role={null} onRoleChange={start} />
      <main id="main-content" tabIndex={-1}>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-line" />
              HOSPITAL DONATION COORDINATION
            </p>
            <h1>{t.welcome}</h1>
            <p className="landing-lead">{t.welcomeCopy}</p>
            <div className="landing-actions">
              <button className="button primary" onClick={() => start("donor")}>
                <UserRound size={17} /> {t.tryDonor}
                <ArrowRight size={16} />
              </button>
              <button
                className="button outline"
                onClick={() => start("coordinator")}
              >
                <Hospital size={17} /> {t.tryCoordinator}
              </button>
            </div>
            <div className="landing-trust">
              <ShieldCheck size={18} />
              <span>{t.independent}</span>
            </div>
          </div>
          <div
            className="landing-visual"
            aria-label="Donation coordination workflow illustration"
          >
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="visual-center">
              <HeartHandshake size={42} />
              <span>One accountable workspace</span>
            </div>
            <div className="visual-node node-one">
              <DropletIcon />
              <span>Blood requests</span>
            </div>
            <div className="visual-node node-two">
              <Users size={19} />
              <span>Family conversations</span>
            </div>
            <div className="visual-node node-three">
              <Stethoscope size={19} />
              <span>Hospital follow-up</span>
            </div>
          </div>
        </section>
        <section className="landing-strip">
          <div>
            <strong>Separate flows. Shared visibility.</strong>
            <span>
              Blood volunteering stays operational; organ and tissue
              conversations stay personal and source-grounded.
            </span>
          </div>
          <a href={NOTTO} target="_blank" rel="noopener noreferrer">
            Read official NOTTO information <ExternalLink size={14} />
          </a>
        </section>
        <section className="landing-features">
          <div className="section-heading">
            <p className="eyebrow">BUILT FOR CLARITY</p>
            <h2>From willingness to the next responsible step.</h2>
          </div>
          <div className="feature-grid">
            <Feature
              icon={<DropletIcon />}
              title="Coordinate blood volunteers"
              copy="Publish a request, review availability, and propose appointments without making medical claims."
            />
            <Feature
              icon={<BookOpen />}
              title="Support informed organ conversations"
              copy="Record a wish, invite family, and show approved source excerpts beside every supported answer."
            />
            <Feature
              icon={<Activity />}
              title="Give coordinators a traceable view"
              copy="Keep requests, enquiries, follow-ups, and activity history in one professional workspace."
            />
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <span>
          <HeartHandshake size={16} /> Suno
        </span>
        <span>
          Independent demo · Synthetic records · No official pledge is created
          here
        </span>
        <a href={PLEDGE} target="_blank" rel="noopener noreferrer">
          Official pledge route <ExternalLink size={13} />
        </a>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  copy,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <article className="feature-card">
      <span className="feature-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{copy}</p>
    </article>
  );
}
