-- ÖSG Viktoria 08: Online-Mitgliedsantrag
-- Im SQL Editor ausführen, NACH supabase.sql.

-- 1) Vollständige Antragsdaten am Formulareingang speichern
alter table public.submissions add column if not exists payload jsonb;
alter table public.submissions add column if not exists member_id uuid;

comment on column public.submissions.payload is 'Alle Felder des Online-Aufnahmeantrags';
comment on column public.submissions.member_id is 'Gesetzt, sobald der Antrag als Mitglied übernommen wurde';

-- 2) E-Mail bei neuer Anfrage, mit vollständigem Antrag bei Mitgliedsanträgen
--    Voraussetzung: private_settings aus supabase-email.sql ist eingerichtet.
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
  zeilen text := '';
  k text;
  v text;
  ist_antrag boolean;
begin
  select value into api_key   from private_settings where key = 'resend_api_key';
  select value into mail_to   from private_settings where key = 'mail_to';
  select value into mail_from from private_settings where key = 'mail_from';

  if api_key is null or api_key = 'HIER_RESEND_API_KEY_EINSETZEN' then
    return new;
  end if;

  ist_antrag := coalesce(new.type, '') = 'Mitgliedsantrag';

  betreff := case when ist_antrag
    then 'Neuer Mitgliedsantrag: ' || coalesce(new.name, '')
      || case when new.dept is not null then ' (' || new.dept || ')' else '' end
    else 'Neue Anfrage: ' || coalesce(new.type, 'Website')
      || case when new.dept is not null then ' (' || new.dept || ')' else '' end
  end;

  -- Basisangaben
  zeilen :=
    '<tr><td style="padding:5px 14px 5px 0;color:#667">Anliegen</td><td><b>' || coalesce(new.type, '') || '</b></td></tr>' ||
    '<tr><td style="padding:5px 14px 5px 0;color:#667">Abteilung</td><td>' || coalesce(new.dept, '-') || '</td></tr>' ||
    '<tr><td style="padding:5px 14px 5px 0;color:#667">Mannschaft</td><td>' || coalesce(new.team, '-') || '</td></tr>' ||
    '<tr><td style="padding:5px 14px 5px 0;color:#667">Name</td><td>' || coalesce(new.name, '') || '</td></tr>' ||
    '<tr><td style="padding:5px 14px 5px 0;color:#667">E-Mail</td><td><a href="mailto:' || coalesce(new.email, '') || '">' || coalesce(new.email, '') || '</a></td></tr>' ||
    '<tr><td style="padding:5px 14px 5px 0;color:#667">Telefon</td><td>' || coalesce(new.phone, '-') || '</td></tr>';

  -- Alle Antragsfelder anhängen
  if new.payload is not null then
    for k, v in select key, value from jsonb_each_text(new.payload) loop
      if coalesce(v, '') <> '' then
        zeilen := zeilen ||
          '<tr><td style="padding:5px 14px 5px 0;color:#667">' || k || '</td><td>' || v || '</td></tr>';
      end if;
    end loop;
  end if;

  inhalt :=
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px">' ||
    '<h2 style="margin:0 0 4px">' || case when ist_antrag then 'Neuer Mitgliedsantrag' else 'Neue Anfrage über die Website' end || '</h2>' ||
    '<p style="margin:0 0 18px;color:#667;font-size:14px">ÖSG Viktoria 08 e.V. · eingegangen am ' ||
      to_char(new.created_at at time zone 'Europe/Berlin', 'DD.MM.YYYY HH24:MI') || ' Uhr</p>' ||
    '<table style="font-size:14px;border-collapse:collapse">' || zeilen || '</table>' ||
    case when coalesce(new.message, '') <> ''
      then '<p style="font-size:14px;white-space:pre-wrap;background:#f5f7fa;padding:12px 14px;border-radius:6px">' || new.message || '</p>'
      else '' end ||
    case when ist_antrag
      then '<p style="font-size:13px;color:#667">Der Antrag wurde online gestellt und liegt im Admin-Bereich zur Prüfung. Dort kann er angenommen und direkt in die Mitgliederverwaltung übernommen werden.</p>'
      else '' end ||
    '<p style="font-size:13px"><a href="https://oesg08.de/admin.html#anfragen">Im Admin-Bereich öffnen</a></p></div>';

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

drop trigger if exists submissions_notify on public.submissions;
create trigger submissions_notify
  after insert on public.submissions
  for each row execute function public.notify_new_submission();

-- Empfänger je Abteilung ergänzen, Beispiel:
--   insert into private_settings (key, value) values ('mail_to', 'info@oesg08.de,vorstand@oesg08.de')
--   on conflict (key) do update set value = excluded.value;
