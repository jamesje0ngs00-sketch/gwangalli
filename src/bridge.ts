// 광안대교: 200m-500m-200m 3경간 현수교, 강재 트러스 보강형(복층), 양 끝은 접속교.
// 해변에서 본 정면도(원근 없음). 세로는 그림을 위해 조금 과장했다.
// 밤에는 케이블·주탑·상판 조명이 켜지고, 다리를 누르면 조명 연출이 바뀐다.
import { el, pen, shape, paint, f, pt } from '../lib/ink.ts';
import { nightTint, type Palette } from '../lib/daynight.ts';
import { W, WATERLINE, SP, smooth, rnd, hsl } from './kit.ts';

export const T1 = 330, T2 = 630, A1 = 210, A2 = 750;   // 주탑, 앵커리지 x
export const TOP = 118, LOW = 199, DT = 205, DB = 215; // 주탑 꼭대기, 케이블 최저점, 상판 위·아래
const MID = (T1 + T2) / 2, HALF = (T2 - T1) / 2, ANCH_Y = 206;

export function cableY(x: number): number {
  if (x >= T1 && x <= T2) { const u = (x - MID) / HALF; return LOW - (LOW - TOP) * u * u; }
  const u = x < T1 ? (x - A1) / (T1 - A1) : (A2 - x) / (A2 - T2);
  return ANCH_Y + (TOP - ANCH_Y) * u + 7 * 4 * u * (1 - u);
}
/** 위층 상판 높이: 현수교 구간은 수평, 접속교는 육지 쪽으로 살짝 내려간다. */
export function deckTop(x: number): number {
  if (x >= A1 && x <= A2) return DT;
  const d = x < A1 ? (A1 - x) / A1 : (x - A2) / (W - A2);
  return DT + 1 + 9 * Math.pow(Math.max(0, d), 1.4);
}

type Mode = (u: number, t: number) => [number, number, number];
const MODES: Mode[] = [
  (u, t) => [228 + 24 * Math.sin(t * 0.25 + u * 2.4), 72, 68],              // 잔잔한 파랑·보라
  (u, t) => [u * 320 - t * 70, 82, 64],                                       // 무지개가 다리를 따라 흐름
  (u, t) => [36 + 8 * Math.sin(t * 2 + u * 18), 92, 62 + 10 * Math.max(0, Math.sin(t * 5 + u * 30))], // 금빛 반짝임
  (u, t) => [205, 35, 78 + 18 * Math.pow(Math.max(0, Math.sin(t * 4 - u * 26)), 6)], // 흰 물결
];

export function buildBridge(layers: { bridge: Element; glow: Element; halo: Element }) {
  const { bridge: g, glow, halo } = layers;

  // ---------- 접속교(양쪽)
  const approach = (x0: number, x1: number) => {
    const top: string[] = [], bot: string[] = [];
    const n = 24;
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * (i / n); top.push(`${f(x)} ${f(deckTop(x))}`); }
    for (let i = n; i >= 0; i--) { const x = x0 + (x1 - x0) * (i / n); bot.push(`${f(x)} ${f(deckTop(x) + 6)}`); }
    // 교각
    const piers: string[] = [];
    const step = 46 * Math.sign(x1 - x0);
    for (let x = x0 + step * 0.6; (x1 - x) * Math.sign(step) > 4; x += step) {
      const y = deckTop(x) + 6;
      shape(g, SP * 0.7).setAttribute('d', `M${f(x - 2.4)} ${f(y)} L${f(x - 3)} ${WATERLINE + 1} L${f(x + 3)} ${WATERLINE + 1} L${f(x + 2.4)} ${f(y)}Z`);
      piers.push(`M${f(x - 5)} ${f(y + 1.2)} L${f(x + 5)} ${f(y + 1.2)}`);
    }
    shape(g, SP * 0.8).setAttribute('d', `M${top.join(' L')} L${bot.join(' L')}Z`);
    const rail: string[] = [];
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * (i / n); rail.push(`${f(x)} ${f(deckTop(x) + 2.4)}`); }
    pen(g, SP * 0.4).setAttribute('d', piers.join(' ') + ' M' + rail.join(' L'));
  };
  approach(A1 - 8, -12);
  approach(A2 + 8, W + 12);

  // ---------- 앵커리지
  [A1, A2].forEach((x, i) => {
    const s = i ? -1 : 1;
    shape(g, SP * 0.85).setAttribute('d', `M${x - 14 * s} ${ANCH_Y - 3} L${x + 9 * s} ${ANCH_Y - 3} L${x + 11 * s} ${WATERLINE + 1} L${x - 16 * s} ${WATERLINE + 1}Z`);
    pen(g, SP * 0.4).setAttribute('d', `M${x - 15 * s} ${ANCH_Y + 12} L${x + 10 * s} ${ANCH_Y + 12} M${x - 15 * s} ${ANCH_Y + 26} L${x + 10.6 * s} ${ANCH_Y + 26}`);
  });

  // ---------- 주탑
  const towerPath = (x: number) => `M${x - 3} ${TOP - 2} Q${x} ${TOP - 6} ${x + 3} ${TOP - 2} L${x + 4.6} ${WATERLINE - 2} L${x - 4.6} ${WATERLINE - 2}Z`;
  [T1, T2].forEach((x) => {
    shape(g, SP * 0.9).setAttribute('d', towerPath(x));
    pen(g, SP * 0.4).setAttribute('d', `M${x} ${TOP + 2} L${x} ${DT - 2} M${x} ${DB + 2} L${x} ${WATERLINE - 4} M${x - 3.4} ${TOP + 14} L${x + 3.4} ${TOP + 14} M${x - 4} ${TOP + 48} L${x + 4} ${TOP + 48}`);
    shape(g, SP * 0.8).setAttribute('d', `M${x - 9} ${WATERLINE - 3} L${x + 9} ${WATERLINE - 3} Q${x + 10} ${WATERLINE} ${x + 9} ${WATERLINE + 2} L${x - 9} ${WATERLINE + 2} Q${x - 10} ${WATERLINE} ${x - 9} ${WATERLINE - 3}Z`);
  });

  // ---------- 보강 트러스(복층 상판)
  shape(g, SP * 0.85).setAttribute('d', `M${A1 - 8} ${DT} L${A2 + 8} ${DT} L${A2 + 8} ${DB} L${A1 - 8} ${DB}Z`);
  const tr: string[] = [`M${A1 - 8} ${(DT + DB) / 2} L${A2 + 8} ${(DT + DB) / 2}`];
  for (let x = A1 - 6, k = 0; x < A2 + 6; x += 5, k++) tr.push(k % 2 ? `M${x} ${DT} L${x + 5} ${DB}` : `M${x} ${DB} L${x + 5} ${DT}`);
  pen(g, SP * 0.32).setAttribute('d', tr.join(' '));
  // 난간과 가로등
  const posts: string[] = [`M${A1 - 8} ${DT - 1.6} L${A2 + 8} ${DT - 1.6}`];
  const lampXs: number[] = [];
  for (let x = A1 + 2; x < A2; x += 24) { posts.push(`M${x} ${DT} L${x} ${DT - 5} l1.6 -0.6`); lampXs.push(x + 1.6); }
  pen(g, SP * 0.38).setAttribute('d', posts.join(' '));

  // ---------- 행어와 케이블
  const hang: string[] = [];
  for (let x = A1 + 8; x < A2 - 6; x += 7) { if (Math.abs(x - T1) < 5 || Math.abs(x - T2) < 5) continue; hang.push(`M${x} ${f(cableY(x) + 0.6)} L${x} ${DT - 1.8}`); }
  pen(g, SP * 0.3).setAttribute('d', hang.join(' '));
  const cablePts: Array<[number, number]> = [];
  for (let x = A1; x <= A2; x += 3) cablePts.push([x, cableY(x)]);
  pen(g, SP * 0.95).setAttribute('d', 'M' + cablePts.map(pt).join('L'));
  [T1, T2].forEach((x) => shape(g, SP * 0.7).setAttribute('d', `M${x - 3.6} ${TOP - 1} Q${x} ${TOP - 7} ${x + 3.6} ${TOP - 1}Z`)); // 새들

  // ---------- 다리 위 자동차
  const carG = el('g', {}, g);
  const CAR_COLS = ['', '', '', '#c8553d', '', '#3f5d8a', '', '#e0b23c'];
  const cars = Array.from({ length: 18 }, () => {
    const dir = Math.random() < 0.5 ? 1 : -1, col = CAR_COLS[(Math.random() * CAR_COLS.length) | 0];
    const body = col ? paint(carG, col, SP * 0.35) : shape(carG, SP * 0.35);
    return { x: rnd(-20, W + 20), dir, v: rnd(16, 26), col, body, head: el('circle', { r: 1.3, fill: '#fff6d8' }, glow), tail: el('circle', { r: 0.9, fill: '#ff5a44' }, glow) };
  });

  // ---------- 조명(밤)
  const segs: Array<{ u: number; x: number; dots: SVGPathElement; aura: SVGPathElement }> = [];
  const SEG = 30;
  for (let i = 0; i < SEG; i++) {
    const x0 = A1 + ((A2 - A1) * i) / SEG, x1 = A1 + ((A2 - A1) * (i + 1)) / SEG;
    const p: string[] = [];
    for (let x = x0; x <= x1 + 0.01; x += (x1 - x0) / 4) p.push(`${f(x)} ${f(cableY(x))}`);
    const d = 'M' + p.join('L');
    segs.push({ u: i / (SEG - 1), x: (x0 + x1) / 2,
      aura: el('path', { d, fill: 'none', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0 }, halo),
      dots: el('path', { d, fill: 'none', 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-dasharray': '0.01 3.3', opacity: 0 }, glow) });
  }
  const towerLights = [T1, T2].map((x) => el('path', { d: `M${x - 6} ${TOP} L${x + 6} ${TOP} L${x + 7} ${WATERLINE - 3} L${x - 7} ${WATERLINE - 3}Z`, opacity: 0 }, halo));
  const deckSegs = Array.from({ length: 12 }, (_, i) => {
    const x0 = A1 - 8 + ((A2 - A1 + 16) * i) / 12, x1 = A1 - 8 + ((A2 - A1 + 16) * (i + 1)) / 12;
    return { u: i / 11, line: el('path', { d: `M${f(x0)} ${DB + 0.4} L${f(x1)} ${DB + 0.4}`, 'stroke-width': 1, fill: 'none', opacity: 0 }, glow) };
  });
  const lamps = lampXs.map((x) => ({ dot: el('circle', { cx: x, cy: DT - 5.6, r: 0.8, fill: '#fff1c9', opacity: 0 }, glow), aura: el('circle', { cx: x, cy: DT - 5, r: 4, fill: 'url(#b-warm)', opacity: 0 }, glow) }));

  let mode = 0, flash = 0, on = 0;
  const colour = (u: number, t: number, boost = 0) => { const [h, s, l] = MODES[mode](u, t); return hsl(h, s, Math.min(96, l + boost)); };
  const hit = el('path', { d: `M${A1 - 16} ${TOP - 8} L${A2 + 16} ${TOP - 8} L${A2 + 16} ${WATERLINE + 2} L${A1 - 16} ${WATERLINE + 2}Z`, fill: 'transparent', style: 'cursor:pointer' }, g);
  el('title', {}, hit).textContent = '다리 조명 바꾸기';

  return {
    hit,
    lightsOn: () => on,
    poke() { mode = (mode + 1) % MODES.length; flash = 1; },
    /** 바다 반사를 위한 x 위치의 조명 색 */
    colourAt(x: number, t: number) { return colour((x - A1) / (A2 - A1), t); },
    draw(t: number, dt: number, P: Palette) {
      on = smooth(0.22, 0.5, P.lamp);
      flash = Math.max(0, flash - dt * 1.4);
      const boost = flash * 18, bright = Math.min(1, on * (1 + flash * 0.6));
      segs.forEach((s) => {
        const c = colour(s.u, t, boost);
        s.dots.setAttribute('stroke', c); s.aura.setAttribute('stroke', c);
        s.dots.setAttribute('opacity', f(bright)); s.aura.setAttribute('opacity', f(bright * 0.5));
      });
      towerLights.forEach((n, i) => { n.setAttribute('fill', colour(i, t * 0.7, boost)); n.setAttribute('opacity', f(on * (0.38 + flash * 0.3))); });
      deckSegs.forEach((s) => { s.line.setAttribute('stroke', colour(s.u, t, boost)); s.line.setAttribute('opacity', f(bright * 0.9)); });
      const lampOn = smooth(0.18, 0.4, P.lamp);
      lamps.forEach((l) => { l.dot.setAttribute('opacity', f(lampOn)); l.aura.setAttribute('opacity', f(lampOn * 0.6)); });

      cars.forEach((c) => {
        c.x += c.dir * c.v * dt;
        if (c.x > W + 24) c.x = -24; if (c.x < -24) c.x = W + 24;
        const y = deckTop(c.x) - 0.4;
        c.body.setAttribute('d', `M${f(c.x - 2.4)} ${f(y)} L${f(c.x - 2.2)} ${f(y - 1.4)} Q${f(c.x - 1)} ${f(y - 2.6)} ${f(c.x + 1.2)} ${f(y - 2.4)} L${f(c.x + 2.4)} ${f(y - 1.2)} L${f(c.x + 2.4)} ${f(y)}Z`);
        if (c.col) c.body.setAttribute('fill', nightTint(c.col, P));
        c.head.setAttribute('cx', f(c.x + c.dir * 2.6)); c.head.setAttribute('cy', f(y - 1));
        c.tail.setAttribute('cx', f(c.x - c.dir * 2.6)); c.tail.setAttribute('cy', f(y - 1));
        c.head.setAttribute('opacity', f(lampOn)); c.tail.setAttribute('opacity', f(lampOn * 0.9));
      });
    },
  };
}

/** 바다에 반사를 그릴 조명 위치들 */
export const BRIDGE_LIGHT_XS = (() => { const xs: number[] = []; for (let x = A1 + 10; x < A2; x += 22) xs.push(x); return xs; })();
