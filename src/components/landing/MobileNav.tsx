"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "#problem", label: "Problem" },
  { href: "#loesung", label: "Lösung" },
  { href: "#sicherheit", label: "Sicherheit" },
  { href: "#preise", label: "Preise" },
  { href: "#faq", label: "FAQ" },
] as const;

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Menü schließen" : "Menü öffnen"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 md:hidden"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-40 border-b border-gray-100 bg-white/95 shadow-lg backdrop-blur-md md:hidden">
          <nav className="mx-auto max-w-7xl px-4 py-3">
            <ul className="space-y-1">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <a
                    href={href}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                  >
                    {label}
                  </a>
                </li>
              ))}
              <li className="border-t border-gray-100 pt-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  Anmelden
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
