import React from 'react';
import {AbsoluteFill,Html5Audio,staticFile,useCurrentFrame,useRemotionEnvironment} from 'remotion';
import base from '../timeline.json';
import timingSource from './word-timing.json';
import {ease,range} from '../math';
import {SHOTS} from './direction';
import {Lyrics,Title} from './Lyrics';
import {World} from './World';
import {transitionClip,TransitionDrawing} from './Transitions';
import type {WordTiming} from './types';

export type V2Props={reviewAudio:boolean;visualOffsetFrames:number;timing:WordTiming};
export const V2_TIMING=timingSource as WordTiming;
export const FilmV2:React.FC<V2Props>=({reviewAudio,visualOffsetFrames,timing})=>{
  const actual=useCurrentFrame();
  const frame=actual-visualOffsetFrames;
  const {isRendering}=useRemotionEnvironment();
  const found=SHOTS.findIndex(s=>frame>=s.startFrame && frame<s.endFrame);
  const index=found<0 ? frame<0 ? 0 : SHOTS.length-1 : found;
  const shot=SHOTS[index];
  const previous=index>0 ? SHOTS[index-1] : null;
  const transition=previous ? range(frame-shot.startFrame,0,21) : 1;
  const mask=`scene-transition-${index}`;
  let pulse=0;
  for(const onset of base.beats){const age=frame-onset.frame;if(age>=0 && age<14)pulse=Math.max(pulse,onset.strength*Math.exp(-age/6));}
  const line=timing.lines.find(l=>frame>=l.startFrame && frame<l.endFrame);
  const outgoing=timing.lines.find(l=>frame>=l.endFrame && frame<l.endFrame+11);
  const start=ease(range(actual,0,24));
  const ending=1-ease(range(actual,base.durationInFrames-54,base.durationInFrames-1));
  return <AbsoluteFill style={{background:'#101929',overflow:'hidden'}}>
    <style>{`@font-face{font-family:V2Serif;src:url('${staticFile('v2/fonts/SourceHanSerifSC-Light.otf')}') format('opentype');font-display:block;font-weight:300;} *{box-sizing:border-box;}`}</style>
    <AbsoluteFill style={{opacity:start*ending}}>
      {previous && transition<1 && <World shot={previous} frame={frame} pulse={pulse} prefix="v2-outgoing"/>}
      <div style={{position:'absolute',inset:0,clipPath:transitionClip(shot.transition,transition,mask)}}><World shot={shot} frame={frame} pulse={pulse} prefix="v2-incoming"/></div>
      {transition<1 && <TransitionDrawing type={shot.transition} progress={transition} id={mask}/>}
      {frame<489 && <Title frame={frame}/>}
      {outgoing && <Lyrics line={outgoing} shot={SHOTS[outgoing.id+2]} frame={frame} outgoing/>}
      {line && <Lyrics line={line} shot={shot} frame={frame}/>}
    </AbsoluteFill>
    {(!isRendering || reviewAudio) && <Html5Audio src={staticFile(base.audioFile)}/>}
  </AbsoluteFill>;
};
