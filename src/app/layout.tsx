import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import "@/styles/globals.css";
import { IconSprite } from "@/core/ui/icon";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Thesis Coordinator",
  description: "Bachelor thesis supervision and defense management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme-mode="light" data-accent="vermilion">
      <body className={sourceSans.className}>
        <IconSprite />
        <a className="skip-link" href="#main">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
