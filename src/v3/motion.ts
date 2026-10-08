export const clamp=(x:number,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const progress=(f:number,a:number,b:number)=>clamp((f-a)/(b-a));
export const smooth=(x:number)=>{const t=clamp(x);return t*t*(3-2*t);};
export const smoother=(x:number)=>{const t=clamp(x);return t*t*t*(t*(t*6-15)+10);};
export const expo=(x:number)=>x>=1?1:(1-Math.pow(2,-10*clamp(x)))/(1-1/1024);
export const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
export const damp=(age:number)=>age<0?0:Math.sin(age*.62)*Math.exp(-age*.37);
export function hermite(t:number,a:number,b:number,va:number,vb:number,dt:number){
  const p=clamp(t),p2=p*p,p3=p2*p;
  return (2*p3-3*p2+1)*a+(p3-2*p2+p)*va*dt+(-2*p3+3*p2)*b+(p3-p2)*vb*dt;
}
