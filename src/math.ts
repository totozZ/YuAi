export const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));
export const ease = (v: number) => {const t = clamp(v); return t * t * (3 - 2 * t);};
export const range = (v: number, a: number, b: number) => clamp((v - a) / (b - a));
export const rand = (seed: number) => {
  const v = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
export const mix = (a: string, b: string, t: number) => {
  const aa = a.replace('#', ''); const bb = b.replace('#', '');
  return '#' + [0, 2, 4].map((i) => Math.round(parseInt(aa.slice(i, i+2),16) * (1-t) + parseInt(bb.slice(i,i+2),16) * t).toString(16).padStart(2,'0')).join('');
};
export const FONT = 'SceneFont, "Microsoft YaHei", sans-serif';
