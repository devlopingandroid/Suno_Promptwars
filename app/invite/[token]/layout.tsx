import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Suno | Family Invitation",
  description:
    "A private space to listen and respond to a family member's wish.",
  robots: { index: false, follow: false },
};

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
