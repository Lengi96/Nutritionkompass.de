"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ConsentValue = "necessary" | "all";
const STORAGE_KEY = "cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setVisible(true);
    }
  }, []);

  function accept(value: ConsentValue) {
    localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie-Einstellungen"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur sm:px-6 sm:py-4"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-700 sm:max-w-xl sm:text-sm">
          Wir verwenden ausschließlich technisch notwendige Cookies (z.&nbsp;B.
          für den Login). Ohne diese funktioniert die Seite nicht. Weitere
          Informationen finden Sie in unserer{" "}
          <Link
            href="/datenschutz"
            className="font-medium text-[#2D6A4F] underline underline-offset-2 hover:text-[#245640]"
          >
            Datenschutzerklärung
          </Link>
          .
        </p>

        <div className="flex shrink-0 flex-row gap-2">
          {/* Ablehnen = nur notwendige – gleich auffällig wie Zustimmen */}
          <button
            type="button"
            onClick={() => accept("necessary")}
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            Nur notwendige
          </button>
          <button
            type="button"
            onClick={() => accept("all")}
            className="inline-flex items-center justify-center rounded-xl bg-[#2D6A4F] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#245640] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            Alle akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
}
