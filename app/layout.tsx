import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grenada Events",
  description: "A simple Grenada events scraper and listing app."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
