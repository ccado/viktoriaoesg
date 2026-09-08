/* ÖSG Viktoria 08, Inhalts-Store
   Alle Inhalte der Website liegen hier als Daten und sind im Admin-Bereich editierbar.
   Persistenz: localStorage. Export/Import als JSON (für Übergabe an ein echtes Backend). */
(function () {
  const CKEY = 'osg_content_v1';
  const SKEY = 'osg_submissions_v1';

  const uid = (p) => p + '-' + Math.random().toString(36).slice(2, 8);

  const DEFAULTS = {
    settings: {
      clubName: 'ÖSG Viktoria 08',
      legalName: 'ÖSG Viktoria 08 e.V.',
      longName: 'Östliche Sportgemeinschaft Viktoria 08 e.V. Dortmund',
      founded: '1908',
      members: '~250',
      email: 'oesgviktoria08dortmund@gmail.com',
      phone: '',
      instagram: 'https://www.instagram.com/osg_viktoria/',
      instagramHandle: '@osg_viktoria',
      street: 'Hallesche Straße 76',
      zip: '44143',
      city: 'Dortmund',
      district: 'Dortmund-Körne',
      groundName: 'Sportanlage Hallesche Straße',
      groundAddress: 'Hallesche Straße 76, 44143 Dortmund',
      groundFacts: [
        { k: 'Kapazität', v: '3.000' },
        { k: 'Untergrund', v: 'Kunstrasen' },
        { k: 'Laufbahn', v: 'teilweise' },
        { k: 'Flutlicht', v: 'vorhanden' }
      ],
      hallName: 'Sporthalle Uhlandschule',
      hallAddress: 'Heilbronner Str. 4, 44143 Dortmund-Körne',
      logoUrl: 'logo.png',
      heroStyle: 'foto',
      palette: 'rotblau',
      headline: 'oswald',
      adminPin: 'viktoria08'
    },

    pages: {
      'startseite-hero': {
        title: 'Startseite Hero',
        heading: 'Viktoria 08',
        sub: 'Vier Abteilungen. Ein Verein. Dein Sport.',
        kicker: 'Östliche Sportgemeinschaft · Dortmund · seit 1908',
        body: ''
      },
      'ueber-uns-text': {
        title: 'Über uns',
        heading: 'Über unseren Verein',
        sub: 'Was zeichnet uns aus?',
        body: 'Die Östliche Sportgemeinschaft Viktoria 08 e.V. gehört seit 1908 zum Dortmunder Osten. Aus einer kleinen Sportgemeinschaft ist ein Mehrspartenverein mit rund 250 Mitgliedern geworden: Fußball, Boxen, Tischtennis und Gymnastik unter einem Dach, zuhause in Körne.\n\nBei uns trainieren Kinder, Jugendliche und Erwachsene auf derselben Anlage: von den G-Junioren bis zu den Altherren, von der ersten Trainingsstunde bis zum Punktspiel am Sonntag.',
        image: ''
      },
      'about-us-leadership': {
        title: 'Aller Leidenschaft',
        heading: 'Aller Leidenschaft',
        kicker: 'Unser',
        body: 'Sport ist unsere Leidenschaft und die ursprüngliche Motivation für diesen Verein. Ganz besonders lieben und leben wir den Fußball als Sportart.',
        image: ''
      },
      'about-us-values': {
        title: 'Gemeinsame Werte',
        heading: 'Gemeinsame Werte',
        kicker: 'Unsere',
        body: 'Unser Verein ist mehr als nur eine Sportgemeinschaft. Jede Person in unserem Verein ist einzigartig, und wir alle teilen die gleichen Werte.',
        image: ''
      },
      'about-us-clublife': {
        title: 'Lebendiges Vereinsleben',
        heading: 'Lebendiges Vereinsleben',
        kicker: 'Unser',
        body: 'Auf dem Platz sind wir leidenschaftliche Fußballkicker. Doch dabei alleine bleibt es nicht: Auch abseits des Platzes veranstalten wir öfter kleinere Team-Events wie entspannte Grill-Abende.',
        image: ''
      },
      'sportanlage': {
        title: 'Sportanlage',
        heading: 'Unsere Sportanlage',
        sub: 'Hier spielt die Viktoria',
        body: 'Unser Zuhause ist die Sportanlage an der Halleschen Straße 76 in 44143 Dortmund: Kunstrasen, Flutlicht und Platz für rund 3.000 Zuschauer. Hier finden Training und Heimspiele der Fußballmannschaften statt.\n\nBoxen, Tischtennis und Gymnastik trainieren in der Sporthalle der Uhlandschule, Heilbronner Str. 4, 44143 Dortmund-Körne.\n\nParken: Rund um den Platz gibt es reichlich Parkplätze: an der Hannöverschen Straße (nördlich vom Sportplatz) und am Park-and-Ride-Parkplatz (südwestlich vom Sportplatz).',
        image: ''
      },
      'impressum': {
        title: 'Impressum',
        heading: 'Impressum',
        body: 'Angaben gemäß § 5 TMG\n\nÖSG Viktoria 08 e.V.\nHallesche Straße 76\n44143 Dortmund\n\nVertreten durch den Vorstand:\n1. Vorsitzender: Bahram Roshan\n2. Vorsitzender: Nima Habibivand\n\nKontakt\nE-Mail: oesgviktoria08dortmund@gmail.com\n\nRegistereintrag\nEingetragen im Vereinsregister des Amtsgerichts Dortmund.\nRegisternummer: [bitte ergänzen]\n\nVerantwortlich für den Inhalt nach § 18 Abs. 2 MStV\nVorstand der ÖSG Viktoria 08 e.V., Adresse wie oben.\n\nHaftung für Inhalte\nAls Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Für die Inhalte verlinkter externer Seiten ist stets der jeweilige Anbieter verantwortlich.'
      },
      'datenschutz': {
        title: 'Datenschutz',
        heading: 'Datenschutzerklärung',
        body: 'Verantwortlicher\nÖSG Viktoria 08 e.V., Hallesche Straße 76, 44143 Dortmund, E-Mail: oesgviktoria08dortmund@gmail.com\n\nErhebung und Verarbeitung personenbezogener Daten\nWir verarbeiten personenbezogene Daten nur, soweit dies zur Bereitstellung dieser Website sowie zur Bearbeitung von Anfragen und Mitgliedsanträgen erforderlich ist (Art. 6 Abs. 1 lit. b und f DSGVO).\n\nKontakt- und Anmeldeformulare\nWenn Sie uns über ein Formular auf dieser Website kontaktieren, speichern wir die angegebenen Daten (Name, Kontaktdaten, Nachricht), um die Anfrage zu bearbeiten. Die Daten werden gelöscht, sobald der Zweck entfallen ist.\n\nIhre Rechte\nSie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit sowie ein Widerspruchsrecht. Wenden Sie sich dazu an die oben genannte Adresse.\n\nHinweis\nDieser Text ist eine Vorlage und sollte vor Veröffentlichung rechtlich geprüft werden.'
      },
      'mitglied-werden': {
        title: 'Mitglied werden',
        heading: 'Komm ins Team',
        body: 'Egal ob 6 oder 60, Anfänger oder alter Hase, bei der Viktoria findest du deinen Platz. Melde dich über das Formular. Wir bringen dich mit der passenden Abteilung und dem passenden Team zusammen.\n\nDas Antragsformular findest du unter „Dokumente“: ausfüllen, beim Training abgeben, dabei sein.'
      }
    },

    depts: [
      { id: 'd-fussball', slug: 'fussball', name: 'Fußball', teaser: 'Drei Herrenmannschaften, Altherren, Damen und sieben Juniorenteams. Kunstrasen und Flutlicht an der Halleschen Straße.', body: 'Fußball ist unsere größte Abteilung und das Herz des Vereins. Sport ist unsere Leidenschaft, und ganz besonders lieben und leben wir den Fußball.\n\nDie erste Mannschaft spielt in der Kreisliga B4, die zweite und dritte in der Kreisliga C. Dazu kommen Altherren, eine Damen- und Mädchenmannschaft und Juniorenteams von den A- bis zu den G-Junioren.\n\nNeue Spielerinnen und Spieler sind in jeder Altersklasse willkommen. Schreib uns kurz, dann bringen wir dich mit dem passenden Team zusammen.', times: 'Trainingszeiten je Mannschaft (siehe Mannschaften)', place: 'Sportanlage Hallesche Straße 76, 44143 Dortmund', order: 1, image: '' },
      { id: 'd-boxen', slug: 'boxen', name: 'Boxen', teaser: 'Traditionsabteilung seit 1931. Rund 40 Boxerinnen und Boxer mit Titeln auf Bezirks-, Westfalen- und Westdeutscher Ebene.', body: 'Die Wurzeln unserer Boxabteilung reichen bis 1931 zurück, damals als „Boxfreunde Körne 1931“ gegründet und 1945 zur ÖSG Viktoria 08 fusioniert. Heute trainieren rund 40 Sportlerinnen und Sportler bei uns.\n\nWir starten bei Turnieren im gesamten Bundesgebiet, bei Einzelmeisterschaften auf Bezirks- und Landesebene sowie bei Deutschen Meisterschaften. In der jüngsten Vergangenheit stellte die Abteilung 3 Bezirksmeister, 2 Westfalenmeister, 2 Westdeutsche Meister und einen dritten Platz bei der Deutschen Meisterschaft in Straubing. In der Punktwertung der Bezirksturniere steht die ÖSG Viktoria 08 auf Platz 1.\n\nJährlich führen wir ein dreitägiges Trainingslager durch. Die Teilnahmekosten an Meisterschaften übernimmt der Verein.', times: 'Dienstag 18:00–20:00 Uhr · Freitag 18:00–20:00 Uhr', place: 'Sporthalle Uhlandschule, Heilbronner Str. 4, 44143 Dortmund-Körne', order: 2, image: '' },
      { id: 'd-tischtennis', slug: 'tischtennis', name: 'Tischtennis', teaser: 'Spiel, Satz, Gemeinschaft. Für Freizeit- und Wettkampfspieler jeden Alters.', body: 'Ob zum ersten Mal am Tisch oder mit Ligaerfahrung: bei uns wird auf jedem Niveau gespielt. Schläger können für das Probetraining gestellt werden.', times: 'Trainingszeiten bitte im Admin-Bereich ergänzen', place: 'Sporthalle Uhlandschule, Heilbronner Str. 4, 44143 Dortmund-Körne', order: 3, image: '' },
      { id: 'd-gymnastik', slug: 'gymnastik', name: 'Gymnastik', teaser: 'Beweglichkeit, Fitness und Gesundheit in der Gruppe: Erwachsenen- und Seniorensport.', body: 'Die Gymnastikgruppe trainiert Kraft, Beweglichkeit und Ausdauer in angenehmer Runde. Einstieg ist jederzeit möglich.', times: 'Freitag 16:30–17:30 Uhr', place: 'Sporthalle Uhlandschule, Heilbronner Str. 4, 44143 Dortmund-Körne', order: 4, image: '' }
    ],

    teams: [
      { id: 't-h1', name: '1. Mannschaft', dept: 'Fußball', group: 'Senioren', slug: 'erste-mannschaft', ageClass: 'Herren', league: 'Kreisliga B4 Dortmund', coaches: '', contactEmail: '', times: '', image: '', order: 1, roster: [], matches: [] },
      { id: 't-h2', name: '2. Mannschaft', dept: 'Fußball', group: 'Senioren', slug: '2-mannschaft', ageClass: 'Herren', league: 'Kreisliga C3 Dortmund', coaches: '', contactEmail: '', times: '', image: '', order: 2, roster: [], matches: [] },
      { id: 't-h3', name: '3. Mannschaft', dept: 'Fußball', group: 'Senioren', slug: '3-mannschaft', ageClass: 'Herren', league: 'Kreisliga C Dortmund', coaches: '', contactEmail: '', times: '', image: '', order: 3, roster: [], matches: [] },
      { id: 't-ah', name: 'Altherrenmannschaft', dept: 'Fußball', group: 'Senioren', slug: 'altherrenmannschaft', ageClass: 'Herren', league: 'Freizeitrunde', coaches: '', contactEmail: '', times: '', image: '', order: 4, roster: [], matches: [] },
      { id: 't-damen', name: 'Damen- und Mädchenmannschaft', dept: 'Fußball', group: 'Senioren', slug: 'damen-und-maedchenmannschaft', ageClass: 'Damen', league: '', coaches: 'Ahmed Berro', contactEmail: '', times: '', image: '', order: 5, roster: [], matches: [] },
      { id: 't-a', name: 'A-Junioren', dept: 'Fußball', group: 'Junioren', slug: 'a-junioren', ageClass: 'A-Jugend', league: '', coaches: '', contactEmail: '', times: '', image: '', order: 11, roster: [], matches: [] },
      { id: 't-b', name: 'B-Junioren', dept: 'Fußball', group: 'Junioren', slug: 'b-junioren', ageClass: 'B-Jugend', league: '', coaches: '', contactEmail: '', times: '', image: '', order: 12, roster: [], matches: [] },
      { id: 't-c', name: 'C-Junioren', dept: 'Fußball', group: 'Junioren', slug: 'c-junioren', ageClass: 'C-Jugend', league: '', coaches: '', contactEmail: '', times: '', image: '', order: 13, roster: [], matches: [] },
      { id: 't-d', name: 'D-Junioren', dept: 'Fußball', group: 'Junioren', slug: 'd-junioren', ageClass: 'D-Jugend', league: '', coaches: 'Yousef Mahdi Selim (Co-Trainer D2)', contactEmail: '', times: '', image: '', order: 14, roster: [], matches: [] },
      { id: 't-e', name: 'E-Junioren', dept: 'Fußball', group: 'Junioren', slug: 'e-junioren', ageClass: 'E-Jugend', league: '', coaches: '', contactEmail: '', times: '', image: '', order: 15, roster: [], matches: [] },
      { id: 't-f', name: 'F-Junioren', dept: 'Fußball', group: 'Junioren', slug: 'f-junioren', ageClass: 'F-Jugend', league: '', coaches: 'Jakub Grzela (2. Trainer F1) · Ahmed Berro (F2)', contactEmail: '', times: '', image: '', order: 16, roster: [], matches: [] },
      { id: 't-g', name: 'G-Junioren', dept: 'Fußball', group: 'Junioren', slug: 'g-junioren', ageClass: 'G-Jugend', league: 'Bambini', coaches: '', contactEmail: '', times: '', image: '', order: 17, roster: [], matches: [] }
    ],

    faq: [
      { id: 'q-1', q: 'Kann ich zum Probetraining kommen?', a: 'Ja. Schreib uns vorher kurz über das Kontaktformular, welche Abteilung und welches Alter. Wir nennen dir dann Termin und Ansprechperson. In der Boxabteilung ist das Probetraining kostenlos.' },
      { id: 'q-2', q: 'Wie werde ich Mitglied?', a: 'Anfrage über das Formular schicken oder das Antragsformular unter „Dokumente“ herunterladen, ausfüllen und beim Training abgeben.' },
      { id: 'q-3', q: 'Was kostet die Mitgliedschaft?', a: 'Die aktuellen Beiträge nennen wir dir gern auf Anfrage. Sie unterscheiden sich je nach Abteilung und Alter.' },
      { id: 'q-4', q: 'Wo trainiert der Verein?', a: 'Fußball auf der Sportanlage Hallesche Straße 76, 44143 Dortmund. Boxen, Tischtennis und Gymnastik in der Sporthalle der Uhlandschule, Heilbronner Str. 4.' },
      { id: 'q-5', q: 'Gibt es Parkmöglichkeiten?', a: 'Ja. An der Hannöverschen Straße (nördlich vom Sportplatz) und am Park-and-Ride-Parkplatz (südwestlich vom Sportplatz).' },
      { id: 'q-6', q: 'Kann ich den Verein unterstützen?', a: 'Gerne: als Sponsor, Partner oder ehrenamtliche Helferin bzw. Helfer. Schreib uns einfach über das Kontaktformular.' }
    ],

    news: [
      { id: 'n-1', slug: 'probetraining', title: 'Komm zum Probetraining', category: 'Allgemein', date: '2026-01-01', excerpt: 'Reinschnuppern in allen vier Abteilungen. Schreib uns kurz, dann finden wir den passenden Termin.', body: 'Wer Lust auf Sport hat, ist bei uns willkommen: Fußball, Boxen, Tischtennis oder Gymnastik, in jedem Alter.\n\nSchreib uns über das Kontaktformular, welche Abteilung und welches Alter. Wir melden uns mit Termin und Ansprechperson. In der Boxabteilung ist das Probetraining kostenlos.', image: '' },
      { id: 'n-2', slug: 'ein-neues-kapitel-beginnt', title: 'Ein neues Kapitel beginnt', category: 'Vereinsnews', date: '2023-08-12', excerpt: 'Neuer Vorstand, neue Struktur: die Viktoria stellt sich auf.', body: 'Mit einem neu aufgestellten Vorstand hat die ÖSG Viktoria 08 ein neues Kapitel begonnen. Ziel ist ein Verein, der sportlich wächst und im Stadtteil verankert bleibt.', image: '' },
      { id: 'n-3', slug: 'generationsuebergreifende-solidaritaet', title: 'Generationsübergreifende Solidarität', category: 'Allgemein', date: '2026-02-13', excerpt: 'Vom Bambini bis zum Senior: bei uns trainieren alle Generationen unter einem Dach.', body: 'Vereinssport verbindet Generationen. Bei der Viktoria trainieren Kinder, Jugendliche, Erwachsene und Senioren auf derselben Anlage und helfen sich gegenseitig.', image: '' }
    ],

    events: [
      { id: 'e-1', date: '2026-09-13', time: '15:00', title: 'Heimspiel Herren', place: 'Sportanlage Hallesche Straße', category: 'Fußball' },
      { id: 'e-2', date: '2026-09-20', time: '11:00', title: 'F-Jugend Turnier', place: 'Sportanlage Hallesche Straße', category: 'Jugend' }
    ],

    docs: [
      { id: 'doc-1', title: 'Antragsformular', category: 'Antragsformulare', url: '', date: '2026-07-09' },
      { id: 'doc-2', title: 'Probetraining', category: 'Sonstiges', url: '', date: '2026-07-09' }
    ],

    gallery: [
      { id: 'g-1', title: 'F1-Jugend Mannschaftsfoto', url: '', date: '2026-09-07' }
    ],

    partners: [
      { id: 'p-1', name: 'Pizzeria Oase', url: '', logo: '' },
      { id: 'p-2', name: 'TaxiDOS', url: '', logo: '' },
      { id: 'p-3', name: 'IMPACT, eine Marke der Barmenia', url: '', logo: '' }
    ],

    /* Ansprechpartner, Kontaktdaten bewusst leer (Platzhalter), nur im Admin ergänzen. */
    people: [
      { id: 'pe-1', name: 'Bahram Roshan', role: '1. Vorsitzender', area: 'Vorstand', email: '', phone: '', photo: '', order: 1, publish: true },
      { id: 'pe-2', name: 'Nima Habibivand', role: '2. Vorsitzender', area: 'Vorstand', email: '', phone: '', photo: '', order: 2, publish: true },
      { id: 'pe-3', name: 'Kapishan Kamalakumar', role: '1. Geschäftsführer', area: 'Vorstand', email: 'oesgviktoria08dortmund@gmail.com', phone: '', photo: '', order: 3, publish: true },
      { id: 'pe-4', name: 'Emre Gülec', role: '2. Geschäftsführer', area: 'Vorstand', email: '', phone: '', photo: '', order: 4, publish: true },
      { id: 'pe-5', name: 'Ali Fatih Kaya', role: '1. Kassierer', area: 'Vorstand', email: '', phone: '', photo: '', order: 5, publish: true },
      { id: 'pe-6', name: 'Sathesan Vaseeharam', role: '2. Kassierer', area: 'Vorstand', email: '', phone: '', photo: '', order: 6, publish: true },
      { id: 'pe-7', name: 'Serdar Ucer', role: '1. Marketingleiter', area: 'Vorstand', email: '', phone: '', photo: '', order: 7, publish: true },
      { id: 'pe-8', name: 'Ahmad Abdulla', role: '2. Marketingleiter', area: 'Vorstand', email: '', phone: '', photo: '', order: 8, publish: true },
      { id: 'pe-9', name: 'Elmar Rautenberg', role: 'Jugendreferent', area: 'Vorstand', email: '', phone: '', photo: '', order: 9, publish: true },
      { id: 'pe-10', name: 'Ahmed Berro', role: 'Jugendleiter & Sportleiter', area: 'Sport', email: '', phone: '', photo: '', order: 10, publish: true },
      { id: 'pe-11', name: 'Yousef Mahdi Selim', role: 'Co-Trainer D2', area: 'Trainerteam', email: '', phone: '', photo: '', order: 11, publish: true },
      { id: 'pe-12', name: 'Jakub Grzela', role: '2. Trainer F1', area: 'Trainerteam', email: '', phone: '', photo: '', order: 12, publish: true }
    ]
  };

  function deepMerge(base, over) {
    if (Array.isArray(base)) return Array.isArray(over) ? over : base;
    if (base && typeof base === 'object') {
      const out = Object.assign({}, base);
      Object.keys(over || {}).forEach((k) => {
        out[k] = (k in base) ? deepMerge(base[k], over[k]) : over[k];
      });
      return out;
    }
    return over === undefined ? base : over;
  }

  const clone = (o) => JSON.parse(JSON.stringify(o));

  const slugify = (s) => String(s).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  /* Ergänzt neue Felder in gespeicherten Daten, damit ältere Stände weiter funktionieren */
  function normalize(d) {
    (d.teams || []).forEach((t) => {
      if (!t.slug) t.slug = slugify(t.name || t.id);
      if (t.ageClass === undefined) t.ageClass = t.group === 'Junioren' ? String(t.name || '').replace('Junioren', 'Jugend') : '';
      if (t.contactEmail === undefined) t.contactEmail = '';
      if (!Array.isArray(t.roster)) t.roster = [];
      if (!Array.isArray(t.matches)) t.matches = [];
    });
    (d.people || []).forEach((p) => { if (p.photo === undefined) p.photo = ''; });
    (d.depts || []).forEach((x) => { if (!x.slug) x.slug = slugify(x.name || x.id); });
    if (d.settings && d.settings.logoUrl === undefined) d.settings.logoUrl = 'logo.png';
    if (d.settings && d.settings.heroStyle === undefined) d.settings.heroStyle = 'foto';
    return d;
  }

  const Store = {
    uid,
    defaults: () => clone(DEFAULTS),
    load() {
      try {
        const raw = localStorage.getItem(CKEY);
        return normalize(raw ? deepMerge(clone(DEFAULTS), JSON.parse(raw)) : clone(DEFAULTS));
      } catch (e) { return normalize(clone(DEFAULTS)); }
    },
    save(data) {
      localStorage.setItem(CKEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('osg:content'));
    },
    reset() { localStorage.removeItem(CKEY); window.dispatchEvent(new CustomEvent('osg:content')); },

    /* Anfragen / Anmeldungen */
    submissions() {
      try { return JSON.parse(localStorage.getItem(SKEY) || '[]'); } catch (e) { return []; }
    },
    saveSubmissions(list) {
      localStorage.setItem(SKEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('osg:submissions'));
    },
    addSubmission(s) {
      const list = Store.submissions();
      list.unshift(Object.assign({ id: uid('s'), createdAt: new Date().toISOString(), status: 'neu' }, s));
      Store.saveSubmissions(list);
    },
    setStatus(id, status) {
      const list = Store.submissions().map((s) => (s.id === id ? Object.assign({}, s, { status }) : s));
      Store.saveSubmissions(list);
    },
    removeSubmission(id) { Store.saveSubmissions(Store.submissions().filter((s) => s.id !== id)); }
  };

  window.OSG = { Store, DEFAULTS };
})();
