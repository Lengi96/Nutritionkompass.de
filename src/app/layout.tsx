import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "NutriKompass – KI-gestützte Ernährungsplanung",
    template: "%s | NutriKompass",
  },
  description:
    "KI-gestützte Ernährungsplanung für Einrichtungen. Individuelle 7-Tage-Pläne, automatische Einkaufslisten und PDF-Export. DSGVO-konform.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "NutriKompass – KI-gestützte Ernährungsplanung",
    description:
      "Individuelle Ernährungspläne per Knopfdruck. Für Einrichtungen, die Menschen mit Essstörungen betreuen.",
    type: "website",
    locale: "de_DE",
    siteName: "NutriKompass",
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
      </body>
    </html>
  );
}
