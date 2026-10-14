/* =========================================================
   NASFECO España · Madrid — behaviour
   Prices and models live in _build/build_madrid.py (MODELS) and reach this file as window.NF_CFG.
   ========================================================= */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  const CFG = window.NF_CFG, ES = document.documentElement.lang.startsWith('es');
  const T = (es, en) => ES ? es : en;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const wa = t => `https://wa.me/${CFG.wa || ''}?text=${encodeURIComponent(t)}`;
  const M = CFG.models;
  const SOON = new Set(CFG.soon || []);   // models shown as "coming soon": no booking yet
  const state = { model: 'x12', faucet: { x12: 'silver', x16: 'black' }, step: 0, book: {} };
  const fName = f => f === 'black' ? T('Grifo negro', 'Black faucet') : T('Grifo plateado', 'Silver faucet');
  const bName = b => b === 'black' ? T('Equipo negro', 'Black system') : T('Equipo blanco', 'White system');
  const SEL = () => ({ x12: { body: M.x12.body, faucet: M.x12.faucet }, x16: { body: M.x16.body, faucet: M.x16.faucet } });
  const email = CFG.email || CFG.pend.email;

  /* ---------- cookies: essential storage only; YouTube waits for consent. Rejecting is as easy as accepting ---------- */
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  let consent = store.get('nf-consent');            // 'yes' | 'no' | null
  const ck = $('#ck');
  const showBar = on => { if (ck) { ck.hidden = !on; document.documentElement.classList.toggle('ck-on', on); } };
  function setConsent(v) {
    consent = v; store.set('nf-consent', v); showBar(false);
    document.documentElement.classList.toggle('yt-ok', v === 'yes');
    if (v === 'yes') $$('[data-ytauto]').forEach(b => { yio.unobserve(b); yio.observe(b); });
    else $$('[data-ytauto] iframe').forEach(f => { f.remove(); }), $$('[data-ytauto]').forEach(b => b.classList.remove('on'));
  }
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-consent]'); if (c) { setConsent(c.dataset.consent); return; }
    if (e.target.closest('[data-cookie-settings]')) showBar(true);
  });

  /* ---------- launch offer (only if NASFECO sets one in the generator): bar, countdown, prices ---------- */
  const P = CFG.promo || { end: 0 }, END = new Date(P.end).getTime();
  let promoOn = !!CFG.promo && Date.now() < END;
  const now = k => (promoOn && M[k].promo) ? M[k].promo : M[k].price;   // price the customer pays today
  const priceTxt = k => (promoOn && M[k].promo) ? `${M[k].promo} (${P.name} −${P.off}; ${T('precio normal', 'regular price')} ${M[k].price})` : M[k].price;
  function promoTick() {
    const left = END - Date.now();
    if (left <= 0 && promoOn) promoOn = false;
    if (!promoOn) {
      const bar = $('[data-promo]'); bar && bar.remove(); document.documentElement.classList.add('no-promo');
      $$('[data-promo-on]').forEach(e => e.hidden = true); $$('[data-promo-off]').forEach(e => e.hidden = false); return false;
    }
    const d = Math.floor(left / 864e5), h = Math.floor(left / 36e5) % 24, mi = Math.floor(left / 6e4) % 60, se = Math.floor(left / 1e3) % 60;
    $$('[data-cd]').forEach(e => e.textContent = d > 0 ? `${d}d ${h}h ${mi}m` : `${h}h ${mi}m ${String(se).padStart(2, '0')}s`);
    return true;
  }
  if (promoTick()) { const iv = setInterval(() => { if (!promoTick()) clearInterval(iv); }, 1000); }

  /* ---------- header + mobile menu ---------- */
  const hd = $('#hd'), mnav = $('#mnav'), menuBtn = $('[data-menu]');
  const onScroll = () => hd.classList.toggle('scr', scrollY > 60 || !mnav.hidden);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const setMenu = open => { mnav.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open)); menuBtn.setAttribute('aria-label', open ? T('Cerrar menú', 'Close menu') : T('Abrir menú', 'Open menu')); document.body.style.overflow = open ? 'hidden' : ''; onScroll(); };
  menuBtn.addEventListener('click', () => setMenu(mnav.hidden));
  $$('a, button', mnav).forEach(el => el.addEventListener('click', () => setMenu(false)));

  /* ---------- model: hero scene, ritual scene, booking default ---------- */
  function selectModel(k) {
    if (!M[k]) return; state.model = k;
    $$('[data-scene]').forEach(i => i.classList.toggle('on', i.dataset.scene === k));
    $$('.sel[data-model]').forEach(b => { const on = b.dataset.model === k; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    const ri = $('#ritual-img'); if (ri) ri.src = M[k].scene;
    const rt = $('#ritual-tag'); if (rt) rt.textContent = `Waterdrop Filter ${M[k].name} · ${T('Ambientación ilustrativa', 'Illustrative setting')}`;
  }
  $$('.sel[data-model]').forEach(b => b.addEventListener('click', () => selectModel(b.dataset.model)));

  /* The hotspot sits on the smart faucet wherever the cropped photo puts it (object-fit: cover math) */
  const FAUCET = { x: .838, y: .5 };   // smart faucet position inside the scene photos (same in both)
  function placeHot() {
    const img = $('.sc-img.on') || $('.sc-img'), hot = $('.hot'), box = $('.sc');
    if (!img || !hot || !img.naturalWidth) return;
    const cw = box.clientWidth, ch = box.clientHeight, iw = img.naturalWidth, ih = img.naturalHeight;
    const k = Math.max(cw / iw, ch / ih), w = iw * k, h = ih * k;
    const [px, py] = getComputedStyle(img).objectPosition.split(' ').map(v => parseFloat(v) / 100);
    const x = (cw - w) * px + FAUCET.x * w, y = (ch - h) * py + FAUCET.y * h;
    hot.style.left = x + 'px'; hot.style.top = y + 'px'; hot.style.right = 'auto';
    hot.hidden = x < 20 || x > cw - 20 || y < 70 || y > ch - 20;
  }
  $$('.sc-img').forEach(i => i.complete ? placeHot() : i.addEventListener('load', placeHot));
  addEventListener('resize', placeHot);
  const sc = $('.hero') || document.createElement('div');
  let tx = null, ty = null;
  sc.addEventListener('touchstart', e => { if (e.touches.length === 1) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; } }, { passive: true });
  sc.addEventListener('touchend', e => {
    if (tx === null) return; const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; tx = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) selectModel(state.model === 'x12' ? 'x16' : 'x12');
  }, { passive: true });

  /* ---------- faucet colour swatches (cards and detail) ---------- */
  function setFaucet(k, f) {
    state.faucet[k] = f;
    $$(`[data-card="${k}"] .pc-img, #d-detail[data-k="${k}"] .pc-img`).forEach(i => i.classList.toggle('on', i.dataset.fimg === f));
    $$(`[data-card="${k}"] .sw, #d-detail[data-k="${k}"] .sw`).forEach(s => { const on = s.dataset.faucetColor === f; s.classList.toggle('on', on); s.setAttribute('aria-pressed', String(on)); });
    const di = $('#dt-img'); if (di && $('#d-detail').dataset.k === k) di.src = M[k].faucets[f];
  }
  document.addEventListener('click', e => {
    const s = e.target.closest('.sw[data-faucet-color]'); if (!s) return;
    const card = s.closest('[data-card]') || s.closest('#d-detail'); const k = card.dataset.card || card.dataset.k;
    setFaucet(k, s.dataset.faucetColor);
  });

  /* ---------- dialogs ---------- */
  let opener = null;
  const openDlg = id => {
    const d = $('#' + id); if (!d) return;
    $$('dialog[open]').forEach(x => { if (x !== d) x.close(); });
    setMenu(false); setCC(false);
    opener = document.activeElement; if (!d.open) d.showModal(); document.body.style.overflow = 'hidden';
  };
  $$('dialog').forEach(d => {
    d.addEventListener('close', () => { if (!$('dialog[open]')) { document.body.style.overflow = ''; opener && opener.focus && opener.focus({ preventScroll: true }); } });
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
    $$('[data-close]', d).forEach(b => b.addEventListener('click', () => d.close()));
  });

  /* ---------- the smart faucet (hotspot and ritual) ---------- */
  function faucetInfo() {
    const m = M[state.model], f = state.faucet[state.model];
    $('#in-body').innerHTML = `<div class="dt"><div class="dt-img${state.model === 'x16' ? ' dark' : ''}"><img src="${m.faucets[f]}" alt="Waterdrop Filter ${m.name}"></div><div>
      <p class="kick">Waterdrop Filter ${m.name}</p><h2 id="in-title">${T('El grifo <em>inteligente.</em>', 'The smart <em>faucet.</em>')}</h2>
      <p>${T('El grifo propio original lleva el control de tu equipo a la encimera, con información digital para el uso diario.', 'The original dedicated faucet brings system controls to your worktop, with digital information for everyday use.')}</p>
      <p>${T('La escena muestra cómo convive con la grifería principal de la cocina. Durante la valoración revisamos su ubicación y la compatibilidad de tu espacio.', 'The scene shows how it sits alongside the main kitchen faucet. During the assessment we review its placement and your kitchen compatibility.')}</p>
      <p class="fine">${T('Ambientación ilustrativa. Consulta la referencia exacta y sus funciones en la ficha oficial.', 'Illustrative setting. Check the exact reference and features in the official specifications.')}</p></div></div>`;
    openDlg('d-info');
  }

  /* ---------- detail ---------- */
  function detail(k) {
    const m = M[k], f = state.faucet[k], d = $('#d-detail'); d.dataset.k = k;
    const sw = Object.keys(m.faucets).map(x => `<button type="button" class="sw sw-${x}${x === f ? ' on' : ''}" data-faucet-color="${x}" aria-pressed="${x === f}"><i></i>${fName(x)}</button>`).join('');
    const desc = k === 'x12'
      ? T('El equilibrio para tu día a día: un sistema de ósmosis inversa sin depósito, con remineralización y grifo inteligente, acompañado por toda la experiencia NASFECO.', 'Everyday balance: a tankless reverse osmosis system with remineralization and a smart faucet, accompanied by the complete NASFECO experience.')
      : T('Capacidad nominal superior y diseño en negro: una opción para quienes priorizan rapidez y presencia, con la misma atención NASFECO.', 'Higher rated capacity and a black finish: an option for those who value speed and presence, with the same NASFECO attention.');
    const feats = [T('Ósmosis inversa sin depósito', 'Tankless reverse osmosis'), T('Remineralización', 'Remineralization'), T('Grifo inteligente original', 'Original smart faucet'), `${m.cap} · ${T('capacidad nominal', 'rated capacity')}`, T('Relación nominal 3:1 purificada / desagüe', 'Rated 3:1 purified / drain ratio')];
    $('#dt-body').innerHTML = `<div class="dt-img${k === 'x16' ? ' dark' : ''}"><img id="dt-img" src="${m.faucets[f]}" alt="Waterdrop Filter ${m.name}"></div><div>
      <p class="kick">Waterdrop Filter technology · NASFECO experience</p><h2 id="dt-title">Waterdrop Filter <em>${m.name}</em></h2><p>${desc}</p>
      <div class="pc-sw">${sw}</div><ul>${feats.map(x => `<li>${x}</li>`).join('')}</ul>
      <div class="pc-price"><b>${now(k)}</b><span>${T('IVA incluido', 'VAT included')}<br>${T('Instalación estándar + kit de bienvenida', 'Standard installation + welcome kit')}</span></div>
      <div class="row"><button type="button" class="btn b-gold" data-book="${k}"><span>${T('Elegir esta experiencia', 'Choose this experience')}</span><i>↗</i></button></div></div>`;
    openDlg('d-detail');
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-detail]'); if (b) detail(b.dataset.detail); });
  $$('[data-compare]').forEach(b => b.addEventListener('click', () => openDlg('d-compare')));

  /* ---------- quiz: a starting point, never a diagnosis ---------- */
  function quiz() {
    $('#qz-body').innerHTML = `<form id="qz-form">
      <fieldset><legend>${T('¿Qué es lo que más te importa en tu cocina?', 'What matters most for your kitchen?')}</legend>
        <label class="choice"><input type="radio" name="p" value="balance" checked><span>${T('Equilibrio entre tecnología y precio', 'A balance of technology and price')}</span></label>
        <label class="choice"><input type="radio" name="p" value="capacity"><span>${T('La mayor capacidad de los dos modelos', 'The higher capacity of the two models')}</span></label></fieldset>
      <fieldset><legend>${T('¿Cómo es tu rutina con el agua?', 'What is your water routine like?')}</legend>
        <label class="choice"><input type="radio" name="r" value="calm" checked><span>${T('Vasos, café y cocina del día a día', 'Glasses, coffee and everyday cooking')}</span></label>
        <label class="choice"><input type="radio" name="r" value="busy"><span>${T('Una casa con mucho movimiento: ollas, jarras y mucha gente', 'A busy home: pots, pitchers and many people')}</span></label></fieldset>
      <div class="row"><button type="submit" class="btn b-navy"><span>${T('Ver mi recomendación', 'See my guidance')}</span><i>→</i></button></div></form>`;
    $('#qz-form').addEventListener('submit', e => {
      e.preventDefault(); const fd = new FormData(e.target);
      const k = fd.get('p') === 'capacity' ? 'x16' : 'x12', m = M[k], busy = fd.get('r') === 'busy';
      $('#qz-body').innerHTML = `<div class="qz-r"><p class="kick">${T('Un punto de partida para hablarlo', 'A starting point for our conversation')}</p><h3>Waterdrop Filter ${m.name} · ${now(k)}</h3>
        <p>${k === 'x16' ? T('Como priorizas la mayor capacidad, el X16 es una opción para explorar, con toda la experiencia NASFECO.', 'Since you prioritize higher capacity, X16 is an option to explore, with the complete NASFECO experience.')
          : T('El X12 es un buen punto de partida para tu rutina, con toda la experiencia NASFECO.', 'X12 is a good starting point for your routine, with the complete NASFECO experience.') + (busy ? ' ' + T('Como en tu casa hay mucho movimiento, podemos ver juntos si la mayor capacidad del X16 te aporta valor.', 'Since your home is busy, together we can review whether the extra X16 capacity adds value for you.') : '')}</p>
        <p class="fine">${T('Esta recomendación refleja tus preferencias. La compatibilidad y el rendimiento dependen de la valoración de tu cocina; no es un diagnóstico técnico.', 'This guidance reflects your preferences. Compatibility and performance depend on your kitchen assessment; it is not a technical diagnosis.')}</p>
        <div class="row"><button type="button" class="btn b-gold" data-book="${k}"><span>${T('Pedir mi valoración', 'Explore my consultation')}</span><i>↗</i></button><button type="button" class="ul" id="qz-again">${T('Volver a empezar', 'Start again')}</button></div></div>`;
      $('#qz-again').addEventListener('click', quiz);
    });
  }
  $$('[data-quiz]').forEach(b => b.addEventListener('click', () => { quiz(); openDlg('d-quiz'); }));

  /* ---------- booking: 3 steps → WhatsApp (nothing is stored or charged here) ---------- */
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const dmy = iso => iso ? iso.split('-').reverse().join('/') : '—';   // dd/mm/aaaa
  const B = state.book;
  const val = k => esc(B[k] || '');
  const opt = (name, v, label) => `<label><input type="radio" name="${name}" value="${v}"${(B[name] || '') === v ? ' checked' : ''}>${label}</label>`;
  function sideSummary() {
    const k = B.model || state.model, m = M[k], f = m.faucet;
    $('#bk-img').src = m.faucets[f]; $('#bk-model').textContent = `Waterdrop Filter ${m.name} · ${bName(m.body)} · ${fName(f)}`; $('#bk-price').textContent = now(k);
  }
  function renderBook() {
    const s = state.step; $('#bk-err').textContent = '';
    $('#bk-step').textContent = `0${Math.min(s + 1, 3)} / 03`;
    $$('.bk-prog span').forEach((el, i) => el.classList.toggle('on', i <= s));
    $('#bk-back').hidden = s === 0 || s === 3; $('.bk-btns').hidden = s === 3;
    $('#bk-next span').textContent = s === 2 ? T('Ver mi solicitud', 'Review my request') : T('Continuar', 'Continue');
    const titles = [T('Empecemos por tu elección.', 'Start with your choice.'), T('Cuéntanos cómo es tu cocina.', 'Tell us about your kitchen.'), T('Tu siguiente paso, a tu ritmo.', 'Your next step, at your pace.'), T('Tu solicitud está lista.', 'Your request is ready.')];
    const subs = [SOON.size ? T('El X12, con toda la atención NASFECO. El X16 llega pronto.', 'The X12, with the full NASFECO attention. The X16 is coming soon.') : T('La misma atención. Dos capacidades para elegir.', 'The same attention. Two capacities to explore.'), T('Estos datos orientan la valoración; la compatibilidad se confirma después.', 'These details guide the assessment; compatibility is confirmed afterwards.'), T('Así sabremos cómo y cuándo ponernos en contacto contigo.', 'So we know how and when to reach you.'), T('Revísala y envíala por WhatsApp. La cita se confirma cuando NASFECO te responda.', 'Review it and send it on WhatsApp. Your appointment is confirmed when NASFECO replies.')];
    $('#bk-title').textContent = titles[s]; $('#bk-sub').textContent = subs[s];
    let h = '';
    if (s === 0) {
      const k0 = B.model || state.model;
      h = Object.keys(M).map(k => SOON.has(k)
          ? `<label class="choice soon" aria-disabled="true"><input type="radio" name="model" value="${k}" disabled><span><b>Waterdrop Filter ${M[k].name}</b></span><strong>${T('Próximamente', 'Coming soon')}</strong></label>`
          : `<label class="choice"><input type="radio" name="model" value="${k}"${k0 === k ? ' checked' : ''}><span><b>Waterdrop Filter ${M[k].name}</b><small>${bName(M[k].body)} · ${fName(M[k].faucet).toLowerCase()}</small></span><strong>${esc(now(k))}</strong></label>`).join('')
        + `<p class="fine">${T('El precio incluye IVA, valoración e instalación estándar. Cualquier adaptación adicional se acuerda antes.', 'The price includes VAT, assessment and standard installation. Any additional work is agreed beforehand.')}</p>`;
    } else if (s === 1) {
      h = `<div class="f2"><div class="fld" data-f="zip"><label for="f-zip">${T('Código postal (Madrid)', 'Postcode (Madrid)')}</label><input id="f-zip" name="zip" inputmode="numeric" maxlength="5" autocomplete="postal-code" value="${val('zip')}" placeholder="28001"><span class="msg"></span></div>
        <div class="fld"><label for="f-home">${T('Tipo de vivienda', 'Home type')}</label><select id="f-home" name="home">${[['flat', T('Piso', 'Flat')], ['house', T('Casa / chalé', 'House')], ['other', T('Otro', 'Other')]].map(([v, l]) => `<option value="${v}"${B.home === v ? ' selected' : ''}>${l}</option>`).join('')}</select></div></div>
        <div class="fld" data-f="outlet"><label>${T('¿Hay enchufe bajo el fregadero?', 'Is there a socket under the sink?')}</label><div class="seg">${opt('outlet', 'yes', T('Sí', 'Yes'))}${opt('outlet', 'no', T('No', 'No'))}${opt('outlet', 'unsure', T('No lo sé', 'Not sure'))}</div><span class="msg"></span></div>
        <p class="fine">${T('El código postal solo orienta la zona; no confirma cobertura ni compatibilidad. Si respondes «no», lo vemos en la valoración.', 'The postcode only guides the area; it does not confirm coverage or compatibility. A "no" answer is reviewed during the assessment.')} ${esc(CFG.zone || CFG.pend.zone)}</p>`;
    } else if (s === 2) {
      h = `<div class="f2"><div class="fld" data-f="name"><label for="f-name">${T('Nombre', 'Name')}</label><input id="f-name" name="name" autocomplete="name" value="${val('name')}"><span class="msg"></span></div>
        <div class="fld" data-f="email"><label for="f-email">${T('Correo electrónico', 'Email')}</label><input id="f-email" name="email" type="email" autocomplete="email" value="${val('email')}"><span class="msg"></span></div></div>
        <div class="f2"><div class="fld"><label for="f-phone">${T('Móvil', 'Mobile')} <small>(${T('opcional', 'optional')})</small></label><input id="f-phone" name="phone" type="tel" autocomplete="tel" value="${val('phone')}" placeholder="+34"></div>
        <div class="fld" data-f="date"><label for="f-date">${T('Fecha preferida', 'Preferred date')} <small>(${T('opcional', 'optional')})</small></label><input id="f-date" name="date" type="date" min="${today()}" value="${val('date')}"><span class="msg"></span></div></div>
        <div class="fld"><label>${T('Franja horaria', 'Time of day')}</label><div class="seg">${opt('slot', 'morning', T('Mañana', 'Morning'))}${opt('slot', 'afternoon', T('Tarde', 'Afternoon'))}${opt('slot', 'any', T('Cualquiera', 'Any time'))}</div></div>
        <div class="fld" data-f="privacy"><label class="chk"><input type="checkbox" name="privacy" value="yes"${B.privacy === 'yes' ? ' checked' : ''}><span>${T('He leído y acepto la', 'I have read and accept the')} <a class="ul" href="${CFG.privacy}" target="_blank" rel="noopener">${T('política de privacidad', 'privacy policy')}</a>.</span></label><span class="msg"></span></div>
        <p class="fine">${T('La fecha es una preferencia, no una cita confirmada.', 'The date is a preference, not a confirmed appointment.')}</p>`;
    } else {
      const m = M[B.model], rows = summary();
      h = `<div class="bk-done"><dl>${rows.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('')}</dl>
        <div class="row"><a class="btn b-wa" href="${wa(summaryText())}" target="_blank" rel="noopener"><span>${T('Enviar por WhatsApp', 'Send on WhatsApp')}</span><i>↗</i></a><button type="button" class="btn b-line" id="bk-dl"><span>${T('Descargar resumen', 'Download summary')}</span></button><button type="button" class="ul" id="bk-edit">${T('Editar', 'Edit')}</button></div>
        <p class="note">${T('Se abre WhatsApp con tu solicitud escrita; nada se envía hasta que pulses enviar. No se procesa ningún pago ni se reserva una cita hasta que NASFECO te confirme disponibilidad.', 'WhatsApp opens with your request written out; nothing is sent until you press send. No payment is processed and no appointment is reserved until NASFECO confirms availability.')}</p></div>`;
    }
    $('#bk-fields').innerHTML = h; sideSummary();
    $$('#bk-fields input, #bk-fields select').forEach(i => i.addEventListener('change', () => { capture(); sideSummary(); }));
    if (s === 3) {
      $('#bk-dl').addEventListener('click', () => { const b = new Blob([summaryText()], { type: 'text/plain;charset=utf-8' }); const u = URL.createObjectURL(b); const l = document.createElement('a'); l.href = u; l.download = 'NASFECO-valoracion.txt'; l.click(); setTimeout(() => URL.revokeObjectURL(u), 1000); });
      $('#bk-edit').addEventListener('click', () => { state.step = 0; renderBook(); });
    }
  }
  function capture() {
    const fd = new FormData($('#bk-form')); fd.forEach((v, k) => { B[k] = String(v).trim(); });
    if ($('#bk-form [name="privacy"]')) B.privacy = fd.get('privacy') ? 'yes' : '';
    if (B.model) { B.body = M[B.model].body; B.faucet = M[B.model].faucet; }
  }
  const lab = { flat: T('Piso', 'Flat'), house: T('Casa / chalé', 'House'), other: T('Otro', 'Other'), yes: T('Sí', 'Yes'), no: 'No', unsure: T('No lo sé', 'Not sure'), morning: T('Mañana', 'Morning'), afternoon: T('Tarde', 'Afternoon'), any: T('Cualquiera', 'Any time') };
  function summary() {
    const m = M[B.model];
    return [[T('Equipo', 'Experience'), `Waterdrop Filter ${m.name} · ${bName(B.body)} · ${fName(B.faucet)} · ${priceTxt(B.model)} (${T('IVA, valoración, instalación estándar y kit incluidos', 'VAT, assessment, standard installation and kit included')})`],
      [T('Código postal', 'Postcode'), B.zip], [T('Vivienda', 'Home'), lab[B.home]], [T('Enchufe bajo el fregadero', 'Socket under the sink'), lab[B.outlet]],
      [T('Nombre', 'Name'), B.name], [T('Correo electrónico', 'Email'), B.email], [T('Móvil', 'Mobile'), B.phone || '—'],
      [T('Fecha preferida', 'Preferred date'), dmy(B.date)], [T('Franja', 'Time of day'), lab[B.slot] || '—'],
      [T('Privacidad', 'Privacy'), T('Acepto la política de privacidad', 'I accept the privacy policy')]];
  }
  const summaryText = () => T('¡Hola NASFECO! Quiero solicitar una valoración.', 'Hello NASFECO! I would like to request a consultation.') + '\n\n' + summary().map(([a, b]) => `${a}: ${b}`).join('\n');
  function validate() {
    const s = state.step, errs = {};
    $$('.fld.bad').forEach(f => { f.classList.remove('bad'); const m = $('.msg', f); if (m) m.textContent = ''; });
    if (s === 0 && !B.model) errs._ = T('Elige un equipo.', 'Choose an experience.');
    if (s === 1) {
      if (!/^28\d{3}$/.test(B.zip || '')) errs.zip = T('Escribe un código postal de Madrid: 5 cifras que empiezan por 28.', 'Enter a Madrid postcode: 5 digits starting with 28.');
      if (!B.outlet) errs.outlet = T('Elige una opción.', 'Choose an option.');
    }
    if (s === 2) {
      if ((B.name || '').length < 2) errs.name = T('Escribe tu nombre.', 'Enter your name.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(B.email || '')) errs.email = T('Revisa el correo electrónico.', 'Check the email format.');
      if (B.date && B.date < today()) errs.date = T('Elige una fecha de hoy en adelante.', 'Choose today or a later date.');
      if (B.privacy !== 'yes') errs.privacy = T('Para continuar, acepta la política de privacidad.', 'To continue, accept the privacy policy.');
    }
    Object.entries(errs).forEach(([k, msg]) => { const f = $(`.fld[data-f="${k}"]`); if (f) { f.classList.add('bad'); $('.msg', f).textContent = msg; } });
    if (Object.keys(errs).length) { $('#bk-err').textContent = errs._ || T('Revisa los campos marcados.', 'Please check the highlighted fields.'); const first = $('.fld.bad input, .fld.bad select'); first && first.focus(); return false; }
    return true;
  }
  $('#bk-form').addEventListener('submit', e => { e.preventDefault(); capture(); if (!validate()) return; state.step++; renderBook(); $('#bk-title').focus && $('#bk-title').setAttribute('tabindex', '-1'); $('#bk-title').focus(); });
  $('#bk-back').addEventListener('click', () => { capture(); state.step = Math.max(0, state.step - 1); renderBook(); });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-book]'); if (!b) return;
    const k = b.dataset.book; if (M[k] && !SOON.has(k)) { B.model = k; B.body = SEL()[k].body; B.faucet = SEL()[k].faucet; selectModel(k); }
    if (!B.model || SOON.has(B.model)) { let k0 = document.querySelector('[data-pdp]')?.dataset.pdp || state.model; if (SOON.has(k0)) k0 = Object.keys(M).find(x => !SOON.has(x)); B.model = k0; B.body = SEL()[k0].body; B.faucet = SEL()[k0].faucet; }
    state.step = 0; renderBook(); openDlg('d-book');
  });

  /* ---------- welcome box + gifts ---------- */
  const box = $('#box');
  if (box) {
    const setBox = open => { box.classList.toggle('open', open); $('[data-close-box]').hidden = !open; $('#box-cover').setAttribute('aria-hidden', String(open)); (open ? $('[data-close-box]') : $('[data-open-box]')).focus({ preventScroll: true }); };
    $('[data-open-box]').addEventListener('click', () => setBox(true));
    $('[data-close-box]').addEventListener('click', () => setBox(false));
  }
  $$('[data-gift]').forEach(g => g.addEventListener('click', () => {
    const open = !g.classList.contains('on');
    $$('[data-gift]').forEach(x => { const on = x === g && open; x.classList.toggle('on', on); x.setAttribute('aria-expanded', String(on)); });
  }));

  /* ---------- care steps ---------- */
  $$('[data-care]').forEach(t => t.addEventListener('click', () => {
    $$('[data-care]').forEach(x => { const on = x === t; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
    $$('[data-care-p]').forEach(p => p.classList.toggle('on', p.dataset.careP === t.dataset.care));
  }));

  /* ---------- guide index: shows once the guide starts and marks the chapter being read ---------- */
  const railEl = $('.rail');
  if (railEl) {
    const links = $$('[data-rail]', railEl), chs = $$('[data-ch]');
    const mark = () => {
      const mid = innerHeight * .4; let cur = null;
      chs.forEach(c => { const r = c.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) cur = c.id; });
      const install = $('#install'); if (!cur && install) { const r = install.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) cur = 'how'; }
      railEl.classList.toggle('show', !!cur);
      links.forEach(l => l.classList.toggle('on', l.dataset.rail === cur));
    };
    addEventListener('scroll', mark, { passive: true }); addEventListener('resize', mark); mark();
  }

  /* ---------- welcome kit photo: numbered points and list stay in sync ---------- */
  const kitSel = n => $$('[data-kit-i]').forEach(b => { const on = b.dataset.kitI === n; b.classList.toggle('on', on); if (b.classList.contains('kit-i')) b.setAttribute('aria-pressed', String(on)); });
  $$('[data-kit-i]').forEach(b => b.addEventListener('click', () => kitSel(b.dataset.kitI)));

  /* ---------- "do we cover your home?": Madrid postcodes start with 28; exact coverage is confirmed in the assessment ---------- */
  const zf = $('[data-zone]');
  if (zf) zf.addEventListener('submit', e => {
    e.preventDefault();
    const cp = zf.cp.value.trim(), out = $('[data-zone-r]', zf);
    if (/^28\d{3}$/.test(cp)) {
      B.zip = cp;
      out.className = 'zona-r ok';
      out.innerHTML = `<b>${T(`${cp} está en Madrid.`, `${cp} is in Madrid.`)}</b>${T('Te confirmamos la cobertura exacta en la valoración.', 'We confirm the exact coverage in your assessment.')} <button type="button" class="ul" data-book>${T('Pedir valoración con este código', 'Book an assessment with this postcode')} →</button>`;
    } else if (/^\d{5}$/.test(cp)) {
      out.className = 'zona-r no';
      out.innerHTML = `<b>${T('Por ahora trabajamos en Madrid.', 'For now we work in Madrid.')}</b>${T('Escríbenos y te avisamos cuando lleguemos a tu zona.', 'Write to us and we will let you know when we reach your area.')} <a class="ul" href="${wa(T(`¡Hola NASFECO! Mi código postal es ${cp}. ¿Llegáis a mi zona?`, `Hello NASFECO! My postcode is ${cp}. Do you cover my area?`))}" target="_blank" rel="noopener">WhatsApp →</a>`;
    } else { out.className = 'zona-r no'; out.innerHTML = `<b>${T('Revisa el código postal.', 'Check the postcode.')}</b>${T('Son 5 cifras, por ejemplo 28001.', 'It has 5 digits, for example 28001.')}`; }
  });

  /* ---------- FAQ: one open at a time ---------- */
  $$('.faq details').forEach(d => d.addEventListener('toggle', () => { if (d.open) $$('.faq details').forEach(o => { if (o !== d) o.open = false; }); }));

  /* ---------- scope / privacy ---------- */
  const INFO = {
    scope: [T('Cada detalle, <em>por escrito.</em>', 'Every detail, <em>in writing.</em>'),
      `<p>${T(`Precio en Madrid: X12 ${priceTxt('x12')}, IVA e instalación incluidos.`, `Madrid price: X12 ${priceTxt('x12')}, VAT and installation included.`)} ${SOON.has('x16') ? T('El X16 llega pronto.', 'The X16 is coming soon.') : ''} ${T('La experiencia incluye valoración, equipo con grifo original, instalación estándar, kit de bienvenida y seguimiento.', 'The experience includes an assessment, the system and original faucet, standard installation, welcome kit and follow-up.')}</p>
       <p>${T('La valoración confirma espacio, agua potable, desagüe, enchufe, perforación de la encimera y, si hace falta, el permiso de la comunidad de vecinos. Cualquier trabajo adicional se presupuesta y se aprueba antes de instalar.', 'The assessment confirms space, drinking water, drain, socket, worktop drilling and, if needed, permission from your building. Any additional work is quoted and approved before installation.')}</p>
       <p>${T(`El kit incluye: ${CFG.kit.join(', ').toLowerCase()}. Las referencias de los filtros, los acabados del kit y las condiciones de garantía se detallan en la propuesta final.`, `The kit includes: ${CFG.kit.join(', ').toLowerCase()}. Filter references, kit finishes and warranty terms are detailed in the final proposal.`)}</p>
       <p>${esc(CFG.zone || CFG.pend.zone)}</p>`],
    privacy: [T('Tu información, <em>en tus manos.</em>', 'Your information, <em>in your hands.</em>'),
      `<p>${T('Esta web no guarda tus datos en un servidor. El formulario de valoración prepara un mensaje que tú decides si envías por WhatsApp; también puedes descargar un resumen en tu dispositivo.', 'This website does not store your details on a server. The assessment form prepares a message that you decide whether to send on WhatsApp; you can also download a summary to your device.')}</p>
       <p>${T('No usamos analítica ni publicidad. Los vídeos de YouTube solo se cargan si aceptas las cookies.', 'We do not use analytics or advertising. YouTube videos only load if you accept cookies.')}</p>
       <p>${T('Para cualquier consulta sobre tus datos, escríbenos a', 'For any question about your data, write to')} ${CFG.email ? `<a class="ul" href="mailto:${CFG.email}">${CFG.email}</a>` : `<mark class="pend">${CFG.pend.email}</mark>`}. <a class="ul" href="${CFG.privacy}">${T('Política de privacidad completa', 'Full privacy policy')}</a>.</p>`]
  };
  $$('[data-info]').forEach(b => b.addEventListener('click', () => { const [t, body] = INFO[b.dataset.info]; $('#in-body').innerHTML = `<h2 class="h3" id="in-title">${t}</h2><div class="in-p">${body}</div>`; openDlg('d-info'); }));

  /* ---------- concierge (prepared answers + a real person on WhatsApp) ---------- */
  const cc = $('#cc'), ccBtn = $('[data-cc]');
  function setCC(open) { if (!cc) return; cc.hidden = !open; ccBtn.setAttribute('aria-expanded', String(open)); if (open) $('[data-cc-close]').focus(); }
  ccBtn.addEventListener('click', () => setCC(cc.hidden));
  $('[data-cc-close]').addEventListener('click', () => { setCC(false); ccBtn.focus(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (!cc.hidden) { setCC(false); ccBtn.focus(); } if (!mnav.hidden) setMenu(false); } });
  const CC = {
    models: SOON.has('x16') ? T(`El X12 ya está disponible en Madrid por ${now('x12')}, con IVA, instalación estándar, kit de bienvenida y atención NASFECO. El X16 llega pronto: escríbenos por WhatsApp y te avisamos.`, `The X12 is available now in Madrid for ${now('x12')}, including VAT, standard installation, welcome kit and NASFECO attention. The X16 is coming soon: message us on WhatsApp and we will let you know.`) : T(`X12: ${M.x12.price}. X16: ${M.x16.price}. Los dos incluyen IVA, instalación estándar, kit de bienvenida y la misma atención NASFECO. La mayor capacidad del X16 no significa por sí sola un agua más segura.`, `X12: ${M.x12.price}. X16: ${M.x16.price}. Both include VAT, standard installation, welcome kit and the same NASFECO attention. Higher X16 capacity does not, by itself, mean safer water.`),
    gift: T(`Tu equipo y su grifo original, la valoración y la instalación estándar. Además, tu kit de bienvenida: ${CFG.kit.join(', ').toLowerCase()}. Las referencias se confirman en tu propuesta.`, `Your system and its original faucet, the assessment and standard installation. Plus your welcome kit: ${CFG.kit.join(', ').toLowerCase()}. Exact references are confirmed in your proposal.`),
    kitchen: T('Primero revisamos el espacio bajo el fregadero, la toma de agua, el desagüe, el enchufe y dónde irá el grifo. La valoración confirma si se puede instalar y si hace falta alguna adaptación.', 'First we review under-sink space, water supply, drain, socket and where the faucet goes. The assessment confirms whether installation is possible and whether any adaptations are needed.'),
    care: T('Te explicamos el uso y hacemos seguimiento, con orientación y recordatorios de mantenimiento. Las condiciones de garantía, visitas y repuestos se detallan por escrito.', 'We explain operation and follow up, with guidance and maintenance reminders. Warranty, service visits, and replacement part terms are detailed in writing.')
  };
  $$('[data-cc-topic]').forEach(b => b.addEventListener('click', () => { $('#cc-a').textContent = CC[b.dataset.ccTopic]; $$('[data-cc-topic]').forEach(x => x.classList.toggle('on', x === b)); }));

  /* ---------- YouTube Shorts (youtube-nocookie, only after consent): play muted while on screen, pause when they leave ---------- */
  const ytCmd = (f, func) => f.contentWindow && f.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
  const yio = new IntersectionObserver(es => es.forEach(en => {
    const box = en.target, id = box.dataset.ytauto; let f = $('iframe', box);
    if (consent !== 'yes') return;
    if (en.isIntersecting) {
      if (!f) {
        f = document.createElement('iframe');
        f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
        f.title = box.getAttribute('aria-label') || 'Video'; f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true;
        f.addEventListener('load', () => box.classList.add('on')); box.appendChild(f);
      } else { ytCmd(f, 'mute'); ytCmd(f, 'playVideo'); }
    } else if (f) ytCmd(f, 'pauseVideo');
  }), { threshold: .5 });
  $$('[data-ytauto]').forEach(b => yio.observe(b));
  if (consent === 'yes') document.documentElement.classList.add('yt-ok'); else if (consent !== 'no') showBar(true);

  /* ---------- Your NASFECO day: sticky horizontal journey on desktop, swipe on mobile ---------- */
  const jr = $('[data-journey]');
  if (jr) {
    const track = $('.jr-track', jr), dots = $$('.jr-dots i', jr), wide = () => matchMedia('(min-width: 1081px)').matches;
    const mark = p => { const n = Math.min(dots.length - 1, Math.floor(p * dots.length * .999)); dots.forEach((d, i) => d.classList.toggle('on', i <= n)); };
    let dist = 0;
    const size = () => {
      if (!wide()) { jr.style.height = ''; track.style.transform = ''; return; }
      dist = Math.max(0, track.scrollWidth - innerWidth);
      jr.style.height = (innerHeight + dist) + 'px';
    };
    const move = () => {
      if (!wide()) return;
      const r = jr.getBoundingClientRect(), p = Math.min(1, Math.max(0, -r.top / Math.max(1, dist)));
      track.style.transform = `translate3d(${-p * dist}px,0,0)`; mark(p);
    };
    track.addEventListener('scroll', () => { if (!wide()) mark(track.scrollLeft / Math.max(1, track.scrollWidth - track.clientWidth)); }, { passive: true });
    addEventListener('scroll', move, { passive: true });
    addEventListener('resize', () => { size(); move(); });
    addEventListener('load', () => { size(); move(); });
    size(); move(); mark(0);
  }

  /* ---------- official clips: play only while visible ---------- */
  const vio = new IntersectionObserver(es => es.forEach(en => { const v = en.target; if (en.isIntersecting) { v.preload = 'auto'; const pr = v.play(); pr && pr.catch(() => {}); } else v.pause(); }), { threshold: .35 });
  $$('video[data-auto]').forEach(v => vio.observe(v));

  /* ---------- gentle reveal (CSS only animates it when the device allows motion) ---------- */
  const rio = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); rio.unobserve(en.target); } }), { threshold: .08, rootMargin: '0px 0px -6% 0px' });
  $$('.rv').forEach(el => rio.observe(el));
})();
