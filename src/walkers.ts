// 모래사장을 가로지르는 사람들: 손잡은 연인, 조깅하는 사람, 강아지와 산책하는 할아버지.
import { el, pen, shape, blot, place, toScene, f, pt, PEN, type Vec } from '../lib/ink.ts';
import { gait, type Pose } from '../lib/gait.ts';
import { spring, ease, minJerk } from '../lib/motion.ts';
import type { Palette } from '../lib/daynight.ts';
import { makeBody, lerpV, lerpArm } from './figure.ts';
import { W } from './kit.ts';

export const depthScale = (y: number) => 0.6 + (y - 392) * 0.0035;
const legsOf = (p: Pose) => p.feet.map((fo) => ({ knee: fo.knee, ankle: fo.ankle, pitch: fo.pitch }));
const legSwing = (p: Pose, stride: number) => (p.feet[0].ankle[0] - 40) / (stride / 2);
/** 장면 좌표 → 인물 공간 */
const toLocal = (sx: number, sy: number, X: number, Y: number, dir: number, s: number): Vec => [40 + (sx - X) / (dir * s), 120 + (sy - Y) / s];

/** 클릭 반응의 진행: 0 → 1(유지) → 0 */
function reaction(len: number, inT = 0.5, outT = 0.5) {
  let t = -1;
  return {
    start() { if (t < 0) t = 0; },
    get active() { return t >= 0; },
    get t() { return t; },
    step(dt: number) {
      if (t < 0) return 0;
      t += dt;
      const v = t < inT ? ease(t / inT) : t < len - outT ? 1 : 1 - ease((t - (len - outT)) / outT);
      if (t > len) t = -1;
      return v;
    },
  };
}

export interface Walker { g: SVGGElement; kind: string; y: number; done: boolean; poke(): void; remove(): void; draw(t: number, dt: number, P: Palette, wind: number): void }

// ------------------------------------------------------------------ 연인
export function createCouple(parent: Element, glow: Element, o: { x: number; y: number; dir: 1 | -1 }, stripes: string): Walker {
  const g = el('g', { style: 'cursor:pointer' }, parent);
  const gB = el('g', {}, g), gA = el('g', {}, g);
  const B = makeBody(gB, { legs: null, dress: '#d9a441', top: null, hem: 17, hair: 'long' }, stripes);
  const A = makeBody(gA, { legs: '#2c2c30', top: null, stripes: true, hair: 'cap', capCol: '#3f5d8a' }, stripes);
  const phoneN = blot(gA);
  const flashN = el('circle', { r: 10, fill: 'url(#b-warm)', opacity: 0 }, glow);
  const wa = gait({ kind: 'walk', stride: 22, period: 1.05 });
  const wb = gait({ kind: 'walk', stride: 20, period: (20 / 22) * 1.05 });
  const sA = depthScale(o.y), sB = depthScale(o.y - 9);
  let x = o.x, phA = Math.random(), phB = phA + 0.13, flash = 0;
  const dir = o.dir, selfie = reaction(4, 0.7, 0.6);
  const self: Walker = {
    g, kind: 'couple', y: o.y, done: false,
    poke() { selfie.start(); },
    remove() { g.remove(); flashN.remove(); },
    draw(t, dt, P, wind) {
      const sv = selfie.step(dt), go = 1 - sv;
      if (selfie.active && selfie.t > 2.2 && selfie.t - dt <= 2.2) flash = 1;
      flash = Math.max(0, flash - dt * 3);
      phA += (dt / wa.period) * go; phB += (dt / wb.period) * go;
      x += dir * wa.speed * sA * dt * go;
      if (x > W + 70 || x < -70) self.done = true;
      const XB = x - dir * 9, YB = o.y - 9; // 연인은 반걸음 뒤, 조금 더 먼 쪽에서 걷는다
      place(gA, x, o.y, dir, sA); place(gB, XB, YB, dir, sB);
      const pA = wa.pose(phA, go), pB = wb.pose(phB, go);
      // 맞잡은 손: 두 사람 사이, 엉덩이 높이
      const holdS: Vec = [x - dir * 5, o.y - 25 * sA];
      const holdA = toLocal(holdS[0], holdS[1], x, o.y, dir, sA), holdB = toLocal(holdS[0], holdS[1], XB, YB, dir, sB);
      B.draw({ hip: pB.hip, feet: legsOf(pB), front: pB.front, swing: legSwing(pB, wb.stride), go, headTilt: 1.6 * sv, lean: 1.2 * sv, dt, P, wind,
        armN: (d, s) => lerpArm([lerpV(s, holdB, 0.55), holdB], d, 0.15) });
      const outA = A.draw({ hip: pA.hip, feet: legsOf(pA), front: pA.front, swing: legSwing(pA, wa.stride), go, headTilt: -0.6 * sv, dt, P, wind,
        armF: (d, s) => lerpArm([lerpV(s, holdA, 0.55), holdA], d, 0.15),
        armN: (d, s) => lerpArm(d, [[s[0] + 9, s[1] - 9], [s[0] + 13, s[1] - 22]], sv) });
      // 셀카: 휴대폰은 손 위, 화면이 둘을 향함
      const ph = outA.handN;
      phoneN.setAttribute('d', sv > 0.05 ? `M${f(ph[0] - 1.6)} ${f(ph[1] - 2.6)} L${f(ph[0] + 0.2)} ${f(ph[1] - 3)} L${f(ph[0] + 0.6)} ${f(ph[1] + 2.4)} L${f(ph[0] - 1.2)} ${f(ph[1] + 2.8)}Z` : '');
      const [fx, fy] = toScene(x, o.y, dir, ph[0], ph[1], sA);
      flashN.setAttribute('cx', f(fx)); flashN.setAttribute('cy', f(fy)); flashN.setAttribute('opacity', f(flash * (0.45 + 0.55 * P.lamp)));
    },
  };
  return self;
}

// ------------------------------------------------------------------ 조깅
export function createJogger(parent: Element, o: { x: number; y: number; dir: 1 | -1 }, stripes: string): Walker {
  const g = el('g', { style: 'cursor:pointer' }, parent);
  const body = makeBody(g, { legs: null, shorts: '#2c2c30', top: null, hem: 24, hair: 'cap', capCol: '#c8553d' }, stripes);
  const bud = pen(g, PEN * 0.45);
  const run = gait({ kind: 'run', thigh: 23, shin: 23, stride: 30, lift: 12, period: 0.72, heelKick: 5, ankleY: 118.4, toe: 4.2 });
  const s = depthScale(o.y);
  let x = o.x, ph = Math.random();
  const dir = o.dir, watch = reaction(3.2, 0.8, 0.6);
  const self: Walker = {
    g, kind: 'jogger', y: o.y, done: false,
    poke() { watch.start(); },
    remove() { g.remove(); },
    draw(t, dt, P, wind) {
      const wv = watch.step(dt), go = 1 - wv;
      ph += (dt / run.period) * go;
      x += dir * run.speed * s * dt * go;
      if (x > W + 60 || x < -60) self.done = true;
      place(g, x, o.y, dir, s);
      const p = run.pose(ph, go);
      const sw = legSwing(p, run.stride);
      // 달리는 팔: 팔꿈치를 굽혀 다리 반대로 크게
      const runArm = (sh: Vec, a: number): [Vec, Vec] => { const e: Vec = [sh[0] + 14 * Math.sin(a), sh[1] + 14 * Math.cos(a)]; return [e, [e[0] + 13 * Math.sin(a + 1.7), e[1] + 13 * Math.cos(a + 1.7)]]; };
      const out = body.draw({ hip: p.hip, feet: legsOf(p), front: p.front, swing: 0, go, lean: 4 * go, headTilt: 1.2 * wv, dt, P, wind,
        armF: (_d, sh) => lerpArm(runArm(sh, -sw * 0.75 * go), [[sh[0] + 3, sh[1] + 14], [sh[0] + 13, sh[1] + 10]], wv),
        armN: (_d, sh) => lerpArm(runArm(sh, sw * 0.75 * go), [[sh[0] + 4, sh[1] + 14], [sh[0] + 11, sh[1] + 8]], wv) });
      bud.setAttribute('d', `M${f(out.hc[0] + 0.6)} ${f(out.hc[1] + 1)} Q${f(out.hc[0] - 0.4)} ${f(out.hc[1] + 8)} ${f(out.sh[0] + 2.6)} ${f(out.sh[1] + 6)}`);
    },
  };
  return self;
}

// ------------------------------------------------------------------ 강아지 산책
export function createDogWalker(parent: Element, o: { x: number; y: number; dir: 1 | -1 }, stripes: string): Walker {
  const g = el('g', { style: 'cursor:pointer' }, parent);
  const man = el('g', {}, g), dogG = el('g', {}, g);
  const body = makeBody(man, { legs: '#4a4a4a', top: null, hem: 36, hair: 'hat' }, stripes);
  const leash = pen(g, 0.5);
  // 강아지(인물 공간과 같은 크기 단위, 발 y=120, +x를 봄)
  const dLegs = Array.from({ length: 4 }, () => pen(dogG, 1.4));
  const dFeet = Array.from({ length: 4 }, () => blot(dogG));
  const dBody = shape(dogG, PEN);
  const dPatch = blot(dogG);
  const dHead = shape(dogG, PEN), dEar = blot(dogG), dEye = blot(dogG), dTail = pen(dogG, 1.3), dBark = pen(dogG, 0.9);
  const walk = gait({ kind: 'walk', stride: 20, period: 1.1 });
  const s = depthScale(o.y);
  const DT = 0.4, DS = (walk.speed * DT) / 2; // 강아지 보폭: 사람과 같은 속도로 발이 미끄러지지 않게
  let x = o.x, ph = Math.random(), dph = 0;
  const dir = o.dir, bark = reaction(2.6, 0.3, 0.4), wag = spring(120, 6);
  const self: Walker = {
    g, kind: 'dog', y: o.y, done: false,
    poke() { bark.start(); },
    remove() { g.remove(); },
    draw(t, dt, P, wind) {
      const bv = bark.step(dt), go = 1 - bv;
      ph += (dt / walk.period) * go; dph += (dt / DT) * go;
      x += dir * walk.speed * s * dt * go;
      if (x > W + 90 || x < -90) self.done = true;
      place(man, x, o.y, dir, s);
      const p = walk.pose(ph, go);
      const out = body.draw({ hip: p.hip, feet: legsOf(p), front: p.front, swing: legSwing(p, walk.stride), go, headTilt: 1.4 * bv, lean: 0.8, dt, P, wind,
        armN: (d, sh) => lerpArm(d, [[sh[0] + 6, sh[1] + 13], [sh[0] + 17, sh[1] + 20]], 0.7) });
      // 강아지: 사람 앞 34단위, 대각선 다리끼리 같이 딛는 종종걸음
      const dx = x + dir * 34 * s;
      place(dogG, dx, o.y + 2, dir, s);
      const hop = bv > 0 ? Math.max(0, Math.sin(Math.min(1, bark.t / 2.2) * Math.PI * 4)) * 7 * bv : 0;
      const by = 104 - hop;
      const legBase: Vec[] = [[50, by + 2], [47, by + 2.4], [32, by + 1.6], [29, by + 2]]; // 앞(가까운/먼), 뒤(가까운/먼)
      const phs = [0, 0.5, 0.5, 0];
      const foot = (u: number, bx: number): Vec => {
        u = ((u % 1) + 1) % 1;
        if (u < 0.5) return [bx + DS / 2 - (DS * u) / 0.5, 120];
        const sv = (u - 0.5) / 0.5;
        return [bx - DS / 2 + DS * minJerk(sv), 120 - 3.2 * Math.sin(Math.PI * sv)];
      };
      legBase.forEach((hp, i) => {
        const fo: Vec = hop > 0.2 ? [hp[0] + (i < 2 ? 3 : -2), 120 - hop + 2] : foot(dph + phs[i], hp[0]);
        const knee: Vec = [(hp[0] + fo[0]) / 2 + (i < 2 ? -1 : 1.6), (hp[1] + fo[1]) / 2];
        dLegs[i].setAttribute('d', `M${pt(hp)} Q${pt(knee)} ${pt(fo)}`);
        dFeet[i].setAttribute('d', `M${f(fo[0] - 1.2)} ${f(fo[1])} a1.5 1.1 0 1 0 3 0 a1.5 1.1 0 1 0 -3 0Z`);
        dLegs[i].setAttribute('opacity', i % 2 ? 0.75 : 1);
      });
      const bob = Math.abs(Math.sin(dph * Math.PI * 2)) * 0.6 * go;
      const y0 = by - bob;
      dBody.setAttribute('d', `M${f(26)} ${f(y0 - 4)} Q${f(38)} ${f(y0 - 7.4)} ${f(51)} ${f(y0 - 5)} Q${f(55)} ${f(y0 - 1)} ${f(52)} ${f(y0 + 3)} Q${f(40)} ${f(y0 + 5.6)} ${f(28)} ${f(y0 + 3)} Q${f(24)} ${f(y0)} ${f(26)} ${f(y0 - 4)}Z`);
      dPatch.setAttribute('d', `M${f(33)} ${f(y0 - 5.6)} Q${f(38)} ${f(y0 - 7)} ${f(42)} ${f(y0 - 5.4)} Q${f(40)} ${f(y0 - 2)} ${f(35)} ${f(y0 - 2.6)}Z`);
      const hy = y0 - 8 - bv * 1.6;
      dHead.setAttribute('d', `M${f(50)} ${f(hy + 4)} Q${f(49)} ${f(hy - 3)} ${f(55)} ${f(hy - 3.4)} Q${f(59)} ${f(hy - 3)} ${f(60.6)} ${f(hy + 0.6)} L${f(63)} ${f(hy + 1.4)} Q${f(63.6)} ${f(hy + 3.4)} ${f(61)} ${f(hy + 3.6 + bv * 1.4 * Math.max(0, Math.sin(t * 22)))} Q${f(56)} ${f(hy + 5)} ${f(52)} ${f(hy + 6)}Z`);
      dEar.setAttribute('d', `M${f(53)} ${f(hy - 2.6)} Q${f(50.4)} ${f(hy + 1)} ${f(51.6)} ${f(hy + 4)} Q${f(54)} ${f(hy + 1)} ${f(55.4)} ${f(hy - 2.4)}Z`);
      dEye.setAttribute('d', `M${f(58)} ${f(hy - 0.6)} a0.6 0.6 0 1 0 0.1 0Z`);
      const wg = wag.step(Math.sin(t * (bv > 0 ? 26 : 9)) * (3 + 5 * bv), dt);
      dTail.setAttribute('d', `M${f(26)} ${f(y0 - 3)} Q${f(21)} ${f(y0 - 8)} ${f(20 + wg * 0.4)} ${f(y0 - 12 - Math.abs(wg) * 0.3)}`);
      dBark.setAttribute('d', bv > 0.3 && Math.sin(t * 9) > 0 ? `M${f(66)} ${f(hy - 1)} l3 -2 M${f(66.6)} ${f(hy + 1.6)} l3.6 0 M${f(66)} ${f(hy + 4)} l3 2` : '');
      // 목줄: 손에서 강아지 목까지 살짝 처짐
      const hand = toScene(x, o.y, dir, out.handN[0], out.handN[1], s);
      const collar = toScene(dx, o.y + 2, dir, 52, hy + 4, s);
      const mid: Vec = [(hand[0] + collar[0]) / 2, Math.max(hand[1], collar[1]) + 4 + bv * 3];
      leash.setAttribute('d', `M${pt(hand)} Q${pt(mid)} ${pt(collar)}`);
    },
  };
  return self;
}
