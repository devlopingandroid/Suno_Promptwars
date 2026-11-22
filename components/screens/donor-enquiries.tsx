"use client";

import { useState } from "react";
import { Activity, CheckCircle2, MessageCircle, Send } from "lucide-react";
import { tx, type Lang } from "@/lib/translations";
import type { DonorData } from "@/lib/portal-types";
import { Status, PageHeader, Panel } from "@/components/portal-ui";

export default function DonorEnquiries({
  data,
  lang,
  mutate,
}: {
  data: DonorData;
  lang: Lang;
  mutate: (action: Record<string, unknown>) => Promise<boolean>;
}) {
  const t = tx[lang];
  const [question, setQuestion] = useState("");
  const [sent, setSent] = useState(false);
  async function send() {
    if (
      !(await mutate({ action: "request-follow-up", question, language: lang }))
    )
      return;
    setQuestion("");
    setSent(true);
  }
  return (
    <>
      <PageHeader
        eyebrow="COORDINATOR FOLLOW-UP"
        title={t.enquiries}
        copy={t.sessionCopy}
        lang={lang}
      />
      <Panel
        title={t.session}
        copy={t.sessionCopy}
        icon={<MessageCircle size={18} />}
      >
        <label className="field-label" htmlFor="follow-up">
          {t.questionPlaceholder}
        </label>
        <textarea
          id="follow-up"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={600}
          rows={5}
          placeholder={t.questionPlaceholder}
        />
        <div className="button-row">
          <button
            className="button primary"
            disabled={!question.trim()}
            onClick={send}
          >
            <Send size={15} /> {sent ? t.followupSent : t.sendFollowup}
          </button>
        </div>
      </Panel>
      <Panel
        title="Your enquiry history"
        copy="A follow-up stays open until a coordinator updates it."
        icon={<Activity size={18} />}
      >
        {data.enquiries.length === 0 ? (
          <div className="empty-inline">No coordinator enquiries yet.</div>
        ) : (
          <div className="enquiry-list">
            {data.enquiries.map((enquiry) => (
              <div className="enquiry-row" key={enquiry.id}>
                <div className="enquiry-row-top">
                  <strong>{enquiry.subject}</strong>
                  <Status value={enquiry.status} />
                </div>
                <p>{enquiry.question}</p>
                {enquiry.answer && (
                  <div className="coordinator-answer">
                    <CheckCircle2 size={14} /> {enquiry.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
