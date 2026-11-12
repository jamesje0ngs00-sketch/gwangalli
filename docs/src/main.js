// 광안리 — 광안대교를 바라보는 해변, 낮부터 밤까지 펜 선으로.
// 해나 달을 끌면 시간이 바뀌고, 포인터를 움직이면 바닷바람이 분다.
// 다리 → 조명 연출 · 바다 → 큰 파도 · 사람·강아지·갈매기·요트 → 저마다의 반응 · 밤하늘 → 드론쇼
import { el, inkDefs, run } from '../lib/ink.js';
import { palette, applyPalette, rgb,              } from '../lib/daynight.js';
import { pointerWind } from '../lib/motion.js';
import { W, H, HORIZON, rnd } from './kit.js';
import { createSky } from './sky.js';
import { buildBridge, BRIDGE_LIGHT_XS, T1, T2 } from './bridge.js';
import { buildSea } from './sea.js';
import { createStroller } from './stroller.js';
import { createCouple, createJogger, createDogWalker,             } from './walkers.js';
import { createKid, createBusker, createPicnic } from './beachfolk.js';
import { createGulls, createYacht, createDrones } from './extras.js';

const q = new URLSearchParams(location.search);
const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': '광안대교가 보이는 광안리 해변을 펜으로 그린 그림. 낮에서 밤으로 바뀐다.' });
const ink = inkDefs(svg, 'b');
document.querySelector('#scene') .appendChild(svg);
const defs = ink.defs;
const blur = el('filter', { id: 'b-blur', x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs);
el('feGaussianBlur', { stdDeviation: 2.2 }, blur);

const layer = (parent         , attrs                         = {}) => el('g', attrs, parent);
const skyL = layer(svg);
const scene = layer(svg, { filter: ink.filter });
const farL = layer(scene), seaL = layer(scene), bridgeL = layer(scene), boatL = layer(scene), birdsL = layer(scene);
const sandL = layer(scene), shoreL = layer(scene), peopleL = layer(scene);
const glow = layer(svg, { style: 'mix-blend-mode:screen;pointer-events:none' });
const halo = layer(glow, { filter: 'url(#b-blur)' });

// ------------------------------------------------------------------ 시간
let tau = q.has('tau') ? +q.get('tau')  : q.has('start') ? +q.get('start')  : 0.72;
let scrub                = null, frozenTau = q.has('tau');
const DAY_SECONDS = q.has('day') ? +q.get('day')  : 180;
// 하루를 빨리 돌려도 사람 걸음은 그대로, 대신 더 자주 나타난다
const TRAFFIC = Math.max(1, Math.sqrt(180 / DAY_SECONDS));
const card = document.querySelector             ('#card') ;
if (q.has('capture')) document.body.classList.add('capture');

const hintN = document.querySelector('#hint') ;
const hint = { shown: true, done() { if (this.shown) { this.shown = false; hintN.classList.add('gone'); } } };
setTimeout(() => hint.done(), 14000);
const on = (node         , fn                           ) => node.addEventListener('pointerdown', (e) => { e.stopPropagation(); fn(e                ); hint.done(); });
const toSvg = (e              ) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM() .inverse()); };

// ------------------------------------------------------------------ 세계
const wind = pointerWind(svg, 0.3);
const sky = createSky(svg, skyL, farL, glow, defs, (v) => { scrub = v; if (v !== null) { tau = v; frozenTau = false; hint.done(); } });
const sea = buildSea({ sea: seaL, sand: sandL, shore: shoreL, glow }, defs);
const bridge = buildBridge({ bridge: bridgeL, glow, halo });
const yacht = createYacht(boatL, glow);
const gulls = createGulls(peopleL, birdsL);
const drones = createDrones(glow, defs);
const STRIPES = ink.stripes;

BRIDGE_LIGHT_XS.forEach((x) => sea.addRefl(x, 7, (t) => bridge.colourAt(x, t), () => bridge.lightsOn() * 0.8, 7));
[T1, T2].forEach((x) => sea.addRefl(x, 12, (t) => bridge.colourAt(x, t * 0.7), () => bridge.lightsOn()));
sea.addRefl(() => yacht.state.x - 2, 6, () => '#ffd58a', () => yacht.state.lit * 0.8, 5);
on(bridge.hit, () => bridge.poke());
on(sea.hit, (e) => { const p = toSvg(e); sea.poke(p.x, p.y); });
on(yacht.g, () => yacht.poke());
on(gulls.hit, () => gulls.flush());
skyL.addEventListener('pointerdown', (e) => { const p = toSvg(e                ); if (p.y < HORIZON - 30 && P.night > 0.45) { drones.start(); hint.done(); } });

// 잠시 머물다 가는 사람들: 날마다 조금씩 다른 시간에 와서 몇 시간 있다 간다
const kid = createKid(peopleL, glow, { x: 516, y: 349, washY: () => sea.washY }, STRIPES);
const busker = createBusker(peopleL, glow, { x: 800, y: 440 }, STRIPES);
const picnic = createPicnic(peopleL, glow, { x: 170, y: 448 }, STRIPES);
on(kid.g, () => kid.poke()); on(busker.g, () => busker.poke()); on(picnic.g, () => picnic.poke());
// 오는 시각(τ) 범위와 머무는 길이(τ). 0.01τ ≈ 14분
const VISITS = [
  { o: kid, start: [0.42, 0.5], len: [0.08, 0.12] },      // 오전 10시~정오에 와서 2~3시간
  { o: busker, start: [0.75, 0.8], len: [0.14, 0.18] },   // 저녁 6~7시에 와서 3시간 반~4시간
  { o: picnic, start: [0.73, 0.78], len: [0.17, 0.22] },  // 해 질 녘에 와서 4~5시간
];
const stay = VISITS.map((v) => ({ o: v.o, a: 0, b: 0, roll() { this.a = rnd(v.start[0], v.start[1]); this.b = (this.a + rnd(v.len[0], v.len[1])) % 1; } }));
stay.forEach((s) => s.roll());
const inWindow = (u        , a        , b        ) => (a < b ? u > a && u < b : u > a || u < b);
let lastDayTau = tau;

// 지나가는 사람들
const LANES = [370, 392, 414];
const people           = [];
                                                     
function addWalker(kind      , x         , dirIn         ) {
  const dir         = dirIn ?? (Math.random() < 0.5 ? 1 : -1);
  const sx = x ?? (dir > 0 ? -70 : W + 70);
  const busy = new Set(people.map((p) => p.y));
  const free = LANES.filter((l) => !busy.has(l));
  const y = (free.length ? free : LANES)[Math.floor(Math.random() * (free.length || LANES.length))];
  const p         = kind === 'stroller' ? createStroller(peopleL, glow, { x: sx, y, dir })                     
    : kind === 'couple' ? createCouple(peopleL, glow, { x: sx, y, dir }, STRIPES)
    : kind === 'jogger' ? createJogger(peopleL, { x: sx, y, dir }, STRIPES)
    : createDogWalker(peopleL, { x: sx, y, dir }, STRIPES);
  on(p.g, () => p.poke());
  people.push(p);
}
// 종류마다 나오는 시간대와 간격(초)
const SCHEDULE                                                                                     = {
  stroller: { next: 20, gap: [18, 30], when: (u) => (u > 0.22 && u < 0.98 ? 1 : 0.2) },
  couple: { next: 6, gap: [16, 26], when: (u) => (u > 0.62 || u < 0.04 ? 1 : u > 0.3 ? 0.5 : 0.1) },
  jogger: { next: 10, gap: [14, 24], when: (u) => ((u > 0.24 && u < 0.38) || (u > 0.7 && u < 0.86) ? 1 : 0.25) },
  dog: { next: 3, gap: [20, 34], when: (u) => (u > 0.28 && u < 0.84 ? 1 : 0.1) },
};
let started = false, lastTau = tau;

// ------------------------------------------------------------------ 시계
const clock = document.querySelector('#clock') ;
const period = (h        ) => (h < 4 ? '깊은 밤' : h < 6 ? '새벽' : h < 10 ? '아침' : h < 15 ? '낮' : h < 17.5 ? '오후' : h < 19.5 ? '해 질 녘' : '밤');

// ------------------------------------------------------------------ 프레임
let P          = palette(tau);
run((t, dt) => {
  dt = dt || 1 / 60;
  if (scrub === null && !frozenTau) tau = (tau + dt / DAY_SECONDS) % 1;
  P = palette(tau);
  applyPalette(svg, P);
  card.style.setProperty('--ink', rgb(P.ink));
  wind.step(t);

  sky.draw(tau, t, dt, P, wind.value);
  sea.draw(t, dt, P, wind.value);
  bridge.draw(t, dt, P);
  yacht.draw(t, dt, P, wind.value);
  gulls.draw(t, dt, P, wind.value, tau > 0.79 || tau < 0.24); // 밤에는 잠자리로 날아간다
  // 밤 9시가 되면 드론쇼가 한 번 열린다
  if (lastTau < 0.875 && tau >= 0.875 && !frozenTau) drones.start();
  lastTau = tau;
  drones.draw(t, dt, P);

  if (!started) {
    started = true;
    addWalker('stroller', 380, 1);
    if (tau > 0.28 && tau < 0.84) addWalker('dog', 700, -1);
    if (tau > 0.6 || tau < 0.05) addWalker('couple', 250, 1);
  }
  (Object.keys(SCHEDULE)          ).forEach((k) => {
    const s = SCHEDULE[k];
    s.next -= dt * TRAFFIC * (people.length < 2 ? 3 : 1); // 해변이 비면 더 빨리 채운다
    if (s.next < 0) {
      s.next = rnd(s.gap[0], s.gap[1]);
      // 같은 사람이 동시에 둘 나오면 복사한 티가 나서, 종류마다 한 번에 하나만
      if (people.length < 4 && !people.some((p) => p.kind === k) && Math.random() < s.when(tau)) addWalker(k);
    }
  });
  for (let i = people.length - 1; i >= 0; i--) {
    const p = people[i];
    p.draw(t, dt, P, wind.value);
    if (p.done) { p.remove(); people.splice(i, 1); }
  }
  // 아침 6시를 지나면 새 하루: 오늘 올 시각을 다시 정한다(지금 머무는 사람은 그대로)
  if (lastDayTau < 0.25 && tau >= 0.25) stay.forEach((s) => { if (!inWindow(tau, s.a, s.b)) s.roll(); });
  lastDayTau = tau;
  stay.forEach((s) => s.o.draw(t, dt, P, wind.value, inWindow(tau, s.a, s.b)));
  // 앞뒤 순서: 아래(가까운) 것이 위에 그려지게
  [...people, ...stay.map((s) => s.o)].sort((a, b) => a.y - b.y).forEach((p) => peopleL.appendChild(p.g));

  const hrs = tau * 24, h = Math.floor(hrs), m = Math.floor((hrs - h) * 60);
  clock.innerHTML = `<b>${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}</b> <span>${period(hrs)}</span>`;
});

(window                                   ).__beach = { setTau: (v        ) => { tau = v; frozenTau = true; }, get tau() { return tau; }, bridge, sea, people, addWalker, kid, busker, picnic, gulls, yacht, drones, stay };
