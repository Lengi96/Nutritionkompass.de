"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "#features", label: "Funktionen" },
  { href: "#workflow", label: "Workflow" },
  { href: "#pricing", label: "Preise" },
  { href: "#trust", label: "Sicherheit" },
] as const;

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Menue schliessen" : "Menue oeffnen"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center justify-center rounded-xl p-2 text-slate-500 transition-colors hover:bg-primary/10 hover:text-primary md:hidden"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-40 border-b border-primary/10 bg-white/95 shadow-lg backdrop-blur-md md:hidden">
          <nav className="mx-auto max-w-7xl px-4 py-3">
            <ul className="space-y-1">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <a
                    href={href}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    {label}
                  </a>
                </li>
              ))}
              <li className="border-t border-primary/10 pt-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="mt-2 block rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                >
                  Kostenlos testen
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
