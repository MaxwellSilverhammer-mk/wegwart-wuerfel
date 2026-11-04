# Wegwart-Würfel

Würfelkästen für die geteilte Welt „Hold der Seeprinzen“, ein D&D-5e-Textabenteuer mit Claude als Spielleitung. Die Datei `wuerfel.js` zeichnet animierte Würfel in ein Visualizer-Widget und schickt das Ergebnis per `sendPrompt` an die Spielleitung.

## Aufruf

```html
<h2 class="sr-only">Würfelkasten: Überzeugen +4 mit Vorteil</h2>
<div id="wk">Würfelkasten lädt … Falls nicht, würfle selbst: Überzeugen +4</div>
<script>WK={art:'probe',nr:3,name:'Überzeugen',bonus:4,anlass:'Aske glaubt dir',modus:'vorteil',grund:'gute Vorbereitung',min:10,minName:'Silberzunge',held:true,sg:15}</script>
<script src="https://cdn.jsdelivr.net/gh/KONTO/wegwart-wuerfel@v1.0/wuerfel.js"></script>
```

## Arten und Felder

| Art | Pflichtfelder | Weitere Felder |
|---|---|---|
| `probe` | `nr`, `name`, `bonus` | `sg` (ohne SG nur Summe), `modus`, `grund`, `min`, `minName`, `held`, `anlass`, `zusatz` |
| `rettung` | `nr`, `name`, `bonus`, `sg` | wie `probe` |
| `tod` | `nr`, `name`, `tod: [Erfolge, Fehlschläge]` | `held`, `anlass` |
| `angriff` | `nr`, `name`, `bonus`, `rk`, `schaden: [[Anzahl, Seiten]]` | `mod`, `typ`, `modus`, `grund`, `held`, `anlass`, `zusatz` |
| `schaden`, `heilung`, `inspiration`, `trefferwuerfel` | `nr`, `name`, `wuerfel: [[Anzahl, Seiten]]` | `mod`, `typ` (nur Schaden), `held`, `anlass` |
| `wurf` (seit 1.1) | `nr`, `name`, `wuerfel: [[Anzahl, Seiten]]` | `mod`, `einheit`, `held`, `anlass` |

- `modus`: `'vorteil'` oder `'nachteil'`
- `held: true`, wenn die Figur Heldenmut hat
- `min`/`minName`: Mindestwurf, z. B. Silberzunge (9 oder weniger zählt als 10)
- `typ`: Säure, Wucht, Kälte, Feuer, Energie, Blitz, nekrotisch, Stich, Gift, psychisch, gleißend, Hieb, Schall. Jede Art hat eine eigene Animation.
- `wurf`: ein Wurf, der nur zählt, ohne Schadensanzeige, Farbe oder Animation: Trefferpunkte für Sleep, Stunden, Mengen, ein Tabellenwurf mit mehreren Würfeln. `einheit` sagt, was die Zahl zählt (`'Trefferpunkte'`, `'Stunden'`); ohne `einheit` steht nur die Zahl. Die Zeile an die Spielleitung lautet dann „Würfel #4 · Wurf · Sleep · 5W8 · 3 + 7 + 2 + 8 + 5 = 25 Trefferpunkte“. Für einen einzelnen W20, der nur zählt (Initiative, Verletzungstabelle), bleibt `probe` ohne `sg`.

## Zusatz

Seit 1.2, bei `probe`, `rettung` und `angriff`. Würfel, die nach dem W20 dazukommen, etwa Guidance oder Verbindendes Band, brauchen keinen eigenen Kasten mehr, und der Spieler kann erst nach dem W20 entscheiden:

```js
zusatz:[{name:'Guidance',wuerfel:[[1,4]]},{name:'Verbindendes Band',wuerfel:[[1,4]]}]
```

- **Ablauf:** Nach dem W20 zeigt der Kasten die Zwischensumme und je einen Knopf für jeden Zusatz, Heldenmut (bei `held`) und „Behalten“, auch ohne `held`. Ein gefallener Zusatz zählt in der Zwischensumme mit, die übrigen Knöpfe bleiben. Der Grad kommt zuletzt und rechnet die Zusätze mit. Bleibt nichts zu entscheiden, geht die Zeile von selbst hinaus.
- **`minus:true`** (Bane): Der Würfel wird abgezogen und von selbst gewürfelt, gleich nach dem W20 und vor den Knöpfen. Ist nur so ein Zusatz da und kein `held`, gibt es keine Knöpfe.
- **Natürliche 20 oder 1:** keine Zusatzknöpfe, denn die Summe zählt dort nicht (Regelwerk 6.5), und auch `minus` fällt nicht. Der Zusatz bleibt unverbraucht. Wirft Heldenmut die 1 neu, erscheinen die Knöpfe danach. Ein Mindestwurf wie Silberzunge macht aus einer gewürfelten 1 die Mindestzahl; dann gibt es keine natürliche 1 und also Knöpfe.
- **Heldenmut** wirft nur den W20 neu, bei Vorteil oder Nachteil den schlechteren, nie einen Zusatz. Was schon gefallen ist, bleibt in der Summe.
- **Angriff:** Der Zusatz zählt nur für den Angriffswurf, nicht für den Schaden. Heldenmut geht weiter auf den Angriffswurf oder, wenn dort ungenutzt, auf den Schaden. Die Zusatzwürfel liegen in einer eigenen Reihe unter den W20; die Schadenswürfel bleiben, wo sie waren.
- **Zeile:** Nur was gefallen ist, steht darin: „Würfel #17 · Überzeugen +5 · Guidance W4: 3 · 14 + 5 + 3 = 22 · gut gelungen“, mit Abzug „Bane W4: −2 · 12 + 4 − 2 = 14“, mit mehreren Würfeln „2W4: 3 + 1 = 4“. Was nicht in der Zeile steht, ist nicht verbraucht.
- Der Todesrettungswurf kennt keinen Zusatz. Ohne `zusatz` läuft alles wie in 1.1.

## Erfolgsgrade bei Proben

| Ergebnis | Grad |
|---|---|
| SG + 10 oder natürliche 20 | glänzend gelungen |
| SG + 5 | gut gelungen |
| SG erreicht | gelungen |
| 1 bis 4 darunter | knapp daneben |
| 5 oder mehr darunter oder natürliche 1 | misslungen |

Rettungswürfe kennen nur „gelungen“ und „misslungen“. SG und RK zeigt der Kasten nie an.

## Versionen

Jede Änderung bekommt einen neuen Stand. Das Regelwerk (6.2) und `meta/welt` in der Weltchronik nennen die Adresse mit dem festen Commit, der gilt; alte Aufrufe bleiben auf ihrem Stand und ändern sich nicht.

- 1.0: Proben, Rettungswürfe, Todesrettungswürfe, Angriffe mit Schaden, Würfelpools für Schaden, Heilung, Inspiration und Trefferwürfel.
- 1.1: `wurf`, der neutrale Wurf mit `einheit`.
- 1.2: `zusatz` bei `probe`, `rettung` und `angriff`, mit `minus`; Heldenmut wirft dabei nur den W20 neu. Tests: `node test/wuerfel.test.js` (Playwright mit Chromium).
