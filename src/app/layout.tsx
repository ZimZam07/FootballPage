import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "@/lib/site";

// Instrument Sans for reading; Barlow Condensed for headlines, scores and figures —
// the condensed broadcast face that gives Football Hub its matchday voice.
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument", display: "swap" });
const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-barlow",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: "%s | Football Hub" },
  description: SITE_DESCRIPTION,
  applicationName: "Football Hub",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: { type: "website", siteName: "Football Hub", url: "/", title: SITE_TITLE, description: SITE_DESCRIPTION, locale: "en_GB" },
  twitter: { card: "summary", title: SITE_TITLE, description: SITE_DESCRIPTION },
};

// Football Hub has a single, permanent dark theme.
export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0b0c0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${sans.variable} ${display.variable}`} style={{ colorScheme: "dark" }}>
      <body>{children}</body>
    </html>
  );
}
