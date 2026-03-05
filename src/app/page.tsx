import Link from "next/link";
import { LogoIcon } from "@/components/ui/LogoIcon";
import { LandingShowcase } from "@/components/landing/LandingShowcase";
import { HeroSection } from "@/components/landing/HeroSection";
import { MobileNav } from "@/components/landing/MobileNav";
import { LEGAL, legalMailto } from "@/config/legal";
import {
  Sparkles,
  ShoppingCart,
  FileDown,
  Shield,
  Check,
  Bot,
  Lock,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

const MEAL_PREVIEWS = [
  "Montag: Linsencurry mit Reis — 690 kcal",
  "Dienstag: Vollkorn-Wraps mit Hummus — 520 kcal",
  "Mittwoch: Gemüsepfanne mit Quinoa — 580 kcal",
] as const;

export default function LandingPage() {
  const faqs = [
    {
      question: "Ersetzt mein-nutrikompass.de medizinische Entscheidungen?",
      answer:
        "Nein. mein-nutrikompass.de unterstützt die Planung. Die fachliche Verantwortung bleibt bei Ihrem Team.",
    },
    {
      question: "Verarbeitet mein-nutrikompass.de Gesundheitsdaten?",
      answer:
        "Je nach Nutzung können Gesundheitsdaten verarbeitet werden. Dafür gelten erhöhte Schutzanforderungen.",
    },
    {
      question: "Wo werden Daten gespeichert?",
      answer:
        "Details zu Hosting, Unterauftragsverarbeitung und Speicherfristen finden Sie in den Datenschutzhinweisen.",
    },
    {
      question: "Wie funktioniert die Testphase?",
      answer:
        "Sie können 14 Tage unverbindlich testen. In der Testphase sind aktuell bis zu 3 aktive Patientinnen und Patienten sowie 10 Pläne pro Monat enthalten.",
    },
    {
      question: "Wie kündige ich einen bezahlten Plan?",
      answer:
        "Die Kündigung ist zum Ende des Abrechnungszeitraums möglich. Bedingungen stehen vor dem Abschluss klar in der Bestellstrecke.",
    },
    {
      question: "Gibt es einen AV-Vertrag?",
      answer:
        "Ja. Informationen zur Auftragsverarbeitung erhalten Sie über den Support und in den Vertragsunterlagen.",
    },
  ];

  const testimonials = [
    "Die Wochenplanung hat uns früher viel Zeit gekostet und war oft abhängig von einzelnen Mitarbeitenden. Mit Nutrikompass erstellen wir strukturierte, anpassbare Essenspläne in deutlich kürzerer Zeit. Das gibt uns im Alltag spürbar mehr Ruhe und Verlässlichkeit.",
    "Besonders hilfreich ist für uns die automatisch generierte Einkaufsliste. Wir sparen nicht nur Planungszeit, sondern vermeiden auch Missverständnisse im Team. Die Vorschläge der KI sind eine gute Grundlage, die wir fachlich individuell anpassen.",
    "Nutrikompass bringt Struktur in einen sensiblen Bereich unserer Arbeit. Wir behalten den Überblick über mehrere Patientinnen gleichzeitig und können die Pläne flexibel bearbeiten. Das entlastet unser Team organisatorisch, ohne unsere therapeutische Verantwortung zu ersetzen.",
  ] as const;

  return (
    <div className="min-h-screen overflow-x-hidden bg-white pb-20 text-surface-dark md:pb-0">
      {/* Skip link (a11y) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:left-4 focus:top-4 focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-surface-dark focus:shadow-lg focus:outline-none"
      >
        Zum Hauptinhalt springen
      </a>

      {/* Announcement bar */}
      <div className="bg-surface-dark text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-1 px-4 py-2 text-center text-xs sm:px-6 lg:px-8">
          <span className="text-white/75">DSGVO-orientierte Prozesse</span>
          <span className="hidden text-white/25 sm:inline">&bull;</span>
          <span className="text-white/75">Pseudonymisierte Patientenprofile</span>
          <span className="hidden text-white/25 sm:inline">&bull;</span>
          <span className="text-white/75">Transparente Preise</span>
        </div>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-gray-100/80 bg-white/80 backdrop-blur-md">
        <nav className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <LogoIcon className="h-8 w-8" />
            <span className="whitespace-nowrap text-sm font-bold text-surface-dark sm:text-base">
              mein-nutrikompass.de
            </span>
          </Link>

          <div className="hidden items-center gap-7 text-sm font-medium text-gray-500 md:flex">
            <a href="#problem" className="transition-colors hover:text-surface-dark">Problem</a>
            <a href="#loesung" className="transition-colors hover:text-surface-dark">Lösung</a>
            <a href="#sicherheit" className="transition-colors hover:text-surface-dark">Sicherheit</a>
            <a href="#preise" className="transition-colors hover:text-surface-dark">Preise</a>
            <a href="#faq" className="transition-colors hover:text-surface-dark">FAQ</a>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden items-center rounded-xl px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 md:inline-flex"
            >
              Anmelden
            </Link>
            <Link
              href="/register"
              className="hidden items-center rounded-xl bg-surface-dark px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 md:inline-flex"
            >
              14 Tage testen
            </Link>
            <MobileNav />
          </div>
        </nav>
      </header>

      {/* Hero with cursor spotlight */}
      <HeroSection />

      {/* Problem */}
      <section id="main-content" aria-labelledby="problem-heading" className="scroll-mt-16 bg-surface-light py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Das Problem
            </p>
            <h2
              id="problem-heading"
              className="mt-3 text-4xl font-bold tracking-[-0.02em] sm:text-5xl"
            >
              Wenn Planung Zeit frisst, leidet die Versorgung
            </h2>
            <p className="mt-4 text-gray-500">
              Im Alltag fehlen oft Zeit und einheitliche Abläufe. Das führt zu
              Unsicherheit bei Vertretung und vermeidbarer Mehrarbeit.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                n: "01",
                title: "Abstimmungsaufwand",
                desc: "Hoher Abstimmungsaufwand zwischen Fachkräften und Schichten",
              },
              {
                n: "02",
                title: "Medienbrüche",
                desc: "Medienbrüche zwischen Planung, Einkauf und Dokumentation",
              },
              {
                n: "03",
                title: "Qualitätsschwankungen",
                desc: "Uneinheitliche Qualität bei Vertretungssituationen",
              },
            ].map(({ n, title, desc }) => (
              <div
                key={n}
                className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 sm:p-10 transition-shadow hover:shadow-md"
              >
                <div className="absolute left-0 top-6 bottom-6 w-[3px] rounded-full bg-primary/20" />
                <span className="pointer-events-none absolute bottom-3 right-4 select-none text-7xl font-extrabold leading-none text-gray-200">
                  {n}
                </span>
                <p className="text-base font-bold text-surface-dark">{title}</p>
                <p className="mt-2 text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution — Bento grid */}
      <section id="loesung" className="scroll-mt-16 bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Die Lösung
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-[-0.02em] sm:text-5xl">
              Ein klarer Ablauf von Bedarf bis Einkauf
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-500">
              mein-nutrikompass.de verbindet strukturierte Datenerfassung,
              KI-Vorschlag und fachliche Freigabe in einem Prozess.
            </p>
          </div>

          {/* Bento */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {/* KI-Vorschläge — large dark card */}
            <div className="relative col-span-1 min-h-[420px] overflow-hidden rounded-3xl bg-gradient-to-br from-surface-dark to-surface-mid p-8 text-white transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 sm:col-span-2 lg:col-span-2">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                <Sparkles className="h-6 w-6 text-primary-300" />
              </div>
              <h3 className="text-xl font-bold">KI-Vorschläge</h3>
              <p className="mt-2 max-w-sm text-sm text-white/65">
                Vorschläge für 1- bis 14-Tage-Pläne auf Basis Ihrer Eingaben.
                Automatisch angepasst an individuelle Präferenzen und
                Einschränkungen.
              </p>
              {/* Window chrome mockup */}
              <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 border-b border-white/8 px-3 py-2.5">
                  <span className="h-2 w-2 rounded-full bg-white/15" />
                  <span className="h-2 w-2 rounded-full bg-white/15" />
                  <span className="h-2 w-2 rounded-full bg-white/15" />
                  <span className="ml-2 text-[10px] text-white/30">KI-Planvorschlag</span>
                </div>
                <div className="divide-y divide-white/5">
                  {MEAL_PREVIEWS.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 px-3 py-2.5 text-xs text-white/65"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-300" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              {/* ambient glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/25 blur-3xl"
              />
            </div>

            {/* Einkaufslisten */}
            <div className="rounded-3xl border border-gray-100 bg-primary-50 p-8 transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-200/80">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-surface-dark">Einkaufslisten</h3>
              <p className="mt-2 text-sm text-gray-500">
                Automatisch aus freigegebenen Plänen, sortiert nach Kategorien.
              </p>
              <div className="mt-5 space-y-2">
                {[
                  { cat: "Gemüse", items: "Karotten, Brokkoli, Zucchini" },
                  { cat: "Hülsenfrüchte", items: "Rote Linsen, Kichererbsen" },
                  { cat: "Körner", items: "Basmatireis, Quinoa" },
                ].map(({ cat, items }) => (
                  <div
                    key={cat}
                    className="rounded-xl border border-primary-100/60 bg-white px-3 py-2.5"
                  >
                    <p className="text-xs font-semibold text-primary">{cat}</p>
                    <p className="text-xs text-gray-500">{items}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* PDF-Export */}
            <div className="rounded-3xl border border-gray-100 bg-white p-8 transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-200/80">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <FileDown className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-surface-dark">PDF-Export</h3>
              <p className="mt-2 text-sm text-gray-500">
                Pläne und Listen druckbar oder digital teilbar.
              </p>
              <div className="mt-5 rounded-2xl border border-gray-100 bg-surface-light p-5">
                <div className="mb-2.5 h-2 w-3/4 rounded-full bg-gray-200" />
                <div className="mb-2.5 h-2 w-1/2 rounded-full bg-gray-200" />
                <div className="mb-4 h-2 w-2/3 rounded-full bg-gray-200" />
                <div className="flex items-center gap-2 rounded-xl bg-primary/8 px-3 py-2">
                  <FileDown className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-primary">
                    Ernährungsplan_KW12.pdf
                  </span>
                </div>
              </div>
            </div>

            {/* Sicherheitsfokus — large teal card */}
            <div className="relative col-span-1 overflow-hidden rounded-3xl border border-primary-100/50 bg-primary-50 p-8 transition-transform duration-300 hover:-translate-y-1 sm:col-span-2 lg:col-span-2">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-surface-dark">Sicherheitsfokus</h3>
              <p className="mt-2 max-w-sm text-sm text-gray-500">
                Rollen, Zugriffskontrolle und dokumentierte Prozesse für den
                Datenschutz.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {[
                  "Rollenkonzept",
                  "AVV verfügbar",
                  "Pseudonymisierung",
                  "Audit-Log",
                  "Zugriffsschutz",
                  "DSGVO-orientiert",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs font-medium text-primary"
                  >
                    <Check className="h-3.5 w-3.5 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product showcase */}
      <LandingShowcase />

      {/* Stats */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 divide-y divide-gray-100 rounded-3xl border border-gray-100 bg-surface-light sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              { value: "3", label: "Stufen im Planmodell", sub: "Test · Basis · Professional" },
              { value: "1–14", label: "Tage pro Plan", sub: "Flexibler Planungszeitraum" },
              { value: "3 / 10", label: "Test-Limits", sub: "Aktive Patienten / Pläne pro Monat" },
            ].map(({ value, label, sub }) => (
              <div key={label} className="px-6 py-10 text-center sm:px-10">
                <p className="text-5xl font-extrabold tracking-tight text-primary sm:text-6xl">
                  {value}
                </p>
                <p className="mt-2 text-sm font-semibold text-surface-dark">{label}</p>
                <p className="mt-1 text-xs text-gray-400">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="funktionsweise" className="scroll-mt-16 bg-surface-light py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Einstieg
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-[-0.02em] sm:text-5xl">
              In drei Schritten startklar
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                step: 1,
                title: "Konto erstellen",
                desc: "Teamzugang anlegen und relevante Profilangaben strukturiert erfassen.",
              },
              {
                step: 2,
                title: "Vorschlag prüfen",
                desc: "KI-Vorschläge fachlich kontrollieren und bei Bedarf anpassen.",
              },
              {
                step: 3,
                title: "Freigeben und exportieren",
                desc: "Einkaufsliste erzeugen, PDF exportieren und Team informieren.",
              },
            ].map(({ step, title, desc }) => (
              <div
                key={step}
                className="rounded-2xl border border-gray-200 bg-white p-8 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-surface-dark text-xs font-bold text-white">
                  {step}
                </div>
                <p className="text-base font-bold text-surface-dark">{title}</p>
                <p className="mt-2 text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="sicherheit" className="scroll-mt-16 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Vertrauen
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-[-0.02em] sm:text-5xl">
              Sicherheit und Datenschutz als Produktbestandteil
            </h2>
            <p className="mt-4 text-gray-500">
              Transparenz steht vor Marketing. Sie sehen klar, wie Daten
              verarbeitet und wie KI-Ausgaben einzuordnen sind.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {[
              {
                icon: Lock,
                title: "Datenschutz und Sicherheit",
                items: [
                  "Rollen- und Rechtekonzept für kontrollierten Zugriff",
                  "AVV (Auftragsverarbeitungsvertrag) auf Anfrage verfügbar",
                  "Hinweise zu Speicherfristen und Ansprechpartnern",
                ],
              },
              {
                icon: Bot,
                title: "Transparenz zu KI-Funktionen",
                items: [
                  "KI erstellt Vorschläge, keine automatischen Therapieentscheidungen",
                  "Fachliche Prüfung vor Nutzung ist verpflichtend",
                  "Kein Heilversprechen, kein Ersatz für medizinische Betreuung",
                ],
              },
            ].map(({ icon: Icon, title, items }) => (
              <div key={title} className="relative overflow-hidden rounded-2xl border border-gray-100 bg-surface-light p-8">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-300/40 to-transparent" />
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-base font-bold text-surface-dark">{title}</p>
                <ul className="mt-5 space-y-3.5">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="preise" className="scroll-mt-16 bg-surface-light py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Preise
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-[-0.02em] sm:text-5xl">
              Transparente Preise
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-500">
              Starten Sie kostenlos und wählen Sie später den Plan, der zu Ihrer
              Einrichtung passt.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3 md:items-start">
            {/* Free trial */}
            <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Einstieg</p>
              <h3 className="mt-1 text-lg font-bold text-surface-dark">Testphase</h3>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold text-surface-dark">Kostenlos</span>
              </div>
              <p className="mt-1.5 text-sm text-gray-400">14 Tage, unverbindlich</p>
              <ul className="mt-8 flex-1 space-y-3">
                {[
                  "KI-Vorschläge, Einkaufslisten und PDF-Export",
                  "Maximal 3 Bewohnerinnen und Bewohner",
                  "10 Pläne pro Monat",
                  "E-Mail-Support",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-8 inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-surface-dark transition-colors hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2"
              >
                Test starten
              </Link>
            </div>

            {/* Basis */}
            <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Kleinsteinrichtungen</p>
              <h3 className="mt-1 text-lg font-bold text-surface-dark">Basis</h3>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold text-surface-dark">29</span>
                <span className="text-lg font-semibold text-gray-400">EUR</span>
                <span className="text-sm text-gray-400">/Mo.</span>
              </div>
              <p className="mt-1.5 text-sm text-gray-400">Für kleinere Einrichtungen</p>
              <ul className="mt-8 flex-1 space-y-3">
                {[
                  "Bis 15 Bewohnerinnen und Bewohner",
                  "50 Pläne pro Monat",
                  "E-Mail-Support",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register?plan=basic"
                className="mt-8 inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-surface-dark transition-colors hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2"
              >
                Basis wählen
              </Link>
            </div>

            {/* Professional — highlighted */}
            <div className="relative flex flex-col rounded-2xl bg-surface-dark p-8 text-white shadow-2xl shadow-surface-dark/20 md:scale-105">
              <div className="absolute -top-3.5 right-6 rounded-full bg-primary-300 px-3 py-1 text-xs font-bold text-surface-dark">
                Beliebt
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Wachsende Einrichtungen</p>
              <h3 className="mt-1 text-lg font-bold">Professional</h3>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold">59</span>
                <span className="text-lg font-semibold text-white/50">EUR</span>
                <span className="text-sm text-white/50">/Mo.</span>
              </div>
              <p className="mt-1.5 text-sm text-white/50">Für wachsende Einrichtungen</p>
              <ul className="mt-8 flex-1 space-y-3">
                {[
                  "Unbegrenzt Bewohnerinnen und Bewohner",
                  "Unbegrenzt Pläne",
                  "Prioritäts-Support",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-white/65">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-300" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register?plan=professional"
                className="mt-8 inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-surface-dark transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark"
              >
                Professional wählen
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-gray-100 bg-white p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700">Zahlungs- und Vertragsinformationen</p>
            <ul className="mt-3 space-y-1.5 text-xs">
              <li>Abrechnung monatlich. Preise als Endpreise; {LEGAL.commercial.vatNotice}</li>
              <li>Mindestlaufzeit, Kündigungsfrist und Verlängerung werden vor Abschluss transparent angezeigt.</li>
              <li>Zahlungsabwicklung erfolgt im Checkout über Stripe.</li>
              <li>
                Rechtliche Details:{" "}
                <Link href="/agb" className="underline underline-offset-2 hover:text-primary">AGB</Link>{" "}
                und{" "}
                <Link href="/datenschutz" className="underline underline-offset-2 hover:text-primary">Datenschutz</Link>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-16 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Häufige Fragen
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-[-0.02em] sm:text-5xl">FAQ</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-gray-100 bg-surface-light px-6 py-5 transition-colors open:border-gray-200 open:bg-white"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-surface-dark">
                  <span>{item.question}</span>
                  <ChevronDown
                    aria-hidden
                    className="h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180"
                  />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section aria-labelledby="testimonials-heading" className="overflow-hidden bg-surface-light py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Vertrauen im Alltag
            </p>
            <h2
              id="testimonials-heading"
              className="mt-3 text-4xl font-bold tracking-[-0.02em] sm:text-5xl"
            >
              Erfahrungen aus der Praxis
            </h2>
            <p className="mt-4 text-sm text-gray-500 sm:text-base">
              Stimmen aus Einrichtungen, die Nutrikompass als organisatorische
              Unterstützung im Planungsalltag nutzen.
            </p>
          </div>

          <div className="mt-12 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-1 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
            {testimonials.map((quote, i) => (
              <figure
                key={i}
                className="flex h-full w-[88%] shrink-0 snap-start flex-col rounded-3xl border border-gray-100 bg-white p-8 shadow-sm sm:w-auto sm:shrink"
              >
                <div className="mb-3 select-none font-serif text-5xl font-bold leading-none text-primary/15">
                  &ldquo;
                </div>
                <blockquote className="flex-1 text-sm leading-7 text-gray-600">
                  {quote}
                </blockquote>
                <figcaption className="mt-5 border-t border-gray-100 pt-4 text-xs text-gray-400">
                  Therapeutische Einrichtung, Deutschland
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA — dark */}
      <section className="relative overflow-hidden bg-surface-dark py-20 sm:py-24">
        {/* Subtle radial gradient accent */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,_rgba(46,111,143,0.15),_transparent)]"
        />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-300">
            Jetzt starten
          </p>
          <h2 className="mt-4 text-4xl font-bold tracking-[-0.02em] text-white sm:text-5xl">
            Bereit für strukturierte Ernährungsplanung?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            Starten Sie direkt mit dem Test oder fordern Sie eine kurze Demo an
            — wir zeigen Ihnen, wie mein-nutrikompass.de in Ihren Alltag passt.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-sm font-semibold text-surface-dark shadow-2xl transition-all hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark"
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
            Kein Verkaufsdruck. Antwort in der Regel innerhalb von 1 Werktag.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <LogoIcon className="h-7 w-7" />
              <span className="whitespace-nowrap text-sm font-bold text-surface-dark">
                mein-nutrikompass.de
              </span>
            </Link>
            <div className="flex items-center gap-6 text-xs text-gray-400">
              <Link href="/impressum" className="transition-colors hover:text-gray-700">Impressum</Link>
              <Link href="/datenschutz" className="transition-colors hover:text-gray-700">Datenschutz</Link>
              <Link href="/agb" className="transition-colors hover:text-gray-700">AGB</Link>
              <Link href="/avv" className="transition-colors hover:text-gray-700">AVV</Link>
            </div>
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} mein-nutrikompass.de
            </p>
          </div>
          <p className="mt-6 text-center text-xs text-gray-300">
            Dieses Tool dient ausschließlich der organisatorischen Planung. Es
            stellt keine Medizinproduktesoftware im Sinne der MDR (EU&nbsp;2017/745)
            dar und trifft keine eigenständigen therapeutischen Entscheidungen.
          </p>
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 p-3 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 shrink-0"
          >
            Anmelden
          </Link>
          <Link
            href="/register"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-surface-dark px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-surface-hover"
          >
            14 Tage testen
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
