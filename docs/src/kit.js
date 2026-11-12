// 장면 공통 상수와 작은 도우미.
// 장면은 숫자 속성을 많이 쓰므로 setAttribute가 숫자도 받게 한다(DOM이 문자열로 바꿈).
                                                                                                          

export const W = 960, H = 480;
export const HORIZON = 232;   // 수평선
export const WATERLINE = 244; // 다리 기초가 물에 닿는 높이
export const SHORE = 328;     // 바다와 모래가 만나는 기준선
export const SP = 0.8;        // 장면 펜 굵기
export const FS = 0.6;        // 모래사장 인물 크기(인물 공간 95단위 → 약 57px)

export const clamp = (x        , a        , b        ) => Math.max(a, Math.min(b, x));
export const lerp = (a        , b        , t        ) => a + (b - a) * t;
export const smooth = (e0        , e1        , x        ) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
export const ease = (t        ) => smooth(0, 1, t);
export const easeOut = (t        ) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
export const rnd = (a        , b        ) => a + Math.random() * (b - a);

// 정적인 그림은 시드 난수로: 불러올 때마다 같은 해변
let seed = 23;
export const srnd = (a = 0, b = 1) => { seed = (seed * 16807) % 2147483647; return a + ((seed - 1) / 2147483646) * (b - a); };

export const hsl = (h        , s        , l        ) => `hsl(${(((h % 360) + 360) % 360).toFixed(1)} ${s.toFixed(0)}% ${l.toFixed(0)}%)`;
