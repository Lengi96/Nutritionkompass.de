import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { CookieConsent } from "@/components/CookieConsent";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mein-nutrikompass.de"),
  title: {
    default: "mein-nutrikompass.de – KI-gestützte Ernährungsplanung",
    template: "%s | mein-nutrikompass.de",
  },
  description:
    "mein-nutrikompass.de ist die KI-gestützte Ernährungsplanung für Einrichtungen: flexible 1- bis 14-Tage-Pläne, detaillierte Rezepte, automatische Einkaufslisten und PDF-Export.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "mein-nutrikompass.de – KI-gestützte Ernährungsplanung",
    description:
      "Für Einrichtungen, die strukturierte Ernährungsplanung brauchen: KI-Planvorschläge, Team-Handover, Einkaufslisten und PDF-Export.",
    type: "website",
    locale: "de_DE",
    siteName: "mein-nutrikompass.de",
    url: "https://mein-nutrikompass.de",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              borderRadius: "0.75rem",
            },
          }}
        />
        <CookieConsent />
      </body>
    </html>
  );
}
