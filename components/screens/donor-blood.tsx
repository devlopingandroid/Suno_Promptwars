"use client";

import { useState } from "react";
import {
  CalendarDays,
  Check,
  Hospital,
  Info,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { tx, type Lang } from "@/lib/translations";
import type { DonorData } from "@/lib/portal-types";
import { Status, PageHeader, timeLabel } from "@/components/portal-ui";

export default function DonorBlood({
  data,
  lang,
  mutate,
}: {
  data: DonorData;
  lang: Lang;
  mutate: (action: Record<string, unknown>) => Promise<boolean>;
}) {
  const t = tx[lang];
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const normalizedSearch = search.trim().toLowerCase();
  const filtered = data.blood.requests.filter(
    (request) =>
      `${request.title} ${request.hospitalName} ${request.location}`
        .toLowerCase()
        .includes(normalizedSearch) &&
      (group === "all" || request.bloodGroup === group),
  );
  const activeResponses = new Map(
    data.blood.responses
      .filter((response) => response.status !== "withdrawn")
      .map((response) => [response.requestId, response]),
  );
  const responseFor = (requestId: string) => activeResponses.get(requestId);
  return (
    <>
      <PageHeader
        eyebrow="BLOOD DONATION"
        title={t.bloodTitle}
        copy={t.bloodCopy}
        lang={lang}
        right={
          <span className="scope-note">
            <ShieldCheck size={15} /> Hospital screening remains the decision
            point
          </span>
        }
      />
      <div className="filter-bar">
        <label className="search-field">
          <Search size={16} />
          <span className="sr-only">{t.search}</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.search}
          />
        </label>
        <select
          value={group}
          onChange={(event) => setGroup(event.target.value)}
          aria-label={t.group}
        >
          <option value="all">{t.allGroups}</option>
          <option value="O+">O+</option>
          <option value="A+">A+</option>
          <option value="B+">B+</option>
          {["O-", "A-", "B-", "AB+", "AB-"].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-panel">
          <Search size={28} />
          <strong>{t.noRequests}</strong>
        </div>
      ) : (
        <div className="request-grid">
          {filtered.map((request) => {
            const response = responseFor(request.id);
            return (
              <article className="request-card" key={request.id}>
                <div className="request-card-top">
                  <span className="blood-badge">{request.bloodGroup}</span>
                  <Status value="published" />
                </div>
                <h2>{request.title}</h2>
                <p className="request-hospital">
                  <Hospital size={15} /> {request.hospitalName}
                </p>
                <div className="request-facts">
                  <span>
                    <CalendarDays size={15} /> {request.appointmentWindow}
                  </span>
                  <span>
                    <Info size={15} /> {request.location}
                  </span>
                </div>
                <p className="request-instruction">{request.instructions}</p>
                <details className="request-history">
                  <summary>
                    {t.details || "Request details & hospital contact"}
                  </summary>
                  <p>
                    Created: {timeLabel(request.createdAt)} · Updated:{" "}
                    {timeLabel(request.updatedAt)}
                  </p>
                  <p>{request.hospitalName} · Synthetic demo hospital</p>
                  <p>
                    Demo contact: +91 11 4000 1212 · 14 River Road, New Delhi
                  </p>
                  <p>
                    Responsible coordinator: {request.coordinatorName} ·{" "}
                    {request.coordinatorRole}
                  </p>
                  <p>
                    Contact details are synthetic; no messages or calls are sent
                    by Suno.
                  </p>
                </details>
                <div className="request-card-footer">
                  <span className="coordinator-line">
                    <UserRound size={14} /> {request.coordinatorName} ·{" "}
                    {request.coordinatorRole}
                  </span>
                  {response ? (
                    <div className="inline-actions">
                      <Status value={response.status} />
                      {response.status === "available" && (
                        <button
                          className="link-button danger-link"
                          onClick={() =>
                            mutate({
                              action: "withdraw",
                              requestId: request.id,
                            })
                          }
                        >
                          {t.withdrawn}
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      className="button primary small"
                      onClick={() =>
                        mutate({ action: "volunteer", requestId: request.id })
                      }
                    >
                      <Check size={15} /> {t.volunteer}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      <div className="boundary-note">
        <ShieldCheck size={16} />
        <span>{t.screening}</span>
      </div>
    </>
  );
}
