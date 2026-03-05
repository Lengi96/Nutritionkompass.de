import {
  ClipboardList,
  Handshake,
  UtensilsCrossed,
  CheckCircle2,
  Users,
  Sparkles,
} from "lucide-react";

const STEPS = [
  { icon: ClipboardList, label: "Schritt 1", text: "Profil und Randbedingungen erfassen" },
  { icon: UtensilsCrossed, label: "Schritt 2", text: "KI-Planvorschlag prüfen und anpassen" },
  { icon: CheckCircle2, label: "Schritt 3", text: "Freigeben und Einkauf übergeben" },
] as const;

const MACROS = [
  { label: "Protein", value: "28 g" },
  { label: "Kohlenhydrate", value: "78 g" },
  { label: "Fett", value: "19 g" },
] as const;

export function LandingShowcase() {
  return (
    <section className="bg-surface-light py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Im Alltag
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-[-0.02em] text-surface-dark sm:text-5xl">
            So sieht mein-nutrikompass.de im Alltag aus
          </h2>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {/* Planungsprozess — large */}
          <div className="rounded-3xl border border-gray-100 bg-white p-7 transition-shadow hover:shadow-md sm:col-span-2 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Planungsprozess
            </p>
            <p className="mt-1 text-sm text-gray-400">
              In 3 Schritten zu einem vollständigen Plan
            </p>
            <div className="mt-6 space-y-3">
              {STEPS.map(({ icon: Icon, label, text }) => (
                <div
                  key={label}
                  className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-surface-light p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Icon aria-hidden className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {label}
                    </p>
                    <p className="text-sm text-gray-600">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Meal-Card */}
          <div className="rounded-3xl border border-primary-100/50 bg-primary-50 p-7 transition-shadow hover:shadow-md">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Meal-Card
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Tagesgenaue Nährwert- und Rezeptübersicht
            </p>
            <div className="mt-5 rounded-2xl border border-primary-100/60 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Mittagessen
                </span>
                <span className="text-sm font-bold text-surface-dark">690 kcal</span>
              </div>
              <p className="text-sm font-bold text-surface-dark">Linsencurry mit Reis</p>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                Rote Linsen, Kokosmilch, Karotte und Basmatireis. Warm, sättigend
                und planbar.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {MACROS.map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-primary-50 px-2 py-2 text-center">
                    <p className="text-xs font-bold text-primary">{value}</p>
                    <p className="mt-0.5 text-[10px] text-gray-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Handover Dashboard */}
          <div className="rounded-3xl border border-gray-100 bg-white p-7 transition-shadow hover:shadow-md">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Handover-Dashboard
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Übergabe strukturiert und nachvollziehbar
            </p>
            <div className="mt-5 space-y-2.5">
              <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-surface-light px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium text-surface-dark">
                  <Users aria-hidden className="h-4 w-4 text-primary" />
                  Schichtwechsel 14:00
                </div>
                <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-600">
                  Bereit
                </span>
              </div>
              <div className="rounded-xl border border-gray-100 bg-surface-light px-4 py-3 text-xs text-gray-500">
                Offene Punkte: 2 Anpassungen, 1 Einkaufsliste wartet auf Freigabe.
              </div>
              <div className="rounded-xl border border-gray-100 bg-surface-light px-4 py-3 text-xs text-gray-500">
                Letztes Update von Teamleitung vor 12 Min.
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-primary/8 px-4 py-3 text-xs font-medium text-primary">
                <Handshake aria-hidden className="h-4 w-4 shrink-0" />
                Übergabe dokumentiert und nachvollziehbar.
              </div>
            </div>
          </div>

          {/* Dark highlight card — large */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface-dark to-surface-mid p-7 text-white transition-transform duration-300 hover:-translate-y-1 sm:col-span-2 lg:col-span-2">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
            />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-300">
              Warum Teams mein-nutrikompass.de nutzen
            </p>
            <p className="mt-1 text-sm text-white/50">
              Klare Produktgrenzen und nachvollziehbare Prozesse
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Sparkles,
                  title: "KI-Unterstützung",
                  desc: "Vorschläge auf Basis individueller Profilangaben",
                },
                {
                  icon: CheckCircle2,
                  title: "Fachliche Kontrolle",
                  desc: "Jeder Plan wird vor Nutzung geprüft und freigegeben",
                },
                {
                  icon: Users,
                  title: "Team-Kontinuität",
                  desc: "Strukturierte Übergaben, unabhängig von einzelnen Personen",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/8 bg-white/5 p-4 backdrop-blur-sm"
                >
                  <Icon aria-hidden className="mb-2 h-5 w-5 text-primary-300" />
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-1 text-xs text-white/50">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
