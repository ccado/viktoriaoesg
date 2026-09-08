/* Datenzugriff: Supabase, wenn konfiguriert, sonst lokaler Browser-Speicher.
   Wird von site.js (Website) und admin.js (Admin-Bereich) genutzt. */
(function () {
  const cfg = window.OSG_SUPABASE || {};
  const configured = !!(cfg.url && cfg.anonKey && window.supabase);
  let client = null;
  if (configured) {
    client = window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
  }

  const DB = {
    configured,
    client,
    bucket: cfg.bucket || 'medien',
    features: { scope: false, requests: false, intern: false },

    /* Prüft, welche Schema-Erweiterungen in der Datenbank vorhanden sind */
    async detect() {
      if (!configured) { DB.features = { scope: true, requests: true }; return DB.features; }
      const a = await client.from('profiles').select('id,scope_depts').limit(1);
      DB.features.scope = !a.error;
      const b = await client.from('rights_requests').select('id').limit(1);
      DB.features.requests = !b.error;
      const c = await client.from('members').select('id').limit(1);
      DB.features.intern = !c.error;
      return DB.features;
    },

    /* ----- Inhalte ----- */
    async fetchContent() {
      if (!configured) return null;
      const { data, error } = await client.from('site_content').select('data').eq('id', 1).single();
      if (error) { console.warn('Inhalte konnten nicht geladen werden:', error.message); return null; }
      return data && data.data && Object.keys(data.data).length ? data.data : null;
    },
    async saveContent(content) {
      if (!configured) return { ok: true, local: true };
      const { error } = await client.from('site_content')
        .upsert({ id: 1, data: content, updated_at: new Date().toISOString() }, { onConflict: 'id' });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    },

    /* ----- Anfragen ----- */
    async addSubmission(s) {
      if (!configured) return { ok: true, local: true };
      const { error } = await client.from('submissions').insert([{
        type: s.type || null, dept: s.dept || null, team: s.team || null, name: s.name, birth: s.birth || null,
        email: s.email, phone: s.phone || null, message: s.message || null, status: 'neu'
      }]);
      return error ? { ok: false, error: error.message } : { ok: true };
    },
    async listSubmissions() {
      if (!configured) return null;
      const { data, error } = await client.from('submissions').select('*').order('created_at', { ascending: false });
      if (error) { console.warn('Anfragen konnten nicht geladen werden:', error.message); return null; }
      return data.map((r) => Object.assign({}, r, { createdAt: r.created_at }));
    },
    async setStatus(id, status) {
      if (!configured) return { ok: true, local: true };
      const { error } = await client.from('submissions').update({ status }).eq('id', id);
      return error ? { ok: false, error: error.message } : { ok: true };
    },
    async removeSubmission(id) {
      if (!configured) return { ok: true, local: true };
      const { error } = await client.from('submissions').delete().eq('id', id);
      return error ? { ok: false, error: error.message } : { ok: true };
    },
    async removeProcessed() {
      if (!configured) return { ok: true, local: true };
      const { error } = await client.from('submissions').delete().neq('status', 'neu');
      return error ? { ok: false, error: error.message } : { ok: true };
    },

    /* ----- Zugänge ----- */
    async signUp(email, password, name) {
      if (!configured) return { ok: false, error: 'Kein Backend konfiguriert' };
      const { error } = await client.auth.signUp({ email, password, options: { data: { name: name || '' } } });
      return error ? { ok: false, error: error.message } : { ok: true };
    },
    async profile() {
      if (!configured) return null;
      const { data: u } = await client.auth.getUser();
      if (!u || !u.user) return null;
      const { data, error } = await client.from('profiles').select('*').eq('id', u.user.id).maybeSingle();
      if (error) {
        const fehlt = error.code === '42P01' || /could not find the table/i.test(error.message || '');
        // Tabelle fehlt: Zugangsverwaltung ist noch nicht eingerichtet
        return { id: u.user.id, email: u.user.email, approved: !!fehlt, role: 'admin', setupFehlt: !!fehlt, fehler: error.message };
      }
      return data || { id: u.user.id, email: u.user.email, approved: false, role: 'redaktion' };
    },
    async listProfiles() {
      if (!configured) return null;
      const { data, error } = await client.from('profiles').select('*').order('created_at', { ascending: true });
      if (error) { console.warn('Zugänge konnten nicht geladen werden:', error.message); return null; }
      return data;
    },
    async setProfile(id, patch) {
      if (!configured) return { ok: true, local: true };
      const p = Object.assign({}, patch);
      if (!DB.features.scope) { delete p.scope_depts; delete p.scope_teams; delete p.avatar_url; }
      let { error } = await client.from('profiles').update(p).eq('id', id);
      if (error && /(scope_|avatar_url)/.test(error.message || '')) {
        DB.features.scope = false;
        delete p.scope_depts; delete p.scope_teams; delete p.avatar_url;
        ({ error } = await client.from('profiles').update(p).eq('id', id));
      }
      return error ? { ok: false, error: error.message } : { ok: true };
    },
    async listInvites() {
      if (!configured) return null;
      const { data, error } = await client.from('invites').select('*').order('created_at', { ascending: true });
      if (error) { console.warn('Einladungen konnten nicht geladen werden:', error.message); return null; }
      return data;
    },
    async addInvite(inv) {
      if (!configured) return { ok: false, error: 'Kein Backend konfiguriert' };
      const row = {
        email: String(inv.email).trim().toLowerCase(), name: inv.name || null,
        phone: inv.phone || null, funktion: inv.funktion || null, role: inv.role || 'redaktion'
      };
      if (DB.features.scope) {
        row.scope_depts = inv.scope_depts || [];
        row.scope_teams = inv.scope_teams || [];
      }
      let { error } = await client.from('invites').upsert(row, { onConflict: 'email' });
      if (error && /scope_/.test(error.message || '')) {
        DB.features.scope = false;
        delete row.scope_depts; delete row.scope_teams;
        ({ error } = await client.from('invites').upsert(row, { onConflict: 'email' }));
      }
      return error ? { ok: false, error: error.message } : { ok: true };
    },
    async removeInvite(email) {
      if (!configured) return { ok: true, local: true };
      const { error } = await client.from('invites').delete().eq('email', email);
      return error ? { ok: false, error: error.message } : { ok: true };
    },
    async removeProfile(id) {
      if (!configured) return { ok: true, local: true };
      const { error } = await client.from('profiles').delete().eq('id', id);
      return error ? { ok: false, error: error.message } : { ok: true };
    },

    /* ----- Rechteanfragen ----- */
    async listRequests() {
      if (!configured || !DB.features.requests) return null;
      const { data, error } = await client.from('rights_requests').select('*').order('created_at', { ascending: false });
      if (error) { console.warn('Rechteanfragen konnten nicht geladen werden:', error.message); return null; }
      return data;
    },
    async addRequest(req) {
      if (!configured) return { ok: false, error: 'Kein Backend konfiguriert' };
      if (!DB.features.requests) return { ok: false, error: 'Bitte supabase-zustaendigkeit.sql im SQL Editor ausführen' };
      const { data: u } = await client.auth.getUser();
      if (!u || !u.user) return { ok: false, error: 'Nicht angemeldet' };
      const { error } = await client.from('rights_requests').insert([{
        user_id: u.user.id, email: u.user.email, name: req.name || null,
        wish_role: req.wish_role || null, wish_scope: req.wish_scope || null, reason: req.reason || null
      }]);
      return error ? { ok: false, error: error.message } : { ok: true };
    },
    async setRequest(id, patch) {
      if (!configured) return { ok: true, local: true };
      const { error } = await client.from('rights_requests').update(patch).eq('id', id);
      return error ? { ok: false, error: error.message } : { ok: true };
    },

    /* ----- Login ----- */
    async signIn(email, password) {
      if (!configured) return { ok: false, error: 'Kein Backend konfiguriert' };
      const { error } = await client.auth.signInWithPassword({ email, password });
      return error ? { ok: false, error: error.message } : { ok: true };
    },
    async signOut() { if (configured) await client.auth.signOut(); },
    async user() {
      if (!configured) return null;
      const { data } = await client.auth.getUser();
      return data ? data.user : null;
    },
    async resetPassword(email) {
      if (!configured) return { ok: false, error: 'Kein Backend konfiguriert' };
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: location.href });
      return error ? { ok: false, error: error.message } : { ok: true };
    },

    /* ----- Interne Tabellen (Mitglieder, Dokumente, Aufgaben) ----- */
    async rows(table, orderBy) {
      if (!configured) return null;
      const { data, error } = await client.from(table).select('*').order(orderBy || 'created_at', { ascending: true });
      if (error) { DB.features[table] = false; return null; }
      DB.features[table] = true;
      return data;
    },
    async addRow(table, row) {
      if (!configured) return { ok: false, error: 'Kein Backend konfiguriert' };
      const { error } = await client.from(table).insert([row]);
      return error ? { ok: false, error: error.message } : { ok: true };
    },
    async updateRow(table, id, patch) {
      if (!configured) return { ok: false, error: 'Kein Backend konfiguriert' };
      const { error } = await client.from(table).update(patch).eq('id', id);
      return error ? { ok: false, error: error.message } : { ok: true };
    },
    async removeRow(table, id) {
      if (!configured) return { ok: false, error: 'Kein Backend konfiguriert' };
      const { error } = await client.from(table).delete().eq('id', id);
      return error ? { ok: false, error: error.message } : { ok: true };
    },

    /* ----- Dateien ----- */
    async upload(file, folder, bucket) {
      if (!configured) return { ok: false, error: 'Kein Backend konfiguriert' };
      const eimer = bucket || DB.bucket;
      const safe = String(file.name).toLowerCase().replace(/[^a-z0-9.\-_]/g, '-');
      const path = (folder || 'allgemein') + '/' + Date.now() + '-' + safe;
      const { error } = await client.storage.from(eimer).upload(path, file, { cacheControl: '3600', upsert: false });
      if (error) return { ok: false, error: error.message };
      if (eimer === 'intern') {
        // Privater Bucket: nur den Pfad merken, Links werden bei Bedarf signiert
        return { ok: true, url: 'intern:' + path, path: path, privat: true };
      }
      const { data } = client.storage.from(eimer).getPublicUrl(path);
      return { ok: true, url: data.publicUrl, path: path };
    },

    /* Zeitlich begrenzter Link auf eine interne Datei */
    async signedUrl(path, sekunden) {
      if (!configured) return { ok: false, error: 'Kein Backend konfiguriert' };
      const p = String(path).replace(/^intern:/, '');
      const { data, error } = await client.storage.from('intern').createSignedUrl(p, sekunden || 3600);
      return error ? { ok: false, error: error.message } : { ok: true, url: data.signedUrl };
    }
  };

  window.OSGDB = DB;
})();
