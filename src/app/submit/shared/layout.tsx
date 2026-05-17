import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Private prompt created",
  robots: { index: false, follow: false },
};

export default function SharedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
