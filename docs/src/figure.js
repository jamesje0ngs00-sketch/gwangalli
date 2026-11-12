// 공용 인물 몸: 인물 공간(발 y=120, +x를 봄)에서 엉덩이·발 위치를 받아 옷과 머리를 그린다.
// 걷기·달리기는 gait 포즈를, 앉기·쪼그리기는 호출하는 쪽이 직접 엉덩이와 발을 넘긴다.
// 팔은 기본으로 다리 반대로 흔들리고, armN/armF로 기본 위치를 바꿔 몸짓을 만든다.
import { el, pen, shape, blot, paint, limb, solid, shoe, f, pt, PEN, PAPER,                     } from '../lib/ink.js';
import { spring } from '../lib/motion.js';
import { nightTint,              } from '../lib/daynight.js';

                                                                             
                       
                                                
                                 
                                           
                    
                                        
                                    
             
                  
                
 
                                                             
                           
                                       
                                                
              
                                          
                    
                                                  
                                                  
                                       
 
                                                                     

export function makeBody(parent         , look      , stripes        ) {
  const k = look.kid ? 0.62 : 1;            // 팔·몸통 비율
  const g = el('g', {}, parent);
  const farArm = limb(g, 3.4 * (look.kid ? 0.85 : 1));
  const legW = look.kid ? 4.2 : 4.6;
  const legs         = [0, 1].map(() => (look.legs ? solid(limb(g, legW), look.legs) : limb(g, legW)));
  const shorts         = look.shorts ? [0, 1].map(() => solid(limb(g, legW + 1.2), look.shorts )) : [];
  const shoes = [blot(g), blot(g)];
  const dress = look.dress ? paint(g, look.dress) : null;
  const top = look.top ? paint(g, look.top) : shape(g);
  if (look.stripes) { top.classList.remove('pp'); top.setAttribute('fill', stripes); } // .pp는 CSS가 종이색으로 덮어쓴다
  const seam = pen(g, PEN * 0.55);
  const neck = pen(g, PEN);
  const hr = look.kid ? [4.3, 5.2] : [3.5, 4.5];
  const head = el('ellipse', { rx: hr[0], ry: hr[1], fill: PAPER, stroke: 'currentColor', 'stroke-width': PEN }, g);
  const hair = blot(g);
  const cap = look.hair === 'cap' ? paint(g, look.capCol || '#3f5d8a') : null;
  const nearArm = limb(g, 3.4 * (look.kid ? 0.85 : 1));
  const arms = [spring(60, 9), spring(60, 9)];
  const sway = spring(70, 7);
  const UA = 16 * (look.kid ? 0.66 : 1), FA = 15 * (look.kid ? 0.66 : 1);
  const torso = look.kid ? 19 : 32.6;

  return {
    g,
    draw(a          )          {
      const { hip, feet, P, dt } = a;
      const go = a.go ?? 1, lean = a.lean ?? 0;
      feet.forEach((fo, i) => {
        legs[i].draw([hip, fo.knee, fo.ankle], [0.2, 0.5]);
        if (shorts[i]) { const kk      = [hip[0] + (fo.knee[0] - hip[0]) * 0.62, hip[1] + (fo.knee[1] - hip[1]) * 0.62]; shorts[i].draw([[hip[0], hip[1] - 2], kk], [0, 0]); }
        shoe(shoes[i], fo.ankle, fo.pitch);
      });
      const fr = a.front;
      g.insertBefore(legs[fr].g, dress || top); g.insertBefore(shoes[fr], dress || top);
      if (shorts[fr]) g.insertBefore(shorts[fr].g, dress || top);
      if (look.legs) legs.forEach((l) => l.g.querySelector('path') .setAttribute('fill', nightTint(look.legs , P)));
      shorts.forEach((l) => l.g.querySelector('path') .setAttribute('fill', nightTint(look.shorts , P)));

      const sh      = [hip[0] + 1 + lean, hip[1] - torso];
      const kF = feet[fr].knee;
      const w = k;
      // 원피스: 허리에서 무릎 아래까지, 앞자락은 앞 무릎을 따라 벌어짐
      if (dress) {
        const waist = sh[1] + torso * 0.62, hemY = Math.max(kF[1] + 6, hip[1] + 22 * w);
        const fx = Math.max(kF[0] + 3, hip[0] + 6);
        dress.setAttribute('d', `M${f(hip[0] - 5 * w)} ${f(waist)} L${f(hip[0] + 5 * w + lean * 0.4)} ${f(waist)} Q${f(fx)} ${f(hip[1] + 4)} ${f(fx + 1.4)} ${f(hemY)} Q${f(hip[0])} ${f(hemY + 1.6)} ${f(hip[0] - 8 * w)} ${f(hemY - 0.6)} Q${f(hip[0] - 7 * w)} ${f(hip[1])} ${f(hip[0] - 5 * w)} ${f(waist)}Z`);
        dress.setAttribute('fill', nightTint(look.dress , P));
      }
      // 윗옷
      const hem = sh[1] + (look.hem ?? 27) * w, front = Math.max(sh[0] + 5.2 * w, Math.min(sh[0] + 7.4 * w, kF[0] - 2));
      top.setAttribute('d', `M${f(sh[0] - 5.4 * w)} ${f(sh[1] + 1)} Q${f(sh[0])} ${f(sh[1] - 2)} ${f(sh[0] + 4.6 * w)} ${f(sh[1] + 1)} Q${f(sh[0] + 6.2 * w)} ${f(sh[1] + 10 * w)} ${f(front)} ${f(hem - 1)} Q${f(sh[0] - 1)} ${f(hem + 1.4)} ${f(sh[0] - 8.4 * w + lean * 0.3)} ${f(hem)} Q${f(sh[0] - 7.4 * w)} ${f(sh[1] + 10 * w)} ${f(sh[0] - 5.4 * w)} ${f(sh[1] + 1)}Z`);
      if (look.top && !look.stripes) top.setAttribute('fill', nightTint(look.top, P));
      seam.setAttribute('d', `M${f(sh[0] - 3)} ${f(sh[1] + 0.4)} Q${f(sh[0] + 0.4)} ${f(sh[1] + 2.4)} ${f(sh[0] + 3)} ${f(sh[1] + 0.6)}`);

      // 머리
      const tilt = a.headTilt ?? 0;
      const hc      = [sh[0] + 1.4 + lean * 0.4 + tilt, sh[1] - (look.kid ? 8.6 : 9.6)];
      neck.setAttribute('d', `M${f(hc[0] - 1 - tilt * 0.5)} ${f(hc[1] + hr[1] - 0.6)} L${f(sh[0] - 1.2)} ${f(sh[1] - 0.6)} M${f(hc[0] + 1.4 - tilt * 0.5)} ${f(hc[1] + hr[1] - 0.4)} L${f(sh[0] + 1.6)} ${f(sh[1] - 0.4)}`);
      head.setAttribute('cx', f(hc[0])); head.setAttribute('cy', f(hc[1]));
      const s = sway.step((a.swing ?? 0) * 0.4 - a.wind * 0.5, dt);
      hair.setAttribute('d', hairPath(look.hair, hc, hr, s));
      if (cap) {
        cap.setAttribute('d', `M${f(hc[0] - 3.8)} ${f(hc[1] - 1.4)} Q${f(hc[0] - 3.6)} ${f(hc[1] - 5.8)} ${f(hc[0] + 0.2)} ${f(hc[1] - 5.6)} Q${f(hc[0] + 3.6)} ${f(hc[1] - 5.4)} ${f(hc[0] + 3.6)} ${f(hc[1] - 1.8)} L${f(hc[0] + 8)} ${f(hc[1] - 1.2)} Q${f(hc[0] + 6.4)} ${f(hc[1] - 0.2)} ${f(hc[0] + 3.4)} ${f(hc[1] - 0.6)}Z`);
        cap.setAttribute('fill', nightTint(look.capCol || '#3f5d8a', P));
      }

      // 팔
      const sw = a.swing ?? 0;
      const fa = (arms[0].step(-sw * 16 * go, dt) * Math.PI) / 180, na = (arms[1].step(sw * 14 * go, dt) * Math.PI) / 180;
      const shF      = [sh[0] - 1, sh[1] + 2], shN      = [sh[0] + 1.4, sh[1] + 2.4];
      const swingArm = (s0     , an        )             => { const e      = [s0[0] + UA * Math.sin(an), s0[1] + UA * Math.cos(an)]; return [e, [e[0] + FA * Math.sin(an + 0.2), e[1] + FA * Math.cos(an + 0.2)]]; };
      let F = swingArm(shF, fa), N = swingArm(shN, na);
      if (a.armF) F = a.armF(F, shF);
      if (a.armN) N = a.armN(N, shN);
      farArm.draw([shF, F[0], F[1]], [0.2, 0.5]);
      nearArm.draw([shN, N[0], N[1]], [0.2, 0.4]);
      return { sh, hc, handN: N[1], handF: F[1] };
    },
  };
}

function hairPath(kind      , hc     , hr          , s        )         {
  const [x, y] = hc, r = hr[0] / 3.5;
  const P = (dx        , dy        ) => `${f(x + dx * r)} ${f(y + dy * r)}`;
  const crown = `M${P(3.5, -1.8)} Q${P(3, -5.6)} ${P(-0.4, -5.5)} Q${P(-4.8, -5.1)} ${P(-4.4, 0.4)}`;
  switch (kind) {
    case 'bob': return `${crown} Q${P(-5.2 - s * 0.4, 4.6 + s)} ${P(-3.2 - s * 0.3, 5.4 + s)} Q${P(-2.2, 2)} ${P(-1.4, -1.8)} Q${P(1, -3)} ${P(3.5, -1.8)}Z`;
    case 'long': return `${crown} Q${P(-5.4 - s * 0.6, 8 + s)} ${P(-4.2 - s, 12.5 + s)} L${P(-1.8 - s * 0.6, 11)} Q${P(-2.2, 3)} ${P(-1.4, -1.8)} Q${P(1, -3)} ${P(3.5, -1.8)}Z`;
    case 'pony': return `${crown} Q${P(-3, 1.2)} ${P(-1.6, -1.8)} Q${P(1, -3.2)} ${P(3.5, -1.8)}Z M${P(-3.8, -2.6)} Q${P(-7.6 - s, -1)} ${P(-7 - s * 1.6, 5 + s * 0.5)} Q${P(-6 - s, 1)} ${P(-3.4, -1.2)}Z`;
    case 'bun': return `${crown} Q${P(-3, 1.2)} ${P(-1.6, -1.8)} Q${P(1, -3.2)} ${P(3.5, -1.8)}Z M${P(-2.6, -5.4)} a${f(2.4 * r)} ${f(2.2 * r)} 0 1 0 ${f(0.1)} 0Z`;
    case 'hat': return `M${P(-6.6, -3.4)} L${P(6.8, -3.4)} Q${P(4.6, -4.8)} ${P(4.2, -7.6)} Q${P(0, -10.6)} ${P(-4, -7.6)} Q${P(-4.4, -4.8)} ${P(-6.6, -3.4)}Z M${P(-3.9, -3)} Q${P(-4.4, 0)} ${P(-3.6, 1.4)} L${P(-2.8, -2.6)}Z`;
    case 'cap': return `M${P(-3.6, -1.6)} Q${P(-4.6, 1.6)} ${P(-3.4, 2.6)} L${P(-2.4, -1.2)}Z`;
    default: return `${crown} Q${P(-4, 1.6)} ${P(-2.8, 1.2)} Q${P(-2.2, -1.6)} ${P(-1, -2.2)} Q${P(1.2, -3.2)} ${P(3.5, -1.8)}Z`;
  }
}

export const lerpV = (a     , b     , t        )      => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const lerpArm = (a            , b            , t        )             => [lerpV(a[0], b[0], t), lerpV(a[1], b[1], t)];
export { pt };
