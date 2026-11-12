// 잠시 머물다 가는 사람들: 물가에서 모래 파는 아이, 기타 치는 버스커, 돗자리에서 치맥하는 친구들.
// 정해진 시간이 되면 화면 밖에서 걸어 들어와 자리를 펴고(settle), 머물다(stay),
// 때가 되면 짐을 싸서(pack) 걸어 나간다(leave). 걷는 속도는 걸음새 그대로라 발이 미끄러지지 않는다.
import { el, pen, shape, blot, paint, place, toScene, joint, f, pt, PEN,          } from '../lib/ink.js';
import { gait,           } from '../lib/gait.js';
import { spring, ease, smooth, rnd } from '../lib/motion.js';
import { nightTint,              } from '../lib/daynight.js';
import { makeBody, lerpV, lerpArm,          } from './figure.js';
import { W } from './kit.js';

const toLocal = (sx        , sy        , X        , Y        , dir        , s        )      => [40 + (sx - X) / (dir * s), 120 + (sy - Y) / s];
const mixN = (a        , b        , t        ) => a + (b - a) * t;
const leg = (hip     , ankle     , l        , pitch = 0)      => ({ knee: joint(hip, ankle, l, l, 1), ankle, pitch });
const legSwing = (g      , feet       ) => (feet[0].ankle[0] - 40) / (g.stride / 2);
/** 걷는 자세와 앉은 자세 사이를 sit(0..1)로 섞는다 */
const blendLegs = (a       , b       , u        )        => a.map((l, i) => ({ knee: lerpV(l.knee, b[i].knee, u), ankle: lerpV(l.ankle, b[i].ankle, u), pitch: mixN(l.pitch, b[i].pitch, u) }));

                                                                      

/** 오고 머물고 가는 흐름. want는 지금 이 시간에 여기 있고 싶은지. */
export function makeVisit(spot        , settleT = 1.6) {
  let phase        = 'away', x = -80, dir         = 1, t = 0;
  const v = {
    get phase() { return phase; }, get x() { return x; }, get dir() { return dir; },
    get moving() { return phase === 'arrive' || phase === 'leave'; },
    get shown() { return phase !== 'away'; },
    get sit() { return phase === 'settle' ? ease(t / settleT) : phase === 'stay' ? 1 : phase === 'pack' ? 1 - ease(t / settleT) : 0; },
    step(dt        , want         , speed                                   ) {
      t += dt;
      if (phase === 'away') {
        if (want) { dir = spot < W / 2 ? 1 : -1; x = dir > 0 ? -70 : W + 70; phase = 'arrive'; t = 0; } // 자리에서 가까운 쪽으로 들어온다
      } else if (phase === 'arrive') {
        if (!want) { phase = 'leave'; dir = dir === 1 ? -1 : 1; t = 0; return; } // 오다가 시간이 지나면 돌아선다
        x += dir * speed.arrive * dt;
        if ((spot - x) * dir <= 0) { x = spot; phase = 'settle'; t = 0; }
      } else if (phase === 'settle') {
        if (t >= settleT) { phase = 'stay'; t = 0; }
      } else if (phase === 'stay') {
        if (!want) { phase = 'pack'; t = 0; }
      } else if (phase === 'pack') {
        if (t >= settleT) { phase = 'leave'; t = 0; dir = x < W / 2 ? -1 : 1; } // 가까운 쪽으로 나간다
      } else {
        x += dir * speed.leave * dt;
        if (x < -80 || x > W + 80) { phase = 'away'; t = 0; }
      }
    },
  };
  return v;
}

/** 걷는 동안의 다리: 멈추면 두 발이 모인다 */
function walker(g      ) {
  let ph = Math.random();
  const go = spring(80, 14, 0);
  return {
    pose(dt        , moving         ) {
      if (moving) ph += dt / g.period;
      const k = Math.max(0, Math.min(1, go.step(moving ? 1 : 0, dt)));
      const p = g.pose(ph, k);
      return { hip: p.hip, feet: p.feet.map((fo) => ({ knee: fo.knee, ankle: fo.ankle, pitch: fo.pitch }))         , front: p.front, go: k };
    },
  };
}

// ------------------------------------------------------------------ 물가의 아이
export function createKid(parent         , glow         , o                                               , stripes        ) {
  const g = el('g', { style: 'cursor:pointer' }, parent);
  const fig = el('g', {}, g);
  const bucket = paint(fig, '#c8553d', PEN * 0.8), bucketRim = pen(fig, PEN * 0.6), mound = shape(fig, PEN * 0.7);
  const body = makeBody(fig, { legs: null, shorts: '#3f5d8a', top: null, hem: 15, hair: 'cap', capCol: '#e0b23c', kid: true }, stripes);
  const spade = pen(fig, PEN * 0.9), blade = blot(fig);
  const squeal = pen(fig, PEN * 0.6);
  const s = 0.62;
  const run = gait({ kind: 'run' }), walk = gait({ kind: 'walk', thigh: 13, shin: 13, stride: 12, period: 0.72, lift: 2.4, ankleY: 118.4, toe: 3 });
  const runL = walker(run), walkL = walker(walk);
  const visit = makeVisit(o.x, 1.2);
  const stand = spring(30, 9);
  let cheer = -1, flee = 0, hopT = 0, dug = 0, seatDir         = -1;
  void glow;
  return {
    g, visit, get y() { return o.y; }, glows: []             ,
    poke() { if (visit.phase === 'stay' && cheer < 0) cheer = 0; },
    draw(t        , dt        , P         , wind        , want         ) {
      // 신나서 뛰어 오고, 갈 때는 걸어간다
      visit.step(dt, want, { arrive: run.speed * s, leave: walk.speed * s });
      g.style.display = visit.shown ? '' : 'none';
      if (!visit.shown) { dug = 0; return; }
      if (visit.phase === 'settle') seatDir = visit.dir;
      const dir = visit.moving ? visit.dir : seatDir;
      place(fig, visit.x, o.y, dir, s);
      const sit = visit.sit;
      const leaving = visit.phase === 'leave' || visit.phase === 'pack';
      const mv = (leaving ? walkL : runL).pose(dt, visit.moving);
      (leaving ? runL : walkL).pose(dt, false);
      // 머무는 동안: 쪼그려 모래 파기, 파도가 발밑에 오면 일어나 폴짝
      const staying = visit.phase === 'stay';
      const wet = staying && o.washY() > o.y - 4;
      flee = wet ? 1 : Math.max(0, flee - dt * 0.7);
      if (cheer >= 0) { cheer += dt; if (cheer > 2.2) cheer = -1; }
      const upStay = stand.step(flee > 0 || cheer >= 0 ? 1 : 0, dt);
      const up = staying ? upStay : 1 - sit;
      const jumping = staying && (flee > 0.5 || cheer >= 0);
      hopT = jumping ? hopT + dt : 0;
      const hop = jumping ? Math.max(0, Math.sin(hopT * 9)) * 6 * up : 0;
      if (staying) dug = Math.min(1, dug + dt * 0.02);
      const hipC      = [mixN(38, 40, up), mixN(105, 92.6, up) - hop];
      const crouch = [leg(hipC, [mixN(47, 43, up), 118.4 - hop * 0.9], 13), leg(hipC, [mixN(35, 37, up), 118.4 - hop], 13)];
      const k = staying ? 1 : sit;
      const hip = lerpV(mv.hip, hipC, k), feet = blendLegs(mv.feet, crouch, k);
      const dig = (1 - up) * Math.sin(t * 4.2);
      const carry = 1 - k;
      const out = body.draw({ hip, feet, front: k > 0.5 ? 0 : mv.front, swing: legSwing(leaving ? walk : run, mv.feet) * carry, go: mv.go * carry, lean: mixN(leaving ? 0.5 : 3, mixN(5, 0, up), k), headTilt: mixN(0, mixN(1.4, -0.6, up), k), dt, P, wind,
        armN: (d, sh) => lerpArm(d, lerpArm([[sh[0] + 6, sh[1] + 7], [sh[0] + 12 + dig * 2, sh[1] + 12 + dig * 2.4]], [[sh[0] + 3, sh[1] - 7], [sh[0] + 5, sh[1] - 15]], up), k),
        armF: (d, sh) => lerpArm(lerpArm(d, [[sh[0] - 0.6, sh[1] + 9], [sh[0] + 0.4, sh[1] + 18]], 0.7), lerpArm([[sh[0] + 4, sh[1] + 8], [sh[0] + 9, sh[1] + 14]], [[sh[0] - 3, sh[1] - 7], [sh[0] - 2, sh[1] - 15]], up), k) });
      const h = out.handN;
      const tip      = up > 0.5 ? [h[0] + 4, h[1] - 8] : [h[0] + 4 + dig, h[1] + 9];
      spade.setAttribute('d', `M${pt(h)} L${pt(tip)}`);
      blade.setAttribute('d', `M${f(tip[0] - 1.6)} ${f(tip[1])} L${f(tip[0] + 1.6)} ${f(tip[1])} L${f(tip[0] + (up > 0.5 ? 0 : 0.4))} ${f(tip[1] + (up > 0.5 ? -3.4 : 3.4))}Z`);
      // 양동이: 걸을 땐 손에 들고, 앉으면 옆에 내려놓는다
      const b      = k > 0.5 ? [28, 108] : [out.handF[0], out.handF[1] + 1];
      bucket.setAttribute('d', `M${f(b[0] - 4)} ${f(b[1])} L${f(b[0] + 4)} ${f(b[1])} L${f(b[0] + 3)} ${f(b[1] + 10.6)} L${f(b[0] - 3)} ${f(b[1] + 10.6)}Z`);
      bucket.setAttribute('fill', nightTint('#c8553d', P));
      bucketRim.setAttribute('d', `M${f(b[0] - 4)} ${f(b[1])} Q${f(b[0])} ${f(b[1] - 6)} ${f(b[0] + 4)} ${f(b[1])}`);
      // 판 모래 더미는 머문 만큼 자란다
      mound.setAttribute('d', dug > 0.01 ? `M48 119 Q54 ${f(119 - 5.4 * dug)} 62 119Z` : '');
      squeal.setAttribute('d', jumping && Math.sin(t * 8) > -0.2 ? `M${f(out.hc[0] + 6)} ${f(out.hc[1] - 4)} l3 -2 M${f(out.hc[0] + 7)} ${f(out.hc[1])} l3.4 0` : '');
    },
  };
}

// ------------------------------------------------------------------ 버스커
export function createBusker(parent         , glow         , o                          , stripes        ) {
  const g = el('g', { style: 'cursor:pointer' }, parent);
  const fig = el('g', {}, g);
  const kit = el('g', {}, fig);
  const stool = pen(kit, PEN * 0.8);
  const caseN = shape(kit, PEN * 0.8), coins = blot(kit);
  const amp = shape(kit, PEN * 0.8), ampGrill = pen(kit, PEN * 0.45);
  const body = makeBody(fig, { legs: '#8a7a5c', top: '#6f7f6a', hem: 34, hair: 'short' }, stripes);
  const guitarG = el('g', {}, fig);
  const neck = pen(guitarG, PEN * 1.5), gBody = paint(guitarG, '#b07a45', PEN), hole = blot(guitarG), strings = pen(guitarG, PEN * 0.3);
  const carried = shape(fig, PEN * 0.8), handle = pen(fig, PEN * 0.6);
  const notesG = el('g', {}, g);
  const ampGlow = el('circle', { r: 14, fill: 'url(#b-warm)', opacity: 0 }, glow);
  const s = 0.68, seatDir         = -1;
  const walk = gait({ kind: 'walk', stride: 21, period: 1.08 });
  const legs = walker(walk);
  const visit = makeVisit(o.x, 2.2);
  const notes                                                                           = [];
  let burst = 0, nextNote = 0;
  const addNote = (big = false) => {
    const [sx, sy] = toScene(o.x, o.y, seatDir, 54, 66, s);
    notes.push({ x: sx + rnd(-4, 4), y: sy, t: 0, v: rnd(-6, 6) * (big ? 2 : 1), n: el('path', { fill: 'currentColor', stroke: 'currentColor', 'stroke-width': 0.6, 'stroke-linecap': 'round' }, notesG) });
  };
  return {
    g, visit, get y() { return o.y; }, glows: [ampGlow]             ,
    poke() { if (visit.phase !== 'stay') return; burst = 2.4; for (let i = 0; i < 4; i++) setTimeout(() => addNote(true), i * 120); },
    draw(t        , dt        , P         , wind        , want         ) {
      visit.step(dt, want, { arrive: walk.speed * s, leave: walk.speed * s });
      g.style.display = visit.shown ? '' : 'none';
      ampGlow.style.display = visit.shown ? '' : 'none';
      if (!visit.shown) return;
      const dir = visit.moving ? visit.dir : seatDir;
      place(fig, visit.x, o.y, dir, s);
      const sit = visit.sit, playing = visit.phase === 'stay';
      const mv = legs.pose(dt, visit.moving);
      burst = Math.max(0, burst - dt);
      const tempo = burst > 0 ? 7 : 4.2;
      const strum = playing ? Math.sin(t * tempo) : 0;
      const tap = playing ? Math.max(0, Math.sin(t * tempo * 0.5)) * 3 : 0;
      const bob = playing ? Math.max(0, Math.sin(t * tempo * 0.5 + 0.6)) * 0.8 + burst * 0.3 : 0;
      // 의자에 앉은 자세와 걷는 자세를 섞는다
      const seatHip      = [36, 94];
      const seatLegs        = [{ knee: [54, 93], ankle: [58, 118.4], pitch: -tap * 4 }, { knee: [50, 91], ankle: [47, 118.4], pitch: 0 }];
      const hip = lerpV(mv.hip, seatHip, sit), feet = blendLegs(mv.feet, seatLegs, sit);
      const gu = smooth(0.45, 0.8, sit); // 기타를 꺼내 무릎에 올린 정도
      const out = body.draw({ hip, feet, front: sit > 0.5 ? 0 : mv.front, swing: legSwing(walk, mv.feet) * (1 - sit), go: mv.go, lean: mixN(0.6, 1.4, sit), headTilt: mixN(0, 1 + bob, sit), dt, P, wind,
        armN: (d, sh) => lerpArm(lerpArm(d, [[sh[0] + 0.6, sh[1] + 16], [sh[0] + 1.4, sh[1] + 31]], 0.85), [[sh[0] + 3, sh[1] + 15], [sh[0] + 10 + strum * 1.6, sh[1] + 21 - strum * 2.6]], gu),
        armF: (d, sh) => lerpArm(d, [[sh[0] + 9, sh[1] + 9], [sh[0] + 21, sh[1] + 2]], gu) });
      // 걸을 땐 기타 가방을 손에 들고 온다
      if (gu < 0.5) {
        const h = out.handN;
        carried.setAttribute('d', `M${f(h[0] - 15)} ${f(h[1] + 2)} Q${f(h[0] - 17)} ${f(h[1] + 9)} ${f(h[0] - 10)} ${f(h[1] + 9)} L${f(h[0] + 8)} ${f(h[1] + 6.6)} Q${f(h[0] + 12)} ${f(h[1] + 4.4)} ${f(h[0] + 8)} ${f(h[1] + 2.4)} L${f(h[0] - 8)} ${f(h[1] + 1.4)} Q${f(h[0] - 13)} ${f(h[1] + 0.4)} ${f(h[0] - 15)} ${f(h[1] + 2)}Z`);
        handle.setAttribute('d', `M${f(h[0] - 2)} ${f(h[1] + 1.8)} Q${f(h[0])} ${f(h[1] - 1)} ${f(h[0] + 2)} ${f(h[1] + 1.6)}`);
      } else { carried.setAttribute('d', ''); handle.setAttribute('d', ''); }
      guitarG.setAttribute('opacity', f(smooth(0.5, 0.6, gu)));
      kit.setAttribute('opacity', f(smooth(0.25, 0.75, sit)));
      const c      = [out.sh[0] + 9, out.sh[1] + 21];
      gBody.setAttribute('d', `M${f(c[0] - 6)} ${f(c[1] - 1)} Q${f(c[0] - 7)} ${f(c[1] - 7)} ${f(c[0] - 1)} ${f(c[1] - 6)} Q${f(c[0] + 2)} ${f(c[1] - 9)} ${f(c[0] + 5)} ${f(c[1] - 5)} Q${f(c[0] + 9)} ${f(c[1] + 1)} ${f(c[0] + 4)} ${f(c[1] + 5)} Q${f(c[0] - 3)} ${f(c[1] + 8)} ${f(c[0] - 6)} ${f(c[1] - 1)}Z`);
      gBody.setAttribute('fill', nightTint('#b07a45', P));
      hole.setAttribute('d', `M${f(c[0] + 0.6)} ${f(c[1] - 1.6)} a1.6 1.6 0 1 0 0.1 0Z`);
      neck.setAttribute('d', `M${f(c[0] + 2)} ${f(c[1] - 4)} L${f(out.sh[0] + 25)} ${f(out.sh[1] + 0.6)}`);
      strings.setAttribute('d', `M${f(c[0] - 3)} ${f(c[1] + 1)} L${f(out.sh[0] + 25)} ${f(out.sh[1] + 0.2)}`);
      stool.setAttribute('d', `M26 96 L46 96 M29 96 L42 119 M43 96 L30 119`);
      caseN.setAttribute('d', `M60 119 Q62 113 72 113 L94 113 Q100 113 100 119Z`);
      coins.setAttribute('d', `M70 117 a1 0.6 0 1 0 0.1 0 M76 116.6 a1 0.6 0 1 0 0.1 0 M83 117.2 a1 0.6 0 1 0 0.1 0 M89 116.4 a1 0.6 0 1 0 0.1 0`);
      amp.setAttribute('d', `M8 119 L8 103 L22 103 L22 119Z`);
      ampGrill.setAttribute('d', `M11 106 L19 106 M11 109 L19 109 M11 112 L19 112 M11 115 L19 115`);
      const [ax, ay] = toScene(visit.x, o.y, dir, 15, 110, s);
      ampGlow.setAttribute('cx', f(ax)); ampGlow.setAttribute('cy', f(ay)); ampGlow.setAttribute('opacity', f(0.5 * P.lamp * smooth(0.6, 1, sit)));
      if (playing) { nextNote -= dt; if (nextNote < 0) { nextNote = burst > 0 ? 0.3 : rnd(1.2, 2.4); addNote(); } }
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
  const mat = el('path', { stroke: 'currentColor', 'stroke-width': 0.5 }, g), matLines = pen(g, PEN * 0.4 * s);
  const gB = el('g', {}, g), gA = el('g', {}, g), props = el('g', {}, g);
  const A = makeBody(gA, { legs: '#5a6d8f', top: '#e0b23c', hem: 33, hair: 'pony' }, stripes);
  const B = makeBody(gB, { legs: '#8a7a5c', top: null, stripes: true, hem: 33, hair: 'short' }, stripes);
  const canA = paint(gA, '#9db6c4', PEN * 0.7), canB = paint(gB, '#c8553d', PEN * 0.7);
  const roll = paint(gA, '#cfe0e6', PEN * 0.7), bag = shape(gB, PEN * 0.7), bagLines = pen(gB, PEN * 0.45);
  const box = shape(props, 0.7), boxLines = pen(props, 0.4), chick = blot(props);
  const label = el('text', { 'font-size': 3.4, 'font-family': '"Nanum Gothic","Malgun Gothic",sans-serif', 'font-weight': 700, fill: 'currentColor', 'text-anchor': 'middle' }, props);
  label.textContent = '치킨';
  const lantern = shape(props, 0.6), lanternGlow = el('circle', { r: 16, fill: 'url(#b-warm)', opacity: 0 }, glow);
  const clinkN = pen(props, 0.6);
  const walk = gait({ kind: 'walk', stride: 21, period: 1.06 });
  const legsA = walker(walk), legsB = walker(walk);
  const visit = makeVisit(o.x, 2.4);
  let cheers = -1, sipA = rnd(2, 6), sipB = rnd(4, 9), laugh = 0, enter         = 1;
  const sipping = (v        ) => (v > 0 && v < 1.6 ? Math.sin((v / 1.6) * Math.PI) : 0);
  const seatHip      = [36, 116];
  const seatLegs        = [{ knee: [52, 102], ankle: [58, 118.6], pitch: 0 }, { knee: [49, 101], ankle: [55, 118.8], pitch: 0 }];
  return {
    g, visit, get y() { return o.y; }, glows: [lanternGlow]             ,
    poke() { if (visit.phase === 'stay' && cheers < 0) cheers = 0; },
    draw(t        , dt        , P         , wind        , want         ) {
      visit.step(dt, want, { arrive: walk.speed * s, leave: walk.speed * s });
      g.style.display = visit.shown ? '' : 'none';
      lanternGlow.style.display = visit.shown ? '' : 'none';
      if (!visit.shown) return;
      if (visit.phase === 'arrive') enter = visit.dir;
      const sit = visit.sit, staying = visit.phase === 'stay';
      // 걸을 땐 나란히(앞뒤 16), 앉을 땐 돗자리 양 끝에 마주 본다: A는 앞자리에서 돌아앉는다
      const walkA = visit.x + visit.dir * 8, walkB = visit.x - visit.dir * 8;
      const seatA = o.x + enter * 26, seatB = o.x - enter * 26;
      const XA = visit.moving ? walkA : mixN(o.x + enter * 8, seatA, smooth(0, 0.6, sit));
      const XB = visit.moving ? walkB : mixN(o.x - enter * 8, seatB, smooth(0, 0.6, sit));
      const dA         = visit.moving ? visit.dir : (-enter          ), dB         = visit.moving ? visit.dir : enter;
      place(gA, XA, o.y, dA, s); place(gB, XB, o.y - (visit.moving ? 4 : 0), dB, s);
      // 돗자리: 앉으며 펼치고, 일어나며 만다
      const mu = smooth(0.15, 0.85, sit);
      const half = 56 * mu, x0 = o.x - half, x1 = o.x + half;
      mat.setAttribute('d', mu > 0.02 ? `M${f(x0)} ${f(o.y - 5)} L${f(x1)} ${f(o.y - 5)} L${f(x1 + 6 * mu)} ${f(o.y + 4)} L${f(x0 - 6 * mu)} ${f(o.y + 4)}Z` : '');
      mat.setAttribute('fill', nightTint('#cfe0e6', P));
      matLines.setAttribute('d', mu > 0.02 ? [-40, -20, 0, 20, 40].map((d) => `M${f(o.x + d * mu)} ${f(o.y - 5)} L${f(o.x + d * 1.1 * mu)} ${f(o.y + 4)}`).join(' ') : '');
      props.setAttribute('opacity', f(smooth(0.6, 0.9, sit)));
      if (cheers >= 0) { cheers += dt; if (cheers > 2.4) { cheers = -1; laugh = 1.4; } }
      const cv = cheers < 0 ? 0 : cheers < 0.5 ? ease(cheers / 0.5) : cheers < 1.8 ? 1 : 1 - ease((cheers - 1.8) / 0.6);
      sipA -= dt; sipB -= dt; laugh = Math.max(0, laugh - dt);
      if (sipA < -1.6) sipA = rnd(5, 10); if (sipB < -1.6) sipB = rnd(6, 12);
      const sa = staying && cheers < 0 ? sipping(-sipA) : 0, sb = staying && cheers < 0 ? sipping(-sipB) : 0;
      const meetS      = [o.x, o.y - 30 * s];
      const drawOne = (body                             , legsW                           , X        , dir        , sip        , can                , col        , laughHead        ) => {
        const meet = toLocal(meetS[0], meetS[1], X, o.y, dir, s);
        const mv = legsW.pose(dt, visit.moving);
        const hip = lerpV(mv.hip, seatHip, sit), feet = blendLegs(mv.feet, seatLegs, sit);
        const out = body.draw({ hip, feet, front: sit > 0.5 ? 0 : mv.front, swing: legSwing(walk, mv.feet) * (1 - sit), go: mv.go, lean: mixN(0.6, 1 - laughHead * 2, sit), headTilt: (-laughHead * 1.6 - sip) * sit, dt, P, wind,
          armF: (d, sh) => lerpArm(d, [[sh[0] + 6, sh[1] + 12], [sh[0] + 14, sh[1] + 15]], sit),
          armN: (d, sh) => {
            const rest             = [[sh[0] + 5, sh[1] + 13], [sh[0] + 14, sh[1] + 11]];
            const drink             = [[sh[0] + 7, sh[1] + 9], [sh[0] + 5, sh[1] - 4]];
            const up             = [lerpV(sh, meet, 0.55), [meet[0] - 2, meet[1] + 3]];
            const carry             = [[sh[0] + 0.8, sh[1] + 15], [sh[0] + 4, sh[1] + 28]];
            return lerpArm(lerpArm(d, carry, 0.75), lerpArm(lerpArm(rest, drink, sip), up, cv), sit);
          } });
        const h = out.handN;
        can.setAttribute('d', sit > 0.7 ? `M${f(h[0] - 1.4)} ${f(h[1] - 4)} L${f(h[0] + 1.4)} ${f(h[1] - 4)} L${f(h[0] + 1.4)} ${f(h[1] + 1.6)} L${f(h[0] - 1.4)} ${f(h[1] + 1.6)}Z` : '');
        can.setAttribute('fill', nightTint(col, P));
        return h;
      };
      const lA = laugh > 0 ? Math.abs(Math.sin(laugh * 8)) * 0.8 : 0;
      const hA = drawOne(A, legsA, XA, dA, sa, canA, '#9db6c4', lA * 0.5);
      const hB = drawOne(B, legsB, XB, dB, sb, canB, '#c8553d', lA);
      // 들고 오는 짐: A는 말아 둔 돗자리, B는 치킨 봉지
      const carrying = sit < 0.3;
      roll.setAttribute('d', carrying ? `M${f(hA[0] - 3)} ${f(hA[1] - 1)} L${f(hA[0] + 3)} ${f(hA[1] - 1)} L${f(hA[0] + 3)} ${f(hA[1] + 16)} Q${f(hA[0])} ${f(hA[1] + 18)} ${f(hA[0] - 3)} ${f(hA[1] + 16)}Z` : '');
      roll.setAttribute('fill', nightTint('#cfe0e6', P));
      bag.setAttribute('d', carrying ? `M${f(hB[0] - 5)} ${f(hB[1] + 3)} L${f(hB[0] + 5)} ${f(hB[1] + 3)} L${f(hB[0] + 5.6)} ${f(hB[1] + 12)} L${f(hB[0] - 5.6)} ${f(hB[1] + 12)}Z` : '');
      bagLines.setAttribute('d', carrying ? `M${f(hB[0] - 2.4)} ${f(hB[1] + 3)} Q${f(hB[0])} ${f(hB[1] - 2)} ${f(hB[0] + 2.4)} ${f(hB[1] + 3)}` : '');
      // 치킨 상자와 랜턴
      const bx = o.x - 4, by = o.y;
      box.setAttribute('d', `M${f(bx - 7)} ${f(by)} L${f(bx + 7)} ${f(by)} L${f(bx + 7)} ${f(by - 6)} L${f(bx - 7)} ${f(by - 6)}Z`);
      boxLines.setAttribute('d', `M${f(bx - 7)} ${f(by - 6)} L${f(bx - 9)} ${f(by - 10)} L${f(bx + 5)} ${f(by - 10)} L${f(bx + 7)} ${f(by - 6)}`);
      chick.setAttribute('d', `M${f(bx - 5)} ${f(by - 6.4)} q2 -2.6 4 -0.8 q2 -2 4 0.6Z`);
      label.setAttribute('x', f(bx)); label.setAttribute('y', f(by - 1.6));
      const lx = o.x + 52, ly = o.y;
      lantern.setAttribute('d', `M${f(lx - 2)} ${f(ly)} L${f(lx + 2)} ${f(ly)} L${f(lx + 2.4)} ${f(ly - 6)} Q${f(lx)} ${f(ly - 8)} ${f(lx - 2.4)} ${f(ly - 6)}Z`);
      lantern.style.fill = P.lamp > 0.4 && sit > 0.8 ? '#ffe2a0' : '';
      lanternGlow.setAttribute('cx', f(lx)); lanternGlow.setAttribute('cy', f(ly - 4)); lanternGlow.setAttribute('opacity', f(Math.max(0, P.lamp - 0.3) * 0.9 * smooth(0.8, 1, sit)));
      clinkN.setAttribute('d', cv > 0.95 ? `M${f(meetS[0] - 3)} ${f(meetS[1] - 5)} l-2 -3 M${f(meetS[0])} ${f(meetS[1] - 6)} l0 -3.6 M${f(meetS[0] + 3)} ${f(meetS[1] - 5)} l2 -3` : '');
    },
  };
}
