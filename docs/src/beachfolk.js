// 한자리에 머무는 사람들: 물가에서 모래 파다 파도를 피하는 아이, 기타 치는 버스커, 돗자리에서 치맥하는 친구들.
import { el, pen, shape, blot, paint, place, toScene, joint, f, pt, PEN,          } from '../lib/ink.js';
import { spring, ease, rnd } from '../lib/motion.js';
import { nightTint,              } from '../lib/daynight.js';
import { makeBody, lerpV, lerpArm } from './figure.js';

const toLocal = (sx        , sy        , X        , Y        , dir        , s        )      => [40 + (sx - X) / (dir * s), 120 + (sy - Y) / s];
const mixN = (a        , b        , t        ) => a + (b - a) * t;
const leg = (hip     , ankle     , l        , pitch = 0) => ({ knee: joint(hip, ankle, l, l, 1), ankle, pitch });

// ------------------------------------------------------------------ 물가의 아이
export function createKid(parent         , glow         , o                                               , stripes        ) {
  const g = el('g', { style: 'cursor:pointer' }, parent);
  const bucket = paint(g, '#c8553d', PEN * 0.8), bucketRim = pen(g, PEN * 0.6), mound = shape(g, PEN * 0.7);
  const body = makeBody(g, { legs: null, shorts: '#3f5d8a', top: null, hem: 15, hair: 'cap', capCol: '#e0b23c', kid: true }, stripes);
  const spade = pen(g, PEN * 0.9), blade = blot(g);
  const squeal = pen(g, PEN * 0.6);
  const s = 0.62, dir         = -1; // 아이는 왼쪽을 본다
  const stand = spring(30, 9), hopS = spring(200, 10);
  let cheer = -1, flee = 0, hopT = 0;
  place(g, o.x, o.y, dir, s);
  void glow;
  return {
    g, y: o.y, glows: []             ,
    poke() { if (cheer < 0) cheer = 0; },
    draw(t        , dt        , P         , wind        ) {
      const wet = o.washY() > o.y - 4;
      flee = wet ? 1 : Math.max(0, flee - dt * 0.7);
      if (cheer >= 0) { cheer += dt; if (cheer > 2.2) cheer = -1; }
      const up = stand.step(flee > 0 || cheer >= 0 ? 1 : 0, dt);
      const jumping = flee > 0.5 || cheer >= 0;
      hopT = jumping ? hopT + dt : 0;
      const hop = jumping ? Math.max(0, Math.sin(hopT * 9)) * 6 * up : hopS.step(0, dt) * 0;
      // 쪼그려 앉기 ↔ 일어서기
      const hip      = [mixN(38, 40, up), mixN(105, 92.6, up) - hop];
      const fN      = [mixN(47, 43, up), 118.4 - hop * 0.9], fF      = [mixN(35, 37, up), 118.4 - hop];
      const dig = (1 - up) * Math.sin(t * 4.2);
      const out = body.draw({ hip, feet: [leg(hip, fN, 13), leg(hip, fF, 13)], front: 0, swing: 0, go: 0, lean: mixN(5, 0, up), headTilt: mixN(1.4, -0.6, up), dt, P, wind,
        armN: (d, sh) => lerpArm([[sh[0] + 6, sh[1] + 7], [sh[0] + 12 + dig * 2, sh[1] + 12 + dig * 2.4]], [[sh[0] + 3, sh[1] - 7], [sh[0] + 5, sh[1] - 15]], up),
        armF: (d, sh) => lerpArm([[sh[0] + 4, sh[1] + 8], [sh[0] + 9, sh[1] + 14]], [[sh[0] - 3, sh[1] - 7], [sh[0] - 2, sh[1] - 15]], up) });
      // 삽: 앉아 있을 땐 손에서 모래로, 서면 머리 위로 흔든다
      const h = out.handN;
      const tip      = up > 0.5 ? [h[0] + 4, h[1] - 8] : [h[0] + 4 + dig, h[1] + 9];
      spade.setAttribute('d', `M${pt(h)} L${pt(tip)}`);
      blade.setAttribute('d', `M${f(tip[0] - 1.6)} ${f(tip[1])} L${f(tip[0] + 1.6)} ${f(tip[1])} L${f(tip[0] + (up > 0.5 ? 0 : 0.4))} ${f(tip[1] + (up > 0.5 ? -3.4 : 3.4))}Z`);
      bucket.setAttribute('d', `M24 108 L32 108 L31 118.6 L25 118.6Z`);
      bucket.setAttribute('fill', nightTint('#c8553d', P));
      bucketRim.setAttribute('d', `M24 108 Q28 102 32 108`);
      mound.setAttribute('d', `M48 119 Q54 ${f(113.6 - Math.min(2, t * 0.02))} 62 119Z`);
      squeal.setAttribute('d', up > 0.5 && Math.sin(t * 8) > -0.2 ? `M${f(out.hc[0] + 6)} ${f(out.hc[1] - 4)} l3 -2 M${f(out.hc[0] + 7)} ${f(out.hc[1])} l3.4 0` : '');
    },
  };
}

// ------------------------------------------------------------------ 버스커
export function createBusker(parent         , glow         , o                          , stripes        ) {
  const g = el('g', { style: 'cursor:pointer' }, parent);
  const fig = el('g', {}, g);
  const stool = pen(fig, PEN * 0.8);
  const caseN = shape(fig, PEN * 0.8), coins = blot(fig);
  const amp = shape(fig, PEN * 0.8), ampGrill = pen(fig, PEN * 0.45);
  const body = makeBody(fig, { legs: '#8a7a5c', top: '#6f7f6a', hem: 34, hair: 'short' }, stripes);
  const guitarG = el('g', {}, fig);
  const neck = pen(guitarG, PEN * 1.5), gBody = paint(guitarG, '#b07a45', PEN), hole = blot(guitarG), strings = pen(guitarG, PEN * 0.3);
  const notesG = el('g', {}, g);
  const ampGlow = el('circle', { r: 14, fill: 'url(#b-warm)', opacity: 0 }, glow);
  const s = 0.68, dir         = -1;
  const notes                                                                           = [];
  let burst = 0, nextNote = 0;
  place(fig, o.x, o.y, dir, s);
  const addNote = (big = false) => {
    const [sx, sy] = toScene(o.x, o.y, dir, 54, 66, s);
    notes.push({ x: sx + rnd(-4, 4), y: sy, t: 0, v: rnd(-6, 6), n: el('path', { fill: 'currentColor', stroke: 'currentColor', 'stroke-width': 0.6, 'stroke-linecap': 'round' }, notesG) });
    if (big) notes[notes.length - 1].v *= 2;
  };
  return {
    g, y: o.y, glows: [ampGlow]             ,
    poke() { burst = 2.4; for (let i = 0; i < 4; i++) setTimeout(() => addNote(true), i * 120); },
    draw(t        , dt        , P         , wind        ) {
      burst = Math.max(0, burst - dt);
      const tempo = burst > 0 ? 7 : 4.2;
      const strum = Math.sin(t * tempo);
      const tap = Math.max(0, Math.sin(t * tempo * 0.5)) * 3;
      const bob = Math.max(0, Math.sin(t * tempo * 0.5 + 0.6)) * 0.8 + burst * 0.3;
      stool.setAttribute('d', `M26 96 L46 96 M29 96 L42 119 M43 96 L30 119`);
      // 엉덩이는 의자 위, 무릎 앞, 발은 모래에(한쪽 발은 박자를 탐)
      const hip      = [36, 94];
      const out = body.draw({ hip, feet: [{ knee: [54, 93], ankle: [58, 118.4], pitch: -tap * 4 }, { knee: [50, 91], ankle: [47, 118.4], pitch: 0 }], front: 0, swing: 0, go: 0, lean: 1.4, headTilt: 1 + bob, dt, P, wind,
        armN: (_d, sh) => [[sh[0] + 3, sh[1] + 15], [sh[0] + 10 + strum * 1.6, sh[1] + 21 - strum * 2.6]],
        armF: (_d, sh) => [[sh[0] + 9, sh[1] + 9], [sh[0] + 21, sh[1] + 2]] });
      // 기타: 무릎 위 몸통, 목은 앞 위로
      const c      = [out.sh[0] + 9, out.sh[1] + 21];
      gBody.setAttribute('d', `M${f(c[0] - 6)} ${f(c[1] - 1)} Q${f(c[0] - 7)} ${f(c[1] - 7)} ${f(c[0] - 1)} ${f(c[1] - 6)} Q${f(c[0] + 2)} ${f(c[1] - 9)} ${f(c[0] + 5)} ${f(c[1] - 5)} Q${f(c[0] + 9)} ${f(c[1] + 1)} ${f(c[0] + 4)} ${f(c[1] + 5)} Q${f(c[0] - 3)} ${f(c[1] + 8)} ${f(c[0] - 6)} ${f(c[1] - 1)}Z`);
      gBody.setAttribute('fill', nightTint('#b07a45', P));
      hole.setAttribute('d', `M${f(c[0] + 0.6)} ${f(c[1] - 1.6)} a1.6 1.6 0 1 0 0.1 0Z`);
      neck.setAttribute('d', `M${f(c[0] + 2)} ${f(c[1] - 4)} L${f(out.sh[0] + 25)} ${f(out.sh[1] + 0.6)}`);
      strings.setAttribute('d', `M${f(c[0] - 3)} ${f(c[1] + 1)} L${f(out.sh[0] + 25)} ${f(out.sh[1] + 0.2)}`);
      // 기타 가방과 동전, 작은 앰프
      caseN.setAttribute('d', `M60 119 Q62 113 72 113 L94 113 Q100 113 100 119Z`);
      coins.setAttribute('d', `M70 117 a1 0.6 0 1 0 0.1 0 M76 116.6 a1 0.6 0 1 0 0.1 0 M83 117.2 a1 0.6 0 1 0 0.1 0 M89 116.4 a1 0.6 0 1 0 0.1 0`);
      amp.setAttribute('d', `M8 119 L8 103 L22 103 L22 119Z`);
      ampGrill.setAttribute('d', `M11 106 L19 106 M11 109 L19 109 M11 112 L19 112 M11 115 L19 115`);
      const [ax, ay] = toScene(o.x, o.y, dir, 15, 110, s);
      ampGlow.setAttribute('cx', f(ax)); ampGlow.setAttribute('cy', f(ay)); ampGlow.setAttribute('opacity', f(0.5 * P.lamp));
      // 음표가 떠오름
      nextNote -= dt; if (nextNote < 0) { nextNote = burst > 0 ? 0.3 : rnd(1.2, 2.4); addNote(); }
      for (let i = notes.length - 1; i >= 0; i--) {
        const n = notes[i]; n.t += dt;
        const x = n.x + n.v * n.t + Math.sin(n.t * 3) * 2, y = n.y - n.t * 9;
        n.n.setAttribute('d', `M${f(x)} ${f(y)} a1.4 1 -20 1 0 0.1 0Z M${f(x + 1.3)} ${f(y)} L${f(x + 1.3)} ${f(y - 6)} Q${f(x + 3.4)} ${f(y - 5)} ${f(x + 3.6)} ${f(y - 2.6)}`);
        n.n.setAttribute('opacity', f(Math.min(1, n.t * 3) * Math.max(0, 1 - n.t / 3.2) * 0.8));
        if (n.t > 3.2) { n.n.remove(); notes.splice(i, 1); }
      }
    },
  };
}

// ------------------------------------------------------------------ 돗자리 치맥
export function createPicnic(parent         , glow         , o                          , stripes        ) {
  const g = el('g', { style: 'cursor:pointer' }, parent);
  const s = 0.66;
  const mat = el('path', {}, g), matLines = pen(g, PEN * 0.4 * s);
  const XA = o.x - 26, XB = o.x + 26;
  const gA = el('g', {}, g), gB = el('g', {}, g), props = el('g', {}, g);
  const A = makeBody(gA, { legs: '#5a6d8f', top: '#e0b23c', hem: 33, hair: 'pony' }, stripes);
  const B = makeBody(gB, { legs: '#8a7a5c', top: null, stripes: true, hem: 33, hair: 'short' }, stripes);
  const canA = paint(gA, '#9db6c4', PEN * 0.7), canB = paint(gB, '#c8553d', PEN * 0.7);
  const box = shape(props, 0.7), boxLines = pen(props, 0.4), chick = blot(props);
  const label = el('text', { 'font-size': 3.4, 'font-family': '"Nanum Gothic","Malgun Gothic",sans-serif', 'font-weight': 700, fill: 'currentColor', 'text-anchor': 'middle' }, props);
  label.textContent = '치킨';
  const lantern = shape(props, 0.6), lanternGlow = el('circle', { r: 16, fill: 'url(#b-warm)', opacity: 0 }, glow);
  const clinkN = pen(props, 0.6);
  place(gA, XA, o.y, 1, s); place(gB, XB, o.y, -1, s);
  let cheers = -1, sipA = rnd(2, 6), sipB = rnd(4, 9), laugh = 0;
  const sipping = (v        ) => (v > 0 && v < 1.6 ? Math.sin((v / 1.6) * Math.PI) : 0);
  return {
    g, y: o.y, glows: [lanternGlow]             ,
    poke() { if (cheers < 0) cheers = 0; },
    draw(t        , dt        , P         , wind        ) {
      mat.setAttribute('d', `M${f(o.x - 56)} ${f(o.y - 5)} L${f(o.x + 56)} ${f(o.y - 5)} L${f(o.x + 62)} ${f(o.y + 4)} L${f(o.x - 62)} ${f(o.y + 4)}Z`);
      mat.setAttribute('fill', nightTint('#cfe0e6', P)); mat.setAttribute('stroke', 'currentColor'); mat.setAttribute('stroke-width', 0.5);
      matLines.setAttribute('d', [-40, -20, 0, 20, 40].map((d) => `M${f(o.x + d)} ${f(o.y - 5)} L${f(o.x + d * 1.1)} ${f(o.y + 4)}`).join(' '));
      if (cheers >= 0) { cheers += dt; if (cheers > 2.4) { cheers = -1; laugh = 1.4; } }
      const cv = cheers < 0 ? 0 : cheers < 0.5 ? ease(cheers / 0.5) : cheers < 1.8 ? 1 : 1 - ease((cheers - 1.8) / 0.6);
      sipA -= dt; sipB -= dt; laugh = Math.max(0, laugh - dt);
      if (sipA < -1.6) sipA = rnd(5, 10); if (sipB < -1.6) sipB = rnd(6, 12);
      const sa = cheers < 0 ? sipping(-sipA) : 0, sb = cheers < 0 ? sipping(-sipB) : 0;
      // 짠: 두 캔이 가운데 위에서 만난다
      const meetS      = [o.x, o.y - 30 * s];
      const seat = (hipX        ) => ({ hip: [hipX, 116]       , feet: [{ knee: [52, 102]       , ankle: [58, 118.6]       , pitch: 0 }, { knee: [49, 101]       , ankle: [55, 118.8]       , pitch: 0 }] });
      const draw = (body                             , X        , dir        , sip        , can                , col        , laughHead        ) => {
        const meet = toLocal(meetS[0], meetS[1], X, o.y, dir, s);
        const st = seat(36);
        const out = body.draw({ ...st, front: 0, swing: 0, go: 0, lean: 1 - laughHead * 2, headTilt: -laughHead * 1.6 + sip * -1, dt, P, wind,
          armF: (_d, sh) => [[sh[0] + 6, sh[1] + 12], [sh[0] + 14, sh[1] + 15]],
          armN: (_d, sh) => {
            const rest             = [[sh[0] + 5, sh[1] + 13], [sh[0] + 14, sh[1] + 11]];
            const drink             = [[sh[0] + 7, sh[1] + 9], [sh[0] + 5, sh[1] - 4]];
            const up             = [lerpV(sh, meet, 0.55), [meet[0] - 2, meet[1] + 3]];
            return lerpArm(lerpArm(rest, drink, sip), up, cv);
          } });
        const h = out.handN;
        can.setAttribute('d', `M${f(h[0] - 1.4)} ${f(h[1] - 4)} L${f(h[0] + 1.4)} ${f(h[1] - 4)} L${f(h[0] + 1.4)} ${f(h[1] + 1.6)} L${f(h[0] - 1.4)} ${f(h[1] + 1.6)}Z`);
        can.setAttribute('fill', nightTint(col, P));
      };
      const lA = laugh > 0 ? Math.abs(Math.sin(laugh * 8)) * 0.8 : 0;
      draw(A, XA, 1, sa, canA, '#9db6c4', lA * 0.5);
      draw(B, XB, -1, sb, canB, '#c8553d', lA);
      // 치킨 상자와 조명
      const bx = o.x - 4, by = o.y;
      box.setAttribute('d', `M${f(bx - 7)} ${f(by)} L${f(bx + 7)} ${f(by)} L${f(bx + 7)} ${f(by - 6)} L${f(bx - 7)} ${f(by - 6)}Z`);
      boxLines.setAttribute('d', `M${f(bx - 7)} ${f(by - 6)} L${f(bx - 9)} ${f(by - 10)} L${f(bx + 5)} ${f(by - 10)} L${f(bx + 7)} ${f(by - 6)}`);
      chick.setAttribute('d', `M${f(bx - 5)} ${f(by - 6.4)} q2 -2.6 4 -0.8 q2 -2 4 0.6Z`);
      label.setAttribute('x', f(bx)); label.setAttribute('y', f(by - 1.6));
      const lx = o.x + 52, ly = o.y;
      lantern.setAttribute('d', `M${f(lx - 2)} ${f(ly)} L${f(lx + 2)} ${f(ly)} L${f(lx + 2.4)} ${f(ly - 6)} Q${f(lx)} ${f(ly - 8)} ${f(lx - 2.4)} ${f(ly - 6)}Z`);
      lantern.style.fill = P.lamp > 0.4 ? '#ffe2a0' : '';
      lanternGlow.setAttribute('cx', f(lx)); lanternGlow.setAttribute('cy', f(ly - 4)); lanternGlow.setAttribute('opacity', f(Math.max(0, P.lamp - 0.3) * 0.9));
      clinkN.setAttribute('d', cv > 0.95 ? `M${f(meetS[0] - 3)} ${f(meetS[1] - 5)} l-2 -3 M${f(meetS[0])} ${f(meetS[1] - 6)} l0 -3.6 M${f(meetS[0] + 3)} ${f(meetS[1] - 5)} l2 -3` : '');
    },
  };
}
