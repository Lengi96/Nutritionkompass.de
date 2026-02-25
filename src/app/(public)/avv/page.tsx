import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Auftragsverarbeitungsvertrag (AVV)",
  description:
    "Auftragsverarbeitungsvertrag nach Art. 28 DSGVO zwischen mein-nutrikompass.de und Einrichtungen als Verantwortliche.",
};

export default function AVVPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A2E]">
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
        {/* Back link */}
        <Link
          href="/datenschutz"
          className="inline-flex items-center gap-1.5 text-sm text-[#2D6A4F] hover:underline mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Zur&uuml;ck zur Datenschutzerkl&auml;rung
        </Link>

        <p className="text-xs font-semibold uppercase tracking-widest text-[#2D6A4F] mb-2">
          Rechtsdokument &middot; Stand: Februar&nbsp;2026
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          Auftragsverarbeitungsvertrag
        </h1>
        <p className="text-gray-600 mb-10">
          gem&auml;&szlig; Art.&thinsp;28 DS-GVO
        </p>

        {/* Info box */}
        <div className="mb-10 rounded-xl border border-[#2D6A4F]/25 bg-[#2D6A4F]/5 p-5 text-sm text-gray-700 space-y-2">
          <p className="font-semibold text-[#2D6A4F]">
            Hinweis zur Nutzung dieses Dokuments
          </p>
          <p>
            Dieser Auftragsverarbeitungsvertrag (AVV) regelt die Verarbeitung
            personenbezogener Daten durch mein-nutrikompass.de im Auftrag
            Ihrer Einrichtung. Er ist gem&auml;&szlig; Art.&thinsp;28 DSGVO
            verpflichtend, bevor Patientendaten in den Dienst eingegeben werden.
          </p>
          <p>
            Bitte senden Sie eine ausgef&uuml;llte und unterzeichnete Version
            an{" "}
            <a
              href="mailto:c.lengowski@yahoo.de?subject=AVV-Abschluss mein-nutrikompass.de"
              className="font-medium text-[#2D6A4F] underline underline-offset-2"
            >
              c.lengowski@yahoo.de
            </a>
            . Sie erhalten eine gegengezeichnete Ausfertigung in der Regel
            innerhalb von 2&nbsp;Werktagen.
          </p>
        </div>

        {/* ── Vertragsparteien ─────────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Vertragsparteien</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#2D6A4F] mb-2">
                Auftraggeber (Verantwortlicher)
              </p>
              <p className="text-sm text-gray-700">
                Name/Bezeichnung der Einrichtung:
              </p>
              <div className="mt-2 h-px w-full bg-gray-200" />
              <p className="mt-3 text-sm text-gray-700">Adresse:</p>
              <div className="mt-2 h-px w-full bg-gray-200" />
              <div className="mt-1 h-px w-full bg-gray-200" />
              <p className="mt-3 text-sm text-gray-700">
                Vertreten durch (Name, Funktion):
              </p>
              <div className="mt-2 h-px w-full bg-gray-200" />
              <p className="mt-3 text-sm text-gray-700">
                E-Mail:
              </p>
              <div className="mt-2 h-px w-full bg-gray-200" />
              <p className="text-xs text-gray-400 mt-3">
                (nachfolgend &bdquo;Auftraggeber&ldquo;)
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#2D6A4F] mb-2">
                Auftragnehmer (Auftragsverarbeiter)
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Christoph Lengowski
                <br />
                Adreystra&szlig;e 116
                <br />
                44225 Dortmund
                <br />
                E-Mail: c.lengowski@yahoo.de
              </p>
              <p className="text-xs text-gray-400 mt-3">
                (nachfolgend &bdquo;Auftragnehmer&ldquo; oder
                &bdquo;mein-nutrikompass.de&ldquo;)
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed mt-4">
            Auftraggeber und Auftragnehmer schlie&szlig;en folgenden
            Auftragsverarbeitungsvertrag (AVV) gem&auml;&szlig;
            Art.&thinsp;28 DS-GVO ab (nachfolgend &bdquo;Vertrag&ldquo;):
          </p>
        </section>

        {/* ── § 1 Gegenstand und Dauer ─────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            &sect;&thinsp;1 &ndash; Gegenstand und Dauer der Verarbeitung
          </h2>
          <p className="text-gray-700 leading-relaxed">
            (1) Der Auftragnehmer verarbeitet personenbezogene Daten im
            Auftrag des Auftraggebers im Rahmen der Bereitstellung und
            Nutzung des webbasierten SaaS-Dienstes mein-nutrikompass.de
            (nachfolgend &bdquo;Dienst&ldquo;) gem&auml;&szlig; den
            zugrunde liegenden Allgemeinen Gesch&auml;ftsbedingungen (AGB)
            sowie den vertraglichen Vereinbarungen zwischen den Parteien.
          </p>
          <p className="text-gray-700 leading-relaxed mt-3">
            (2) Die Laufzeit dieses Vertrages entspricht der Laufzeit des
            Hauptvertrages (&uuml;ber die Nutzung des Dienstes). Er endet
            automatisch mit Beendigung des Hauptvertrages, es sei denn, die
            Parteien haben eine gesonderte Regelung zur Datenl&ouml;schung
            oder &ndash;r&uuml;ckgabe vereinbart.
          </p>
        </section>

        {/* ── § 2 Art, Zweck, Kategorien ───────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            &sect;&thinsp;2 &ndash; Art, Zweck und Umfang der Verarbeitung
          </h2>
          <p className="text-gray-700 leading-relaxed">
            (1) <strong>Art der Verarbeitung:</strong> Erhebung, Speicherung,
            Verarbeitung, &Uuml;bermittlung an KI-Dienste (pseudonymisiert),
            Strukturierung und L&ouml;schung personenbezogener Daten.
          </p>
          <p className="text-gray-700 leading-relaxed mt-3">
            (2) <strong>Zweck:</strong> KI-gest&uuml;tzte Erstellung von
            Ern&auml;hrungspl&auml;nen, Generierung von Einkaufslisten,
            PDF-Export sowie Handover-Dokumentation im Rahmen der Betreuung
            von Personen mit Essst&ouml;rungen in der jeweiligen Einrichtung
            des Auftraggebers.
          </p>
          <p className="text-gray-700 leading-relaxed mt-3">
            (3) <strong>Kategorien betroffener Personen:</strong> Patienten
            und Bewohner der Einrichtung des Auftraggebers (ausschlie&szlig;lich
            in pseudonymisierter Form ohne Klarnamen).
          </p>
          <p className="text-gray-700 leading-relaxed mt-3">
            (4) <strong>Kategorien personenbezogener Daten:</strong>
          </p>
          <ul className="mt-2 list-disc list-inside text-gray-700 space-y-1.5 ml-4">
            <li>
              Pseudonyme/K&uuml;rzel (keine Klarnamen), Alter, Geschlecht
            </li>
            <li>
              Diagnose-K&uuml;rzel und Ern&auml;hrungsdiagnosen
              (z.&thinsp;B. Essst&ouml;rungstyp)
            </li>
            <li>
              Ern&auml;hrungspr&auml;ferenzen, Unvertr&auml;glichkeiten,
              Allergien
            </li>
            <li>
              K&ouml;rpergewicht, Zielgewicht, Energiebedarf (kkal)
            </li>
            <li>
              Erstellte Ern&auml;hrungspl&auml;ne und Einkaufslisten
            </li>
            <li>
              Nutzungsdaten der Mitarbeiter des Auftraggebers (Login-Zeiten,
              bearbeitete Datens&auml;tze)
            </li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-3">
            (5) <strong>Besondere Kategorien (Art.&thinsp;9 DSGVO):</strong>{" "}
            Die verarbeiteten Diagnosedaten k&ouml;nnen Gesundheitsdaten im
            Sinne von Art.&thinsp;9 Abs.&thinsp;1 DSGVO darstellen. Der
            Auftraggeber ist verpflichtet, sicherzustellen, dass die
            Verarbeitung dieser Daten auf einer geeigneten Rechtsgrundlage
            gem&auml;&szlig; Art.&thinsp;9 Abs.&thinsp;2 DSGVO beruht.
            <strong>
              {" "}
              Es d&uuml;rfen ausschlie&szlig;lich pseudonymisierte Daten
              ohne direkte Identifizierungsmerkmale eingegeben werden.
            </strong>
          </p>
        </section>

        {/* ── § 3 Weisungsbindung ──────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            &sect;&thinsp;3 &ndash; Weisungsbindung des Auftragnehmers
          </h2>
          <p className="text-gray-700 leading-relaxed">
            (1) Der Auftragnehmer verarbeitet die personenbezogenen Daten
            ausschlie&szlig;lich auf dokumentierte Weisung des Auftraggebers
            &ndash; auch in Bezug auf die &Uuml;bermittlung
            personenbezogener Daten an ein Drittland oder eine internationale
            Organisation &ndash;, es sei denn, er ist durch das Recht der
            Union oder der Mitgliedstaaten, dem der Auftragnehmer
            unterliegt, zur Verarbeitung verpflichtet.
          </p>
          <p className="text-gray-700 leading-relaxed mt-3">
            (2) Weisungen erteilt der Auftraggeber grunds&auml;tzlich
            schriftlich. In dringenden F&auml;llen k&ouml;nnen Weisungen
            m&uuml;ndlich erteilt werden; diese sind unverz&uuml;glich
            schriftlich zu best&auml;tigen.
          </p>
          <p className="text-gray-700 leading-relaxed mt-3">
            (3) Der Auftragnehmer informiert den Auftraggeber
            unverz&uuml;glich, wenn er der Auffassung ist, eine Weisung
            verst&ouml;&szlig;t gegen datenschutzrechtliche Bestimmungen.
            Der Auftragnehmer ist berechtigt, die Ausf&uuml;hrung der
            betreffenden Weisung so lange auszusetzen, bis der Auftraggeber
            sie best&auml;tigt oder ge&auml;ndert hat.
          </p>
        </section>

        {/* ── § 4 Pflichten Auftragnehmer ──────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            &sect;&thinsp;4 &ndash; Pflichten des Auftragnehmers
          </h2>

          <h3 className="font-semibold text-[#1A1A2E] mt-4 mb-2">
            Vertraulichkeit
          </h3>
          <p className="text-gray-700 leading-relaxed">
            (1) Der Auftragnehmer gew&auml;hrleistet, dass alle Personen,
            die mit der Verarbeitung der personenbezogenen Daten des
            Auftraggebers betraut sind, zur Vertraulichkeit verpflichtet
            wurden oder einer angemessenen gesetzlichen
            Verschwiegenheitspflicht unterliegen.
          </p>

          <h3 className="font-semibold text-[#1A1A2E] mt-4 mb-2">
            Technische und organisatorische Ma&szlig;nahmen (TOMs)
          </h3>
          <p className="text-gray-700 leading-relaxed">
            (2) Der Auftragnehmer trifft alle nach Art.&thinsp;32 DSGVO
            erforderlichen Ma&szlig;nahmen zur Sicherung der Verarbeitung.
            Die zum Zeitpunkt des Vertragsschlusses implementierten TOMs
            sind in <strong>Anlage&thinsp;2</strong> dieses Vertrages
            aufgef&uuml;hrt. Der Auftragnehmer ist berechtigt, die
            Ma&szlig;nahmen fortzuschreiben und anzupassen, sofern das
            Sicherheitsniveau nicht unterschritten wird.
          </p>

          <h3 className="font-semibold text-[#1A1A2E] mt-4 mb-2">
            Unterst&uuml;tzung bei Betroffenenrechten
          </h3>
          <p className="text-gray-700 leading-relaxed">
            (3) Der Auftragnehmer unterst&uuml;tzt den Auftraggeber unter
            Ber&uuml;cksichtigung der Art der Verarbeitung durch geeignete
            technische und organisatorische Ma&szlig;nahmen dabei, seinen
            Verpflichtungen zur Beantwortung von Antr&auml;gen auf
            Wahrnehmung der Rechte der betroffenen Personen
            nachzukommen.
          </p>

          <h3 className="font-semibold text-[#1A1A2E] mt-4 mb-2">
            Unterst&uuml;tzung bei Datenschutzpflichten
          </h3>
          <p className="text-gray-700 leading-relaxed">
            (4) Der Auftragnehmer unterst&uuml;tzt den Auftraggeber
            bei der Einhaltung der in den Art.&thinsp;32 bis 36 DSGVO
            genannten Pflichten (Datensicherheit, Meldung von
            Datenpannen, Datenschutz-Folgenabsch&auml;tzung und
            vorherige Konsultation).
          </p>

          <h3 className="font-semibold text-[#1A1A2E] mt-4 mb-2">
            R&uuml;ckgabe und L&ouml;schung
          </h3>
          <p className="text-gray-700 leading-relaxed">
            (5) Nach Abschluss der Erbringung der Verarbeitungsleistungen
            l&ouml;scht oder gibt der Auftragnehmer nach Wahl des
            Auftraggebers alle personenbezogenen Daten zur&uuml;ck und
            l&ouml;scht vorhandene Kopien, sofern nicht nach dem Recht
            der Union oder der Mitgliedstaaten eine Verpflichtung zur
            Speicherung der personenbezogenen Daten besteht.
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Der Auftraggeber hat nach Vertragsbeendigung
            30&nbsp;Tage Zeit, seine Daten &uuml;ber die
            Export-Funktion des Dienstes selbst zu exportieren.
            Danach werden alle Daten unwiderruflich gel&ouml;scht.
          </p>

          <h3 className="font-semibold text-[#1A1A2E] mt-4 mb-2">
            Nachweispflicht
          </h3>
          <p className="text-gray-700 leading-relaxed">
            (6) Der Auftragnehmer stellt dem Auftraggeber alle
            Informationen zur Verf&uuml;gung, die zur Nachweisf&uuml;hrung
            der Einhaltung der in Art.&thinsp;28 DSGVO niedergelegten
            Pflichten erforderlich sind, und erm&ouml;glicht Audits
            einschlie&szlig;lich Inspektionen, die vom Auftraggeber oder
            einem anderen vom Auftraggeber beauftragten Pr&uuml;fer
            durchgef&uuml;hrt werden, und tr&auml;gt zu diesen bei.
          </p>
        </section>

        {/* ── § 5 Pflichten Auftraggeber ────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            &sect;&thinsp;5 &ndash; Pflichten des Auftraggebers
          </h2>
          <p className="text-gray-700 leading-relaxed">
            (1) Der Auftraggeber ist im Verh&auml;ltnis zum Auftragnehmer
            allein Verantwortlicher f&uuml;r die Rechtm&auml;&szlig;igkeit
            der Verarbeitung der personenbezogenen Daten,
            insbesondere f&uuml;r die Beurteilung der Zul&auml;ssigkeit
            der Datenverarbeitung und die Wahrung der Rechte der
            betroffenen Personen.
          </p>
          <p className="text-gray-700 leading-relaxed mt-3">
            (2) Der Auftraggeber ist verpflichtet, ausschlie&szlig;lich
            pseudonymisierte Daten ohne Klarnamen in den Dienst
            einzugeben. Die fachliche Verantwortung f&uuml;r alle
            generierten Ern&auml;hrungspl&auml;ne liegt beim qualifizierten
            Fachpersonal des Auftraggebers.
          </p>
          <p className="text-gray-700 leading-relaxed mt-3">
            (3) Der Auftraggeber informiert den Auftragnehmer
            unverz&uuml;glich und vollst&auml;ndig, wenn er bei der
            Pr&uuml;fung der Auftragsergebnisse Fehler oder
            Unregelm&auml;&szlig;igkeiten bez&uuml;glich
            datenschutzrechtlicher Bestimmungen feststellt.
          </p>
        </section>

        {/* ── § 6 Datenpannenmeldung ───────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            &sect;&thinsp;6 &ndash; Meldung von
            Datenschutzverletzungen
          </h2>
          <p className="text-gray-700 leading-relaxed">
            (1) Der Auftragnehmer unterst&uuml;tzt den Auftraggeber bei
            der Einhaltung seiner Meldepflichten gem&auml;&szlig;
            Art.&thinsp;33 und 34 DSGVO. Er meldet dem Auftraggeber
            Verletzungen des Schutzes personenbezogener Daten
            unverz&uuml;glich, sobald er davon Kenntnis erh&auml;lt,
            sp&auml;testens jedoch innerhalb von
            <strong> 72&nbsp;Stunden</strong>.
          </p>
          <p className="text-gray-700 leading-relaxed mt-3">
            (2) Die Meldung erfolgt per E-Mail an die vom Auftraggeber
            hinterlegte Kontaktadresse und enth&auml;lt mindestens:
          </p>
          <ul className="mt-2 list-disc list-inside text-gray-700 space-y-1 ml-4">
            <li>Art der Verletzung (soweit m&ouml;glich)</li>
            <li>
              Kategorien und ungef&auml;hre Anzahl betroffener Personen
            </li>
            <li>
              Kategorien und ungef&auml;hre Anzahl betroffener
              Datens&auml;tze
            </li>
            <li>
              Wahrscheinliche Folgen der Datenschutzverletzung
            </li>
            <li>
              Ergriffene oder vorgeschlagene Ma&szlig;nahmen zur Behebung
            </li>
          </ul>
        </section>

        {/* ── § 7 Unterauftragnehmer ───────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            &sect;&thinsp;7 &ndash; Unterauftragsverh&auml;ltnisse
          </h2>
          <p className="text-gray-700 leading-relaxed">
            (1) Der Auftraggeber erteilt dem Auftragnehmer hiermit die
            allgemeine Genehmigung zur Hinzuziehung der in{" "}
            <strong>Anlage&thinsp;1</strong> aufgef&uuml;hrten weiteren
            Auftragsverarbeiter (Unterauftragnehmer). Der Auftragnehmer
            informiert den Auftraggeber rechtzeitig &uuml;ber beabsichtigte
            &Auml;nderungen in Bezug auf die Hinzuziehung oder Ersetzung
            weiterer Auftragsverarbeiter, damit der Auftraggeber die
            M&ouml;glichkeit hat, Einw&auml;nde zu erheben.
          </p>
          <p className="text-gray-700 leading-relaxed mt-3">
            (2) Der Auftragnehmer legt seinen Unterauftragnehmern
            vergleichbare datenschutzrechtliche Verpflichtungen auf,
            wie sie in diesem Vertrag enthalten sind.
          </p>
          <p className="text-gray-700 leading-relaxed mt-3">
            (3) Werden Daten in Drittl&auml;nder &uuml;bermittelt
            (insbesondere an OpenAI, USA), erfolgt dies auf Grundlage
            der EU-Standardvertragsklauseln (Art.&thinsp;46 Abs.&thinsp;2
            lit.&thinsp;c DSGVO) oder anderer geeigneter Garantien.
          </p>
        </section>

        {/* ── § 8 Kontrollrechte ───────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            &sect;&thinsp;8 &ndash; Kontroll- und Pr&uuml;fungsrechte
          </h2>
          <p className="text-gray-700 leading-relaxed">
            (1) Der Auftraggeber ist berechtigt, die Einhaltung der
            Vorschriften &uuml;ber den Datenschutz und der vertraglichen
            Vereinbarungen beim Auftragnehmer in angemessenem Umfang zu
            kontrollieren oder durch im Einzelfall zu benennende
            Pr&uuml;fer kontrollieren zu lassen.
          </p>
          <p className="text-gray-700 leading-relaxed mt-3">
            (2) Der Auftragnehmer kann als gleichwertigen Nachweis
            aktuelle Zertifizierungen, Auditberichte oder
            Eigenausk&uuml;nfte vorlegen. Umfassendere Vor-Ort-Pr&uuml;fungen
            sind nach vorheriger Ank&uuml;ndigung von mindestens
            14&nbsp;Tagen m&ouml;glich und d&uuml;rfen den
            Gesch&auml;ftsbetrieb nicht unzumutbar beeintr&auml;chtigen.
          </p>
          <p className="text-gray-700 leading-relaxed mt-3">
            (3) Kosten einer Pr&uuml;fung tr&auml;gt der Auftraggeber,
            es sei denn, die Pr&uuml;fung ergibt wesentliche
            Pflichtverletzungen des Auftragnehmers.
          </p>
        </section>

        {/* ── § 9 Schlussbestimmungen ──────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">
            &sect;&thinsp;9 &ndash; Schlussbestimmungen
          </h2>
          <p className="text-gray-700 leading-relaxed">
            (1) Dieser Vertrag unterliegt dem Recht der Bundesrepublik
            Deutschland. Erf&uuml;llungsort und Gerichtsstand ist, soweit
            gesetzlich zul&auml;ssig, Dortmund.
          </p>
          <p className="text-gray-700 leading-relaxed mt-3">
            (2) &Auml;nderungen und Erg&auml;nzungen dieses Vertrages
            bed&uuml;rfen der Schriftform oder einer gleichwertigen
            elektronischen Form. Dies gilt auch f&uuml;r das Abweichen
            vom Schriftformerfordernis selbst.
          </p>
          <p className="text-gray-700 leading-relaxed mt-3">
            (3) Sollten einzelne Bestimmungen dieses Vertrages ganz oder
            teilweise unwirksam oder undurchf&uuml;hrbar sein oder
            werden, ber&uuml;hrt dies die G&uuml;ltigkeit der
            &uuml;brigen Bestimmungen nicht.
          </p>
        </section>

        {/* ── Unterschriften ──────────────────────────────── */}
        <section className="mb-10 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold mb-4">Unterschriften</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                Auftraggeber (Einrichtung)
              </p>
              <div className="mt-8 border-b border-gray-300" />
              <p className="mt-1 text-xs text-gray-400">
                Ort, Datum, Unterschrift, Name in Druckschrift
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                Auftragnehmer &ndash; mein-nutrikompass.de
              </p>
              <div className="mt-8 border-b border-gray-300" />
              <p className="mt-1 text-xs text-gray-400">
                Ort, Datum, Unterschrift, Christoph Lengowski
              </p>
            </div>
          </div>
        </section>

        {/* ══════════ ANLAGE 1 – Unterauftragnehmer ══════════ */}
        <div className="mt-16 pt-8 border-t-2 border-[#2D6A4F]/20">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#2D6A4F] mb-1">
            Anlage 1
          </p>
          <h2 className="text-2xl font-bold mb-2">
            Liste der Unterauftragnehmer
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            Stand: Februar&nbsp;2026 &ndash; Der Auftragnehmer wird den
            Auftraggeber &uuml;ber &Auml;nderungen informieren.
          </p>

          <div className="space-y-4">
            {/* Supabase */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold text-[#1A1A2E]">Supabase Inc.</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    970 Trestle Glen Rd, Oakland, CA 94610, USA
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  EU-Datenbankserver
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-3">
                <strong>Zweck:</strong> Datenbankhosting, Authentifizierung,
                Datenspeicherung
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>Serverstandort:</strong> EU (Frankfurt am Main,
                Deutschland) via AWS
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>Rechtsgrundlage:</strong> AVV gem.
                Art.&thinsp;28 DSGVO mit Supabase abgeschlossen; EU-Server
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>Datenkategorien:</strong> Alle im Dienst gespeicherten
                personenbezogenen Daten (pseudonymisiert)
              </p>
            </div>

            {/* OpenAI */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold text-[#1A1A2E]">
                    OpenAI, L.L.C.
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    3180 18th Street, San Francisco, CA 94110, USA
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  USA &middot; SCCs
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-3">
                <strong>Zweck:</strong> KI-gest&uuml;tzte Generierung von
                Ern&auml;hrungspl&auml;nen via API (GPT-4)
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>Serverstandort:</strong> USA
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>Rechtsgrundlage:</strong>{" "}
                EU-Standardvertragsklauseln gem. Art.&thinsp;46
                Abs.&thinsp;2 lit.&thinsp;c DSGVO; OpenAI verpflichtet
                sich, API-Daten nicht f&uuml;r Modelltraining zu verwenden
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>Datenkategorien:</strong>{" "}
                <strong>
                  Ausschlie&szlig;lich pseudonymisierte Daten
                </strong>{" "}
                (Alter, Geschlecht, Diagnose-K&uuml;rzel,
                Ern&auml;hrungspr&auml;ferenzen). Keine Klarnamen, keine
                direkten Identifikationsmerkmale.
              </p>
            </div>

            {/* Resend */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold text-[#1A1A2E]">Resend Inc.</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    2261 Market Street #4008, San Francisco, CA 94114, USA
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  E-Mail-Versand
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-3">
                <strong>Zweck:</strong> Transaktionale E-Mails
                (Registrierung, Passwort-Reset, Benachrichtigungen)
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>Rechtsgrundlage:</strong>{" "}
                EU-Standardvertragsklauseln; DSGVO-konformer
                E-Mail-Dienstleister
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>Datenkategorien:</strong> E-Mail-Adressen der
                Nutzer (Mitarbeiter der Einrichtung), kein Patientenbezug
              </p>
            </div>

            {/* Netlify */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold text-[#1A1A2E]">Netlify Inc.</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    44 Montgomery Street, Suite 300, San Francisco, CA 94104,
                    USA
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                  Anwendungshosting
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-3">
                <strong>Zweck:</strong> Hosting der Webanwendung
                (Next.js), Serverless Functions, CDN
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>Rechtsgrundlage:</strong>{" "}
                EU-Standardvertragsklauseln; Netlify DPA abgeschlossen
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>Datenkategorien:</strong> Log-Daten, IP-Adressen
                (transient), keine Patientendaten direkt
              </p>
            </div>
          </div>
        </div>

        {/* ══════════ ANLAGE 2 – TOMs ════════════════════════ */}
        <div className="mt-16 pt-8 border-t-2 border-[#2D6A4F]/20">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#2D6A4F] mb-1">
            Anlage 2
          </p>
          <h2 className="text-2xl font-bold mb-2">
            Technische und organisatorische Ma&szlig;nahmen (TOMs)
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            gem&auml;&szlig; Art.&thinsp;32 DSGVO &ndash; Stand:
            Februar&nbsp;2026
          </p>

          <div className="space-y-5">
            {/* Zugangskontrolle */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="font-semibold text-[#1A1A2E] mb-2">
                1. Zugangskontrolle (Unbefugte Nutzung verhindern)
              </p>
              <ul className="text-sm text-gray-700 space-y-1.5 list-disc list-inside ml-2">
                <li>
                  HTTPS/TLS-Verschl&uuml;sselung f&uuml;r alle
                  Daten&uuml;bertragungen (TLS 1.2/1.3)
                </li>
                <li>
                  Passwortgesch&uuml;tzte Benutzerkonten mit
                  Mindestanforderungen (8 Zeichen)
                </li>
                <li>
                  Optional: Zwei-Faktor-Authentifizierung
                  (2FA) f&uuml;r Nutzerkonten
                </li>
                <li>
                  Automatischer Session-Timeout nach
                  Inaktivit&auml;t
                </li>
                <li>
                  Sichere Passwort-Reset-Prozesse mit
                  zeitlich begrenzten Tokens
                </li>
              </ul>
            </div>

            {/* Zugriffskontrolle */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="font-semibold text-[#1A1A2E] mb-2">
                2. Zugriffskontrolle (Nur berechtigte Zugriffe auf Daten)
              </p>
              <ul className="text-sm text-gray-700 space-y-1.5 list-disc list-inside ml-2">
                <li>
                  Rollenbasierte Zugriffskontrolle (RBAC):
                  Datenzugriff nur nach Rolle und Berechtigung
                </li>
                <li>
                  Row Level Security (RLS) in Supabase:
                  jeder Nutzer sieht nur eigene Organisations-Daten
                </li>
                <li>
                  Mandantenf&auml;higkeit: strikte Datentrennung
                  zwischen verschiedenen Einrichtungen
                </li>
                <li>
                  Kein Zugriff des Auftragnehmers auf
                  Patientendaten ohne Weisung
                </li>
              </ul>
            </div>

            {/* Weitergabekontrolle */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="font-semibold text-[#1A1A2E] mb-2">
                3. Weitergabekontrolle (Unbefugte &Uuml;bermittlung verhindern)
              </p>
              <ul className="text-sm text-gray-700 space-y-1.5 list-disc list-inside ml-2">
                <li>
                  Verschl&uuml;sselter Datentransport (HTTPS/TLS)
                  f&uuml;r alle API-Kommunikation
                </li>
                <li>
                  An KI-Dienste (OpenAI) werden{" "}
                  <strong>ausschlie&szlig;lich pseudonymisierte</strong>{" "}
                  Daten &uuml;bermittelt
                </li>
                <li>
                  Keine Weitergabe von Patientendaten an Dritte
                  ohne AVV und Rechtsgrundlage
                </li>
                <li>
                  Protokollierung der API-Aufrufe (Logging)
                </li>
              </ul>
            </div>

            {/* Eingabekontrolle */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="font-semibold text-[#1A1A2E] mb-2">
                4. Eingabekontrolle (Nachvollziehbarkeit)
              </p>
              <ul className="text-sm text-gray-700 space-y-1.5 list-disc list-inside ml-2">
                <li>
                  Aktivit&auml;tslogs: Wer hat wann welchen Datensatz
                  erstellt, ge&auml;ndert oder gel&ouml;scht
                </li>
                <li>
                  Versionierung von Ern&auml;hrungspl&auml;nen
                  (Handover-Dokumentation)
                </li>
                <li>
                  Datenbankebene: atomare Transaktionen,
                  keine unbemerkten Daten&auml;nderungen
                </li>
              </ul>
            </div>

            {/* Verfügbarkeitskontrolle */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="font-semibold text-[#1A1A2E] mb-2">
                5. Verf&uuml;gbarkeitskontrolle (Datensicherung)
              </p>
              <ul className="text-sm text-gray-700 space-y-1.5 list-disc list-inside ml-2">
                <li>
                  Automatische t&auml;gliche Backups durch Supabase
                  (Point-in-Time Recovery, PITR)
                </li>
                <li>
                  Redundante Infrastruktur &uuml;ber AWS (Frankfurt)
                </li>
                <li>
                  Monitoring der Systemverf&uuml;gbarkeit
                </li>
                <li>
                  Daten werden nicht lokal beim Auftragnehmer gespeichert
                </li>
              </ul>
            </div>

            {/* Pseudonymisierung */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="font-semibold text-[#1A1A2E] mb-2">
                6. Pseudonymisierung und Datensparsamkeit
              </p>
              <ul className="text-sm text-gray-700 space-y-1.5 list-disc list-inside ml-2">
                <li>
                  Technisches Design: das System fordert keine Klarnamen
                  f&uuml;r Patienten (nur K&uuml;rzel/IDs)
                </li>
                <li>
                  Datensparsamkeit: es werden nur die f&uuml;r die
                  Ern&auml;hrungsplanung notwendigen Datenfelder
                  bereitgestellt
                </li>
                <li>
                  UI-Hinweise f&uuml;r Mitarbeiter zur Pseudonymisierungspflicht
                </li>
              </ul>
            </div>

            {/* Trennungsgebot */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="font-semibold text-[#1A1A2E] mb-2">
                7. Trennungsgebot (Mandantentrennung)
              </p>
              <ul className="text-sm text-gray-700 space-y-1.5 list-disc list-inside ml-2">
                <li>
                  Logische Trennung der Daten verschiedener Auftraggeber
                  auf Datenbankebene (Organization-ID, RLS)
                </li>
                <li>
                  Kein Auftraggeber kann auf Daten eines anderen
                  zugreifen
                </li>
                <li>
                  Getrennte API-Keys und Authentifizierungstokens
                  pro Nutzerorganisation
                </li>
              </ul>
            </div>

            {/* Organisatorische Maßnahmen */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="font-semibold text-[#1A1A2E] mb-2">
                8. Organisatorische Ma&szlig;nahmen
              </p>
              <ul className="text-sm text-gray-700 space-y-1.5 list-disc list-inside ml-2">
                <li>
                  Datenschutzrechtliche Verpflichtung aller Personen,
                  die Zugang zu Kundendaten haben
                </li>
                <li>
                  Alle Unterauftragnehmer sind vertraglich zu
                  DSGVO-Compliance verpflichtet (AVVs abgeschlossen)
                </li>
                <li>
                  Incident-Response-Prozess f&uuml;r
                  Datenschutzverletzungen (72h-Meldepflicht)
                </li>
                <li>
                  Regelm&auml;&szlig;ige &Uuml;berpr&uuml;fung und
                  Aktualisierung der Sicherheitsma&szlig;nahmen
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Stand ───────────────────────────────────────── */}
        <p className="text-sm text-gray-500 mt-12">
          Stand: Februar 2026 &middot; mein-nutrikompass.de &middot;
          Christoph Lengowski, Dortmund
        </p>

        {/* ── Footer-Links ────────────────────────────────── */}
        <div className="mt-8 pt-8 border-t border-gray-200 flex flex-wrap gap-6 text-sm text-gray-600">
          <Link
            href="/impressum"
            className="hover:text-[#2D6A4F] transition-colors"
          >
            Impressum
          </Link>
          <Link
            href="/datenschutz"
            className="hover:text-[#2D6A4F] transition-colors"
          >
            Datenschutzerkl&auml;rung
          </Link>
          <Link href="/agb" className="hover:text-[#2D6A4F] transition-colors">
            AGB
          </Link>
        </div>
      </div>
    </div>
  );
}
