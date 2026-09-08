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
      fields: [F.text('name', 'Name'), F.text('slug', 'URL-Slug', 'wird automatisch erzeugt'),
        F.sel('group', 'Gruppe', ['Senioren', 'Junioren']), F.sel('dept', 'Abteilung', ['Fußball', 'Boxen', 'Tischtennis', 'Gymnastik']),
        F.text('ageClass', 'Altersklasse', 'z. B. F-Jugend'), F.text('league', 'Liga'),
        F.text('coaches', 'Trainer/Betreuer'), F.text('contactEmail', 'Kontakt-E-Mail Trainer'),
        F.text('times', 'Trainingszeiten'), F.text('image', 'Mannschaftsfoto-URL'), F.num('order', 'Sortierung')],
      blank: () => ({ id: S.uid('t'), name: '', slug: '', group: 'Senioren', dept: 'Fußball', ageClass: '', league: '', coaches: '', contactEmail: '', times: '', image: '', order: 99, roster: [], matches: [] }),
      before: (x) => { if (!x.slug) x.slug = slugify(x.name); if (!x.roster) x.roster = []; if (!x.matches) x.matches = []; return x; },
      extraActions: (x) => `<button class="btn sm" data-kader="${x.id}">Kader & Spielplan</button>`,
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
      cols: [
        { h: 'Logo', r: (x) => x.logo ? `<img class="logo-thumb" src="${esc(x.logo)}" alt="" />` : '<span class="pill wartet">fehlt</span>' },
        { h: 'Name', r: (x) => `<span class="t-title">${esc(x.name)}</span><span class="t-sub">${esc(x.url || '')}</span>` }
      ],
      fields: [F.text('name', 'Name'), F.text('url', 'Website'), F.text('logo', 'Logo-URL')],
      blank: () => ({ id: S.uid('p'), name: '', url: '', logo: '' })
    },
    people: {
      key: 'people', label: 'Ansprechpartner', unit: 'Personen', add: 'Neuer Ansprechpartner',
      cols: [
        { h: 'Person', r: (x) => `${x.photo ? `<img class="avatar-img" src="${esc(x.photo)}" alt="" />` : `<span class="avatar">${esc((x.name || '?').charAt(0))}</span>`}<span class="t-title" style="display:inline">${esc(x.name)}</span>` },
        { h: 'Funktion', r: (x) => esc(x.role) },
        { h: 'Bereich', r: (x) => `<span class="pill">${esc(x.area)}</span>` },
        { h: 'E-Mail', r: (x) => x.email ? esc(x.email) : '<span class="t-sub">,</span>' },
        { h: 'Öffentlich', r: (x) => x.publish === false ? '<span class="pill abgelehnt">nein</span>' : '<span class="pill angenommen">ja</span>' }
      ],
      fields: [F.text('name', 'Name'), F.text('role', 'Funktion'), F.sel('area', 'Bereich', ['Vorstand', 'Sport', 'Trainerteam', 'Abteilung Boxen', 'Abteilung Tischtennis', 'Abteilung Gymnastik']), F.text('email', 'E-Mail (optional)'), F.text('phone', 'Telefon (intern)'), F.text('photo', 'Foto'), F.num('order', 'Sortierung'), F.bool('publish', 'Auf der Website anzeigen')],
      blank: () => ({ id: S.uid('pe'), name: '', role: '', area: 'Vorstand', email: '', phone: '', photo: '', order: 99, publish: true }),
      sort: (a, b) => (a.order || 0) - (b.order || 0)
    }
  };

  const NAV = [
    ['dashboard', 'Dashboard'], ['anfragen', 'Anfragen'], ['news', 'News'], ['events', 'Termine'],
    ['teams', 'Mannschaften'], ['depts', 'Abteilungen'], ['gallery', 'Galerie'], ['docs', 'Dokumente'],
    ['pages', 'Seiteninhalte'], ['faq', 'FAQ'], ['partners', 'Partner'], ['people', 'Ansprechpartner'],
    ['mitglieder', 'Mitglieder'], ['intern', 'Interne Ablage'], ['aufgaben', 'Aufgaben'],
    ['zugaenge', 'Zugänge'], ['meinerechte', 'Meine Rechte'], ['settings', 'Einstellungen']
  ];

  /* ---------- Login ---------- */
  function isAuthed() { return sessionStorage.getItem('osg_admin') === '1'; }

  function loginBackend(mode) {
    const reg = mode === 'register';
    document.body.innerHTML = `<div class="login"><form class="login__box" id="lf">
      <h1>${reg ? 'Zugang beantragen' : 'Admin-Bereich'}</h1>
      <p>${reg
        ? 'Registriere dich mit deiner E-Mail. Ein Vorstandsmitglied schaltet den Zugang danach frei.'
        : 'ÖSG Viktoria 08 e.V. Bitte mit deinem Vereinszugang anmelden.'}</p>
      ${reg ? '<div class="field"><label for="nm">Name</label><input id="nm" type="text" autocomplete="name" /></div>' : ''}
      <div class="field"><label for="mail">E-Mail</label><input id="mail" type="email" autocomplete="username" /></div>
      <div class="field"><label for="pw">Passwort</label><input id="pw" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}" /></div>
      <p class="login__err" id="lerr"></p>
      <button class="btn" type="submit">${reg ? 'Zugang beantragen' : 'Anmelden'}</button>
      <button class="btn ghost" type="button" id="switchMode">${reg ? 'Zurück zur Anmeldung' : 'Noch keinen Zugang? Registrieren'}</button>
      ${reg ? '' : '<button class="btn ghost" type="button" id="forgot">Passwort vergessen</button>'}
    </form></div>`;
    el('switchMode').addEventListener('click', () => loginBackend(reg ? 'login' : 'register'));
    if (reg) {
      el('lf').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (el('pw').value.length < 8) { el('lerr').textContent = 'Bitte ein Passwort mit mindestens 8 Zeichen wählen.'; return; }
        el('lerr').textContent = 'Wird angelegt...';
        const res = await window.OSGDB.signUp(el('mail').value.trim(), el('pw').value, el('nm').value.trim());
        if (res.ok) {
          el('lf').innerHTML = '<h1>Fast fertig</h1><p>Dein Zugang ist beantragt. Sobald ein Vorstandsmitglied ihn freischaltet, kannst du dich anmelden. Falls Supabase eine Bestätigungsmail verschickt, bitte zuerst den Link darin anklicken.</p><a class="btn" href="admin.html">Zur Anmeldung</a>';
        } else el('lerr').textContent = 'Registrierung fehlgeschlagen: ' + res.error;
      });
      return;
    }
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

  function setupScreen(p) {
    document.body.innerHTML = `<div class="login"><div class="login__box">
      <h1>Zugangsverwaltung fehlt</h1>
      <p>Angemeldet als <b>${esc(p.email || '')}</b>. Die Tabelle für Zugänge ist noch nicht angelegt.
      Bitte die Datei <b>supabase-zugaenge.sql</b> im Supabase SQL Editor ausführen und diese Seite neu laden.</p>
      <p class="t-sub">Meldung: ${esc(p.fehler || '')}</p>
      <button class="btn" type="button" id="sReload">Neu laden</button>
      <button class="btn ghost" type="button" id="sOut">Abmelden</button>
    </div></div>`;
    el('sReload').addEventListener('click', () => location.reload());
    el('sOut').addEventListener('click', async () => { await window.OSGDB.signOut(); location.reload(); });
  }

  function pendingScreen(p) {
    document.body.innerHTML = `<div class="login"><div class="login__box">
      <h1>Warten auf Freischaltung</h1>
      <p>Angemeldet als <b>${esc(p.email || '')}</b>. Ein Vorstandsmitglied mit Admin-Rechten muss den Zugang noch freischalten.</p>
      <button class="btn ghost" type="button" id="pOut">Abmelden</button>
    </div></div>`;
    el('pOut').addEventListener('click', async () => { await window.OSGDB.signOut(); location.reload(); });
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
          ${canEdit() ? '' : '<span class="badge-db local">Nur-Lesen-Zugang</span>'}
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
    const items = NAV.filter(([k]) => k !== 'zugaenge' || isAdminRole());
    el('nav').innerHTML = items.map(([k, l]) => `<button data-v="${k}" class="${view === k ? 'active' : ''}">${l}${k === 'anfragen' && open ? `<span class="count">${open}</span>` : ''}</button>`).join('');
    el('nav').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { view = b.dataset.v; location.hash = view; render(); }));
  }

  function toast(msg) { const t = el('toast'); t.textContent = msg; t.hidden = false; clearTimeout(t._t); t._t = setTimeout(() => { t.hidden = true; }, 2200); }
  function persist() {
    const DB = window.OSGDB;
    if (DB && DB.configured && !canEdit()) { toast('Dein Zugang darf nur lesen'); return; }
    const vorher = S.load();
    S.save(C); C = S.load();
    if (DB && DB.configured) {
      DB.saveContent(C).then(async (res) => {
        if (res.ok) return;
        // Nicht gespeichert: lokalen Stand zurückrollen, damit nichts Falsches angezeigt wird
        const remote = await DB.fetchContent();
        S.save(remote || vorher); C = S.load(); render();
        toast('Nicht gespeichert: ' + res.error);
      });
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
        ${canEdit() ? `<button class="btn sm ok" data-acc="${s.id}">Annehmen</button>
        <button class="btn sm danger" data-rej="${s.id}">Ablehnen</button>` : ''}
      </td></tr>`).join('');
    return `<div class="head"><div><h1>Anfragen & Anmeldungen</h1><p>${subs.length} Einträge · über das Kontaktformular der Website eingegangen</p></div>
      ${canEdit() ? '<button class="btn ghost" id="clearDone">Bearbeitete löschen</button>' : ''}</div>
      <div class="card">${subs.length ? table(['Eingang', 'Anliegen', 'Person', 'Status', ''], rows) : '<div class="empty">Noch keine Anfragen eingegangen.</div>'}</div>`;
  }

  function collection(cfg) {
    const list = C[cfg.key].slice().sort(cfg.sort || (() => 0));
    const rows = list.map((x) => `<tr>${cfg.cols.map((c) => `<td>${c.r(x)}</td>`).join('')}
      <td class="actions">${itemEditable(cfg.key, x)
        ? `${cfg.extraActions ? cfg.extraActions(x) : ''}<button class="btn sm ghost" data-edit="${x.id}">Bearbeiten</button><button class="btn sm danger" data-del="${x.id}">Löschen</button>`
        : `${cfg.extraActions ? '<span class="t-sub">nur lesen</span>' : '<span class="t-sub">nur lesen</span>'}`}</td></tr>`).join('');
    return `<div class="head"><div><h1>${cfg.label} verwalten</h1><p>${list.length} ${cfg.unit}</p></div>
      ${sectionEditable(cfg.key) ? `<button class="btn" id="addBtn">+ ${cfg.add}</button>` : ''}</div>
      <div class="card">${list.length ? table(cfg.cols.map((c) => c.h).concat(['']), rows) : '<div class="empty">Noch keine Einträge.</div>'}</div>`;
  }

  function pages() {
    const keys = Object.keys(C.pages);
    const rows = keys.map((k) => `<tr>
      <td><span class="t-sub" style="font-size:13px">${esc(k)}</span></td>
      <td><span class="t-title">${esc(C.pages[k].title)}</span></td>
      <td>${esc((C.pages[k].heading || '').slice(0, 60))}</td>
      <td class="actions">${sectionEditable('pages') ? `<button class="btn sm ghost" data-page="${esc(k)}">Bearbeiten</button>` : '<span class="t-sub">nur lesen</span>'}</td></tr>`).join('');
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
        <div class="field"><label>Vereinslogo</label><input name="logoUrl" value="${esc(s.logoUrl || '')}" placeholder="Datei hochladen oder Adresse eintragen"${canEdit() ? '' : ' disabled'} />${canEdit() ? uploadRow('logoUrl') : ''}${s.logoUrl ? `<img src="${esc(s.logoUrl)}" alt="" style="max-height:70px;margin-top:8px" />` : '<small>Ohne Logo wird das Platzhalter-Wappen angezeigt</small>'}</div>
        <div class="field"><label>Farbvariante</label><select name="palette">${['rotblau', 'rot', 'blau', 'dezent'].map((p) => `<option value="${p}"${s.palette === p ? ' selected' : ''}>${p}</option>`).join('')}</select></div>
        <div class="field"><label>Headline-Schrift</label><select name="headline">${['oswald', 'anton', 'archivo'].map((p) => `<option value="${p}"${s.headline === p ? ' selected' : ''}>${p}</option>`).join('')}</select></div>
      </div>
      ${canEdit() ? `<div style="display:flex;gap:10px;margin-top:22px">
        <button class="btn" type="submit">Speichern</button>
        <button class="btn danger" type="button" id="resetAll">Alle Inhalte zurücksetzen${window.OSGDB && window.OSGDB.configured ? ' (auch im Backend)' : ''}</button>
      </div>` : '<p class="t-sub" style="margin-top:22px">Dein Zugang darf Einstellungen nur ansehen.</p>'}
    </form>`;
  }

  let profiles = [];
  let invites = [];
  let requests = [];
  let myProfile = null;
  const canEdit = () => {
    const DB = window.OSGDB;
    if (!DB || !DB.configured) return true;
    return !!(myProfile && (myProfile.role === 'admin' || myProfile.role === 'redaktion'));
  };
  const myScope = () => ({
    depts: (myProfile && myProfile.scope_depts) || [],
    teams: (myProfile && myProfile.scope_teams) || []
  });
  const unscoped = () => { const s = myScope(); return !s.depts.length && !s.teams.length; };
  /* Darf dieser Bereich überhaupt bearbeitet werden? */
  const sectionEditable = (key) => {
    if (!canEdit()) return false;
    if (isAdminRole() || unscoped()) return true;
    return ['news', 'events', 'teams', 'depts', 'gallery'].indexOf(key) >= 0;
  };
  /* Darf dieser einzelne Eintrag bearbeitet werden? */
  const itemEditable = (key, x) => {
    if (!canEdit()) return false;
    if (isAdminRole() || unscoped()) return true;
    const s = myScope();
    if (key === 'teams') return s.teams.indexOf(x.slug || x.id) >= 0;
    if (key === 'depts') return s.depts.indexOf(x.slug) >= 0;
    if (key === 'news' || key === 'events') {
      const dep = C.depts.find((d) => d.name === x.category);
      return !!dep && s.depts.indexOf(dep.slug) >= 0;
    }
    if (key === 'gallery') return true;
    return false;
  };
  const scopeText = () => {
    const s = myScope();
    if (unscoped()) return 'alle Bereiche';
    const dn = s.depts.map((x) => { const d = C.depts.find((y) => y.slug === x); return d ? d.name : x; });
    const tn = s.teams.map((x) => { const t = C.teams.find((y) => (y.slug || y.id) === x); return t ? t.name : x; });
    return [dn.join(', '), tn.join(', ')].filter(Boolean).join(' · ');
  };
  const isAdminRole = () => {
    const DB = window.OSGDB;
    if (!DB || !DB.configured) return true;
    return !!(myProfile && myProfile.role === 'admin');
  };

  const ROLE_LABEL = { admin: 'Admin', redaktion: 'Redaktion', lesen: 'Nur lesen' };
  const ROLE_INFO = 'Admin: alles inklusive Zugänge. Redaktion: Inhalte und Anfragen pflegen. Nur lesen: alles ansehen, nichts ändern.';

  function zugaenge() {
    const DB = window.OSGDB;
    if (!DB || !DB.configured) {
      return `<div class="head"><div><h1>Zugänge</h1><p>Ohne Backend gibt es nur den gemeinsamen Zugangscode aus den Einstellungen.</p></div></div>`;
    }
    const admin = myProfile && myProfile.role === 'admin';
    const rows = profiles.map((p) => `<tr>
      <td>${p.avatar_url ? `<img class="avatar-img" src="${esc(p.avatar_url)}" alt="" />` : `<span class="avatar">${esc((p.name || p.email || '?').charAt(0).toUpperCase())}</span>`}
        <span class="t-title" style="display:inline">${esc(p.name || '(ohne Namen)')}</span>
        <span class="t-sub">${esc(p.email || '')}${p.phone ? ' · ' + esc(p.phone) : ''}</span></td>
      <td>${esc(p.funktion || '—')}</td>
      <td><span class="pill">${esc(ROLE_LABEL[p.role] || p.role)}</span></td>
      <td>${p.approved ? '<span class="pill angenommen">freigeschaltet</span>' : '<span class="pill wartet">wartet auf Freigabe</span>'}</td>
      <td class="actions">${admin ? `
        <button class="btn sm ghost" data-editp="${p.id}">Bearbeiten</button>
        <button class="btn sm ghost" data-role="${p.id}">${p.role === 'admin' ? 'Zu Redaktion' : 'Zu Admin'}</button>
        <button class="btn sm ${p.approved ? 'ghost' : 'ok'}" data-appr="${p.id}">${p.approved ? 'Sperren' : 'Freischalten'}</button>
        <button class="btn sm danger" data-delp="${p.id}">Löschen</button>` : '<span class="t-sub">nur Admins</span>'}</td>
    </tr>`).join('');

    const invRows = invites.map((i) => `<tr>
      <td><span class="t-title">${esc(i.name || '(ohne Namen)')}</span><span class="t-sub">${esc(i.email)}${i.phone ? ' · ' + esc(i.phone) : ''}</span></td>
      <td>${esc(i.funktion || '—')}</td>
      <td><span class="pill">${esc(ROLE_LABEL[i.role] || i.role)}</span></td>
      <td><span class="pill wartet">noch nicht registriert</span></td>
      <td class="actions">${admin ? `<button class="btn sm ghost" data-editi="${esc(i.email)}">Bearbeiten</button>
        <button class="btn sm danger" data-deli="${esc(i.email)}">Zurückziehen</button>` : ''}</td>
    </tr>`).join('');

    return `<div class="head"><div><h1>Zugänge</h1><p>${profiles.length} Konten${invites.length ? ', ' + invites.length + ' offene Einladungen' : ''}</p></div>
      ${admin ? '<button class="btn" id="newInvite">+ Zugang anlegen</button>' : ''}</div>
      <div class="card">${(profiles.length || invites.length)
        ? table(['Person', 'Funktion', 'Rechte', 'Status', ''], rows + invRows)
        : '<div class="empty">Noch keine Zugänge.</div>'}</div>
      <p class="t-sub" style="margin-top:14px">${ROLE_INFO}${admin ? '' : ' Freischalten und Rechte ändern dürfen nur Admins.'}</p>
      ${admin && requests.length ? `<h4 class="group-title" style="margin-top:30px">Rechteanfragen</h4>
      <div class="card">${table(['Person', 'Wunsch', 'Bereiche', 'Begründung', 'Status', ''], requests.map((r) => `<tr>
        <td><span class="t-title">${esc(r.name || r.email || '')}</span><span class="t-sub">${esc(r.email || '')}</span></td>
        <td>${esc(ROLE_LABEL[r.wish_role] || r.wish_role || '')}</td>
        <td>${esc(r.wish_scope || '')}</td>
        <td>${esc(String(r.reason || '').slice(0, 80))}</td>
        <td><span class="pill ${r.status === 'genehmigt' ? 'angenommen' : r.status === 'abgelehnt' ? 'abgelehnt' : 'wartet'}">${esc(r.status)}</span></td>
        <td class="actions">${r.status === 'offen' ? `<button class="btn sm ok" data-reqok="${r.id}">Genehmigen</button>
          <button class="btn sm danger" data-reqno="${r.id}">Ablehnen</button>` : ''}</td>
      </tr>`).join(''))}</div>
      <p class="t-sub" style="margin-top:10px">Genehmigen setzt die gewünschte Rechtestufe. Bereiche danach im Profil anhaken.</p>` : ''}`;
  }

  const hasScope = () => {
    const DB = window.OSGDB;
    return !DB || !DB.configured || DB.features.scope;
  };
  const hasRequests = () => {
    const DB = window.OSGDB;
    return !!(DB && DB.configured && DB.features.requests);
  };

  function scopeFields(p) {
    if (!hasScope()) {
      return '<p class="t-sub">Zuständigkeiten pro Abteilung und Mannschaft sind noch nicht eingerichtet. Dafür einmal <b>supabase-zustaendigkeit.sql</b> im Supabase SQL Editor ausführen.</p>';
    }
    const sd = (p.scope_depts || []), st = (p.scope_teams || []);
    return `<div class="field"><label>Zuständig für Abteilungen</label>
        <div class="chips">${C.depts.map((d) => `<label class="chip"><input type="checkbox" name="scope_depts" value="${esc(d.slug)}"${sd.indexOf(d.slug) >= 0 ? ' checked' : ''} /> ${esc(d.name)}</label>`).join('')}</div></div>
      <div class="field"><label>Zuständig für Mannschaften</label>
        <div class="chips">${C.teams.map((t) => `<label class="chip"><input type="checkbox" name="scope_teams" value="${esc(t.slug || t.id)}"${st.indexOf(t.slug || t.id) >= 0 ? ' checked' : ''} /> ${esc(t.name)}</label>`).join('')}</div>
        <small>Nichts angehakt bedeutet: zuständig für alles. Mit Auswahl darf die Person nur diese Bereiche bearbeiten, alles andere nur ansehen.</small></div>`;
  }

  function meineRechte() {
    const DB = window.OSGDB;
    if (!DB || !DB.configured) {
      return '<div class="head"><div><h1>Meine Rechte</h1><p>Ohne Backend gibt es nur den gemeinsamen Zugangscode.</p></div></div>';
    }
    const p = myProfile || {};
    const meine = requests.filter((r) => r.user_id === p.id);
    return `<div class="head"><div><h1>Meine Rechte</h1><p>Angemeldet als ${esc(p.email || '')}</p></div></div>
      <div class="tiles">
        <div class="tile"><b style="font-size:22px">${esc(ROLE_LABEL[p.role] || p.role || '')}</b><span>Rechtestufe</span></div>
        <div class="tile"><b style="font-size:22px">${esc(p.funktion || '—')}</b><span>Funktion im Verein</span></div>
        <div class="tile"><b style="font-size:18px">${esc(scopeText())}</b><span>Zuständig für</span></div>
      </div>
      <div class="head" style="margin:30px 0 14px"><div><h1 style="font-size:22px">Mehr Rechte anfragen</h1>
        <p>Die Anfrage geht an die Admins des Vereins.</p></div></div>
      ${!hasRequests() ? '<div class="card" style="padding:24px"><p>Rechteanfragen sind noch nicht eingerichtet. Dafür einmal <b>supabase-zustaendigkeit.sql</b> im Supabase SQL Editor ausführen.</p></div>' : `
      <form class="card" id="reqForm" style="padding:24px">
        <div class="grid2">
          <div class="field"><label>Gewünschte Rechtestufe</label><select name="wish_role">${Object.keys(ROLE_LABEL).map((r) => `<option value="${r}"${p.role === r ? ' selected' : ''}>${ROLE_LABEL[r]}</option>`).join('')}</select></div>
        </div>
        <div class="field"><label>Gewünschte Abteilungen</label>
          <div class="chips">${C.depts.map((d) => `<label class="chip"><input type="checkbox" name="wish_depts" value="${esc(d.name)}" /> ${esc(d.name)}</label>`).join('')}</div></div>
        <div class="field"><label>Gewünschte Mannschaften</label>
          <div class="chips">${C.teams.map((t) => `<label class="chip"><input type="checkbox" name="wish_teams" value="${esc(t.name)}" /> ${esc(t.name)}</label>`).join('')}</div>
          <small>Nichts auswählen bedeutet: Rechte für alle Bereiche.</small></div>
        <div class="field"><label>Begründung</label><textarea name="reason" style="min-height:90px" placeholder="Warum brauchst du die Rechte?"></textarea></div>
        <button class="btn" type="submit">Anfrage senden</button>
      </form>`}
      ${meine.length ? `<h4 class="group-title" style="margin-top:30px">Meine Anfragen</h4>
      <div class="card">${table(['Gestellt', 'Wunsch', 'Bereiche', 'Status'], meine.map((r) => `<tr>
        <td>${dt(r.created_at)}</td><td>${esc(ROLE_LABEL[r.wish_role] || r.wish_role || '')}</td>
        <td>${esc(r.wish_scope || '')}</td>
        <td><span class="pill ${r.status === 'genehmigt' ? 'angenommen' : r.status === 'abgelehnt' ? 'abgelehnt' : 'wartet'}">${esc(r.status)}</span></td>
      </tr>`).join(''))}</div>` : ''}`;
  }

  function editProfile(p) {
    const body = `<form id="profForm">
      <div class="grid2">
        <div class="field"><label>Name</label><input name="name" value="${esc(p.name || '')}" /></div>
        <div class="field"><label>Funktion im Verein</label><input name="funktion" value="${esc(p.funktion || '')}" placeholder="z. B. Jugendleiter" /></div>
        <div class="field"><label>E-Mail (Login)</label><input value="${esc(p.email || '')}" disabled /></div>
        <div class="field"><label>Telefon</label><input name="phone" value="${esc(p.phone || '')}" /></div>
        <div class="field"><label>Foto</label><input name="avatar_url" value="${esc(p.avatar_url || '')}" placeholder="Datei hochladen oder Adresse" />${uploadRow('avatar_url')}</div>
        <div class="field"><label>Rechte</label><select name="role">${Object.keys(ROLE_LABEL).map((r) => `<option value="${r}"${p.role === r ? ' selected' : ''}>${ROLE_LABEL[r]}</option>`).join('')}</select></div>
        <label class="check" style="align-self:end"><input type="checkbox" name="approved"${p.approved ? ' checked' : ''} /> Zugang freigeschaltet</label>
      </div>
      ${scopeFields(p)}
      <p class="t-sub">${ROLE_INFO}</p>
    </form>`;
    openModal('Zugang bearbeiten', body, '<button class="btn ghost" type="button" id="mCancel">Abbrechen</button><button class="btn" type="button" id="mSave">Speichern</button>');
    el('mCancel').addEventListener('click', closeModal);
    wireUploads('profForm', 'profile');
    el('mSave').addEventListener('click', async () => {
      const fd = new FormData(el('profForm'));
      const patch = {
        name: String(fd.get('name') || ''), funktion: String(fd.get('funktion') || ''),
        phone: String(fd.get('phone') || ''), role: String(fd.get('role')),
        avatar_url: String(fd.get('avatar_url') || ''),
        approved: fd.get('approved') === 'on'
      };
      if (hasScope()) {
        patch.scope_depts = fd.getAll('scope_depts').map(String);
        patch.scope_teams = fd.getAll('scope_teams').map(String);
      }
      const res = await window.OSGDB.setProfile(p.id, patch);
      if (!res.ok) { toast('Fehler: ' + res.error); return; }
      profiles = (await window.OSGDB.listProfiles()) || profiles;
      closeModal(); render(); toast('Zugang gespeichert');
    });
  }

  function editInvite(inv) {
    const isNew = !inv;
    const i = inv || { email: '', name: '', phone: '', funktion: '', role: 'redaktion' };
    const body = `<form id="invForm">
      <div class="grid2">
        <div class="field"><label>Name</label><input name="name" value="${esc(i.name || '')}" /></div>
        <div class="field"><label>Funktion im Verein</label><input name="funktion" value="${esc(i.funktion || '')}" placeholder="z. B. 2. Kassierer" /></div>
        <div class="field"><label>E-Mail</label><input name="email" type="email" value="${esc(i.email || '')}"${isNew ? '' : ' disabled'} /></div>
        <div class="field"><label>Telefon</label><input name="phone" value="${esc(i.phone || '')}" /></div>
        <div class="field"><label>Rechte</label><select name="role">${Object.keys(ROLE_LABEL).map((r) => `<option value="${r}"${i.role === r ? ' selected' : ''}>${ROLE_LABEL[r]}</option>`).join('')}</select></div>
      </div>
      ${scopeFields(i)}
      <p class="t-sub">Die Person registriert sich auf admin.html mit genau dieser E-Mail und wählt dabei ihr Passwort. Der Zugang ist dann sofort freigeschaltet, Name, Funktion und Rechte werden übernommen.</p>
    </form>`;
    openModal(isNew ? 'Zugang anlegen' : 'Einladung bearbeiten', body,
      '<button class="btn ghost" type="button" id="mCancel">Abbrechen</button><button class="btn" type="button" id="mSave">Speichern</button>');
    el('mCancel').addEventListener('click', closeModal);
    el('mSave').addEventListener('click', async () => {
      const fd = new FormData(el('invForm'));
      const mail = String(fd.get('email') || i.email || '').trim();
      if (!mail) { toast('Bitte eine E-Mail eintragen'); return; }
      const res = await window.OSGDB.addInvite({
        email: mail, name: String(fd.get('name') || ''), phone: String(fd.get('phone') || ''),
        funktion: String(fd.get('funktion') || ''), role: String(fd.get('role')),
        scope_depts: hasScope() ? fd.getAll('scope_depts').map(String) : [],
        scope_teams: hasScope() ? fd.getAll('scope_teams').map(String) : []
      });
      if (!res.ok) { toast('Fehler: ' + res.error); return; }
      invites = (await window.OSGDB.listInvites()) || invites;
      closeModal(); render(); toast('Zugang vorbereitet');
    });
  }

  /* ---------- Interner Abteilungsbereich ---------- */
  let internRows = { members: [], internal_docs: [], tasks: [] };
  let internDept = '';
  let internTeam = '';

  const INTERN = {
    mitglieder: {
      table: 'members', label: 'Mitglieder', unit: 'Mitglieder', add: 'Neues Mitglied', order: 'last_name',
      cols: [
        { h: 'Name', r: (x) => `<span class="t-title">${esc(x.last_name)}, ${esc(x.first_name)}</span><span class="t-sub">${esc(x.email || '')}${x.phone ? ' · ' + esc(x.phone) : ''}</span>` },
        { h: 'Mannschaft', r: (x) => x.team ? esc(teamName(x.team)) : '<span class="t-sub">abteilungsweit</span>' },
        { h: 'Geburtsdatum', r: (x) => x.birthdate ? dt(x.birthdate) : '—' },
        { h: 'Mitglied seit', r: (x) => x.member_since ? dt(x.member_since) : '—' },
        { h: 'Status', r: (x) => `<span class="pill ${x.status === 'aktiv' ? 'angenommen' : x.status === 'ausgetreten' ? 'abgelehnt' : 'wartet'}">${esc(x.status)}</span>` }
      ],
      fields: [
        { k: 'first_name', l: 'Vorname', t: 'text' }, { k: 'last_name', l: 'Nachname', t: 'text' },
        { k: 'birthdate', l: 'Geburtsdatum', t: 'date' },
        { k: 'email', l: 'E-Mail', t: 'text' }, { k: 'phone', l: 'Telefon', t: 'text' },
        { k: 'address', l: 'Adresse', t: 'text' }, { k: 'member_since', l: 'Mitglied seit', t: 'date' },
        { k: 'status', l: 'Status', t: 'select', o: ['aktiv', 'passiv', 'ausgetreten'] },
        { k: 'fee_note', l: 'Beitrag / Hinweis', t: 'text' }, { k: 'notes', l: 'Notizen', t: 'area' }
      ]
    },
    intern: {
      table: 'internal_docs', label: 'Interne Ablage', unit: 'Dokumente', add: 'Neues Dokument', order: 'created_at',
      cols: [
        { h: 'Titel', r: (x) => `<span class="t-title">${esc(x.title)}</span><span class="t-sub">${esc(x.note || '')}</span>` },
        { h: 'Kategorie', r: (x) => `<span class="pill">${esc(x.category || 'Sonstiges')}</span>` },
        { h: 'Mannschaft', r: (x) => x.team ? esc(teamName(x.team)) : '<span class="t-sub">abteilungsweit</span>' },
        { h: 'Datei', r: (x) => !x.url ? '—'
          : String(x.url).indexOf('intern:') === 0
            ? `<button class="btn sm ghost" data-open="${esc(x.url)}">öffnen</button>`
            : `<a href="${esc(x.url)}" target="_blank" rel="noopener">öffnen</a>` },
        { h: 'Angelegt', r: (x) => dt(x.created_at) }
      ],
      fields: [
        { k: 'title', l: 'Titel', t: 'text' },
        { k: 'category', l: 'Kategorie', t: 'select', o: ['Protokolle', 'Verträge', 'Anträge', 'Abrechnungen', 'Trainingsplanung', 'Sonstiges'] },
        { k: 'url', l: 'Datei', t: 'text' }, { k: 'note', l: 'Notiz', t: 'area' }
      ]
    },
    aufgaben: {
      table: 'tasks', label: 'Aufgaben', unit: 'Aufgaben', add: 'Neue Aufgabe', order: 'due_date',
      cols: [
        { h: 'Aufgabe', r: (x) => `<span class="t-title">${esc(x.title)}</span><span class="t-sub">${esc(String(x.description || '').slice(0, 70))}</span>` },
        { h: 'Mannschaft', r: (x) => x.team ? esc(teamName(x.team)) : '<span class="t-sub">abteilungsweit</span>' },
        { h: 'Zuständig', r: (x) => esc(x.assignee || '—') },
        { h: 'Fällig', r: (x) => x.due_date ? dt(x.due_date) : '—' },
        { h: 'Status', r: (x) => `<span class="pill ${x.status === 'erledigt' ? 'angenommen' : x.status === 'in Arbeit' ? 'wartet' : 'neu'}">${esc(x.status)}</span>` }
      ],
      fields: [
        { k: 'title', l: 'Aufgabe', t: 'text' }, { k: 'assignee', l: 'Zuständig', t: 'text' },
        { k: 'due_date', l: 'Fällig bis', t: 'date' },
        { k: 'status', l: 'Status', t: 'select', o: ['offen', 'in Arbeit', 'erledigt'] },
        { k: 'description', l: 'Beschreibung', t: 'area' }
      ]
    }
  };

  const deptName = (slug) => { const d = C.depts.find((x) => x.slug === slug); return d ? d.name : slug; };
  const teamName = (slug) => { const t = C.teams.find((x) => (x.slug || x.id) === slug); return t ? t.name : slug; };
  const teamDeptSlug = (t) => { const d = C.depts.find((x) => x.name === t.dept); return d ? d.slug : ''; };

  /* Abteilungen, die dieser Zugang sehen darf, inklusive der Abteilungen eigener Mannschaften */
  const meineDepts = () => {
    const s = myScope();
    if (isAdminRole() || unscoped()) return C.depts.map((d) => d.slug);
    const ausTeams = C.teams.filter((t) => s.teams.indexOf(t.slug || t.id) >= 0).map(teamDeptSlug);
    return [...new Set(s.depts.concat(ausTeams).filter(Boolean))];
  };
  /* Mannschaften einer Abteilung, die dieser Zugang bearbeiten darf */
  const meineTeams = (deptSlug) => {
    const s = myScope();
    const inDept = C.teams.filter((t) => teamDeptSlug(t) === deptSlug);
    if (isAdminRole() || unscoped() || s.depts.indexOf(deptSlug) >= 0) return inDept.map((t) => t.slug || t.id);
    return inDept.filter((t) => s.teams.indexOf(t.slug || t.id) >= 0).map((t) => t.slug || t.id);
  };
  /* Darf der Zugang in dieser Abteilung auch abteilungsweite Einträge pflegen? */
  const darfAbteilungsweit = (deptSlug) => {
    const s = myScope();
    return isAdminRole() || unscoped() || s.depts.indexOf(deptSlug) >= 0;
  };

  function internView(key) {
    const cfg = INTERN[key];
    const DB = window.OSGDB;
    if (!DB || !DB.configured) {
      return `<div class="head"><div><h1>${cfg.label}</h1><p>Dieser Bereich braucht das Backend. Ohne Datenbank gibt es ihn nicht, weil hier persönliche Daten liegen.</p></div></div>`;
    }
    if (!DB.features.intern) {
      return `<div class="head"><div><h1>${cfg.label}</h1><p>Noch nicht eingerichtet. Bitte <b>supabase-abteilungen.sql</b> im Supabase SQL Editor ausführen.</p></div></div>`;
    }
    const depts = meineDepts();
    if (!internDept || depts.indexOf(internDept) < 0) internDept = depts[0] || '';
    const teams = meineTeams(internDept);
    const abteilungsweit = darfAbteilungsweit(internDept);
    if (internTeam && internTeam !== '__alle' && teams.indexOf(internTeam) < 0) internTeam = '';
    if (abteilungsweit && internTeam === '') internTeam = '__alle';
    if (!abteilungsweit) {
      if (internTeam === '__alle' || !internTeam) internTeam = teams[0] || '';
    }
    const rows = (internRows[cfg.table] || []).filter((x) => {
      if (x.dept !== internDept) return false;
      if (internTeam === '__alle') return true;
      if (internTeam) return (x.team || '') === internTeam;
      return !x.team;
    });
    const darf = canEdit() && (abteilungsweit || (internTeam && teams.indexOf(internTeam) >= 0));
    const body = rows.map((x) => `<tr>${cfg.cols.map((c) => `<td>${c.r(x)}</td>`).join('')}
      <td class="actions">${darf ? `<button class="btn sm ghost" data-iedit="${x.id}">Bearbeiten</button>
        <button class="btn sm danger" data-idel="${x.id}">Löschen</button>` : '<span class="t-sub">nur lesen</span>'}</td></tr>`).join('');
    return `<div class="head">
        <div><h1>${cfg.label}</h1><p>${rows.length} ${cfg.unit} · ${esc(deptName(internDept) || 'keine Abteilung')}${internTeam === '__alle' ? ', alle Mannschaften' : internTeam ? ', ' + esc(teamName(internTeam)) : ', abteilungsweit'} · nur intern, nicht auf der Website</p></div>
        <div style="display:flex;gap:10px;align-items:center">
          <select id="deptPick" class="deptpick">${depts.map((d) => `<option value="${esc(d)}"${d === internDept ? ' selected' : ''}>${esc(deptName(d))}</option>`).join('')}</select>
          <select id="teamPick" class="deptpick">
            ${abteilungsweit ? `<option value="__alle"${internTeam === '__alle' ? ' selected' : ''}>Alle Mannschaften</option>
            <option value=""${internTeam === '' ? ' selected' : ''}>Abteilung allgemein</option>` : ''}
            ${teams.map((t) => `<option value="${esc(t)}"${t === internTeam ? ' selected' : ''}>${esc(teamName(t))}</option>`).join('')}
          </select>
          ${darf ? `<button class="btn" id="internAdd">+ ${cfg.add}</button>` : ''}
        </div>
      </div>
      <div class="card">${rows.length ? table(cfg.cols.map((c) => c.h).concat(['']), body) : '<div class="empty">Noch keine Einträge in dieser Abteilung.</div>'}</div>`;
  }

  function internEdit(key, row) {
    const cfg = INTERN[key];
    const isNew = !row;
    const x = row || {};
    const f = (fd) => cfg.fields.map((fl) => {
      const v = x[fl.k] == null ? '' : x[fl.k];
      if (fl.t === 'area') return `<div class="field"><label>${fl.l}</label><textarea name="${fl.k}" style="min-height:90px">${esc(v)}</textarea></div>`;
      if (fl.t === 'select') return `<div class="field"><label>${fl.l}</label><select name="${fl.k}">${fl.o.map((o) => `<option${o === v ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select></div>`;
      const up = fl.k === 'url' ? uploadRow('url') : '';
      return `<div class="field"><label>${fl.l}</label><input name="${fl.k}" type="${fl.t}" value="${esc(v)}" />${up}</div>`;
    }).join('');
    openModal(isNew ? cfg.add : cfg.label + ' bearbeiten',
      `<form id="internForm"><div class="grid2">${f()}</div>
        <div class="field"><label>Mannschaft</label><select name="__team">
          ${darfAbteilungsweit(internDept) ? `<option value=""${!(x.team || (internTeam !== '__alle' ? internTeam : '')) ? ' selected' : ''}>Abteilung allgemein</option>` : ''}
          ${meineTeams(internDept).map((t) => { const sel = (x.team || (internTeam !== '__alle' ? internTeam : '')) === t; return `<option value="${esc(t)}"${sel ? ' selected' : ''}>${esc(teamName(t))}</option>`; }).join('')}
        </select></div>
        <p class="t-sub">Abteilung: <b>${esc(deptName(internDept))}</b>. Diese Daten liegen nur im Admin-Bereich, Dateien in einem privaten Speicher mit zeitlich begrenzten Links.</p></form>`,
      '<button class="btn ghost" type="button" id="mCancel">Abbrechen</button><button class="btn" type="button" id="mSave">Speichern</button>');
    el('mCancel').addEventListener('click', closeModal);
    wireUploads('internForm', 'intern/' + cfg.table);
    el('mSave').addEventListener('click', async () => {
      const fd = new FormData(el('internForm'));
      const gewaehlt = String(fd.get('__team') || '');
      const patch = { dept: internDept, team: gewaehlt || null };
      cfg.fields.forEach((fl) => {
        const v = String(fd.get(fl.k) == null ? '' : fd.get(fl.k));
        patch[fl.k] = (fl.t === 'date' && !v) ? null : v;
      });
      const res = isNew
        ? await window.OSGDB.addRow(cfg.table, patch)
        : await window.OSGDB.updateRow(cfg.table, x.id, patch);
      if (!res.ok) { toast('Fehler: ' + res.error); return; }
      internRows[cfg.table] = (await window.OSGDB.rows(cfg.table, cfg.order)) || internRows[cfg.table];
      closeModal(); render(); toast('Gespeichert');
    });
  }

  /* ---------- Kader und Spielplan ---------- */
  function kaderEditor(team) {
    const roster = (team.roster || []).slice();
    const matches = (team.matches || []).slice();

    const rosterRow = (p, i) => `<tr>
      <td><input value="${esc(p.nr || '')}" data-r="${i}" data-f="nr" style="width:60px" /></td>
      <td><input value="${esc(p.name || '')}" data-r="${i}" data-f="name" /></td>
      <td><input value="${esc(p.position || '')}" data-r="${i}" data-f="position" placeholder="Tor, Abwehr, Mittelfeld, Sturm" /></td>
      <td class="actions"><button class="btn sm danger" type="button" data-rdel="${i}">Entfernen</button></td>
    </tr>`;

    const matchRow = (m, i) => `<tr>
      <td><input type="date" value="${esc(m.date || '')}" data-m="${i}" data-f="date" /></td>
      <td><input value="${esc(m.time || '')}" data-m="${i}" data-f="time" placeholder="15:00" style="width:80px" /></td>
      <td><input value="${esc(m.opponent || '')}" data-m="${i}" data-f="opponent" placeholder="Gegner" /></td>
      <td><select data-m="${i}" data-f="home"><option value="heim"${m.home !== 'auswaerts' ? ' selected' : ''}>Heim</option><option value="auswaerts"${m.home === 'auswaerts' ? ' selected' : ''}>Auswärts</option></select></td>
      <td><input value="${esc(m.result || '')}" data-m="${i}" data-f="result" placeholder="3:1" style="width:80px" /></td>
      <td class="actions"><button class="btn sm danger" type="button" data-mdel="${i}">Entfernen</button></td>
    </tr>`;

    function draw() {
      el('kaderBody').innerHTML = `
        <h4 class="group-title" style="margin-top:0">Kader (${roster.length})</h4>
        <div class="card"><table><thead><tr><th>Nr.</th><th>Name</th><th>Position</th><th></th></tr></thead>
          <tbody>${roster.map(rosterRow).join('') || '<tr><td colspan="4" class="empty">Noch keine Spieler</td></tr>'}</tbody></table></div>
        <button class="btn ghost sm" type="button" id="addPlayer" style="margin-top:10px">+ Spieler</button>

        <h4 class="group-title">Spielplan (${matches.length})</h4>
        <div class="card"><table><thead><tr><th>Datum</th><th>Zeit</th><th>Gegner</th><th>Ort</th><th>Ergebnis</th><th></th></tr></thead>
          <tbody>${matches.map(matchRow).join('') || '<tr><td colspan="6" class="empty">Noch keine Spiele</td></tr>'}</tbody></table></div>
        <button class="btn ghost sm" type="button" id="addMatch" style="margin-top:10px">+ Spiel</button>
        <p class="t-sub" style="margin-top:14px">Kader und Spielplan erscheinen auf der Mannschaftsseite der Website.</p>`;

      el('addPlayer').addEventListener('click', () => { roster.push({ nr: '', name: '', position: '' }); draw(); });
      el('addMatch').addEventListener('click', () => { matches.push({ date: '', time: '', opponent: '', home: 'heim', result: '' }); draw(); });
      el('kaderBody').querySelectorAll('[data-rdel]').forEach((b) => b.addEventListener('click', () => { roster.splice(Number(b.dataset.rdel), 1); draw(); }));
      el('kaderBody').querySelectorAll('[data-mdel]').forEach((b) => b.addEventListener('click', () => { matches.splice(Number(b.dataset.mdel), 1); draw(); }));
      el('kaderBody').querySelectorAll('[data-r]').forEach((i) => i.addEventListener('input', () => { roster[Number(i.dataset.r)][i.dataset.f] = i.value; }));
      el('kaderBody').querySelectorAll('[data-m]').forEach((i) => i.addEventListener('change', () => { matches[Number(i.dataset.m)][i.dataset.f] = i.value; }));
      el('kaderBody').querySelectorAll('[data-m]').forEach((i) => i.addEventListener('input', () => { matches[Number(i.dataset.m)][i.dataset.f] = i.value; }));
    }

    openModal('Kader & Spielplan: ' + team.name, '<div id="kaderBody"></div>',
      '<button class="btn ghost" type="button" id="mCancel">Abbrechen</button><button class="btn" type="button" id="mSave">Speichern</button>');
    draw();
    el('mCancel').addEventListener('click', closeModal);
    el('mSave').addEventListener('click', () => {
      C.teams = C.teams.map((t) => (t.id === team.id
        ? Object.assign({}, t, { roster: roster.filter((p) => p.name), matches: matches.filter((m) => m.date || m.opponent) })
        : t));
      persist(); closeModal(); render(); toast('Kader und Spielplan gespeichert');
    });
  }

  /* ---------- Modals ---------- */
  function closeModal() { el('modal').hidden = true; el('modal').innerHTML = ''; }
  function openModal(title, bodyHtml, footHtml) {
    el('modal').innerHTML = `<div class="sheet"><div class="sheet__head"><h2>${esc(title)}</h2><button type="button" id="mClose">×</button></div>
      <div class="sheet__body">${bodyHtml}</div><div class="sheet__foot">${footHtml}</div></div>`;
    el('modal').hidden = false;
    el('mClose').addEventListener('click', closeModal);
  }

  const UPLOADABLE = ['image', 'url', 'logo', 'logoUrl', 'photo', 'avatar_url'];
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
        const privat = String(folder || '').indexOf('intern') === 0;
        const res = await window.OSGDB.upload(file, folder, privat ? 'intern' : null);
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
    if (el('mAcc')) el('mAcc').addEventListener('click', () => setStatus(id, 'angenommen'));
    if (el('mRej')) el('mRej').addEventListener('click', () => setStatus(id, 'abgelehnt'));
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
    else if (view === 'zugaenge') c.innerHTML = zugaenge();
    else if (view === 'meinerechte') c.innerHTML = meineRechte();
    else if (INTERN[view]) c.innerHTML = internView(view);
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
      c.querySelectorAll('[data-kader]').forEach((b) => b.addEventListener('click', () => kaderEditor(C.teams.find((x) => x.id === b.dataset.kader))));
      c.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
        if (!confirm('Eintrag wirklich löschen?')) return;
        C[cfg.key] = C[cfg.key].filter((x) => x.id !== b.dataset.del);
        persist(); render(); toast('Gelöscht');
      }));
    }
    if (INTERN[view]) {
      const cfg = INTERN[view];
      const dp = el('deptPick');
      if (dp) dp.addEventListener('change', () => { internDept = dp.value; internTeam = darfAbteilungsweit(dp.value) ? '__alle' : ''; render(); });
      const tp = el('teamPick');
      if (tp) tp.addEventListener('change', () => { internTeam = tp.value; render(); });
      const ia = el('internAdd');
      if (ia) ia.addEventListener('click', () => internEdit(view, null));
      c.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', async () => {
        const res = await window.OSGDB.signedUrl(b.dataset.open, 3600);
        if (!res.ok) { toast('Link konnte nicht erzeugt werden: ' + res.error); return; }
        window.open(res.url, '_blank', 'noopener');
      }));
      c.querySelectorAll('[data-iedit]').forEach((b) => b.addEventListener('click', () => internEdit(view, (internRows[cfg.table] || []).find((x) => x.id === b.dataset.iedit))));
      c.querySelectorAll('[data-idel]').forEach((b) => b.addEventListener('click', async () => {
        if (!confirm('Eintrag wirklich löschen?')) return;
        const res = await window.OSGDB.removeRow(cfg.table, b.dataset.idel);
        if (!res.ok) { toast('Fehler: ' + res.error); return; }
        internRows[cfg.table] = (await window.OSGDB.rows(cfg.table, cfg.order)) || [];
        render(); toast('Gelöscht');
      }));
    }

    const rf = el('reqForm');
    if (rf) rf.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(rf);
      const res = await window.OSGDB.addRequest({
        name: (myProfile && myProfile.name) || '',
        wish_role: String(fd.get('wish_role')),
        wish_scope: fd.getAll('wish_depts').concat(fd.getAll('wish_teams')).map(String).join(', ') || 'alle Bereiche',
        reason: String(fd.get('reason') || '')
      });
      if (!res.ok) { toast('Fehler: ' + res.error); return; }
      requests = (await window.OSGDB.listRequests()) || requests;
      render(); toast('Anfrage gesendet');
    });
    c.querySelectorAll('[data-reqok]').forEach((b) => b.addEventListener('click', async () => {
      const r = requests.find((x) => x.id === b.dataset.reqok);
      const p = profiles.find((x) => x.id === r.user_id);
      if (p) {
        const patch = { approved: true };
        if (r.wish_role) patch.role = r.wish_role;
        // Gewünschte Bereiche übernehmen, soweit sie zu Abteilungen und Mannschaften passen
        if (hasScope() && r.wish_scope && r.wish_scope !== 'alle Bereiche') {
          const teile = String(r.wish_scope).split(',').map((x) => x.trim());
          patch.scope_depts = C.depts.filter((d) => teile.indexOf(d.name) >= 0).map((d) => d.slug);
          patch.scope_teams = C.teams.filter((t) => teile.indexOf(t.name) >= 0).map((t) => t.slug || t.id);
        } else if (hasScope() && r.wish_scope === 'alle Bereiche') {
          patch.scope_depts = []; patch.scope_teams = [];
        }
        await window.OSGDB.setProfile(p.id, patch);
      }
      const res = await window.OSGDB.setRequest(r.id, { status: 'genehmigt' });
      if (!res.ok) { toast('Fehler: ' + res.error); return; }
      profiles = (await window.OSGDB.listProfiles()) || profiles;
      requests = (await window.OSGDB.listRequests()) || requests;
      render(); toast('Rechte vergeben');
    }));
    c.querySelectorAll('[data-reqno]').forEach((b) => b.addEventListener('click', async () => {
      const res = await window.OSGDB.setRequest(b.dataset.reqno, { status: 'abgelehnt' });
      if (!res.ok) { toast('Fehler: ' + res.error); return; }
      requests = (await window.OSGDB.listRequests()) || requests;
      render(); toast('Anfrage abgelehnt');
    }));

    const ni = el('newInvite');
    if (ni) ni.addEventListener('click', () => editInvite(null));
    c.querySelectorAll('[data-editp]').forEach((b) => b.addEventListener('click', () => editProfile(profiles.find((x) => x.id === b.dataset.editp))));
    c.querySelectorAll('[data-editi]').forEach((b) => b.addEventListener('click', () => editInvite(invites.find((x) => x.email === b.dataset.editi))));
    c.querySelectorAll('[data-deli]').forEach((b) => b.addEventListener('click', async () => {
      if (!confirm('Einladung zurückziehen?')) return;
      const res = await window.OSGDB.removeInvite(b.dataset.deli);
      if (!res.ok) { toast('Fehler: ' + res.error); return; }
      invites = (await window.OSGDB.listInvites()) || [];
      render(); toast('Einladung zurückgezogen');
    }));
    c.querySelectorAll('[data-role]').forEach((b) => b.addEventListener('click', async () => {
      const p = profiles.find((x) => x.id === b.dataset.role);
      const res = await window.OSGDB.setProfile(p.id, { role: p.role === 'admin' ? 'redaktion' : 'admin' });
      if (!res.ok) { toast('Fehler: ' + res.error); return; }
      profiles = (await window.OSGDB.listProfiles()) || profiles;
      render(); toast('Rolle geändert');
    }));
    c.querySelectorAll('[data-appr]').forEach((b) => b.addEventListener('click', async () => {
      const p = profiles.find((x) => x.id === b.dataset.appr);
      const res = await window.OSGDB.setProfile(p.id, { approved: !p.approved });
      if (!res.ok) { toast('Fehler: ' + res.error); return; }
      profiles = (await window.OSGDB.listProfiles()) || profiles;
      render(); toast(p.approved ? 'Zugang gesperrt' : 'Zugang freigeschaltet');
    }));
    c.querySelectorAll('[data-role]').forEach((b) => b.addEventListener('click', async () => {
      const p = profiles.find((x) => x.id === b.dataset.role);
      const res = await window.OSGDB.setProfile(p.id, { role: p.role === 'admin' ? 'redaktion' : 'admin' });
      if (!res.ok) { toast('Fehler: ' + res.error); return; }
      profiles = (await window.OSGDB.listProfiles()) || profiles;
      render(); toast('Rolle geändert');
    }));
    c.querySelectorAll('[data-delp]').forEach((b) => b.addEventListener('click', async () => {
      if (!confirm('Zugang wirklich löschen? Die Person kann sich danach nicht mehr anmelden.')) return;
      const res = await window.OSGDB.removeProfile(b.dataset.delp);
      if (!res.ok) { toast('Fehler: ' + res.error); return; }
      profiles = (await window.OSGDB.listProfiles()) || profiles;
      render(); toast('Zugang gelöscht');
    }));

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
      wireUploads('setForm', 'logo');
      sf.addEventListener('submit', (e) => {
        e.preventDefault();
        if (window.OSGDB && window.OSGDB.configured && !canEdit()) { toast('Dein Zugang darf nur lesen'); return; }
        new FormData(sf).forEach((v, k) => { C.settings[k] = String(v); });
        persist(); render(); toast('Einstellungen gespeichert');
      });
      const ra = el('resetAll');
      if (ra) ra.addEventListener('click', async () => {
        const DB = window.OSGDB;
        if (DB && DB.configured && !canEdit()) { toast('Dein Zugang darf nur lesen'); return; }
        const msg = DB && DB.configured
          ? 'Alle Inhalte auf den Ausgangsstand zurücksetzen? Das gilt dann auch für alle Besucher der Website.'
          : 'Alle Inhalte auf den Ausgangsstand zurücksetzen?';
        if (!confirm(msg)) return;
        const vorher = S.load();
        S.reset(); C = S.load();
        if (DB && DB.configured) {
          const res = await DB.saveContent(C);
          if (!res.ok) {
            const remote = await DB.fetchContent();
            S.save(remote || vorher); C = S.load(); render();
            toast('Nicht zurückgesetzt: ' + res.error);
            return;
          }
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
      if (!user) { loginBackend('login'); return; }
      await DB.detect();
      myProfile = await DB.profile();
      if (myProfile && myProfile.setupFehlt) { setupScreen(myProfile); return; }
      if (!myProfile || !myProfile.approved) { pendingScreen(myProfile || { email: user.email }); return; }
      profiles = (await DB.listProfiles()) || [];
      invites = (await DB.listInvites()) || [];
      requests = (await DB.listRequests()) || [];
      if (DB.features.intern) {
        internRows.members = (await DB.rows('members', 'last_name')) || [];
        internRows.internal_docs = (await DB.rows('internal_docs', 'created_at')) || [];
        internRows.tasks = (await DB.rows('tasks', 'due_date')) || [];
      }
      const remote = await DB.fetchContent();
      if (remote) { S.save(remote); C = S.load(); }
      else { await DB.saveContent(C); }
      const list = await DB.listSubmissions();
      if (list) subs = list;
    } else if (!isAuthed()) { login(); return; }
    shell(); render();
  }
  boot();
})();
