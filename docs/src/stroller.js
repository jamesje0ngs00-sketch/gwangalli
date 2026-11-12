// 젖은 모래를 따라 걷는 사람: 단발, 가벼운 셔츠, 와이드 청바지, 어깨에 멘 빨간 에코백.
// 누르면 멈춰서 휴대폰으로 다리를 찍는다(밤에는 화면 불빛과 플래시).
import { el, pen, shape, blot, paint, limb, solid, shoe, place, toScene, f, pt, PEN, PAPER,          } from '../lib/ink.js';
import { gait } from '../lib/gait.js';
import { spring, pendulum } from '../lib/motion.js';
import { nightTint,              } from '../lib/daynight.js';
import { W, FS, ease, smooth } from './kit.js';

const DENIM = '#5a6d8f', BAG = '#c8553d';

export function createStroller(parent         , glow         , o                                       ) {
  const g = el('g', { style: 'cursor:pointer' }, parent);
  const farArm = limb(g, 3.4);
  const legs = [solid(limb(g, 4.8), DENIM), solid(limb(g, 4.8), DENIM)];
  const shoes = [blot(g), blot(g)];
  const strapBack = pen(g, PEN * 0.6);
  const shirt = shape(g);
  const shirtSeam = pen(g, PEN * 0.55);
  const neck = pen(g, PEN);
  const head = el('ellipse', { rx: 3.5, ry: 4.5, fill: PAPER, stroke: 'currentColor', 'stroke-width': PEN }, g);
  const hair = blot(g);
  const strap = pen(g, PEN * 0.6);
  const bagG = el('g', {}, g);
  const bag = paint(bagG, BAG, PEN * 0.8);
  const nearArm = limb(g, 3.4);
  const phone = blot(g);
  const screen = el('rect', { width: 3.2, height: 1.6, rx: 0.4, fill: '#cfe6ff', opacity: 0 }, glow);
  const flashN = el('circle', { r: 9, fill: 'url(#b-warm)', opacity: 0 }, glow);

  const walk = gait({ kind: 'walk', stride: 22, period: 1.05 });
  const arms = [spring(60, 9), spring(60, 9)];
  const bagSwing = pendulum(12, 1.6);
  const hairBob = spring(90, 8);
  let phase = Math.random(), x = o.x, snapT = -1, flash = 0;
  const dir = o.dir;

  const self = {
    g, kind: 'stroller', done: false,
    get y() { return o.y; },
    get x() { return x; },
    poke() { if (snapT < 0) snapT = 0; },
    remove() { g.remove(); screen.remove(); flashN.remove(); },
    draw(t        , dt        , P         , wind        ) {
      // 사진 찍기: 멈춤 → 들어 올림 → 찰칵 → 내림 → 다시 걷기
      let snap = 0;
      if (snapT >= 0) {
        snapT += dt;
        snap = snapT < 0.6 ? ease(snapT / 0.6) : snapT < 2.6 ? 1 : 1 - ease((snapT - 2.6) / 0.6);
        if (snapT > 1.7 && snapT - dt <= 1.7) flash = 1;
        if (snapT > 3.3) snapT = -1;
      }
      flash = Math.max(0, flash - dt * 3);
      const go = 1 - snap;
      phase += (dt / walk.period) * go;
      x += dir * walk.speed * FS * dt * go;
      if (x > W + 60 || x < -60) self.done = true;
      place(g, x, o.y, dir, FS);

      const p = walk.pose(phase, go);
      const b = p.bob;
      p.feet.forEach((fo, i) => { legs[i].draw([p.hip, fo.knee, fo.ankle], [0.2, 0.5]); shoe(shoes[i], fo.ankle, fo.pitch); });
      g.insertBefore(legs[p.front].g, strapBack); g.insertBefore(shoes[p.front], strapBack);
      legs.forEach((l) => l.g.querySelector('path') .setAttribute('fill', nightTint(DENIM, P)));

      // 셔츠: 엉덩이를 살짝 덮는 길이, 앞자락은 앞 무릎을 따라 조금 벌어짐
      const sh      = [41, 42 + b];
      const kF = p.feet[p.front].knee;
      const hem = 68 + b * 0.6, front = Math.max(46.2, Math.min(48.5, kF[0] - 2));
      shirt.setAttribute('d', `M${f(sh[0] - 5.4)} ${f(sh[1] + 1)} Q${f(sh[0])} ${f(sh[1] - 2)} ${f(sh[0] + 4.6)} ${f(sh[1] + 1)} Q${f(sh[0] + 6.4)} ${f(sh[1] + 12)} ${f(front)} ${f(hem - 1)} Q${f(40)} ${f(hem + 1.6)} ${f(32.6)} ${f(hem)} Q${f(33.6)} ${f(sh[1] + 12)} ${f(sh[0] - 5.4)} ${f(sh[1] + 1)}Z`);
      shirtSeam.setAttribute('d', `M${f(sh[0] + 1.6)} ${f(sh[1] + 0.6)} L${f(sh[0] + 2.4)} ${f(sh[1] + 6)} M${f(34.4)} ${f(hem - 3)} Q${f(40)} ${f(hem - 1.6)} ${f(front - 0.8)} ${f(hem - 3.6)}`);

      // 머리와 단발: 걸음마다 살짝 출렁
      const hc      = [42.4, 32.4 + b];
      neck.setAttribute('d', `M${f(hc[0] - 1)} ${f(hc[1] + 4)} L${f(hc[0] - 1.2)} ${f(sh[1] - 0.6)} M${f(hc[0] + 1.4)} ${f(hc[1] + 4.2)} L${f(hc[0] + 1.6)} ${f(sh[1] - 0.4)}`);
      head.setAttribute('cx', f(hc[0])); head.setAttribute('cy', f(hc[1]));
      const hb = hairBob.step(b * 0.6 - wind * 0.4, dt);
      hair.setAttribute('d', `M${f(hc[0] + 3.6)} ${f(hc[1] - 1.6)} Q${f(hc[0] + 3.2)} ${f(hc[1] - 5.6)} ${f(hc[0] - 0.4)} ${f(hc[1] - 5.4)} Q${f(hc[0] - 5.2)} ${f(hc[1] - 5)} ${f(hc[0] - 5)} ${f(hc[1])} Q${f(hc[0] - 5.4 - hb * 0.4)} ${f(hc[1] + 4.4 + hb)} ${f(hc[0] - 3.2 - hb * 0.3)} ${f(hc[1] + 5.4 + hb)} Q${f(hc[0] - 2.2)} ${f(hc[1] + 2)} ${f(hc[0] - 1.4)} ${f(hc[1] - 1.8)} Q${f(hc[0] + 1)} ${f(hc[1] - 3)} ${f(hc[0] + 3.6)} ${f(hc[1] - 1.6)}Z`);

      // 팔: 다리 반대로 흔들림. 사진 찍을 땐 두 손이 얼굴 앞으로
      const legSwing = (p.feet[0].ankle[0] - 40) / (walk.stride / 2);
      const farA = (arms[0].step(-legSwing * 15 * go, dt) * Math.PI) / 180;
      const nearA = (arms[1].step(legSwing * 13 * go, dt) * Math.PI) / 180;
      const shF      = [sh[0] - 1, sh[1] + 2], shN      = [sh[0] + 1.4, sh[1] + 2.4];
      const ph      = [hc[0] + 9.5, hc[1] + 0.5];
      const swingArm = (s     , a        )             => { const e      = [s[0] + 16 * Math.sin(a), s[1] + 16 * Math.cos(a)]; return [e, [e[0] + 15 * Math.sin(a + 0.2), e[1] + 15 * Math.cos(a + 0.2)]]; };
      const mixV = (a     , c     , k        )      => [a[0] + (c[0] - a[0]) * k, a[1] + (c[1] - a[1]) * k];
      const [eF, hF] = swingArm(shF, farA), [eN, hN] = swingArm(shN, nearA);
      const raisedElbF      = [shF[0] + 6, shF[1] + 9], raisedElbN      = [shN[0] + 7, shN[1] + 8];
      farArm.draw([shF, mixV(eF, raisedElbF, snap), mixV(hF, [ph[0] - 0.6, ph[1] + 1.4], snap)], [0.2, 0.5]);
      nearArm.draw([shN, mixV(eN, raisedElbN, snap), mixV(hN, [ph[0], ph[1] + 1.8], snap)], [0.2, 0.4]);
      phone.setAttribute('d', snap > 0.05 ? `M${f(ph[0] - 0.8)} ${f(ph[1] - 3.2)} L${f(ph[0] + 0.6)} ${f(ph[1] - 3.2)} L${f(ph[0] + 0.6)} ${f(ph[1] + 3)} L${f(ph[0] - 0.8)} ${f(ph[1] + 3)}Z` : '');
      const [sx, sy] = toScene(x, o.y, dir, ph[0] - 1.6, ph[1] - 0.8, FS);
      screen.setAttribute('x', f(sx - 1.6)); screen.setAttribute('y', f(sy - 0.8));
      screen.setAttribute('opacity', f(snap * smooth(0.2, 0.5, P.lamp)));
      const [fx, fy] = toScene(x, o.y, dir, ph[0] + 1, ph[1] - 2, FS);
      flashN.setAttribute('cx', f(fx)); flashN.setAttribute('cy', f(fy)); flashN.setAttribute('opacity', f(flash * (0.4 + 0.6 * P.lamp)));

      // 에코백: 가까운 어깨에서 끈으로 늘어져 엉덩이 옆에서 흔들림
      const accel = Math.cos(2 * Math.PI * phase * 2) * 1.4 * go;
      const ba = bagSwing.step(-accel - wind * 0.25, dt);
      const top      = [sh[0] + 2.4, sh[1] + 0.4];
      const hang      = [top[0] - 3 + Math.sin(ba) * 22, top[1] + 22 * Math.cos(ba)];
      strapBack.setAttribute('d', `M${f(top[0] - 4.6)} ${f(top[1] + 1)} Q${f(hang[0] - 6)} ${f(hang[1] - 10)} ${f(hang[0] - 4)} ${f(hang[1])}`);
      strap.setAttribute('d', `M${pt(top)} Q${f(hang[0] + 3)} ${f(hang[1] - 10)} ${f(hang[0] + 4)} ${f(hang[1])}`);
      bagG.setAttribute('transform', `rotate(${f(ba * 57.3 * 0.6)} ${pt(hang)})`);
      bag.setAttribute('d', `M${f(hang[0] - 5)} ${f(hang[1])} L${f(hang[0] + 5)} ${f(hang[1])} L${f(hang[0] + 5.6)} ${f(hang[1] + 10)} Q${f(hang[0])} ${f(hang[1] + 11)} ${f(hang[0] - 5.6)} ${f(hang[1] + 10)}Z`);
      bag.setAttribute('fill', nightTint(BAG, P));
    },
  };
  return self;
}
