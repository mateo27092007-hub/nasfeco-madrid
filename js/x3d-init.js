/* =========================================================
   NASFECO · 3D on the real pages: hero (home and product), "will it fit?",
   installation story and welcome kit. One presentation per model:
   X12 white with silver faucet, X16 black with black faucet.
   ========================================================= */
import { createViewer, DIM } from './x3d.js';

const ES = document.documentElement.lang.startsWith('es');
const T = (es, en) => ES ? es : en;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const FIX = window.NF_SEL = { x12: { body: 'white', faucet: 'silver' }, x16: { body: 'black', faucet: 'black' } };
const FAUCET_LABEL = innerWidth < 760 ? T('Grifo inteligente', 'Smart faucet') : T('Grifo inteligente (va sobre la encimera)', 'Smart faucet (sits on the worktop)');
const KG = 17.5;   // Waterdrop European product sheet

/* create a viewer only when its box is on screen (saves battery on phones) */
function lazyViewer(el, opts, onReady) {
  let v = null;
  const io = new IntersectionObserver(es => { if (es[0].isIntersecting && !v) { v = createViewer(el, opts); io.disconnect(); onReady && onReady(v); } }, { rootMargin: '200px' });
  io.observe(el);
  return () => v;
}

/* ---------- hero (home and product page): the system turns with the scroll ---------- */
const h3 = $('[data-h3]');
if (h3) {
  const box = $('[data-3d-hero]', h3), k0 = box.dataset.k;
  let viewer = null;
  lazyViewer(box, { model: k0, body: FIX[k0].body, faucet: FIX[k0].faucet, stage: true, faucetLabel: T('Grifo inteligente', 'Smart faucet') }, v => { viewer = v; if (v) { v.showDims(false); box.classList.add('ready'); onScroll(); } });
  const big = $('.h3-big', h3);
  const onScroll = () => {
    const r = h3.getBoundingClientRect(), total = Math.max(innerHeight * .8, h3.offsetHeight - innerHeight), p = Math.min(1, Math.max(0, -r.top / total));
    if (viewer) viewer.spin(-.6 + p * Math.PI * 1.1);
    if (big) big.style.translate = `0 ${p * -60}px`;
    h3.classList.toggle('lit', p > .02);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  $$('[data-h3m]', h3).forEach(b => b.addEventListener('click', () => {
    const m = b.dataset.h3m; $$('[data-h3m]', h3).forEach(x => x.classList.toggle('on', x === b));
    if (viewer) { viewer.setModel(m); viewer.setBody(FIX[m].body); viewer.setFaucet(FIX[m].faucet); }
    if (big) big.textContent = m.toUpperCase();
  }));
}

/* ---------- product page photos ---------- */
const ph = $('#pdp-photo');
$$('.pdp-th').forEach(t => t.addEventListener('click', () => { $$('.pdp-th').forEach(x => x.classList.toggle('on', x === t)); ph.src = t.dataset.photo; }));

/* ---------- "will it fit?": measuring viewer + cabinet calculator ---------- */
$$('[data-3d-measure]').forEach(view => {
  const sec = view.closest('section');
  // Spain: metric only. The geometry keeps DIM in inches; everything shown and typed is in centimetres.
  const st = { model: view.dataset.k, body: view.dataset.body, faucet: view.dataset.faucet, units: 'cm' };
  let viewer = null;
  const inputs = $$('[data-cab]', sec), out = $('[data-fit]', sec);
  const DEF = { w: 80, d: 55, h: 70 };   // example cabinet, the visitor types their own
  inputs.forEach(i => i.value = DEF[i.dataset.cab]);
  const toIn = x => x / 2.54;
  const dec = s => ES ? s.replace('.', ',') : s;
  const fmt = x => dec((x * 2.54).toFixed(1)) + ' cm';
  function specs() {
    $$('[data-dim]', sec).forEach(b => b.textContent = b.dataset.dim === 'kg' ? dec(KG.toFixed(1)) + ' kg' : fmt(DIM[b.dataset.dim]));
  }
  function check() {
    const c = {}; inputs.forEach(i => c[i.dataset.cab] = toIn(parseFloat(String(i.value).replace(',', '.')) || 0));
    // the same rule is applied without the 3D view, so the answer never depends on WebGL
    const fitsW = c.w >= DIM.w && c.d >= DIM.d, fitsR = c.w >= DIM.d && c.d >= DIM.w, ok = (fitsW || fitsR) && c.h >= DIM.h;
    const rot = !fitsW && fitsR;
    viewer && viewer.setCabinet(c);
    const spare = { w: c.w - (rot ? DIM.d : DIM.w), d: c.d - (rot ? DIM.w : DIM.d), h: c.h - DIM.h };
    out.className = 'fit-r ' + (ok ? 'ok' : 'no');
    out.innerHTML = ok
      ? `<b>${T('Sí entra', 'It fits')}${rot ? T(' (girado)', ' (turned)') : ''}.</b>${T('Te sobran', 'You have')} ${fmt(spare.w)} ${T('de ancho', 'of width')}, ${fmt(spare.d)} ${T('de fondo y', 'of depth and')} ${fmt(spare.h)} ${T('de alto', 'of height to spare')}. ${T('Dejamos espacio para las conexiones y lo confirmamos en tu valoración.', 'We leave room for the connections and confirm it in your assessment.')}`
      : `<b>${T('Va muy justo o no entra.', 'Too tight or it does not fit.')}</b>${T('El equipo necesita', 'The system needs')} ${fmt(DIM.w)} × ${fmt(DIM.d)} ${T('y', 'and')} ${fmt(DIM.h)} ${T('de alto', 'of height')}. ${T('Escríbenos: en la valoración vemos opciones para tu mueble.', 'Write to us: in the assessment we look at options for your cabinet.')}`;
  }
  lazyViewer(view, { model: st.model, body: st.body, faucet: st.faucet, units: st.units, faucetLabel: FAUCET_LABEL }, v => { viewer = v; if (v) { v.setUnits(st.units); check(); } else view.classList.add('no3d'); });
  $$('[data-ms]', sec).forEach(g => $$('button', g).forEach(b => b.addEventListener('click', () => {
    $$('button', g).forEach(x => x.classList.toggle('on', x === b)); const kind = g.dataset.ms, val = b.dataset.v;
    st[kind] = val; { if (viewer) { kind === 'model' ? viewer.setModel(val) : kind === 'body' ? viewer.setBody(val) : viewer.setFaucet(val); } }
    check();
  })));
  inputs.forEach(i => i.addEventListener('input', check));
  specs(); check();
});

/* ---------- how NASFECO installs: the 3D story follows the scroll ---------- */
$$('[data-install]').forEach(sec => {
  const el = $('[data-3d-install]', sec), steps = $$('.ins-steps li', sec), bar = $('.ins-bar i', sec);
  let api = null, n = steps.length;
  const prog = () => { const r = sec.getBoundingClientRect(), total = Math.max(1, sec.offsetHeight - innerHeight); return Math.min(1, Math.max(0, -r.top / total)); };
  const onScroll = () => {
    const p = prog(), cur = Math.min(n - 1, Math.floor(p * n * .999));
    steps.forEach((li, i) => { li.classList.toggle('on', i === cur); li.classList.toggle('done', i < cur); });
    bar.style.width = (p * 100).toFixed(1) + '%'; sec.classList.toggle('past', p > .03);
    api && api.set(p);
  };
  const io = new IntersectionObserver(async es => {
    if (!es[0].isIntersecting || api) return; io.disconnect();
    const { createInstall } = await import('./x3d-scenes.js');
    api = createInstall(el, { model: el.dataset.k, body: el.dataset.body, faucet: el.dataset.faucet }); onScroll();
  }, { rootMargin: '400px' });
  io.observe(sec);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
});

/* ---------- welcome kit: the box opens when it comes into view ---------- */
$$('[data-kit]').forEach(sec => {
  const el = $('[data-3d-kit]', sec); let api = null, played = false;
  const start = async () => {
    const { createKit } = await import('./x3d-scenes.js');
    api = await createKit(el, { markWhite: el.dataset.mw, markColor: el.dataset.mc, logoWhite: el.dataset.lw, logoColor: el.dataset.lc, labels: JSON.parse(el.dataset.labels) });
    if (api) el.classList.add('ready');
  };
  const check = () => { if (!api || played) return; const r = el.getBoundingClientRect(); if (r.top < innerHeight * .7 && r.bottom > innerHeight * .3) { played = true; api.play(); } };
  let loading = false;
  const io = new IntersectionObserver(async es => { if (es[0].isIntersecting && !api && !loading) { loading = true; await start(); check(); } }, { rootMargin: '300px' });
  io.observe(el);
  addEventListener('scroll', check, { passive: true });
  const rb = $('[data-kit-replay]', sec); rb && rb.addEventListener('click', () => { if (api) { played = true; api.play(); } });
});
