import React,{useEffect,useRef} from 'react';
import {AbsoluteFill,Html5Audio,staticFile,useCurrentFrame,useRemotionEnvironment} from 'remotion';
import {TypeWorld,GlyphWord} from './TypeWorld';
import {resolveData,OVERRIDES} from './data';
import {cameraAt,cameraTransform} from './camera';
import {progress,smooth,smoother,lerp} from './motion';
import {PALETTE} from './direction';
import type {Overrides} from './types';

export type V3Props={reviewAudio:boolean;overrides:Overrides};
const Grain:React.FC=()=>{
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const ctx=ref.current!.getContext('2d')!,data=ctx.createImageData(640,360);
    let state=1031;
    for(let i=0;i<data.data.length;i+=4){state=(Math.imul(state,1664525)+1013904223)>>>0;const value=state>>>24;data.data[i]=data.data[i+1]=data.data[i+2]=value;data.data[i+3]=255;}
    ctx.putImageData(data,0,0);
  },[]);
  return <canvas ref={ref} width={640} height={360} style={{position:'absolute',width:1920,height:1080,opacity:.035,mixBlendMode:'soft-light'}}/>;
};

export const FilmV3:React.FC<V3Props>=({reviewAudio,overrides})=>{
  const real=useCurrentFrame(),{isRendering}=useRemotionEnvironment();
  const {timing,events,visualOffsetFrames}=resolveData(overrides);
  const frame=real-visualOffsetFrames;
  const warm=smoother(progress(frame,2795,3210));
  const end=1-smoother(progress(real,3670,3728));
  const camera=cameraAt(frame,timing.lines,events);
  const titleExit=smoother(progress(frame,360,486));
  const titleScale=lerp(4.6,1.0,titleExit);
  return <AbsoluteFill style={{background:PALETTE.ink,overflow:'hidden'}}>
    <AbsoluteFill style={{background:`radial-gradient(ellipse at 64% 44%,rgba(${lerp(19,44,warm)},${lerp(35,30,warm)},${lerp(47,24,warm)},.7),transparent 72%)`,opacity:end}}>
      <Grain/>
      <TypeWorld frame={frame} lines={timing.lines} events={events} offset={visualOffsetFrames}/>
      {frame<489&&<svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute',inset:0}}>
        <g transform={cameraTransform(camera)}>
          <g data-node-id="title-rain-to-window" transform={`translate(${lerp(-540,-615,titleExit)} ${lerp(130,-235,titleExit)}) scale(${titleScale})`} opacity={smooth(progress(frame,24,70))*(1-titleExit*.87)}>
            <GlyphWord text="雨" weight="light" tracking={0} fill={PALETTE.paper}/>
          </g>
          <g transform={`translate(${lerp(50,-410,titleExit)} ${lerp(130,-235,titleExit)}) scale(${titleScale})`} opacity={smooth(progress(frame,80,130))*(1-titleExit)}>
            <GlyphWord text="爱" weight="light" tracking={0} fill={PALETTE.paper}/>
          </g>
          <path d={`M -550 240 H ${lerp(-550,560,smoother(progress(frame,170,340)))}`} stroke={PALETTE.blue} strokeWidth="1" opacity={1-titleExit*.6}/>
        </g>
      </svg>}
    </AbsoluteFill>
    {(!isRendering||reviewAudio)&&<Html5Audio src={staticFile('reference.mp3')}/>}
  </AbsoluteFill>;
};
export const V3_DEFAULTS={reviewAudio:false,overrides:OVERRIDES};
