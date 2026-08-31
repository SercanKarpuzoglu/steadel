import type { Guide } from "@/app/guides/guides-content";

/** A German guide, plus the English slug it corresponds to (for hreflang). */
export type GuideDe = Guide & { enSlug: string };

export const GUIDES_DE: GuideDe[] = [
  {
    slug: "dsgvo-konforme-lagerbestand-warnungen",
    enSlug: "gdpr-low-stock-alerts",
    seoTitle: "DSGVO-konforme Lagerbestand-Warnungen für Shopify & WooCommerce",
    seoDescription:
      "Warnungen bei niedrigem Lagerbestand und Bestandsberichte, ohne dass Ihre Shop-Daten in die USA fließen. Gehostet in Deutschland, DSGVO-konform, kein Tracking.",
    eyebrow: "Leitfaden · Lager & Datenschutz",
    h1: "DSGVO-konforme Lagerbestand-Warnungen für Shopify & WooCommerce",
    lede: "Wenn Sie einen Shop in der EU betreiben, sieht das Tool, das Ihren Lagerbestand überwacht, Ihre Produkte, Ihre Bestände und Ihre Verkaufsmuster. So bekommen Sie zuverlässige Warnungen, ohne dass diese Daten die EU verlassen.",
    readMinutes: 4,
    sections: [
      {
        h2: "Warum es zählt, wo Ihr Bestandstool läuft",
        paras: [
          "Die meisten Apps für Lagerbestand-Warnungen stammen von US-Unternehmen und verarbeiten Ihre Daten auf US-Infrastruktur. Für Händler in der EU bedeutet das eine Übermittlung personenbezogener und geschäftlicher Daten in die USA — genau das, was die Schrems-Urteile riskant gemacht haben, und was Sie in Ihrer eigenen Datenschutzerklärung offenlegen müssen.",
          "Bestandsdaten wirken harmlos, bis man sich klarmacht, dass sie mit Bestellungen verknüpft sind — und Bestellungen mit Menschen. Die gesamte Kette in der EU zu halten ist der einfachste Weg, hier eindeutig auf der sicheren Seite zu bleiben.",
        ],
      },
      {
        h2: "Was „in Deutschland gehostet“ konkret bedeutet",
        paras: [
          "Steadel läuft vollständig auf Infrastruktur in Deutschland. Ihre Shop-Daten werden in der EU gelesen, verarbeitet und gespeichert — im Kernprodukt gibt es keinen US-Unterauftragsverarbeiter.",
        ],
        bullets: [
          "Gehostet in Deutschland; Ihre Daten bleiben in der EU.",
          "Keine Tracking-Cookies und keine Werbe-Pixel — die App selbst kommt ohne Analyse-Tools aus.",
          "Nur Lesezugriff, niemals Schreibzugriff. Steadel liest Produkte und Bestände und speichert nichts über Ihre Kunden oder Bestellungen.",
        ],
      },
      {
        h2: "Wie die Warnungen funktionieren",
        paras: [
          "Sie verbinden einen Shop, legen einen Schwellenwert fest — etwa 10 Stück — und wählen, wo Sie benachrichtigt werden möchten. Fällt ein Produkt darunter, sendet Steadel eine Warnung per E-Mail oder Slack. Shopify meldet Änderungen per Webhook, dort kommen Warnungen innerhalb von Sekunden an; WooCommerce-Shops werden alle 10 Minuten geprüft, rechnen Sie dort also mit einigen Minuten.",
          "Geplante Berichte ergänzen den ruhigeren Blick: eine regelmäßige Übersicht, was knapp wird und was bald ausgeht, direkt in Ihr Postfach — damit niemand ein Dashboard beobachten muss.",
        ],
      },
      {
        h2: "Einrichtung",
        paras: ["Das dauert wenige Minuten und erfordert keine Entwicklung:"],
        bullets: [
          "Kostenlose Testphase starten und Shopify oder WooCommerce verbinden.",
          "Schwellenwert pro Shop festlegen — später jederzeit anpassbar.",
          "E-Mail oder Slack für Warnungen wählen und einen Zeitplan für Berichte festlegen.",
        ],
      },
    ],
    faq: [
      {
        q: "Werden meine Shop-Daten in die USA übertragen?",
        a: "Nein. Das Kernprodukt von Steadel läuft auf Infrastruktur in Deutschland und verarbeitet Ihre Daten in der EU.",
      },
      {
        q: "Welchen Zugriff benötigt Steadel?",
        a: "Nur Lesezugriff — Steadel fordert niemals Schreibzugriff an. Bei Shopify werden ausschließlich die Berechtigungen für Produkte und Bestände angefragt. Der Freigabedialog von WooCommerce ist gröber: Er bietet nur shopweiten Lese- oder Schreibzugriff an und listet deshalb mehr auf, als Steadel tatsächlich nutzt. Steadel fordert Lesezugriff an, liest nur Produkte und Bestände und speichert nichts über Ihre Kunden oder Bestellungen.",
      },
      {
        q: "Funktioniert das mit Shopify und mit WooCommerce?",
        a: "Ja, beide werden unterstützt — mit denselben Warnungen und Berichten.",
      },
    ],
  },
  {
    slug: "woocommerce-lagerbestand-benachrichtigung",
    enSlug: "woocommerce-low-stock-notifications",
    seoTitle: "WooCommerce Lagerbestand-Benachrichtigung: was eingebaut ist und was fehlt",
    seoDescription:
      "WooCommerce kann Sie per E-Mail warnen, wenn der Bestand knapp wird. So aktivieren Sie es, das leisten die eingebauten Benachrichtigungen — und hier stoßen sie an ihre Grenzen.",
    eyebrow: "Leitfaden · WooCommerce",
    h1: "WooCommerce Lagerbestand-Benachrichtigung: was eingebaut ist und was fehlt",
    lede: "WooCommerce bringt Benachrichtigungen bei niedrigem Bestand bereits mit, und für einen kleinen Katalog genügen sie womöglich völlig. Bevor Sie für etwas anderes bezahlen, sollten Sie wissen, was sie genau leisten — hier die ehrliche Fassung.",
    readMinutes: 5,
    sections: [
      {
        h2: "Die eingebauten Benachrichtigungen aktivieren",
        paras: [
          "WooCommerce hat diese Funktion bereits, und erstaunlich viele Shops schalten sie nie ein. Gehen Sie im WordPress-Adminbereich zu WooCommerce → Einstellungen → Produkte → Lagerbestand. Dort aktivieren Sie Benachrichtigungen bei niedrigem und bei ausverkauftem Bestand, legen die Schwellenwerte fest und bestimmen, an welche Adresse sie gehen.",
          "Wenn Sie physische Ware verkaufen und diese Seite noch nie geöffnet haben, tun Sie das zuerst. Es kostet nichts — und ist besser, als es von einem Kunden zu erfahren.",
        ],
        bullets: [
          "Benachrichtigung bei niedrigem Bestand — der Hauptschalter für die E-Mails.",
          "Schwellenwert für niedrigen Bestand — die shopweite Zahl, ab der ein Produkt als knapp gilt.",
          "Empfänger der Benachrichtigung — wer die E-Mail erhält; standardmäßig die Admin-Adresse.",
        ],
      },
      {
        h2: "Schwellenwerte pro Produkt",
        paras: [
          "Eine einzige Zahl passt selten auf einen ganzen Katalog. Ein Produkt, von dem Sie vierzig Stück pro Woche verkaufen, ist bei 20 Stück bereits kritisch; etwas, das einmal im Monat weggeht, ist bei 3 Stück völlig in Ordnung. WooCommerce erlaubt es, den shopweiten Schwellenwert im Reiter „Lagerbestand“ eines einzelnen Produkts zu überschreiben.",
          "Nutzen Sie das zumindest für Ihre Bestseller. Es entscheidet darüber, ob eine Warnung rechtzeitig zum Nachbestellen ankommt oder erst hinterher.",
        ],
      },
      {
        h2: "Wo die eingebauten E-Mails an ihre Grenzen stoßen",
        paras: [
          "Das sind keine Fehler — es ist die natürliche Grenze einer Funktion, die mit einer Shop-Plattform mitgeliefert wird und nicht eigens für diese Aufgabe gebaut wurde.",
        ],
        bullets: [
          "Nur E-Mail. Es gibt kein Slack und keinen anderen Kanal — arbeitet Ihr Team woanders, kommt die Warnung dort nicht an.",
          "Eine E-Mail pro Produktereignis. Bei großem Katalog wird daraus ein Strom, den man zu ignorieren lernt — was dasselbe ist wie gar keine Warnungen.",
          "Keine Zusammenfassung. Es gibt keine regelmäßige Übersicht, was im ganzen Shop knapp ist; das Gesamtbild sieht niemand.",
          "Keine Historie. Ist die E-Mail gelesen oder untergegangen, bleibt nichts, worin man nachschauen könnte.",
          "Immer nur ein Shop. Betreiben Sie mehrere Shops, gibt es keine gemeinsame Ansicht — Sie prüfen jeden einzeln.",
        ],
      },
      {
        h2: "Ein kostenloser Zwischenschritt",
        paras: [
          "Wenn Sie einfach nur sehen möchten, was gerade knapp ist, ergänzt unser kostenloses WordPress-Plugin eine Steadel-Seite in Ihrem Adminbereich, die alle Produkte auf oder unter Ihrem bestehenden WooCommerce-Schwellenwert auflistet. Es braucht kein Konto und sendet nichts nach außen — die Liste entsteht aus Ihren eigenen Shop-Daten und wird nur Ihnen angezeigt.",
          "Das deckt den Fall „ich schaue nach“ ab. Es deckt nicht den Fall „sagt mir Bescheid, ohne dass ich nachschauen muss“ ab — und genau der verhindert Fehlbestände.",
        ],
      },
      {
        h2: "Wann sich ein zusätzliches Tool lohnt",
        paras: [
          "Wenn Ihnen die eingebauten E-Mails genügen, nutzen Sie sie — wirklich. Für etwas anderes zu zahlen lohnt sich erst, wenn einer dieser Punkte zutrifft: Sie möchten Warnungen zusätzlich in Slack, Sie möchten eine geplante Übersicht statt einzelner Nachrichten, Sie betreiben mehrere Shops, oder die eingebauten E-Mails gehen unter und Sie werden immer wieder überrascht.",
          "Genau das macht Steadel: Warnungen per E-Mail oder Slack, geplante Bestandsberichte und Shopify- wie WooCommerce-Shops nebeneinander. WooCommerce-Shops werden alle 10 Minuten geprüft, rechnen Sie also mit einigen Minuten. Gehostet in Deutschland, Ihre Daten bleiben in der EU.",
        ],
      },
    ],
    faq: [
      {
        q: "Versendet WooCommerce standardmäßig E-Mails bei niedrigem Bestand?",
        a: "Die Funktion ist eingebaut und lässt sich unter WooCommerce → Einstellungen → Produkte → Lagerbestand konfigurieren; dort legen Sie Schwellenwerte und Empfänger fest. Schauen Sie dort nach, statt es in die eine oder andere Richtung anzunehmen — viele Shops haben diese Seite nie geöffnet.",
      },
      {
        q: "Kann ich für ein einzelnes Produkt einen anderen Schwellenwert setzen?",
        a: "Ja. Im Reiter „Lagerbestand“ jedes Produkts lässt sich der shopweite Wert überschreiben. Für alles, was sich schnell verkauft, lohnt sich das.",
      },
      {
        q: "Brauche ich überhaupt ein Plugin?",
        a: "Für einfache E-Mail-Warnungen nicht — das deckt WooCommerce ab. Ein Tool lohnt sich, wenn Sie Slack, geplante Übersichten, mehrere Shops in einer Ansicht oder Warnungen brauchen, die im Postfach nicht untergehen.",
      },
    ],
  },
  {
    slug: "meldebestand-berechnen",
    enSlug: "low-stock-threshold",
    seoTitle: "Meldebestand berechnen: ein Schwellenwert, dem Sie vertrauen können",
    seoDescription:
      "Ein Meldebestand nützt nur, wenn er auslöst, solange Sie noch nachbestellen können. Die einfache Rechnung aus Absatz, Lieferzeit und Puffer — mit Beispiel.",
    eyebrow: "Leitfaden · Lagerbestand",
    h1: "Meldebestand berechnen: ein Schwellenwert, dem Sie vertrauen können",
    lede: "Die meisten Shops wählen eine runde Zahl, lassen darauf warnen und wundern sich dann, warum die Warnungen immer zu spät kommen. Der Meldebestand ist keine Geschmacksfrage — er ist eine Rechnung, und die ist nicht schwer.",
    readMinutes: 5,
    sections: [
      {
        h2: "Warum eine Zahl für den ganzen Katalog scheitert",
        paras: [
          "Setzen Sie den Schwellenwert überall auf 10, bekommen Sie gleich zwei Fehler. Ihr Schnelldreher erreicht 10 an einem Freitagnachmittag und ist am Samstag weg, lange bevor die Nachlieferung eintrifft — die Warnung war nutzlos. Ihr Langsamdreher steht derweil vier Monate lang bei 9 und meldet Ihnen ein Problem, das erst im Frühjahr eintritt.",
          "Entscheidend ist nicht, wie viele Stück übrig sind, sondern wie viele Verkaufstage übrig sind — gemessen daran, wie lange eine Nachlieferung dauert.",
        ],
      },
      {
        h2: "Die Rechnung",
        paras: ["Drei Werte, ein Ergebnis:"],
        bullets: [
          "Tagesabsatz — wie viele Stück dieses Produkts Sie an einem durchschnittlichen Tag verkaufen.",
          "Wiederbeschaffungszeit — die Tage zwischen der Entscheidung nachzubestellen und der Ware im Regal, inklusive Lieferant und Ihrer eigenen Bearbeitung.",
          "Puffer — einige zusätzliche Tage für die Woche, in der das Produkt unerwartet gut läuft, oder der Lieferant langsam ist.",
        ],
      },
      {
        h2: "Ein Rechenbeispiel",
        paras: [
          "Nehmen wir an, Sie verkaufen eine Hausmischung Kaffee. Sie setzen etwa 6 Packungen pro Tag ab. Ihre Rösterei braucht 5 Werktage, und bis Sie die Bestellung realistisch ausgelöst haben, vergehen weitere 2 Tage. Ihre tatsächliche Wiederbeschaffungszeit beträgt also 7 Tage, dazu möchten Sie 3 Tage Puffer.",
          "6 pro Tag × (7 + 3) Tage = 60. Der Meldebestand für dieses Produkt liegt bei 60 Packungen, nicht bei 10. Eine Warnung bei 10 erreichte Sie rund acht Tage zu spät — und genau deshalb fühlte sich der alte Schwellenwert nutzlos an.",
          "Rechnen Sie dasselbe für ein Produkt, von dem Sie alle zwei Tage eines verkaufen, beim selben Lieferanten: 0,5 × 10 = 5. Gleicher Shop, gleicher Lieferant, Schwellenwerte von 60 und 5. Darum geht es.",
        ],
      },
      {
        h2: "Wo die Zahlen hingehören",
        paras: [
          "In WooCommerce liegt der shopweite Standardwert unter WooCommerce → Einstellungen → Produkte → Lagerbestand, und der Reiter „Lagerbestand“ jedes Produkts kann ihn überschreiben. Setzen Sie den shopweiten Wert für den langen Schwanz und rechnen Sie sauber für Ihre Bestseller — die zwanzig Produkte, die den Großteil Ihres Umsatzes tragen. Bei denen kostet ein Fehlbestand tatsächlich Geld.",
          "In Steadel legen Sie einen Schwellenwert pro Shop fest und passen ihn an, während Sie dazulernen; Warnungen gehen per E-Mail oder Slack raus.",
        ],
      },
      {
        h2: "Vor der Saison neu rechnen",
        paras: [
          "Der Tagesabsatz ist nicht fix. Ein Produkt, das im Oktober 6 Stück am Tag macht, kann im Dezember bei 20 liegen — ein in der ruhigen Zeit berechneter Schwellenwert löst in der Hochsaison viel zu spät aus. Prüfen Sie Ihre Bestseller vor jedem Zeitraum, von dem Sie viel erwarten.",
          "Der ehrliche Test ist einfach: Hätten Sie beim Eintreffen der Warnung noch rechtzeitig nachbestellen können? Lautet die Antwort mehr als einmal Nein, ist die Zahl zu niedrig — nicht das Werkzeug.",
        ],
      },
    ],
    faq: [
      {
        q: "Was, wenn ich meine Wiederbeschaffungszeit nicht kenne?",
        a: "Nehmen Sie die längste Zeit, die eine Nachlieferung zuletzt tatsächlich gebraucht hat, nicht die vom Lieferanten genannte. Rechnen Sie Ihre eigene Verzögerung beim Auslösen der Bestellung mit ein — dieser Teil ist oft größer als gedacht.",
      },
      {
        q: "Sollte jedes Produkt einen eigenen Meldebestand bekommen?",
        a: "Nein. Rechnen Sie für die Produkte, die Ihren Umsatz tragen, und lassen Sie den langen Schwanz auf einem sinnvollen shopweiten Standardwert. Der Aufwand gehört dorthin, wo ein Fehlbestand wirklich Geld kostet.",
      },
      {
        q: "Meine Warnungen sind zu laut. Stimmt der Schwellenwert nicht?",
        a: "Meist stimmt der Schwellenwert und die Zustellung ist das Problem — einen Strom einzelner E-Mails blendet man schnell aus. Eine geplante Übersicht des Knappen, ergänzt um sofortige Warnungen nur für die wichtigen Produkte, löst das in der Regel.",
      },
    ],
  },
];

export function getGuideDe(slug: string): GuideDe | undefined {
  return GUIDES_DE.find((g) => g.slug === slug);
}

/** English slug -> German slug, for hreflang on the English pages. */
export const DE_BY_EN_SLUG: Record<string, string> = Object.fromEntries(
  GUIDES_DE.map((g) => [g.enSlug, g.slug]),
);
