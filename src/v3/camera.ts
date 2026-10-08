import {DIRECTIONS} from './direction';
import {hermite,clamp,lerp,progress,smoother} from './motion';
import type {CueLine,MusicEvent} from './types';
export type Camera={x:number;y:number;zoom:number;rotation:number};
export function cameraAt(frame:number,lines:CueLine[],events:MusicEvent[]):Camera{
  const keys=[{frame:0,x:-230,y:0,rotation:0,zoom:.95},
    ...lines.map((line,i)=>({frame:line.startFrame-10,x:DIRECTIONS[i].world[0],y:DIRECTIONS[i].world[1],rotation:DIRECTIONS[i].rotation,zoom:1})),
    {frame:3117,x:10380,y:1050,rotation:-2,zoom:.90},
    {frame:3330,x:10850,y:1020,rotation:2,zoom:.80},
    {frame:3525,x:11320,y:1120,rotation:0,zoom:.76},
    {frame:3729,x:11500,y:1080,rotation:0,zoom:.85}];
  let i=keys.findIndex((k,j)=>frame>=k.frame&&frame<(keys[j+1]?.frame??Infinity));if(i<0)i=0;
  const a=keys[i],b=keys[Math.min(i+1,keys.length-1)];
  const p=(frame-a.frame)/Math.max(1,b.frame-a.frame);
  const slope=(idx:number,field:'x'|'y'|'rotation'|'zoom')=>{
    const left=keys[Math.max(0,idx-1)],right=keys[Math.min(keys.length-1,idx+1)];
    return (right[field]-left[field])/Math.max(1,right.frame-left.frame);
  };
  const result={} as Camera;
  for(const field of ['x','y','rotation','zoom'] as const)result[field]=hermite(p,a[field],b[field],slope(i,field),slope(Math.min(i+1,keys.length-1),field),b.frame-a.frame);
  // Two intentional portals: the already-read 放弃 stem and the gap in Love.
  // The ongoing world is magnified before the drum-bound match cut resets the
  // lens. Unlike a page transition, old glyphs remain in the same world.
  for(const id of [7,12]){
    const line=lines[id],cut=events.find(e=>e.id===`cut-${id+1}`);
    const start=line.tokens.at(-1)!.readableFrame+18;
    if(cut&&frame>=start&&frame<cut.frame){
      const u=smoother(progress(frame,start,cut.frame));
      const pivotX=id===12?260:90,pivotY=id===12?150:100;
      result.x+=((DIRECTIONS[id].world[0]-result.x)*.22+pivotX)*u;
      result.y+=((DIRECTIONS[id].world[1]-result.y)*.22+pivotY)*u;
      result.zoom*=1+u*(id===12?2.2:1.15);
    }
  }
  for(const event of events.filter(e=>e.type==='match-cut')){
    const age=frame-event.frame;
    if(age>=0&&age<24){const pulse=1-smoother(age/24);result.x+=72*pulse;result.rotation+=(event.id==='cut-8'?1.5:-1.5)*pulse;result.zoom+=.025*pulse;}
  }
  return result;
}
export function originAt(line:CueLine,frame:number,lines:CueLine[],events:MusicEvent[]){
  const d=DIRECTIONS[line.id];
  const release=Math.max(line.tokens.at(-1)!.readableFrame+15,line.endFrame-12);
  // Reading follows the continuous camera partially, then detaches into world history.
  const at=Math.min(frame,release);
  const camera=cameraAt(at,lines,events);
  const follow=.78;
  return {x:lerp(d.world[0],camera.x,follow),y:lerp(d.world[1],camera.y,follow)};
}
export function cameraTransform(camera:Camera){return `translate(960 540) rotate(${-camera.rotation}) scale(${camera.zoom}) translate(${-camera.x} ${-camera.y})`;}
