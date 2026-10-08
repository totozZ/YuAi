import React from 'react';
import {DIRECTIONS,PALETTE} from './direction';
import {FONTS,placements} from './layout';
import {keyIndices,tokenPose} from './poses';
import {cameraAt,originAt} from './camera';
import {progress,smoother,smooth,lerp,clamp} from './motion';
import type {CueLine,MusicEvent} from './types';

function shape(kind:string,i:number,n:number):[number,number]{
  const t=i/n;
  if(kind==='ring')return [Math.cos(t*Math.PI*2)*260,Math.sin(t*Math.PI*2)*185];
  if(kind==='rain')return [Math.floor(i/10)*165-240,(i%10)*46-190];
  if(kind==='grid')return [(i%8)*110-390,Math.floor(i/8)*85-170];
  if(kind==='rail')return [t*970-485,105+Math.sin(t*Math.PI*2)*35];
  if(kind==='spectrum')return [(t-.5)*1200,-Math.sin(t*Math.PI)*350+180];
  const p=t*4;
  if(p<1)return [-440+p*880,-230];if(p<2)return [440,-230+(p-1)*460];
  if(p<3)return [440-(p-2)*880,230];return [-440,230-(p-3)*460];
}

export const WorldGeometry:React.FC<{frame:number;lines:CueLine[];events:MusicEvent[]}>=({frame,lines,events})=>{
  const camera=cameraAt(frame,lines,events);
  const current=lines.findIndex(l=>frame>=l.startFrame&&frame<l.endFrame);
  const region=current<0?frame<489?0:18:current;
  const head=originAt(lines[region],frame,lines,events);
  const warm=smoother(progress(frame,2795,3210));
  const color=warm>.5?PALETTE.gold:PALETTE.blue;
  const history=lines.filter(l=>l.startFrame<=frame).map(l=>DIRECTIONS[l.id].world);
  const route=history.length?`M ${history.map(([x,y],i)=>`${i?'L ':''}${x-480} ${y+270}`).join(' ')} L ${head.x+580} ${head.y+270}`:'';
  const beat=events.filter(e=>e.type==='beat'&&frame>=e.frame&&frame<e.frame+12).reduce((v,e)=>Math.max(v,e.strength*(1-progress(frame,e.frame,e.frame+12))),0);
  return <g>
    <path data-node-id="continuity-spine" d={route} fill="none" stroke={color} strokeWidth={.7+beat*.75} opacity=".22"/>
    {lines.map(line=>{
      const keys=line.id===12?[9]:keyIndices(line);
      const lastKey=Math.max(...keys.map(i=>line.tokens[i].readableFrame));
      if(frame<lastKey+15)return null;
      const release=Math.max(line.tokens.at(-1)!.readableFrame+15,line.endFrame-12);
      const next=lines[Math.min(18,line.id+1)];
      const target=originAt(next,frame,lines,events);
      const start=release-6;
      const morph=smoother(progress(frame,start,release+35));
      const source: [number,number][]=[];
      const placed=placements(line);
      for(const index of keys){
        const p=placed[index],pose=tokenPose(line,p,release,lines,events);
        let advance=0;
        for(const char of line.tokens[index].text){
          const glyph=FONTS[p.weight][char];
          for(const point of glyph.points){
            const xx=(point[0]+advance)*pose.scale,yy=point[1]*pose.scale,angle=pose.rotation*Math.PI/180;
            source.push([pose.x+xx*Math.cos(angle)-yy*Math.sin(angle),pose.y+xx*Math.sin(angle)+yy*Math.cos(angle)]);
          }
          advance+=glyph.advance+3;
        }
      }
      const count=40;
      const points=Array.from({length:count},(_,i)=>{
        const a=source[Math.floor(i/count*source.length)]??[target.x,target.y];
        const b=line.id===7?[90,(i/count-.5)*700] as [number,number]:shape(DIRECTIONS[line.id].bridge,i,count);
        return [lerp(a[0],target.x+b[0],morph),lerp(a[1],target.y+b[1],morph)] as [number,number];
      });
      const distance=Math.hypot(target.x-camera.x,target.y-camera.y);
      if(distance>2600)return null;
      // A glyph's contour breaks into points only during the handoff. Connecting
      // raw outline control points while the lyric is being read looks like noise.
      const alpha=(.14+.12*(1-morph))*smooth(progress(morph,0,.16));
      const linked=DIRECTIONS[line.id].bridge==='rain'||DIRECTIONS[line.id].bridge==='grid';
      return <g key={line.id} data-node-id={`bridge-${line.id}`} opacity={alpha}>
        {!linked&&<path d={`M ${points.map(p=>p.join(' ')).join(' L ')}${['ring','window'].includes(DIRECTIONS[line.id].bridge)?' Z':''}`} fill="none" stroke={color} strokeWidth="1.15"/ >}
        {linked&&points.map((p,i)=>i%10!==9&&points[i+1]?<path key={i} d={`M ${p.join(' ')} L ${points[i+1].join(' ')}`} fill="none" stroke={color} strokeWidth={DIRECTIONS[line.id].bridge==='grid'?'.8':'1.4'}/>:null)}
        {points.filter((_,i)=>i%4===0).map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r={1.4+beat*.5} fill={color}/>)}
      </g>;
    })}
    {frame<lines[0].endFrame+20&&<g data-node-id="intro-window" opacity={smooth(progress(frame,330,460))*.28} stroke={PALETTE.blue} fill="none">
      <path d="M -640 -255 H 515 V 220 H -640 Z M -70 -255 V 220 M -640 -15 H 515" strokeWidth="1.1"/>
    </g>}
    {frame>=lines[18].tokens[4].readableFrame+15&&<g data-node-id="spectrum-from-rainbow" fill="none">
      {PALETTE.spectrum.map((c,i)=>{
        const solo=progress(frame,3117,3728),calm=1-progress(frame,3495,3675);
        const shift=smoother(progress(frame,3100,3250));
        const cx=lerp(originAt(lines[18],3117,lines,events).x,camera.x,shift);
        const cy=lerp(originAt(lines[18],3117,lines,events).y,camera.y,shift);
        const length=lerp(700,150,smoother(progress(frame,3495,3700)));
        const y=i*15-70;
        const soloPulse=events.filter(e=>e.type==='instrumental'&&frame>=e.frame&&frame<e.frame+24)
          .reduce((v,e)=>v+Math.sin(progress(frame,e.frame,e.frame+24)*Math.PI)*e.strength,0);
        const bend=(Math.sin(frame*.015+i*.11)*45+soloPulse*34)*calm;
        return <path key={c} d={`M ${cx-length} ${cy+y+170} C ${cx-length*.44} ${cy+y-340+bend} ${cx+length*.44} ${cy+y-340-bend} ${cx+length} ${cy+y+170}`} stroke={c} strokeWidth={1.5+i*.32+soloPulse*.6} opacity={smooth(progress(frame,2990,3170))*(.48-solo*.18)}/>;
      })}
    </g>}
  </g>;
};
