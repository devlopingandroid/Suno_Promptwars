"use client";

import { Hospital, Info, ShieldCheck } from "lucide-react";
import { tx, type Lang } from "@/lib/translations";
import type { CoordinatorData } from "@/lib/portal-types";
import { PageHeader } from "@/components/portal-ui";

export default function CoordinatorHospital({
  data,
  lang,
}: {
  data: CoordinatorData;
  lang: Lang;
}) {
  const t = tx[lang];
  return (
    <>
      <PageHeader
        eyebrow="ACCOUNTABILITY"
        title={t.hospital}
        copy={t.profileCopy}
        lang={lang}
      />
      <div className="hospital-profile">
        <div className="hospital-profile-main">
          <span className="hospital-logo">
            <Hospital size={30} />
          </span>
          <div>
            <span className="eyebrow">DONATION COORDINATION PARTNER</span>
            <h2>{data.hospital.name}</h2>
            <p>{data.hospital.address}</p>
          </div>
        </div>
        <div className="synthetic-banner">
          <ShieldCheck size={17} />
          <div>
            <strong>{t.synthetic}</strong>
            <p>{t.verificationCopy}</p>
          </div>
        </div>
        <div className="profile-facts">
          <div>
            <span>{t.phone}</span>
            <strong>{data.hospital.phone}</strong>
          </div>
          <div>
            <span>Coordinator</span>
            <strong>{data.hospital.coordinatorName}</strong>
            <small>{data.hospital.coordinatorRole}</small>
          </div>
          <div>
            <span>{t.source}</span>
            <strong>{data.hospital.source}</strong>
          </div>
          <div>
            <span>{t.reviewed}</span>
            <strong>{data.hospital.reviewedAt}</strong>
          </div>
        </div>
      </div>
      <div className="boundary-note">
        <Info size={16} />
        <span>
          Trust information shows who is responsible and where profile
          information came from. Suno does not create doctor ratings or a trust
          score.
        </span>
      </div>
    </>
  );
}
