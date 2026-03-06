import { TRPCProvider } from "@/trpc/client";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TRPCProvider>
      <div className="relative min-h-screen overflow-hidden bg-[#f6f7f7] text-text-main">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(80,145,123,0.18),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(120,168,151,0.18),_transparent_34%),linear-gradient(180deg,_#fbfcfb_0%,_#f6f7f7_56%,_#eef3f1_100%)]" />
        <div className="absolute left-[-8rem] top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[-6rem] right-[-4rem] h-80 w-80 rounded-full bg-[#78A897]/20 blur-3xl" />
        <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid w-full items-center gap-8 lg:grid-cols-[1.05fr_minmax(0,460px)] lg:gap-12">
            <section className="hidden rounded-[32px] border border-primary/10 bg-white/70 p-8 shadow-[0_24px_80px_rgba(53,95,81,0.12)] backdrop-blur lg:block">
              <div className="max-w-xl space-y-8">
                <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-4 py-1.5 text-sm font-semibold text-primary">
                  Struktur fuer Einrichtungen und Wohngruppen
                </div>
                <div className="space-y-4">
                  <h1 className="text-4xl font-black tracking-tight text-text-main">
                    Essensplanung, Dokumentation und Teamablauf in einer ruhigen Oberflaeche.
                  </h1>
                  <p className="max-w-lg text-base leading-7 text-slate-600">
                    NutriKompass unterstuetzt therapeutische Teams bei der taeglichen Planung, ohne die Arbeit mit unruhigen Dashboards oder unklaren Prozessen zu belasten.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <article className="rounded-3xl border border-primary/10 bg-[#eef6f2] p-5">
                    <p className="text-sm font-semibold text-text-main">Planung mit Struktur</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Bewohnerdaten, Ziele und Plaene bleiben nachvollziehbar an einem Ort.
                    </p>
                  </article>
                  <article className="rounded-3xl border border-primary/10 bg-white p-5">
                    <p className="text-sm font-semibold text-text-main">Weniger Organisationsdruck</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Klare Oberflaechen fuer Teammitglieder statt verstreuter Listen und Einzeltools.
                    </p>
                  </article>
                </div>
              </div>
            </section>
            <div className="flex justify-center lg:justify-end">{children}</div>
          </div>
        </div>
      </div>
    </TRPCProvider>
  );
}
