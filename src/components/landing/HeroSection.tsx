"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, Users, BadgeCheck } from "lucide-react";
import { LEGAL, legalMailto } from "@/config/legal";

const TRUST_PILLS = [
  { icon: Clock3, label: "Erste Planung in Minuten" },
  { icon: Users, label: "Weniger Abstimmungsaufwand" },
  { icon: BadgeCheck, label: "DSGVO-orientierte Prozesse" },
] as const;

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!containerRef.current || !spotlightRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const radius = Math.min(rect.width * 0.6, 700);
    spotlightRef.current.style.background = `radial-gradient(${radius}px circle at ${x}px ${y}px, rgba(46,111,143,0.22), transparent 65%)`;
  }

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative isolate flex min-h-[88vh] items-center overflow-hidden bg-surface-dark"
    >
      {/* Dot grid */}
      <div aria-hidden className="absolute inset-0 -z-30 hero-dot-grid" />

      {/* Cursor spotlight overlay */}
      <div
        ref={spotlightRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 transition-none"
        style={{
          background:
            "radial-gradient(600px circle at 50% 40%, rgba(46,111,143,0.15), transparent 65%)",
        }}
      />

      {/* Ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[250px] -top-[200px] -z-20 h-[750px] w-[750px] rounded-full bg-primary/12 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[250px] -left-[150px] -z-20 h-[600px] w-[600px] rounded-full bg-secondary/8 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-28 text-center sm:px-6 sm:py-36 lg:px-8">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary-300 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-3 duration-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-300" />
          KI-gestützte Ernährungsplanung für therapeutische Einrichtungen
        </div>

        <h1 className="text-5xl font-extrabold tracking-[-0.03em] text-white sm:text-6xl lg:text-[80px] lg:leading-[0.98]">
          Ernährungsplanung
          <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-primary-300 to-primary bg-clip-text text-transparent">
            {" "}klar, schnell,{" "}
          </span>
          nachvollziehbar
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl">
          mein-nutrikompass.de unterstützt Teams in der Betreuung von Menschen
          mit Essstörungen. Die KI erstellt Vorschläge — die fachliche
          Entscheidung bleibt bei Ihrem Team.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-sm font-semibold text-surface-dark shadow-2xl shadow-white/10 transition-all hover:bg-white/90 hover:shadow-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark"
          >
            14 Tage kostenlos testen
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href={legalMailto(LEGAL.mailSubjects.demoRequest)}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white/80 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark"
          >
            Demo anfordern
          </a>
        </div>

        <p className="mt-5 text-xs text-white/25">
          Kein Heilversprechen. Kein Ersatz für ärztliche Diagnose oder
          Behandlung.
        </p>

        {/* Trust pills */}
        <div className="mx-auto mt-14 flex max-w-2xl flex-wrap items-center justify-center gap-3">
          {TRUST_PILLS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/65 backdrop-blur-sm"
            >
              <Icon className="h-3.5 w-3.5 text-primary-300" />
              {label}
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div aria-hidden className="mt-12 flex flex-col items-center animate-bounce opacity-35">
          <div className="flex h-8 w-5 items-start justify-center rounded-full border border-white/20 pt-1.5">
            <div className="h-1.5 w-1 rounded-full bg-white/60" />
          </div>
        </div>
      </div>
    </section>
  );
}
