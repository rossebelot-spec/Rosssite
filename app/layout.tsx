import type { Metadata } from "next";
import { Cormorant_Garamond, JetBrains_Mono, Lora, Inter } from "next/font/google";
import Script from "next/script";
import { NavProvider } from "@/components/nav-context";
import { SiteShell } from "@/components/site-shell";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const siteDescription =
  "Poet, journalist, and environmental writer. Essays, commentary and analysis, photography, and more.";
const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ross Belot",
    template: "%s | Ross Belot",
  },
  description: siteDescription,
  applicationName: "Ross Belot",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: "Ross Belot",
    title: "Ross Belot",
    description: siteDescription,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Ross Belot",
    description: siteDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${cormorant.variable} ${jetbrainsMono.variable} ${lora.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NavProvider>
          <SiteShell>{children}</SiteShell>
        </NavProvider>
        <Script
          defer
          src="https://umami-two-xi.vercel.app/script.js"
          data-website-id="d83972bc-6dd8-411f-9099-5c9ebe657757"
        />
      </body>
    </html>
  );
}
