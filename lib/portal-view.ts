import {
  coordinatorView,
  donorBloodView,
  donorEnquiries,
  getCircle,
  getHospital,
  safeDonorView,
} from "./store";
import type { DemoSession } from "./session";

export function donorView(session: DemoSession) {
  const circle = getCircle(session.donorId);
  return circle
    ? {
        circle: safeDonorView(circle),
        blood: donorBloodView(circle.id),
        enquiries: donorEnquiries(circle.id),
      }
    : null;
}

/** Invoke inside withWorkspace; only construct the active role's projection. */
export function portalView(session: DemoSession) {
  return session.role === "coordinator"
    ? { coordinatorData: coordinatorView() }
    : { donor: donorView(session) };
}

export function bootstrapView(session: DemoSession) {
  return {
    mode: "demo" as const,
    role: session.role,
    hospital: getHospital(),
    ...portalView(session),
  };
}
