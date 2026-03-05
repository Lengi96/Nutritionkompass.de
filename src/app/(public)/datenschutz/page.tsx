import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LEGAL, LEGAL_ENTITY, legalMailto } from "@/config/legal";

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
          Zur&uuml;ck zur Startseite
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold mb-10">
          Datenschutzerkl&auml;rung
        </h1>

        {/* ── 1. Verantwortlicher ─────────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">1. Verantwortlicher</h2>
          <p className="text-gray-700 leading-relaxed">
            {LEGAL.companyName}
            <br />
            Inhaber: {LEGAL.operator.name}
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

        {/* ── 2. &Uuml;bersicht der Datenverarbeitungen ───────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            2. &Uuml;bersicht der Datenverarbeitungen
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Wir verarbeiten personenbezogene Daten ausschlie&szlig;lich im
            Rahmen der Bereitstellung unseres Dienstes mein-nutrikompass.de. Die
            folgenden Daten k&ouml;nnen verarbeitet werden:
          </p>
          <ul className="mt-3 list-disc list-inside text-gray-700 space-y-1.5">
            <li>
              Bestandsdaten (z.&thinsp;B. Name, E-Mail-Adresse bei der
              Registrierung)
            </li>
            <li>Nutzungsdaten (z.&thinsp;B. aufgerufene Seiten, Zugriffszeit)</li>
            <li>
              Pseudonymisierte Patientendaten (K&uuml;rzel, Alter, Diagnose,
              Ern&auml;hrungspr&auml;ferenzen)
            </li>
            <li>
              Ern&auml;hrungspl&auml;ne und Einkaufslisten, die im System
              erstellt werden
            </li>
          </ul>
        </section>

        {/* ── 3. Maßgebliche Rechtsgrundlagen ─────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            3. Ma&szlig;gebliche Rechtsgrundlagen
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Gem&auml;&szlig; Art. 13 DSGVO teilen wir Ihnen die
            Rechtsgrundlagen unserer Datenverarbeitungen mit:
          </p>
          <ul className="mt-3 list-disc list-inside text-gray-700 space-y-1.5">
            <li>
              <strong>Vertragserf&uuml;llung (Art. 6 Abs. 1 lit. b DSGVO):</strong>{" "}
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
            (berechtigtes Interesse an einer zuverl&auml;ssigen und sicheren
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
            Sinne der DSGVO. {LEGAL_ENTITY} / mein-nutrikompass.de agiert
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
            <p className="font-semibold text-[#2D6A4F]">AVV online einsehen &amp; anfordern</p>
            <p>
              Den vollst&auml;ndigen Auftragsverarbeitungsvertrag (inkl.
              Anlage&thinsp;1 Unterauftragnehmer und Anlage&thinsp;2 TOMs)
              k&ouml;nnen Sie direkt hier einsehen:
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
            Zur Erstellung von Ern&auml;hrungspl&auml;nen nutzen wir die API
            von OpenAI (OpenAI, L.L.C., San Francisco, USA). An OpenAI werden
            ausschlie&szlig;lich pseudonymisierte Daten &uuml;bermittelt
            (z.&thinsp;B. Alter, Geschlecht, Diagnose-K&uuml;rzel,
            Ern&auml;hrungspr&auml;ferenzen). <strong>Es werden keine
            Klarnamen oder direkt identifizierenden Merkmale
            &uuml;bertragen.</strong>
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            OpenAI verarbeitet Daten auf Servern in den USA. Die
            &Uuml;bermittlung erfolgt auf Grundlage von
            Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO). OpenAI
            hat sich verpflichtet, API-Daten nicht f&uuml;r das Training
            eigener Modelle zu verwenden.
          </p>
        </section>

        {/* ── 6a. Zahlungsabwicklung ──────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            6a. Zahlungsabwicklung (Stripe)
          </h2>
          <p className="text-gray-700 leading-relaxed">
            F&uuml;r die Abwicklung von Abonnements und Zahlungen nutzen wir
            den Dienst <strong>Stripe</strong> (Stripe Payments Europe, Ltd.,
            1 Grand Canal Street Lower, Grand Canal Dock, Dublin, D02 H210,
            Irland / Stripe, Inc., 510 Townsend Street, San Francisco,
            CA&nbsp;94103, USA).
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Stripe verarbeitet Zahlungsdaten (z.&thinsp;B. Kreditkarteninformationen,
            Rechnungsadresse) ausschlie&szlig;lich zum Zweck der
            Zahlungsabwicklung und Abonnementverwaltung. Wir selbst speichern
            keine vollst&auml;ndigen Zahlungsmitteldaten &ndash; diese werden
            direkt und verschl&uuml;sselt von Stripe entgegengenommen.
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Die Verarbeitung erfolgt auf Grundlage von Art.&thinsp;6
            Abs.&thinsp;1 lit.&thinsp;b DSGVO (Vertragserf&uuml;llung). F&uuml;r
            Daten&uuml;bermittlungen in die USA gelten die
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
            7. Cookies &amp; Local Storage
          </h2>
          <p className="text-gray-700 leading-relaxed">
            mein-nutrikompass.de verwendet ausschlie&szlig;lich technisch notwendige
            Cookies und Local-Storage-Eintr&auml;ge, die f&uuml;r den Betrieb
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
            8. Kontaktdaten &amp; Anfragen
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Wenn Sie uns per E-Mail kontaktieren, speichern wir Ihre Anfrage
            einschlie&szlig;lich aller darin enthaltenen personenbezogenen
            Daten (Name, E-Mail-Adresse, Inhalt der Anfrage) zum Zwecke der
            Bearbeitung. Diese Daten werden nicht ohne Ihre Einwilligung
            weitergegeben.
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche
            Ma&szlig;nahmen) bzw. Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
            Interesse an der Beantwortung von Anfragen).
          </p>
        </section>

        {/* ── 9. Rechte der betroffenen Personen ──────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            9. Rechte der betroffenen Personen
          </h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            Sie haben gegen&uuml;ber uns folgende Rechte hinsichtlich der
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
              <strong>Recht auf L&ouml;schung</strong> (Art. 17 DSGVO)
            </li>
            <li>
              <strong>Recht auf Einschr&auml;nkung der Verarbeitung</strong>{" "}
              (Art. 18 DSGVO)
            </li>
            <li>
              <strong>Recht auf Daten&uuml;bertragbarkeit</strong> (Art. 20
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
              <strong>Beschwerderecht bei einer Aufsichtsbeh&ouml;rde</strong>{" "}
              (Art. 77 DSGVO)
            </li>
          </ul>
        </section>

        {/* ── 10. &Auml;nderung der Datenschutzerkl&auml;rung ─── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            10. &Auml;nderung der Datenschutzerkl&auml;rung
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Wir behalten uns vor, diese Datenschutzerkl&auml;rung anzupassen,
            damit sie stets den aktuellen rechtlichen Anforderungen entspricht
            oder um &Auml;nderungen unserer Leistungen umzusetzen. F&uuml;r
            Ihren erneuten Besuch gilt dann die aktualisierte
            Datenschutzerkl&auml;rung.
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
