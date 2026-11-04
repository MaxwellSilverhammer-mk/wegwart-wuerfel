// Prüft den Würfelkasten im Browser, mit festgelegten Würfen: den Zusatz (seit 1.2) bei Probe, Rettungswurf und Angriff,
// und dass ohne `zusatz` alles läuft wie in 1.1. Braucht Playwright mit Chromium: node test/wuerfel.test.js
'use strict';
var assert = require('assert'), fs = require('fs'), path = require('path');
var chromium = require('playwright').chromium;
var code = fs.readFileSync(process.env.WUERFEL_JS || path.join(__dirname, '..', 'wuerfel.js'), 'utf8').replace(/<\/script/g, '<\\/script');

var FARBEN = ':root{--surface-1:#f1efe8;--surface-2:#faf9f5;--border:#d8d4c8;--text-primary:#2a2a26;--text-secondary:#66645c;--text-muted:#99968b;' +
  '--text-warning:#8a5a00;--text-danger:#a32d2d;--text-success:#2c6e2f;--text-accent:#1f5f99;--bg-warning:#f7ecd2;--bg-danger:#f8dfdf;--bg-success:#deefdc;' +
  '--bg-accent:#dbe9f6;--border-accent:#9dc0e0;--border-warning:#dfc283;--radius:8px}body{margin:16px;font:14px sans-serif;color:var(--text-primary)}' +
  'button{font:inherit;padding:6px 12px;border:1px solid var(--border);border-radius:8px;background:#fff}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden}';

function seite(C, folge) {
  // Jeder Wurf nimmt die nächste Zahl aus der Folge; bleibt am Ende etwas übrig oder fehlt etwas, schlägt der Test an.
  return '<!doctype html><meta charset="utf-8"><style>' + FARBEN + '</style><div id="wk"></div><script>' +
    'window.folge=' + JSON.stringify(folge) + ';window.gesendet=[];window.zuwenig=0;window.sendPrompt=function(m){gesendet.push(m)};' +
    'Object.defineProperty(crypto,"getRandomValues",{value:function(a){if(!folge.length){zuwenig++;a[0]=0}else a[0]=folge.shift()-1;return a}});' +
    'var WK=' + JSON.stringify(C) + '</scr' + 'ipt><script>' + code + '</scr' + 'ipt>';
}

var browser, ctx, n = 0;
function ok(name) { n++; console.log('ok  ' + name); }

async function lauf(C, folge) {
  var page = await ctx.newPage();
  await page.setContent(seite(C, folge));
  await page.waitForSelector('#wk .wkA button');
  return {
    page: page,
    knoepfe: async function () {
      await page.waitForTimeout(30);
      return page.$$eval('#wk .wkA button', function (b) { return b.map(function (x) { return x.textContent.trim(); }); });
    },
    klick: async function (text) { await page.locator('#wk .wkA button', { hasText: text }).first().click(); await page.waitForTimeout(30); },
    zwischen: function () { return page.locator('#wk .wkR').first().textContent(); },
    zeile: async function () {
      await page.waitForFunction(function () { return window.gesendet.length > 0; }, null, { timeout: 3000 });
      var r = await page.evaluate(function () { return { g: window.gesendet, f: window.folge, z: window.zuwenig }; });
      assert.strictEqual(r.g.length, 1, 'genau eine Zeile');
      assert.deepStrictEqual(r.f, [], 'alle vorgesehenen Würfe sind gefallen, und nicht mehr: ' + r.g[0]);
      assert.strictEqual(r.z, 0, 'kein Wurf zu viel: ' + r.g[0]);
      await page.close();
      return r.g[0];
    }
  };
}
var G = { name: 'Guidance', wuerfel: [[1, 4]] }, V = { name: 'Verbindendes Band', wuerfel: [[1, 4]] }, B = { name: 'Bane', wuerfel: [[1, 4]], minus: true };
var P = { art: 'probe', nr: 17, name: 'Überzeugen', bonus: 5, sg: 17 };
function mit(basis, extra) { return Object.assign({}, basis, extra); }

(async function () {
  browser = await chromium.launch();
  ctx = await browser.newContext({ reducedMotion: 'reduce' });
  var L, k;

  // Der Ablauf
  L = await lauf(mit(P, { zusatz: [G] }), [14, 3]);
  k = await L.knoepfe(); assert.deepStrictEqual(k, ['W20 würfeln'], 'vor dem Wurf kein Pfeil, denn es folgt noch eine Wahl');
  await L.klick('W20 würfeln');
  assert.deepStrictEqual(await L.knoepfe(), ['Guidance W4 ↗', 'Behalten ↗']);
  assert.ok(/14 \+ 5 = 19/.test(await L.zwischen()), 'Zwischensumme ohne Grad');
  assert.strictEqual(await L.page.locator('#wk .wkStrip').count(), 0, 'noch kein Grad');
  await L.klick('Guidance');
  assert.strictEqual(await L.zeile(), 'Würfel #17 · Überzeugen +5 · Guidance W4: 3 · 14 + 5 + 3 = 22 · gut gelungen');
  ok('die Zeile aus dem Beschluss, der letzte Zusatz schickt von selbst');

  L = await lauf(mit(P, { zusatz: [G] }), [14]);
  await L.klick('W20 würfeln'); await L.klick('Behalten');
  assert.strictEqual(await L.zeile(), 'Würfel #17 · Überzeugen +5 · 14 + 5 = 19 · gelungen');
  ok('Behalten: der Zusatz bleibt unverbraucht und steht nicht in der Zeile');

  L = await lauf(mit(P, { zusatz: [G, V] }), [14, 3, 2]);
  await L.klick('W20 würfeln');
  assert.deepStrictEqual(await L.knoepfe(), ['Guidance W4', 'Verbindendes Band W4', 'Behalten ↗']);
  await L.klick('Guidance');
  assert.deepStrictEqual(await L.knoepfe(), ['Verbindendes Band W4 ↗', 'Behalten ↗']);
  assert.ok(/14 \+ 5 \+ 3 = 22/.test(await L.zwischen()), 'die Zwischensumme rechnet ihn mit');
  await L.klick('Verbindendes');
  assert.strictEqual(await L.zeile(), 'Würfel #17 · Überzeugen +5 · Guidance W4: 3 · Verbindendes Band W4: 2 · 14 + 5 + 3 + 2 = 24 · gut gelungen');
  ok('zwei Zusätze nacheinander, der zweite nach Sicht auf den ersten');

  L = await lauf(mit(P, { zusatz: [G, V] }), [14, 3]);
  await L.klick('W20 würfeln'); await L.klick('Verbindendes'); await L.klick('Behalten');
  assert.strictEqual(await L.zeile(), 'Würfel #17 · Überzeugen +5 · Verbindendes Band W4: 3 · 14 + 5 + 3 = 22 · gut gelungen');
  ok('nur einer von zweien');

  L = await lauf(mit(P, { zusatz: [G], sg: 20 }), [14, 2]);
  await L.klick('W20 würfeln'); await L.klick('Guidance');
  assert.strictEqual(await L.zeile(), 'Würfel #17 · Überzeugen +5 · Guidance W4: 2 · 14 + 5 + 2 = 21 · gelungen');
  ok('der Grad rechnet den Zusatz mit: ohne ihn wäre es knapp daneben');

  // Natürliche 20 und 1
  L = await lauf(mit(P, { zusatz: [G, V] }), [20]);
  await L.klick('W20 würfeln');
  assert.deepStrictEqual(await L.knoepfe(), []);
  assert.strictEqual(await L.zeile(), 'Würfel #17 · Überzeugen +5 · 20 + 5 = 25 · glänzend gelungen · natürliche 20');
  L = await lauf(mit(P, { zusatz: [G] }), [1]);
  await L.klick('W20 würfeln');
  assert.deepStrictEqual(await L.knoepfe(), []);
  assert.strictEqual(await L.zeile(), 'Würfel #17 · Überzeugen +5 · 1 + 5 = 6 · misslungen · natürliche 1');
  ok('natürliche 20 und 1 ohne Knöpfe, der Zusatz bleibt unverbraucht');

  L = await lauf(mit(P, { zusatz: [G], held: true }), [1, 12, 4]);
  await L.klick('W20 würfeln');
  assert.deepStrictEqual(await L.knoepfe(), ['Behalten ↗', 'Heldenmut ↗'], 'bei der 1 nur Heldenmut und Behalten');
  await L.klick('Heldenmut');
  assert.deepStrictEqual(await L.knoepfe(), ['Guidance W4 ↗', 'Behalten ↗'], 'danach erscheinen die Zusätze, Heldenmut ist fort');
  await L.klick('Guidance');
  assert.strictEqual(await L.zeile(), 'Würfel #17 · Überzeugen +5 · Heldenmut 1 → 12 · Guidance W4: 4 · 12 + 5 + 4 = 21 · gelungen');
  ok('Heldenmut wirft die 1 neu, dann kommen die Zusatzknöpfe');

  L = await lauf(mit(P, { zusatz: [G], held: true }), [20]);
  await L.klick('W20 würfeln');
  assert.deepStrictEqual(await L.knoepfe(), ['Behalten ↗', 'Heldenmut ↗']);
  await L.klick('Behalten');
  assert.strictEqual(await L.zeile(), 'Würfel #17 · Überzeugen +5 · 20 + 5 = 25 · glänzend gelungen · natürliche 20');
  ok('bei der 20 mit Heldenmut wie in 1.1, ohne Zusatzknopf');

  // Heldenmut und Zusatz
  L = await lauf(mit(P, { zusatz: [G], held: true }), [5, 3, 15]);
  await L.klick('W20 würfeln');
  assert.deepStrictEqual(await L.knoepfe(), ['Guidance W4', 'Behalten ↗', 'Heldenmut']);
  await L.klick('Guidance');
  assert.deepStrictEqual(await L.knoepfe(), ['Behalten ↗', 'Heldenmut ↗']);
  await L.klick('Heldenmut');
  assert.strictEqual(await L.zeile(), 'Würfel #17 · Überzeugen +5 · Heldenmut 5 → 15 · Guidance W4: 3 · 15 + 5 + 3 = 23 · gut gelungen');
  ok('Heldenmut wirft nur den W20 neu, der gefallene Zusatz bleibt');

  L = await lauf(mit(P, { zusatz: [G], held: true }), [5, 15, 2]);
  await L.klick('W20 würfeln'); await L.klick('Heldenmut');
  assert.deepStrictEqual(await L.knoepfe(), ['Guidance W4 ↗', 'Behalten ↗'], 'der Zusatz geht auch nach Heldenmut noch');
  await L.klick('Guidance');
  assert.strictEqual(await L.zeile(), 'Würfel #17 · Überzeugen +5 · Heldenmut 5 → 15 · Guidance W4: 2 · 15 + 5 + 2 = 22 · gut gelungen');
  L = await lauf(mit(P, { zusatz: [G, V], held: true }), [5, 3, 1]);
  await L.klick('W20 würfeln'); await L.klick('Guidance'); await L.klick('Heldenmut');
  assert.deepStrictEqual(await L.knoepfe(), []);
  assert.strictEqual(await L.zeile(), 'Würfel #17 · Überzeugen +5 · Heldenmut 5 → 1 · Guidance W4: 3 · 1 + 5 + 3 = 9 · misslungen · natürliche 1');
  ok('Heldenmut in beiden Reihenfolgen; fällt dabei die 1, gibt es keinen weiteren Knopf');

  // Bane
  L = await lauf(mit(P, { art: 'rettung', name: 'Geschicklichkeit', bonus: 4, sg: 14, zusatz: [B] }), [12, 2]);
  assert.deepStrictEqual(await L.knoepfe(), ['W20 würfeln ↗'], 'nichts zu entscheiden: der Wurf schickt von selbst');
  await L.klick('W20 würfeln');
  assert.strictEqual(await L.zeile(), 'Würfel #17 · Geschicklichkeit +4 · Bane W4: −2 · 12 + 4 − 2 = 14 · gelungen');
  L = await lauf(mit(P, { art: 'rettung', name: 'Geschicklichkeit', bonus: 4, sg: 15, zusatz: [B] }), [12, 2]);
  await L.klick('W20 würfeln');
  assert.strictEqual(await L.zeile(), 'Würfel #17 · Geschicklichkeit +4 · Bane W4: −2 · 12 + 4 − 2 = 14 · misslungen');
  ok('Bane würfelt von selbst und zieht ab');

  L = await lauf(mit(P, { art: 'rettung', name: 'Geschicklichkeit', bonus: 4, sg: 15, zusatz: [B] }), [20]);
  await L.klick('W20 würfeln');
  assert.strictEqual(await L.zeile(), 'Würfel #17 · Geschicklichkeit +4 · 20 + 4 = 24 · gelungen · natürliche 20');
  ok('bei natürlicher 20 fällt Bane nicht');

  L = await lauf(mit(P, { zusatz: [B, G], held: true }), [12, 1, 4, 18]);
  await L.klick('W20 würfeln');
  assert.ok(/12 \+ 5 − 1 = 16/.test(await L.zwischen()), 'die Zwischensumme enthält Bane schon');
  assert.deepStrictEqual(await L.knoepfe(), ['Guidance W4', 'Behalten ↗', 'Heldenmut']);
  await L.klick('Guidance'); await L.klick('Heldenmut');
  assert.strictEqual(await L.zeile(), 'Würfel #17 · Überzeugen +5 · Heldenmut 12 → 18 · Bane W4: −1 · Guidance W4: 4 · 18 + 5 − 1 + 4 = 26 · gut gelungen');
  ok('Bane, Zusatz und Heldenmut zusammen');

  L = await lauf(mit(P, { zusatz: [B], held: true }), [1, 10, 3]);
  await L.klick('W20 würfeln');
  assert.deepStrictEqual(await L.knoepfe(), ['Behalten ↗', 'Heldenmut ↗']);
  await L.klick('Heldenmut');
  assert.strictEqual(await L.zeile(), 'Würfel #17 · Überzeugen +5 · Heldenmut 1 → 10 · Bane W4: −3 · 10 + 5 − 3 = 12 · misslungen');
  ok('wirft Heldenmut die 1 neu, fällt Bane danach');

  // Mit anderen Feldern
  L = await lauf(mit(P, { bonus: 6, min: 10, minName: 'Silberzunge', sg: 15, zusatz: [G] }), [1, 3]);
  await L.klick('W20 würfeln');
  assert.deepStrictEqual(await L.knoepfe(), ['Guidance W4 ↗', 'Behalten ↗'], 'Silberzunge macht aus der 1 eine 10: keine natürliche 1 (6.5)');
  await L.klick('Guidance');
  assert.strictEqual(await L.zeile(), 'Würfel #17 · Überzeugen +6 · Silberzunge 1 → 10 · Guidance W4: 3 · 10 + 6 + 3 = 19 · gelungen');
  ok('Mindestwurf');

  L = await lauf(mit(P, { modus: 'vorteil', grund: 'gute Vorbereitung', zusatz: [G], held: true }), [3, 14, 2, 16]);
  await L.klick('W20 würfeln'); await L.klick('Guidance'); await L.klick('Heldenmut');
  assert.strictEqual(await L.zeile(), 'Würfel #17 · Überzeugen +5 · Vorteil (3, 14) · Heldenmut 3 → 16 · Guidance W4: 2 · 16 + 5 + 2 = 23 · gut gelungen');
  L = await lauf(mit(P, { modus: 'nachteil', zusatz: [G] }), [20, 6, 2]);
  await L.klick('W20 würfeln');
  assert.deepStrictEqual(await L.knoepfe(), ['Guidance W4 ↗', 'Behalten ↗'], 'die 20 zählt bei Nachteil nicht');
  await L.klick('Guidance');
  assert.strictEqual(await L.zeile(), 'Würfel #17 · Überzeugen +5 · Nachteil (20, 6) · Guidance W4: 2 · 6 + 5 + 2 = 13 · knapp daneben');
  ok('Vorteil und Nachteil');

  L = await lauf({ art: 'rettung', nr: 4, name: 'Weisheit', bonus: 2, sg: 16, zusatz: [{ name: 'Resistance', wuerfel: [[1, 4]] }] }, [11, 3]);
  await L.klick('W20 würfeln'); await L.klick('Resistance');
  assert.strictEqual(await L.zeile(), 'Würfel #4 · Weisheit +2 · Resistance W4: 3 · 11 + 2 + 3 = 16 · gelungen');
  L = await lauf({ art: 'probe', nr: 2, name: 'Initiative', bonus: 3, zusatz: [G] }, [10, 2]);
  await L.klick('W20 würfeln'); await L.klick('Guidance');
  assert.strictEqual(await L.zeile(), 'Würfel #2 · Initiative +3 · Guidance W4: 2 · 10 + 3 + 2 = 15');
  L = await lauf({ art: 'probe', nr: 3, name: 'Roh', bonus: 0, zusatz: [G] }, [10, 2]);
  await L.klick('W20 würfeln');
  assert.deepStrictEqual(await L.knoepfe(), ['Guidance W4 ↗', 'Behalten ↗']);
  await L.klick('Guidance');
  assert.strictEqual(await L.zeile(), 'Würfel #3 · Roh +0 · Guidance W4: 2 · 10 + 2 = 12');
  L = await lauf(mit(P, { zusatz: [{ name: 'Zwei', wuerfel: [[2, 4]] }, { name: 'Fluch', wuerfel: [[2, 4]], minus: true }] }), [14, 1, 2, 3, 1]);
  await L.klick('W20 würfeln'); await L.klick('Zwei');
  assert.strictEqual(await L.zeile(), 'Würfel #17 · Überzeugen +5 · Fluch 2W4: −(1 + 2) = −3 · Zwei 2W4: 3 + 1 = 4 · 14 + 5 − 3 + 4 = 20 · gelungen');
  L = await lauf({ art: 'tod', nr: 9, name: 'Todesrettungswurf', tod: [0, 0], zusatz: [G] }, [12]);
  assert.deepStrictEqual(await L.knoepfe(), ['W20 würfeln ↗'], 'der Todesrettungswurf kennt keinen Zusatz');
  await L.klick('W20 würfeln');
  assert.strictEqual(await L.zeile(), 'Würfel #9 · Todesrettungswurf · 12 · Erfolg · Erfolge 1 · Fehlschläge 0');
  ok('Rettungswurf, Probe ohne SG, ohne Bonus, mehrere Würfel, Todesrettung');

  // Angriff
  var A = { art: 'angriff', nr: 5, name: 'Langschwert', bonus: 4, rk: 16, schaden: [[1, 8]], mod: 2, typ: 'Hieb' };
  L = await lauf(mit(A, { zusatz: [{ name: 'Bless', wuerfel: [[1, 4]] }] }), [10, 3, 6]);
  await L.klick('Angriff würfeln');
  assert.ok(/10 \+ 4 = 14/.test(await L.zwischen()));
  assert.strictEqual(await L.page.locator('#wk .wkPool .wkD').count(), 0);
  await L.klick('Bless');
  await L.page.waitForTimeout(800);
  assert.strictEqual(await L.page.locator('#wk .wkZ .wkD').count(), 1, 'der W4 hat seinen eigenen Platz');
  assert.strictEqual(await L.page.locator('#wk .wkPool .wkD').count(), 1, 'die Schadenswürfel bleiben, wo sie waren');
  assert.strictEqual(await L.zeile(), 'Würfel #5 · Angriff · Langschwert +4 · Bless W4: 3 · 10 + 4 + 3 = 17 · Treffer · Schaden 1W8+2 · 6 + 2 = 8 Hieb');
  ok('Angriff: der Zusatz zählt für den Treffer, nicht für den Schaden');

  L = await lauf(mit(A, { zusatz: [{ name: 'Bless', wuerfel: [[1, 4]] }] }), [10, 1]);
  await L.klick('Angriff würfeln'); await L.klick('Bless');
  assert.strictEqual(await L.zeile(), 'Würfel #5 · Angriff · Langschwert +4 · Bless W4: 1 · 10 + 4 + 1 = 15 · daneben');
  L = await lauf(mit(A, { zusatz: [{ name: 'Bless', wuerfel: [[1, 4]] }] }), [20, 3, 5]);
  await L.klick('Angriff würfeln');
  await L.page.waitForTimeout(800);
  assert.strictEqual(await L.zeile(), 'Würfel #5 · Angriff · Langschwert +4 · 20 + 4 = 24 · kritischer Treffer · natürliche 20 · Schaden 2W8+2 · 3 + 5 + 2 = 10 Hieb');
  L = await lauf(mit(A, { zusatz: [{ name: 'Bless', wuerfel: [[1, 4]] }] }), [1]);
  await L.klick('Angriff würfeln');
  assert.strictEqual(await L.zeile(), 'Würfel #5 · Angriff · Langschwert +4 · 1 + 4 = 5 · daneben · natürliche 1');
  ok('Angriff: daneben, natürliche 20 und 1');

  L = await lauf(mit(A, { held: true, zusatz: [{ name: 'Bless', wuerfel: [[1, 4]] }] }), [14, 2, 3, 6]);
  await L.klick('Angriff würfeln');
  assert.deepStrictEqual(await L.knoepfe(), ['Bless W4', 'Behalten ↗', 'Heldenmut']);
  await L.klick('Bless'); await L.klick('Behalten');
  await L.page.waitForTimeout(800);
  assert.deepStrictEqual(await L.knoepfe(), ['Behalten ↗', 'Heldenmut ↗'], 'Heldenmut geht weiter auf den Schaden');
  await L.klick('Heldenmut');
  assert.strictEqual(await L.zeile(), 'Würfel #5 · Angriff · Langschwert +4 · Bless W4: 2 · 14 + 4 + 2 = 20 · Treffer · Schaden 1W8+2 · Heldenmut 3 → 6 · 6 + 2 = 8 Hieb');
  L = await lauf(mit(A, { held: true, zusatz: [{ name: 'Bless', wuerfel: [[1, 4]] }] }), [1, 13, 3, 6]);
  await L.klick('Angriff würfeln');
  assert.deepStrictEqual(await L.knoepfe(), ['Behalten ↗', 'Heldenmut ↗']);
  await L.klick('Heldenmut');
  assert.deepStrictEqual(await L.knoepfe(), ['Bless W4 ↗', 'Behalten ↗']);
  await L.klick('Bless');
  await L.page.waitForTimeout(800);
  assert.strictEqual(await L.zeile(), 'Würfel #5 · Angriff · Langschwert +4 · Heldenmut 1 → 13 · Bless W4: 3 · 13 + 4 + 3 = 20 · Treffer · Schaden 1W8+2 · 6 + 2 = 8 Hieb');
  L = await lauf(mit(A, { zusatz: [B] }), [13, 2]);
  assert.deepStrictEqual(await L.knoepfe(), ['Angriff würfeln ↗']);
  await L.klick('Angriff würfeln');
  assert.strictEqual(await L.zeile(), 'Würfel #5 · Angriff · Langschwert +4 · Bane W4: −2 · 13 + 4 − 2 = 15 · daneben');
  ok('Angriff: Heldenmut auf Angriff oder Schaden, Bane');

  // Ohne zusatz wie in 1.1
  L = await lauf(P, [14]);
  assert.deepStrictEqual(await L.knoepfe(), ['W20 würfeln ↗']);
  await L.klick('W20 würfeln');
  assert.strictEqual(await L.zeile(), 'Würfel #17 · Überzeugen +5 · 14 + 5 = 19 · gelungen');
  L = await lauf(mit(P, { held: true }), [1, 16]);
  await L.klick('W20 würfeln');
  assert.deepStrictEqual(await L.knoepfe(), ['Behalten ↗', 'Heldenmut ↗']);
  await L.klick('Heldenmut');
  assert.strictEqual(await L.zeile(), 'Würfel #17 · Überzeugen +5 · Heldenmut 1 → 16 · 16 + 5 = 21 · gelungen');
  L = await lauf(A, [14, 7]);
  assert.deepStrictEqual(await L.knoepfe(), ['Angriff würfeln ↗']);
  await L.klick('Angriff würfeln');
  await L.page.waitForTimeout(800);
  assert.strictEqual(await L.zeile(), 'Würfel #5 · Angriff · Langschwert +4 · 14 + 4 = 18 · Treffer · Schaden 1W8+2 · 7 + 2 = 9 Hieb');
  ok('ohne zusatz wie in 1.1');

  // Ohne ruhige Darstellung: die Animationen dürfen am Ablauf nichts ändern
  await ctx.close();
  ctx = await browser.newContext();
  var seiteEcht = await ctx.newPage();
  await seiteEcht.setContent('<!doctype html><meta charset="utf-8"><style>' + FARBEN + '</style><div id="wk"></div><script>window.gesendet=[];window.sendPrompt=function(m){gesendet.push(m)};var WK=' + JSON.stringify(mit(P, { zusatz: [G, V], held: true })) + '</scr' + 'ipt><script>' + code + '</scr' + 'ipt>');
  await seiteEcht.locator('#wk .wkA button').first().click();
  await seiteEcht.waitForSelector('#wk .wkA button', { timeout: 5000 });
  var geklickt = [];
  for (var runde = 0; runde < 6; runde++) {
    var ks = await seiteEcht.$$eval('#wk .wkA button', function (b) { return b.map(function (x) { return x.textContent.trim(); }); });
    if (!ks.length) break;
    geklickt.push(ks.join(' | '));
    await seiteEcht.locator('#wk .wkA button').first().click();
    await seiteEcht.waitForTimeout(1600);
  }
  await seiteEcht.waitForFunction(function () { return window.gesendet.length > 0; }, null, { timeout: 6000 });
  var zeileEcht = await seiteEcht.evaluate(function () { return window.gesendet[0]; });
  assert.ok(/^Würfel #17 · Überzeugen \+5 · /.test(zeileEcht), zeileEcht);
  ok('mit Animation läuft es durch: ' + zeileEcht);

  await browser.close();
  console.log(n + ' Gruppen bestanden.');
})().catch(function (e) { console.error(e); if (browser) browser.close(); process.exit(1); });
