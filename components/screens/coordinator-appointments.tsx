"use client";

import { CalendarDays } from "lucide-react";
import { tx, type Lang } from "@/lib/translations";
import type { CoordinatorData } from "@/lib/portal-types";
import { Status, PageHeader, Panel } from "@/components/portal-ui";

export default function CoordinatorAppointments({
  data,
  lang,
  mutate,
}: {
  data: CoordinatorData;
  lang: Lang;
  mutate: (action: Record<string, unknown>) => Promise<boolean>;
}) {
  const t = tx[lang];
  const appointments = data.requests.flatMap((request) =>
    request.appointments.map((appointment) => ({ ...appointment, request })),
  );
  return (
    <>
      <PageHeader
        eyebrow="COORDINATION"
        title={t.appointments}
        copy="Review proposals, confirmed times, and administrative attendance records."
        lang={lang}
      />
      <Panel
        title="Appointment queue"
        copy="Completed means attendance was administratively recorded; it does not imply a clinical outcome."
        icon={<CalendarDays size={18} />}
      >
        {appointments.length === 0 ? (
          <div className="empty-panel">
            <CalendarDays size={28} />
            <strong>No appointments yet</strong>
            <p>
              When a donor responds, propose a time from the blood request
              detail.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Request</th>
                  <th>Window</th>
                  <th>Status</th>
                  <th>Next action</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.donorName}</strong>
                      <small>Demo donor record</small>
                    </td>
                    <td>{item.request.title}</td>
                    <td>{item.window}</td>
                    <td>
                      <Status value={item.status} />
                    </td>
                    <td>
                      {item.status === "confirmed" && (
                        <button
                          className="link-button"
                          onClick={() =>
                            mutate({
                              action: "complete",
                              appointmentId: item.id,
                            })
                          }
                        >
                          {t.resolve} attendance
                        </button>
                      )}
                      {(item.status === "proposed" ||
                        item.status === "confirmed") && (
                        <button
                          className="link-button danger-link"
                          onClick={() =>
                            mutate({
                              action: "cancel",
                              appointmentId: item.id,
                              reason: "Cancelled by coordinator in demo.",
                            })
                          }
                        >
                          {t.cancel}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
