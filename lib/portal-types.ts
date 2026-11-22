import type { coordinatorView, getHospital, safeDonorView } from "./store";
import type { donorView } from "./portal-view";

export type Role = "donor" | "coordinator";

export type Section =
  | "overview"
  | "blood"
  | "appointments"
  | "organ"
  | "wish"
  | "family"
  | "enquiries"
  | "hospital";

// Contracts follow the server's privacy projections instead of duplicating them.
export type DonorData = NonNullable<ReturnType<typeof donorView>>;
export type CoordinatorData = ReturnType<typeof coordinatorView>;
export type PublicRequest = DonorData["blood"]["requests"][number];

export type Session = {
  role: Role | null;
  hospital?: ReturnType<typeof getHospital>;
  donor?: DonorData | null;
  coordinatorData?: CoordinatorData | null;
};
export type MutationResult = Pick<Session, "donor" | "coordinatorData"> & {
  circle?: ReturnType<typeof safeDonorView>;
};
