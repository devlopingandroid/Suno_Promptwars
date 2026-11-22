"use client";

import {
  Activity,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  MessageCircle,
  Users,
} from "lucide-react";
import { tx, type Lang } from "@/lib/translations";
import type { Section, CoordinatorData } from "@/lib/portal-types";
import {
  Status,
  DropletIcon,
  PageHeader,
  Metric,
  Panel,
  ActivityItem,
} from "@/components/portal-ui";

export default function CoordinatorOverview({
  data,
  lang,
  setSection,
}: {
  data: CoordinatorData;
  lang: Lang;
  setSection: (section: Section) => void;
}) {
  const t = tx[lang];
  const openRequests = data.requests.filter(
    (request) => request.status === "published",
  ).length;
  const available = data.requests
    .flatMap((request) => request.responses)
    .filter((response) => response.status === "available").length;
  const awaiting = data.requests
    .flatMap((request) => request.appointments)
    .filter((item) => item.status === "proposed").length;
  const openEnquiries = data.enquiries.filter(
    (item) => item.status !== "resolved",
  ).length;
  return (
    <>
      <PageHeader
        eyebrow="HOSPITAL COORDINATION"
        title={t.coordinatorTitle}
        copy={t.coordinatorCopy}
        lang={lang}
        right={
          <span className="profile-chip">
            <span className="profile-avatar">AM</span> Dr. Ananya Mehta
          </span>
        }
      />
      <div className="metric-grid">
        <Metric
          label={t.openRequests}
          value={openRequests}
          note="Published blood requests"
          icon={<DropletIcon />}
        />
        <Metric
          label={t.availableResponses}
          value={available}
          note="Need review"
          icon={<Users size={18} />}
          tone="blue"
        />
        <Metric
          label={t.awaitingAction}
          value={awaiting}
          note="Proposals to answer"
          icon={<CalendarDays size={18} />}
          tone="amber"
        />
        <Metric
          label={t.openEnquiries}
          value={openEnquiries}
          note="Coordinator follow-up"
          icon={<MessageCircle size={18} />}
          tone="purple"
        />
      </div>
      <div className="dashboard-grid coordinator-grid">
        <Panel
          title="Blood request queue"
          copy="See what needs a coordinator action."
          icon={<DropletIcon />}
          action={
            <button className="link-button" onClick={() => setSection("blood")}>
              Open queue <ChevronRight size={14} />
            </button>
          }
        >
          <div className="queue-list">
            {data.requests.slice(0, 4).map((request) => (
              <div className="queue-row" key={request.id}>
                <span className="blood-badge small-blood">
                  {request.bloodGroup}
                </span>
                <div>
                  <strong>{request.title}</strong>
                  <small>
                    {
                      request.responses.filter(
                        (response) => response.status === "available",
                      ).length
                    }{" "}
                    available ·{" "}
                    {
                      request.appointments.filter(
                        (appointment) => appointment.status === "proposed",
                      ).length
                    }{" "}
                    proposed
                  </small>
                </div>
                <Status value={request.status} />
              </div>
            ))}
          </div>
        </Panel>
        <Panel
          title="Enquiries needing a next step"
          copy="Open questions are visible without exposing internal notes."
          icon={<MessageCircle size={18} />}
          action={
            <button
              className="link-button"
              onClick={() => setSection("enquiries")}
            >
              Review <ChevronRight size={14} />
            </button>
          }
        >
          <div className="queue-list">
            {data.enquiries
              .filter((item) => item.status !== "resolved")
              .slice(0, 4)
              .map((enquiry) => (
                <div className="queue-row" key={enquiry.id}>
                  <span className="queue-icon">
                    <CircleHelp size={16} />
                  </span>
                  <div>
                    <strong>{enquiry.subject}</strong>
                    <small>
                      {enquiry.question.slice(0, 75)}
                      {enquiry.question.length > 75 ? "…" : ""}
                    </small>
                  </div>
                  <Status value={enquiry.status} />
                </div>
              ))}
          </div>
          {data.enquiries.filter((item) => item.status !== "resolved")
            .length === 0 && (
            <div className="empty-inline">No open enquiries.</div>
          )}
        </Panel>
      </div>
      <Panel
        title={t.recentActivity}
        copy="Activity records show who changed a coordination record and when."
        icon={<Activity size={18} />}
      >
        <div className="activity-list">
          {data.recentActivity.map((item) => (
            <ActivityItem
              key={item.id}
              label={item.label}
              actor={`${item.actor} · ${item.actorRole}`}
              at={item.at}
            />
          ))}
        </div>
      </Panel>
    </>
  );
}
