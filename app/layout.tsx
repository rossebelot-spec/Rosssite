import type { Metadata } from "next";
import { Cormorant_Garamond, JetBrains_Mono, Lora, Inter } from "next/font/google";
import { NavProvider } from "@/components/nav-context";
import { SiteShell } from "@/components/site-shell";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
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

export const metadata: Metadata = {
  title: {
    default: "Ross Belot",
    template: "%s | Ross Belot",
  },
  description:
    "Poet, journalist, and environmental writer. Essays, op-eds, photography, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${jetbrainsMono.variable} ${lora.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NavProvider>
          <SiteShell>{children}</SiteShell>
        </NavProvider>
      </body>
    </html>
  );
}
