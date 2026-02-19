import Link from "next/link";
import {
  Compass,
  Sparkles,
  ShoppingCart,
  FileDown,
  Shield,
  Check,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A2E]">
      {/* ── Navbar ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-200">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Compass className="h-7 w-7 text-[#2D6A4F]" />
            <span className="text-xl font-bold text-[#2D6A4F]">
              NutriKompass
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#features" className="hover:text-[#2D6A4F] transition-colors">
              Features
            </a>
            <a href="#preise" className="hover:text-[#2D6A4F] transition-colors">
              Preise
            </a>
            <Link href="/impressum" className="hover:text-[#2D6A4F] transition-colors">
              Impressum
            </Link>
            <Link href="/datenschutz" className="hover:text-[#2D6A4F] transition-colors">
              Datenschutz
            </Link>
          </div>

          {/* CTA buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-[#2D6A4F] hover:bg-[#2D6A4F]/5 rounded-xl transition-colors"
            >
              Anmelden
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#2D6A4F] hover:bg-[#245640] rounded-xl transition-colors"
            >
              Kostenlos testen
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Hero Section ────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
            Ern&auml;hrungsplanung{" "}
            <span className="text-[#2D6A4F]">leicht gemacht</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-gray-600 leading-relaxed">
            KI-gest&uuml;tzte Ern&auml;hrungspl&auml;ne f&uuml;r Einrichtungen,
            die Menschen mit Essst&ouml;rungen betreuen &ndash; individuell,
            schnell und DSGVO-konform.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center px-8 py-3.5 text-base font-semibold text-white bg-[#2D6A4F] hover:bg-[#245640] rounded-xl shadow-lg shadow-[#2D6A4F]/20 transition-colors"
            >
              14 Tage kostenlos testen
            </Link>
            <a
              href="#features"
              className="inline-flex items-center px-8 py-3.5 text-base font-semibold text-[#2D6A4F] bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors"
            >
              Mehr erfahren
            </a>
          </div>
        </div>

        {/* Decorative gradient blob */}
        <div
          aria-hidden="true"
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#74C69D]/20 blur-3xl pointer-events-none"
        />
      </section>

      {/* ── Features Section ────────────────────────────────────── */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Alles, was Sie brauchen
            </h2>
            <p className="mt-4 text-gray-600 max-w-xl mx-auto">
              NutriKompass vereint KI-Technologie mit fachlichem Know-how
              f&uuml;r optimale Ern&auml;hrungsplanung.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#2D6A4F]/10 mb-4">
                <Sparkles className="h-6 w-6 text-[#2D6A4F]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                KI-Ern&auml;hrungspl&auml;ne
              </h3>
              <p className="text-sm text-gray-600">
                Individuelle 7-Tage-Pl&auml;ne per Knopfdruck &ndash; angepasst
                an Alter, Diagnose und Vorlieben.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#2D6A4F]/10 mb-4">
                <ShoppingCart className="h-6 w-6 text-[#2D6A4F]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Einkaufslisten</h3>
              <p className="text-sm text-gray-600">
                Automatisch generiert aus jedem Plan &ndash; &uuml;bersichtlich
                nach Kategorie sortiert.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#2D6A4F]/10 mb-4">
                <FileDown className="h-6 w-6 text-[#2D6A4F]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">PDF-Export</h3>
              <p className="text-sm text-gray-600">
                Pl&auml;ne und Listen als PDF drucken oder digital
                weiterleiten.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#2D6A4F]/10 mb-4">
                <Shield className="h-6 w-6 text-[#2D6A4F]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">DSGVO-konform</h3>
              <p className="text-sm text-gray-600">
                Pseudonymisierte Daten, deutsche Server &ndash; Ihre Daten
                bleiben gesch&uuml;tzt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Section ─────────────────────────────────────── */}
      <section id="preise" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Transparente Preise
            </h2>
            <p className="mt-4 text-gray-600 max-w-xl mx-auto">
              Starten Sie kostenlos und w&auml;hlen Sie sp&auml;ter den Plan,
              der zu Ihrer Einrichtung passt.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Testphase */}
            <div className="relative bg-[#F8F9FA] rounded-xl border border-gray-200 p-8 flex flex-col">
              <h3 className="text-lg font-semibold">Testphase</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">Kostenlos</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">14 Tage, unverbindlich</p>
              <ul className="mt-8 space-y-3 flex-1">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-5 w-5 text-[#2D6A4F] shrink-0 mt-0.5" />
                  Alle Features inklusive
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-5 w-5 text-[#2D6A4F] shrink-0 mt-0.5" />
                  Max. 3 Patienten
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-5 w-5 text-[#2D6A4F] shrink-0 mt-0.5" />
                  E-Mail-Support
                </li>
              </ul>
              <Link
                href="/register"
                className="mt-8 inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-[#2D6A4F] bg-white border border-[#2D6A4F] hover:bg-[#2D6A4F]/5 rounded-xl transition-colors"
              >
                Jetzt starten
              </Link>
            </div>

            {/* Basis */}
            <div className="relative bg-[#F8F9FA] rounded-xl border border-gray-200 p-8 flex flex-col">
              <h3 className="text-lg font-semibold">Basis</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">29&euro;</span>
                <span className="text-gray-500 text-sm">/Monat</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                F&uuml;r kleinere Einrichtungen
              </p>
              <ul className="mt-8 space-y-3 flex-1">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-5 w-5 text-[#2D6A4F] shrink-0 mt-0.5" />
                  Bis 15 Patienten
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-5 w-5 text-[#2D6A4F] shrink-0 mt-0.5" />
                  50 Pl&auml;ne/Monat
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-5 w-5 text-[#2D6A4F] shrink-0 mt-0.5" />
                  E-Mail-Support
                </li>
              </ul>
              <Link
                href="/register?plan=basic"
                className="mt-8 inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-[#2D6A4F] bg-white border border-[#2D6A4F] hover:bg-[#2D6A4F]/5 rounded-xl transition-colors"
              >
                Plan w&auml;hlen
              </Link>
            </div>

            {/* Professional */}
            <div className="relative bg-[#2D6A4F] text-white rounded-xl border-2 border-[#2D6A4F] p-8 flex flex-col shadow-xl">
              <div className="absolute -top-3 right-6 bg-[#74C69D] text-[#1A1A2E] text-xs font-bold px-3 py-1 rounded-full">
                Beliebt
              </div>
              <h3 className="text-lg font-semibold">Professional</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">59&euro;</span>
                <span className="text-white/70 text-sm">/Monat</span>
              </div>
              <p className="mt-2 text-sm text-white/80">
                F&uuml;r wachsende Einrichtungen
              </p>
              <ul className="mt-8 space-y-3 flex-1">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-5 w-5 text-[#74C69D] shrink-0 mt-0.5" />
                  Unbegrenzt Patienten
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-5 w-5 text-[#74C69D] shrink-0 mt-0.5" />
                  Unbegrenzt Pl&auml;ne
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-5 w-5 text-[#74C69D] shrink-0 mt-0.5" />
                  Priorit&auml;ts-Support
                </li>
              </ul>
              <Link
                href="/register?plan=professional"
                className="mt-8 inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-[#2D6A4F] bg-white hover:bg-gray-100 rounded-xl transition-colors"
              >
                Plan w&auml;hlen
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Compass className="h-6 w-6 text-[#2D6A4F]" />
              <span className="text-lg font-bold text-[#2D6A4F]">
                NutriKompass
              </span>
            </Link>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <Link href="/impressum" className="hover:text-[#2D6A4F] transition-colors">
                Impressum
              </Link>
              <Link href="/datenschutz" className="hover:text-[#2D6A4F] transition-colors">
                Datenschutz
              </Link>
              <Link href="/agb" className="hover:text-[#2D6A4F] transition-colors">
                AGB
              </Link>
            </div>

            {/* Copyright */}
            <p className="text-sm text-gray-500">
              &copy; 2025 NutriKompass. Alle Rechte vorbehalten.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
