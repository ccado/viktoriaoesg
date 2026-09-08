/* ÖSG Viktoria 08: öffentliche Website, gerendert aus dem Inhalts-Store (content.js).
   Hash-Routing: #/: #/verein: #/abteilungen: #/abteilung/:slug: #/mannschaften ,
   #/news: #/news/:slug: #/termine: #/dokumente: #/kontakt: #/impressum: #/datenschutz */
(function () {
  const S = window.OSG.Store;
  let C = S.load();

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const para = (t) => String(t || '').split(/\n{2,}/).filter(Boolean).map((p) => `<p>${esc(p).replace(/\n/g, '<br />')}</p>`).join('');
  const dt = (d) => { if (!d) return ''; const x = new Date(d); return isNaN(x) ? d : x.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); };
  const phBox = (label, cls, dark) => `<div class="ph ${cls || ''}"${dark ? ' data-dark' : ''} data-label="${esc(label)}"></div>`;

  /* Kuratierte lizenzfreie Fotos (Unsplash-Lizenz). Im Admin pro Eintrag durch eigene Bilder ersetzbar. */
  const UNS = (id, w, h) => id.indexOf('http') === 0
    ? `${id}?w=${w || 1200}&h=${h || 800}&fit=crop&q=70`
    : `https://unsplash.com/photos/${id}/download?w=${w || 1200}${h ? '&h=' + h : ''}&fit=crop`;
  const PIC = {
    hero: 'paok4XuwnnU',
    fussball: 'thpUigrWn5g',
    boxen: '7Nc8h2nAOHA',
    boxen2: '2Ig4WSod3GQ',
    tischtennis: 'WdZPKqux5_s',
    tischtennis2: 'gz-vl-BKW-c',
    gymnastik: 'https://images.unsplash.com/photo-1742249715229-0ce01dd19358',
    gymnastik2: 'https://images.unsplash.com/photo-1747336406564-717968046260',
    team: 'eE74wRKp5v4',
    team2: 'qTiI9tOHs14',
    teamfoto: 'https://images.unsplash.com/photo-1748111405983-d1b10316eb83',
    kinder: 'https://images.unsplash.com/photo-1622659097509-4d56de14539e',
    damen: 'https://images.unsplash.com/photo-1535506197904-e5c09c0e5619',
    spiel: 'https://images.unsplash.com/photo-1600077063877-22118d6290eb',
    platz: 'https://images.unsplash.com/photo-1478851814281-61a21b884e62'
  };
  /* Feste Zuordnung je News-Beitrag, damit kein Bild doppelt erscheint */
  const NEWS_PIC = {
    'probetraining': 'kinder',
    'ein-neues-kapitel-beginnt': 'team',
    'generationsuebergreifende-solidaritaet': 'teamfoto'
  };
  const ROTATE = ['team', 'teamfoto', 'team2', 'damen', 'kinder', 'spiel', 'fussball'];
  function photo(url, key, seed, cls, w, h) {
    let k = key;
    if (key === 'news') k = NEWS_PIC[seed] || ROTATE[String(seed).length % ROTATE.length];
    if (key === 'rotate') k = ROTATE[(seed || 0) % ROTATE.length];
    const id = PIC[k] || PIC.fussball;
    const src = url || UNS(id, w, h);
    return `<div class="media ${cls || ''}"><img src="${esc(src)}" alt="" data-fallback="${UNS(PIC.fussball, w, h)}" /></div>`;
  }
  /* Bilder-Fallback: onerror + Timeout, falls ein Request hängt */
  function wireImages(root) {
    root.querySelectorAll('.media img[data-fallback]').forEach((im) => {
      const swap = () => {
        if (im.dataset.fb === '1') return;
        im.dataset.fb = '1';
        im.src = im.dataset.fallback;
      };
      im.addEventListener('error', swap);
      setTimeout(() => { if (!im.naturalWidth) swap(); }, 9000);
    });
  }

  const NAV = [
    ['#/verein', 'Verein'],
    ['#/abteilungen', 'Abteilungen'],
    ['#/mannschaften', 'Mannschaften'],
    ['#/news', 'News'],
    ['#/termine', 'Termine'],
    ['#/faq', 'FAQ'],
    ['#/kontakt', 'Kontakt']
  ];

  /* ---------- Shell ---------- */
  function shell() {
    const st = C.settings;
    document.body.dataset.palette = st.palette;
    document.body.dataset.headline = st.headline;
    document.getElementById('siteNav').innerHTML = NAV.map(([h, l]) => `<a href="${h}">${l}</a>`).join('');
    document.getElementById('mobileNav').innerHTML = NAV.concat([['#/kontakt#mitglied', 'Mitglied werden']]).map(([h, l]) => `<a href="${h}">${l}</a>`).join('');
    document.getElementById('footerRoot').innerHTML = `
      <div class="wrap footer-top">
        <div class="footer-brand">
          <span class="crest" aria-hidden="true"><b>ÖSG</b><small>08</small></span>
          <p>${esc(st.longName)}: Vereinssport im Dortmunder Osten, seit ${esc(st.founded)}.</p>
        </div>
        <div class="footer-col"><h4>Verein</h4><a href="#/verein">Über uns</a><a href="#/abteilungen">Abteilungen</a><a href="#/mannschaften">Mannschaften</a><a href="#/news">News</a><a href="#/faq">FAQ</a></div>
        <div class="footer-col"><h4>Mitmachen</h4><a href="#/kontakt">Probetraining</a><a href="#/kontakt">Mitglied werden</a><a href="#/dokumente">Dokumente</a><a href="#/kontakt">Partner werden</a></div>
        <div class="footer-col"><h4>Kontakt</h4><a href="mailto:${esc(st.email)}">${esc(st.email)}</a><a href="${esc(st.instagram)}" target="_blank" rel="noopener">Instagram</a><a href="#/kontakt">Anfahrt</a></div>
      </div>
      <div class="wrap footer-bottom">
        <span>© ${new Date().getFullYear()} ${esc(st.legalName)} · ${esc(st.street)}, ${esc(st.zip)} ${esc(st.city)}</span>
        <div class="legal"><a href="#/impressum">Impressum</a><a href="#/datenschutz">Datenschutz</a><a href="admin.html">Admin</a></div>
      </div>`;
  }

  /* ---------- Bausteine ---------- */
  const pageHead = (kicker, title, lead) => `
    <section class="page-head">
      <div class="wrap">
        <span class="kicker">${esc(kicker)}</span>
        <h1>${esc(title)}</h1>
        ${lead ? `<p class="lead">${esc(lead)}</p>` : ''}
      </div>
    </section>`;

  const newsCard = (n) => `
    <a class="news" href="#/news/${esc(n.slug)}">
      ${photo(n.image, 'news', n.slug, 'news__img', 800, 500)}
      <div class="news__body">
        <span class="news__meta">${esc(n.category)} · ${dt(n.date)}</span>
        <h3>${esc(n.title)}</h3>
        <p>${esc(n.excerpt)}</p>
      </div>
    </a>`;

  const eventRow = (e) => `
    <div class="ev">
      <div class="ev__date"><b>${dt(e.date).slice(0, 5)}</b><span>${esc(e.time || '')}</span></div>
      <div class="ev__main"><strong>${esc(e.title)}</strong><span>${esc(e.place || '')}</span></div>
      <span class="tag">${esc(e.category || '')}</span>
    </div>`;

  const sortedNews = () => C.news.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const sortedDepts = () => C.depts.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const upcoming = () => C.events.slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  /* ---------- Seiten ---------- */
  function home() {
    const st = C.settings, hero = C.pages['startseite-hero'], intro = C.pages['ueber-uns-text'];
    return `
    <section class="hero">
      ${st.heroStyle === 'farbe' ? '' : `<div class="hero__media">${photo(hero.image, 'hero', 'hero-osg', '', 1800, 1100)}</div>`}
      <div class="hero__overlay" aria-hidden="true"></div>
      <div class="hero__slash" aria-hidden="true"></div>
      <div class="wrap hero__inner">
        <span class="kicker">${esc(hero.kicker)}</span>
        <h1>Viktoria <span class="yr">08</span></h1>
        <p class="hero__sub">${esc(hero.sub)}</p>
        <div class="hero__cta">
          <a class="btn" href="#/kontakt" style="--bg:#fff;--fg:var(--ink);border-color:#fff">Mitglied werden <span class="arr">→</span></a>
          <a class="btn btn--ghost" href="#/abteilungen">Abteilungen ansehen</a>
        </div>
        <div class="hero__strip">
          <div><b>${esc(st.founded)}</b><span>Gegründet</span></div>
          <div><b>${esc(st.members)}</b><span>Mitglieder</span></div>
          <div><b>${C.depts.length}</b><span>Abteilungen</span></div>
          <div><b>${C.teams.length}</b><span>Mannschaften</span></div>
        </div>
      </div>
    </section>

    <div class="ticker" aria-hidden="true"><div class="ticker__track">${
      [].concat(C.depts.map((d) => d.name), ['Jugendförderung', 'Seit ' + st.founded, esc(st.district)])
        .concat(C.depts.map((d) => d.name), ['Jugendförderung', 'Seit ' + st.founded, esc(st.district)])
        .map((t) => `<span>${esc(t)}</span>`).join('')
    }</div></div>

    <section class="section">
      <div class="wrap">
        <div class="section-head">
          <div><span class="kicker">Der Verein</span><h2 class="section-title">${esc(intro.heading)}</h2></div>
          <p>${esc(String(intro.body).split(/\n{2,}/)[0])}</p>
        </div>
      </div>
      <div class="stats">
        <div class="wrap stats__grid">
          <div class="stat"><b>${esc(st.founded)}</b><span>Gegründet in Dortmund</span></div>
          <div class="stat"><b>${esc(st.members)}</b><span>Aktive Mitglieder</span></div>
          <div class="stat"><b>${C.teams.length}</b><span>Mannschaften</span></div>
          <div class="stat"><b>${C.depts.length}</b><span>Sport-Abteilungen</span></div>
        </div>
      </div>
    </section>

    <section class="section" style="padding-top:clamp(48px,6vw,90px)">
      <div class="wrap">
        <div class="section-head">
          <div><span class="kicker">Unsere Abteilungen</span><h2 class="section-title">Such dir<br />deinen Sport</h2></div>
          <a class="eyebrow-link" href="#/abteilungen">Alle Trainingszeiten <span class="arr">→</span></a>
        </div>
        <div class="dept-grid">${sortedDepts().map((d, i) => `
          <a class="dept" href="#/abteilung/${esc(d.slug)}">
            ${photo(d.image, d.slug, d.slug, 'dept__img', 700, 560)}
            <div class="dept__body">
              <span class="dept__num">${String(i + 1).padStart(2, '0')}</span>
              <h3>${esc(d.name)}</h3>
              <p>${esc(d.teaser)}</p>
              <span class="dept__link">Mehr erfahren <span class="arr">→</span></span>
            </div>
          </a>`).join('')}</div>
      </div>
    </section>

    <section class="section join">
      <div class="wrap join__grid">
        <div>
          <span class="kicker" style="color:#fff">Mitglied werden</span>
          <h2>Komm<br />ins Team</h2>
          <p>${esc(String(C.pages['mitglied-werden'].body).split(/\n{2,}/)[0])}</p>
          <div class="join__cta">
            <a class="btn btn--solidlight" href="#/kontakt">Probetraining anfragen <span class="arr">→</span></a>
            <a class="btn btn--ghost" href="#/dokumente" style="border-color:rgba(255,255,255,.55);color:#fff">Mitgliedsantrag</a>
          </div>
        </div>
        <div class="steps">
          <div class="step"><b>1</b><div><strong>Anfrage schicken</strong><span>Formular ausfüllen. Wir melden uns mit Termin und Ansprechperson.</span></div></div>
          <div class="step"><b>2</b><div><strong>Reinschnuppern</strong><span>Beim Training mitmachen und Team, Trainer und Verein kennenlernen.</span></div></div>
          <div class="step"><b>3</b><div><strong>Dabei sein</strong><span>Antrag ausfüllen, abgeben, dabei sein.</span></div></div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="section-head">
          <div><span class="kicker">Aktuelles & Termine</span><h2 class="section-title">Vom Platz<br />und drumherum</h2></div>
          <a class="eyebrow-link" href="#/news">Alle News <span class="arr">→</span></a>
        </div>
        <div class="match-news">
          <div>
            <div class="panel">
              <div class="panel__head"><b>Nächste Termine</b><span class="lg">Spiele & Veranstaltungen</span></div>
              <div class="panel__body">${upcoming().slice(0, 4).map(eventRow).join('') || '<p class="muted">Noch keine Termine eingetragen.</p>'}</div>
              <div class="panel__foot"><span>${esc(C.settings.groundName)}</span><a class="eyebrow-link" href="#/termine" style="color:#fff">Alle Termine <span class="arr">→</span></a></div>
            </div>
            <p class="embed-hint">⛶ Platz für das offizielle fussball.de-Widget (Spielplan · Tabelle · Ergebnisse).</p>
          </div>
          <div class="news-grid two">${sortedNews().slice(0, 4).map(newsCard).join('')}</div>
        </div>
      </div>
    </section>

    <section class="section sponsors">
      <div class="wrap">
        <div class="section-head">
          <div><span class="kicker">Partner & Sponsoren</span><h2 class="section-title">Gemeinsam stark</h2>
            <p>Unsere Partner machen Vereinssport möglich. Zeig Flagge im Dortmunder Osten.</p></div>
          <a class="eyebrow-link" href="#/kontakt">Partner werden <span class="arr">→</span></a>
        </div>
        <div class="sponsors__grid">${C.partners.map((p) => p.logo
          ? `<a class="sponsor" href="${esc(p.url || '#')}" target="_blank" rel="noopener"><img src="${esc(p.logo)}" alt="${esc(p.name)}" /></a>`
          : `<div class="sponsor">${esc(p.name || 'Partner')}</div>`).join('')}</div>
      </div>
    </section>

    ${contactBlock()}`;
  }

  function contactBlock() {
    const st = C.settings;
    return `
    <section class="section contact">
      <div class="wrap contact__grid">
        <div>
          <span class="kicker">Kontakt & Anfahrt</span>
          <h2>Schau<br />vorbei</h2>
          <dl class="contact__list">
            <div class="cline"><dt>Verein</dt><dd>${esc(st.legalName)}<br />${esc(st.street)}, ${esc(st.zip)} ${esc(st.city)}</dd></div>
            <div class="cline"><dt>Fußball</dt><dd>${esc(st.groundName)}<br />${esc(st.groundAddress)}</dd></div>
            <div class="cline"><dt>Halle</dt><dd>${esc(st.hallName)}<br />${esc(st.hallAddress)}</dd></div>
            <div class="cline"><dt>E-Mail</dt><dd><a href="mailto:${esc(st.email)}">${esc(st.email)}</a></dd></div>
            <div class="cline"><dt>Instagram</dt><dd><a href="${esc(st.instagram)}" target="_blank" rel="noopener">${esc(st.instagramHandle)}</a></dd></div>
          </dl>
          <div class="contact__cta">
            <a class="btn" href="#/kontakt">Anfrage schicken <span class="arr">→</span></a>
            <a class="btn btn--ghost" href="mailto:${esc(st.email)}" style="border-color:rgba(255,255,255,.5);color:#fff">Nachricht schreiben</a>
          </div>
        </div>
        <div class="contact__map"><iframe title="Karte Sportanlage" src="https://maps.google.com/maps?q=${encodeURIComponent(st.groundAddress)}&z=15&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
      </div>
    </section>`;
  }

  function verein() {
    const p = C.pages, st = C.settings;
    const groups = ['Vorstand', 'Sport', 'Trainerteam'];
    const split = [
      ['about-us-leadership', 'fussball', false],
      ['about-us-values', 'team', true],
      ['about-us-clublife', 'team2', false]
    ];
    return pageHead('Der Verein', p['ueber-uns-text'].heading, p['ueber-uns-text'].sub || '') + `
    <section class="section">
      <div class="wrap prose-grid">
        <article class="prose">${para(p['ueber-uns-text'].body)}</article>
        <aside class="factbox">
          <h4>Auf einen Blick</h4>
          <div class="fact"><dt>Gegründet</dt><dd>${esc(st.founded)}</dd></div>
          <div class="fact"><dt>Mitglieder</dt><dd>${esc(st.members)}</dd></div>
          <div class="fact"><dt>Abteilungen</dt><dd>${C.depts.map((d) => esc(d.name)).join(', ')}</dd></div>
          <div class="fact"><dt>Mannschaften</dt><dd>${C.teams.length}</dd></div>
          <div class="fact"><dt>Stadtteil</dt><dd>${esc(st.district)}</dd></div>
        </aside>
      </div>
    </section>
    <section class="section alt">
      <div class="wrap split-list">${split.map(([k, kw, flip]) => `
        <article class="split${flip ? ' split--flip' : ''}">
          ${photo(p[k].image, kw, k, 'split__img', 900, 900)}
          <div class="split__text">
            <span class="kicker">${esc(p[k].kicker || 'Unser')}</span>
            <h2>${esc(p[k].heading)}</h2>
            ${para(p[k].body)}
          </div>
        </article>`).join('')}</div>
    </section>
    <section class="section">
      <div class="wrap">
        <div class="section-head"><div><span class="kicker">Vorstand & Ansprechpartner</span><h2 class="section-title">Wer den<br />Verein trägt</h2></div>
        <p>Alle Ämter werden ehrenamtlich ausgeübt: neben Beruf und Familie.</p></div>
        ${groups.map((g) => {
          const list = C.people.filter((x) => x.publish !== false && x.area === g).sort((a, b) => (a.order || 0) - (b.order || 0));
          if (!list.length) return '';
          return `<h4 class="group-title">${esc(g)}</h4><div class="people">${list.map((x) => `
            <div class="person">
              <span class="avatar">${esc((x.name || '?').trim().charAt(0))}</span>
              <div><strong>${esc(x.name)}</strong><span>${esc(x.role)}</span>
              ${x.email ? `<a href="mailto:${esc(x.email)}">${esc(x.email)}</a>` : '<span class="muted">Kontakt über den Verein</span>'}</div>
            </div>`).join('')}</div>`;
        }).join('')}
      </div>
    </section>
    ${anlageSection()}`;
  }

  function anlageSection() {
    const p = C.pages['sportanlage'], st = C.settings;
    return `<section class="section alt">
      <div class="wrap">
        <div class="section-head"><div><span class="kicker">${esc(p.sub || 'Sportanlage')}</span><h2 class="section-title">${esc(p.heading)}</h2></div>
          <a class="eyebrow-link" href="#/kontakt">Anfahrt & Kontakt <span class="arr">→</span></a></div>
        <div class="anlage">
          ${photo(p.image, 'platz', 'anlage', 'anlage__img', 1000, 750)}
          <div>
            <div class="fact-grid">${(st.groundFacts || []).map((f) => `<div><span>${esc(f.k)}</span><b>${esc(f.v)}</b></div>`).join('')}</div>
            <article class="prose" style="margin-top:26px">${para(p.body)}</article>
          </div>
        </div>
      </div>
    </section>`;
  }

  function abteilungen() {
    return pageHead('Unsere Abteilungen', 'Vier Abteilungen, ein Verein', 'Fußball, Boxen, Tischtennis und Gymnastik: such dir deinen Sport.') + `
    <section class="section">
      <div class="wrap dept-list">${sortedDepts().map((d, i) => `
        <article class="dept-row">
          ${photo(d.image, d.slug, d.slug + '-row', 'dept-row__img', 900, 700)}
          <div>
            <span class="dept__num">${String(i + 1).padStart(2, '0')}</span>
            <h2>${esc(d.name)}</h2>
            <p>${esc(d.teaser)}</p>
            <dl class="mini">
              <div><dt>Training</dt><dd>${esc(d.times)}</dd></div>
              <div><dt>Ort</dt><dd>${esc(d.place || '')}</dd></div>
            </dl>
            <div class="row-cta"><a class="btn btn--ink" href="#/abteilung/${esc(d.slug)}">Zur Abteilung <span class="arr">→</span></a>
            <a class="btn btn--outline-ink" href="#/kontakt?dept=${esc(d.name)}">Probetraining</a></div>
          </div>
        </article>`).join('')}</div>
    </section>`;
  }

  function abteilung(slug) {
    const d = C.depts.find((x) => x.slug === slug);
    if (!d) return notFound();
    const teams = C.teams.filter((t) => t.dept === d.name).sort((a, b) => (a.order || 0) - (b.order || 0));
    return pageHead('Abteilung', d.name, d.teaser) + `
    <section class="section">
      <div class="wrap prose-grid">
        <article class="prose">${para(d.body)}</article>
        <aside class="factbox">
          <h4>Training</h4>
          <div class="fact"><dt>Zeiten</dt><dd>${esc(d.times)}</dd></div>
          <div class="fact"><dt>Ort</dt><dd>${esc(d.place || '')}</dd></div>
          <a class="btn" href="#/kontakt?dept=${esc(d.name)}" style="margin-top:18px">Probetraining anfragen <span class="arr">→</span></a>
        </aside>
      </div>
      <div class="wrap" style="margin-top:clamp(28px,4vw,54px)">${photo(d.image, PIC[d.slug + '2'] ? d.slug + '2' : d.slug, d.slug, 'wide-img', 1800, 800)}</div>
    </section>
    ${teams.length ? `<section class="section alt"><div class="wrap">
      <div class="section-head"><div><span class="kicker">Mannschaften</span><h2 class="section-title">${esc(d.name)} Teams</h2></div></div>
      <div class="team-grid">${teams.map(teamCard).join('')}</div></div></section>` : ''}`;
  }

  const teamCard = (t, i) => `
    <article class="team-card">
      ${photo(t.image, 'rotate', i || 0, 'team-card__img', 800, 500)}
      <div class="team-card__body">
        <h3>${esc(t.name)}</h3>
        ${t.league ? `<span class="tag">${esc(t.league)}</span>` : ''}
        <dl class="mini">
          <div><dt>Trainer</dt><dd>${esc(t.coaches || 'wird ergänzt')}</dd></div>
          <div><dt>Training</dt><dd>${esc(t.times || 'auf Anfrage')}</dd></div>
        </dl>
      </div>
    </article>`;

  function mannschaften() {
    const groups = [...new Set(C.teams.map((t) => t.group || t.dept))];
    return pageHead('Mannschaften', 'Unsere Teams', 'Alle Mannschaften der ÖSG Viktoria 08, von den G-Junioren bis zu den Altherren.') + `
    <section class="section"><div class="wrap">
      ${groups.map((g) => `<h4 class="group-title">${esc(g)}</h4><div class="team-grid">${C.teams.filter((t) => (t.group || t.dept) === g).sort((a, b) => (a.order || 0) - (b.order || 0)).map(teamCard).join('')}</div>`).join('')}
      <p class="embed-hint">⛶ Spielpläne und Tabellen kommen über das fussball.de-Widget.</p>
    </div></section>`;
  }

  function faq() {
    return pageHead('Häufige Fragen', 'FAQ', 'Die Fragen, die uns am häufigsten erreichen.') + `
    <section class="section"><div class="wrap faq-list">${(C.faq || []).map((f) => `
      <details class="qa"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}
      <div class="faq-cta"><p>Frage nicht dabei?</p><a class="btn btn--ink" href="#/kontakt">Schreib uns <span class="arr">→</span></a></div>
    </div></section>`;
  }

  function newsList() {
    return pageHead('Aktuelles', 'News', 'Neuigkeiten aus dem Verein und den Abteilungen.') + `
    <section class="section"><div class="wrap"><div class="news-grid">${sortedNews().map(newsCard).join('') || '<p class="muted">Noch keine Beiträge.</p>'}</div></div></section>`;
  }

  function newsDetail(slug) {
    const n = C.news.find((x) => x.slug === slug);
    if (!n) return notFound();
    return pageHead(n.category + ' · ' + dt(n.date), n.title, n.excerpt) + `
    <section class="section"><div class="wrap prose-grid">
      <article class="prose">${para(n.body)}</article>
      <aside>${photo(n.image, 'news', n.slug, 'aside-img', 900, 700)}<a class="eyebrow-link" href="#/news" style="margin-top:18px;display:inline-flex">← Alle News</a></aside>
    </div></section>`;
  }

  function termine() {
    return pageHead('Kalender', 'Termine', 'Spiele, Turniere und Veranstaltungen.') + `
    <section class="section"><div class="wrap"><div class="panel light">
      <div class="panel__body">${upcoming().map(eventRow).join('') || '<p class="muted">Noch keine Termine eingetragen.</p>'}</div>
    </div><p class="embed-hint">⛶ Spielpläne der Fußballmannschaften über fussball.de.</p></div></section>
    ${anlageSection()}`;
  }

  function dokumente() {
    const cats = [...new Set(C.docs.map((d) => d.category))];
    return pageHead('Downloads', 'Dokumente', 'Anträge, Formulare und Infos zum Herunterladen.') + `
    <section class="section"><div class="wrap">
      ${cats.map((c) => `<h4 class="group-title">${esc(c)}</h4><div class="doc-list">${C.docs.filter((d) => d.category === c).map((d) => `
        <a class="doc" href="${esc(d.url || '#')}"${d.url ? ' target="_blank" rel="noopener"' : ''}>
          <span class="doc__ico">PDF</span>
          <span class="doc__name">${esc(d.title)}<small>${d.url ? 'Herunterladen' : 'Datei folgt'}</small></span>
          <span class="arr">→</span>
        </a>`).join('')}</div>`).join('')}
    </div></section>`;
  }

  function kontakt(query) {
    const st = C.settings;
    const pre = (query.get && query.get('dept')) || '';
    const deptOpts = C.depts.map((d) => `<option${d.name === pre ? ' selected' : ''}>${esc(d.name)}</option>`).join('');
    return pageHead('Kontakt', 'Schreib uns', 'Probetraining, Mitgliedschaft, Sponsoring oder einfach eine Frage: wir melden uns.') + `
    <section class="section"><div class="wrap form-grid">
      <form class="form" id="anfrageForm" novalidate>
        <h3>Anfrage / Anmeldung</h3>
        <div class="f2">
          <label>Anliegen<select name="type"><option>Probetraining</option><option>Mitgliedsantrag</option><option>Sponsoring / Partner</option><option>Ehrenamt</option><option>Allgemeine Frage</option></select></label>
          <label>Abteilung<select name="dept"><option value="">, bitte wählen ,</option>${deptOpts}</select></label>
        </div>
        <div class="f2">
          <label>Name *<input name="name" required placeholder="Vor- und Nachname" /></label>
          <label>Geburtsjahr<input name="birth" placeholder="z. B. 2014" /></label>
        </div>
        <div class="f2">
          <label>E-Mail *<input name="email" type="email" required placeholder="name@mail.de" /></label>
          <label>Telefon<input name="phone" placeholder="optional" /></label>
        </div>
        <label>Nachricht<textarea name="message" rows="5" placeholder="Worum geht's?"></textarea></label>
        <label class="check"><input type="checkbox" name="privacy" required /> <span>Ich habe die <a href="#/datenschutz">Datenschutzerklärung</a> gelesen und bin mit der Verarbeitung meiner Daten zur Bearbeitung der Anfrage einverstanden.</span></label>
        <button class="btn" type="submit">Anfrage senden <span class="arr">→</span></button>
        <p class="form-note" id="formNote" role="status"></p>
      </form>
      <aside class="factbox">
        <h4>Direkt erreichen</h4>
        <div class="fact"><dt>E-Mail</dt><dd><a href="mailto:${esc(st.email)}">${esc(st.email)}</a></dd></div>
        <div class="fact"><dt>Anschrift</dt><dd>${esc(st.legalName)}<br />${esc(st.street)}<br />${esc(st.zip)} ${esc(st.city)}</dd></div>
        <div class="fact"><dt>Fußball</dt><dd>${esc(st.groundAddress)}</dd></div>
        <div class="fact"><dt>Halle</dt><dd>${esc(st.hallAddress)}</dd></div>
        <div class="fact"><dt>Instagram</dt><dd><a href="${esc(st.instagram)}" target="_blank" rel="noopener">${esc(st.instagramHandle)}</a></dd></div>
      </aside>
    </div>
    <div class="wrap" style="margin-top:clamp(28px,4vw,54px)"><div class="contact__map tall"><iframe title="Karte Sportanlage" src="https://maps.google.com/maps?q=${encodeURIComponent(st.groundAddress)}&z=15&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div></div>
    </section>`;
  }

  function staticPage(slug) {
    const p = C.pages[slug];
    if (!p) return notFound();
    return pageHead('Rechtliches', p.heading) + `<section class="section"><div class="wrap"><article class="prose narrow">${para(p.body)}</article></div></section>`;
  }

  const notFound = () => pageHead('404', 'Seite nicht gefunden') + `<section class="section"><div class="wrap"><a class="btn btn--ink" href="#/">Zur Startseite</a></div></section>`;

  /* ---------- Router ---------- */
  function render() {
    C = S.load();
    shell();
    const raw = (location.hash || '#/').slice(1);
    const [path, qs] = raw.split('?');
    const query = new URLSearchParams(qs || '');
    const seg = path.split('/').filter(Boolean);
    const root = document.getElementById('app');
    let html;
    switch (seg[0]) {
      case undefined: html = home(); break;
      case 'verein': html = verein(); break;
      case 'abteilungen': html = abteilungen(); break;
      case 'abteilung': html = abteilung(seg[1]); break;
      case 'mannschaften': html = mannschaften(); break;
      case 'news': html = seg[1] ? newsDetail(seg[1]) : newsList(); break;
      case 'termine': html = termine(); break;
      case 'faq': html = faq(); break;
      case 'dokumente': html = dokumente(); break;
      case 'kontakt': html = kontakt(query); break;
      case 'impressum': html = staticPage('impressum'); break;
      case 'datenschutz': html = staticPage('datenschutz'); break;
      default: html = notFound();
    }
    root.innerHTML = html;
    document.querySelectorAll('#siteNav a, #mobileNav a').forEach((a) => {
      a.classList.toggle('active', a.getAttribute('href') === '#/' + (seg[0] || ''));
    });
    window.scrollTo(0, 0);
    wireImages(root);
    wireForm();
  }

  function wireForm() {
    const f = document.getElementById('anfrageForm');
    if (!f) return;
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const note = document.getElementById('formNote');
      const d = Object.fromEntries(new FormData(f).entries());
      if (!d.name || !d.email || !d.privacy) { note.textContent = 'Bitte Name, E-Mail und Datenschutz-Einwilligung ausfüllen.'; note.className = 'form-note err'; return; }
      const payload = { type: d.type, dept: d.dept, name: d.name, birth: d.birth, email: d.email, phone: d.phone, message: d.message };
      const DB = window.OSGDB;
      note.textContent = 'Wird gesendet...';
      note.className = 'form-note';
      if (DB && DB.configured) {
        DB.addSubmission(payload).then((res) => {
          if (res.ok) {
            f.reset();
            note.textContent = 'Danke! Deine Anfrage ist eingegangen und wird im Vereinsbüro geprüft.';
            note.className = 'form-note ok';
          } else {
            note.textContent = 'Senden hat nicht funktioniert. Bitte schreib uns direkt per E-Mail.';
            note.className = 'form-note err';
          }
        });
      } else {
        S.addSubmission(payload);
        f.reset();
        note.textContent = 'Danke! Deine Anfrage ist eingegangen und wird im Vereinsbüro geprüft.';
        note.className = 'form-note ok';
      }
    });
  }

  /* Inhalte aus dem Backend nachladen, falls konfiguriert */
  async function hydrate() {
    const DB = window.OSGDB;
    if (!DB || !DB.configured) return;
    const remote = await DB.fetchContent();
    if (remote) { S.save(remote); }
  }

  window.addEventListener('hashchange', render);
  window.addEventListener('osg:content', render);
  document.addEventListener('DOMContentLoaded', render);
  if (document.readyState !== 'loading') render();
  hydrate();
})();
