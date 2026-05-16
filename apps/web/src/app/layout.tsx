import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getCurrentLang } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Wave — watch together, in sync",
  description:
    "Drop a link, send the invite, and watch in lockstep with the people who matter.",
};

export const viewport: Viewport = {
  themeColor: "#0a0d14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const lang = await getCurrentLang();
  return (
    <html lang={lang}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
