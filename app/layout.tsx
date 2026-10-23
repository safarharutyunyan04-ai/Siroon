import type { Metadata } from "next";
import {
  Cinzel,
  Cormorant_Garamond,
  Fraunces,
  Great_Vibes,
  Noto_Sans_Armenian,
  Outfit,
} from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { HtmlLang } from "@/components/i18n/HtmlLang";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-leman",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const greatVibes = Great_Vibes({
  variable: "--font-leman-script",
  subsets: ["latin"],
  weight: ["400"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-leman-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const notoArmenian = Noto_Sans_Armenian({
  variable: "--font-armenian",
  subsets: ["armenian"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Siroon",
  description: "Siroon",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="hy"
      data-scroll-behavior="smooth"
      className={`${outfit.variable} ${fraunces.variable} ${cinzel.variable} ${greatVibes.variable} ${cormorant.variable} ${notoArmenian.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col text-foreground">
        <HtmlLang />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
