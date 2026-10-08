import React from 'react';
import {AbsoluteFill,Html5Audio,staticFile,useCurrentFrame,useRemotionEnvironment} from 'remotion';
import {ease,range} from './math';
import {Scenery} from './Scenery';
import {OpeningTitle,TypographicRain} from './TypographicRain';
import type {Timeline} from './types';

export type FilmProps = {timeline: Timeline; reviewAudio: boolean};

export const Film: React.FC<FilmProps> = ({timeline,reviewAudio}) => {
  const actualFrame=useCurrentFrame();
  const frame=actualFrame-timeline.visualOffsetFrames;
  const {isRendering}=useRemotionEnvironment();
  const found=timeline.scenes.findIndex(s=>frame>=s.startFrame && frame<s.endFrame);
  const currentIndex=found>=0 ? found : frame<0 ? 0 : timeline.scenes.length-1;
  const scene=timeline.scenes[currentIndex];
  const previous=currentIndex>0 ? timeline.scenes[currentIndex-1] : null;
  const transition=previous ? ease(range(frame-scene.startFrame,0,16)) : 1;
  const warmth=ease(range(frame/30,93.1,112));
  let pulse=0;
  for(const beat of timeline.beats){
    const elapsed=frame-beat.frame;
    if(elapsed>=0 && elapsed<15) pulse=Math.max(pulse,beat.strength*Math.exp(-elapsed/5));
  }
  const cue=timeline.lyrics.find(l=>frame>=l.startFrame && frame<l.endFrame);
  const finish=1-ease(range(actualFrame,timeline.durationInFrames-48,timeline.durationInFrames-1));
  const begin=ease(range(actualFrame,0,28));
  return <AbsoluteFill style={{backgroundColor:'#0a1424',overflow:'hidden'}}>
    <style>{`@font-face {font-family:SceneFont;src:url('${staticFile('fonts/scene-font.ttc')}') format('truetype');font-weight:100 900;font-display:block;} * {box-sizing:border-box;}`}</style>
    <AbsoluteFill style={{opacity:begin*finish}}>
      {previous && transition<1 && <Scenery prefix="outgoing" frame={frame} kind={previous.kind} progress={1} pulse={pulse} warmth={warmth}/>}
      <AbsoluteFill style={{opacity:transition}}>
        <Scenery prefix="incoming" frame={frame} kind={scene.kind} progress={range(frame,scene.startFrame,scene.endFrame)} pulse={pulse} warmth={warmth}/>
      </AbsoluteFill>
      {frame<489 && <OpeningTitle frame={frame}/>}
      {cue && <TypographicRain cue={cue} frame={frame} pulse={pulse}/>}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute',inset:0}} aria-hidden="true">
        <g opacity=".19" stroke="#c6d0df" strokeWidth=".6" fill="none"><path d="M 80 110 v -30 h 30 M 1810 80 h 30 v 30 M 80 970 v 30 h 30 M 1810 1000 h 30 v -30"/></g>
      </svg>
    </AbsoluteFill>
    {(!isRendering || reviewAudio) && <Html5Audio src={staticFile(timeline.audioFile)}/>}
  </AbsoluteFill>;
};
