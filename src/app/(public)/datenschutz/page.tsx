import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
            Christoph Lengowski
            <br />
            Adreystra&szlig;e 116
            <br />
            44225 Dortmund
            <br />
            E-Mail: c.lengowski@yahoo.de
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Bei Fragen zum Datenschutz wenden Sie sich bitte an die oben
            genannte Adresse oder per E-Mail an{" "}
            <span className="text-[#2D6A4F]">c.lengowski@yahoo.de</span>.
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

        {/* ── 5. Nutzung von KI-Diensten ──────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            5. Nutzung von KI-Diensten
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

        {/* ── 6. Cookies & Local Storage ──────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            6. Cookies &amp; Local Storage
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

        {/* ── 7. Kontaktdaten & Anfragen ──────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            7. Kontaktdaten &amp; Anfragen
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

        {/* ── 8. Rechte der betroffenen Personen ──────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            8. Rechte der betroffenen Personen
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

        {/* ── 9. &Auml;nderung der Datenschutzerkl&auml;rung ─── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            9. &Auml;nderung der Datenschutzerkl&auml;rung
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
        </div>
      </div>
    </div>
  );
}
