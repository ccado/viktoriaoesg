-- ÖSG Viktoria 08: Datenbank-Schema für Supabase
-- Einmal im Supabase-Dashboard unter "SQL Editor" ausführen.

-- 1) Inhalte der Website (eine Zeile, komplettes Inhalts-JSON)
create table if not exists public.site_content (
  id          int primary key default 1,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  constraint single_row check (id = 1)
);

insert into public.site_content (id, data)
values (1, '{}'::jsonb)
on conflict (id) do nothing;

alter table public.site_content enable row level security;

-- Jeder darf lesen (die Website muss die Inhalte anzeigen)
drop policy if exists "content lesbar" on public.site_content;
create policy "content lesbar" on public.site_content
  for select using (true);

-- Nur angemeldete Vorstandsmitglieder dürfen schreiben
drop policy if exists "content schreibbar" on public.site_content;
create policy "content schreibbar" on public.site_content
  for update to authenticated using (true) with check (true);

drop policy if exists "content anlegen" on public.site_content;
create policy "content anlegen" on public.site_content
  for insert to authenticated with check (true);


-- 2) Anfragen und Anmeldungen aus dem Kontaktformular
create table if not exists public.submissions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  type        text,
  dept        text,
  team        text,
  name        text not null,
  birth       text,
  email       text not null,
  phone       text,
  message     text,
  status      text not null default 'neu',
  note        text
);

alter table public.submissions enable row level security;

-- Besucher dürfen Anfragen anlegen, aber nichts sehen
drop policy if exists "anfragen anlegen" on public.submissions;
create policy "anfragen anlegen" on public.submissions
  for insert with check (true);

-- Nur angemeldete Nutzer sehen und bearbeiten Anfragen
drop policy if exists "anfragen lesen" on public.submissions;
create policy "anfragen lesen" on public.submissions
  for select to authenticated using (true);

drop policy if exists "anfragen bearbeiten" on public.submissions;
create policy "anfragen bearbeiten" on public.submissions
  for update to authenticated using (true) with check (true);

drop policy if exists "anfragen loeschen" on public.submissions;
create policy "anfragen loeschen" on public.submissions
  for delete to authenticated using (true);

-- Nachträglich für bestehende Projekte:
alter table public.submissions add column if not exists team text;

create index if not exists submissions_created_idx
  on public.submissions (created_at desc);


-- 3) Speicher für Bilder und Dokumente
insert into storage.buckets (id, name, public)
values ('medien', 'medien', true)
on conflict (id) do nothing;

drop policy if exists "medien lesbar" on storage.objects;
create policy "medien lesbar" on storage.objects
  for select using (bucket_id = 'medien');

drop policy if exists "medien upload" on storage.objects;
create policy "medien upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'medien');

drop policy if exists "medien aendern" on storage.objects;
create policy "medien aendern" on storage.objects
  for update to authenticated using (bucket_id = 'medien') with check (bucket_id = 'medien');

drop policy if exists "medien loeschen" on storage.objects;
create policy "medien loeschen" on storage.objects
  for delete to authenticated using (bucket_id = 'medien');


-- 4) Zugänge für den Vorstand
-- Im Dashboard unter "Authentication, Users" pro Person einen Zugang mit
-- E-Mail und Passwort anlegen. Selbstregistrierung bitte deaktivieren
-- (Authentication, Providers, Email: "Allow new users to sign up" aus).
