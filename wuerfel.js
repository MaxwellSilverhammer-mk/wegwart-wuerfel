/*
 * Wegwart-Würfel – Würfelkästen für die geteilte Welt „Hold der Seeprinzen“
 * Version 1.1
 *
 * Aufruf in einem Visualizer-Widget:
 *   <div id="wk">Würfelkasten lädt …</div>
 *   <script>WK={art:'probe',nr:1,name:'Überzeugen',bonus:4,sg:15}</script>
 *   <script src="https://cdn.jsdelivr.net/gh/<konto>/wegwart-wuerfel@<stand>/wuerfel.js"></script>
 *
 * Arten: probe · rettung · tod · angriff · schaden · heilung · inspiration · trefferwuerfel · wurf
 * wurf (seit 1.1): ein Wurf, der nur zählt (Sleep, Stunden, Mengen), ohne Schadensanzeige;
 *   `einheit` sagt, was die Zahl zählt (etwa 'Trefferpunkte').
 * Zufall: crypto.getRandomValues mit Verwerfen, also exakt gleichverteilt.
 * Das Ergebnis geht per sendPrompt als Nachricht an die Spielleitung.
 */
(function () {
  'use strict';

  var ruhig = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var warte = function (ms) { return ruhig ? 0 : ms; };
  var vz = function (n) { return (n < 0 ? '−' : '+') + Math.abs(n); };
  var pm = function (n) { return n ? ' ' + (n < 0 ? '−' : '+') + ' ' + Math.abs(n) : ''; };

  function wurf(w) {
    var a = new Uint32Array(1), l = Math.floor(4294967296 / w) * w, x;
    do { crypto.getRandomValues(a); x = a[0]; } while (x >= l);
    return x % w + 1;
  }
  function anim(el, k) { el.classList.remove(k); void el.getBoundingClientRect(); el.classList.add(k); }
  function $(r, sel) { return r.querySelector(sel); }

  /* ---------- Stil ---------- */
  var CSS = [
    '.wk{background:var(--surface-2);border:0.5px solid var(--border);border-radius:12px;padding:1rem 1.25rem;display:flex;flex-direction:column;gap:12px}',
    '.wk p{margin:0}',
    '.wkTop{display:flex;align-items:center;gap:14px}',
    '.wkDice{display:flex;gap:6px;flex-shrink:0}',
    '.wkPool{display:flex;flex-wrap:wrap;gap:10px}',
    '.wkT{font-size:16px;font-weight:500}',
    '.wkS{font-size:13px;color:var(--text-secondary)}',
    '.wkBs{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}',
    '.wkL{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:8px;font-size:12px;color:var(--text-secondary)}',
    '.wkA{display:flex;flex-wrap:wrap;gap:8px}',
    '.wkR:empty,.wkA:empty,.wkPool:empty,.wkL:empty{display:none}',
    '.wkD{display:flex;flex-direction:column;align-items:center;gap:2px}',
    '.wkD svg{display:block;overflow:visible}',
    '.wkC{font-size:11px;line-height:14px;height:14px;white-space:nowrap}',
    '.wkB{display:inline-flex;align-items:center;gap:4px;font-size:12px;padding:2px 8px;border-radius:var(--radius)}',
    '.wkStrip{position:relative;display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:var(--radius);background:var(--surface-1);animation:wkIn .35s ease-out,wkFlash var(--wkT,1.8s) ease-in forwards}',
    '.wkRoll{animation:wkRoll 1.1s cubic-bezier(.15,.6,.3,1)}',
    '.wkLand{animation:wkLand .35s ease-out}',
    '.wkShake{animation:wkShake .5s ease-in-out}',
    '.wkRing{animation:wkRing .9s ease-out}',
    '.wkSink{animation:wkSink .9s ease-in}',
    '.wkPop{animation:wkPop .5s ease-out}',
    '.wkIn{animation:wkIn .35s ease-out}',
    '.fxShakeK{animation:fxShake .45s ease-in-out}',
    '.fxKnockK{animation:fxKnock .4s ease-out}',
    '.fxSquashK{animation:fxSquash .45s ease-out}',
    '.fxWob{display:inline-block;animation:fxWobble .6s ease-in-out}',
    '@keyframes wkRoll{0%{transform:rotate(0) scale(.85)}25%{transform:rotate(-220deg) scale(1.1)}55%{transform:rotate(-320deg) scale(.95)}80%{transform:rotate(-352deg) scale(1.02)}100%{transform:rotate(-360deg) scale(1)}}',
    '@keyframes wkLand{0%{transform:scale(1.2)}60%{transform:scale(.95)}100%{transform:scale(1)}}',
    '@keyframes wkShake{0%,100%{transform:none}20%{transform:translateX(-5px) rotate(-8deg)}40%{transform:translateX(5px) rotate(6deg)}60%{transform:translateX(-3px) rotate(-3deg)}80%{transform:translateX(2px)}}',
    '@keyframes wkRing{0%{opacity:1;transform:scale(.6)}100%{opacity:0;transform:scale(1.45)}}',
    '@keyframes wkSink{0%{opacity:0;transform:scale(1.5)}30%{opacity:1}100%{opacity:0;transform:scale(.55)}}',
    '@keyframes wkPop{0%{opacity:0;transform:scale(.3)}60%{opacity:1;transform:scale(1.3)}100%{transform:scale(1)}}',
    '@keyframes wkIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}',
    '@keyframes wkFlash{0%,35%{background:var(--wkS)}100%{background:var(--surface-1)}}',
    '@keyframes fxRise{from{transform:translateY(0) scale(.6);opacity:0}15%{opacity:1}to{transform:translateY(-46px) scale(1.15);opacity:0}}',
    '@keyframes fxFall{from{transform:translateY(-14px) rotate(0);opacity:0}20%{opacity:1}to{transform:translateY(46px) rotate(160deg);opacity:0}}',
    '@keyframes fxDrip{from{transform:translateY(-10px) scaleY(.8);opacity:0}20%{opacity:1}to{transform:translateY(48px) scaleY(1.6);opacity:0}}',
    '@keyframes fxBubble{0%{transform:translate(0,0) scale(.4);opacity:0}20%{opacity:1}50%{transform:translate(5px,-22px) scale(.9)}100%{transform:translate(-4px,-46px) scale(1.2);opacity:0}}',
    '@keyframes fxWisp{0%{transform:translateY(0) scale(.6,.6) rotate(0);opacity:0}25%{opacity:.75}100%{transform:translateY(-42px) scale(1.7,.8) rotate(25deg);opacity:0}}',
    '@keyframes fxRing{from{transform:translate(-50%,-50%) scale(.3);opacity:1}to{transform:translate(-50%,-50%) scale(var(--s,5));opacity:0}}',
    '@keyframes fxRay{from{transform:translateY(-50%) rotate(var(--r)) scaleX(0);opacity:1}to{transform:translateY(-50%) rotate(var(--r)) scaleX(1.4);opacity:0}}',
    '@keyframes fxSlash{from{transform:rotate(var(--r)) scaleX(0);opacity:1}60%{transform:rotate(var(--r)) scaleX(1);opacity:1}to{transform:rotate(var(--r)) scaleX(1);opacity:0}}',
    '@keyframes fxThrust{from{transform:translateX(-100%);opacity:1}60%{transform:translateX(40%);opacity:1}to{transform:translateX(40%);opacity:0}}',
    '@keyframes fxBolt{0%{stroke-dashoffset:300;opacity:1}30%{stroke-dashoffset:0;opacity:1}45%{opacity:.1}55%{opacity:1}75%{opacity:1}100%{stroke-dashoffset:0;opacity:0}}',
    '@keyframes fxDust{from{transform:translate(0,0) scale(.4);opacity:.8}to{transform:translate(var(--dx),-12px) scale(1.5);opacity:0}}',
    '@keyframes fxShake{0%,100%{transform:none}20%{transform:translateX(-4px)}40%{transform:translateX(4px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}',
    '@keyframes fxKnock{0%,100%{transform:none}30%{transform:translateX(9px)}}',
    '@keyframes fxSquash{0%,100%{transform:none}30%{transform:scaleY(.88)}60%{transform:scaleY(1.04)}}',
    '@keyframes fxWobble{0%,100%{transform:none}25%{transform:skewX(-10deg)}50%{transform:skewX(7deg)}75%{transform:skewX(-3deg)}}',
    '@media (prefers-reduced-motion:reduce){.wkStrip,.wkRoll,.wkLand,.wkShake,.wkRing,.wkSink,.wkPop,.wkIn,.fxShakeK,.fxKnockK,.fxSquashK,.fxWob{animation:none}}'
  ].join('\n');

  function stil() {
    if (document.getElementById('wk-stil')) return;
    var s = document.createElement('style'); s.id = 'wk-stil'; s.textContent = CSS; document.head.appendChild(s);
  }

  /* ---------- Würfelformen ---------- */
  var FORM = {
    4: ['<polygon points="50,5 96,91 4,91"/>', '', '', 66],
    6: ['<rect x="9" y="9" width="82" height="82" rx="14"/>', '', '', 52],
    8: ['<polygon points="50,3 96,50 50,97 4,50"/>', '', '', 52],
    10: ['<polygon points="50,3 94,44 50,97 6,44"/>', 'M6 44L50 64L94 44M50 64L50 97', '', 40],
    12: ['<polygon points="50,5 94.7,37.5 77.6,90 22.4,90 5.3,37.5"/>', 'M50 5L50 25M94.7 37.5L74.7 44M77.6 90L65.3 73M22.4 90L34.7 73M5.3 37.5L25.3 44', '<polygon points="50,25 74.7,44 65.3,73 34.7,73 25.3,44"/>', 52],
    20: ['<polygon points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5"/>', 'M50 17L9 26.5M50 17L50 3M50 17L91 26.5M79.5 68L91 26.5M79.5 68L91 73.5M79.5 68L50 97M20.5 68L50 97M20.5 68L9 73.5M20.5 68L9 26.5', '<polygon points="50,17 79.5,68 20.5,68"/>', 53]
  };

  function wuerfelEl(w, i, ziel, farbe, flaeche, gross, fs) {
    var f = FORM[w] || FORM[6], el = document.createElement('div');
    el.className = 'wkD'; el.style.color = farbe; el.style.setProperty('--wkF', flaeche);
    el.innerHTML = '<svg viewBox="0 0 100 100" width="' + gross + '" height="' + gross + '" aria-hidden="true">' +
      '<circle cx="50" cy="50" r="47" style="fill:none;stroke:var(--text-warning);stroke-width:4;opacity:0;transform-origin:center;transform-box:fill-box"/>' +
      '<g style="fill:var(--wkF);stroke:currentColor;stroke-width:3.2;stroke-linejoin:round">' + f[0] + '</g>' +
      (f[1] ? '<path d="' + f[1] + '" style="fill:none;stroke:currentColor;stroke-width:1.6;opacity:.4"/>' : '') +
      (f[2] ? '<g style="fill:var(--wkF);stroke:currentColor;stroke-width:2.3;stroke-linejoin:round">' + f[2] + '</g>' : '') +
      '<text x="50" y="' + f[3] + '" text-anchor="middle" dominant-baseline="central" style="font-size:' + fs + 'px;font-weight:500;fill:currentColor">?</text></svg>' +
      '<span class="wkC"></span>';
    ziel.appendChild(el);
    var s = el.querySelector('svg');
    return { i: i, w: w, el: el, s: s, t: s.querySelector('text'), r: s.querySelector('circle'), c: el.querySelector('.wkC') };
  }

  /* Würfel rollen nacheinander aus und landen mit einem Federn. */
  function wirbel(ds, werte, fertig) {
    if (ruhig) { ds.forEach(function (d) { d.t.textContent = werte[d.i]; }); return fertig(); }
    var offen = ds.length;
    ds.forEach(function (d, k) {
      setTimeout(function () { anim(d.s, 'wkRoll'); }, k * 110);
      var z = Array(k * 2).fill(55).concat([40, 40, 45, 50, 60, 70, 85, 105, 130, 160, 200]), n = 0;
      (function schritt() {
        d.t.textContent = wurf(d.w);
        if (n < z.length) setTimeout(schritt, z[n++]);
        else { d.t.textContent = werte[d.i]; d.s.classList.remove('wkRoll'); anim(d.s, 'wkLand'); if (--offen === 0) fertig(); }
      })();
    });
  }

  /* ---------- Schadensarten ---------- */
  var FX = {
    'feuer': ['#D85A30', '#EF9F27', 'ti-flame', 'flammen'],
    'kälte': ['#378ADD', '#85B7EB', 'ti-snowflake', 'flocken'],
    'blitz': ['#BA7517', '#EF9F27', 'ti-bolt', 'blitz'],
    'schall': ['#888780', '#378ADD', 'ti-volume', 'schall'],
    'säure': ['#639922', '#97C459', 'ti-droplet', 'tropfen'],
    'gift': ['#1D9E75', '#639922', 'ti-flask', 'blasen'],
    'nekrotisch': ['#888780', '#7F77DD', 'ti-ghost', 'schwaden'],
    'gleißend': ['#EF9F27', '#BA7517', 'ti-sun', 'strahlen'],
    'psychisch': ['#7F77DD', '#D4537E', 'ti-brain', 'wellen'],
    'energie': ['#7F77DD', '#378ADD', 'ti-atom', 'stoss'],
    'hieb': ['#E24B4A', '#A32D2D', 'ti-sword', 'schnitt'],
    'stich': ['#E24B4A', '#A32D2D', 'ti-arrow-narrow-right', 'stich'],
    'wucht': ['#888780', '#D85A30', 'ti-hammer', 'aufprall']
  };
  function fxArt(typ) { return FX[(typ || '').toLowerCase()] || null; }
  function schadenFarben(typ) {
    var f = fxArt(typ);
    return f ? { fg: f[0], fl: 'color-mix(in srgb, ' + f[0] + ' 14%, var(--surface-2))', flash: 'color-mix(in srgb, ' + f[0] + ' 24%, var(--surface-1))', ic: f[2] }
      : { fg: 'var(--text-danger)', fl: 'var(--bg-danger)', flash: 'var(--bg-danger)', ic: 'ti-swords' };
  }

  function effekt(typ, strip, huelle) {
    var f = fxArt(typ); if (!f || ruhig) return;
    var h1 = f[0], h2 = f[1], art = f[3], o = document.createElement('div');
    o.style.cssText = 'position:absolute;inset:0;pointer-events:none'; strip.appendChild(o);
    var zz = function (a, b) { return a + Math.random() * (b - a); };
    var T = function (css, html) { var p = document.createElement('div'); p.style.cssText = 'position:absolute;' + css; p.innerHTML = html || ''; o.appendChild(p); };
    var F = function (k) { return k % 2 ? h2 : h1; };
    var k;
    if (art === 'flammen') for (k = 0; k < 14; k++) T('left:' + zz(4, 94) + '%;bottom:2px;width:10px;height:14px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:' + F(k) + ';animation:fxRise ' + zz(.7, 1.2) + 's ease-out ' + zz(0, .45) + 's both');
    if (art === 'flocken') for (k = 0; k < 10; k++) T('left:' + zz(4, 94) + '%;top:0;color:' + F(k) + ';font-size:' + zz(11, 17) + 'px;animation:fxFall ' + zz(1.1, 1.7) + 's linear ' + zz(0, .5) + 's both', '<i class="ti ti-snowflake" aria-hidden="true"></i>');
    if (art === 'blitz') T('inset:0', '<svg viewBox="0 0 100 40" preserveAspectRatio="none" width="100%" height="100%" style="overflow:visible"><polyline points="0,6 20,24 34,8 52,30 66,10 82,28 100,12" fill="none" stroke="' + h1 + '" stroke-width="3" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-dasharray="300" style="animation:fxBolt .9s ease-out both"/><polyline points="0,30 18,14 36,32 50,12 70,30 88,10 100,26" fill="none" stroke="' + h2 + '" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-dasharray="300" style="animation:fxBolt .9s ease-out .25s both"/></svg>');
    if (art === 'schall') { for (k = 0; k < 3; k++) T('left:26px;top:50%;width:30px;height:30px;border:2px solid ' + F(k) + ';border-radius:50%;--s:6;animation:fxRing .9s ease-out ' + (k * .15) + 's both'); anim(huelle, 'fxShakeK'); }
    if (art === 'tropfen') for (k = 0; k < 9; k++) T('left:' + zz(4, 94) + '%;top:-4px;width:7px;height:10px;border-radius:50% 50% 50% 50%/40% 40% 60% 60%;background:' + F(k) + ';animation:fxDrip ' + zz(.8, 1.3) + 's ease-in ' + zz(0, .5) + 's both');
    if (art === 'blasen') for (k = 0; k < 12; k++) { var s = zz(6, 13); T('left:' + zz(4, 94) + '%;bottom:2px;width:' + s + 'px;height:' + s + 'px;border:1.5px solid ' + F(k) + ';border-radius:50%;animation:fxBubble ' + zz(1, 1.5) + 's ease-out ' + zz(0, .5) + 's both'); }
    if (art === 'schwaden') for (k = 0; k < 7; k++) T('left:' + zz(0, 85) + '%;bottom:4px;width:30px;height:11px;border-radius:50%;background:' + F(k) + ';animation:fxWisp ' + zz(1.2, 1.6) + 's ease-out ' + zz(0, .4) + 's both');
    if (art === 'strahlen') for (k = 0; k < 12; k++) T('left:26px;top:50%;width:46px;height:2px;background:' + F(k) + ';transform-origin:0 50%;--r:' + (k * 30) + 'deg;animation:fxRay .9s ease-out ' + (k % 2 * .1) + 's both');
    if (art === 'wellen') { for (k = 0; k < 4; k++) T('left:26px;top:50%;width:34px;height:22px;border:2px solid ' + F(k) + ';border-radius:50%;--s:7;animation:fxRing 1.4s ease-out ' + (k * .22) + 's both'); var zahl = strip.querySelector('[data-zahl]'); if (zahl) anim(zahl, 'fxWob'); }
    if (art === 'stoss') { T('left:26px;top:50%;width:30px;height:30px;border:4px solid ' + h1 + ';border-radius:50%;--s:8;animation:fxRing .55s ease-out both'); anim(huelle, 'fxKnockK'); }
    if (art === 'schnitt') for (k = 0; k < 2; k++) T('left:-2%;top:' + (k ? 18 : 82) + '%;width:104%;height:3px;background:' + F(k) + ';transform-origin:0 50%;--r:' + (k ? 7 : -7) + 'deg;animation:fxSlash .45s ease-out ' + (k * .18) + 's both');
    if (art === 'stich') { T('left:0;top:50%;width:60%;height:2px;background:' + h1 + ';animation:fxThrust .5s ease-out both'); T('left:75%;top:50%;width:14px;height:14px;border:2px solid ' + h2 + ';border-radius:50%;--s:3;animation:fxRing .5s ease-out .3s both'); }
    if (art === 'aufprall') { anim(huelle, 'fxSquashK'); for (k = 0; k < 8; k++) T('left:' + (k < 4 ? zz(5, 25) : zz(75, 95)) + '%;bottom:0;width:12px;height:12px;border-radius:50%;background:' + F(k) + ';--dx:' + (k < 4 ? -zz(10, 26) : zz(10, 26)) + 'px;animation:fxDust .7s ease-out ' + zz(0, .15) + 's both'); }
    setTimeout(function () { o.remove(); }, 2400);
  }

  /* ---------- Bausteine ---------- */
  function geruest(R, pool) {
    R.className = 'wk'; R.innerHTML = '';
    var kopf = '<div><p class="wkT"></p><p class="wkS"></p><div class="wkBs"></div><div class="wkL"></div></div>';
    R.innerHTML = pool
      ? kopf + '<div class="wkPool"></div><div class="wkR" aria-live="polite"></div><div class="wkA"></div>'
      : '<div class="wkTop"><div class="wkDice"></div>' + kopf.replace('<div>', '<div style="flex:1;min-width:0">') + '</div>' +
        '<div class="wkR" aria-live="polite"></div><div class="wkPool"></div><div class="wkR wkR2" aria-live="polite"></div><div class="wkA"></div>';
    return {
      wd: $(R, pool ? '.wkPool' : '.wkDice'), wt: $(R, '.wkT'), ws: $(R, '.wkS'), wb: $(R, '.wkBs'), wl: $(R, '.wkL'),
      wr: $(R, '.wkR'), wsd: pool ? null : $(R, '.wkPool'), wrs: pool ? null : $(R, '.wkR2'), wa: $(R, '.wkA')
    };
  }
  function marke(E, html, bg, c) { var s = document.createElement('span'); s.className = 'wkB'; s.style.background = bg; s.style.color = c; s.innerHTML = html; E.wb.appendChild(s); }
  function heldMarke(E, held) {
    marke(E, '<i class="ti ti-flame" aria-hidden="true"></i>Heldenmut' + (held ? '' : '<span class="sr-only"> nicht verfügbar</span>'),
      held ? 'var(--bg-warning)' : 'var(--surface-1)', held ? 'var(--text-warning)' : 'var(--text-muted)');
  }
  function modusMarke(E, C, fl, fg) {
    marke(E, '<i class="ti ti-chevrons-' + (C.modus === 'vorteil' ? 'up' : 'down') + '" aria-hidden="true"></i>' + (C.modus === 'vorteil' ? 'Vorteil' : 'Nachteil') + (C.grund ? ' · ' + C.grund : ''), fl, fg);
  }
  function knopf(E, html, f, st) { var b = document.createElement('button'); b.innerHTML = html; if (st) b.style.cssText = st; b.onclick = f; E.wa.appendChild(b); }
  var WURFSTIL = 'background:var(--bg-accent);color:var(--text-accent);border-color:var(--border-accent);font-weight:500;padding:8px 18px';
  var HSTIL = 'background:var(--bg-warning);color:var(--text-warning);border-color:var(--border-warning)';
  var HTXT = '<i class="ti ti-flame" aria-hidden="true" style="font-size:16px;vertical-align:-2px;margin-right:4px"></i>Heldenmut ↗';
  function ikon(ic) { return '<i class="ti ' + ic + '" aria-hidden="true" style="font-size:18px;vertical-align:-3px;margin-right:6px"></i>'; }

  function streifen(ziel, ic, farbe, flash, titel, rechts, lang) {
    ziel.innerHTML = '<div class="wkStrip" style="--wkS:' + flash + ';--wkT:' + (lang ? '2.6s' : '1.8s') + '"><i class="ti ' + ic + ' wkPop" aria-hidden="true" style="font-size:24px;color:' + farbe + '"></i>' +
      '<p style="flex:1;min-width:0;font-size:16px;font-weight:500">' + titel + '</p><span style="font-size:14px;color:var(--text-secondary);white-space:nowrap">' + rechts + '</span></div>';
    return ziel.firstElementChild;
  }
  function zaehle(strip, s) {
    var z = strip.querySelector('[data-zahl]'); if (!z) return;
    if (ruhig) { z.textContent = s; return; }
    var t0 = performance.now();
    (function tick(t) { var p = Math.min(1, (t - t0) / 600); z.textContent = Math.round(s * p); if (p < 1) requestAnimationFrame(tick); })(t0);
  }
  function zwischenzeile(ziel, links, summe, nach) {
    ziel.innerHTML = '<p class="wkIn" style="font-size:15px;color:var(--text-secondary)">' + links + '<span style="font-size:22px;font-weight:500;color:var(--text-primary)">' + summe + '</span>' + (nach || '') + '</p>';
  }
  function senden(E, teile) {
    var msg = teile.join(' · ');
    setTimeout(function () {
      if (typeof sendPrompt === 'function') sendPrompt(msg);
      else { var p = document.createElement('p'); p.style.cssText = 'font-size:13px;color:var(--text-secondary)'; p.textContent = 'Nicht gesendet. Schreib es ab: ' + msg; E.wa.appendChild(p); }
    }, ruhig ? 300 : 1400);
  }

  /* ---------- W20: Probe, Rettungswurf, Todesrettungswurf ---------- */
  var GRADE = [[10, 'Glänzend gelungen', 'ti-sparkles', 'success'], [5, 'Gut gelungen', 'ti-circle-check', 'success'], [0, 'Gelungen', 'ti-check', 'success'], [-4, 'Knapp daneben', 'ti-arrow-fork', 'warning'], [-999, 'Misslungen', 'ti-x', 'danger']];
  var RETTUNG = [[0, 'Gelungen', 'ti-check', 'success'], [-999, 'Misslungen', 'ti-x', 'danger']];

  function w20(C, R) {
    var E = geruest(R, false), zwei = C.modus === 'vorteil' || C.modus === 'nachteil';
    var ton = C.modus === 'vorteil' ? 'success' : C.modus === 'nachteil' ? 'danger' : '';
    var fg = ton ? 'var(--text-' + ton + ')' : 'var(--text-primary)', fl = ton ? 'var(--bg-' + ton + ')' : 'var(--surface-1)';
    var bonus = C.bonus || 0, tod = C.art === 'tod', held = !!C.held;
    var eff = function (v) { return C.min ? Math.max(v, C.min) : v; };
    var rech = function (v) { return bonus ? v + pm(bonus) + ' = ' + (v + bonus) : '' + v; };
    var titel = C.name + (tod && !bonus ? '' : ' ' + vz(bonus));
    var D = [0, 1].slice(0, zwei ? 2 : 1).map(function (i) { return wuerfelEl(20, i, E.wd, fg, fl, zwei ? 60 : 76, 27); });
    E.wt.textContent = titel; E.ws.textContent = C.anlass || '';
    if (zwei) modusMarke(E, C, fl, fg);
    if (C.min) marke(E, C.minName || 'Mindestens ' + C.min, 'var(--surface-1)', 'var(--text-secondary)');
    heldMarke(E, held);
    function liste(e, f, ne, nf) {
      var p = function (n, neu, ic, c) { return [0, 1, 2].map(function (k) { return k < n ? '<i class="ti ' + ic + (k >= n - neu ? ' wkPop' : '') + '" aria-hidden="true" style="font-size:16px;color:var(--text-' + c + ')"></i>' : '<i class="ti ti-circle" aria-hidden="true" style="font-size:16px;color:var(--text-muted)"></i>'; }).join(''); };
      E.wl.innerHTML = '<span style="display:inline-flex;align-items:center;gap:3px">Erfolge ' + p(e, ne, 'ti-circle-check', 'success') + '</span><span style="display:inline-flex;align-items:center;gap:3px">Fehlschläge ' + p(f, nf, 'ti-circle-x', 'danger') + '</span><span class="sr-only">' + e + ' Erfolge, ' + f + ' Fehlschläge</span>';
    }
    if (tod) liste(C.tod[0], C.tod[1], 0, 0);
    var roh = [], erst = [], hm = null, lauf = false;
    function lo() { if (!zwei) return 0; var e = roh.map(eff); return e[0] < e[1] || (e[0] === e[1] && roh[0] <= roh[1]) ? 0 : 1; }
    function wahl() { return !zwei ? 0 : C.modus === 'vorteil' ? 1 - lo() : lo(); }
    function zeigen(neu) {
      var i = wahl();
      D.forEach(function (d, j) {
        var v = roh[j], e = eff(v), z = j === i, n = z && e === v && (v === 20 || v === 1) ? v : 0;
        d.t.textContent = z ? e : v; d.el.style.color = z ? fg : 'var(--text-muted)'; d.el.style.setProperty('--wkF', z ? fl : 'var(--surface-1)');
        d.c.style.color = n === 20 ? 'var(--text-warning)' : n === 1 ? 'var(--text-danger)' : 'var(--text-secondary)';
        d.c.textContent = n ? 'nat. ' + n : z && e !== v ? v + ' → ' + e : '';
        if (neu.indexOf(j) >= 0 && !ruhig) { d.s.classList.remove('wkRoll', 'wkLand'); anim(d.s, n === 1 ? 'wkShake' : 'wkLand'); }
      });
      return i;
    }
    knopf(E, ikon('ti-dice-5') + 'W20 würfeln' + (held ? '' : ' ↗'), function () {
      if (lauf) return; lauf = true; E.wa.innerHTML = '';
      roh = D.map(function () { return wurf(20); }); erst = roh.slice();
      wirbel(D, roh, function () { var i = zeigen([0, 1]); setTimeout(function () { held ? zwischen(i) : ende(i); }, warte(400)); });
    }, WURFSTIL);
    function zwischen(i) {
      var v = eff(roh[i]);
      zwischenzeile(E.wr, bonus ? v + pm(bonus) + ' = ' : '', v + bonus);
      knopf(E, 'Behalten ↗', function () { E.wa.innerHTML = ''; ende(i); });
      knopf(E, HTXT, function () {
        E.wa.innerHTML = ''; var j = lo(); hm = [roh[j]]; roh[j] = wurf(20); hm.push(roh[j]);
        D[j].el.style.color = 'var(--text-warning)'; D[j].c.textContent = '';
        wirbel([D[j]], roh, function () {
          var k = zeigen([j]);
          if (!D[j].c.textContent) { D[j].c.style.color = 'var(--text-warning)'; D[j].c.innerHTML = '<i class="ti ti-flame" aria-hidden="true"></i> neu'; }
          setTimeout(function () { ende(k); }, warte(400));
        });
      }, HSTIL);
    }
    function stufe(v, nat) {
      if (tod) {
        var e = C.tod[0], f = C.tod[1];
        if (nat === 20) return [99, 'Wieder bei Bewusstsein', 'wieder bei Bewusstsein, 1 TP', 'ti-heart', 'success'];
        var ok = v + bonus >= 10, ne = ok ? 1 : 0, nf = ok ? 0 : nat === 1 ? 2 : 1;
        e = Math.min(3, e + ne); f = Math.min(3, f + nf);
        var t = e >= 3 ? ['Stabil', 'Erfolg, stabil', 'ti-shield-check'] : f >= 3 ? ['Dritter Fehlschlag', 'dritter Fehlschlag', 'ti-skull'] : ok ? ['Erfolg', 'Erfolg', 'ti-check'] : nat === 1 ? ['Zwei Fehlschläge', 'zwei Fehlschläge', 'ti-x'] : ['Fehlschlag', 'Fehlschlag', 'ti-x'];
        return [ok ? 0 : -1, t[0], t[1] + ' · Erfolge ' + e + ' · Fehlschläge ' + f, t[2], ok ? 'success' : 'danger', e, f, ne, nf];
      }
      if (C.sg == null) return null;
      var d = nat === 20 ? 99 : nat === 1 ? -99 : v + bonus - C.sg;
      var g = (C.art === 'rettung' ? RETTUNG : GRADE).filter(function (s) { return d >= s[0]; })[0];
      return [g[0], g[1], g[1].toLowerCase(), g[2], g[3]];
    }
    function ende(i) {
      var v = eff(roh[i]), nat = roh[i] === 20 ? 20 : roh[i] === 1 && v === 1 ? 1 : 0, st = stufe(v, nat);
      var gr0 = st ? st[0] : 0, fa = st ? st[4] : '';
      streifen(E.wr, st ? st[3] : 'ti-dice-5', fa ? 'var(--text-' + fa + ')' : 'var(--text-secondary)', fa ? 'var(--bg-' + fa + ')' : 'var(--surface-1)',
        (st ? st[1] : 'Gewürfelt') + (nat ? '<span class="sr-only">, natürliche ' + nat + '</span>' : ''), rech(v), gr0 >= 10);
      if (tod && nat !== 20) liste(st[5], st[6], st[7], st[8]);
      if (!ruhig) {
        if (nat === 20 || gr0 === 10) { D[i].r.style.stroke = 'var(--text-warning)'; anim(D[i].r, 'wkRing'); }
        else if (nat === 1) { D[i].r.style.stroke = 'var(--text-danger)'; anim(D[i].r, 'wkSink'); }
      }
      var m = ['Würfel #' + C.nr, titel];
      if (zwei) m.push((C.modus === 'vorteil' ? 'Vorteil' : 'Nachteil') + ' (' + erst.join(', ') + ')');
      if (hm) m.push('Heldenmut ' + hm[0] + ' → ' + hm[1]);
      if (v !== roh[i]) m.push((C.minName || 'Mindestwurf') + ' ' + roh[i] + ' → ' + v);
      m.push(rech(v)); if (st) m.push(st[2]); if (nat) m.push('natürliche ' + nat);
      senden(E, m);
    }
  }

  /* ---------- Angriff mit Schaden ---------- */
  function angriff(C, R) {
    var E = geruest(R, false), zwei = C.modus === 'vorteil' || C.modus === 'nachteil';
    var ton = C.modus === 'vorteil' ? 'success' : C.modus === 'nachteil' ? 'danger' : '';
    var fg = ton ? 'var(--text-' + ton + ')' : 'var(--text-primary)', fl = ton ? 'var(--bg-' + ton + ')' : 'var(--surface-1)';
    var bonus = C.bonus || 0, mod = C.mod || 0, held = !!C.held, SF = schadenFarben(C.typ);
    var rech = function (v) { return v + pm(bonus) + ' = ' + (v + bonus); };
    var sform = function (k) { return C.schaden.map(function (x) { return x[0] * k + 'W' + x[1]; }).join('+') + (mod ? (mod < 0 ? '−' : '+') + Math.abs(mod) : ''); };
    var D = [0, 1].slice(0, zwei ? 2 : 1).map(function (i) { return wuerfelEl(20, i, E.wd, fg, fl, zwei ? 60 : 76, 27); });
    E.wt.textContent = C.name + ' ' + vz(bonus); E.ws.textContent = C.anlass || '';
    marke(E, '<i class="ti ' + SF.ic + '" aria-hidden="true"></i>' + sform(1) + (C.typ ? ' ' + C.typ : ''), SF.fl, SF.fg);
    if (zwei) modusMarke(E, C, fl, fg);
    heldMarke(E, held);
    var roh = [], erst = [], hm = null, hmS = null, lauf = false, S = [], rs = [], krit = false, treffer = false, v0 = 0, nat = 0;
    function lo() { if (!zwei) return 0; return roh[0] <= roh[1] ? 0 : 1; }
    function wahl() { return !zwei ? 0 : C.modus === 'vorteil' ? 1 - lo() : lo(); }
    function zeigen() {
      var i = wahl();
      D.forEach(function (d, j) {
        var v = roh[j], z = j === i, n = z && (v === 20 || v === 1) ? v : 0;
        d.t.textContent = v; d.el.style.color = z ? fg : 'var(--text-muted)'; d.el.style.setProperty('--wkF', z ? fl : 'var(--surface-1)');
        d.c.style.color = n === 20 ? 'var(--text-warning)' : 'var(--text-danger)'; d.c.textContent = n ? 'nat. ' + n : '';
        if (n === 1 && !ruhig) { d.s.classList.remove('wkLand'); anim(d.s, 'wkShake'); }
      });
      return i;
    }
    knopf(E, ikon('ti-swords') + 'Angriff würfeln' + (held ? '' : ' ↗'), function () {
      if (lauf) return; lauf = true; E.wa.innerHTML = '';
      roh = D.map(function () { return wurf(20); }); erst = roh.slice();
      wirbel(D, roh, function () { var i = zeigen(); setTimeout(function () { held ? zwischen(i) : aufloesen(i); }, warte(400)); });
    }, WURFSTIL);
    function zwischen(i) {
      zwischenzeile(E.wr, roh[i] + pm(bonus) + ' = ', roh[i] + bonus);
      knopf(E, 'Behalten ↗', function () { E.wa.innerHTML = ''; aufloesen(i); });
      knopf(E, HTXT, function () {
        E.wa.innerHTML = ''; var j = lo(); hm = [roh[j]]; roh[j] = wurf(20); hm.push(roh[j]); D[j].el.style.color = 'var(--text-warning)';
        wirbel([D[j]], roh, function () {
          var k = zeigen();
          if (!D[j].c.textContent) { D[j].c.style.color = 'var(--text-warning)'; D[j].c.innerHTML = '<i class="ti ti-flame" aria-hidden="true"></i> neu'; }
          setTimeout(function () { aufloesen(k); }, warte(400));
        });
      }, HSTIL);
    }
    function aufloesen(i) {
      v0 = roh[i]; nat = v0 === 20 ? 20 : v0 === 1 ? 1 : 0; krit = nat === 20; treffer = krit || (nat !== 1 && v0 + bonus >= C.rk);
      streifen(E.wr, krit ? 'ti-sparkles' : treffer ? 'ti-target' : 'ti-x', treffer ? 'var(--text-success)' : 'var(--text-danger)', treffer ? 'var(--bg-success)' : 'var(--bg-danger)',
        (krit ? 'Kritischer Treffer' : treffer ? 'Treffer' : 'Daneben') + (nat ? '<span class="sr-only">, natürliche ' + nat + '</span>' : ''), rech(v0), krit);
      if (!ruhig) {
        if (krit) { D[i].r.style.stroke = 'var(--text-warning)'; anim(D[i].r, 'wkRing'); }
        else if (nat === 1) { D[i].r.style.stroke = 'var(--text-danger)'; anim(D[i].r, 'wkSink'); }
      }
      if (treffer) setTimeout(schaden, warte(700)); else fertig();
    }
    var ssum = function () { return rs.reduce(function (a, b) { return a + b; }, 0) + mod; };
    var steile = function () { return rs.join(' + ') + pm(mod); };
    function schaden() {
      var k = krit ? 2 : 1, ws = [];
      C.schaden.forEach(function (x) { for (var n = 0; n < x[0] * k; n++) ws.push(x[1]); });
      var gs = ws.length > 4 ? 42 : 48;
      S = ws.map(function (w, i) { return wuerfelEl(w, i, E.wsd, SF.fg, SF.fl, gs, 34); });
      rs = S.map(function (d) { return wurf(d.w); });
      wirbel(S, rs, function () { setTimeout(function () { held && !hm ? schadenWahl() : schadenEnde(); }, warte(300)); });
    }
    function schadenWahl() {
      zwischenzeile(E.wrs, steile() + ' = ', ssum(), ' Schaden');
      knopf(E, 'Behalten ↗', function () { E.wa.innerHTML = ''; schadenEnde(); });
      knopf(E, HTXT, function () {
        E.wa.innerHTML = '';
        var j = S.reduce(function (b, d) { return (d.w + 1) / 2 - rs[d.i] > (S[b].w + 1) / 2 - rs[b] ? d.i : b; }, 0);
        hmS = [rs[j]]; rs[j] = wurf(S[j].w); hmS.push(rs[j]); S[j].el.style.color = 'var(--text-warning)';
        wirbel([S[j]], rs, function () {
          S[j].el.style.color = SF.fg; S[j].c.style.color = 'var(--text-warning)'; S[j].c.innerHTML = '<i class="ti ti-flame" aria-hidden="true"></i> neu';
          setTimeout(schadenEnde, warte(300));
        });
      }, HSTIL);
    }
    function schadenEnde() {
      var s = ssum();
      if (!ruhig) S.forEach(function (d) { if (rs[d.i] === d.w) anim(d.r, 'wkRing'); });
      var st = streifen(E.wrs, SF.ic, SF.fg, SF.flash, '<span data-zahl style="font-size:24px">' + (ruhig ? s : 0) + '</span> Schaden' + (C.typ ? ' · ' + C.typ : ''), rs.length > 1 || mod ? steile() : sform(krit ? 2 : 1));
      zaehle(st, s); effekt(C.typ, st, E.wrs);
      fertig();
    }
    function fertig() {
      var m = ['Würfel #' + C.nr, 'Angriff', C.name + ' ' + vz(bonus)];
      if (zwei) m.push((C.modus === 'vorteil' ? 'Vorteil' : 'Nachteil') + ' (' + erst.join(', ') + ')');
      if (hm) m.push('Heldenmut ' + hm[0] + ' → ' + hm[1]);
      m.push(rech(v0), krit ? 'kritischer Treffer' : treffer ? 'Treffer' : 'daneben');
      if (nat) m.push('natürliche ' + nat);
      if (treffer) {
        m.push('Schaden ' + sform(krit ? 2 : 1));
        if (hmS) m.push('Heldenmut ' + hmS[0] + ' → ' + hmS[1]);
        m.push((rs.length > 1 || mod ? steile() + ' = ' : '') + ssum() + (C.typ ? ' ' + C.typ : ''));
      }
      senden(E, m);
    }
  }

  /* ---------- Würfelpool: Schaden, Heilung, Inspiration, Trefferwürfel, Wurf ---------- */
  /* je Art: Marke, Farbton, Zeichen, Wort hinter der Zahl */
  var POOLART = {
    schaden: ['Schaden', '', '', 'Schaden'],
    heilung: ['Heilung', 'success', 'ti-heart', 'TP geheilt'],
    inspiration: ['Inspiration', 'accent', 'ti-music', 'Inspiration'],
    trefferwuerfel: ['Trefferwürfel', 'success', 'ti-heart-plus', 'TP zurück'],
    wurf: ['Wurf', '', 'ti-dice-5', '']
  };
  function pool(C, R) {
    var E = geruest(R, true), A = POOLART[C.art] || POOLART.wurf, mod = C.mod || 0, held = !!C.held;
    var einheit = C.einheit == null ? '' : String(C.einheit), nach = C.einheit == null ? A[3] : einheit;
    var fg, fl, flash, ic;
    if (C.art === 'schaden') { var SF = schadenFarben(C.typ); fg = SF.fg; fl = SF.fl; flash = SF.flash; ic = SF.ic; }
    else { fg = A[1] ? 'var(--text-' + A[1] + ')' : 'var(--text-primary)'; fl = A[1] ? 'var(--bg-' + A[1] + ')' : 'var(--surface-1)'; flash = fl; ic = A[2]; }
    var seiten = []; C.wuerfel.forEach(function (x) { for (var n = 0; n < x[0]; n++) seiten.push(x[1]); });
    var formel = C.wuerfel.map(function (x) { return x[0] + 'W' + x[1]; }).join('+') + (mod ? (mod < 0 ? '−' : '+') + Math.abs(mod) : '');
    var D = seiten.map(function (w, i) { return wuerfelEl(w, i, E.wd, fg, fl, seiten.length > 4 ? 42 : 52, 34); });
    E.wt.textContent = C.name; E.ws.textContent = C.anlass || '';
    marke(E, '<i class="ti ' + ic + '" aria-hidden="true"></i>' + A[0] + (C.typ ? ' · ' + C.typ : einheit ? ' · ' + einheit : ''), fl, fg);
    marke(E, formel, 'var(--surface-1)', 'var(--text-secondary)');
    heldMarke(E, held);
    var roh = [], hm = null, lauf = false;
    var summe = function () { return roh.reduce(function (a, b) { return a + b; }, 0) + mod; };
    var teile = function () { return roh.join(' + ') + pm(mod); };
    knopf(E, ikon('ti-dice-5') + formel + ' würfeln' + (held ? '' : ' ↗'), function () {
      if (lauf) return; lauf = true; E.wa.innerHTML = '';
      roh = D.map(function (d) { return wurf(d.w); });
      wirbel(D, roh, function () { setTimeout(function () { held ? zwischen() : ende(); }, warte(300)); });
    }, WURFSTIL);
    function zwischen() {
      zwischenzeile(E.wr, teile() + ' = ', summe());
      knopf(E, 'Behalten ↗', function () { E.wa.innerHTML = ''; ende(); });
      knopf(E, HTXT, function () {
        E.wa.innerHTML = '';
        var j = D.reduce(function (b, d) { return (d.w + 1) / 2 - roh[d.i] > (D[b].w + 1) / 2 - roh[b] ? d.i : b; }, 0);
        hm = [roh[j]]; roh[j] = wurf(D[j].w); hm.push(roh[j]); D[j].el.style.color = 'var(--text-warning)';
        wirbel([D[j]], roh, function () {
          D[j].el.style.color = fg; D[j].c.style.color = 'var(--text-warning)'; D[j].c.innerHTML = '<i class="ti ti-flame" aria-hidden="true"></i> neu';
          setTimeout(ende, warte(300));
        });
      }, HSTIL);
    }
    function ende() {
      var s = summe();
      if (!ruhig) D.forEach(function (d) { if (roh[d.i] === d.w) anim(d.r, 'wkRing'); });
      var st = streifen(E.wr, ic, fg, flash, '<span data-zahl style="font-size:24px">' + (ruhig ? s : 0) + '</span>' + (nach ? ' ' + nach : '') + (C.art === 'schaden' && C.typ ? ' · ' + C.typ : ''), roh.length > 1 || mod ? teile() : formel);
      zaehle(st, s);
      if (C.art === 'schaden') effekt(C.typ, st, E.wr);
      var m = ['Würfel #' + C.nr, A[0], C.name, formel];
      if (hm) m.push('Heldenmut ' + hm[0] + ' → ' + hm[1]);
      m.push((roh.length > 1 || mod ? teile() + ' = ' : '') + s + (C.typ ? ' ' + C.typ : einheit ? ' ' + einheit : ''));
      senden(E, m);
    }
  }

  /* ---------- Start ---------- */
  function start(C, R) {
    stil();
    try {
      if (C.art === 'angriff') return angriff(C, R);
      if (POOLART[C.art]) return pool(C, R);
      if (C.art === 'probe' || C.art === 'rettung' || C.art === 'tod' || !C.art) return w20(C, R);
      R.textContent = 'Unbekannte Würfelart: ' + C.art;
    } catch (e) {
      R.textContent = 'Der Würfelkasten hat einen Fehler. Würfle bitte selbst und schreib das Ergebnis in den Chat.';
    }
  }
  window.Wuerfel = { start: start, version: '1.1' };
  (function warten(n) {
    var R = document.getElementById('wk');
    var C = typeof WK !== 'undefined' ? WK : window.WK;
    if (C && R) return start(C, R);
    if (n < 60) setTimeout(function () { warten(n + 1); }, 50);
  })(0);
})();
