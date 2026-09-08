-- ÖSG Viktoria 08: E-Mail-Benachrichtigung bei neuer Anfrage
-- Voraussetzung: Konto bei resend.com (kostenlos) und ein API-Key.
-- Danach die zwei Platzhalter unten ersetzen und das Skript im Supabase
-- SQL Editor ausführen.

-- 1) Erweiterung für HTTP-Aufrufe aus der Datenbank
create extension if not exists pg_net with schema extensions;

-- 2) Zugangsdaten hinterlegen (nur für Datenbank-Rollen lesbar, nicht öffentlich)
create table if not exists private_settings (
  key   text primary key,
  value text not null
);
alter table private_settings enable row level security;
-- absichtlich keine Policy: über die öffentliche API ist die Tabelle damit gesperrt

insert into private_settings (key, value) values
  ('resend_api_key', 'HIER_RESEND_API_KEY_EINSETZEN'),
  ('mail_to',        'info@oesg08.de'),
  ('mail_from',      'ÖSG Viktoria 08 <onboarding@resend.dev>')
on conflict (key) do update set value = excluded.value;

-- 3) Funktion, die die Mail verschickt
create or replace function public.notify_new_submission()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  api_key text;
  mail_to text;
  mail_from text;
  betreff text;
  inhalt text;
begin
  select value into api_key   from private_settings where key = 'resend_api_key';
  select value into mail_to   from private_settings where key = 'mail_to';
  select value into mail_from from private_settings where key = 'mail_from';

  if api_key is null or api_key = 'HIER_RESEND_API_KEY_EINSETZEN' then
    return new;
  end if;

  betreff := 'Neue Anfrage: ' || coalesce(new.type, 'Website') ||
             case when new.dept is not null then ' (' || new.dept || ')' else '' end;

  inhalt :=
    '<h2 style="font-family:Arial,sans-serif">Neue Anfrage über die Website</h2>' ||
    '<table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">' ||
    '<tr><td style="padding:4px 12px 4px 0;color:#666">Anliegen</td><td><b>' || coalesce(new.type, '') || '</b></td></tr>' ||
    '<tr><td style="padding:4px 12px 4px 0;color:#666">Abteilung</td><td>' || coalesce(new.dept, '') || '</td></tr>' ||
    '<tr><td style="padding:4px 12px 4px 0;color:#666">Mannschaft</td><td>' || coalesce(new.team, '') || '</td></tr>' ||
    '<tr><td style="padding:4px 12px 4px 0;color:#666">Name</td><td>' || coalesce(new.name, '') || '</td></tr>' ||
    '<tr><td style="padding:4px 12px 4px 0;color:#666">Geburtsjahr</td><td>' || coalesce(new.birth, '') || '</td></tr>' ||
    '<tr><td style="padding:4px 12px 4px 0;color:#666">E-Mail</td><td><a href="mailto:' || coalesce(new.email, '') || '">' || coalesce(new.email, '') || '</a></td></tr>' ||
    '<tr><td style="padding:4px 12px 4px 0;color:#666">Telefon</td><td>' || coalesce(new.phone, '') || '</td></tr>' ||
    '</table>' ||
    '<p style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap">' || coalesce(new.message, '') || '</p>' ||
    '<p style="font-family:Arial,sans-serif;font-size:13px;color:#666">Bearbeiten im Admin-Bereich: https://oesg08.de/admin.html</p>';

  perform net.http_post(
    url     := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || api_key
    ),
    body    := jsonb_build_object(
      'from',     mail_from,
      'to',       string_to_array(mail_to, ','),
      'subject',  betreff,
      'html',     inhalt,
      'reply_to', new.email
    )
  );

  return new;
end;
$$;

-- 4) Trigger
drop trigger if exists submissions_notify on public.submissions;
create trigger submissions_notify
  after insert on public.submissions
  for each row execute function public.notify_new_submission();

-- Empfängeradresse später ändern:
--   update private_settings set value = 'vorstand@oesg08.de' where key = 'mail_to';
-- Mehrere Empfänger mit Komma trennen:
--   update private_settings set value = 'a@oesg08.de,b@oesg08.de' where key = 'mail_to';
