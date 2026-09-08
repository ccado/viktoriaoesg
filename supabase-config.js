/* Supabase-Zugangsdaten.
   Beide Werte findest du im Supabase-Dashboard unter Project Settings, API.
   Der anon-Key ist öffentlich und darf im Frontend stehen. Die Rechte regeln
   die RLS-Policies aus supabase.sql. Solange hier Platzhalter stehen, arbeitet
   die Website weiter mit lokalem Browser-Speicher. */
window.OSG_SUPABASE = {
  url: '',      // z. B. 'https://abcdefgh.supabase.co'
  anonKey: '',  // z. B. 'eyJhbGciOi...'
  bucket: 'medien'
};
