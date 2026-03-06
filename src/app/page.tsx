import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock3,
  Shield,
  ShoppingCart,
  Users,
  FileText,
  Compass,
  PlayCircle,
  HeartHandshake,
  LockKeyhole,
  Cloud,
  BadgeCheck,
} from "lucide-react";
import { MobileNav } from "@/components/landing/MobileNav";
import { LogoIcon } from "@/components/ui/LogoIcon";
import { LEGAL, legalMailto } from "@/config/legal";

const NAV_ITEMS = [
  { href: "#features", label: "Funktionen" },
  { href: "#workflow", label: "Workflow" },
  { href: "#pricing", label: "Preise" },
  { href: "#trust", label: "Sicherheit" },
] as const;

const HERO_POINTS = [
  "KI-gestuetzte Wochenplaene",
  "Automatische Einkaufslisten",
  "Patientenverwaltung und Dokumentation",
] as const;

const PROBLEMS = [
  {
    icon: Clock3,
    title: "Zeitintensive Essensplanung",
    text: "Manuelle Planung frisst Zeit, die im Alltag eigentlich fuer Begleitung, Therapie und Abstimmung im Team gebraucht wird.",
  },
  {
    icon: Users,
    title: "Viele parallele Anforderungen",
    text: "Unvertraeglichkeiten, Vorlieben und unterschiedliche Stationsrealitaeten muessen gleichzeitig im Blick bleiben.",
  },
  {
    icon: HeartHandshake,
    title: "Hoher organisatorischer Druck",
    text: "Dokumentationspflichten, Personalmangel und Schichtwechsel machen einen klaren, verlaesslichen Prozess notwendig.",
  },
] as const;

const FEATURES = [
  {
    icon: Compass,
    title: "KI-Essensplanung",
    text: "Generieren Sie strukturierte Planvorschlaege passend zu Profil, Alltag und Versorgungssituation.",
  },
  {
    icon: ShoppingCart,
    title: "Auto-Einkaufslisten",
    text: "Komplette Listen, zusammengefasst nach Kategorien und direkt aus freigegebenen Plaenen abgeleitet.",
  },
  {
    icon: Users,
    title: "Patientenverwaltung",
    text: "Zentrale Profile fuer Allergien, Abneigungen, Ziele und organisationsrelevante Hinweise.",
  },
  {
    icon: FileText,
    title: "Dokumentation",
    text: "Planstaende, PDFs und organisatorische Uebergaben bleiben nachvollziehbar und teamfaehig.",
  },
] as const;

const WORKFLOW_STEPS = [
  {
    title: "Patientin anlegen",
    text: "Erfassen Sie Basisdaten und spezifische Ernaehrungsanforderungen in einem klaren Profil.",
  },
  {
    title: "Essensplan generieren",
    text: "Die KI erstellt einen Vorschlag, den Ihr Team prueft, anpasst und fachlich freigibt.",
  },
  {
    title: "Einkaufsliste nutzen",
    text: "Leiten Sie freigegebene Plaene in eine sofort nutzbare Einkaufsliste fuer die Versorgung ueber.",
  },
] as const;

const TRUST_ITEMS = [
  { icon: Shield, label: "DSGVO-orientiert" },
  { icon: Cloud, label: "EU-Hosting" },
  { icon: LockKeyhole, label: "Pseudonymisierte Daten" },
  { icon: BadgeCheck, label: "Rollenbasierte Zugriffe" },
] as const;

const PRICING = [
  {
    name: "Basis",
    price: "29 EUR",
    suffix: "/Monat",
    featured: false,
    cta: "Jetzt starten",
    href: "/register?plan=basic",
    points: [
      "Bis zu 10 Essensplaene",
      "Patientenverwaltung",
      "Standard Support",
    ],
  },
  {
    name: "Premium",
    price: "59 EUR",
    suffix: "/Monat",
    featured: true,
    cta: "Jetzt starten",
    href: "/register?plan=professional",
    points: [
      "Unbegrenzte Plaene",
      "Priorisierter Support",
      "Erweiterte Analytics",
      "Rollenverwaltung",
    ],
  },
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background pb-24 text-slate-900 md:pb-0">
      <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white shadow-sm shadow-primary/20">
              <LogoIcon className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-primary">NutriKompass</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-700 transition-colors hover:text-primary"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:text-primary sm:block"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="hidden rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary/90 sm:inline-flex"
            >
              Kostenlos testen
            </Link>
            <MobileNav />
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden py-24 md:py-32">
          <div aria-hidden className="absolute inset-0 hero-dot-grid opacity-70" />
          <div aria-hidden className="absolute -left-12 top-14 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
          <div aria-hidden className="absolute -right-8 bottom-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative mx-auto max-w-[1100px] px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="flex flex-col gap-8">
                <div className="space-y-6">
                  <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                    Strukturierte Essensplanung fuer therapeutische Wohngruppen.
                  </h1>
                  <p className="text-lg leading-relaxed text-slate-600">
                    Plane Mahlzeiten fuer mehrere Patientinnen in Minuten statt Stunden. Entlasten Sie Ihr Team durch intelligente Automatisierung.
                  </p>
                </div>

                <ul className="space-y-3">
                  {HERO_POINTS.map((point) => (
                    <li key={point} className="flex items-center gap-3 text-slate-700">
                      <Check className="h-5 w-5 text-primary" />
                      {point}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/register"
                    className="rounded-xl bg-primary px-8 py-4 text-base font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:bg-primary/90"
                  >
                    Kostenlos testen
                  </Link>
                  <a
                    href="#workflow"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-4 text-base font-bold text-slate-800 transition-all hover:bg-slate-50"
                  >
                    Demo ansehen
                    <PlayCircle className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="relative">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
                  <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4">
                    <div className="h-3 w-24 rounded-full bg-slate-100" />
                    <div className="flex gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/20" />
                      <div className="h-6 w-6 rounded-full bg-primary/20" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <div className="h-20 rounded-lg bg-accent p-2">
                        <div className="mb-2 h-2 w-full rounded bg-primary/30" />
                        <div className="h-2 w-2/3 rounded bg-primary/30" />
                      </div>
                      <div className="h-20 rounded-lg bg-slate-50 p-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-20 rounded-lg bg-slate-50 p-2" />
                      <div className="h-20 rounded-lg bg-accent p-2">
                        <div className="mb-2 h-2 w-full rounded bg-primary/30" />
                        <div className="h-2 w-2/3 rounded bg-primary/30" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/20 bg-primary/5">
                        <ShoppingCart className="h-7 w-7 text-primary/40" />
                        <div className="h-2 w-12 rounded bg-primary/20" />
                      </div>
                    </div>
                  </div>
                </div>
                <div aria-hidden className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
                <div aria-hidden className="absolute -left-6 -top-6 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
              </div>
            </div>
          </div>
        </section>

        <section id="problem" className="bg-white py-24">
          <div className="mx-auto max-w-[1100px] px-6">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Der Alltag in therapeutischen Wohngruppen ist organisatorisch komplex
              </h2>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {PROBLEMS.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="group rounded-xl border border-slate-100 bg-surface-light p-8 transition-all hover:border-primary/30"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold">{title}</h3>
                  <p className="text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="py-24">
          <div className="mx-auto max-w-[1100px] px-6">
            <div className="mb-20 text-center">
              <h2 className="mb-6 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                NutriKompass digitalisiert die Essensplanung
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-slate-600">
                Wir unterstuetzen therapeutische Einrichtungen dabei, den Fokus zurueck auf die Patientinnen zu legen, indem wir administrative Prozesse bei der Verpflegung automatisieren.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-xl bg-accent p-6">
                  <Icon className="mb-4 h-8 w-8 text-primary" />
                  <h4 className="mb-2 font-bold">{title}</h4>
                  <p className="text-sm text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="bg-surface-dark py-24 text-white">
          <div className="mx-auto max-w-[1100px] px-6">
            <h2 className="mb-16 text-center text-3xl font-bold tracking-tight md:text-4xl">
              So funktioniert NutriKompass
            </h2>
            <div className="relative grid gap-12 md:grid-cols-3">
              <div aria-hidden className="absolute left-0 top-1/2 hidden h-0.5 w-full -translate-y-1/2 bg-primary/20 md:block" />
              {WORKFLOW_STEPS.map((step, index) => (
                <div key={step.title} className="relative flex flex-col items-center text-center">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold">
                    {index + 1}
                  </div>
                  <h3 className="mb-4 text-xl font-bold">{step.title}</h3>
                  <p className="text-slate-400">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="trust" className="py-24">
          <div className="mx-auto max-w-[1100px] px-6">
            <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
              <div className="lg:w-1/2">
                <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">
                  Entwickelt fuer therapeutische Einrichtungen
                </h2>
                <p className="mb-8 text-lg text-slate-600">
                  Wir wissen, wie sensibel Daten im therapeutischen Umfeld sind. NutriKompass setzt auf klare Produktgrenzen, nachvollziehbare Prozesse und eine ruhige, professionelle Nutzerfuehrung.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:w-1/2">
                <div className="rounded-2xl bg-surface-light p-8">
                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Shield className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-bold">Medical Standard Compliance</div>
                      <div className="text-sm text-slate-500">Strukturierte Sicherheit fuer Ihre Einrichtung</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 w-full rounded bg-slate-200" />
                    <div className="h-4 w-5/6 rounded bg-slate-200" />
                    <div className="h-4 w-4/6 rounded bg-slate-200" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-surface-light py-24">
          <div className="mx-auto max-w-[1100px] px-6">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Einfache, faire Preise</h2>
              <p className="mt-4 text-slate-600">Waehlen Sie das passende Paket fuer Ihre Wohngruppe.</p>
            </div>
            <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
              {PRICING.map((plan) => (
                <div
                  key={plan.name}
                  className={
                    plan.featured
                      ? "relative flex flex-col rounded-xl border-2 border-primary bg-white p-8 shadow-xl"
                      : "flex flex-col rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
                  }
                >
                  {plan.featured && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
                      Empfohlen
                    </div>
                  )}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-slate-500">{plan.suffix}</span>
                    </div>
                  </div>
                  <ul className="mb-10 flex-1 space-y-4">
                    {plan.points.map((point) => (
                      <li key={point} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-primary" />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.href}
                    className={
                      plan.featured
                        ? "w-full rounded-xl bg-primary py-3 text-center font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                        : "w-full rounded-xl border-2 border-primary py-3 text-center font-bold text-primary transition-all hover:bg-primary hover:text-white"
                    }
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-[1100px] px-6">
            <div className="rounded-2xl bg-primary px-8 py-16 text-center text-white shadow-2xl">
              <h2 className="mb-6 text-3xl font-bold md:text-4xl">Bereit fuer eine effizientere Essensplanung?</h2>
              <p className="mx-auto mb-10 max-w-xl text-lg text-white/90">
                Testen Sie NutriKompass 14 Tage lang kostenlos und unverbindlich. Keine Kreditkarte erforderlich.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/register"
                  className="rounded-xl bg-white px-8 py-4 text-lg font-bold text-primary shadow-lg transition-all hover:bg-slate-50"
                >
                  Kostenlos testen
                </Link>
                <a
                  href={legalMailto(LEGAL.mailSubjects.demoRequest)}
                  className="rounded-xl border border-white/30 bg-white/10 px-8 py-4 text-lg font-bold backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  Kontakt aufnehmen
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-12">
        <div className="mx-auto max-w-[1100px] px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                <LogoIcon className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-primary">NutriKompass</span>
            </Link>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-500">
              <Link href="/impressum" className="hover:text-primary">Impressum</Link>
              <Link href="/datenschutz" className="hover:text-primary">Datenschutz</Link>
              <Link href="/agb" className="hover:text-primary">AGB</Link>
              <Link href="/avv" className="hover:text-primary">AVV</Link>
            </div>
            <div className="text-sm text-slate-400">
              &copy; {new Date().getFullYear()} {LEGAL.brandName}. Alle Rechte vorbehalten.
            </div>
          </div>
        </div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/10 bg-white/95 p-3 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-primary/90"
          >
            Kostenlos testen
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
