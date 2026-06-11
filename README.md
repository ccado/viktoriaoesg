# ÖSG Viktoria 08 — Vereinswebsite (Startseite)

Statische Startseite für die ÖSG Viktoria 08 e.V. Dortmund.
Reines HTML/CSS + ein kleines React-Panel für die Design-Tweaks.

## Dateien
- `index.html` — die Seite (Einstiegspunkt)
- `styles.css` — Design / Layout
- `app.jsx` + `tweaks-panel.jsx` — Tweaks-Panel (Farb-/Schriftumschalter)

## Online stellen mit Netlify

### Variante A — schnellste Vorschau (ohne GitHub)
1. Diesen Ordner als ZIP behalten (oder entpacken).
2. Auf **https://app.netlify.com/drop** gehen.
3. Den **Ordner** (nicht nur einzelne Dateien) per Drag & Drop ablegen.
4. Fertig — Netlify gibt dir sofort eine Live-URL zum Teilen.

### Variante B — über GitHub (für dauerhaftes Hosting)
1. Auf GitHub ein neues Repository anlegen (z. B. `oesg-viktoria`).
2. Diese Dateien hochladen (Drag & Drop im Repo unter „Add file → Upload files",
   oder per `git push`).
3. In Netlify: **Add new site → Import an existing project → GitHub** wählen,
   das Repo auswählen.
4. Build command: *(leer lassen)* · Publish directory: `.` (Projektwurzel).
5. Deploy klicken — bei jedem Push aktualisiert sich die Seite automatisch.

## Noch offen
- Echtes Vereinslogo (Wappen) und eigene Fotos einsetzen
- fussball.de-Widget (Spielplan/Tabelle) einbinden
- Impressum & Datenschutz befüllen
