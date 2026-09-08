/* ÖSG Viktoria 08, Admin-Bereich: Inhalte pflegen, Anfragen bearbeiten */
(function () {
  const S = window.OSG.Store;
  let C = S.load();
  let subs = S.submissions();
  let view = location.hash.replace('#', '') || 'dashboard';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dt = (d) => { if (!d) return ','; const x = new Date(d); return isNaN(x) ? d : x.toLocaleDateString('de-DE'); };
  const dtt = (d) => { const x = new Date(d); return isNaN(x) ? '' : x.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };
  const slugify = (s) => String(s).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const el = (id) => document.getElementById(id);

  /* ---------- Schemata der Sammlungen ---------- */
  const F = {
    text: (k, l, ph) => ({ k, l, t: 'text', ph }),
    area: (k, l, ph) => ({ k, l, t: 'area', ph }),
    date: (k, l) => ({ k, l, t: 'date' }),
    sel: (k, l, o) => ({ k, l, t: 'select', o }),
    num: (k, l) => ({ k, l, t: 'number' }),
    bool: (k, l) => ({ k, l, t: 'check' })
  };

  const COLLECTIONS = {
    news: {
      key: 'news', label: 'News', unit: 'Beiträge', add: 'Neuer Beitrag',
      cols: [
        { h: 'Titel', r: (x) => `<span class="t-title">${esc(x.title)}</span><span class="t-sub">/news/${esc(x.slug)}</span>` },
        { h: 'Kategorie', r: (x) => `<span class="pill">${esc(x.category)}</span>` },
        { h: 'Veröffentlicht', r: (x) => dt(x.date) }
      ],
      fields: [
        F.text('title', 'Titel'), F.text('slug', 'URL-Slug', 'wird automatisch erzeugt'),
        F.sel('category', 'Kategorie', ['Allgemein', 'Vereinsnews', 'Fußball', 'Boxen', 'Tischtennis', 'Gymnastik', 'Jugend']),
        F.date('date', 'Datum'), F.area('excerpt', 'Kurztext (Teaser)'), F.area('body', 'Text'),
        F.text('image', 'Bild-URL', 'z. B. bilder/news1.jpg')
      ],
      blank: () => ({ id: S.uid('n'), title: '', slug: '', category: 'Allgemein', date: new Date().toISOString().slice(0, 10), excerpt: '', body: '', image: '' }),
      before: (x) => { if (!x.slug) x.slug = slugify(x.title); return x; },
      sort: (a, b) => (b.date || '').localeCompare(a.date || '')
    },
    events: {
      key: 'events', label: 'Termine', unit: 'Termine', add: 'Neuer Termin',
      cols: [
        { h: 'Termin', r: (x) => `<span class="t-title">${esc(x.title)}</span><span class="t-sub">${esc(x.place || '')}</span>` },
        { h: 'Datum', r: (x) => dt(x.date) + (x.time ? ' · ' + esc(x.time) : '') },
        { h: 'Kategorie', r: (x) => `<span class="pill">${esc(x.category || '')}</span>` }
      ],
      fields: [F.text('title', 'Titel'), F.date('date', 'Datum'), F.text('time', 'Uhrzeit', '15:00'), F.text('place', 'Ort'), F.sel('category', 'Kategorie', ['Fußball', 'Boxen', 'Tischtennis', 'Gymnastik', 'Jugend', 'Verein'])],
      blank: () => ({ id: S.uid('e'), title: '', date: new Date().toISOString().slice(0, 10), time: '', place: '', category: 'Verein' }),
      sort: (a, b) => (a.date || '').localeCompare(b.date || '')
    },
    teams: {
      key: 'teams', label: 'Mannschaften', unit: 'Mannschaften', add: 'Neue Mannschaft',
      cols: [
        { h: 'Mannschaft', r: (x) => `<span class="t-title">${esc(x.name)}</span><span class="t-sub">${esc(x.league || '')}</span>` },
        { h: 'Gruppe', r: (x) => `<span class="pill">${esc(x.group || x.dept)}</span>` },
        { h: 'Trainer', r: (x) => esc(x.coaches || ',') }
      ],
      fields: [F.text('name', 'Name'), F.sel('group', 'Gruppe', ['Senioren', 'Junioren']), F.sel('dept', 'Abteilung', ['Fußball', 'Boxen', 'Tischtennis', 'Gymnastik']), F.text('league', 'Liga'), F.text('coaches', 'Trainer/Betreuer'), F.text('times', 'Trainingszeiten'), F.text('image', 'Mannschaftsfoto-URL'), F.num('order', 'Sortierung')],
      blank: () => ({ id: S.uid('t'), name: '', group: 'Senioren', dept: 'Fußball', league: '', coaches: '', times: '', image: '', order: 99 }),
      sort: (a, b) => (a.order || 0) - (b.order || 0)
    },
    depts: {
      key: 'depts', label: 'Abteilungen', unit: 'Abteilungen', add: 'Neue Abteilung',
      cols: [
        { h: 'Abteilung', r: (x) => `<span class="t-title">${esc(x.name)}</span><span class="t-sub">/abteilung/${esc(x.slug)}</span>` },
        { h: 'Training', r: (x) => esc(x.times || ',') },
        { h: 'Ort', r: (x) => esc(x.place || ',') }
      ],
      fields: [F.text('name', 'Name'), F.text('slug', 'URL-Slug'), F.area('teaser', 'Kurzbeschreibung'), F.area('body', 'Text'), F.text('times', 'Trainingszeiten'), F.text('place', 'Trainingsort'), F.text('image', 'Bild-URL'), F.num('order', 'Sortierung')],
      blank: () => ({ id: S.uid('d'), name: '', slug: '', teaser: '', body: '', times: '', place: '', image: '', order: 99 }),
      before: (x) => { if (!x.slug) x.slug = slugify(x.name); return x; },
      sort: (a, b) => (a.order || 0) - (b.order || 0)
    },
    gallery: {
      key: 'gallery', label: 'Galerie', unit: 'Bilder', add: 'Neues Bild',
      cols: [{ h: 'Titel', r: (x) => `<span class="t-title">${esc(x.title)}</span><span class="t-sub">${esc(x.url || 'keine Datei')}</span>` }, { h: 'Datum', r: (x) => dt(x.date) }],
      fields: [F.text('title', 'Titel'), F.text('url', 'Bild-URL'), F.date('date', 'Datum')],
      blank: () => ({ id: S.uid('g'), title: '', url: '', date: new Date().toISOString().slice(0, 10) })
    },
    docs: {
      key: 'docs', label: 'Dokumente', unit: 'Dokumente', add: 'Neues Dokument',
      cols: [
        { h: 'Titel', r: (x) => `<span class="t-title">${esc(x.title)}</span><span class="t-sub">${esc(x.url || 'Datei folgt')}</span>` },
        { h: 'Kategorie', r: (x) => `<span class="pill">${esc(x.category)}</span>` },
        { h: 'Hinzugefügt', r: (x) => dt(x.date) }
      ],
      fields: [F.text('title', 'Titel'), F.sel('category', 'Kategorie', ['Antragsformulare', 'Satzung & Ordnungen', 'Beiträge', 'Sonstiges']), F.text('url', 'Datei-URL (PDF)'), F.date('date', 'Datum')],
      blank: () => ({ id: S.uid('doc'), title: '', category: 'Sonstiges', url: '', date: new Date().toISOString().slice(0, 10) })
    },
    faq: {
      key: 'faq', label: 'FAQ', unit: 'Fragen', add: 'Neue Frage',
      cols: [{ h: 'Frage', r: (x) => `<span class="t-title">${esc(x.q)}</span>` }, { h: 'Antwort', r: (x) => esc(String(x.a).slice(0, 90)) + (String(x.a).length > 90 ? '…' : '') }],
      fields: [F.text('q', 'Frage'), F.area('a', 'Antwort')],
      blank: () => ({ id: S.uid('q'), q: '', a: '' })
    },
    partners: {
      key: 'partners', label: 'Partner', unit: 'Partner', add: 'Neuer Partner',
      cols: [{ h: 'Name', r: (x) => `<span class="t-title">${esc(x.name)}</span><span class="t-sub">${esc(x.url || '')}</span>` }, { h: 'Logo', r: (x) => x.logo ? 'vorhanden' : '<span class="pill wartet">fehlt</span>' }],
      fields: [F.text('name', 'Name'), F.text('url', 'Website'), F.text('logo', 'Logo-URL')],
      blank: () => ({ id: S.uid('p'), name: '', url: '', logo: '' })
    },
    people: {
      key: 'people', label: 'Ansprechpartner', unit: 'Personen', add: 'Neuer Ansprechpartner',
      cols: [
        { h: 'Person', r: (x) => `<span class="avatar">${esc((x.name || '?').charAt(0))}</span><span class="t-title" style="display:inline">${esc(x.name)}</span>` },
        { h: 'Funktion', r: (x) => esc(x.role) },
        { h: 'Bereich', r: (x) => `<span class="pill">${esc(x.area)}</span>` },
        { h: 'E-Mail', r: (x) => x.email ? esc(x.email) : '<span class="t-sub">,</span>' },
        { h: 'Öffentlich', r: (x) => x.publish === false ? '<span class="pill abgelehnt">nein</span>' : '<span class="pill angenommen">ja</span>' }
      ],
      fields: [F.text('name', 'Name'), F.text('role', 'Funktion'), F.sel('area', 'Bereich', ['Vorstand', 'Sport', 'Trainerteam', 'Abteilung Boxen', 'Abteilung Tischtennis', 'Abteilung Gymnastik']), F.text('email', 'E-Mail (optional)'), F.text('phone', 'Telefon (intern)'), F.num('order', 'Sortierung'), F.bool('publish', 'Auf der Website anzeigen')],
      blank: () => ({ id: S.uid('pe'), name: '', role: '', area: 'Vorstand', email: '', phone: '', order: 99, publish: true }),
      sort: (a, b) => (a.order || 0) - (b.order || 0)
    }
  };

  const NAV = [
    ['dashboard', 'Dashboard'], ['anfragen', 'Anfragen'], ['news', 'News'], ['events', 'Termine'],
    ['teams', 'Mannschaften'], ['depts', 'Abteilungen'], ['gallery', 'Galerie'], ['docs', 'Dokumente'],
    ['pages', 'Seiteninhalte'], ['faq', 'FAQ'], ['partners', 'Partner'], ['people', 'Ansprechpartner'], ['settings', 'Einstellungen']
  ];

  /* ---------- Login ---------- */
  function isAuthed() { return sessionStorage.getItem('osg_admin') === '1'; }

  function loginBackend() {
    document.body.innerHTML = `<div class="login"><form class="login__box" id="lf">
      <h1>Admin-Bereich</h1>
      <p>ÖSG Viktoria 08 e.V. Bitte mit deinem Vereinszugang anmelden.</p>
      <div class="field"><label for="mail">E-Mail</label><input id="mail" type="email" autocomplete="username" /></div>
      <div class="field"><label for="pw">Passwort</label><input id="pw" type="password" autocomplete="current-password" /></div>
      <p class="login__err" id="lerr"></p>
      <button class="btn" type="submit">Anmelden</button>
      <button class="btn ghost" type="button" id="forgot">Passwort vergessen</button>
    </form></div>`;
    el('lf').addEventListener('submit', async (e) => {
      e.preventDefault();
      el('lerr').textContent = 'Anmeldung läuft...';
      const res = await window.OSGDB.signIn(el('mail').value.trim(), el('pw').value);
      if (res.ok) location.reload();
      else el('lerr').textContent = 'Anmeldung fehlgeschlagen: ' + res.error;
    });
    el('forgot').addEventListener('click', async () => {
      const mail = el('mail').value.trim();
      if (!mail) { el('lerr').textContent = 'Bitte zuerst die E-Mail eintragen.'; return; }
      const res = await window.OSGDB.resetPassword(mail);
      el('lerr').textContent = res.ok ? 'E-Mail zum Zurücksetzen ist unterwegs.' : res.error;
    });
  }

  function login() {
    document.body.innerHTML = `<div class="login"><form class="login__box" id="lf">
      <h1>Admin-Bereich</h1>
      <p>ÖSG Viktoria 08 e.V., Verwaltung. Bitte Zugangscode eingeben.</p>
      <div class="field"><label for="pin">Zugangscode</label><input id="pin" type="password" autocomplete="current-password" /></div>
      <p class="login__err" id="lerr"></p>
      <button class="btn" type="submit">Anmelden</button>
    </form></div>`;
    el('lf').addEventListener('submit', (e) => {
      e.preventDefault();
      if (el('pin').value === C.settings.adminPin) { sessionStorage.setItem('osg_admin', '1'); location.reload(); }
      else el('lerr').textContent = 'Zugangscode falsch.';
    });
  }

  /* ---------- Shell ---------- */
  function shell() {
    document.body.innerHTML = `<div class="layout">
      <aside class="side">
        <div class="side__brand"><b>ÖSG Viktoria 08</b><span>Verwaltung</span></div>
        <nav class="side__nav" id="nav"></nav>
        <div class="side__foot">
          <button id="exportBtn">Inhalte exportieren (JSON)</button>
          <button id="importBtn">Inhalte importieren</button>
          <button id="logout">Abmelden</button>
        </div>
      </aside>
      <div class="main">
        <div class="topbar"><b>Admin-Bereich</b><span class="spacer"></span>
          <span class="badge-db${window.OSGDB && window.OSGDB.configured ? '' : ' local'}">${window.OSGDB && window.OSGDB.configured ? 'Backend verbunden' : 'Nur lokal gespeichert'}</span>
          <a class="view" href="index.html" target="_blank" rel="noopener">Website ansehen ↗</a></div>
        <div class="content" id="content"></div>
      </div>
    </div>
    <div class="modal" id="modal" hidden></div>
    <div class="toast" id="toast" hidden></div>
    <input type="file" id="fileIn" accept="application/json" hidden />`;
    el('logout').addEventListener('click', async () => {
      sessionStorage.removeItem('osg_admin');
      if (window.OSGDB && window.OSGDB.configured) await window.OSGDB.signOut();
      location.reload();
    });
    el('exportBtn').addEventListener('click', exportJson);
    el('importBtn').addEventListener('click', () => el('fileIn').click());
    el('fileIn').addEventListener('change', importJson);
    el('modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
  }

  function nav() {
    const open = subs.filter((s) => s.status === 'neu').length;
    el('nav').innerHTML = NAV.map(([k, l]) => `<button data-v="${k}" class="${view === k ? 'active' : ''}">${l}${k === 'anfragen' && open ? `<span class="count">${open}</span>` : ''}</button>`).join('');
    el('nav').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { view = b.dataset.v; location.hash = view; render(); }));
  }

  function toast(msg) { const t = el('toast'); t.textContent = msg; t.hidden = false; clearTimeout(t._t); t._t = setTimeout(() => { t.hidden = true; }, 2200); }
  function persist() {
    S.save(C); C = S.load();
    const DB = window.OSGDB;
    if (DB && DB.configured) {
      DB.saveContent(C).then((res) => { if (!res.ok) toast('Backend-Fehler: ' + res.error); });
    }
  }

  /* ---------- Views ---------- */
  function dashboard() {
    const open = subs.filter((s) => s.status === 'neu');
    return `<div class="head"><div><h1>Dashboard</h1><p>Willkommen im Verwaltungsbereich der ÖSG Viktoria 08 e.V. Dortmund.</p></div></div>
    <div class="tiles">
      <button class="tile brand" data-go="anfragen"><b>${open.length}</b><span>Offene Anfragen</span></button>
      <button class="tile" data-go="news"><b>${C.news.length}</b><span>News-Beiträge</span></button>
      <button class="tile" data-go="events"><b>${C.events.length}</b><span>Termine</span></button>
      <button class="tile" data-go="teams"><b>${C.teams.length}</b><span>Mannschaften</span></button>
      <button class="tile" data-go="people"><b>${C.people.length}</b><span>Ansprechpartner</span></button>
      <button class="tile" data-go="docs"><b>${C.docs.length}</b><span>Dokumente</span></button>
    </div>
    <h2 class="head" style="margin:34px 0 14px"><span style="font-family:var(--disp);font-size:22px;font-weight:700">Neueste Anfragen</span></h2>
    <div class="card">${open.length ? table(
      ['Eingang', 'Anliegen', 'Person', 'Status', ''],
      open.slice(0, 5).map((s) => `<tr><td>${dtt(s.createdAt)}</td><td><span class="t-title">${esc(s.type)}</span><span class="t-sub">${esc(s.dept || '')}</span></td><td>${esc(s.name)}<span class="t-sub">${esc(s.email)}</span></td><td><span class="pill ${esc(s.status)}">${esc(s.status)}</span></td><td class="actions"><button class="btn sm ghost" data-sub="${s.id}">Ansehen</button></td></tr>`).join('')
    ) : '<div class="empty">Keine offenen Anfragen.</div>'}</div>`;
  }

  const table = (heads, rows) => `<table><thead><tr>${heads.map((h) => `<th${h === '' ? ' style="text-align:right"' : ''}>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`;

  function anfragen() {
    const rows = subs.map((s) => `<tr>
      <td>${dtt(s.createdAt)}</td>
      <td><span class="t-title">${esc(s.type)}</span><span class="t-sub">${esc(s.dept || '')}${s.team ? ' · ' + esc(s.team) : ''}</span></td>
      <td><span class="t-title">${esc(s.name)}</span><span class="t-sub">${esc(s.email)}${s.phone ? ' · ' + esc(s.phone) : ''}</span></td>
      <td><span class="pill ${esc(s.status)}">${esc(s.status)}</span></td>
      <td class="actions">
        <button class="btn sm ghost" data-sub="${s.id}">Ansehen</button>
        <button class="btn sm ok" data-acc="${s.id}">Annehmen</button>
        <button class="btn sm danger" data-rej="${s.id}">Ablehnen</button>
      </td></tr>`).join('');
    return `<div class="head"><div><h1>Anfragen & Anmeldungen</h1><p>${subs.length} Einträge · über das Kontaktformular der Website eingegangen</p></div>
      <button class="btn ghost" id="clearDone">Bearbeitete löschen</button></div>
      <div class="card">${subs.length ? table(['Eingang', 'Anliegen', 'Person', 'Status', ''], rows) : '<div class="empty">Noch keine Anfragen eingegangen.</div>'}</div>`;
  }

  function collection(cfg) {
    const list = C[cfg.key].slice().sort(cfg.sort || (() => 0));
    const rows = list.map((x) => `<tr>${cfg.cols.map((c) => `<td>${c.r(x)}</td>`).join('')}
      <td class="actions"><button class="btn sm ghost" data-edit="${x.id}">Bearbeiten</button><button class="btn sm danger" data-del="${x.id}">Löschen</button></td></tr>`).join('');
    return `<div class="head"><div><h1>${cfg.label} verwalten</h1><p>${list.length} ${cfg.unit}</p></div>
      <button class="btn" id="addBtn">+ ${cfg.add}</button></div>
      <div class="card">${list.length ? table(cfg.cols.map((c) => c.h).concat(['']), rows) : '<div class="empty">Noch keine Einträge.</div>'}</div>`;
  }

  function pages() {
    const keys = Object.keys(C.pages);
    const rows = keys.map((k) => `<tr>
      <td><span class="t-sub" style="font-size:13px">${esc(k)}</span></td>
      <td><span class="t-title">${esc(C.pages[k].title)}</span></td>
      <td>${esc((C.pages[k].heading || '').slice(0, 60))}</td>
      <td class="actions"><button class="btn sm ghost" data-page="${esc(k)}">Bearbeiten</button></td></tr>`).join('');
    return `<div class="head"><div><h1>Seiteninhalte</h1><p>Statische Texte der Website bearbeiten, inkl. Impressum und Datenschutz.</p></div></div>
      <div class="card">${table(['Seite / Slug', 'Titel', 'Überschrift', ''], rows)}</div>`;
  }

  function settings() {
    const s = C.settings;
    const f = (k, l, t) => `<div class="field"><label>${l}</label><input name="${k}" type="${t || 'text'}" value="${esc(s[k])}" /></div>`;
    return `<div class="head"><div><h1>Einstellungen</h1><p>Vereinsdaten, Adressen und Erscheinungsbild.</p></div></div>
    <form class="card" id="setForm" style="padding:26px">
      <div class="grid2">
        ${f('clubName', 'Kurzname')}${f('legalName', 'Vereinsname (rechtlich)')}
        ${f('longName', 'Langname')}${f('founded', 'Gegründet')}
        ${f('members', 'Mitgliederzahl')}${f('district', 'Stadtteil')}
        ${f('street', 'Straße (Postanschrift)')}${f('zip', 'PLZ')}
        ${f('city', 'Ort')}${f('email', 'E-Mail')}
        ${f('phone', 'Telefon')}${f('instagramHandle', 'Instagram-Handle')}
        ${f('instagram', 'Instagram-URL')}${f('groundName', 'Sportplatz, Name')}
        ${f('groundAddress', 'Sportplatz, Adresse')}${f('hallName', 'Halle, Name')}
        ${f('hallAddress', 'Halle, Adresse')}${f('adminPin', 'Admin-Zugangscode')}
        <div class="field"><label>Hero-Bereich</label><select name="heroStyle"><option value="foto"${s.heroStyle === 'foto' ? ' selected' : ''}>Mit Foto</option><option value="farbe"${s.heroStyle === 'farbe' ? ' selected' : ''}>Ohne Foto (Farbfläche)</option></select></div>
        <div class="field"><label>Farbvariante</label><select name="palette">${['rotblau', 'rot', 'blau', 'dezent'].map((p) => `<option value="${p}"${s.palette === p ? ' selected' : ''}>${p}</option>`).join('')}</select></div>
        <div class="field"><label>Headline-Schrift</label><select name="headline">${['oswald', 'anton', 'archivo'].map((p) => `<option value="${p}"${s.headline === p ? ' selected' : ''}>${p}</option>`).join('')}</select></div>
      </div>
      <div style="display:flex;gap:10px;margin-top:22px">
        <button class="btn" type="submit">Speichern</button>
        <button class="btn danger" type="button" id="resetAll">Alle Inhalte zurücksetzen${window.OSGDB && window.OSGDB.configured ? ' (auch im Backend)' : ''}</button>
      </div>
    </form>`;
  }

  /* ---------- Modals ---------- */
  function closeModal() { el('modal').hidden = true; el('modal').innerHTML = ''; }
  function openModal(title, bodyHtml, footHtml) {
    el('modal').innerHTML = `<div class="sheet"><div class="sheet__head"><h2>${esc(title)}</h2><button type="button" id="mClose">×</button></div>
      <div class="sheet__body">${bodyHtml}</div><div class="sheet__foot">${footHtml}</div></div>`;
    el('modal').hidden = false;
    el('mClose').addEventListener('click', closeModal);
  }

  const UPLOADABLE = ['image', 'url', 'logo'];
  const uploadRow = (key) => (window.OSGDB && window.OSGDB.configured)
    ? `<div class="uprow"><input type="file" data-up="${key}" accept="image/*,application/pdf" /><small>Datei hochladen, die Adresse wird automatisch eingetragen</small></div>`
    : '<small>Bild- oder Dateiadresse eintragen (Upload erst mit angeschlossenem Backend)</small>';

  function wireUploads(formId, folder) {
    const form = el(formId);
    if (!form) return;
    form.querySelectorAll('[data-up]').forEach((inp) => {
      inp.addEventListener('change', async () => {
        const file = inp.files[0];
        if (!file) return;
        const target = form.querySelector('[name="' + inp.dataset.up + '"]');
        const hint = inp.parentElement.querySelector('small');
        hint.textContent = 'Wird hochgeladen...';
        const res = await window.OSGDB.upload(file, folder);
        if (res.ok) { target.value = res.url; hint.textContent = 'Hochgeladen'; }
        else hint.textContent = 'Upload fehlgeschlagen: ' + res.error;
      });
    });
  }

  function fieldHtml(f, v) {
    if (f.t === 'area') return `<div class="field"><label>${f.l}</label><textarea name="${f.k}" placeholder="${esc(f.ph || '')}">${esc(v)}</textarea><small>Leerzeile = neuer Absatz</small></div>`;
    if (f.t === 'select') return `<div class="field"><label>${f.l}</label><select name="${f.k}">${f.o.map((o) => `<option${o === v ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select></div>`;
    if (f.t === 'check') return `<label class="check"><input type="checkbox" name="${f.k}"${v === false ? '' : ' checked'} /> ${f.l}</label>`;
    const up = UPLOADABLE.indexOf(f.k) >= 0 ? uploadRow(f.k) : '';
    return `<div class="field"><label>${f.l}</label><input name="${f.k}" type="${f.t === 'date' ? 'date' : f.t === 'number' ? 'number' : 'text'}" value="${esc(v)}" placeholder="${esc(f.ph || '')}" />${up}</div>`;
  }

  function editItem(cfg, item) {
    const isNew = !item;
    const data = item || cfg.blank();
    const body = `<form id="itemForm">${cfg.fields.map((f) => fieldHtml(f, data[f.k] === undefined ? '' : data[f.k])).join('')}</form>`;
    openModal((isNew ? cfg.add : cfg.label + ' bearbeiten'), body,
      `<button class="btn ghost" type="button" id="mCancel">Abbrechen</button><button class="btn" type="button" id="mSave">Speichern</button>`);
    el('mCancel').addEventListener('click', closeModal);
    wireUploads('itemForm', cfg.key);
    el('mSave').addEventListener('click', () => {
      const fd = new FormData(el('itemForm'));
      const out = Object.assign({}, data);
      cfg.fields.forEach((f) => {
        if (f.t === 'check') out[f.k] = fd.get(f.k) === 'on';
        else if (f.t === 'number') out[f.k] = Number(fd.get(f.k) || 0);
        else out[f.k] = String(fd.get(f.k) == null ? '' : fd.get(f.k));
      });
      const fin = cfg.before ? cfg.before(out) : out;
      if (isNew) C[cfg.key].push(fin);
      else C[cfg.key] = C[cfg.key].map((x) => (x.id === fin.id ? fin : x));
      persist(); closeModal(); render(); toast('Gespeichert');
    });
  }

  function editPage(slug) {
    const p = C.pages[slug];
    const extra = ['kicker', 'sub'].filter((k) => k in p);    const body = `<form id="pageForm">
      <div class="field"><label>Interner Titel</label><input name="title" value="${esc(p.title)}" /></div>
      <div class="field"><label>Überschrift</label><input name="heading" value="${esc(p.heading || '')}" /></div>
      ${extra.map((k) => `<div class="field"><label>${k === 'kicker' ? 'Kicker (kleine Zeile)' : 'Unterzeile'}</label><input name="${k}" value="${esc(p[k])}" /></div>`).join('')}
      <div class="field"><label>Text</label><textarea name="body" style="min-height:260px">${esc(p.body || '')}</textarea><small>Leerzeile = neuer Absatz</small></div>
      ${'image' in p ? `<div class="field"><label>Bild-URL</label><input name="image" value="${esc(p.image || '')}" />${uploadRow('image')}</div>` : ''}
    </form>`;
    openModal('Seiteninhalt: ' + slug, body, `<button class="btn ghost" type="button" id="mCancel">Abbrechen</button><button class="btn" type="button" id="mSave">Speichern</button>`);
    el('mCancel').addEventListener('click', closeModal);
    wireUploads('pageForm', 'seiten');
    el('mSave').addEventListener('click', () => {
      const fd = new FormData(el('pageForm'));
      fd.forEach((v, k) => { C.pages[slug][k] = String(v); });
      persist(); closeModal(); render(); toast('Seiteninhalt gespeichert');
    });
  }

  function showSub(id) {
    const s = subs.find((x) => x.id === id);
    if (!s) return;
    const row = (l, v) => v ? `<div><dt>${l}</dt><dd>${esc(v)}</dd></div>` : '';
    openModal('Anfrage · ' + s.type, `<div class="detail">
      ${row('Eingang', dtt(s.createdAt))}${row('Anliegen', s.type)}${row('Abteilung', s.dept)}${row('Mannschaft', s.team)}
      ${row('Name', s.name)}${row('Geburtsjahr', s.birth)}${row('E-Mail', s.email)}${row('Telefon', s.phone)}
      ${row('Nachricht', s.message)}${row('Status', s.status)}</div>`,
      `<button class="btn ghost" type="button" id="mMail">E-Mail schreiben</button>
       <button class="btn danger" type="button" id="mRej">Ablehnen</button>
       <button class="btn ok" type="button" id="mAcc">Annehmen</button>`);
    el('mMail').addEventListener('click', () => { location.href = `mailto:${s.email}?subject=${encodeURIComponent('Deine Anfrage an die ÖSG Viktoria 08')}`; });
    el('mAcc').addEventListener('click', () => setStatus(id, 'angenommen'));
    el('mRej').addEventListener('click', () => setStatus(id, 'abgelehnt'));
  }

  async function setStatus(id, st) {
    const DB = window.OSGDB;
    if (DB && DB.configured) {
      const res = await DB.setStatus(id, st);
      if (!res.ok) { toast('Backend-Fehler: ' + res.error); return; }
      subs = (await DB.listSubmissions()) || subs;
    } else {
      S.setStatus(id, st); subs = S.submissions();
    }
    closeModal(); render();
    toast(st === 'angenommen' ? 'Anfrage angenommen' : 'Anfrage abgelehnt');
  }

  /* ---------- Export / Import ---------- */
  function exportJson() {
    const blob = new Blob([JSON.stringify({ content: C, submissions: subs }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'oesg-viktoria-inhalte.json';
    a.click();
    toast('Export gestartet');
  }
  function importJson(e) {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (d.content) { S.save(d.content); C = S.load(); }
        if (d.submissions) { S.saveSubmissions(d.submissions); subs = S.submissions(); }
        render(); toast('Inhalte importiert');
      } catch (err) { toast('Datei konnte nicht gelesen werden'); }
    };
    r.readAsText(file);
    e.target.value = '';
  }

  /* ---------- Render ---------- */
  function render() {
    nav();
    const c = el('content');
    if (view === 'dashboard') c.innerHTML = dashboard();
    else if (view === 'anfragen') c.innerHTML = anfragen();
    else if (view === 'pages') c.innerHTML = pages();
    else if (view === 'settings') c.innerHTML = settings();
    else if (COLLECTIONS[view]) c.innerHTML = collection(COLLECTIONS[view]);
    else { view = 'dashboard'; c.innerHTML = dashboard(); }

    c.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { view = b.dataset.go; location.hash = view; render(); }));
    c.querySelectorAll('[data-sub]').forEach((b) => b.addEventListener('click', () => showSub(b.dataset.sub)));
    c.querySelectorAll('[data-acc]').forEach((b) => b.addEventListener('click', () => setStatus(b.dataset.acc, 'angenommen')));
    c.querySelectorAll('[data-rej]').forEach((b) => b.addEventListener('click', () => setStatus(b.dataset.rej, 'abgelehnt')));
    c.querySelectorAll('[data-page]').forEach((b) => b.addEventListener('click', () => editPage(b.dataset.page)));

    const cfg = COLLECTIONS[view];
    if (cfg) {
      const add = el('addBtn');
      if (add) add.addEventListener('click', () => editItem(cfg, null));
      c.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => editItem(cfg, C[cfg.key].find((x) => x.id === b.dataset.edit))));
      c.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
        if (!confirm('Eintrag wirklich löschen?')) return;
        C[cfg.key] = C[cfg.key].filter((x) => x.id !== b.dataset.del);
        persist(); render(); toast('Gelöscht');
      }));
    }
    const cd = el('clearDone');
    if (cd) cd.addEventListener('click', async () => {
      const DB = window.OSGDB;
      if (DB && DB.configured) {
        const res = await DB.removeProcessed();
        if (!res.ok) { toast('Backend-Fehler: ' + res.error); return; }
        subs = (await DB.listSubmissions()) || [];
      } else {
        S.saveSubmissions(subs.filter((s) => s.status === 'neu'));
        subs = S.submissions();
      }
      render(); toast('Bearbeitete Anfragen gelöscht');
    });
    const sf = el('setForm');
    if (sf) {
      sf.addEventListener('submit', (e) => {
        e.preventDefault();
        new FormData(sf).forEach((v, k) => { C.settings[k] = String(v); });
        persist(); render(); toast('Einstellungen gespeichert');
      });
      el('resetAll').addEventListener('click', async () => {
        const DB = window.OSGDB;
        const msg = DB && DB.configured
          ? 'Alle Inhalte auf den Ausgangsstand zurücksetzen? Das gilt dann auch für alle Besucher der Website.'
          : 'Alle Inhalte auf den Ausgangsstand zurücksetzen?';
        if (!confirm(msg)) return;
        S.reset(); C = S.load();
        if (DB && DB.configured) {
          const res = await DB.saveContent(C);
          if (!res.ok) { toast('Backend-Fehler: ' + res.error); return; }
        }
        render(); toast('Inhalte zurückgesetzt');
      });
    }
  }

  window.addEventListener('hashchange', () => { const v = location.hash.replace('#', ''); if (v && v !== view) { view = v; render(); } });
  async function boot() {
    const DB = window.OSGDB;
    if (DB && DB.configured) {
      const user = await DB.user();
      if (!user) { loginBackend(); return; }
      const remote = await DB.fetchContent();
      if (remote) { S.save(remote); C = S.load(); }
      const list = await DB.listSubmissions();
      if (list) subs = list;
    } else if (!isAuthed()) { login(); return; }
    shell(); render();
  }
  boot();
})();
