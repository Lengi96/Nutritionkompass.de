import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AGBPage() {
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
          Allgemeine Gesch&auml;ftsbedingungen
        </h1>

        {/* ── 1. Geltungsbereich ──────────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">1. Geltungsbereich</h2>
          <p className="text-gray-700 leading-relaxed">
            Diese Allgemeinen Gesch&auml;ftsbedingungen (AGB) gelten f&uuml;r
            die Nutzung des webbasierten Dienstes NutriKompass (nachfolgend
            &bdquo;Dienst&ldquo;), bereitgestellt von [Vor- und Nachname /
            Firmenname], [Adresse] (nachfolgend &bdquo;Anbieter&ldquo;).
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Mit der Registrierung oder Nutzung des Dienstes akzeptiert der
            Nutzer diese AGB. Abweichende Bedingungen des Nutzers werden nicht
            anerkannt, es sei denn, der Anbieter stimmt ihrer Geltung
            ausdr&uuml;cklich schriftlich zu.
          </p>
        </section>

        {/* ── 2. Vertragsgegenstand ───────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">2. Vertragsgegenstand</h2>
          <p className="text-gray-700 leading-relaxed">
            NutriKompass ist ein Software-as-a-Service (SaaS) Tool zur
            KI-gest&uuml;tzten Ern&auml;hrungsplanung f&uuml;r Einrichtungen,
            die Menschen mit Essst&ouml;rungen betreuen. Der Dienst
            erm&ouml;glicht insbesondere:
          </p>
          <ul className="mt-3 list-disc list-inside text-gray-700 space-y-1.5">
            <li>Erstellung individueller Ern&auml;hrungspl&auml;ne mittels KI</li>
            <li>
              Automatische Generierung von Einkaufslisten aus
              Ern&auml;hrungspl&auml;nen
            </li>
            <li>Export von Pl&auml;nen und Listen als PDF</li>
            <li>
              Verwaltung pseudonymisierter Patientendaten innerhalb der
              Anwendung
            </li>
          </ul>
        </section>

        {/* ── 3. Registrierung und Nutzerkonto ────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            3. Registrierung und Nutzerkonto
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Zur Nutzung des Dienstes ist eine Registrierung erforderlich. Der
            Nutzer ist verpflichtet, wahrheitsgem&auml;&szlig;e Angaben zu
            machen und seine Zugangsdaten vertraulich zu behandeln.
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Der Nutzer ist f&uuml;r s&auml;mtliche Aktivit&auml;ten
            verantwortlich, die unter seinem Konto stattfinden. Bei Verdacht
            auf unbefugte Nutzung ist der Anbieter unverz&uuml;glich zu
            informieren.
          </p>
        </section>

        {/* ── 4. Leistungsumfang ──────────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">4. Leistungsumfang</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            Der Anbieter stellt den Dienst in folgenden Tarifen bereit:
          </p>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold">Testphase (Kostenlos)</h3>
              <p className="text-sm text-gray-600 mt-1">
                14 Tage, alle Features, maximal 3 Patienten. Die Testphase
                endet automatisch ohne Verl&auml;ngerung.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold">Basis (29&thinsp;&euro;/Monat)</h3>
              <p className="text-sm text-gray-600 mt-1">
                Bis zu 15 Patienten, 50 Ern&auml;hrungspl&auml;ne pro Monat,
                E-Mail-Support.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold">
                Professional (59&thinsp;&euro;/Monat)
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Unbegrenzte Patienten, unbegrenzte Ern&auml;hrungspl&auml;ne,
                Priorit&auml;ts-Support.
              </p>
            </div>
          </div>

          <p className="text-gray-700 leading-relaxed mt-4">
            Der Anbieter beh&auml;lt sich vor, den Funktionsumfang
            weiterzuentwickeln und zu verbessern. Wesentliche
            Einschr&auml;nkungen werden rechtzeitig angek&uuml;ndigt.
          </p>
        </section>

        {/* ── 5. Preise und Zahlung ───────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            5. Preise und Zahlung
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Die angegebenen Preise verstehen sich inklusive der gesetzlichen
            Mehrwertsteuer. Die Abrechnung erfolgt monatlich im Voraus. Der
            Anbieter beh&auml;lt sich Preis&auml;nderungen mit einer
            Ank&uuml;ndigungsfrist von 30 Tagen vor.
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Bei Zahlungsverzug ist der Anbieter berechtigt, den Zugang zum
            Dienst nach Mahnung vor&uuml;bergehend zu sperren.
          </p>
        </section>

        {/* ── 6. Vertragslaufzeit und K&uuml;ndigung ──────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            6. Vertragslaufzeit und K&uuml;ndigung
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Der Vertrag wird auf unbestimmte Zeit geschlossen und kann von
            beiden Seiten mit einer Frist von 14 Tagen zum Ende des jeweiligen
            Abrechnungszeitraums gek&uuml;ndigt werden. Die K&uuml;ndigung
            kann per E-Mail an info@nutrikompass.de oder &uuml;ber die
            Kontoeinstellungen erfolgen.
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Das Recht zur au&szlig;erordentlichen K&uuml;ndigung aus
            wichtigem Grund bleibt unber&uuml;hrt. Nach K&uuml;ndigung hat
            der Nutzer 30 Tage Zeit, seine Daten zu exportieren. Danach werden
            die Daten unwiderruflich gel&ouml;scht.
          </p>
        </section>

        {/* ── 7. Datenschutz ──────────────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">7. Datenschutz</h2>
          <p className="text-gray-700 leading-relaxed">
            Der Anbieter verarbeitet personenbezogene Daten gem&auml;&szlig;
            den Bestimmungen der DSGVO. Einzelheiten entnehmen Sie bitte
            unserer{" "}
            <Link
              href="/datenschutz"
              className="text-[#2D6A4F] hover:underline"
            >
              Datenschutzerkl&auml;rung
            </Link>
            .
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Der Nutzer ist daf&uuml;r verantwortlich, dass die Eingabe von
            Patientendaten in pseudonymisierter Form erfolgt und keine
            direkt identifizierenden Merkmale (z.&thinsp;B. Klarnamen)
            eingegeben werden.
          </p>
        </section>

        {/* ── 8. Haftungsbeschr&auml;nkung ────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            8. Haftungsbeschr&auml;nkung
          </h2>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-amber-900 font-medium">
              Wichtiger Hinweis: NutriKompass stellt{" "}
              <strong>keine medizinische Beratung</strong> dar. Die generierten
              Ern&auml;hrungspl&auml;ne dienen ausschlie&szlig;lich als
              Unterst&uuml;tzung f&uuml;r qualifiziertes Fachpersonal und
              ersetzen nicht die individuelle fachliche Beurteilung durch
              &Auml;rzte, Ern&auml;hrungsberater oder Therapeuten.
            </p>
          </div>
          <p className="text-gray-700 leading-relaxed">
            Der Anbieter haftet unbeschr&auml;nkt bei Vorsatz und grober
            Fahrl&auml;ssigkeit sowie bei Verletzung von Leben, K&ouml;rper
            und Gesundheit. Bei leichter Fahrl&auml;ssigkeit haftet der
            Anbieter nur bei Verletzung wesentlicher Vertragspflichten
            (Kardinalpflichten), und zwar beschr&auml;nkt auf den
            vorhersehbaren, vertragstypischen Schaden.
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Der Anbieter &uuml;bernimmt keine Gew&auml;hr f&uuml;r die
            medizinische oder ern&auml;hrungswissenschaftliche Korrektheit
            der KI-generierten Inhalte. Die Verantwortung f&uuml;r die
            Anwendung der Pl&auml;ne liegt beim Fachpersonal der jeweiligen
            Einrichtung.
          </p>
        </section>

        {/* ── 9. Schlussbestimmungen ──────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            9. Schlussbestimmungen
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Es gilt das Recht der Bundesrepublik Deutschland unter
            Ausschluss des UN-Kaufrechts. Gerichtsstand f&uuml;r alle
            Streitigkeiten aus oder im Zusammenhang mit diesem Vertrag ist
            &ndash; soweit gesetzlich zul&auml;ssig &ndash; der Sitz des
            Anbieters.
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder
            werden, so ber&uuml;hrt dies die Wirksamkeit der &uuml;brigen
            Bestimmungen nicht. An die Stelle der unwirksamen Bestimmung
            tritt eine wirksame Regelung, die dem wirtschaftlichen Zweck
            der unwirksamen Bestimmung am n&auml;chsten kommt.
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Der Anbieter beh&auml;lt sich vor, diese AGB mit angemessener
            Ank&uuml;ndigungsfrist zu &auml;ndern. Die fortgesetzte Nutzung
            des Dienstes nach Inkrafttreten der &Auml;nderungen gilt als
            Zustimmung.
          </p>
        </section>

        {/* ── Stand ───────────────────────────────────────────── */}
        <p className="text-sm text-gray-500 mt-12">Stand: Dezember 2025</p>

        {/* ── Footer-Links ────────────────────────────────────── */}
        <div className="mt-8 pt-8 border-t border-gray-200 flex flex-wrap gap-6 text-sm text-gray-600">
          <Link href="/impressum" className="hover:text-[#2D6A4F] transition-colors">
            Impressum
          </Link>
          <Link href="/datenschutz" className="hover:text-[#2D6A4F] transition-colors">
            Datenschutzerkl&auml;rung
          </Link>
        </div>
      </div>
    </div>
  );
}
