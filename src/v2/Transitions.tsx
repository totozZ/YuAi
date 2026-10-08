import React from 'react';
import {ease,rand,range} from '../math';
import type {Transition} from './types';

export const transitionClip=(type:Transition,p:number,id:string)=>{
  const t=ease(p);
  if(p>=1)return undefined;
  if(type==='iris' || type==='ripple')return `circle(${t*2240}px at ${type==='iris' ? 1350 : 720}px ${type==='iris' ? 480 : 680}px)`;
  if(type==='frame')return `polygon(${960-1300*t}px ${540-810*t}px,${960+1300*t}px ${540-810*t}px,${960+1300*t}px ${540+810*t}px,${960-1300*t}px ${540+810*t}px)`;
  return `url(#${id})`;
};

export const TransitionDrawing:React.FC<{type:Transition;progress:number;id:string}> = ({type,progress,id})=>{
  const t=ease(progress);
  const opacity=Math.sin(progress*Math.PI);
  const x=-330+t*2580;
  return <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute',inset:0,pointerEvents:'none'}}>
    <defs>
      <clipPath id={id}>
        {type==='ribbon' && <path d={`M -500 -300 H ${x} C ${x-220} 250 ${x+230} 740 ${x} 1380 H -500 Z`}/>}
        {type==='prism' && Array.from({length:7},(_,i)=>{
          const spread=ease(range(progress,.035*i,Math.min(1,.65+.035*i)));
          const c=(i+.5)*320-160;
          return <path key={i} d={`M ${c-188*spread-110} -100 L ${c+188*spread-110} -100 L ${c+188*spread+110} 1180 L ${c-188*spread+110} 1180 Z`}/>;
        })}
        {type==='shards' && Array.from({length:18},(_,i)=>{
          const xx=(i%6)*384-180,yy=Math.floor(i/6)*430-80;
          const s=ease(range(progress,rand(i+65)*.18,.77+rand(i+49)*.18));
          return <path key={i} d={`M ${xx+192-216*s} ${yy+215-238*s} L ${xx+192+216*s} ${yy+215-238*s} L ${xx+192+216*s} ${yy+215+238*s} L ${xx+192-216*s} ${yy+215+238*s} Z`}/>;
        })}
      </clipPath>
      <linearGradient id={`${id}-rainbow`}><stop stopColor="#a9b9e1"/><stop offset=".4" stopColor="#e3cce0"/><stop offset=".7" stopColor="#ead3a7"/><stop offset="1" stopColor="#b9d4cb"/></linearGradient>
    </defs>
    <g opacity={opacity*.4} fill="none" stroke={`url(#${id}-rainbow)`}>
      {(type==='iris' || type==='ripple') && [0,12,28].map((offset,i)=><circle key={i} cx={type==='iris' ? 1350 : 720} cy={type==='iris' ? 480 : 680} r={Math.max(0,t*2240-offset)} strokeWidth={i===0 ? 3 : .8}/>)}
      {type==='frame' && <rect x={960-t*1300} y={540-t*810} width={t*2600} height={t*1620} strokeWidth="2"/>}
      {type==='ribbon' && [0,10,27].map((offset,i)=><path key={i} d={`M ${x+offset} -200 C ${x-220+offset} 250 ${x+230+offset} 740 ${x+offset} 1280`} strokeWidth={i===0 ? 4 : 1}/>)}
      {(type==='shards' || type==='prism') && Array.from({length:7},(_,i)=><path key={i} d={`M ${i*320-100} -100 L ${i*320+160} 1180`} strokeWidth="1.3"/>)}
    </g>
  </svg>;
};
