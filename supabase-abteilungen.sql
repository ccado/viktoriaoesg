-- ÖSG Viktoria 08: Interner Abteilungsbereich
-- Mitglieder, interne Dokumente, Aufgaben. Nicht öffentlich sichtbar.
-- Im SQL Editor ausführen, NACH supabase-zustaendigkeit.sql.

-- 1) Hilfsfunktionen für Zuständigkeit
create or replace function public.my_depts()
returns text[] language sql stable security definer set search_path = public as $$
  select coalesce(scope_depts, '{}') from profiles where id = auth.uid();
$$;

create or replace function public.scope_offen()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(array_length(scope_depts, 1), 0) = 0 from profiles where id = auth.uid();
$$;

-- darf lesen: freigeschaltet und (Admin oder ohne Einschränkung oder passende Abteilung)
create or replace function public.darf_lesen(d text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_approved() and (public.is_admin() or public.scope_offen() or d = any(public.my_depts()));
$$;

-- darf schreiben: zusätzlich Rolle admin oder redaktion
create or replace function public.darf_schreiben(d text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.can_edit() and (public.is_admin() or public.scope_offen() or d = any(public.my_depts()));
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
  for select to authenticated using (public.darf_lesen(dept));
drop policy if exists "mitglieder anlegen" on public.members;
create policy "mitglieder anlegen" on public.members
  for insert to authenticated with check (public.darf_schreiben(dept));
drop policy if exists "mitglieder aendern" on public.members;
create policy "mitglieder aendern" on public.members
  for update to authenticated using (public.darf_schreiben(dept)) with check (public.darf_schreiben(dept));
drop policy if exists "mitglieder loeschen" on public.members;
create policy "mitglieder loeschen" on public.members
  for delete to authenticated using (public.darf_schreiben(dept));

-- 3) Interne Dokumente
create table if not exists public.internal_docs (
  id         uuid primary key default gen_random_uuid(),
  dept       text not null,
  title      text not null,
  category   text,
  url        text,
  note       text,
  created_at timestamptz not null default now()
);
alter table public.internal_docs enable row level security;

drop policy if exists "intern lesen" on public.internal_docs;
create policy "intern lesen" on public.internal_docs
  for select to authenticated using (public.darf_lesen(dept));
drop policy if exists "intern anlegen" on public.internal_docs;
create policy "intern anlegen" on public.internal_docs
  for insert to authenticated with check (public.darf_schreiben(dept));
drop policy if exists "intern aendern" on public.internal_docs;
create policy "intern aendern" on public.internal_docs
  for update to authenticated using (public.darf_schreiben(dept)) with check (public.darf_schreiben(dept));
drop policy if exists "intern loeschen" on public.internal_docs;
create policy "intern loeschen" on public.internal_docs
  for delete to authenticated using (public.darf_schreiben(dept));

-- 4) Aufgaben und Anliegen
create table if not exists public.tasks (
  id         uuid primary key default gen_random_uuid(),
  dept       text not null,
  title      text not null,
  description text,
  assignee   text,
  due_date   date,
  status     text not null default 'offen',   -- offen | in Arbeit | erledigt
  created_at timestamptz not null default now()
);
alter table public.tasks enable row level security;

drop policy if exists "aufgaben lesen" on public.tasks;
create policy "aufgaben lesen" on public.tasks
  for select to authenticated using (public.darf_lesen(dept));
drop policy if exists "aufgaben anlegen" on public.tasks;
create policy "aufgaben anlegen" on public.tasks
  for insert to authenticated with check (public.darf_schreiben(dept));
drop policy if exists "aufgaben aendern" on public.tasks;
create policy "aufgaben aendern" on public.tasks
  for update to authenticated using (public.darf_schreiben(dept)) with check (public.darf_schreiben(dept));
drop policy if exists "aufgaben loeschen" on public.tasks;
create policy "aufgaben loeschen" on public.tasks
  for delete to authenticated using (public.darf_schreiben(dept));

-- 5) Anfragen aus dem Formular nach Abteilung zuordnen
--    Admins und unbeschränkte Zugänge sehen alles, Abteilungszugänge nur ihre.
drop policy if exists "anfragen lesen" on public.submissions;
create policy "anfragen lesen" on public.submissions
  for select to authenticated using (
    public.is_approved() and (
      public.is_admin() or public.scope_offen()
      or dept = any(public.my_depts())
      or dept is null
    )
  );

drop policy if exists "anfragen bearbeiten" on public.submissions;
create policy "anfragen bearbeiten" on public.submissions
  for update to authenticated using (
    public.can_edit() and (
      public.is_admin() or public.scope_offen()
      or dept = any(public.my_depts())
      or dept is null
    )
  ) with check (true);

create index if not exists members_dept_idx on public.members (dept, last_name);
create index if not exists docs_dept_idx on public.internal_docs (dept, created_at desc);
create index if not exists tasks_dept_idx on public.tasks (dept, status, due_date);
