/* app.jsx — Tweaks panel for ÖSG Viktoria 08 homepage.
   Applies palette + headline font by setting data-attrs on <body>. */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "rotblau",
  "headline": "oswald"
}/*EDITMODE-END*/;

const PALETTES = [
  { id: "rotblau", label: "Rot & Blau" },
  { id: "rot",     label: "Rot dominant" },
  { id: "blau",    label: "Blau dominant" },
  { id: "dezent",  label: "Dezent" },
];

const HEADLINES = [
  { id: "oswald",  label: "Oswald" },
  { id: "anton",   label: "Anton" },
  { id: "archivo", label: "Archivo" },
];

function Swatch({ palette }) {
  // little dual-colour chip so the choice reads visually
  const map = {
    rotblau: ["#d81f2a", "#15327f"],
    rot:     ["#d81f2a", "#9a1118"],
    blau:    ["#15327f", "#d81f2a"],
    dezent:  ["#1d1f25", "#d81f2a"],
  };
  const [a, b] = map[palette] || map.rotblau;
  return (
    <span style={{ display: "inline-flex", borderRadius: 3, overflow: "hidden", border: "1px solid rgba(0,0,0,.12)", flex: "none" }}>
      <span style={{ width: 14, height: 16, background: a }} />
      <span style={{ width: 14, height: 16, background: b }} />
    </span>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    document.body.dataset.palette = t.palette;
    document.body.dataset.headline = t.headline;
  }, [t.palette, t.headline]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Farbrichtung" />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {PALETTES.map((p) => {
          const active = t.palette === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setTweak("palette", p.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 11px", borderRadius: 7, textAlign: "left",
                border: active ? "1.5px solid #15327f" : "1.5px solid rgba(0,0,0,.10)",
                background: active ? "rgba(21,50,127,.06)" : "#fff",
                fontWeight: active ? 700 : 500, fontSize: 13, color: "#15171c",
                cursor: "pointer", transition: "all .15s ease",
              }}
            >
              <Swatch palette={p.id} />
              {p.label}
            </button>
          );
        })}
      </div>

      <TweakSection label="Headline-Schrift" />
      <TweakRadio
        label="Stil"
        value={t.headline}
        options={HEADLINES.map((h) => ({ value: h.id, label: h.label }))}
        onChange={(v) => setTweak("headline", v)}
      />
      <p style={{ fontSize: 11.5, color: "#8b8f97", lineHeight: 1.5, margin: "4px 2px 0" }}>
        Schalte Farbwelt und Schrift um, um Richtungen zu vergleichen. Logo & echte Fotos folgen.
      </p>
    </TweaksPanel>
  );
}

const mount = document.createElement("div");
document.body.appendChild(mount);
ReactDOM.createRoot(mount).render(<App />);
