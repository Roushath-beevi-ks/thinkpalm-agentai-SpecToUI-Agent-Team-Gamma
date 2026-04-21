import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpecToUI Agent — PRD to UI",
  description: "SpecToUI Agent: PRD/spec to live UI preview and React + Tailwind export"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
