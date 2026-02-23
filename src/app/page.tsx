import Link from "next/link";
import { LandingShowcase } from "@/components/landing/LandingShowcase";
import {
  Compass,
  Sparkles,
  ShoppingCart,
  FileDown,
  Shield,
  Check,
  Clock3,
  Users,
  Bot,
  Lock,
  BadgeCheck,
  ArrowRight,
} from "lucide-react";

export default function LandingPage() {
  const faqs = [
    {
      question: "Ersetzt NutriKompass medizinische Entscheidungen?",
      answer:
        "Nein. NutriKompass unterstuetzt die Planung. Die fachliche Verantwortung bleibt bei Ihrem Team.",
    },
    {
      question: "Verarbeitet NutriKompass Gesundheitsdaten?",
      answer:
        "Je nach Nutzung koennen Gesundheitsdaten verarbeitet werden. Dafuer gelten erhoehte Schutzanforderungen.",
    },
    {
      question: "Wo werden Daten gespeichert?",
      answer:
        "Details zu Hosting, Unterauftragsverarbeitung und Speicherfristen finden Sie in den Datenschutzhinweisen.",
    },
    {
      question: "Wie funktioniert die Testphase?",
      answer:
        "Sie koennen 14 Tage unverbindlich testen. In der Testphase sind aktuell bis zu 3 aktive Patientinnen und Patienten sowie 10 Plaene pro Monat enthalten.",
    },
    {
      question: "Wie kuendige ich einen bezahlten Plan?",
      answer:
        "Die Kuendigung ist zum Ende des Abrechnungszeitraums moeglich. Bedingungen stehen vor dem Abschluss klar in der Bestellstrecke.",
    },
    {
      question: "Gibt es einen AV-Vertrag?",
      answer:
        "Ja. Informationen zur Auftragsverarbeitung erhalten Sie ueber den Support und in den Vertragsunterlagen.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20 text-[#1A1A2E] md:pb-0">
      <div className="bg-[#1A1A2E] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-1 px-4 py-2 text-center text-xs sm:px-6 lg:px-8">
          <span>DSGVO-orientierte Prozesse</span>
          <span className="hidden sm:inline">&bull;</span>
          <span>Pseudonymisierte Patientenprofile</span>
          <span className="hidden sm:inline">&bull;</span>
          <span>Transparente Preise</span>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Compass className="h-7 w-7 text-[#2D6A4F]" />
            <span className="text-xl font-bold text-[#2D6A4F]">NutriKompass</span>
          </Link>

          <div className="hidden items-center gap-6 text-sm font-medium md:flex">
            <a href="#problem" className="transition-colors hover:text-[#2D6A4F]">
              Problem
            </a>
            <a href="#loesung" className="transition-colors hover:text-[#2D6A4F]">
              Loesung
            </a>
            <a href="#sicherheit" className="transition-colors hover:text-[#2D6A4F]">
              Sicherheit
            </a>
            <a href="#preise" className="transition-colors hover:text-[#2D6A4F]">
              Preise
            </a>
            <a href="#faq" className="transition-colors hover:text-[#2D6A4F]">
              FAQ
            </a>
            <Link href="/impressum" className="transition-colors hover:text-[#2D6A4F]">
              Impressum
            </Link>
            <Link href="/datenschutz" className="transition-colors hover:text-[#2D6A4F]">
              Datenschutz
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden items-center rounded-xl px-4 py-2 text-sm font-medium text-[#2D6A4F] transition-colors hover:bg-[#2D6A4F]/5 sm:inline-flex"
            >
              Anmelden
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center rounded-xl bg-[#2D6A4F] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#245640]"
            >
              14 Tage testen
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Ernaehrungsplanung fuer Einrichtungen{" "}
            <span className="text-[#2D6A4F]">klar, schnell, nachvollziehbar</span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-gray-600 sm:text-xl">
            NutriKompass unterstuetzt Teams in der Betreuung von Jugendlichen mit
            Essstoerungen. Die KI erstellt Vorschlaege, die fachliche Entscheidung
            bleibt bei Ihrem Team.
          </p>
          <ul className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
            <li className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
              <Clock3 className="mb-2 h-5 w-5 text-[#2D6A4F]" />
              Erste nutzbare Planung in wenigen Minuten
            </li>
            <li className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
              <Users className="mb-2 h-5 w-5 text-[#2D6A4F]" />
              Weniger Abstimmungsaufwand im Team
            </li>
            <li className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
              <BadgeCheck className="mb-2 h-5 w-5 text-[#2D6A4F]" />
              Transparente Prozesse fuer Vertretung
            </li>
          </ul>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center rounded-xl bg-[#2D6A4F] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#2D6A4F]/20 transition-colors hover:bg-[#245640]"
            >
              14 Tage unverbindlich testen
            </Link>
            <a
              href="#loesung"
              className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-base font-semibold text-[#2D6A4F] transition-colors hover:bg-gray-50"
            >
              So funktioniert es
            </a>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Kein Heilversprechen. Kein Ersatz fuer aerztliche Diagnose oder Behandlung.
          </p>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#74C69D]/20 blur-3xl"
        />
      </section>

      <section id="problem" className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Wenn Planung Zeit frisst, leidet die Versorgung
            </h2>
            <p className="mt-4 text-gray-600">
              Im Alltag fehlen oft Zeit und einheitliche Ablaeufe. Das fuehrt zu
              Unsicherheit bei Vertretung und vermeidbarer Mehrarbeit.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm">
              Hoher Abstimmungsaufwand zwischen Fachkraeften und Schichten
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm">
              Medienbrueche zwischen Planung, Einkauf und Dokumentation
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm">
              Uneinheitliche Qualitaet bei Vertretungssituationen
            </div>
          </div>
        </div>
      </section>

      <section id="loesung" className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Ein klarer Ablauf von Bedarf bis Einkauf
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-600">
              NutriKompass verbindet strukturierte Datenerfassung, KI-Vorschlag
              und fachliche Freigabe in einem Prozess.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2D6A4F]/10">
                <Sparkles className="h-6 w-6 text-[#2D6A4F]" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">KI-Vorschlaege</h3>
              <p className="text-sm text-gray-600">
                Vorschlaege fuer 1- bis 14-Tage-Plaene auf Basis Ihrer Eingaben.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2D6A4F]/10">
                <ShoppingCart className="h-6 w-6 text-[#2D6A4F]" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Einkaufslisten</h3>
              <p className="text-sm text-gray-600">
                Automatisch aus freigegebenen Plaenen, sortiert nach Kategorien.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2D6A4F]/10">
                <FileDown className="h-6 w-6 text-[#2D6A4F]" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">PDF-Export</h3>
              <p className="text-sm text-gray-600">
                Plaene und Listen druckbar oder digital teilbar.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2D6A4F]/10">
                <Shield className="h-6 w-6 text-[#2D6A4F]" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Sicherheitsfokus</h3>
              <p className="text-sm text-gray-600">
                Rollen, Zugriffskontrolle und dokumentierte Prozesse fuer den
                Datenschutz.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <a
              href="#funktionsweise"
              className="inline-flex items-center gap-2 rounded-xl border border-[#2D6A4F] bg-[#2D6A4F] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#245640]"
            >
              Prozess ansehen <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <LandingShowcase />

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Warum Teams NutriKompass einsetzen
            </h2>
            <p className="mt-4 text-gray-600">
              Klare Produktgrenzen und nachvollziehbare Prozesse helfen bei einer
              verlaesslichen Zusammenarbeit im Alltag.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
              <p className="text-3xl font-extrabold text-[#2D6A4F]">3</p>
              <p className="mt-1 text-sm text-gray-600">
                Stufen im Planmodell (Test, Basis, Professional)
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
              <p className="text-3xl font-extrabold text-[#2D6A4F]">1-14</p>
              <p className="mt-1 text-sm text-gray-600">
                Tage pro Plan als flexibler Planungszeitraum
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
              <p className="text-3xl font-extrabold text-[#2D6A4F]">3 / 10</p>
              <p className="mt-1 text-sm text-gray-600">
                Test-Limits: aktive Patienten / Plaene pro Monat
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="funktionsweise" className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">In drei Schritten startklar</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#2D6A4F]">
                Schritt 1
              </p>
              <p className="mt-2 text-base font-semibold">Konto erstellen</p>
              <p className="mt-2 text-sm text-gray-600">
                Teamzugang anlegen und relevante Profilangaben strukturiert erfassen.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#2D6A4F]">
                Schritt 2
              </p>
              <p className="mt-2 text-base font-semibold">Vorschlag pruefen</p>
              <p className="mt-2 text-sm text-gray-600">
                KI-Vorschlaege fachlich kontrollieren und bei Bedarf anpassen.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#2D6A4F]">
                Schritt 3
              </p>
              <p className="mt-2 text-base font-semibold">Freigeben und exportieren</p>
              <p className="mt-2 text-sm text-gray-600">
                Einkaufsliste erzeugen, PDF exportieren und Team informieren.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="sicherheit" className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Sicherheit und Datenschutz als Produktbestandteil
            </h2>
            <p className="mt-4 text-gray-600">
              Transparenz steht vor Marketing. Sie sehen klar, wie Daten verarbeitet
              und wie KI-Ausgaben einzuordnen sind.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <p className="mb-4 flex items-center gap-2 text-base font-semibold">
                <Lock className="h-5 w-5 text-[#2D6A4F]" />
                Datenschutz und Sicherheit
              </p>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#2D6A4F]" />
                  Rollen- und Rechtekonzept fuer kontrollierten Zugriff
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#2D6A4F]" />
                  Dokumentierte Prozesse zur Auftragsverarbeitung
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#2D6A4F]" />
                  Hinweise zu Speicherfristen und Ansprechpartnern
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <p className="mb-4 flex items-center gap-2 text-base font-semibold">
                <Bot className="h-5 w-5 text-[#2D6A4F]" />
                Transparenz zu KI-Funktionen
              </p>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#2D6A4F]" />
                  KI erstellt Vorschlaege, keine automatischen Therapieentscheidungen
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#2D6A4F]" />
                  Fachliche Pruefung vor Nutzung ist verpflichtend
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#2D6A4F]" />
                  Kein Heilversprechen, kein Ersatz fuer medizinische Betreuung
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="preise" className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Transparente Preise</h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-600">
              Starten Sie kostenlos und waehlen Sie spaeter den Plan, der zu Ihrer
              Einrichtung passt.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            <div className="relative flex flex-col rounded-xl border border-gray-200 bg-[#F8F9FA] p-8">
              <h3 className="text-lg font-semibold">Testphase</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">Kostenlos</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">14 Tage, unverbindlich</p>
              <ul className="mt-8 flex-1 space-y-3">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#2D6A4F]" />
                  KI-Vorschlaege, Einkaufslisten und PDF-Export
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#2D6A4F]" />
                  Maximal 3 Bewohnerinnen und Bewohner
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#2D6A4F]" />
                  10 Plaene pro Monat
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#2D6A4F]" />
                  E-Mail-Support
                </li>
              </ul>
              <Link
                href="/register"
                className="mt-8 inline-flex items-center justify-center rounded-xl border border-[#2D6A4F] bg-white px-6 py-3 text-sm font-semibold text-[#2D6A4F] transition-colors hover:bg-[#2D6A4F]/5"
              >
                Test starten
              </Link>
            </div>

            <div className="relative flex flex-col rounded-xl border border-gray-200 bg-[#F8F9FA] p-8">
              <h3 className="text-lg font-semibold">Basis</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">29 EUR</span>
                <span className="text-sm text-gray-500">/Monat</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">Fuer kleinere Einrichtungen</p>
              <ul className="mt-8 flex-1 space-y-3">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#2D6A4F]" />
                  Bis 15 Bewohnerinnen und Bewohner
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#2D6A4F]" />
                  50 Plaene pro Monat
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#2D6A4F]" />
                  E-Mail-Support
                </li>
              </ul>
              <Link
                href="/register?plan=basic"
                className="mt-8 inline-flex items-center justify-center rounded-xl border border-[#2D6A4F] bg-white px-6 py-3 text-sm font-semibold text-[#2D6A4F] transition-colors hover:bg-[#2D6A4F]/5"
              >
                Basis waehlen
              </Link>
            </div>

            <div className="relative flex flex-col rounded-xl border-2 border-[#2D6A4F] bg-[#2D6A4F] p-8 text-white shadow-xl">
              <div className="absolute -top-3 right-6 rounded-full bg-[#74C69D] px-3 py-1 text-xs font-bold text-[#1A1A2E]">
                Beliebt
              </div>
              <h3 className="text-lg font-semibold">Professional</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">59 EUR</span>
                <span className="text-sm text-white/70">/Monat</span>
              </div>
              <p className="mt-2 text-sm text-white/80">Fuer wachsende Einrichtungen</p>
              <ul className="mt-8 flex-1 space-y-3">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#74C69D]" />
                  Unbegrenzt Bewohnerinnen und Bewohner
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#74C69D]" />
                  Unbegrenzt Plaene
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#74C69D]" />
                  Prioritaets-Support
                </li>
              </ul>
              <Link
                href="/register?plan=professional"
                className="mt-8 inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#2D6A4F] transition-colors hover:bg-gray-100"
              >
                Professional waehlen
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-4xl rounded-xl border border-gray-200 bg-[#F8F9FA] p-5 text-sm text-gray-700">
            <p className="font-semibold">Zahlungs- und Vertragsinformationen</p>
            <ul className="mt-3 space-y-2">
              <li>Abrechnung monatlich. Alle Preise zzgl. gesetzlicher USt, sofern anwendbar.</li>
              <li>Mindestlaufzeit, Kuendigungsfrist und Verlaengerung werden vor Abschluss transparent angezeigt.</li>
              <li>Zahlungsabwicklung erfolgt im Checkout ueber Stripe.</li>
              <li>
                Rechtliche Details:{" "}
                <Link href="/agb" className="underline underline-offset-2 hover:text-[#2D6A4F]">
                  AGB
                </Link>{" "}
                und{" "}
                <Link
                  href="/datenschutz"
                  className="underline underline-offset-2 hover:text-[#2D6A4F]"
                >
                  Datenschutz
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section id="faq" className="py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Haeufige Fragen</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((item) => (
              <details
                key={item.question}
                className="rounded-xl border border-gray-200 bg-white p-5"
              >
                <summary className="cursor-pointer list-none pr-3 text-base font-semibold">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm text-gray-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-white py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Struktur in die Ernaehrungsplanung bringen
          </h2>
          <p className="mt-4 text-gray-600">
            Starten Sie mit einem unverbindlichen Test und pruefen Sie, ob
            NutriKompass zu Ihrem Alltag passt.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-xl bg-[#2D6A4F] px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#245640]"
            >
              14 Tage unverbindlich testen
            </Link>
            <Link
              href="/impressum"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-8 py-3 text-sm font-semibold text-[#2D6A4F] transition-colors hover:bg-gray-50"
            >
              Kontakt aufnehmen
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Link href="/" className="flex items-center gap-2">
              <Compass className="h-6 w-6 text-[#2D6A4F]" />
              <span className="text-lg font-bold text-[#2D6A4F]">NutriKompass</span>
            </Link>

            <div className="flex items-center gap-6 text-sm text-gray-600">
              <Link href="/impressum" className="transition-colors hover:text-[#2D6A4F]">
                Impressum
              </Link>
              <Link href="/datenschutz" className="transition-colors hover:text-[#2D6A4F]">
                Datenschutz
              </Link>
              <Link href="/agb" className="transition-colors hover:text-[#2D6A4F]">
                AGB
              </Link>
            </div>

            <p className="text-sm text-gray-500">&copy; 2026 NutriKompass. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 p-3 backdrop-blur md:hidden">
        <Link
          href="/register"
          className="inline-flex w-full items-center justify-center rounded-xl bg-[#2D6A4F] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#245640]"
        >
          14 Tage unverbindlich testen
        </Link>
      </div>
    </div>
  );
}
