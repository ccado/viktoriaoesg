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
        type: s.type || null, dept: s.dept || null, name: s.name, birth: s.birth || null,
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

    /* ----- Dateien ----- */
    async upload(file, folder) {
      if (!configured) return { ok: false, error: 'Kein Backend konfiguriert' };
      const safe = String(file.name).toLowerCase().replace(/[^a-z0-9.\-_]/g, '-');
      const path = (folder || 'allgemein') + '/' + Date.now() + '-' + safe;
      const { error } = await client.storage.from(DB.bucket).upload(path, file, { cacheControl: '3600', upsert: false });
      if (error) return { ok: false, error: error.message };
      const { data } = client.storage.from(DB.bucket).getPublicUrl(path);
      return { ok: true, url: data.publicUrl };
    }
  };

  window.OSGDB = DB;
})();
