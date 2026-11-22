"use client";

import { useState } from "react";
import {
  Check,
  ClipboardList,
  LockKeyhole,
  Plus,
  Search,
  Send,
  X,
} from "lucide-react";
import { tx, type Lang } from "@/lib/translations";
import type { CoordinatorData } from "@/lib/portal-types";
import {
  Status,
  DropletIcon,
  PageHeader,
  Panel,
  ActivityItem,
  timeLabel,
} from "@/components/portal-ui";

export default function CoordinatorBlood({
  data,
  lang,
  mutate,
}: {
  data: CoordinatorData;
  lang: Lang;
  mutate: (action: Record<string, unknown>) => Promise<boolean>;
}) {
  const t = tx[lang];
  const [selected, setSelected] = useState(data.requests[0]?.id);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const filteredRequests = data.requests.filter((item) =>
    `${item.title} ${item.location} ${item.bloodGroup} ${item.status}`.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const [form, setForm] = useState({
    title: "",
    location: "",
    bloodGroup: "O+",
    appointmentWindow: "",
    instructions: "",
  });
  const request =
    filteredRequests.find((item) => item.id === selected) ?? filteredRequests[0];
  async function create() {
    if (
      !(await mutate({
        action: editingId ? "edit-request" : "create-request",
        requestId: editingId,
        ...form,
      }))
    )
      return;
    setEditingId(null);
    setForm({
      title: "",
      location: "",
      bloodGroup: "O+",
      appointmentWindow: "",
      instructions: "",
    });
    setShowForm(false);
  }
  return (
    <>
      <PageHeader
        eyebrow="BLOOD REQUESTS"
        title={t.bloodTitle}
        copy="Publish and coordinate volunteer requests with explicit state transitions."
        lang={lang}
        right={
          <button
            className="button primary small"
            onClick={() => {
              setEditingId(null);
              setShowForm(!showForm);
            }}
          >
            <Plus size={15} /> {t.createRequest}
          </button>
        }
      />
      {showForm && (
        <Panel
          title={t.newRequest}
          copy="New requests begin as drafts and need an explicit publish action."
          icon={<Plus size={18} />}
        >
          <div className="form-grid">
            <div>
              <label className="field-label" htmlFor="request-title">
                {t.title}
              </label>
              <input
                id="request-title"
                maxLength={100}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Weekend volunteer session"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="request-group">
                {t.group}
              </label>
              <select
                id="request-group"
                value={form.bloodGroup}
                onChange={(e) =>
                  setForm({ ...form, bloodGroup: e.target.value })
                }
              >
                {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map(
                  (value) => (
                    <option key={value}>{value}</option>
                  ),
                )}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="request-location">
                {t.location}
              </label>
              <input
                id="request-location"
                maxLength={120}
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="East Wing · Donation desk"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="request-window">
                {t.window}
              </label>
              <input
                id="request-window"
                maxLength={120}
                value={form.appointmentWindow}
                onChange={(e) =>
                  setForm({ ...form, appointmentWindow: e.target.value })
                }
                placeholder="Sat 28 Nov · 09:00–13:00"
              />
            </div>
          </div>
          <label className="field-label" htmlFor="request-instructions">
            {t.instructions}
          </label>
          <textarea
            id="request-instructions"
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            rows={3}
            maxLength={300}
          />
          <div className="button-row">
            <button
              className="button primary"
              disabled={
                !form.title || !form.location || !form.appointmentWindow
              }
              onClick={create}
            >
              <Check size={15} /> {t.create}
            </button>
          </div>
        </Panel>
      )}
      <label className="search-field">
        <Search size={16} />
        <span className="sr-only">Search hospital requests</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search hospital requests"
        />
      </label>
      <div className="coordinator-request-layout">
        <Panel
          title="Request queue"
          copy="Draft → published → closed"
          icon={<ClipboardList size={18} />}
        >
          <div className="request-table">
            {filteredRequests.length === 0 && <p className="empty-inline" role="status">{lang === "hi" ? "कोई मेल खाती रिक्वेस्ट नहीं मिली।" : "No requests match your search."}</p>}
            {filteredRequests.map((item) => (
                <button
                  className={`request-table-row ${request?.id === item.id ? "selected" : ""}`}
                  key={item.id}
                  onClick={() => setSelected(item.id)}
                >
                  <span className="blood-badge small-blood">
                    {item.bloodGroup}
                  </span>
                  <span className="request-table-copy">
                    <strong>{item.title}</strong>
                    <small>
                      {item.location} · {item.responses.length} response(s)
                    </small>
                  </span>
                  <Status value={item.status} />
                </button>
              ))}
          </div>
        </Panel>
        {request && (
          <Panel
            title={request.title}
            copy={`${request.hospitalName} · ${request.location}`}
            icon={<DropletIcon />}
          >
            <div className="detail-facts">
              <div>
                <span>{t.group}</span>
                <strong>{request.bloodGroup}</strong>
              </div>
              <div>
                <span>{t.window}</span>
                <strong>{request.appointmentWindow}</strong>
              </div>
              <div>
                <span>Created</span>
                <strong>{timeLabel(request.createdAt)}</strong>
              </div>
              <div>
                <span>Coordinator</span>
                <strong>{request.coordinatorName}</strong>
              </div>
            </div>
            <div className="detail-actions">
              {request.status === "draft" && (
                <button
                  className="button outline small"
                  onClick={() => {
                    setEditingId(request.id);
                    setForm({
                      title: request.title,
                      location: request.location,
                      bloodGroup: request.bloodGroup,
                      appointmentWindow: request.appointmentWindow,
                      instructions: request.instructions,
                    });
                    setShowForm(true);
                  }}
                >
                  Edit draft
                </button>
              )}
              {request.status === "draft" && (
                <button
                  className="button primary small"
                  onClick={() =>
                    mutate({ action: "publish", requestId: request.id })
                  }
                >
                  <Send size={14} /> {t.publish}
                </button>
              )}
              {request.status === "published" && (
                <button
                  className="button outline small"
                  onClick={() =>
                    mutate({ action: "close", requestId: request.id })
                  }
                >
                  <X size={14} /> {t.close}
                </button>
              )}
            </div>
            <h3 className="subheading">
              Volunteer responses <span>{request.responses.length}</span>
            </h3>
            {request.responses.length === 0 ? (
              <div className="empty-inline">
                No volunteer responses yet. The donor portal can respond to this
                published request.
              </div>
            ) : (
              <div className="response-list">
                {request.responses.map((response) => (
                  <div className="response-row" key={response.id}>
                    <div>
                      <strong>{response.donorName}</strong>
                      <small>
                        Availability shared · {timeLabel(response.createdAt)}
                      </small>
                    </div>
                    <Status value={response.status} />
                    {response.status === "available" && (
                      <button
                        className="button primary small"
                        onClick={() =>
                          mutate({
                            action: "propose",
                            requestId: request.id,
                            responseId: response.id,
                          })
                        }
                      >
                        {t.propose}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            <h3 className="subheading">
              Activity <span>{request.activity.length}</span>
            </h3>
            <div className="activity-list compact">
              {request.activity.slice(0, 5).map((item) => (
                <ActivityItem
                  key={item.id}
                  label={item.label}
                  actor={item.actor}
                  at={item.at}
                />
              ))}
            </div>
            <div className="internal-note">
              <LockKeyhole size={14} />
              <strong>{t.internal}</strong>
              <p>{request.internalNote}</p>
            </div>
          </Panel>
        )}
      </div>
    </>
  );
}
