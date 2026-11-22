"use client";

import { CalendarDays, Info } from "lucide-react";
import { tx, type Lang } from "@/lib/translations";
import type { DonorData } from "@/lib/portal-types";
import { Status, PageHeader } from "@/components/portal-ui";

export default function DonorAppointments({
  data,
  lang,
  mutate,
}: {
  data: DonorData;
  lang: Lang;
  mutate: (action: Record<string, unknown>) => Promise<boolean>;
}) {
  const t = tx[lang];
  return (
    <>
      <PageHeader
        eyebrow="BLOOD DONATION"
        title={t.myAppointments}
        copy={t.appointmentCopy}
        lang={lang}
      />
      <div className="appointment-list">
        {data.blood.appointments.length === 0 ? (
          <div className="empty-panel">
            <CalendarDays size={28} />
            <strong>{t.noAppointments}</strong>
            <p>When a coordinator proposes a time, it will appear here.</p>
          </div>
        ) : (
          data.blood.appointments.map((item) => (
            <article className="appointment-card" key={item.id}>
              <div className="appointment-date">
                <CalendarDays size={18} />
                <strong>{item.window.split("·")[0]}</strong>
                <span>{item.window.split("·")[1]}</span>
              </div>
              <div className="appointment-main">
                <div className="appointment-title">
                  <h2>{item.request?.hospitalName || "Hospital request"}</h2>
                  <Status value={item.status} />
                </div>
                <p>
                  {item.request?.location || "Donation desk"} ·{" "}
                  {item.request?.bloodGroup || "Blood request"}
                </p>
                <small>
                  {item.status === "completed"
                    ? t.completed
                    : item.status === "confirmed"
                      ? "Your appointment is confirmed. Follow hospital instructions."
                      : item.status === "proposed"
                        ? "Review this proposed time and choose your response."
                        : item.reason || "This appointment is closed."}
                </small>
              </div>
              {item.status === "proposed" && (
                <div className="appointment-actions">
                  <button
                    className="button primary small"
                    onClick={() =>
                      mutate({ action: "confirm", appointmentId: item.id })
                    }
                  >
                    {t.confirm}
                  </button>
                  <button
                    className="button text small"
                    onClick={() =>
                      mutate({ action: "decline", appointmentId: item.id })
                    }
                  >
                    {t.decline}
                  </button>
                </div>
              )}
              {(item.status === "confirmed" || item.status === "proposed") && (
                <button
                  className="link-button danger-link"
                  onClick={() =>
                    mutate({ action: "cancel", appointmentId: item.id })
                  }
                >
                  {t.cancel}
                </button>
              )}
            </article>
          ))
        )}
      </div>
      <div className="boundary-note">
        <Info size={16} />
        <span>
          An appointment records coordination status. It does not record
          clinical eligibility or a completed donation.
        </span>
      </div>
    </>
  );
}
