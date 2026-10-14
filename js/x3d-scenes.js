/* =========================================================
   NASFECO · 3D stories
   - createInstall: how NASFECO installs the system under your sink (driven by scroll)
   - createKit:     the welcome kit coming out of its box
   Illustrative scenes; the system keeps its official dimensions.
   ========================================================= */
import * as THREE from './vendor/three/three.module.min.js';
import { OrbitControls } from './vendor/three/OrbitControls.js';
import { RoundedBoxGeometry } from './vendor/three/RoundedBoxGeometry.js';
import { RoomEnvironment } from './vendor/three/RoomEnvironment.js';
import { makeUnit, makeFaucet } from './x3d.js';

const FONT = '"Plus Jakarta Sans", Arial, sans-serif';
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const seg = (t, a, b) => ease((t - a) / (b - a));

function stage(el, { exposure = 1.05, fov = 32, shift = 0 } = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { el.classList.add('no3d'); return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 760 ? 1.5 : 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = exposure;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  el.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  const cam = new THREE.PerspectiveCamera(fov, 1, .1, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a66, .6));
  const key = new THREE.DirectionalLight(0xfff4e6, 1.7); key.position.set(4, 8, 6); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5 }); key.shadow.bias = -.0004; scene.add(key);
  const resize = () => { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; if (shift && w / h > 1.3) cam.setViewOffset(w, h, -w * shift, 0, w, h); else cam.clearViewOffset(); cam.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(el); resize();
  let visible = true; new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(el);
  const tags = [];
  const v = new THREE.Vector3();
  const tag = (text, cls = '') => { const s = document.createElement('span'); s.className = 'x3-pin ' + cls; s.innerHTML = text; el.appendChild(s); const t = { s, p: new THREE.Vector3(), on: false }; tags.push(t); return t; };
  const place = () => tags.forEach(t => { v.copy(t.p).project(cam); const hw = (t.s.offsetWidth || 0) / 2 + 6, x = Math.min(el.clientWidth - hw, Math.max(hw, (v.x * .5 + .5) * el.clientWidth)), y = (-v.y * .5 + .5) * el.clientHeight; t.s.style.transform = `translate(-50%,-100%) translate(${x}px,${y}px)`; t.s.classList.toggle('on', t.on && v.z < 1); });
  const run = fn => { const loop = () => { requestAnimationFrame(loop); if (!visible) return; fn(performance.now() / 1000); renderer.render(scene, cam); place(); }; loop(); };
  return { renderer, scene, cam, tag, run, aspect: () => cam.aspect };
}
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .6, ...o });
const box = (w, h, d, m, r = 0) => { const g = r ? new RoundedBoxGeometry(w, h, d, 4, r) : new THREE.BoxGeometry(w, h, d); const x = new THREE.Mesh(g, m); x.castShadow = x.receiveShadow = true; return x; };
const tube = (pts, r, m) => { const curve = new THREE.CatmullRomCurve3(pts); const g = new THREE.TubeGeometry(curve, 80, r, 10, false); const x = new THREE.Mesh(g, m); x.castShadow = true; x.userData.total = g.index.count; g.setDrawRange(0, 0); return x; };
const grow = (t, k) => t.geometry.setDrawRange(0, Math.floor(clamp(k) * t.userData.total / 60) * 60);
const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
function tinted(img, color) { // NASFECO mark in any colour
  const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const g = c.getContext('2d');
  g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height); return c;
}
const loadImg = src => new Promise(r => { if (!src) return r(null); const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });

/* ================================================================ installation */
export function createInstall(el, opts = {}) {
  const S = stage(el, { exposure: 1.1, shift: .17 }); if (!S) return null;
  const { scene, cam } = S;
  const CW = 3.4, CD = 2.2, CH = 3.0, T = .07, TOP = CH + .15;
  const wood = mat(0xe9dcc6, { roughness: .75 }), white = mat(0xf6f3ee, { roughness: .45 }), wall = mat(0xdccbb2, { roughness: .95 })   // warm plaster wall;
  const steel = new THREE.MeshStandardMaterial({ color: 0xc4c9ce, metalness: .9, roughness: .28 }), chrome = new THREE.MeshStandardMaterial({ color: 0xe6e9ec, metalness: 1, roughness: .15 });
  const pvc = mat(0xf1f1ef, { roughness: .4 }), gold = mat(0xd5b581, { metalness: .8, roughness: .3 });
  // room
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), mat(0x9a5a43, { roughness: .9 })); floor.rotation.x   // terracotta floor = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), wall); back.position.set(0, 6, -CD / 2 - .04); back.receiveShadow = true; scene.add(back);
  // cabinet
  const cab = new THREE.Group(); scene.add(cab);
  const bottom = box(CW, T, CD, wood); bottom.position.set(0, .12, 0); cab.add(bottom);
  const kick = box(CW, .12, CD - .1, mat(0x2a2c2e)); kick.position.set(0, .06, -.05); cab.add(kick);
  [-1, 1].forEach(s => { const w = box(T, CH, CD, wood); w.position.set(s * (CW / 2 - T / 2), CH / 2, 0); cab.add(w); });
  const bp = box(CW, CH, T, wood); bp.position.set(0, CH / 2, -CD / 2 + T / 2); cab.add(bp);
  const counter = box(CW + .7, .15, CD + .3, new THREE.MeshPhysicalMaterial({ color: 0xf4f1ec, roughness: .22, clearcoat: .6 }), .02); counter.position.set(0, CH + .075, .12); cab.add(counter);
  // neighbouring cabinets so it reads as a kitchen
  [-1, 1].forEach(s => { const n = box(2.6, CH, CD, white, .02); n.position.set(s * (CW / 2 + 1.35 + .02), CH / 2, 0); cab.add(n); const c2 = box(2.6, .15, CD + .3, counter.material); c2.position.set(s * (CW / 2 + 1.35 + .37), CH + .075, .12); cab.add(c2);
    const hd = box(.5, .04, .05, gold, .015); hd.position.set(s * (CW / 2 + 1.35), CH - .35, CD / 2 + .03); cab.add(hd); });
  // sink
  const SX = -.45;
  const rim = new THREE.Mesh(new RoundedBoxGeometry(2.05, .012, 1.45, 3, .006), steel); rim.position.set(SX, TOP + .004, .05); cab.add(rim);
  const hole = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.3), new THREE.MeshStandardMaterial({ color: 0x8e959c, metalness: .85, roughness: .35 })); hole.rotation.x = -Math.PI / 2; hole.position.set(SX, TOP + .012, .05); cab.add(hole);
  const basin = box(1.95, .8, 1.35, steel, .05); basin.position.set(SX, CH - .4, .05); cab.add(basin);
  // kitchen mixer
  const mix = new THREE.Group(); mix.position.set(SX, TOP, -.9); cab.add(mix);
  const mc = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, .9, 32), chrome); mc.position.y = .45; mix.add(mc);
  const neck = new THREE.Mesh(new THREE.TorusGeometry(.32, .045, 16, 48, Math.PI), chrome); neck.rotation.y = Math.PI / 2; neck.position.set(0, .9, .32); mix.add(neck);
  // drain + valves + outlet
  const drain = tube([new THREE.Vector3(SX, CH - .8, .05), new THREE.Vector3(SX, 1.62, .05), new THREE.Vector3(SX, 1.48, -.18), new THREE.Vector3(SX, 1.62, -.4), new THREE.Vector3(SX, 1.72, -.6), new THREE.Vector3(SX, 1.72, -1.06)], .06, pvc); drain.geometry.setDrawRange(0, Infinity); cab.add(drain);
  const valve = (x, col) => { const g = new THREE.Group(); g.position.set(x, 1.98, -CD / 2 + T); const b = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .2, 20), chrome); b.rotation.x = Math.PI / 2; b.position.z = .1; g.add(b); const h = box(.16, .05, .05, mat(col, { roughness: .4 }), .02); h.position.set(0, .07, .14); g.add(h); cab.add(g); return g; };
  const vCold = valve(.15, 0x3a7bd5); valve(-1.25, 0xd5523a);
  const outlet = box(.03, .36, .22, white, .01); outlet.position.set(CW / 2 - T - .015, 1.45, -.35); cab.add(outlet);
  [-.05, .05].forEach(y => { const s = box(.035, .05, .02, mat(0x555555)); s.position.set(CW / 2 - T - .03, 1.45 + y * 1.4, -.35); cab.add(s); });
  // doors (hinged on the outer edges)
  const doors = [-1, 1].map(s => { const pv = new THREE.Group(); pv.position.set(s * CW / 2, .18, CD / 2); cab.add(pv);
    const d = box(CW / 2 - .02, CH - .26, .06, white, .02); d.position.set(-s * (CW / 4), (CH - .26) / 2, .03); pv.add(d);
    const h = box(.04, .5, .05, gold, .015); h.position.set(-s * (CW / 2 - .18), CH - .7, .09); pv.add(h); return { pv, s }; });
  // the system
  const U = makeUnit(); U.set(opts.model || 'x12', opts.body || 'white'); const unit = U.group; cab.add(unit);
  const UX = .7, UZ = -CD / 2 + T + U.size.D / 2 + .06, UY = .155;
  const F = makeFaucet(); F.set(opts.faucet || 'silver'); const fau = F.group; fau.rotation.y = Math.PI / 2; cab.add(fau);
  const FX = .95, FZ = -.78;
  // connections
  const blue = mat(0x3a8fd9, { roughness: .35 }), wtube = mat(0xfafafa, { roughness: .3 }), black = mat(0x1d1f22, { roughness: .5 });
  const tIn = tube([new THREE.Vector3(.15, 1.98, -CD / 2 + .25), new THREE.Vector3(.2, 2.05, -.82), new THREE.Vector3(.32, 1.95, -.74), new THREE.Vector3(.36, UY + U.size.H + .02, -.76)], .028, blue);
  const tOut = tube([new THREE.Vector3(1.05, UY + U.size.H + .02, -.76), new THREE.Vector3(1.0, 2.3, -.8), new THREE.Vector3(.96, 2.85, -.79), new THREE.Vector3(FX, TOP - .02, FZ)], .028, wtube);
  const tWaste = tube([new THREE.Vector3(.05, UY + U.size.H + .02, -.8), new THREE.Vector3(-.15, 1.95, -.86), new THREE.Vector3(-.35, 1.8, -.8), new THREE.Vector3(SX + .05, 1.73, -.75)], .024, black);
  const tPow = tube([new THREE.Vector3(UX + U.size.W / 2 - .02, UY + .3, UZ), new THREE.Vector3(1.6, .7, -.55), new THREE.Vector3(1.6, 1.2, -.4), new THREE.Vector3(CW / 2 - T - .04, 1.42, -.35)], .016, black);
  cab.add(tIn, tOut, tWaste, tPow);
  // glass + water
  const glass = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(.13, 0), new THREE.Vector2(.15, .42), new THREE.Vector2(.145, .42), new THREE.Vector2(.125, .015), new THREE.Vector2(0, .015)], 40),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: .95, roughness: .05, thickness: .05, transparent: true, opacity: .55 }));
  const GX = FX, GZ = FZ + .38; glass.position.set(GX, TOP, GZ); cab.add(glass);
  const waterMat = new THREE.MeshPhysicalMaterial({ color: 0x9fdcf0, transmission: .6, roughness: .05, transparent: true, opacity: .75 });
  const inGlass = new THREE.Mesh(new THREE.CylinderGeometry(.13, .12, 1, 32), waterMat); inGlass.position.set(GX, TOP, GZ); cab.add(inGlass);
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, 1, 16), waterMat); cab.add(stream);
  // measuring lines (step 1)
  const dimMat = new THREE.LineBasicMaterial({ color: 0xc89a4e, transparent: true });
  const dims = new THREE.Group(); cab.add(dims);
  const L = (a, b) => dims.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), dimMat));
  L(new THREE.Vector3(-CW / 2 + T, .25, CD / 2 - .05), new THREE.Vector3(CW / 2 - T, .25, CD / 2 - .05));
  L(new THREE.Vector3(-CW / 2 + T + .05, .16, CD / 2 - .05), new THREE.Vector3(-CW / 2 + T + .05, CH - .82, CD / 2 - .05));
  L(new THREE.Vector3(CW / 2 - T - .05, .2, -CD / 2 + T), new THREE.Vector3(CW / 2 - T - .05, .2, CD / 2 - .05));
  // pins
  const ES = document.documentElement.lang.startsWith('es'), tx = (es, en) => ES ? es : en;
  const pins = {
    space: S.tag(tx('Espacio', 'Space')), water: S.tag(tx('Agua', 'Water')), drain: S.tag(tx('Desagüe', 'Drain')), power: S.tag(tx('Enchufe', 'Socket')),
    unit: S.tag('Waterdrop ' + (opts.model === 'x16' ? 'X16' : 'X12'), 'dk'), faucet: S.tag(tx('Grifo inteligente', 'Smart faucet'), 'dk'),
    ready: S.tag(tx('Agua lista ✓', 'Water ready ✓'), 'gd'), nf: S.tag(tx('Instalado por NASFECO', 'Installed by NASFECO'), 'gd')
  };
  pins.space.p.set(0, .45, CD / 2); pins.water.p.set(.15, 2.2, -CD / 2 + .2); pins.drain.p.set(SX, 1.45, -.2); pins.power.p.set(CW / 2 - .15, 1.75, -.35);
  pins.unit.p.set(UX, UY + U.size.H + .25, UZ); pins.faucet.p.set(FX, TOP + 1.42, FZ); pins.ready.p.set(GX, TOP + .75, GZ + .2); pins.nf.p.set(0, TOP + 1.9, 0);
  // camera path: [position, target] for each step
  const K = [[[3.8, 3.9, 8.4], [0, 1.9, 0]], [[.4, 2.3, 6.2], [0, 1.4, 0]], [[3.0, 1.9, 5.0], [.4, 1.0, -.3]], [[2.4, 4.9, 3.6], [.6, 3.4, -.5]],
             [[-1.1, 2.4, 5.4], [.35, 1.6, -.5]], [[2.6, 4.3, 2.8], [.9, 3.45, -.5]], [[4.4, 4.2, 8.6], [0, 2.1, 0]]];
  const P = new THREE.Vector3(), Tg = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
  let t = 0;
  function frame(now) {
    // camera between keyframes
    const i = Math.min(K.length - 2, Math.floor(t)), f = ease(t - i);
    P.fromArray(K[i][0]).lerp(a.fromArray(K[i + 1][0]), f); Tg.fromArray(K[i][1]).lerp(b.fromArray(K[i + 1][1]), f);
    const asp = S.aspect(), far = asp < 1 ? Math.min(2.1, .45 + .85 / asp) : asp < 1.3 ? 1.15 : 1;
    cam.position.copy(Tg).add(P.sub(Tg).multiplyScalar(far)); cam.lookAt(Tg);
    // 0→1 open the cabinet and measure
    const open = seg(t, .05, .7); doors.forEach(({ pv, s }) => pv.rotation.y = s * open * 1.95);
    const m = seg(t, .45, .95) * (1 - seg(t, 1.6, 2)); dimMat.opacity = m; dims.visible = m > .01;
    pins.space.on = pins.water.on = pins.drain.on = pins.power.on = t > .8 && t < 1.85;
    // 1→2 the system slides in
    const u = seg(t, 1.05, 1.9); unit.visible = t > 1; unit.position.set(UX + (1 - seg(t, 1.05, 1.5)) * 3, UY + Math.sin(u * Math.PI) * .12, UZ + (1 - u) * 2.6); pins.unit.on = t > 1.7 && t < 2.6;
    // 2→3 the smart faucet goes onto the countertop
    const fz = seg(t, 2.05, 2.85); fau.position.set(FX, TOP + (1 - fz) * 2.2, FZ); fau.visible = t > 2; pins.faucet.on = t > 2.7 && t < 3.6;
    // 3→4 water in, purified water out, drain and power
    grow(tIn, seg(t, 3.05, 3.4)); grow(tOut, seg(t, 3.3, 3.65)); grow(tWaste, seg(t, 3.5, 3.8)); grow(tPow, seg(t, 3.7, 3.95));
    // 4→5 check: light ring, water into the glass
    const w = seg(t, 4.15, 4.9), on = t > 4.1;
    F.ring.material.emissiveIntensity = on ? 1.2 + Math.sin(now * 3) * .4 : .15;
    glass.visible = inGlass.visible = t > 3.9;
    const top = TOP + 1.02, bot = TOP + .02 + w * .34;
    stream.visible = on && w < .999; stream.scale.y = Math.max(.001, top - bot); stream.position.set(GX, (top + bot) / 2, GZ);
    inGlass.scale.y = Math.max(.001, w * .34); inGlass.position.y = TOP + .015 + w * .17;
    pins.ready.on = t > 4.75 && t < 5.7; pins.nf.on = t > 5.6;
    vCold.children[1].material.emissive && (vCold.children[1].material.emissive.setHex(pins.water.on ? 0x0a2a55 : 0));
  }
  frame(0); S.run(frame);
  return { set(p) { t = clamp(p) * (K.length - 1); } };
}

/* ================================================================ welcome kit */
export async function createKit(el, opts = {}) {
  const S = stage(el, { exposure: 1.15, fov: 30 }); if (!S) return null;
  const { scene, cam } = S;
  try { await document.fonts.load('700 40px "Plus Jakarta Sans"'); } catch (e) {}
  // NASFECO España kit (client photo): cream canvas and burgundy details; the gift box keeps the site's night blue
  const [mw, mc, lw, lc] = await Promise.all([loadImg(opts.markWhite), loadImg(opts.markColor), loadImg(opts.logoWhite), loadImg(opts.logoColor)]);
  const mn = mc, tx = (es, en) => document.documentElement.lang.startsWith('es') ? es : en;
  const GOLD = '#d5b581', NAVY = '#0f2433', CREAM = '#efe6d6', WINE = '#6e1020';
  const full = (g, img, cx, cy, w) => { if (!img) return; const h = w * img.naturalHeight / img.naturalWidth; g.drawImage(img, cx - w / 2, cy - h / 2, w, h); };
  const shadowFloor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: .35 })); shadowFloor.rotation.x = -Math.PI / 2; shadowFloor.receiveShadow = true; scene.add(shadowFloor);
  const fill = new THREE.PointLight(0xd5b581, 6, 12); fill.position.set(-3, 2.5, 3); scene.add(fill);
  const kit = new THREE.Group(); scene.add(kit);
  const logo = (g, x, y, h, col) => { const img = col === 'navy' ? (mn || mw) : mw; if (!img) return; const c = col === 'navy' ? (mn ? img : tinted(img, NAVY)) : tinted(img, col); const w = h * img.naturalWidth / img.naturalHeight; g.drawImage(c, x - w / 2, y - h / 2, w, h); };
  // gift box
  const navy = mat(0x0f2433, { roughness: .55 }), BW = 3.2, BD = 2.1, BH = 1.0, th = .05;
  const boxG = new THREE.Group(); kit.add(boxG);
  const bb = box(BW, th, BD, navy); bb.position.y = th / 2; boxG.add(bb);
  [[0, BD / 2, BW, th], [0, -BD / 2, BW, th]].forEach(([x, z, w, d]) => { const p = box(w, BH, d, navy); p.position.set(x, BH / 2, z); boxG.add(p); });
  [[BW / 2], [-BW / 2]].forEach(([x]) => { const p = box(th, BH, BD, navy); p.position.set(x, BH / 2, 0); boxG.add(p); });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), new THREE.MeshStandardMaterial({ roughness: .55, map: canvasTex(1024, 320, (g, W, H) => { g.fillStyle = NAVY; g.fillRect(0, 0, W, H); full(g, lw, W / 2, H / 2, 560); }) }));
  front.position.set(0, BH / 2, BD / 2 + th / 2 + .002); boxG.add(front);
  const tissue = new THREE.Mesh(new THREE.PlaneGeometry(BW - .1, BD - .1), mat(0xf3ede2, { roughness: 1 })); tissue.rotation.x = -Math.PI / 2; tissue.position.y = .3; boxG.add(tissue);
  const lid = new THREE.Group(); kit.add(lid);
  const lidM = box(BW + .1, .22, BD + .1, navy, .02); lid.add(lidM);
  const lidTop = new THREE.Mesh(new THREE.PlaneGeometry(BW + .05, BD + .05), new THREE.MeshStandardMaterial({ roughness: .5, map: canvasTex(1024, 680, (g, W, H) => { g.fillStyle = NAVY; g.fillRect(0, 0, W, H); g.fillStyle = GOLD; g.fillRect(W / 2 - 40, 0, 80, H); g.fillRect(0, H / 2 - 40, W, 80); g.beginPath(); g.arc(W / 2, H / 2, 120, 0, Math.PI * 2); g.fillStyle = NAVY; g.fill(); g.lineWidth = 6; g.strokeStyle = GOLD; g.stroke(); logo(g, W / 2, H / 2, 130, GOLD); }) }));
  lidTop.rotation.x = -Math.PI / 2; lidTop.position.y = .111; lid.add(lidTop);
  // tote bag
  const tote = new THREE.Group(); kit.add(tote);
  const tw = 1.7, tH = 1.35, td = .42;
  const toteFace = canvasTex(800, 640, (g, W, H) => { g.fillStyle = CREAM; g.fillRect(0, 0, W, H); g.globalAlpha = .07; for (let y = 0; y < H; y += 4) { g.fillStyle = y % 8 ? '#fff' : '#8a7a60'; g.fillRect(0, y, W, 2); } g.globalAlpha = 1;
    g.fillStyle = WINE; g.fillRect(0, H * .8, W, H * .2); [W * .3, W * .7].forEach(x => g.fillRect(x - 22, 0, 44, H * .8)); full(g, lc, W / 2, H * .5, 470); });
  const fabric = mat(0xefe6d6, { roughness: .95 });
  const tb = box(tw, tH, td, [fabric, fabric, fabric, fabric, new THREE.MeshStandardMaterial({ map: toteFace, roughness: .95 }), fabric]); tb.position.y = tH / 2; tote.add(tb);
  const leather = mat(0x6e1020, { roughness: .7 });
  [-1, 1].forEach(s => { const h = new THREE.Mesh(new THREE.TorusGeometry(.36, .035, 10, 40, Math.PI), leather); h.scale.set(1, 1.35, .6); h.position.set(0, tH, s * td * .32); h.castShadow = true; tote.add(h); });
  // personalised bottle: cream with a burgundy cap
  const owala = new THREE.Group(); kit.add(owala);
  const prof = []; for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI / 2; prof.push(new THREE.Vector2(.19 - .04 + Math.sin(a) * .04, .04 - Math.cos(a) * .04 + .04)); } prof.push(new THREE.Vector2(.19, 1.0), new THREE.Vector2(.18, 1.02), new THREE.Vector2(0, 1.02)); prof.unshift(new THREE.Vector2(0, 0));
  const bottleTex = canvasTex(1024, 512, (g, W, H) => { g.fillStyle = '#f3ede2'; g.fillRect(0, 0, W, H); if (mc) { const h = 150, w = h * mc.naturalWidth / mc.naturalHeight; g.drawImage(mc, W * .5 - w / 2, H * .38 - h / 2, w, h); }
    g.fillStyle = WINE; g.font = `800 58px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('NASFECO', W * .5, H * .64); g.font = `700 22px ${FONT}`; g.fillText('E S P A Ñ A', W * .5, H * .74); });
  bottleTex.wrapS = THREE.RepeatWrapping; bottleTex.offset.x = .25;
  const bottle = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), new THREE.MeshPhysicalMaterial({ map: bottleTex, roughness: .45, metalness: .1, clearcoat: .3 })); bottle.castShadow = true; owala.add(bottle);
  const wine = mat(0x6e1020, { roughness: .45 }), sand = mat(0xd9c6a0, { roughness: .5 });
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.19, .19, .2, 64), wine); cap.position.y = 1.12; owala.add(cap);
  const capTop = box(.3, .16, .3, sand, .08); capTop.position.y = 1.28; owala.add(capTop);
  const loop = new THREE.Mesh(new THREE.TorusGeometry(.1, .025, 10, 30), wine); loop.position.set(0, 1.38, -.06); owala.add(loop);
  const spout = box(.1, .14, .12, wine, .03); spout.position.set(0, 1.35, .14); owala.add(spout);
  // embroidered towel with ribbon
  const towel = new THREE.Group(); kit.add(towel);
  const terry = canvasTex(512, 256, (g, W, H) => { g.fillStyle = '#f4efe5'; g.fillRect(0, 0, W, H); for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(160,140,110,${Math.random() * .12})`; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); } g.fillStyle = 'rgba(160,140,110,.18)'; g.fillRect(W * .78, 0, 26, H); logo(g, W * .42, H * .52, 92, 'navy'); });
  const towelM = new THREE.MeshStandardMaterial({ map: terry, roughness: 1 });
  const plainT = new THREE.MeshStandardMaterial({ map: canvasTex(256, 128, (g, W, H) => { g.fillStyle = '#f4efe5'; g.fillRect(0, 0, W, H); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(160,140,110,${Math.random() * .12})`; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); } }), roughness: 1 });
  const tl = box(1.35, .42, .85, [plainT, plainT, plainT, plainT, towelM, plainT], .16); tl.position.y = .21; towel.add(tl);
  const ribbon = box(.12, .44, .87, mat(0x6e1020, { roughness: .6 })); ribbon.position.set(.45, .21, 0); towel.add(ribbon);
  // two replacement filters, in their NASFECO boxes
  const filters = new THREE.Group(); kit.add(filters);
  const fBox = canvasTex(256, 512, (g, W, H) => { g.fillStyle = '#f3ede2'; g.fillRect(0, 0, W, H); if (mc) { const h = 70, w = h * mc.naturalWidth / mc.naturalHeight; g.drawImage(mc, W / 2 - w / 2, H * .2 - h / 2, w, h); }
    g.fillStyle = WINE; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 30px ${FONT}`; g.fillText('NASFECO', W / 2, H * .32); g.fillStyle = '#5b4a3a'; g.font = `600 17px ${FONT}`; g.fillText(tx('FILTRO DE', 'REPLACEMENT'), W / 2, H * .5); g.fillText(tx('REPUESTO', 'FILTER'), W / 2, H * .55);
    g.beginPath(); g.moveTo(0, H * .86); g.quadraticCurveTo(W * .5, H * .78, W, H * .7); g.lineTo(W, H); g.lineTo(0, H); g.fillStyle = WINE; g.fill(); g.beginPath(); g.moveTo(0, H * .86); g.quadraticCurveTo(W * .5, H * .78, W, H * .7); g.lineWidth = 10; g.strokeStyle = GOLD; g.stroke(); });
  const fPlain = mat(0xf3ede2, { roughness: .6 });
  [-1, 1].forEach(s => { const f = box(.3, .62, .22, [fPlain, fPlain, fPlain, fPlain, new THREE.MeshStandardMaterial({ map: fBox, roughness: .6 }), fPlain], .01); f.position.set(s * .19, .31, 0); f.castShadow = true; filters.add(f); });
  // where each piece ends up
  const items = [
    { g: tote, to: [-1.75, 0, -.35], ry: .3, label: opts.labels?.tote },
    { g: owala, to: [-.45, 0, .65], ry: -.35, label: opts.labels?.owala },
    { g: towel, to: [.85, 0, .55], ry: -.3, label: opts.labels?.towel },
    { g: filters, to: [2.05, 0, -.35], ry: .2, label: opts.labels?.filters }];
  items.forEach((it, i) => { it.tag = S.tag(it.label || '', 'kt'); it.d = i * .12; });
  const heights = { tote: 2.1, owala: 1.95, towel: .85, filters: 1.1 };
  items[0].h = heights.tote; items[1].h = heights.owala; items[2].h = heights.towel; items[3].h = heights.filters;
  const ctl = new OrbitControls(cam, S.renderer.domElement); ctl.enablePan = false; ctl.enableZoom = false; ctl.enableDamping = true; ctl.target.set(.15, .75, 0);
  ctl.minPolarAngle = .6; ctl.maxPolarAngle = 1.45; S.renderer.domElement.style.touchAction = 'pan-y';
  cam.position.set(0, 3.4, 7.6);
  let t0 = null, play = false;
  function frame(now) {
    const want = el.clientWidth < 600 ? 9.6 : el.clientWidth < 1000 ? 9.2 : 7 * Math.max(1, Math.min(2.2, 1.25 / S.aspect()));
    const dist = cam.position.distanceTo(ctl.target); if (Math.abs(dist - want) > .01) cam.position.sub(ctl.target).setLength(want).add(ctl.target);
    const t = play ? now - t0 : 0;
    // lid lifts and slides back
    const l = seg(t, .2, 1.4); lid.position.set(0, BH + .11 + l * 4.5, -l * 3.5); lid.rotation.x = -l * 1.1; lid.visible = l < .999;
    // the open box steps back and stays as a backdrop
    const back = seg(t, 2.3, 3.1); boxG.position.set(0, 0, -back * 3); boxG.scale.setScalar(Math.max(.001, 1 - back)); boxG.visible = back < .999;
    items.forEach(it => {
      const up = seg(t, 1.0 + it.d, 1.9 + it.d), out = seg(t, 1.7 + it.d, 2.9 + it.d);
      const x = it.to[0] * (.4 + .6 * out), z = it.to[2] * (.3 + .7 * out), y = (1 - out) * (.06 + up * 1.15);
      it.g.position.set(x, y, z); it.g.scale.setScalar(1 + out * .22);
      it.g.rotation.y = it.ry * out + (1 - out) * up * 1.2;
      it.g.visible = up > .001; it.tag.on = t > 3 + it.d * 2;
      it.tag.p.set(it.g.position.x, it.h, it.g.position.z);
    });
    ctl.autoRotate = t > 3.4; ctl.autoRotateSpeed = .6; ctl.update();
  }
  S.run(frame);
  const api = { play() { t0 = performance.now() / 1000; play = true; } };
  return api;
}
