"use client";

import {
  Activity,
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronRight,
  HeartHandshake,
  MessageCircle,
  Users,
} from "lucide-react";
import { tx, type Lang } from "@/lib/translations";
import type { Section, DonorData } from "@/lib/portal-types";
import {
  DropletIcon,
  PageHeader,
  Metric,
  Panel,
  ActivityItem,
} from "@/components/portal-ui";

export default function DonorOverview({
  data,
  lang,
  setSection,
}: {
  data: DonorData;
  lang: Lang;
  setSection: (section: Section) => void;
}) {
  const t = tx[lang];
  const open = data.blood.requests.length;
  const responseCount = data.blood.responses.filter(
    (item) =>
      item.status === "available" || item.status === "appointment proposed",
  ).length;
  const activeAppointment = data.blood.appointments.find(
    (item) => item.status === "proposed" || item.status === "confirmed",
  );
  return (
    <>
      <PageHeader
        eyebrow="DONOR PORTAL"
        title={t.donorTitle}
        copy={t.donorCopy}
        lang={lang}
        right={
          <span className="profile-chip">
            <span className="profile-avatar">D</span> Demo donor
          </span>
        }
      />
      <div className="metric-grid">
        <Metric
          label={t.openRequests}
          value={open}
          note="Published by hospitals"
          icon={<DropletIcon />}
        />
        <Metric
          label={t.availableResponses}
          value={responseCount}
          note="Your active responses"
          icon={<Users size={18} />}
          tone="blue"
        />
        <Metric
          label={t.awaitingAction}
          value={
            data.blood.appointments.filter((item) => item.status === "proposed")
              .length
          }
          note="Review your next step"
          icon={<CalendarDays size={18} />}
          tone="amber"
        />
        <Metric
          label={t.openEnquiries}
          value={
            data.enquiries.filter((item) => item.status !== "resolved").length
          }
          note="Coordinator follow-up"
          icon={<MessageCircle size={18} />}
          tone="purple"
        />
      </div>
      <div className="dashboard-grid">
        <Panel
          title="Your next action"
          copy="Suno keeps this explicit so a page view never becomes a decision."
          icon={<ArrowRight size={18} />}
          className="next-action-panel"
        >
          {activeAppointment ? (
            <div className="next-action">
              <span className="next-action-icon">
                <CalendarDays size={20} />
              </span>
              <div>
                <strong>
                  {activeAppointment.status === "proposed"
                    ? t.proposed
                    : t.confirmed}
                </strong>
                <p>
                  {activeAppointment.request?.hospitalName} ·{" "}
                  {activeAppointment.window}
                </p>
              </div>
              <button
                className="button primary small"
                onClick={() => setSection("appointments")}
              >
                Review <ChevronRight size={15} />
              </button>
            </div>
          ) : (
            <div className="next-action">
              <span className="next-action-icon">
                <DropletIcon />
              </span>
              <div>
                <strong>Find a blood volunteer request</strong>
                <p>
                  Availability starts a hospital conversation. Screening happens
                  at the hospital.
                </p>
              </div>
              <button
                className="button outline small"
                onClick={() => setSection("blood")}
              >
                Browse <ChevronRight size={15} />
              </button>
            </div>
          )}
        </Panel>
        <Panel
          title="Organ & tissue, at your pace"
          copy="A personal wish can sit alongside a separate blood workflow."
          icon={<BookOpen size={18} />}
          action={
            <button className="link-button" onClick={() => setSection("organ")}>
              Explore <ChevronRight size={14} />
            </button>
          }
        >
          <div className="overview-callout">
            <span className="callout-icon">
              <HeartHandshake size={20} />
            </span>
            <div>
              <strong>
                {data.circle.wish
                  ? "Wish recorded for family conversation"
                  : "Start a private family conversation"}
              </strong>
              <p>
                {data.circle.wish
                  ? "Your recorded wish is editable and is not an official pledge."
                  : "Write a wish and invite two or three family members."}
              </p>
            </div>
          </div>
        </Panel>
      </div>
      <Panel
        title="Recent activity"
        copy="Only your own actions and donor-visible hospital updates appear here."
        icon={<Activity size={18} />}
      >
        <div className="activity-list">
          <ActivityItem
            label="Demo session created"
            actor="You"
            at={data.circle.createdAt}
          />
          {data.blood.responses.map((item) => (
            <ActivityItem
              key={item.id}
              label={`Availability: ${item.status}`}
              actor="You"
              at={item.updatedAt}
            />
          ))}
        </div>
      </Panel>
    </>
  );
}
