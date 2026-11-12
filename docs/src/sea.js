// 바다(잔물결·조명 반사), 밀려왔다 빠지는 파도, 젖은 모래, 모래사장.
import { el, pen, shape, f } from '../lib/ink.js';
import { rgb, mix, toRGB,              } from '../lib/daynight.js';
import { W, H, HORIZON, WATERLINE, SHORE, SP, lerp, smooth, ease, easeOut, srnd } from './kit.js';

const PERIOD = 9; // 한 파도가 밀려왔다 빠지는 시간(초)

export function buildSea(layers                                                                , defs         ) {
  const { sea, sand, shore, glow } = layers;

  // ---------- 물: 수평선 쪽이 옅은 그라데이션
  const wg = el('linearGradient', { id: 'b-water', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  const w0 = el('stop', { offset: 0 }, wg), w1 = el('stop', { offset: 1 }, wg);
  el('rect', { x: -10, y: HORIZON, width: W + 20, height: SHORE - HORIZON + 30, fill: 'url(#b-water)' }, sea);
  pen(sea, SP * 0.7).setAttribute('d', `M-10 ${HORIZON} L${W + 10} ${HORIZON}`);
  // 잔물결: 멀수록 촘촘하고 짧게
  const ripples = Array.from({ length: 90 }, () => {
    const u = srnd(0, 1), y = HORIZON + 3 + (SHORE - HORIZON - 14) * Math.pow(u, 1.7);
    return { x: srnd(-40, W), y, len: 5 + 30 * u, v: 2 + 6 * u, ph: srnd(0, 6), n: pen(sea, SP * (0.32 + 0.3 * u)) };
  });

  // ---------- 조명 반사(밤): 광원 아래로 흔들리는 가로 획
  const reflG = el('g', {}, glow);
                                                                                     
  const refl                                                                                                                        = [];
  // 획마다 높이·옆 어긋남·깜박임을 따로 줘서 줄 맞춘 점선처럼 보이지 않게
  const addRefl = (x                         , w        , colour                       , lit              , k = 9) => {
    refl.push({ x, w, colour, lit, strokes: Array.from({ length: k }, (_, i) => {
      const u = clamp01((i + srnd(-0.45, 0.45)) / (k - 1));
      return { u, dx: srnd(-0.5, 0.5), ph: srnd(0, 6.28), sp: srnd(1.2, 3.4), n: el('path', { fill: 'none', 'stroke-linecap': 'round', 'stroke-width': 0.8 + u * 1.1 }, reflG) };
    }) });
  };

  // ---------- 모래사장
  el('path', { d: `M-10 ${SHORE} L${W + 10} ${SHORE} L${W + 10} ${H + 10} L-10 ${H + 10}Z`, fill: '#fdfdfc', class: 'pp' }, sand);
  const sandTint = el('path', { d: `M-10 ${SHORE} L${W + 10} ${SHORE} L${W + 10} ${H + 10} L-10 ${H + 10}Z` }, sand);
  const dots           = [];
  for (let i = 0; i < 420; i++) { const y = SHORE + 24 + Math.pow(srnd(0, 1), 0.8) * (H - SHORE - 20), x = srnd(0, W), r = 0.25 + (y - SHORE) / 900; dots.push(`M${f(x)} ${f(y)} a${f(r)} ${f(r)} 0 1 0 0.01 0`); }
  el('path', { d: dots.join(' '), fill: 'currentColor', opacity: 0.55 }, sand);
  // 모래 언덕 결 몇 줄
  pen(sand, SP * 0.4).setAttribute('d', `M40 452 q60 -6 120 -2 M300 468 q80 -5 150 0 M610 446 q70 -6 140 -1 M820 470 q50 -4 100 0 M180 418 q40 -3 80 0 M700 412 q36 -3 70 0`);

  // ---------- 파도
  const wet = el('path', {}, shore);
  const waves = [0, 0.5].map((off) => ({
    off, seed: srnd(0, 6), reach: 0, big: 0,
    segs: (() => { const s                          = []; let x = srnd(-60, 20); while (x < W) { const w = srnd(140, 320); s.push([x, x + w]); x += w + srnd(20, 70); } return s; })(),
    wash: el('path', {}, shore),
    edge: pen(shore, SP * 0.75),
    bubbles: el('path', { fill: 'currentColor' }, shore),
    crest: shape(shore, SP * 0.8),
    curls: pen(shore, SP * 0.55),
  }));
  let wetY = SHORE, bigNext = false;
  // 거품 방울: 물가 뒤쪽에 흩어진 작은 점(x, 물가에서 떨어진 비율, 크기)
  const bub = Array.from({ length: 70 }, () => [srnd(0, W), Math.pow(srnd(0, 1), 1.6), srnd(0.3, 0.7)]         );
  const clamp01 = (v        ) => Math.max(0, Math.min(1, v));

  const line = (y                       , x0 = -10, x1 = W + 10, step = 12) => {
    const p           = [];
    for (let x = x0; x <= x1; x += step) p.push(`${f(x)} ${f(y(x))}`);
    return p;
  };

  // 물 클릭: 물결 동그라미
  const rings                                                                   = [];
  const ringG = el('g', {}, sea);
  const ring = (x        , y        ) => rings.push({ x, y, t: 0, n: el('ellipse', { fill: 'none', stroke: 'currentColor', 'stroke-width': SP * 0.5 }, ringG) });
  const hit = el('rect', { x: 0, y: HORIZON + 14, width: W, height: SHORE - HORIZON - 14, fill: 'transparent', style: 'cursor:pointer' }, sea);
  el('title', {}, hit).textContent = '큰 파도 부르기';

  return {
    hit, addRefl,
    /** 다음 파도를 크게 */
    poke(x        , y        ) { bigNext = true; ring(x, y); ring(x, y + 3); },
    /** 지금 물이 모래 위로 올라온 가장 아래 y (아이가 피하는 데 쓴다) */
    get washY() { return Math.max(...waves.map((w) => SHORE + w.reach)); },
    draw(t        , dt        , P         , wind        ) {
      const dark = P.inkT;
      const near = dark > 0.5 ? mix(P.paper, toRGB('#0e1730'), 0.42) : mix(P.paper, toRGB('#a9c6d1'), 0.42);
      const farC = dark > 0.5 ? mix(P.paper, toRGB('#2b3558'), 0.25) : mix(P.paper, toRGB('#d7e5e8'), 0.35);
      w0.setAttribute('stop-color', rgb(farC)); w1.setAttribute('stop-color', rgb(near));
      sandTint.setAttribute('fill', rgb(mix(P.paper, dark > 0.5 ? toRGB('#3a3550') : toRGB('#efe2c4'), 0.45)));

      ripples.forEach((r) => {
        r.x += (r.v * 0.6 + wind * 2.4) * dt; if (r.x > W + 20) r.x = -40; if (r.x < -50) r.x = W + 10;
        const y = r.y + Math.sin(t * 1.1 + r.ph) * 0.5;
        r.n.setAttribute('d', `M${f(r.x)} ${f(y)} Q${f(r.x + r.len / 2)} ${f(y - 0.9)} ${f(r.x + r.len)} ${f(y)}`);
      });

      refl.forEach((r) => {
        const lit = r.lit();
        const c = r.colour(t), X = typeof r.x === 'function' ? r.x() : r.x;
        r.strokes.forEach((s) => {
          if (lit < 0.02) { s.n.setAttribute('d', ''); return; }
          const u = s.u;
          const y = WATERLINE + 4 + (SHORE - WATERLINE - 22) * Math.pow(u, 1.3) + Math.sin(t * 0.9 + s.ph) * 1.2;
          const jit = s.dx * r.w + Math.sin(t * s.sp * 0.7 + s.ph) * (1 + u * 4);
          const w = r.w * (0.5 + u * 1.3) * (0.55 + 0.45 * Math.sin(t * s.sp + s.ph));
          const twinkle = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(t * s.sp * 1.3 + s.ph * 2), 2);
          s.n.setAttribute('d', `M${f(X - w / 2 + jit)} ${f(y)} L${f(X + w / 2 + jit)} ${f(y)}`);
          s.n.setAttribute('stroke', c);
          s.n.setAttribute('opacity', f(lit * twinkle * (0.85 - u * 0.5)));
        });
      });

      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i]; r.t += dt;
        r.n.setAttribute('cx', f(r.x)); r.n.setAttribute('cy', f(r.y));
        r.n.setAttribute('rx', f(2 + r.t * 14)); r.n.setAttribute('ry', f(0.6 + r.t * 2.4));
        r.n.setAttribute('opacity', f(Math.max(0, 1 - r.t / 1.6)));
        if (r.t > 1.6) { r.n.remove(); rings.splice(i, 1); }
      }

      // 파도: 0–0.42 밀려옴(마루가 다가오며 부서짐) · 0.42–0.7 모래 위로 퍼짐 · 0.7–1 빠짐
      const foam = rgb(mix(P.paper, toRGB('#ffffff'), dark > 0.5 ? 0 : 0.6));
      const wetC = rgb(mix(P.paper, dark > 0.5 ? toRGB('#1d2440') : toRGB('#cdbb98'), 0.5));
      waves.forEach((wv) => {
        const s = ((t / PERIOD + wv.off) % 1 + 1) % 1;
        if (s < 0.02 && wv.big === 0 && bigNext) { wv.big = 1; bigNext = false; }
        if (s > 0.98) wv.big = 0;
        const R = 22 + wv.big * 30;
        const sd = wv.seed;
        if (s < 0.42) {
          const u = s / 0.42, yc = lerp(SHORE - 30, SHORE + 1, ease(u)), h = (1.2 + 3 * u) * (1 + wv.big * 0.8);
          // 파도는 한 줄로 부서지지 않는다: 몇 토막으로 나뉘고 토막 끝은 가늘어진다
          const d           = [];
          wv.segs.forEach(([x0, x1]) => {
            const taper = (x        ) => Math.pow(Math.sin(Math.PI * Math.max(0, Math.min(1, (x - x0) / (x1 - x0)))), 0.7);
            const top = line((x) => yc - h * taper(x) + Math.sin(x * 0.021 + sd) * 1.6 + Math.sin(x * 0.05 + sd * 2) * 0.6 * taper(x), x0, x1, 8);
            const bot = line((x) => yc + Math.sin(x * 0.021 + sd) * 1.6 + 0.4 * taper(x), x0, x1, 8).reverse();
            d.push(`M${top.join(' L')} L${bot.join(' L')}Z`);
          });
          wv.crest.setAttribute('d', d.join(' '));
          wv.crest.setAttribute('opacity', f(smooth(0, 0.12, u) * (1 - smooth(0.85, 1, u))));
          const c           = [];
          for (const [x0, x1] of wv.segs) for (let x = x0 + 26; x < x1 - 20; x += 58 + Math.sin(x + sd) * 14) {
            const y = yc - h + Math.sin(x * 0.021 + sd) * 1.6;
            const k = smooth(0.3, 0.9, u) * (1 + wv.big);
            c.push(`M${f(x - 7 * k)} ${f(y + 0.4)} Q${f(x)} ${f(y - 3.4 * k)} ${f(x + 3 * k)} ${f(y + 0.6 * k)}`);
          }
          wv.curls.setAttribute('d', c.join(' '));
          wv.curls.setAttribute('opacity', f(smooth(0.25, 0.5, u) * (1 - smooth(0.85, 1, u))));
          wv.reach = 0;
        } else {
          wv.crest.setAttribute('opacity', 0); wv.curls.setAttribute('opacity', 0);
          wv.reach = s < 0.7 ? R * easeOut((s - 0.42) / 0.28) : R * (1 - ease((s - 0.7) / 0.3));
        }
        const r = wv.reach, fade = s < 0.7 ? 1 : 1 - smooth(0.7, 1, s) * 0.6;
        if (r > 0.3) {
          const edge = (x        ) => SHORE + r * (0.85 + 0.15 * Math.sin(x * 0.013 + sd)) + Math.sin(x * 0.09 + sd * 3) * 1.6 * Math.min(1, r / 8);
          const e = line(edge, -10, W + 10, 8);
          wv.wash.setAttribute('d', `M-10 ${SHORE - 1} L${W + 10} ${SHORE - 1} L${e.slice().reverse().join(' L')}Z`);
          wv.wash.setAttribute('fill', foam); wv.wash.setAttribute('opacity', f(0.85 * fade));
          wv.edge.setAttribute('d', 'M' + e.join(' L'));
          wv.edge.setAttribute('opacity', f(fade));
          const b           = [];
          if (r > 4) bub.forEach(([bx, by, br]) => { const y = edge(bx) - 1.5 - by * Math.min(r, 14); b.push(`M${f(bx)} ${f(y)} a${br} ${br} 0 1 0 0.01 0`); });
          wv.bubbles.setAttribute('d', b.join(' '));
          wv.bubbles.setAttribute('opacity', f(0.55 * fade));
        } else { wv.wash.setAttribute('d', ''); wv.edge.setAttribute('d', ''); wv.bubbles.setAttribute('d', ''); }
      });
      // 젖은 모래: 가장 멀리 올라온 자리에서 천천히 마른다
      const reachNow = Math.max(...waves.map((w) => w.reach));
      wetY = Math.max(SHORE + reachNow, lerp(wetY, SHORE + 8, dt * 0.08));
      const we = line((x) => wetY + Math.sin(x * 0.013) * 2 + Math.sin(x * 0.07) * 0.8, -10, W + 10, 16);
      wet.setAttribute('d', `M-10 ${SHORE - 1} L${W + 10} ${SHORE - 1} L${we.reverse().join(' L')}Z`);
      wet.setAttribute('fill', wetC);
    },
  };
}
