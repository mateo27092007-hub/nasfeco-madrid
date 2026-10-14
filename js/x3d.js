/* =========================================================
   NASFECO · 3D viewer for Waterdrop X12 / X16
   Procedural model built from the official dimensions:
   46.23 × 15.88 × 42.47 cm (Waterdrop European product sheet); kept internally in inches for the geometry.
   ========================================================= */
import * as THREE from './vendor/three/three.module.min.js';
import { OrbitControls } from './vendor/three/OrbitControls.js';
import { RoundedBoxGeometry } from './vendor/three/RoundedBoxGeometry.js';
import { RoomEnvironment } from './vendor/three/RoomEnvironment.js';

export const DIM = { w: 18.2, d: 6.25, h: 16.72 };           // inches (width of logo face, depth, height)
const IN = 1 / 10;                                           // 10 in = 1 scene unit
const BODY = { white: { body: 0xf3f4f5, side: 0xe4e6e8, ink: '#5b6168', line: 'rgba(0,0,0,.12)' },
               black: { body: 0x2b2e33, side: 0x22252a, ink: '#9aa1a8', line: 'rgba(255,255,255,.12)' } };
const MODEL = { x12: { label: '1200G', name: 'X12' }, x16: { label: '1600G', name: 'X16' } };
const look = (model, body) => ({ ...BODY[body], ...MODEL[model] });
const FAUCET = { silver: { color: 0xe6e9ec, metal: .72, rough: .2 }, black: { color: 0x1f2226, metal: .55, rough: .42 } };

function faceTexture(model, bodyC) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round(1024 * DIM.h / DIM.w);
  const g = c.getContext('2d'), L = look(model, bodyC), W = c.width, H = c.height;
  g.fillStyle = '#' + L.body.toString(16).padStart(6, '0'); g.fillRect(0, 0, W, H);
  // NSF seal
  g.save(); g.translate(W * .5, H * .3);
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, 0, 70, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#1f6fd1'; g.lineWidth = 9; g.beginPath(); g.arc(0, 0, 66, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#1f6fd1'; g.font = '700 26px Arial'; g.textAlign = 'center'; g.fillText('NSF/ANSI', 0, 2); g.font = '700 18px Arial'; g.fillText('42 & 58 & 372', 0, 28); g.restore();
  // brand + capacity
  g.fillStyle = L.ink; g.textAlign = 'center'; g.font = '300 92px Arial'; g.fillText('Waterdrop', W * .5, H * .58);
  g.lineWidth = 4; g.strokeStyle = L.ink; const bw = 150, bh = 44, bx = W * .5 - bw / 2, by = H * .66;
  g.beginPath(); g.roundRect(bx, by, bw, bh, 22); g.stroke(); g.font = '700 30px Arial'; g.fillText(L.label, W * .5, by + 33);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function sideTexture(model, bodyC) {
  const c = document.createElement('canvas'); c.width = 384; c.height = Math.round(384 * DIM.h / DIM.d);
  const g = c.getContext('2d'), L = look(model, bodyC), W = c.width, H = c.height;
  g.fillStyle = '#' + L.side.toString(16).padStart(6, '0'); g.fillRect(0, 0, W, H);
  g.strokeStyle = L.line; g.lineWidth = 3;
  g.beginPath(); g.moveTo(W * .95, 0); g.lineTo(W * .1, H); g.stroke();
  g.beginPath(); g.moveTo(0, H * .22); g.lineTo(W * .62, H * .37); g.stroke();
  g.fillStyle = L.ink; g.font = '700 30px Arial'; g.textAlign = 'left'; g.fillText(L.name, W * .12, H * .95);
  g.font = '400 16px Arial'; g.fillText('Waterdrop', W * .36, H * .935);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* the system itself (body + printed faces); shared by every 3D scene */
export function makeUnit() {
  const W = DIM.w * IN, D = DIM.d * IN, H = DIM.h * IN;
  const unit = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({ roughness: .32, metalness: .05, clearcoat: .5, clearcoatRoughness: .25 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 6, .07), bodyMat); body.position.y = H / 2; body.castShadow = true; body.receiveShadow = true; unit.add(body);
  const faceMat = new THREE.MeshPhysicalMaterial({ roughness: .3, clearcoat: .4 });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(W * .94, H * .94), faceMat); face.position.set(0, H / 2, D / 2 + .002); unit.add(face);
  const sideMat = new THREE.MeshPhysicalMaterial({ roughness: .32, clearcoat: .4 });
  const side = new THREE.Mesh(new THREE.PlaneGeometry(D * .9, H * .94), sideMat); side.rotation.y = -Math.PI / 2; side.position.set(-W / 2 - .002, H / 2, 0); unit.add(side);
  return { group: unit, size: { W, D, H }, set(model, bodyC) {
    const L = look(model, bodyC); bodyMat.color.setHex(L.body);
    faceMat.map && faceMat.map.dispose(); faceMat.map = faceTexture(model, bodyC); faceMat.needsUpdate = true;
    sideMat.map && sideMat.map.dispose(); sideMat.map = sideTexture(model, bodyC); sideMat.needsUpdate = true;
  } };
}
/* smart faucet with its light ring (sits on the countertop) */
export function makeFaucet() {
  const fau = new THREE.Group(), fMat = new THREE.MeshStandardMaterial();
  const col = new THREE.Mesh(new THREE.CylinderGeometry(.075, .085, 1.05, 48), fMat); col.position.y = .525; col.castShadow = true; fau.add(col);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(.095, .095, .12, 48), fMat); head.position.y = 1.1; fau.add(head);
  const arm = new THREE.Mesh(new RoundedBoxGeometry(.42, .1, .16, 4, .045), fMat); arm.position.set(-.2, 1.07, 0); arm.castShadow = true; fau.add(arm);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.07, .012, 12, 48), new THREE.MeshStandardMaterial({ color: 0x7fd3ff, emissive: 0x3aa8ff, emissiveIntensity: 1.2 })); ring.rotation.x = Math.PI / 2; ring.position.y = 1.165; fau.add(ring);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .03, 48), fMat); base.position.y = .015; fau.add(base);
  return { group: fau, ring, spout: new THREE.Vector3(-.38, 1.02, 0), set(f) { const F = FAUCET[f]; fMat.color.setHex(F.color); fMat.metalness = F.metal; fMat.roughness = F.rough; } };
}
/* glowing pedestal under the system (hero) */
function glowTex(stops) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function makeStage() {
  const g = new THREE.Group();
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshBasicMaterial({ map: glowTex([[0, 'rgba(201,161,91,.38)'], [.4, 'rgba(201,161,91,.12)'], [1, 'rgba(201,161,91,0)']]), transparent: true, depthWrite: false }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = -.004; g.add(glow);
  const mk = (r, w, col, o) => { const m = new THREE.Mesh(new THREE.RingGeometry(r, r + w, 128), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: o, depthWrite: false, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.y = .002; g.add(m); return m; };
  mk(1.55, .012, 0xd5b581, .9); mk(1.75, .006, 0x6b0f1a, .35); mk(2.2, .004, 0xd5b581, .25);
  return g;
}
/* drifting water particles around the system */
function makeDrops() {
  const n = 160, pos = new Float32Array(n * 3), seed = [];
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, r = 1.6 + Math.random() * 2.6; seed.push([a, r, Math.random() * 3.2, .15 + Math.random() * .35]); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: .05, map: glowTex([[0, 'rgba(201,161,91,1)'], [.3, 'rgba(201,161,91,.6)'], [1, 'rgba(201,161,91,0)']]), transparent: true, depthWrite: false, color: 0xc9a15b }));
  pts.userData.tick = t => { for (let i = 0; i < n; i++) { const [a, r, y0, sp] = seed[i], aa = a + t * .05 * sp; pos[i * 3] = Math.cos(aa) * r; pos[i * 3 + 2] = Math.sin(aa) * r - .5; pos[i * 3 + 1] = (y0 + t * sp * .35) % 3.4; } geo.attributes.position.needsUpdate = true; };
  return pts;
}

export function createViewer(el, opts = {}) {
  const state = { model: opts.model || 'x12', body: opts.body || ((opts.model || 'x12') === 'x16' ? 'black' : 'white'), faucet: opts.faucet || 'silver', units: 'cm', cabinet: null, auto: opts.autoRotate !== false };
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { el.classList.add('no3d'); return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 760 ? 1.5 : 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  el.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  const cam = new THREE.PerspectiveCamera(32, 1, .1, 100); cam.position.set(4.2, 2.6, 5.2);
  const ctl = new OrbitControls(cam, renderer.domElement);
  ctl.enableDamping = true; ctl.enablePan = false; ctl.minDistance = 3; ctl.maxDistance = 11; ctl.target.set(0, .85, 0);
  ctl.autoRotate = state.auto; ctl.autoRotateSpeed = .8; ctl.maxPolarAngle = Math.PI * .52;
  ctl.addEventListener('start', () => { ctl.autoRotate = false; });
  renderer.domElement.style.touchAction = 'pan-y';                 // phones: vertical swipe scrolls the page, sideways drag turns the system
  scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, .55));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(4, 6, 5); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -4; key.shadow.camera.right = 4; key.shadow.camera.top = 4; key.shadow.camera.bottom = -4; scene.add(key);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: opts.stage ? .45 : .18 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  const root = new THREE.Group(); scene.add(root);
  const W = DIM.w * IN, D = DIM.d * IN, H = DIM.h * IN;
  const U = makeUnit(), F = makeFaucet();
  const unit = U.group; root.add(unit);
  const fau = F.group, ring = F.ring; root.add(fau); fau.position.set(W / 2 + .75, 0, .25);
  if (opts.stage) scene.add(makeStage());
  const drops = opts.stage ? makeDrops() : null; drops && scene.add(drops);

  // dimension lines (drawn in 3D, labels as HTML)
  const dimMat = new THREE.LineBasicMaterial({ color: 0xd5b581 });
  const dims = new THREE.Group(); root.add(dims);
  const seg = (a, b) => { const g = new THREE.BufferGeometry().setFromPoints([a, b]); dims.add(new THREE.Line(g, dimMat)); };
  const dimLine = (a, b, tick) => { seg(a, b); seg(a.clone().sub(tick), a.clone().add(tick)); seg(b.clone().sub(tick), b.clone().add(tick)); };
  const o = .22;
  dimLine(new THREE.Vector3(-W / 2, -0.001, D / 2 + o), new THREE.Vector3(W / 2, -0.001, D / 2 + o), new THREE.Vector3(0, 0, .06));
  dimLine(new THREE.Vector3(-W / 2 - o, 0, D / 2), new THREE.Vector3(-W / 2 - o, H, D / 2), new THREE.Vector3(.06, 0, 0));
  dimLine(new THREE.Vector3(-W / 2 - o, -0.001, -D / 2), new THREE.Vector3(-W / 2 - o, -0.001, D / 2), new THREE.Vector3(.06, 0, 0));
  const labels = [
    { p: new THREE.Vector3(0, 0, D / 2 + o + .12), k: 'w' }, { p: new THREE.Vector3(-W / 2 - o - .1, H / 2, D / 2), k: 'h' }, { p: new THREE.Vector3(-W / 2 - o - .14, 0, 0), k: 'd' }
  ].map(l => { const s = document.createElement('span'); s.className = 'x3-dim'; el.appendChild(s); return { ...l, s }; });
  const fauLabel = document.createElement('span'); fauLabel.className = 'x3-tag'; el.appendChild(fauLabel);

  // cabinet (optional): translucent box showing the customer's space
  const cab = new THREE.Group(); root.add(cab); cab.visible = false;
  const cabMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xd5b581, transparent: true, opacity: .07, depthWrite: false }));
  const cabEdges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: 0x94702f, transparent: true, opacity: .8 }));
  cab.add(cabMesh, cabEdges);

  function fmt(v) { const s = (v * 2.54).toFixed(1) + ' cm'; return document.documentElement.lang.startsWith('es') ? s.replace('.', ',') : s; }   // Spain: metric only
  function apply() {
    U.set(state.model, state.body); F.set(state.faucet);
    labels.forEach(l => { l.s.textContent = fmt(DIM[l.k]); });
    fauLabel.textContent = opts.faucetLabel != null ? opts.faucetLabel : '';
  }
  function setCabinet(c) {
    state.cabinet = c; cab.visible = !!c; if (!c) return fit();
    cab.scale.set(c.w * IN, c.h * IN, c.d * IN); cab.position.set(0, c.h * IN / 2, 0);
    const okW = c.w >= DIM.w, okD = c.d >= DIM.d, okH = c.h >= DIM.h, rot = c.w >= DIM.d && c.d >= DIM.w;
    unit.rotation.y = (!(okW && okD) && rot) ? Math.PI / 2 : 0;
    const ok = ((okW && okD) || rot) && okH;
    cabEdges.material.color.setHex(ok ? 0x94702f : 0xa3261e); cabMesh.material.color.setHex(ok ? 0xc9a15b : 0xa3261e);
    fit(); return { ok, rotated: unit.rotation.y !== 0, spare: { w: c.w - (unit.rotation.y ? DIM.d : DIM.w), d: c.d - (unit.rotation.y ? DIM.w : DIM.d), h: c.h - DIM.h } };
  }
  function fit() {
    const box = new THREE.Box3().setFromObject(cab.visible ? cab : root); const size = box.getSize(new THREE.Vector3()).length();
    ctl.target.copy(box.getCenter(new THREE.Vector3())); ctl.maxDistance = Math.max(11, size * 3);
    const dir = cam.position.clone().sub(ctl.target).normalize(); cam.position.copy(ctl.target).add(dir.multiplyScalar(size * 1.55 + 1.2));
  }
  function resize() { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  const v = new THREE.Vector3();
  function place(sp, p) { v.copy(p).applyMatrix4(root.matrixWorld).project(cam); sp.style.transform = `translate(-50%,-50%) translate(${(v.x * .5 + .5) * el.clientWidth}px,${(-v.y * .5 + .5) * el.clientHeight}px)`; sp.style.opacity = v.z < 1 ? 1 : 0; }
  let visible = true, raf = 0;
  function loop() {
    raf = requestAnimationFrame(loop); if (!visible) return;
    ctl.update(); ring.material.emissiveIntensity = 1 + Math.sin(performance.now() / 500) * .35; drops && drops.userData.tick(performance.now() / 1000);
    renderer.render(scene, cam);
    labels.forEach(l => place(l.s, l.p)); place(fauLabel, new THREE.Vector3(fau.position.x, 1.35, fau.position.z));
  }
  new ResizeObserver(resize).observe(el);
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(el);
  apply(); resize(); fit(); loop();
  return {
    setModel(m) { state.model = m; apply(); }, setBody(b) { state.body = b; apply(); }, setFaucet(f) { state.faucet = f; apply(); },
    setUnits(u) { state.units = u; apply(); }, setCabinet, fmt,
    spin(angle) { ctl.autoRotate = false; root.rotation.y = angle; },
    showDims(on) { dims.visible = on; labels.forEach(l => l.s.hidden = !on); },
    setFaucetLabel(t) { opts.faucetLabel = t; apply(); }
  };
}
