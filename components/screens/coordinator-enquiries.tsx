"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock3,
  LockKeyhole,
  MessageCircle,
  UserRound,
} from "lucide-react";
import { tx, type Lang } from "@/lib/translations";
import type { CoordinatorData } from "@/lib/portal-types";
import { Status, PageHeader, timeLabel } from "@/components/portal-ui";

export default function CoordinatorEnquiries({
  data,
  lang,
  mutate,
}: {
  data: CoordinatorData;
  lang: Lang;
  mutate: (action: Record<string, unknown>) => Promise<boolean>;
}) {
  const t = tx[lang];
  const [answer, setAnswer] = useState<Record<string, string>>({});
  return (
    <>
      <PageHeader
        eyebrow="FOLLOW-UP QUEUE"
        title={t.enquiries}
        copy="Open, acknowledge, and resolve donor questions with a traceable next step."
        lang={lang}
      />
      <div className="enquiry-grid">
        {data.enquiries.length === 0 ? (
          <div className="empty-panel">
            <MessageCircle size={28} />
            <strong>No enquiries yet</strong>
          </div>
        ) : (
          data.enquiries.map((enquiry) => (
            <article className="coordinator-enquiry" key={enquiry.id}>
              <div className="enquiry-row-top">
                <div>
                  <span className="eyebrow">
                    {enquiry.type} ·{" "}
                    {enquiry.language === "hi" ? "Hindi" : "English"}
                  </span>
                  <h2>{enquiry.subject}</h2>
                </div>
                <Status value={enquiry.status} />
              </div>
              <p className="enquiry-question">{enquiry.question}</p>
              <div className="enquiry-meta">
                <span>
                  <UserRound size={14} /> Demo donor
                </span>
                <span>
                  <Clock3 size={14} /> {timeLabel(enquiry.createdAt)}
                </span>
                <span>
                  {enquiry.requestFollowUp
                    ? "Follow-up requested"
                    : "Information only"}
                </span>
              </div>
              {enquiry.status !== "resolved" && (
                <>
                  <label
                    className="field-label"
                    htmlFor={`answer-${enquiry.id}`}
                  >
                    {t.publicMessage}
                  </label>
                  <textarea
                    id={`answer-${enquiry.id}`}
                    rows={3}
                    maxLength={500}
                    value={answer[enquiry.id] ?? ""}
                    onChange={(event) =>
                      setAnswer({ ...answer, [enquiry.id]: event.target.value })
                    }
                    placeholder="Write a clear next step for the donor…"
                  />
                  <div className="button-row">
                    <button
                      className="button outline small"
                      onClick={() =>
                        mutate({
                          action: "start-follow-up",
                          enquiryId: enquiry.id,
                          answer: answer[enquiry.id],
                        })
                      }
                    >
                      {t.startFollowup}
                    </button>
                    <button
                      className="button primary small"
                      disabled={!answer[enquiry.id]?.trim()}
                      onClick={() =>
                        mutate({
                          action: "resolve",
                          enquiryId: enquiry.id,
                          answer: answer[enquiry.id],
                        })
                      }
                    >
                      {t.resolve}
                    </button>
                  </div>
                </>
              )}
              {enquiry.answer && (
                <div className="coordinator-answer">
                  <CheckCircle2 size={14} /> {enquiry.answer}
                </div>
              )}
              <div className="internal-note">
                <LockKeyhole size={14} />
                <strong>{t.internal}</strong>
                <p>
                  Keep internal follow-up notes on the coordinator side only.
                </p>
              </div>
            </article>
          ))
        )}
      </div>
    </>
  );
}
