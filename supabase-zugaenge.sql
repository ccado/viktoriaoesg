-- ÖSG Viktoria 08: Zugänge, Rollen und Einladungen
-- Im Supabase SQL Editor ausführen, NACH supabase.sql.
-- Rollen: 'admin' (alles inkl. Zugänge), 'redaktion' (Inhalte und Anfragen), 'lesen' (nur ansehen)

-- 1) Profile
create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  email      text,
  name       text,
  phone      text,
  funktion   text,                                  -- z. B. "1. Vorsitzender"
  role       text not null default 'redaktion',
  approved   boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists funktion text;
alter table public.profiles enable row level security;

-- 2) Einladungen: Zugang vorbereiten, bevor sich die Person registriert
create table if not exists public.invites (
  email      text primary key,
  name       text,
  phone      text,
  funktion   text,
  role       text not null default 'redaktion',
  created_at timestamptz not null default now()
);
alter table public.invites enable row level security;

-- 3) Rechte-Helfer
create or replace function public.is_approved()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and approved);
$$;

create or replace function public.can_edit()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and approved and role in ('admin','redaktion'));
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and approved and role = 'admin');
$$;

-- 4) Policies für Profile und Einladungen
drop policy if exists "eigenes profil lesen" on public.profiles;
create policy "eigenes profil lesen" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_approved());

drop policy if exists "profile verwalten" on public.profiles;
create policy "profile verwalten" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "profile loeschen" on public.profiles;
create policy "profile loeschen" on public.profiles
  for delete to authenticated using (public.is_admin());

drop policy if exists "einladungen lesen" on public.invites;
create policy "einladungen lesen" on public.invites
  for select to authenticated using (public.is_approved());

drop policy if exists "einladungen anlegen" on public.invites;
create policy "einladungen anlegen" on public.invites
  for insert to authenticated with check (public.is_admin());

drop policy if exists "einladungen aendern" on public.invites;
create policy "einladungen aendern" on public.invites
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "einladungen loeschen" on public.invites;
create policy "einladungen loeschen" on public.invites
  for delete to authenticated using (public.is_admin());

-- 5) Registrierung: Profil anlegen, Einladung übernehmen
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare inv public.invites;
begin
  select * into inv from public.invites where lower(email) = lower(new.email);

  insert into public.profiles (id, email, name, phone, funktion, role, approved)
  values (
    new.id,
    new.email,
    coalesce(inv.name, new.raw_user_meta_data->>'name', ''),
    inv.phone,
    inv.funktion,
    coalesce(inv.role, 'redaktion'),
    inv.email is not null           -- eingeladene Personen sind sofort freigeschaltet
  )
  on conflict (id) do nothing;

  if inv.email is not null then
    delete from public.invites where lower(email) = lower(new.email);
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6) Inhalte: schreiben nur mit Rolle admin oder redaktion, lesen für alle Freigeschalteten
drop policy if exists "content schreibbar" on public.site_content;
create policy "content schreibbar" on public.site_content
  for update to authenticated using (public.can_edit()) with check (public.can_edit());

drop policy if exists "content anlegen" on public.site_content;
create policy "content anlegen" on public.site_content
  for insert to authenticated with check (public.can_edit());

drop policy if exists "anfragen lesen" on public.submissions;
create policy "anfragen lesen" on public.submissions
  for select to authenticated using (public.is_approved());

drop policy if exists "anfragen bearbeiten" on public.submissions;
create policy "anfragen bearbeiten" on public.submissions
  for update to authenticated using (public.can_edit()) with check (public.can_edit());

drop policy if exists "anfragen loeschen" on public.submissions;
create policy "anfragen loeschen" on public.submissions
  for delete to authenticated using (public.can_edit());

drop policy if exists "medien upload" on storage.objects;
create policy "medien upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'medien' and public.can_edit());

drop policy if exists "medien aendern" on storage.objects;
create policy "medien aendern" on storage.objects
  for update to authenticated using (bucket_id = 'medien' and public.can_edit())
  with check (bucket_id = 'medien' and public.can_edit());

drop policy if exists "medien loeschen" on storage.objects;
create policy "medien loeschen" on storage.objects
  for delete to authenticated using (bucket_id = 'medien' and public.can_edit());

-- 7) Bestehende Zugänge nachtragen
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- 8) Bestehenden Zugang der Vereinsadresse zum Oberadmin machen
update public.profiles
   set approved = true, role = 'admin',
       name     = coalesce(nullif(name, ''), 'Vereinsbüro'),
       funktion = coalesce(nullif(funktion, ''), 'Geschäftsstelle')
 where lower(email) = lower('info@oesg08.de');

-- 9) Zweiten Admin vorbereiten: sobald sich diese Adresse auf admin.html
--    registriert, ist der Zugang sofort freigeschaltet und hat Admin-Rechte.
insert into public.invites (email, name, funktion, role)
values ('djojananil@gmail.com', 'Anil', 'Website', 'admin')
on conflict (email) do update
   set role = 'admin', name = excluded.name, funktion = excluded.funktion;

-- Kontrolle: wer hat welche Rechte?
-- select email, name, funktion, role, approved from public.profiles order by created_at;
