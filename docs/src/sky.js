// 하늘: 그라데이션, 별, 해와 달(끌어서 시간 바꾸기), 구름, 먼 스카이라인(마린시티·맞은편 언덕).
// 광안리는 남동쪽 바다를 보므로 해와 달이 바다 왼쪽에서 떠올라 오른쪽 위로 넘어간다.
import { el, pen, shape, f } from '../lib/ink.js';
import { rgb, mix, toRGB,              } from '../lib/daynight.js';
import { W, HORIZON, SP, clamp, smooth, srnd, rnd } from './kit.js';

const SUN_SPAN                   = [0.235, 0.42];   // τ 시작, 길이
const MOON_SPAN                   = [0.77, 0.45];
const sunArc = (u        )                   => [90 + 880 * u, HORIZON + 6 - 214 * Math.sin(Math.PI * u * 0.8)];
const moonArc = (u        )                   => [120 + 840 * u, HORIZON + 6 - 196 * Math.sin(Math.PI * u * 0.82)];

export function createSky(svg               , root         , far         , glow         , defs         , onScrub                            ) {
  const grad = el('linearGradient', { id: 'b-sky', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  const s0 = el('stop', { offset: 0 }, grad), s1 = el('stop', { offset: 1 }, grad);
  const mk = (id        , c        , a        ) => { const g = el('radialGradient', { id }, defs); el('stop', { offset: 0, 'stop-color': c, 'stop-opacity': a }, g); el('stop', { offset: 1, 'stop-color': c, 'stop-opacity': 0 }, g); };
  mk('b-sunglow', '#ffd9a0', 0.55); mk('b-moonglow', '#e9e4ff', 0.35); mk('b-warm', '#ffd27a', 0.9);

  const g = el('g', {}, root);
  el('rect', { x: -20, y: -20, width: W + 40, height: HORIZON + 40, fill: 'url(#b-sky)' }, g);

  // 별
  const starG = el('g', {}, g);
  const stars = Array.from({ length: 80 }, () => {
    const x = srnd(0, W), y = srnd(6, 196), r = srnd(0.35, 1.0);
    return { n: el('circle', { cx: f(x), cy: f(y), r: f(r), fill: '#f5efda' }, starG), ph: srnd(0, 6), sp: srnd(0.6, 2.4) };
  });

  // 해와 달
  const sunG = el('g', { style: 'cursor:grab' }, g);
  const sunGlow = el('circle', { r: 70, fill: 'url(#b-sunglow)' }, sunG);
  const sunDisk = el('circle', { r: 19, stroke: 'currentColor', 'stroke-width': SP }, sunG);
  el('title', {}, sunG).textContent = '해를 끌어서 시간 바꾸기';
  const moonG = el('g', { style: 'cursor:grab' }, g);
  el('circle', { r: 56, fill: 'url(#b-moonglow)' }, moonG);
  const moonDisk = el('path', { fill: '#f3ecd6', stroke: '#f3ecd6', 'stroke-width': 0.6 }, moonG);
  el('title', {}, moonG).textContent = '달을 끌어서 시간 바꾸기';

  // 뭉게구름: 위는 둥근 혹, 아래는 거의 평평한 한 줄
  const cloudG = el('g', {}, g);
  const cloudD = (x        , y        , w        ) => {
    const a = w * 0.22, b = w * 0.3, c = w * 0.26;
    return `M${f(x)} ${f(y)} Q${f(x + a * 0.2)} ${f(y - 9)} ${f(x + a)} ${f(y - 6)} Q${f(x + a + b * 0.3)} ${f(y - 17)} ${f(x + a + b)} ${f(y - 9)} `
      + `Q${f(x + a + b + c * 0.4)} ${f(y - 14)} ${f(x + a + b + c)} ${f(y - 5)} Q${f(x + w)} ${f(y - 3)} ${f(x + w)} ${f(y)} `
      + `M${f(x + w * 0.08)} ${f(y + 0.6)} Q${f(x + w * 0.5)} ${f(y + 1.6)} ${f(x + w * 0.9)} ${f(y + 0.4)}`;
  };
  const clouds = [[90, 70, 120], [430, 48, 150], [700, 96, 110], [260, 132, 80]].map(([x, y, w]) => ({ x, y, w, v: rnd(1.4, 2.6), n: pen(cloudG, SP * 0.7) }));

  // 먼 스카이라인: 옅은 먹으로
  const farG = el('g', { opacity: 0.44 }, far);
  // 장산 능선(마린시티 뒤)
  pen(farG, SP * 0.7).setAttribute('d', `M-10 ${HORIZON - 30} Q40 ${HORIZON - 58} 110 ${HORIZON - 70} Q160 ${HORIZON - 78} 210 ${HORIZON - 52} Q240 ${HORIZON - 38} 270 ${HORIZON - 30}`);
  // 마린시티 초고층: 폭, 높이, 꼭대기 모양
  const towers                                          = [[6, 18, 64, 0], [26, 22, 104, 1], [50, 20, 128, 2], [72, 24, 118, 1], [98, 18, 86, 0], [118, 22, 142, 2], [142, 20, 96, 1], [164, 16, 70, 0], [182, 14, 48, 0]];
  const winLines           = [];
  const nightWins                                                                  = [];
  towers.forEach(([x, w, h, top]) => {
    const y = HORIZON - h;
    let d = `M${x} ${HORIZON} L${x} ${y + 6} `;
    if (top === 2) d += `Q${x + w * 0.3} ${y - 6} ${x + w * 0.55} ${y} Q${x + w * 0.8} ${y + 5} ${x + w} ${y + 2} `; // 물결 지붕
    else if (top === 1) d += `Q${x + w / 2} ${y - 5} ${x + w} ${y + 4} `;
    else d += `L${x + 2} ${y} L${x + w - 2} ${y} L${x + w} ${y + 3} `;
    d += `L${x + w} ${HORIZON}Z`;
    shape(farG, SP * 0.8).setAttribute('d', d);
    for (let yy = y + 10; yy < HORIZON - 3; yy += 4.4) winLines.push(`M${f(x + 2.2)} ${f(yy)} L${f(x + w - 2.2)} ${f(yy)}`);
    winLines.push(`M${f(x + w / 2)} ${f(y + 8)} L${f(x + w / 2)} ${HORIZON - 2}`);
    for (let k = 0; k < Math.round(h / 9); k++) {
      const wx = x + srnd(2, w - 4), wy = srnd(y + 10, HORIZON - 4);
      nightWins.push({ x: wx, y: wy, thr: srnd(0.1, 0.7), n: el('rect', { x: f(wx), y: f(wy), width: 1.6, height: 1.1, fill: '#ffe2a6', opacity: 0 }, glow) });
    }
  });
  pen(farG, SP * 0.35).setAttribute('d', winLines.join(' '));
  // 맞은편(오른쪽) 곶: 낮은 언덕과 아파트
  shape(farG, SP * 0.75).setAttribute('d', `M760 ${HORIZON} Q800 ${HORIZON - 16} 850 ${HORIZON - 34} Q900 ${HORIZON - 46} 930 ${HORIZON - 38} Q950 ${HORIZON - 33} 970 ${HORIZON - 30} L970 ${HORIZON}Z`);
  const apts                                  = [[812, 10, 34], [826, 12, 44], [842, 10, 52], [858, 12, 60], [874, 10, 54], [902, 12, 58], [918, 10, 50]];
  const aptLines           = [];
  apts.forEach(([x, w, h]) => {
    shape(farG, SP * 0.7).setAttribute('d', `M${x} ${HORIZON - 4} L${x} ${HORIZON - h} L${x + w} ${HORIZON - h} L${x + w} ${HORIZON - 4}Z`);
    for (let yy = HORIZON - h + 4; yy < HORIZON - 6; yy += 4) aptLines.push(`M${x + 1.6} ${yy} L${x + w - 1.6} ${yy}`);
    for (let k = 0; k < 4; k++) { const wx = x + srnd(1.5, w - 3), wy = srnd(HORIZON - h + 3, HORIZON - 7); nightWins.push({ x: wx, y: wy, thr: srnd(0.1, 0.8), n: el('rect', { x: f(wx), y: f(wy), width: 1.4, height: 1, fill: '#ffe2a6', opacity: 0 }, glow) }); }
  });
  pen(farG, SP * 0.32).setAttribute('d', aptLines.join(' '));

  // 끌기: 포인터 x → 시간
  let drag                        = null;
  const toSvg = (e              ) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM() .inverse()); };
  const start = (kind                ) => (e       ) => { e.preventDefault(); e.stopPropagation(); drag = kind; svg.setPointerCapture?.((e                ).pointerId); svg.classList.add('scrubbing'); };
  sunG.addEventListener('pointerdown', start('sun'));
  moonG.addEventListener('pointerdown', start('moon'));
  svg.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = toSvg(e);
    if (drag === 'sun') onScrub(SUN_SPAN[0] + SUN_SPAN[1] * clamp((p.x - 90) / 880, 0, 1));
    else onScrub((MOON_SPAN[0] + MOON_SPAN[1] * clamp((p.x - 120) / 840, 0, 1)) % 1);
  });
  const end = () => { if (drag) { drag = null; svg.classList.remove('scrubbing'); onScrub(null); } };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);

  return {
    draw(tau        , t        , dt        , P         , wind        ) {
      s0.setAttribute('stop-color', rgb(P.top));
      s1.setAttribute('stop-color', rgb(P.bottom));
      starG.setAttribute('opacity', f(P.night));
      if (P.night > 0.01) stars.forEach((s) => s.n.setAttribute('opacity', f(0.55 + 0.45 * Math.sin(t * s.sp + s.ph))));

      const su = (tau - SUN_SPAN[0]) / SUN_SPAN[1];
      if (su > -0.06 && su < 1.05) {
        const [x, y] = sunArc(clamp(su, 0, 1));
        sunG.setAttribute('transform', `translate(${f(x)} ${f(y + (su < 0 ? -su * 400 : 0))})`);
        sunG.style.display = '';
        sunDisk.setAttribute('fill', rgb(mix(toRGB('#fbf3df'), toRGB('#df5a3a'), Math.max(P.sunset, smooth(0.08, 0, su)))));
        sunGlow.setAttribute('opacity', f(0.35 + 0.65 * P.sunset));
      } else sunG.style.display = 'none';

      const mu = ((((tau - MOON_SPAN[0]) % 1) + 1) % 1) / MOON_SPAN[1];
      if (mu <= 1.02) {
        const [x, y] = moonArc(clamp(mu, 0, 1));
        moonG.setAttribute('transform', `translate(${f(x)} ${f(y)}) rotate(-24)`);
        moonG.style.display = '';
        moonG.setAttribute('opacity', f(smooth(0, 0.06, mu) * smooth(1.02, 0.94, mu)));
        moonDisk.setAttribute('d', `M0 -14 A14 14 0 1 1 0 14 A8.7 14 0 1 0 0 -14Z`);
      } else moonG.style.display = 'none';

      cloudG.setAttribute('opacity', f(0.85 - 0.5 * P.night));
      clouds.forEach((c) => {
        c.x += (c.v + wind * 3) * dt; if (c.x > W + 30) c.x = -c.w - 30; if (c.x < -c.w - 40) c.x = W + 20;
        c.n.setAttribute('d', cloudD(c.x, c.y, c.w));
      });

      nightWins.forEach((w) => w.n.setAttribute('opacity', f(smooth(w.thr, w.thr + 0.2, P.lamp) * 0.85)));
    },
  };
}
