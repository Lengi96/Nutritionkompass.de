import type { ReactNode } from "react";
import { ClipboardList, Handshake, UtensilsCrossed, CheckCircle2, Users } from "lucide-react";

function ShowcaseCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-[#D8E3DC] bg-white/95 p-5 shadow-[0_14px_40px_-24px_rgba(20,52,41,0.45)]">
      <header className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2D6A4F]">
          {title}
        </p>
        <p className="mt-1 text-sm text-[#3F4B48]">{subtitle}</p>
      </header>
      {children}
    </article>
  );
}

export function LandingShowcase() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#EAF4EE] to-transparent"
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2D6A4F]">
            Produkt-Showcase
          </p>
          <h2 className="mt-3 text-3xl font-bold text-[#1A1A2E] sm:text-4xl">
            So sieht NutriKompass im Alltag aus
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <ShowcaseCard
            title="Card A"
            subtitle="Prozess-Fuehrung Schritt 1 bis 3"
          >
            <div className="space-y-3">
              {[
                { icon: ClipboardList, label: "Schritt 1", text: "Profil und Randbedingungen erfassen" },
                { icon: UtensilsCrossed, label: "Schritt 2", text: "KI-Planvorschlag pruefen und anpassen" },
                { icon: CheckCircle2, label: "Schritt 3", text: "Freigeben und Einkauf uebergeben" },
              ].map((step) => (
                <div
                  key={step.label}
                  className="flex items-start gap-3 rounded-2xl border border-[#E4ECE7] bg-[#F6FBF8] p-3"
                >
                  <div className="rounded-xl bg-[#2D6A4F]/10 p-2 text-[#2D6A4F]">
                    <step.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#2D6A4F]">
                      {step.label}
                    </p>
                    <p className="text-sm text-[#3F4B48]">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </ShowcaseCard>

          <ShowcaseCard
            title="Card B"
            subtitle="Beispiel Meal-Card"
          >
            <div className="rounded-2xl border border-[#E4ECE7] bg-[#F7FAF8] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full bg-[#2D6A4F]/10 px-3 py-1 text-xs font-semibold text-[#2D6A4F]">
                  Mittagessen
                </span>
                <span className="text-sm font-semibold text-[#1A1A2E]">690 kcal</span>
              </div>
              <h3 className="text-base font-semibold text-[#1A1A2E]">
                Linsencurry mit Reis
              </h3>
              <p className="mt-2 text-sm text-[#54635E]">
                Rote Linsen, Kokosmilch, Karotte und Basmatireis. Warm, saettigend und planbar.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-lg bg-white px-2 py-1 text-[#3F4B48]">Protein 28 g</span>
                <span className="rounded-lg bg-white px-2 py-1 text-[#3F4B48]">KH 78 g</span>
                <span className="rounded-lg bg-white px-2 py-1 text-[#3F4B48]">Fett 19 g</span>
              </div>
            </div>
          </ShowcaseCard>

          <ShowcaseCard
            title="Card C"
            subtitle="Handover-Dashboard fuer Mitarbeiter"
          >
            <div className="space-y-3 rounded-2xl border border-[#E4ECE7] bg-[#F7FAF8] p-4">
              <div className="flex items-center justify-between rounded-xl bg-white p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-[#1A1A2E]">
                  <Users className="h-4 w-4 text-[#2D6A4F]" />
                  Schichtwechsel 14:00
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                  Bereit
                </span>
              </div>
              <div className="rounded-xl bg-white p-3 text-sm text-[#3F4B48]">
                Offene Punkte: 2 Anpassungen, 1 Einkaufsliste wartet auf Freigabe.
              </div>
              <div className="rounded-xl bg-white p-3 text-sm text-[#3F4B48]">
                Letztes Update von Teamleitung vor 12 Min.
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-[#2D6A4F]/10 p-3 text-sm font-medium text-[#2D6A4F]">
                <Handshake className="h-4 w-4" />
                Uebergabe dokumentiert und nachvollziehbar.
              </div>
            </div>
          </ShowcaseCard>
        </div>
      </div>
    </section>
  );
}
