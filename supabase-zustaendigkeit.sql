-- ÖSG Viktoria 08: Zuständigkeiten und Rechteanfragen (Variante A)
-- Im SQL Editor ausführen, NACH supabase-zugaenge.sql.

-- 1) Zuständigkeit pro Zugang
alter table public.profiles add column if not exists scope_depts text[] default '{}';
alter table public.profiles add column if not exists scope_teams text[] default '{}';

comment on column public.profiles.scope_depts is 'Leer = alle Abteilungen, sonst nur diese';
comment on column public.profiles.scope_teams is 'Leer = alle Mannschaften, sonst nur diese';

-- Einladungen können die Zuständigkeit gleich mitbringen
alter table public.invites add column if not exists scope_depts text[] default '{}';
alter table public.invites add column if not exists scope_teams text[] default '{}';

alter table public.profiles add column if not exists avatar_url text;
alter table public.invites add column if not exists avatar_url text;

-- 2) Rechteanfragen
create table if not exists public.rights_requests (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  email      text,
  name       text,
  wish_role  text,          -- gewünschte Rechtestufe
  wish_scope text,          -- gewünschte Bereiche als Text
  reason     text,
  status     text not null default 'offen',   -- offen | genehmigt | abgelehnt
  created_at timestamptz not null default now()
);

alter table public.rights_requests enable row level security;

drop policy if exists "rechteanfrage stellen" on public.rights_requests;
create policy "rechteanfrage stellen" on public.rights_requests
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "rechteanfrage lesen" on public.rights_requests;
create policy "rechteanfrage lesen" on public.rights_requests
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists "rechteanfrage bearbeiten" on public.rights_requests;
create policy "rechteanfrage bearbeiten" on public.rights_requests
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "rechteanfrage loeschen" on public.rights_requests;
create policy "rechteanfrage loeschen" on public.rights_requests
  for delete to authenticated using (public.is_admin());

-- 3) Einladung überträgt Zuständigkeit ins Profil
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare inv public.invites;
begin
  select * into inv from public.invites where lower(email) = lower(new.email);

  insert into public.profiles (id, email, name, phone, funktion, role, approved, scope_depts, scope_teams)
  values (
    new.id,
    new.email,
    coalesce(inv.name, new.raw_user_meta_data->>'name', ''),
    inv.phone,
    inv.funktion,
    coalesce(inv.role, 'redaktion'),
    inv.email is not null,
    coalesce(inv.scope_depts, '{}'),
    coalesce(inv.scope_teams, '{}')
  )
  on conflict (id) do nothing;

  if inv.email is not null then
    delete from public.invites where lower(email) = lower(new.email);
  end if;
  return new;
end;
$$;

-- Hinweis: Die Beschränkung auf einzelne Mannschaften wirkt im Admin-Bereich
-- (Oberfläche). Datenbankseitig gilt weiter: Rolle admin und redaktion dürfen
-- Inhalte schreiben, Rolle lesen nicht. Für harte Trennung pro Mannschaft
-- müssten Mannschaften, News und Termine in eigene Tabellen wandern.
