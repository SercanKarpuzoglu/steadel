// Steadel landing i18n — EN lives in the HTML; other languages override via
// data-i18n keys. Detection: saved choice → browser language → EN.
(function () {
  const T = {
    de: {
      "nav.features": "Funktionen", "nav.pricing": "Preise", "nav.faq": "FAQ", "nav.signin": "Anmelden", "nav.cta": "Kostenlos testen",
      "hero.kicker": "Bestandsbasierte Shop-Automatisierung",
      "hero.h1": "Zahlen Sie nicht länger für Werbung auf ausverkaufte Produkte.",
      "hero.sub": "Steadel überwacht Ihren Shopify- oder WooCommerce-Bestand und handelt, bevor Sie Geld verlieren: Anzeigen werden bei Ausverkauf pausiert, Sie werden gewarnt, bevor der Bestand zur Neige geht — und Berichte kommen von selbst.",
      "hero.cta1": "14 Tage kostenlos testen", "hero.cta2": "So funktioniert es",
      "hero.note": "Keine Kreditkarte erforderlich · Einrichtung in unter 3 Minuten",
      "strip.1": "Gehostet in Deutschland", "strip.2": "DSGVO-first, kein Tracking", "strip.3": "Transparente Festpreise", "strip.4": "Schriftlicher Support von Menschen",
      "feat.kicker": "Was Steadel kann", "feat.title": "Drei leise Automatisierungen, die Ihre Marge schützen.",
      "feat.1.h": "Bestandsbasierter Ads-Guard", "feat.1.p": "Ist ein beobachtetes Produkt ausverkauft, werden verknüpfte Meta-Anzeigengruppen automatisch pausiert — und bei Wiederverfügbarkeit fortgesetzt. Von Menschen pausierte Kampagnen rührt Steadel nie an.",
      "feat.2.h": "Warnungen bei niedrigem Bestand", "feat.2.p": "Schwellenwert pro Produkt oder shopweit festlegen. Sobald der Bestand ihn unterschreitet, erhalten Sie eine E-Mail (oder Slack-Nachricht) — bevor die Produktseite leer läuft.",
      "feat.3.h": "Planmäßige Berichte", "feat.3.p": "Ein ruhiger täglicher oder wöchentlicher Überblick über Bestandsbewegungen und Warnungen, direkt ins Postfach. Sie kennen den Zustand Ihres Shops, ohne sich einzuloggen.",
      "how.kicker": "So funktioniert es", "how.title": "In drei Schritten live.",
      "how.1.h": "Shop verbinden", "how.1.p": "Ein-Klick-OAuth für Shopify, API-Schlüssel für WooCommerce. Nur Lesezugriff auf Produkte und Bestand — nie auf Ihre Kunden.",
      "how.2.h": "Produkte auswählen", "how.2.p": "Alles oder nur Bestseller beobachten, mit Schwellenwerten pro Produkt.",
      "how.3.h": "Laufen lassen", "how.3.p": "Warnungen, Anzeigenpausen und Berichte geschehen von selbst. Steadel meldet sich genau dann, wenn es darauf ankommt.",
      "trust.kicker": "Für europäische Shops gebaut", "trust.title": "Ihre Daten bleiben in Europa. Alle.",
      "trust.1.h": "EU-Hosting", "trust.1.p": "Jedes Byte liegt auf Servern in Deutschland. Keine US-Analytics, keine Tracking-Pixel, kein Cookie-Banner — weil es nichts einzuwilligen gibt.",
      "trust.2.h": "Datenminimierung", "trust.2.p": "Wir lesen Produkte und Bestände — nie personenbezogene Daten Ihrer Kunden. Exportieren Sie alles als JSON oder löschen Sie Ihr Konto, jederzeit, self-service.",
      "trust.3.h": "Langweilig — im besten Sinne", "trust.3.p": "Verschlüsselte Zugangsdaten, Audit-Logs, nächtliche Backups und ausschließlich schriftlicher Support. Steady ist das ganze Konzept.",
      "price.kicker": "Preise", "price.title": "Feste Pläne. Keine Überraschungen am Monatsende.",
      "price.lead": "Jeder Plan beginnt mit 14 Tagen kostenlos — ohne Kreditkarte. Die Mehrwertsteuer übernimmt Paddle im Checkout.",
      "price.starter.1": "1 Shop", "price.starter.2": "3 Automatisierungen", "price.starter.3": "E-Mail-Warnungen & Berichte",
      "price.growth.1": "3 Shops", "price.growth.2": "Unbegrenzte Automatisierungen", "price.growth.3": "Slack-Warnungen", "price.growth.4": "Öffentliche API",
      "price.agency.1": "10 Shops", "price.agency.2": "Unbegrenzte Automatisierungen", "price.agency.3": "White-Label-Berichte",
      "price.btn": "Kostenlos testen", "price.month": "/Monat",
      "faq.kicker": "FAQ", "faq.title": "Berechtigte Fragen.",
      "faq.1.q": "Welche Plattformen unterstützt Steadel?", "faq.1.a": "Heute Shopify und WooCommerce. Der Ads-Guard verbindet sich mit Meta-Anzeigen (Facebook/Instagram); Google Ads steht auf der Roadmap.",
      "faq.2.q": "Braucht Steadel Zugriff auf meine Kundendaten?", "faq.2.a": "Nein. Wir fordern nur Lesezugriff auf Produkte und Bestand an. Kundendaten erreichen unsere Server nie — nachprüfbar im OAuth-Dialog beim Verbinden.",
      "faq.3.q": "Was passiert, wenn ein Produkt wieder verfügbar ist?", "faq.3.a": "Von Steadel pausierte Anzeigengruppen werden automatisch fortgesetzt, sobald der Bestand Ihren Schwellenwert wieder überschreitet. Von Menschen pausierte Kampagnen bleiben pausiert.",
      "faq.4.q": "Kann ich jederzeit kündigen?", "faq.4.a": "Ja, self-service auf der Abrechnungsseite. Der Zugang läuft bis zum Ende des bezahlten Zeitraums. Vorher können Sie alle Daten als JSON exportieren.",
      "faq.5.q": "Wie läuft der Support?", "faq.5.a": "Schriftlich per E-Mail — beantwortet von den Menschen, die Steadel bauen, innerhalb eines Werktags. Keine Callcenter, keine Chatbots.",
      "final.h2": "Geben Sie Ihrem Shop eine ruhige Hand.", "final.cta": "14 Tage kostenlos testen", "final.note": "In Minuten eingerichtet. Jederzeit kündbar.",
      "footer.privacy": "Datenschutz", "footer.terms": "AGB",
      "meta.desc": "Bestandsbasierte Automatisierung für Shopify und WooCommerce: Anzeigen bei Ausverkauf pausieren, Warnungen bei niedrigem Bestand, planmäßige Berichte. EU-Hosting, DSGVO-first."
    },
    fr: {
      "nav.features": "Fonctionnalités", "nav.pricing": "Tarifs", "nav.faq": "FAQ", "nav.signin": "Connexion", "nav.cta": "Essai gratuit",
      "hero.kicker": "Automatisation pilotée par le stock",
      "hero.h1": "Cessez de payer des pubs pour des produits épuisés.",
      "hero.sub": "Steadel surveille votre inventaire Shopify ou WooCommerce et agit avant que vous ne perdiez de l'argent : il met les publicités en pause à l'épuisement, vous alerte avant la rupture et vous envoie des rapports sans que vous ayez à vérifier.",
      "hero.cta1": "Essai gratuit de 14 jours", "hero.cta2": "Voir comment ça marche",
      "hero.note": "Sans carte bancaire · Configuration en moins de 3 minutes",
      "strip.1": "Hébergé en Allemagne (UE)", "strip.2": "RGPD d'abord, zéro tracking", "strip.3": "Tarifs fixes", "strip.4": "Support écrit, par des humains",
      "feat.kicker": "Ce que fait Steadel", "feat.title": "Trois automatisations discrètes qui protègent vos marges.",
      "feat.1.h": "Garde publicitaire liée au stock", "feat.1.p": "Quand un produit suivi est épuisé, les ensembles de publicités Meta liés sont mis en pause automatiquement — puis relancés au réassort. Steadel ne touche jamais aux campagnes qu'un humain a mises en pause.",
      "feat.2.h": "Alertes de stock bas", "feat.2.p": "Définissez un seuil par produit ou pour toute la boutique. Dès que l'inventaire le franchit, vous recevez un e-mail (ou un message Slack) — avant que la fiche produit ne se vide.",
      "feat.3.h": "Rapports programmés", "feat.3.p": "Un résumé calme, quotidien ou hebdomadaire, des mouvements de stock et des alertes, livré dans votre boîte mail. Connaissez l'état de votre boutique sans vous connecter.",
      "how.kicker": "Comment ça marche", "how.title": "En ligne en trois étapes.",
      "how.1.h": "Connectez votre boutique", "how.1.p": "OAuth en un clic pour Shopify, clés API pour WooCommerce. Accès en lecture seule aux produits et au stock — jamais à vos clients.",
      "how.2.h": "Choisissez quoi suivre", "how.2.p": "Suivez tout ou seulement vos meilleures ventes, avec des seuils par produit.",
      "how.3.h": "Laissez tourner", "how.3.p": "Alertes, pauses publicitaires et rapports se font tout seuls. Steadel se manifeste exactement quand il le faut.",
      "trust.kicker": "Conçu pour les boutiques européennes", "trust.title": "Vos données restent en Europe. Toutes.",
      "trust.1.h": "Hébergement UE", "trust.1.p": "Chaque octet vit sur des serveurs en Allemagne. Pas d'analytics US, pas de pixels de tracking, pas de bandeau cookies — car il n'y a rien à consentir.",
      "trust.2.h": "Minimisation des données", "trust.2.p": "Nous lisons les produits et les niveaux de stock — jamais les données personnelles de vos clients. Exportez tout en JSON ou supprimez votre compte, en autonomie, à tout moment.",
      "trust.3.h": "Ennuyeux, dans le bon sens", "trust.3.p": "Identifiants chiffrés, journaux d'audit, sauvegardes nocturnes et support exclusivement écrit. La stabilité, c'est tout le concept.",
      "price.kicker": "Tarifs", "price.title": "Des forfaits fixes. Aucune surprise en fin de mois.",
      "price.lead": "Chaque forfait commence par 14 jours d'essai gratuit — sans carte bancaire. La TVA est gérée au paiement par Paddle.",
      "price.starter.1": "1 boutique", "price.starter.2": "3 automatisations", "price.starter.3": "Alertes e-mail & rapports",
      "price.growth.1": "3 boutiques", "price.growth.2": "Automatisations illimitées", "price.growth.3": "Alertes Slack", "price.growth.4": "Accès API public",
      "price.agency.1": "10 boutiques", "price.agency.2": "Automatisations illimitées", "price.agency.3": "Rapports en marque blanche",
      "price.btn": "Essai gratuit", "price.month": "/mois",
      "faq.kicker": "FAQ", "faq.title": "De bonnes questions.",
      "faq.1.q": "Quelles plateformes Steadel prend-il en charge ?", "faq.1.a": "Shopify et WooCommerce aujourd'hui. La garde publicitaire se connecte aux publicités Meta (Facebook/Instagram) ; Google Ads est sur la feuille de route.",
      "faq.2.q": "Steadel a-t-il besoin d'accéder aux données de mes clients ?", "faq.2.a": "Non. Nous demandons un accès en lecture aux produits et au stock uniquement. Les données clients n'atteignent jamais nos serveurs — vérifiable sur l'écran de consentement OAuth.",
      "faq.3.q": "Que se passe-t-il au réassort d'un produit ?", "faq.3.a": "Les ensembles publicitaires mis en pause par Steadel sont relancés automatiquement dès que le stock repasse votre seuil. Les campagnes suspendues par un humain restent en pause.",
      "faq.4.q": "Puis-je annuler à tout moment ?", "faq.4.a": "Oui, en autonomie depuis la page de facturation. L'accès continue jusqu'à la fin de la période payée. Vous pouvez exporter toutes vos données en JSON avant de partir.",
      "faq.5.q": "Comment fonctionne le support ?", "faq.5.a": "Par écrit, par e-mail — avec des réponses des personnes qui construisent Steadel, sous un jour ouvré. Ni centre d'appels, ni chatbots.",
      "final.h2": "Donnez à votre boutique une main sûre.", "final.cta": "Essai gratuit de 14 jours", "final.note": "Installé en quelques minutes. Annulable à tout moment.",
      "footer.privacy": "Confidentialité", "footer.terms": "Conditions",
      "meta.desc": "Automatisation pilotée par le stock pour Shopify et WooCommerce : pause des pubs à l'épuisement, alertes de stock bas, rapports programmés. Hébergé dans l'UE, RGPD d'abord."
    },
    es: {
      "nav.features": "Funciones", "nav.pricing": "Precios", "nav.faq": "FAQ", "nav.signin": "Iniciar sesión", "nav.cta": "Prueba gratis",
      "hero.kicker": "Automatización según tu inventario",
      "hero.h1": "Deja de pagar anuncios de productos agotados.",
      "hero.sub": "Steadel vigila tu inventario de Shopify o WooCommerce y actúa antes de que pierdas dinero: pausa los anuncios cuando algo se agota, te avisa antes de quedarte sin stock y te envía informes sin que tengas que mirar.",
      "hero.cta1": "Prueba gratis de 14 días", "hero.cta2": "Ver cómo funciona",
      "hero.note": "Sin tarjeta de crédito · Configuración en menos de 3 minutos",
      "strip.1": "Alojado en Alemania (UE)", "strip.2": "RGPD primero, sin rastreo", "strip.3": "Precios fijos", "strip.4": "Soporte escrito, por humanos",
      "feat.kicker": "Qué hace Steadel", "feat.title": "Tres automatizaciones silenciosas que protegen tus márgenes.",
      "feat.1.h": "Guardián de anuncios según stock", "feat.1.p": "Cuando un producto vigilado se agota, sus conjuntos de anuncios de Meta se pausan automáticamente — y se reanudan al reponerse. Steadel nunca toca campañas pausadas por una persona.",
      "feat.2.h": "Alertas de stock bajo", "feat.2.p": "Define un umbral por producto o para toda la tienda. En cuanto el inventario lo cruza, recibes un correo (o mensaje de Slack) — antes de que la página del producto se quede vacía.",
      "feat.3.h": "Informes programados", "feat.3.p": "Un resumen tranquilo, diario o semanal, del movimiento de inventario y las alertas, directo a tu bandeja. Conoce el estado de tu tienda sin iniciar sesión.",
      "how.kicker": "Cómo funciona", "how.title": "En marcha en tres pasos.",
      "how.1.h": "Conecta tu tienda", "how.1.p": "OAuth de un clic para Shopify, claves API para WooCommerce. Acceso de solo lectura a productos e inventario — nunca a tus clientes.",
      "how.2.h": "Elige qué vigilar", "how.2.p": "Vigílalo todo o solo tus superventas, con umbrales por producto.",
      "how.3.h": "Déjalo funcionar", "how.3.p": "Alertas, pausas de anuncios e informes ocurren solos. Steadel te avisa exactamente cuando importa.",
      "trust.kicker": "Hecho para tiendas europeas", "trust.title": "Tus datos se quedan en Europa. Todos.",
      "trust.1.h": "Alojamiento en la UE", "trust.1.p": "Cada byte vive en servidores en Alemania. Sin analítica estadounidense, sin píxeles de rastreo, sin banner de cookies — porque no hay nada que consentir.",
      "trust.2.h": "Minimización de datos", "trust.2.p": "Leemos productos y niveles de stock — nunca datos personales de tus clientes. Exporta todo en JSON o elimina tu cuenta, tú mismo, cuando quieras.",
      "trust.3.h": "Aburrido, en el buen sentido", "trust.3.p": "Credenciales cifradas, registros de auditoría, copias nocturnas y soporte solo por escrito. La estabilidad es el concepto entero.",
      "price.kicker": "Precios", "price.title": "Planes fijos. Sin sorpresas a fin de mes.",
      "price.lead": "Todos los planes empiezan con 14 días gratis — sin tarjeta. Paddle gestiona el IVA en el pago.",
      "price.starter.1": "1 tienda", "price.starter.2": "3 automatizaciones", "price.starter.3": "Alertas por correo e informes",
      "price.growth.1": "3 tiendas", "price.growth.2": "Automatizaciones ilimitadas", "price.growth.3": "Alertas de Slack", "price.growth.4": "Acceso a API pública",
      "price.agency.1": "10 tiendas", "price.agency.2": "Automatizaciones ilimitadas", "price.agency.3": "Informes de marca blanca",
      "price.btn": "Prueba gratis", "price.month": "/mes",
      "faq.kicker": "FAQ", "faq.title": "Preguntas justas.",
      "faq.1.q": "¿Qué plataformas admite Steadel?", "faq.1.a": "Hoy, Shopify y WooCommerce. El guardián de anuncios se conecta con Meta (Facebook/Instagram); Google Ads está en la hoja de ruta.",
      "faq.2.q": "¿Necesita Steadel acceso a los datos de mis clientes?", "faq.2.a": "No. Solo pedimos acceso de lectura a productos e inventario. Los datos de clientes nunca llegan a nuestros servidores — verificable en la pantalla de consentimiento OAuth.",
      "faq.3.q": "¿Qué pasa cuando se repone un producto?", "faq.3.a": "Los conjuntos de anuncios pausados por Steadel se reanudan automáticamente cuando el stock vuelve a cruzar tu umbral. Las campañas pausadas por una persona siguen en pausa.",
      "faq.4.q": "¿Puedo cancelar en cualquier momento?", "faq.4.a": "Sí, tú mismo desde la página de facturación. El acceso continúa hasta el final del periodo pagado. Puedes exportar todos tus datos en JSON antes de irte.",
      "faq.5.q": "¿Cómo es el soporte?", "faq.5.a": "Por escrito, por correo — respondido por quienes construyen Steadel, en un día laborable. Sin centros de llamadas ni chatbots.",
      "final.h2": "Dale a tu tienda una mano firme.", "final.cta": "Prueba gratis de 14 días", "final.note": "Listo en minutos. Cancela cuando quieras.",
      "footer.privacy": "Privacidad", "footer.terms": "Términos",
      "meta.desc": "Automatización según inventario para Shopify y WooCommerce: pausa anuncios de productos agotados, alertas de stock bajo, informes programados. Alojado en la UE, RGPD primero."
    },
    it: {
      "nav.features": "Funzionalità", "nav.pricing": "Prezzi", "nav.faq": "FAQ", "nav.signin": "Accedi", "nav.cta": "Prova gratuita",
      "hero.kicker": "Automazione guidata dallo stock",
      "hero.h1": "Smetti di pagare annunci per prodotti esauriti.",
      "hero.sub": "Steadel sorveglia l'inventario del tuo negozio Shopify o WooCommerce e agisce prima che tu perda denaro: mette in pausa gli annunci quando un prodotto si esaurisce, ti avvisa prima che le scorte finiscano e ti manda report senza che tu debba controllare.",
      "hero.cta1": "Prova gratuita di 14 giorni", "hero.cta2": "Scopri come funziona",
      "hero.note": "Nessuna carta di credito · Configurazione in meno di 3 minuti",
      "strip.1": "Ospitato in Germania (UE)", "strip.2": "GDPR-first, zero tracciamento", "strip.3": "Prezzi fissi", "strip.4": "Supporto scritto, da persone vere",
      "feat.kicker": "Cosa fa Steadel", "feat.title": "Tre automazioni silenziose che proteggono i tuoi margini.",
      "feat.1.h": "Guardia annunci basata sullo stock", "feat.1.p": "Quando un prodotto monitorato si esaurisce, i gruppi di inserzioni Meta collegati vengono messi in pausa automaticamente — e riattivati al riassortimento. Steadel non tocca mai campagne messe in pausa da una persona.",
      "feat.2.h": "Avvisi di scorte basse", "feat.2.p": "Imposta una soglia per prodotto o per l'intero negozio. Appena l'inventario la supera, ricevi un'email (o un messaggio Slack) — prima che la pagina prodotto resti vuota.",
      "feat.3.h": "Report programmati", "feat.3.p": "Un riepilogo tranquillo, giornaliero o settimanale, dei movimenti di magazzino e degli avvisi, direttamente nella tua casella. Conosci lo stato del negozio senza effettuare l'accesso.",
      "how.kicker": "Come funziona", "how.title": "Operativo in tre passi.",
      "how.1.h": "Collega il negozio", "how.1.p": "OAuth con un clic per Shopify, chiavi API per WooCommerce. Accesso in sola lettura a prodotti e inventario — mai ai tuoi clienti.",
      "how.2.h": "Scegli cosa monitorare", "how.2.p": "Monitora tutto o solo i bestseller, con soglie per prodotto.",
      "how.3.h": "Lascialo lavorare", "how.3.p": "Avvisi, pause degli annunci e report avvengono da soli. Steadel si fa sentire esattamente quando serve.",
      "trust.kicker": "Costruito per i negozi europei", "trust.title": "I tuoi dati restano in Europa. Tutti.",
      "trust.1.h": "Hosting UE", "trust.1.p": "Ogni byte vive su server in Germania. Niente analytics USA, niente pixel di tracciamento, niente banner cookie — perché non c'è nulla da acconsentire.",
      "trust.2.h": "Minimizzazione dei dati", "trust.2.p": "Leggiamo prodotti e giacenze — mai i dati personali dei tuoi clienti. Esporta tutto in JSON o elimina l'account, in autonomia, quando vuoi.",
      "trust.3.h": "Noioso, nel senso buono", "trust.3.p": "Credenziali cifrate, log di audit, backup notturni e supporto solo scritto. La stabilità è l'intero concetto.",
      "price.kicker": "Prezzi", "price.title": "Piani fissi. Nessuna sorpresa a fine mese.",
      "price.lead": "Ogni piano inizia con 14 giorni di prova gratuita — senza carta. L'IVA è gestita al checkout da Paddle.",
      "price.starter.1": "1 negozio", "price.starter.2": "3 automazioni", "price.starter.3": "Avvisi email e report",
      "price.growth.1": "3 negozi", "price.growth.2": "Automazioni illimitate", "price.growth.3": "Avvisi Slack", "price.growth.4": "Accesso API pubblica",
      "price.agency.1": "10 negozi", "price.agency.2": "Automazioni illimitate", "price.agency.3": "Report white-label",
      "price.btn": "Prova gratuita", "price.month": "/mese",
      "faq.kicker": "FAQ", "faq.title": "Domande giuste.",
      "faq.1.q": "Quali piattaforme supporta Steadel?", "faq.1.a": "Oggi Shopify e WooCommerce. La guardia annunci si collega alle inserzioni Meta (Facebook/Instagram); Google Ads è nella roadmap.",
      "faq.2.q": "Steadel ha bisogno dei dati dei miei clienti?", "faq.2.a": "No. Chiediamo solo accesso in lettura a prodotti e inventario. I dati dei clienti non raggiungono mai i nostri server — verificabile nella schermata di consenso OAuth.",
      "faq.3.q": "Cosa succede quando un prodotto torna disponibile?", "faq.3.a": "I gruppi di inserzioni messi in pausa da Steadel vengono riattivati automaticamente quando lo stock supera di nuovo la soglia. Le campagne messe in pausa da una persona restano in pausa.",
      "faq.4.q": "Posso annullare in qualsiasi momento?", "faq.4.a": "Sì, in autonomia dalla pagina di fatturazione. L'accesso continua fino alla fine del periodo pagato. Prima di andartene puoi esportare tutti i dati in JSON.",
      "faq.5.q": "Come funziona il supporto?", "faq.5.a": "Per iscritto, via email — con risposte dalle persone che costruiscono Steadel, entro un giorno lavorativo. Niente call center, niente chatbot.",
      "final.h2": "Dai al tuo negozio una mano ferma.", "final.cta": "Prova gratuita di 14 giorni", "final.note": "Pronto in pochi minuti. Annulla quando vuoi.",
      "footer.privacy": "Privacy", "footer.terms": "Termini",
      "meta.desc": "Automazione guidata dallo stock per Shopify e WooCommerce: pausa degli annunci per prodotti esauriti, avvisi di scorte basse, report programmati. Hosting UE, GDPR-first."
    },
    nl: {
      "nav.features": "Functies", "nav.pricing": "Prijzen", "nav.faq": "FAQ", "nav.signin": "Inloggen", "nav.cta": "Gratis proberen",
      "hero.kicker": "Voorraadbewuste winkelautomatisering",
      "hero.h1": "Stop met betalen voor advertenties van uitverkochte producten.",
      "hero.sub": "Steadel bewaakt je Shopify- of WooCommerce-voorraad en grijpt in vóór je geld verliest: advertenties pauzeren bij uitverkoop, waarschuwingen vóór de voorraad opraakt, en rapporten zonder dat je hoeft te kijken.",
      "hero.cta1": "Probeer 14 dagen gratis", "hero.cta2": "Bekijk hoe het werkt",
      "hero.note": "Geen creditcard nodig · Ingesteld in minder dan 3 minuten",
      "strip.1": "Gehost in Duitsland (EU)", "strip.2": "AVG-first, geen tracking", "strip.3": "Vaste prijzen", "strip.4": "Schriftelijke support, door mensen",
      "feat.kicker": "Wat Steadel doet", "feat.title": "Drie stille automatiseringen die je marges bewaken.",
      "feat.1.h": "Voorraadbewuste advertentiebewaker", "feat.1.p": "Als een gevolgd product uitverkocht raakt, worden gekoppelde Meta-advertentiesets automatisch gepauzeerd — en hervat zodra er weer voorraad is. Steadel raakt nooit campagnes aan die een mens heeft gepauzeerd.",
      "feat.2.h": "Lage-voorraadmeldingen", "feat.2.p": "Stel een drempel in per product of voor de hele winkel. Zodra de voorraad die kruist, krijg je een e-mail (of Slack-bericht) — vóór de productpagina leeg raakt.",
      "feat.3.h": "Geplande rapporten", "feat.3.p": "Een rustig dagelijks of wekelijks overzicht van voorraadbewegingen en meldingen, rechtstreeks in je inbox. Ken de staat van je winkel zonder in te loggen.",
      "how.kicker": "Hoe het werkt", "how.title": "Live in drie stappen.",
      "how.1.h": "Verbind je winkel", "how.1.p": "One-click OAuth voor Shopify, API-sleutels voor WooCommerce. Alleen-lezen toegang tot producten en voorraad — nooit tot je klanten.",
      "how.2.h": "Kies wat je volgt", "how.2.p": "Volg alles of alleen je bestsellers, met drempels per product.",
      "how.3.h": "Laat het draaien", "how.3.p": "Meldingen, advertentiepauzes en rapporten gebeuren vanzelf. Steadel meldt zich precies wanneer het ertoe doet.",
      "trust.kicker": "Gebouwd voor Europese winkels", "trust.title": "Je data blijft in Europa. Allemaal.",
      "trust.1.h": "EU-hosting", "trust.1.p": "Elke byte staat op servers in Duitsland. Geen Amerikaanse analytics, geen trackingpixels, geen cookiebanner — omdat er niets is om toestemming voor te geven.",
      "trust.2.h": "Dataminimalisatie", "trust.2.p": "We lezen producten en voorraadniveaus — nooit persoonsgegevens van je klanten. Exporteer alles als JSON of verwijder je account, zelf, wanneer je wilt.",
      "trust.3.h": "Saai, op de goede manier", "trust.3.p": "Versleutelde inloggegevens, auditlogs, nachtelijke back-ups en uitsluitend schriftelijke support. Steady is het hele idee.",
      "price.kicker": "Prijzen", "price.title": "Vaste abonnementen. Geen verrassingen aan het einde van de maand.",
      "price.lead": "Elk abonnement start met 14 dagen gratis — zonder creditcard. Btw wordt bij het afrekenen geregeld door Paddle.",
      "price.starter.1": "1 winkel", "price.starter.2": "3 automatiseringen", "price.starter.3": "E-mailmeldingen & rapporten",
      "price.growth.1": "3 winkels", "price.growth.2": "Onbeperkte automatiseringen", "price.growth.3": "Slack-meldingen", "price.growth.4": "Publieke API-toegang",
      "price.agency.1": "10 winkels", "price.agency.2": "Onbeperkte automatiseringen", "price.agency.3": "White-label rapporten",
      "price.btn": "Gratis proberen", "price.month": "/maand",
      "faq.kicker": "FAQ", "faq.title": "Terechte vragen.",
      "faq.1.q": "Welke platforms ondersteunt Steadel?", "faq.1.a": "Vandaag Shopify en WooCommerce. De advertentiebewaker koppelt met Meta-advertenties (Facebook/Instagram); Google Ads staat op de roadmap.",
      "faq.2.q": "Heeft Steadel toegang tot mijn klantgegevens nodig?", "faq.2.a": "Nee. We vragen alleen leestoegang tot producten en voorraad. Klantgegevens bereiken onze servers nooit — controleerbaar in het OAuth-toestemmingsscherm.",
      "faq.3.q": "Wat gebeurt er als een product weer op voorraad is?", "faq.3.a": "Advertentiesets die Steadel pauzeerde worden automatisch hervat zodra de voorraad je drempel weer passeert. Campagnes die een mens pauzeerde blijven gepauzeerd.",
      "faq.4.q": "Kan ik op elk moment opzeggen?", "faq.4.a": "Ja, zelf via de factureringspagina. Toegang loopt door tot het einde van de betaalde periode. Je kunt al je data als JSON exporteren voor je vertrekt.",
      "faq.5.q": "Hoe werkt de support?", "faq.5.a": "Schriftelijk, per e-mail — beantwoord door de mensen die Steadel bouwen, binnen één werkdag. Geen callcenters, geen chatbots.",
      "final.h2": "Geef je winkel een vaste hand.", "final.cta": "Probeer 14 dagen gratis", "final.note": "In minuten ingesteld. Altijd opzegbaar.",
      "footer.privacy": "Privacy", "footer.terms": "Voorwaarden",
      "meta.desc": "Voorraadbewuste automatisering voor Shopify en WooCommerce: advertenties pauzeren bij uitverkoop, lage-voorraadmeldingen, geplande rapporten. EU-hosting, AVG-first."
    }
  };

  const SUPPORTED = ["en", "de", "fr", "es", "it", "nl"];

  function detect() {
    const saved = localStorage.getItem("steadel-lang");
    if (saved && SUPPORTED.includes(saved)) return saved;
    for (const raw of navigator.languages || [navigator.language || "en"]) {
      const code = raw.slice(0, 2).toLowerCase();
      if (SUPPORTED.includes(code)) return code;
    }
    return "en";
  }

  function apply(lang) {
    document.documentElement.lang = lang;
    const dict = T[lang];
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!dict) {
        // English: restore original text captured on first run
        if (el.dataset.original) el.textContent = el.dataset.original;
        return;
      }
      if (!el.dataset.original) el.dataset.original = el.textContent;
      if (dict[key]) el.textContent = dict[key];
    });
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      if (!desc.dataset.original) desc.dataset.original = desc.content;
      desc.content = dict ? dict["meta.desc"] : desc.dataset.original;
    }
    const picker = document.getElementById("lang");
    if (picker) picker.value = lang;
  }

  window.setLang = function (lang) {
    localStorage.setItem("steadel-lang", lang);
    apply(lang);
  };

  document.addEventListener("DOMContentLoaded", () => {
    // capture originals first so EN can be restored after switching away
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.dataset.original = el.textContent;
    });
    apply(detect());
  });
})();
