// 갈매기, 요트, 밤하늘 드론쇼.
import { el, pen, shape, blot, paint, f,          } from '../lib/ink.js';
import { nightTint,              } from '../lib/daynight.js';
import { minJerk } from '../lib/motion.js';
import { W, HORIZON, SP, smooth, ease, rnd, srnd, clamp, lerp } from './kit.js';

// ------------------------------------------------------------------ 갈매기
                                                                                                                                                                                                          
                                                                                                               

export function createGulls(parent         , sky         ) {
  const make = (p         , x        , y        , flying         )       => {
    const g = el('g', {}, p);
    const legs = pen(g, SP * 0.5), wing = pen(g, SP * 0.75), body = shape(g, SP * 0.7), beak = paint(g, '#e0b23c', 0.3), eye = blot(g);
    g.insertBefore(wing, null);
    return { x, y, hx: x, hy: y, dir: Math.random() < 0.5 ? 1 : -1, state: flying ? 'fly' : 'stand', t: 0, ph: rnd(0, 6), peck: rnd(1, 5), vx: 0, vy: 0, tx: 0, ty: 0, body, wing, legs, beak, eye };
  };
  const ground = [[586, 352], [604, 356], [622, 351], [648, 357], [670, 353]].map(([x, y]) => make(parent, x, y, false));
  const fliers = [[120, 150], [520, 186], [820, 120]].map(([x, y]) => { const g = make(sky, x, y, true); g.vx = rnd(10, 16) * (Math.random() < 0.5 ? 1 : -1); return g; });
  const hit = el('rect', { x: 572, y: 336, width: 112, height: 26, fill: 'transparent', style: 'cursor:pointer' }, parent);
  el('title', {}, hit).textContent = '갈매기 날리기';

  const drawStand = (g      , t        , P         ) => {
    const pk = g.peck < 0.5 ? Math.sin((g.peck / 0.5) * Math.PI) : 0;
    const d = g.dir, x = g.x, y = g.y - 4.4;
    g.body.setAttribute('d', `M${f(x - 5.6 * d)} ${f(y - 0.4)} Q${f(x - 2 * d)} ${f(y - 3.6)} ${f(x + 3 * d)} ${f(y - 2.4)} Q${f(x + 4.2 * d)} ${f(y - 5.4 + pk * 3)} ${f(x + 5.6 * d)} ${f(y - 4.6 + pk * 3)} Q${f(x + 7 * d)} ${f(y - 4 + pk * 3)} ${f(x + 5 * d)} ${f(y - 1.4)} Q${f(x + 3 * d)} ${f(y + 2.4)} ${f(x - 2 * d)} ${f(y + 1.4)}Z`);
    g.wing.setAttribute('d', `M${f(x - 6.4 * d)} ${f(y - 0.6)} Q${f(x - 1 * d)} ${f(y - 2.6)} ${f(x + 2.6 * d)} ${f(y - 0.6)}`);
    g.legs.setAttribute('d', `M${f(x)} ${f(y + 1.6)} L${f(x - 0.4 * d)} ${f(g.y)} M${f(x + 1.6 * d)} ${f(y + 1.6)} L${f(x + 1.8 * d)} ${f(g.y)}`);
    const bx = x + 6.4 * d, by = y - 4.4 + pk * 3;
    g.beak.setAttribute('d', `M${f(bx)} ${f(by - 0.5)} L${f(bx + 2.2 * d)} ${f(by + 0.2)} L${f(bx)} ${f(by + 0.5)}Z`);
    g.beak.setAttribute('fill', nightTint('#e0b23c', P));
    g.eye.setAttribute('d', `M${f(x + 5.2 * d)} ${f(by - 0.8)} a0.4 0.4 0 1 0 0.1 0Z`);
    void t;
  };
  const drawFly = (g      , t        , scale = 1) => {
    const flap = Math.sin(t * 9 + g.ph), d = g.vx >= 0 ? 1 : -1, x = g.x, y = g.y, s = scale;
    const up = flap * 4.6 * s;
    g.body.setAttribute('d', `M${f(x - 3.4 * d * s)} ${f(y)} Q${f(x)} ${f(y - 1.4 * s)} ${f(x + 3.6 * d * s)} ${f(y - 0.4 * s)} Q${f(x)} ${f(y + 1.4 * s)} ${f(x - 3.4 * d * s)} ${f(y)}Z`);
    g.wing.setAttribute('d', `M${f(x - 7.6 * s)} ${f(y - up - 1)} Q${f(x - 3.6 * s)} ${f(y - up * 0.6 - 2.4 * s)} ${f(x)} ${f(y - 0.4)} Q${f(x + 3.6 * s)} ${f(y - up * 0.6 - 2.4 * s)} ${f(x + 7.6 * s)} ${f(y - up - 1)}`);
    g.legs.setAttribute('d', ''); g.eye.setAttribute('d', '');
    g.beak.setAttribute('d', `M${f(x + 3.4 * d * s)} ${f(y - 0.6 * s)} l${f(1.4 * d * s)} 0.4 l${f(-1.4 * d * s)} 0.4Z`);
  };

  return {
    hit,
    flush() {
      ground.forEach((g) => { if (g.state !== 'stand') return; g.state = 'fly'; g.t = 0; g.vx = rnd(18, 34) * (Math.random() < 0.5 ? 1 : -1); g.vy = rnd(-34, -24); });
    },
    draw(t        , dt        , P         , wind        , roost = false) {
      ground.forEach((g) => {
        // 해 질 무렵 하나씩 잠자리로 떠나고, 아침에 하나씩 돌아온다
        if (roost && g.state === 'stand' && Math.random() < dt * 0.15) { g.state = 'fly'; g.t = 0; g.vx = rnd(18, 30) * (g.x < W / 2 ? -1 : 1); g.vy = rnd(-30, -20); }
        if (!roost && g.state === 'away' && Math.random() < dt * 0.2) { g.state = 'land'; g.t = 0; g.tx = g.hx < W / 2 ? -30 : W + 30; g.ty = rnd(120, 180); }
        if (g.state === 'away') { [g.body, g.wing, g.legs, g.beak, g.eye].forEach((n) => n.setAttribute('d', '')); return; }
        if (g.state === 'stand') {
          g.peck -= dt; if (g.peck < 0) { g.peck = rnd(2, 6); if (Math.random() < 0.3) g.dir = g.dir === 1 ? -1 : 1; }
          drawStand(g, t, P);
        } else if (g.state === 'fly') {
          g.t += dt;
          g.vy = lerp(g.vy, -2 + Math.sin(g.t + g.ph) * 6, dt * 0.6);
          g.x += (g.vx + wind * 6) * dt; g.y += g.vy * dt;
          if (roost && (g.x > W + 20 || g.x < -20)) { g.state = 'away'; return; }
          if (g.x > W + 20) g.x = -20; if (g.x < -20) g.x = W + 20;
          if (!roost && g.t > rnd(9, 10)) { g.state = 'land'; g.t = 0; g.tx = g.x; g.ty = g.y; }
          drawFly(g, t, 1);
        } else {
          // 원래 자리로 미끄러지듯 내려앉기
          g.t += dt; const u = clamp(g.t / 3, 0, 1), m = minJerk(u);
          g.x = lerp(g.tx, g.hx, m); g.y = lerp(g.ty, g.hy, m) - Math.sin(u * Math.PI) * 10;
          g.vx = g.hx - g.tx;
          if (u >= 1) { g.state = 'stand'; g.x = g.hx; g.y = g.hy; drawStand(g, t, P); } else drawFly(g, t, 1);
        }
      });
      fliers.forEach((g) => {
        g.x += (g.vx + wind * 5) * dt; g.y = g.hy + Math.sin(t * 0.4 + g.ph) * 12;
        if (g.x > W + 30) g.x = -30; if (g.x < -30) g.x = W + 30;
        // 날개를 몇 번 치고 길게 미끄러진다
        const glide = Math.sin(t * 0.7 + g.ph) > 0.2;
        drawFly(g, glide ? (Math.PI / 2 - g.ph) / 9 : t, 0.85);
      });
      const vis = 1 - smooth(0.5, 0.85, P.night);
      fliers.forEach((g) => [g.body, g.wing, g.beak].forEach((n) => n.setAttribute('opacity', f(vis))));
    },
  };
}

// ------------------------------------------------------------------ 요트
export function createYacht(parent         , glow         ) {
  const g = el('g', { style: 'cursor:pointer' }, parent);
  const wake = pen(g, SP * 0.5), hull = paint(g, '#fdfdfc', SP * 0.8), stripe = paint(g, '#3f5d8a', 0.3), cabin = shape(g, SP * 0.6);
  const mast = pen(g, SP * 0.7), main = shape(g, SP * 0.7), jib = shape(g, SP * 0.7), seams = pen(g, SP * 0.35), flag = paint(g, '#c8553d', 0.3);
  const top = el('circle', { r: 1.1, fill: '#fff4d0' }, glow), win = el('rect', { width: 8, height: 1.4, fill: '#ffd58a' }, glow);
  el('title', {}, g).textContent = '요트';
  let x = 140, gust = 0, wait = 0;
  const Y = 270, dir = 1, v = 9;
  const state = { x: -60, lit: 0 };
  return {
    g, state,
    poke() { gust = 1; },
    draw(t        , dt        , P         , wind        ) {
      if (wait > 0) { wait -= dt; g.style.display = 'none'; top.setAttribute('opacity', 0); win.setAttribute('opacity', 0); state.lit = 0; return; }
      g.style.display = '';
      gust = Math.max(0, gust - dt * 0.5);
      x += dir * (v + gust * 14 + wind * 2) * dt;
      if (x > W + 70) { x = -70; wait = rnd(30, 60); }
      state.x = x;
      const heel = (2 + gust * 7 + wind * 1.5) * Math.PI / 180, rock = Math.sin(t * 1.3) * 0.6;
      g.setAttribute('transform', `rotate(${f((heel * 57.3) + rock)} ${f(x)} ${Y})`);
      hull.setAttribute('d', `M${f(x - 18)} ${Y - 4} L${f(x + 18)} ${Y - 4} Q${f(x + 15)} ${Y + 1} ${f(x + 10)} ${Y + 2} L${f(x - 14)} ${Y + 2} Q${f(x - 17)} ${Y} ${f(x - 18)} ${Y - 4}Z`);
      hull.setAttribute('fill', nightTint('#fdfdfc', P, 0.9));
      stripe.setAttribute('d', `M${f(x - 17)} ${Y - 2.2} L${f(x + 16.6)} ${Y - 2.2} L${f(x + 16)} ${Y - 1.4} L${f(x - 16.6)} ${Y - 1.4}Z`);
      stripe.setAttribute('fill', nightTint('#3f5d8a', P));
      cabin.setAttribute('d', `M${f(x - 8)} ${Y - 4} L${f(x - 6)} ${Y - 7.4} L${f(x + 4)} ${Y - 7.4} L${f(x + 6)} ${Y - 4}Z`);
      const mx = x - 1, mt = Y - 44, belly = 3 + gust * 3 + wind;
      mast.setAttribute('d', `M${f(mx)} ${Y - 7} L${f(mx)} ${f(mt)}`);
      main.setAttribute('d', `M${f(mx - 0.6)} ${f(mt + 2)} Q${f(mx - 8 - belly)} ${f(mt + 20)} ${f(mx - 15)} ${Y - 9} L${f(mx - 0.6)} ${Y - 9}Z`);
      jib.setAttribute('d', `M${f(mx + 0.6)} ${f(mt + 5)} Q${f(mx + 7 + belly * 0.6)} ${f(mt + 22)} ${f(x + 16)} ${Y - 5} L${f(mx + 0.6)} ${Y - 7}Z`);
      seams.setAttribute('d', `M${f(mx - 0.6)} ${f(mt + 14)} L${f(mx - 6)} ${f(mt + 16)} M${f(mx - 0.6)} ${f(mt + 25)} L${f(mx - 10)} ${f(mt + 27)}`);
      flag.setAttribute('d', `M${f(mx)} ${f(mt)} L${f(mx - 4 - Math.sin(t * 8) * 0.6)} ${f(mt + 1 + Math.sin(t * 6))} L${f(mx)} ${f(mt + 2.2)}Z`);
      flag.setAttribute('fill', nightTint('#c8553d', P));
      wake.setAttribute('d', `M${f(x - 18)} ${Y + 2} q-10 1.4 -${f(22 + gust * 14)} 1 M${f(x - 16)} ${Y + 4} q-8 1 -${f(16 + gust * 10)} 0.6`);
      const lit = smooth(0.25, 0.5, P.lamp);
      state.lit = lit;
      top.setAttribute('cx', f(mx)); top.setAttribute('cy', f(mt)); top.setAttribute('opacity', f(lit * (0.6 + 0.4 * Math.sin(t * 3))));
      win.setAttribute('x', f(x - 6)); win.setAttribute('y', f(Y - 6.4)); win.setAttribute('opacity', f(lit * 0.9));
    },
  };
}

// ------------------------------------------------------------------ 드론쇼
                                                                      

function sampleShape(draw                                       , n        , cx        , cy        , w        )        {
  const CW = 240, CH = 120;
  const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH;
  const c = cv.getContext('2d') ;
  c.fillStyle = '#fff'; draw(c);
  const data = c.getImageData(0, 0, CW, CH).data;
  const on        = [];
  for (let y = 0; y < CH; y += 2) for (let x = 0; x < CW; x += 2) if (data[(y * CW + x) * 4 + 3] > 128) on.push([x, y]);
  // 고르게 흩뿌리기: 무작위로 고르되 이미 고른 점과 너무 가까우면 버린다(점점 기준을 낮춤)
  const pick        = [];
  let minD = Math.sqrt(on.length / n) * 2.4;
  while (pick.length < n && minD > 0.5) {
    for (let tries = 0; tries < n * 6 && pick.length < n; tries++) {
      const p = on[Math.floor(srnd(0, on.length))];
      if (pick.every((q) => (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 >= minD * minD)) pick.push(p);
    }
    minD *= 0.85;
  }
  while (pick.length < n) pick.push(on[Math.floor(srnd(0, on.length))] || [CW / 2, CH / 2]);
  return pick.map((p) => [cx + (p[0] - CW / 2) * (w / CW), cy + (p[1] - CH / 2) * (w / CW)]       ).sort((a, b) => a[0] - b[0]);
}

export function createDrones(glow         , defs         ) {
  const N = 150;
  const gr = el('radialGradient', { id: 'b-drone' }, defs);
  el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.9 }, gr);
  el('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 0 }, gr);
  const g = el('g', { opacity: 0 }, glow);
  const ds = Array.from({ length: N }, (_, i) => ({ home: [300 + (360 * i) / N, HORIZON - 2]       , p: [0, 0]       , aura: el('circle', { r: 2.1, opacity: 0.45 }, g), dot: el('circle', { r: 0.9 }, g) }));
  let shapes                 = null;
  const build = () => {
    const font = (s        ) => `900 ${s}px "Malgun Gothic","Nanum Gothic","Apple SD Gothic Neo",sans-serif`;
    const heart = sampleShape((c) => { c.beginPath(); c.moveTo(120, 104); c.bezierCurveTo(40, 60, 70, 4, 120, 36); c.bezierCurveTo(170, 4, 200, 60, 120, 104); c.fill(); }, N, 480, 112, 200);
    const busan = sampleShape((c) => { c.font = font(78); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('부산', 120, 64); }, N, 480, 108, 290);
    const gwang = sampleShape((c) => { c.font = font(62); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('광안리', 120, 64); }, N, 480, 108, 330);
    shapes = [
      { pts: heart, colour: (u, t) => `hsl(${345 + Math.sin(t * 2 + u * 9) * 10} 90% ${68 + 10 * Math.sin(t * 5 + u * 30)}%)` },
      { pts: busan, colour: (u, t) => `hsl(${200 + u * 40} 85% ${76 + 12 * Math.max(0, Math.sin(t * 4 - u * 12))}%)` },
      { pts: gwang, colour: (u, t) => `hsl(${(u * 300 + t * 60) % 360} 85% 70%)` },
    ];
  };
  // 일정: 떠오름 3초 → 모양마다 (모이기 2.4초 + 머물기 4초) → 내려앉음 3초
  const RISE = 3, MOVE = 2.4, HOLD = 4, FALL = 3;
  let t0 = -1;
  const total = () => RISE + 3 * (MOVE + HOLD) + FALL;
  return {
    get running() { return t0 >= 0; },
    start() { if (t0 >= 0) return; if (!shapes) build(); t0 = 0; },
    draw(t        , dt        , P         ) {
      if (t0 < 0) { g.setAttribute('opacity', 0); return; }
      t0 += dt;
      if (t0 > total()) { t0 = -1; return; }
      const S = shapes ;
      g.setAttribute('opacity', f(smooth(0, 0.6, t0) * (1 - smooth(total() - 1, total(), t0)) * Math.max(0.3, P.night)));
      // 지금 어디서 어디로
      let from                    , to                    , u        , col                                   ;
      const idleCol = () => '#f2f6ff';
      if (t0 < RISE + MOVE) {
        u = ease(t0 / (RISE + MOVE)); from = (i) => ds[i].home; to = (i) => S[0].pts[i];
        col = (k, tt) => (t0 > RISE ? S[0].colour(k, tt) : idleCol());
      } else if (t0 < total() - FALL) {
        const q = t0 - RISE - MOVE, idx = Math.floor(q / (MOVE + HOLD)), r = q - idx * (MOVE + HOLD);
        const cur = S[Math.min(idx, 2)], next = S[Math.min(idx + 1, 2)];
        if (r < HOLD || idx >= 2) { u = 0; from = (i) => cur.pts[i]; to = from; col = cur.colour; }
        else { u = ease((r - HOLD) / MOVE); from = (i) => cur.pts[i]; to = (i) => next.pts[i]; col = u < 0.5 ? cur.colour : next.colour; }
      } else {
        u = ease((t0 - (total() - FALL)) / FALL); from = (i) => S[2].pts[i]; to = (i) => ds[i].home; col = idleCol;
      }
      ds.forEach((d, i) => {
        const a = from(i), b = to(i), k = i / (N - 1);
        const arc = Math.sin(u * Math.PI) * (8 + (i % 7));
        d.p = [lerp(a[0], b[0], u) + Math.sin(t * 1.3 + i) * 0.4, lerp(a[1], b[1], u) - arc + Math.cos(t * 1.1 + i * 1.7) * 0.4];
        const c = col(k, t);
        d.dot.setAttribute('cx', f(d.p[0])); d.dot.setAttribute('cy', f(d.p[1])); d.dot.setAttribute('fill', c);
        d.aura.setAttribute('cx', f(d.p[0])); d.aura.setAttribute('cy', f(d.p[1])); d.aura.setAttribute('fill', c);
      });
    },
  };
}
