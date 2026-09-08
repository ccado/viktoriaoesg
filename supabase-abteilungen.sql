-- ÖSG Viktoria 08: Interner Abteilungsbereich
-- Mitglieder, interne Dokumente, Aufgaben. Nicht öffentlich sichtbar.
-- Im SQL Editor ausführen, NACH supabase-zustaendigkeit.sql.

-- 0) Alte Versionen entfernen, damit ein erneuter Durchlauf sauber ist.
--    cascade räumt die daran hängenden Policies mit weg, sie werden unten neu angelegt.
drop function if exists public.darf_lesen(text) cascade;
drop function if exists public.darf_schreiben(text) cascade;

-- 1) Hilfsfunktionen für Zuständigkeit
create or replace function public.my_depts()
returns text[] language sql stable security definer set search_path = public as $$
  select coalesce(scope_depts, '{}') from profiles where id = auth.uid();
$$;

create or replace function public.my_teams()
returns text[] language sql stable security definer set search_path = public as $$
  select coalesce(scope_teams, '{}') from profiles where id = auth.uid();
$$;

create or replace function public.scope_offen()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(array_length(scope_depts, 1), 0) = 0
     and coalesce(array_length(scope_teams, 1), 0) = 0
    from profiles where id = auth.uid();
$$;

-- darf lesen: freigeschaltet und (Admin, ohne Einschränkung, passende Abteilung oder passende Mannschaft)
create or replace function public.darf_lesen(d text, t text default null)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_approved() and (
    public.is_admin() or public.scope_offen()
    or d = any(public.my_depts())
    or (t is not null and t <> '' and t = any(public.my_teams()))
  );
$$;

-- darf schreiben: zusätzlich Rolle admin oder redaktion
create or replace function public.darf_schreiben(d text, t text default null)
returns boolean language sql stable security definer set search_path = public as $$
  select public.can_edit() and (
    public.is_admin() or public.scope_offen()
    or d = any(public.my_depts())
    or (t is not null and t <> '' and t = any(public.my_teams()))
  );
$$;

-- 2) Mitglieder (intern)
create table if not exists public.members (
  id           uuid primary key default gen_random_uuid(),
  dept         text not null,
  team         text,
  first_name   text not null,
  last_name    text not null,
  birthdate    date,
  email        text,
  phone        text,
  address      text,
  status       text not null default 'aktiv',    -- aktiv | passiv | ausgetreten
  member_since date,
  fee_note     text,
  notes        text,
  created_at   timestamptz not null default now()
);
alter table public.members enable row level security;

drop policy if exists "mitglieder lesen" on public.members;
create policy "mitglieder lesen" on public.members
  for select to authenticated using (public.darf_lesen(dept, team));
drop policy if exists "mitglieder anlegen" on public.members;
create policy "mitglieder anlegen" on public.members
  for insert to authenticated with check (public.darf_schreiben(dept, team));
drop policy if exists "mitglieder aendern" on public.members;
create policy "mitglieder aendern" on public.members
  for update to authenticated using (public.darf_schreiben(dept, team)) with check (public.darf_schreiben(dept, team));
drop policy if exists "mitglieder loeschen" on public.members;
create policy "mitglieder loeschen" on public.members
  for delete to authenticated using (public.darf_schreiben(dept, team));

-- 3) Interne Dokumente
create table if not exists public.internal_docs (
  id         uuid primary key default gen_random_uuid(),
  dept       text not null,
  team       text,
  title      text not null,
  category   text,
  url        text,
  note       text,
  created_at timestamptz not null default now()
);
alter table public.internal_docs add column if not exists team text;
alter table public.internal_docs enable row level security;

drop policy if exists "intern lesen" on public.internal_docs;
create policy "intern lesen" on public.internal_docs
  for select to authenticated using (public.darf_lesen(dept, team));
drop policy if exists "intern anlegen" on public.internal_docs;
create policy "intern anlegen" on public.internal_docs
  for insert to authenticated with check (public.darf_schreiben(dept, team));
drop policy if exists "intern aendern" on public.internal_docs;
create policy "intern aendern" on public.internal_docs
  for update to authenticated using (public.darf_schreiben(dept, team)) with check (public.darf_schreiben(dept, team));
drop policy if exists "intern loeschen" on public.internal_docs;
create policy "intern loeschen" on public.internal_docs
  for delete to authenticated using (public.darf_schreiben(dept, team));

-- 4) Aufgaben und Anliegen
create table if not exists public.tasks (
  id         uuid primary key default gen_random_uuid(),
  dept       text not null,
  team       text,
  title      text not null,
  description text,
  assignee   text,
  due_date   date,
  status     text not null default 'offen',   -- offen | in Arbeit | erledigt
  created_at timestamptz not null default now()
);
alter table public.tasks add column if not exists team text;
alter table public.tasks add column if not exists priority text default 'normal';
alter table public.tasks add column if not exists position int default 0;
alter table public.tasks enable row level security;

drop policy if exists "aufgaben lesen" on public.tasks;
create policy "aufgaben lesen" on public.tasks
  for select to authenticated using (public.darf_lesen(dept, team));
drop policy if exists "aufgaben anlegen" on public.tasks;
create policy "aufgaben anlegen" on public.tasks
  for insert to authenticated with check (public.darf_schreiben(dept, team));
drop policy if exists "aufgaben aendern" on public.tasks;
create policy "aufgaben aendern" on public.tasks
  for update to authenticated using (public.darf_schreiben(dept, team)) with check (public.darf_schreiben(dept, team));
drop policy if exists "aufgaben loeschen" on public.tasks;
create policy "aufgaben loeschen" on public.tasks
  for delete to authenticated using (public.darf_schreiben(dept, team));

-- 5) Anfragen aus dem Formular nach Abteilung zuordnen
--    Admins und unbeschränkte Zugänge sehen alles, Abteilungszugänge nur ihre.
drop policy if exists "anfragen lesen" on public.submissions;
create policy "anfragen lesen" on public.submissions
  for select to authenticated using (
    public.is_approved() and (
      public.is_admin() or public.scope_offen()
      or dept = any(public.my_depts())
      or (team is not null and team <> '' and team = any(public.my_teams()))
      or dept is null
    )
  );

drop policy if exists "anfragen bearbeiten" on public.submissions;
create policy "anfragen bearbeiten" on public.submissions
  for update to authenticated using (
    public.can_edit() and (
      public.is_admin() or public.scope_offen()
      or dept = any(public.my_depts())
      or (team is not null and team <> '' and team = any(public.my_teams()))
      or dept is null
    )
  ) with check (
      public.can_edit() and (
        public.is_admin() or public.scope_offen()
        or dept = any(public.my_depts())
        or (team is not null and team <> '' and team = any(public.my_teams()))
        or dept is null
      )
    );

create index if not exists members_dept_idx on public.members (dept, team, last_name);
create index if not exists docs_dept_idx on public.internal_docs (dept, created_at desc);
create index if not exists tasks_dept_idx on public.tasks (dept, status, due_date);


-- 6) Privater Speicher für interne Dateien (Protokolle, Verträge, Abrechnungen)
insert into storage.buckets (id, name, public)
values ('intern', 'intern', false)
on conflict (id) do update set public = false;

drop policy if exists "intern datei lesen" on storage.objects;
create policy "intern datei lesen" on storage.objects
  for select to authenticated using (bucket_id = 'intern' and public.is_approved());

drop policy if exists "intern datei upload" on storage.objects;
create policy "intern datei upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'intern' and public.can_edit());

drop policy if exists "intern datei aendern" on storage.objects;
create policy "intern datei aendern" on storage.objects
  for update to authenticated using (bucket_id = 'intern' and public.can_edit())
  with check (bucket_id = 'intern' and public.can_edit());

drop policy if exists "intern datei loeschen" on storage.objects;
create policy "intern datei loeschen" on storage.objects
  for delete to authenticated using (bucket_id = 'intern' and public.can_edit());

-- 7) Abteilungszuordnung läuft über den stabilen Slug, nicht über den Namen.
--    Falls schon Daten mit Namen angelegt wurden, hier anpassen, Beispiel:
-- update public.members set dept = 'fussball' where dept = 'Fußball';
