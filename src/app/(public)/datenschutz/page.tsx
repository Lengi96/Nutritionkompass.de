import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LEGAL, legalMailto } from "@/config/legal";

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A2E]">
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#2D6A4F] hover:underline mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Startseite
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold mb-10">
          Datenschutzerklärung
        </h1>

        {/* ── 1. Verantwortlicher ─────────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">1. Verantwortlicher</h2>
          <p className="text-gray-700 leading-relaxed">
            {LEGAL.operator.name}
            <br />
            {LEGAL.operator.addressLine1}
            <br />
            {LEGAL.operator.postalCode} {LEGAL.operator.city}
            <br />
            E-Mail: {LEGAL.operator.email}
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Bei Fragen zum Datenschutz wenden Sie sich bitte an die oben
            genannte Adresse oder per E-Mail an{" "}
            <span className="text-[#2D6A4F]">{LEGAL.operator.email}</span>.
          </p>
        </section>

        {/* ── 2. Übersicht der Datenverarbeitungen ───────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            2. Übersicht der Datenverarbeitungen
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Wir verarbeiten personenbezogene Daten ausschließlich im
            Rahmen der Bereitstellung unseres Dienstes mein-nutrikompass.de. Die
            folgenden Daten können verarbeitet werden:
          </p>
          <ul className="mt-3 list-disc list-inside text-gray-700 space-y-1.5">
            <li>
              Bestandsdaten (z.&thinsp;B. Name, E-Mail-Adresse bei der
              Registrierung)
            </li>
            <li>Nutzungsdaten (z.&thinsp;B. aufgerufene Seiten, Zugriffszeit)</li>
            <li>
              Pseudonymisierte Patientendaten (Kürzel, Alter, Diagnose,
              Ernährungspräferenzen)
            </li>
            <li>
              Ernährungspläne und Einkaufslisten, die im System
              erstellt werden
            </li>
          </ul>
        </section>

        {/* ── 3. Maßgebliche Rechtsgrundlagen ─────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            3. Maßgebliche Rechtsgrundlagen
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Gemäß Art. 13 DSGVO teilen wir Ihnen die
            Rechtsgrundlagen unserer Datenverarbeitungen mit:
          </p>
          <ul className="mt-3 list-disc list-inside text-gray-700 space-y-1.5">
            <li>
              <strong>Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO):</strong>{" "}
              Verarbeitung zur Bereitstellung des SaaS-Dienstes
            </li>
            <li>
              <strong>Einwilligung (Art. 6 Abs. 1 lit. a DSGVO):</strong>{" "}
              Sofern Sie in bestimmte Verarbeitungen eingewilligt haben
            </li>
            <li>
              <strong>Berechtigte Interessen (Art. 6 Abs. 1 lit. f DSGVO):</strong>{" "}
              Sicherheit und Verbesserung unseres Angebots
            </li>
          </ul>
        </section>

        {/* ── 4. Hosting ──────────────────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">4. Hosting</h2>
          <p className="text-gray-700 leading-relaxed">
            Unsere Anwendung wird auf Servern von Supabase (Supabase Inc.)
            betrieben. Die Datenbank-Server befinden sich in der EU (Standort
            Frankfurt am Main, Deutschland). Supabase setzt auf die
            Cloud-Infrastruktur von AWS (Amazon Web Services) mit
            Rechenzentren in der EU.
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Der Einsatz erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO
            (berechtigtes Interesse an einer zuverlässigen und sicheren
            Bereitstellung). Ein Auftragsverarbeitungsvertrag (AVV) gem.
            Art. 28 DSGVO wurde mit dem Anbieter geschlossen.
          </p>
        </section>

        {/* ── 5. Auftragsverarbeitung mit Kunden ──────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            5. Auftragsverarbeitung gem. Art.&thinsp;28 DSGVO
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Soweit Einrichtungen (Nutzer des Dienstes) im Rahmen von
            mein-nutrikompass.de personenbezogene Daten von Patienten
            verarbeiten, handeln Sie als <strong>Verantwortliche</strong> im
            Sinne der DSGVO. {LEGAL.operator.name} / mein-nutrikompass.de agiert
            dabei als <strong>Auftragsverarbeiter</strong> gem. Art.&thinsp;6
            Abs.&thinsp;4, Art.&thinsp;28 DSGVO.
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Der Abschluss eines Auftragsverarbeitungsvertrags (AVV) ist
            gesetzlich verpflichtend, bevor Patientendaten in den Dienst
            eingegeben werden. Ein <strong>AVV kann per E-Mail angefordert
            werden</strong>:{" "}
            <a
              href={legalMailto(LEGAL.mailSubjects.avvRequest)}
              className="text-[#2D6A4F] hover:underline"
            >
              {LEGAL.operator.email}
            </a>
            . Der AVV wird vor oder mit der Freischaltung des Produktivbetriebs
            bereitgestellt.
          </p>
          <div className="mt-4 rounded-xl border border-[#2D6A4F]/20 bg-[#2D6A4F]/5 p-4 text-sm text-gray-700 space-y-3">
            <p className="font-semibold text-[#2D6A4F]">AVV online einsehen & anfordern</p>
            <p>
              Den vollständigen Auftragsverarbeitungsvertrag (inkl.
              Anlage&thinsp;1 Unterauftragnehmer und Anlage&thinsp;2 TOMs)
              können Sie direkt hier einsehen:
            </p>
            <Link
              href="/avv"
              className="inline-flex items-center gap-1.5 font-medium text-[#2D6A4F] underline underline-offset-2"
            >
              AVV lesen &rarr; mein-nutrikompass.de/avv
            </Link>
            <p>
              Um den AVV rechtsverbindlich zu unterzeichnen, senden Sie eine
              E-Mail an{" "}
              <a
                href={legalMailto(LEGAL.mailSubjects.avvExecution)}
                className="font-medium text-[#2D6A4F] underline underline-offset-2"
              >
                {LEGAL.operator.email}
              </a>{" "}
              mit dem Betreff &bdquo;AVV-Abschluss&ldquo;. Sie erhalten eine
              gegengezeichnete Ausfertigung in der Regel innerhalb von
              {LEGAL.responseTargets.avvCounterSignedBusinessDays}.
            </p>
          </div>
        </section>

        {/* ── 6. Nutzung von KI-Diensten ──────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            6. Nutzung von KI-Diensten
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Zur Erstellung von Ernährungsplänen nutzen wir die API
            von OpenAI (OpenAI, L.L.C., San Francisco, USA). An OpenAI werden
            ausschließlich pseudonymisierte Daten übermittelt
            (z.&thinsp;B. Alter, Geschlecht, Diagnose-Kürzel,
            Ernährungspräferenzen). <strong>Es werden keine
            Klarnamen oder direkt identifizierenden Merkmale
            übertragen.</strong>
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            OpenAI verarbeitet Daten auf Servern in den USA. Die
            Übermittlung erfolgt auf Grundlage von
            Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO). OpenAI
            hat sich verpflichtet, API-Daten nicht für das Training
            eigener Modelle zu verwenden.
          </p>
        </section>

        {/* ── 6a. Zahlungsabwicklung ──────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            6a. Zahlungsabwicklung (Stripe)
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Für die Abwicklung von Abonnements und Zahlungen nutzen wir
            den Dienst <strong>Stripe</strong> (Stripe Payments Europe, Ltd.,
            1 Grand Canal Street Lower, Grand Canal Dock, Dublin, D02 H210,
            Irland / Stripe, Inc., 510 Townsend Street, San Francisco,
            CA&nbsp;94103, USA).
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Stripe verarbeitet Zahlungsdaten (z.&thinsp;B. Kreditkarteninformationen,
            Rechnungsadresse) ausschließlich zum Zweck der
            Zahlungsabwicklung und Abonnementverwaltung. Wir selbst speichern
            keine vollständigen Zahlungsmitteldaten &ndash; diese werden
            direkt und verschlüsselt von Stripe entgegengenommen.
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Die Verarbeitung erfolgt auf Grundlage von Art.&thinsp;6
            Abs.&thinsp;1 lit.&thinsp;b DSGVO (Vertragserfüllung). Für
            Datenübermittlungen in die USA gelten die
            EU-Standardvertragsklauseln gem. Art.&thinsp;46 Abs.&thinsp;2
            lit.&thinsp;c DSGVO. Ein Auftragsverarbeitungsvertrag (DPA) mit
            Stripe ist abgeschlossen. Weitere Informationen zur
            Datenverarbeitung durch Stripe finden Sie unter{" "}
            <a
              href="https://stripe.com/de/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2D6A4F] hover:underline"
            >
              stripe.com/de/privacy
            </a>
            .
          </p>
        </section>

        {/* ── 7. Cookies & Local Storage ──────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            7. Cookies & Local Storage
          </h2>
          <p className="text-gray-700 leading-relaxed">
            mein-nutrikompass.de verwendet ausschließlich technisch notwendige
            Cookies und Local-Storage-Einträge, die für den Betrieb
            der Anwendung erforderlich sind (z.&thinsp;B. Session-Token zur
            Authentifizierung). Es werden keine Tracking- oder Werbe-Cookies
            eingesetzt.
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
            Interesse an der funktionalen Bereitstellung des Dienstes) sowie
            &sect; 25 Abs. 2 TDDDG (technisch notwendige Speicherung).
          </p>
        </section>

        {/* ── 8. Kontaktdaten & Anfragen ──────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            8. Kontaktdaten & Anfragen
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Wenn Sie uns per E-Mail kontaktieren, speichern wir Ihre Anfrage
            einschließlich aller darin enthaltenen personenbezogenen
            Daten (Name, E-Mail-Adresse, Inhalt der Anfrage) zum Zwecke der
            Bearbeitung. Diese Daten werden nicht ohne Ihre Einwilligung
            weitergegeben.
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche
            Maßnahmen) bzw. Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
            Interesse an der Beantwortung von Anfragen).
          </p>
        </section>

        {/* ── 9. Rechte der betroffenen Personen ──────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            9. Rechte der betroffenen Personen
          </h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            Sie haben gegenüber uns folgende Rechte hinsichtlich der
            Sie betreffenden personenbezogenen Daten:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1.5">
            <li>
              <strong>Recht auf Auskunft</strong> (Art. 15 DSGVO)
            </li>
            <li>
              <strong>Recht auf Berichtigung</strong> (Art. 16 DSGVO)
            </li>
            <li>
              <strong>Recht auf Löschung</strong> (Art. 17 DSGVO)
            </li>
            <li>
              <strong>Recht auf Einschränkung der Verarbeitung</strong>{" "}
              (Art. 18 DSGVO)
            </li>
            <li>
              <strong>Recht auf Datenübertragbarkeit</strong> (Art. 20
              DSGVO)
            </li>
            <li>
              <strong>Widerspruchsrecht</strong> (Art. 21 DSGVO)
            </li>
            <li>
              <strong>Recht auf Widerruf der Einwilligung</strong> (Art. 7
              Abs. 3 DSGVO)
            </li>
            <li>
              <strong>Beschwerderecht bei einer Aufsichtsbehörde</strong>{" "}
              (Art. 77 DSGVO)
            </li>
          </ul>
        </section>

        {/* ── 10. Änderung der Datenschutzerklärung ─── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            10. Änderung der Datenschutzerklärung
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Wir behalten uns vor, diese Datenschutzerklärung anzupassen,
            damit sie stets den aktuellen rechtlichen Anforderungen entspricht
            oder um Änderungen unserer Leistungen umzusetzen. Für
            Ihren erneuten Besuch gilt dann die aktualisierte
            Datenschutzerklärung.
          </p>
        </section>

        {/* ── Stand ───────────────────────────────────────────── */}
        <p className="text-sm text-gray-500 mt-12">Stand: Dezember 2025</p>

        {/* ── Footer-Links ────────────────────────────────────── */}
        <div className="mt-8 pt-8 border-t border-gray-200 flex flex-wrap gap-6 text-sm text-gray-600">
          <Link href="/impressum" className="hover:text-[#2D6A4F] transition-colors">
            Impressum
          </Link>
          <Link href="/agb" className="hover:text-[#2D6A4F] transition-colors">
            AGB
          </Link>
          <Link href="/avv" className="hover:text-[#2D6A4F] transition-colors">
            AVV
          </Link>
        </div>
      </div>
    </div>
  );
}
