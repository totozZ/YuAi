import React from 'react';
import {DIRECTIONS} from './direction';
import {cameraAt} from './camera';
import {lerp,progress,smoother} from './motion';
import type {CueLine,MusicEvent} from './types';
import type {SceneStyle} from './scene-style';

// These planes and curves share the lyric world's camera; only a fraction of
// camera travel is followed, so the surface has depth without a reset per line.
export const SceneBackdrop:React.FC<{frame:number;lines:CueLine[];events:MusicEvent[];style:SceneStyle}>=({frame,lines,events,style})=>{
  if(!style.isLight)return null;
  const camera=cameraAt(frame,lines,events);
  const drift=style.memory*(1-style.hope),arch=style.hope;
  const anchorX=lerp(DIRECTIONS[8].world[0],DIRECTIONS[13].world[0],style.memory);
  const anchorY=lerp(DIRECTIONS[8].world[1],DIRECTIONS[13].world[1],style.memory);
  const cx=camera.x*.86+anchorX*.14,cy=camera.y*.86+anchorY*.14;
  const beat=events.filter(e=>['beat','instrumental'].includes(e.type)&&frame>=e.frame&&frame<e.frame+20)
    .reduce((v,e)=>Math.max(v,e.strength*Math.sin(progress(frame,e.frame,e.frame+20)*Math.PI)),0);
  const open=lerp(.24,1,style.unfold),breath=beat*8;
  const wave=(i:number)=>Math.sin(frame*.009+i*.6)*14*(1-style.solo*.7);
  return <g data-node-id="continuous-color-space" transform={`translate(${cx} ${cy})`}>
    <defs>
      <linearGradient id="v31-surface" x1="0" y1="0" x2="1" y2="1"><stop stopColor={style.highlight} stopOpacity=".48"/><stop offset="1" stopColor={style.surface} stopOpacity=".65"/></linearGradient>
      <linearGradient id="v31-luminous-arc" x1="0" y1="0" x2="1" y2="0"><stop stopColor={style.surface} stopOpacity="0"/><stop offset=".52" stopColor={style.highlight} stopOpacity=".55"/><stop offset="1" stopColor={style.surface} stopOpacity=".12"/></linearGradient>
      <radialGradient id="v31-reading-protection"><stop offset="0" stopColor="black"/><stop offset=".65" stopColor="black"/><stop offset="1" stopColor="white"/></radialGradient>
      <mask id="v31-space-mask" maskUnits="userSpaceOnUse" x="-1800" y="-1400" width="3600" height="2800">
        <rect x="-1800" y="-1400" width="3600" height="2800" fill="white"/>
        <ellipse cx="-100" cy="0" rx="780" ry="350" fill="url(#v31-reading-protection)"/>
      </mask>
    </defs>
    <g mask="url(#v31-space-mask)">
      <path data-node-id="window-becomes-plane" d={`M ${-1040*open} ${190+wave(0)} L ${1000*open} ${180+wave(1)} L 660 ${480+breath} L -720 ${450+breath} Z`}
        fill="url(#v31-surface)" stroke={style.geometry} strokeWidth="1.1" opacity={.32*(1-arch*.6)}/>
      <path d={`M -1120 -450 L ${-510+drift*125} ${-380+arch*100} L ${-430+drift*100} ${420-arch*150} L -1030 550 Z`}
        fill={style.surface} opacity={.13*(1-arch*.8)}/>
      {Array.from({length:7},(_,i)=>{
        const x=-820+i*270;
        const bottom=lerp(x*.55,x+95*drift,style.memory);
        const curve=arch*(130+Math.sin(i*.6)*130);
        return <path key={i} data-node-id={`rain-column-to-memory-${i}`}
          d={`M ${x} -510 C ${x+drift*55} ${-165-curve} ${bottom-arch*230} ${150-curve} ${bottom} ${520-arch*95}`}
          fill="none" stroke={style.geometry} strokeWidth={.85+beat*.4} opacity={(.20+style.intensity*.1)*(1-style.solo*.65)}/>;
      })}
      {Array.from({length:5},(_,i)=>{
        const y=-380+i*185;
        const bend=lerp(0,160,arch),spread=lerp(880,1100,style.unfold);
        return <path key={i} data-node-id={`window-baseline-to-light-${i}`}
          d={`M ${-spread} ${y+wave(i)} C -400 ${y-bend+wave(i)} 470 ${y-bend-wave(i)} ${spread} ${y+25}`}
          fill="none" stroke={style.geometry} strokeWidth="1" opacity={.10+drift*.12+beat*.04}/>;
      })}
      {Array.from({length:8},(_,i)=>{
        const x=540+(i%3)*90,y=-270+Math.floor(i/3)*195;
        const tilt=drift*35+Math.sin(i)*8,alpha=style.memory*(1-arch)*.13;
        return <path key={i} data-node-id={`memory-cell-${i}`} d={`M ${x} ${y} L ${x+100} ${y-tilt} L ${x+100} ${y+95-tilt} L ${x} ${y+95} Z`}
          fill={style.surface} stroke={style.geometry} strokeWidth=".75" opacity={alpha}/>;
      })}
      <path data-node-id="memory-opens-to-light" d={`M -1230 460 C -640 ${-610-arch*140} 520 ${-650-arch*110} 1260 430 L 1260 485 C 540 -390 -550 -430 -1230 520 Z`}
        fill="url(#v31-luminous-arc)" opacity={arch*.65}/>
      {style.solo>0&&<path d={`M -1050 420 C -450 -610 450 -610 1050 420`} fill="none" stroke={style.emphasis} strokeWidth=".8" opacity={style.solo*.12}/ >}
    </g>
  </g>;
};
