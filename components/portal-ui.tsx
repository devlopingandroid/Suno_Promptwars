"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  ExternalLink,
  FileText,
  HeartHandshake,
  Hospital,
  Info,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  MessageCircle,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { tx, type Lang } from "@/lib/translations";
import type { Role, Section } from "@/lib/portal-types";
import { NOTTO } from "@/lib/links";

export const LanguageContext = createContext<Lang>("en");

function statusTone(value: string) {
  return value.replaceAll(" ", "-").toLowerCase();
}

const dateTimeFormat = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
export function timeLabel(timestamp: number) {
  return dateTimeFormat.format(timestamp);
}

export function Status({ value }: { value: string }) {
  const language = useContext(LanguageContext);
  const hindi: Record<string, string> = {
    draft: "ड्राफ्ट",
    published: "प्रकाशित",
    closed: "बंद",
    available: "उपलब्ध",
    withdrawn: "वापस लिया",
    proposed: "प्रस्तावित",
    confirmed: "पुष्टि हुई",
    completed: "उपस्थिति दर्ज",
    declined: "मना किया",
    cancelled: "रद्द",
    invited: "आमंत्रित",
    viewed: "देखा",
    open: "खुला",
    resolved: "हल हुआ",
    "in progress": "जारी",
    "appointment proposed": "अपॉइंटमेंट प्रस्तावित",
    "question open": "सवाल खुला",
    "conversation completed": "बातचीत हुई",
    "wish understood": "इच्छा समझी",
    "declined to discuss": "अभी तैयार नहीं",
  };
  return (
    <span className={`status-chip ${statusTone(value)}`}>
      {language === "hi" ? (hindi[value] ?? value) : value}
    </span>
  );
}

export function Header({
  lang,
  setLang,
  role,
  onRoleChange,
}: {
  lang: Lang;
  setLang: (lang: Lang) => void;
  role: Role | null;
  onRoleChange: (role: Role) => void;
}) {
  const t = tx[lang];
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button
          className="brand"
          onClick={() => onRoleChange(role ?? "donor")}
          aria-label="Suno home"
        >
          <span className="brand-mark">
            <HeartHandshake size={19} />
          </span>
          <span>Suno</span>
        </button>
        <div className="topbar-context">
          {role === "coordinator" ? (
            <>
              <Hospital size={16} /> Coordinator workspace
            </>
          ) : role === "donor" ? (
            <>
              <UserRound size={16} /> Donor portal
            </>
          ) : (
            <span>Donation coordination platform</span>
          )}
        </div>
        <div className="topbar-actions">
          <span className="demo-pill">
            <span />
            {t.demo}
          </span>
          <button
            className="language-button"
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            aria-label={lang === "en" ? "Switch to Hindi" : "Switch to English"}
          >
            {lang === "en" ? t.switchHindi : t.switchEnglish}
          </button>
          {role && (
            <button
              className="topbar-role"
              onClick={() =>
                onRoleChange(role === "donor" ? "coordinator" : "donor")
              }
            >
              {role === "donor" ? t.coordinatorViewBtn : t.donorViewBtn}{" "}
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export function DropletIcon() {
  return (
    <span className="droplet-icon" aria-hidden="true">
      ●
    </span>
  );
}

export function Sidebar({
  role,
  section,
  setSection,
  lang,
}: {
  role: Role;
  section: Section;
  setSection: (section: Section) => void;
  lang: Lang;
}) {
  const t = tx[lang];
  const items: Array<{
    id: Section;
    label: string;
    icon: React.ReactNode;
    role?: Role;
  }> =
    role === "donor"
      ? [
          {
            id: "overview",
            label: t.home,
            icon: <LayoutDashboard size={17} />,
          },
          { id: "blood", label: t.blood, icon: <DropletIcon /> },
          {
            id: "appointments",
            label: t.appointments,
            icon: <CalendarDays size={17} />,
          },
          { id: "organ", label: t.organ, icon: <BookOpen size={17} /> },
          { id: "wish", label: t.wish, icon: <FileText size={17} /> },
          { id: "family", label: t.family, icon: <Users size={17} /> },
          {
            id: "enquiries",
            label: t.enquiries,
            icon: <MessageCircle size={17} />,
          },
        ]
      : [
          {
            id: "overview",
            label: t.home,
            icon: <LayoutDashboard size={17} />,
          },
          { id: "blood", label: t.blood, icon: <DropletIcon /> },
          {
            id: "appointments",
            label: t.appointments,
            icon: <CalendarDays size={17} />,
          },
          {
            id: "enquiries",
            label: t.enquiries,
            icon: <MessageCircle size={17} />,
          },
          { id: "hospital", label: t.hospital, icon: <Hospital size={17} /> },
        ];
  return (
    <aside className="sidebar">
      <div className="sidebar-label">
        {role === "donor" ? t.sidebarDonor : t.sidebarCoordinator}
      </div>
      <nav aria-label="Application navigation">
        {items.map((item) => (
          <button
            key={item.id}
            aria-current={section === item.id ? "page" : undefined}
            className={section === item.id ? "active" : ""}
            onClick={() => setSection(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="privacy-note">
          <LockKeyhole size={15} />
          <span>
            Private demo data
            <br />
            stored in this server process
          </span>
        </div>
        <a href={NOTTO} target="_blank" rel="noopener noreferrer">
          NOTTO source <ExternalLink size={12} />
        </a>
      </div>
    </aside>
  );
}

export function AppShell({
  lang,
  setLang,
  role,
  onRoleChange,
  section,
  setSection,
  children,
}: {
  lang: Lang;
  setLang: (lang: Lang) => void;
  role: Role;
  onRoleChange: (role: Role) => void;
  section: Section;
  setSection: (section: Section) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <Header
        lang={lang}
        setLang={setLang}
        role={role}
        onRoleChange={onRoleChange}
      />
      <div className="app-body">
        <Sidebar
          role={role}
          section={section}
          setSection={setSection}
          lang={lang}
        />
        <main id="main-content" className="app-main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  copy,
  lang,
  right,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  lang: Lang;
  right?: React.ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [title]);
  return (
    <div className="page-header" lang={lang}>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 ref={heading} tabIndex={-1}>
          {title}
        </h1>
        <p>{copy}</p>
      </div>
      {right}
    </div>
  );
}

export function Metric({
  label,
  value,
  note,
  icon,
  tone = "green",
}: {
  label: string;
  value: string | number;
  note: string;
  icon: React.ReactNode;
  tone?: string;
}) {
  return (
    <article className="metric-card">
      <span className={`metric-icon ${tone}`}>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </article>
  );
}

export function Panel({
  title,
  copy,
  icon,
  action,
  children,
  className = "",
}: {
  title: string;
  copy?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`app-panel ${className}`}>
      <div className="panel-heading">
        <div className="panel-heading-title">
          {icon && <span className="panel-icon">{icon}</span>}
          <div>
            <h2>{title}</h2>
            {copy && <p>{copy}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Notice({
  tone = "success",
  children,
  onClose,
}: {
  tone?: "success" | "error" | "info";
  children: React.ReactNode;
  onClose?: () => void;
}) {
  return (
    <div
      className={`notice ${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <Info size={16} /> <span>{children}</span>
      {onClose && (
        <button onClick={onClose} aria-label="Close">
          <X size={15} />
        </button>
      )}
    </div>
  );
}

export function ActivityItem({
  label,
  actor,
  at,
}: {
  label: string;
  actor: string;
  at: number;
}) {
  return (
    <div className="activity-item">
      <span className="activity-dot" />
      <div>
        <strong>{label}</strong>
        <p>
          {actor} · {timeLabel(at)}
        </p>
      </div>
    </div>
  );
}

export function MobileNav({
  role,
  section,
  setSection,
  lang,
}: {
  role: Role;
  section: Section;
  setSection: (section: Section) => void;
  lang: Lang;
}) {
  const t = tx[lang];
  const items: Array<[Section, string]> =
    role === "donor"
      ? [
          ["overview", t.home],
          ["blood", t.blood],
          ["appointments", t.appointments],
          ["organ", t.organ],
          ["wish", t.wish],
          ["family", t.family],
          ["enquiries", t.enquiries],
        ]
      : [
          ["overview", t.home],
          ["blood", t.blood],
          ["appointments", t.appointments],
          ["enquiries", t.enquiries],
          ["hospital", t.hospital],
        ];
  return (
    <div className="mobile-section-nav">
      <Menu size={16} />
      <select
        value={section}
        onChange={(event) => setSection(event.target.value as Section)}
        aria-label="Choose section"
      >
        {items.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
