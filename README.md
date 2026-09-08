# ÖSG Viktoria 08 e.V., Website + Admin-Bereich

Statische Website (kein Server nötig) mit eigenem Admin-Bereich. Alle Inhalte liegen als
Daten in `content.js` und lassen sich im Admin-Bereich bearbeiten; Änderungen werden im
Browser gespeichert (localStorage) und können als JSON exportiert/importiert werden.

## Dateien
| Datei | Zweck |
|---|---|
| `index.html` | Website (Hash-Routing, Shell) |
| `site.js` | Rendert alle öffentlichen Seiten aus dem Inhalts-Store |
| `styles.css` | Design der Website |
| `content.js` | **Inhalte + Store** (Startwerte, Speichern, Anfragen) |
| `admin.html` / `admin.js` / `admin.css` | Admin-Bereich |

## Seiten
`#/` Start · `#/verein` · `#/abteilungen` · `#/abteilung/:slug` · `#/mannschaften` ·
`#/news` · `#/news/:slug` · `#/termine` · `#/faq` · `#/dokumente` · `#/kontakt` · `#/impressum` · `#/datenschutz`

## Admin-Bereich
`admin.html`, Zugangscode: **viktoria08** (in Einstellungen änderbar).

Bereiche: Dashboard, **Anfragen** (Formulareingänge annehmen/ablehnen), News, Termine,
Mannschaften, Abteilungen, Galerie, Dokumente, Seiteninhalte (inkl. Impressum/Datenschutz),
FAQ, Partner, Ansprechpartner, Einstellungen (Vereinsdaten, Adressen, Farbvariante, Schrift).

Export/Import als JSON über die Sidebar, damit lassen sich Inhalte sichern oder später in
ein echtes Backend übernehmen.

## Backend (Supabase)

Die Website läuft auch ohne Backend (dann lokal im Browser). Für echten Betrieb:

1. Auf supabase.com ein kostenloses Projekt anlegen.
2. Im Supabase-Dashboard unter "SQL Editor" die Datei `supabase.sql` ausführen.
   Sie legt Tabellen, Rechte (RLS) und den Datei-Speicher `medien` an.
3. Unter "Project Settings, API" die Project URL und den anon-Key kopieren und in
   `supabase-config.js` eintragen.
4. Unter "Authentication, Users" für jedes Vorstandsmitglied einen Zugang mit E-Mail und
   Passwort anlegen. Selbstregistrierung dort abschalten
   (Authentication, Providers, Email: "Allow new users to sign up" aus).
5. Fertig: Der Admin-Bereich meldet sich dann per E-Mail und Passwort an, Inhalte gelten für
   alle Besucher, Kontaktanfragen landen in der Datenbank, Bilder und PDFs lassen sich direkt
   im Admin hochladen.

Die Topbar im Admin zeigt an, ob das Backend verbunden ist oder nur lokal gespeichert wird.

**E-Mail bei neuer Anfrage:** in Supabase unter "Database, Webhooks" einen Webhook auf
`submissions` (Insert) legen, der eine Edge Function oder einen Dienst wie Resend anspricht.
Ohne Webhook stehen neue Anfragen trotzdem im Admin unter "Anfragen".

Dateien dafür: `supabase.sql` (Schema), `supabase-config.js` (Zugangsdaten), `db.js` (Datenzugriff).

## Wichtige Hinweise
- **Kontaktdaten der Ansprechpartner sind bewusst leer** (Platzhalter). Namen und Funktionen
  sind eingetragen, E-Mail/Telefon im Admin ergänzen.
- Adresse: **Hallesche Straße 76, 44143 Dortmund** (Verein + Sportanlage: Kunstrasen, Flutlicht,
  ca. 3.000 Plätze). Halle für Boxen/Tischtennis/Gymnastik: Uhlandschule, Heilbronner Str. 4.
- Impressum/Datenschutz sind Vorlagen, Registernummer ergänzen und rechtlich prüfen lassen.
- **Probetraining:** Formulierung offen gehalten („Termin auf Anfrage“), kostenlos ist es nur
  für die Boxabteilung belegt. Falls es für alle Abteilungen gilt, im Admin anpassen.
- **Fotos:** kuratierte lizenzfreie Bilder (Unsplash-Lizenz), passend zur jeweiligen Sportart:
  Ballkontakt beim Fußball, Sandsack beim Boxen, Tischtennis-Match, Gymnastik/Dehnen.
  Eigene Fotos: im Admin pro Eintrag Bild-URL setzen, dann wird das Stockbild ersetzt.
- **Hero:** in den Einstellungen umschaltbar zwischen Foto und reiner Farbfläche.
- Ohne eingetragene Supabase-Zugangsdaten landen Formularanfragen nur im Browser-Speicher.
- Spielplan/Tabelle: Platz für das fussball.de-Widget ist auf Start-, Termine- und
  Mannschaftsseite vorgesehen.

## Deployment
Ordner unverändert hochladen (Netlify Drop, GitHub Pages, klassisches Webhosting).
