import React from 'react';
import {useCurrentFrame} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {DIRECTIONS,PALETTE} from './direction';
import {FONTS,wordWidth,placements,characterAdvance} from './layout';
import {tokenPose,keyIndices} from './poses';
import {cameraAt,cameraTransform,originAt} from './camera';
import {progress,smoother,smooth,lerp,clamp} from './motion';
import {WorldGeometry} from './WorldGeometry';
import {SceneBackdrop} from './SceneBackdrop';
import {sceneStyleAt,type SceneEdition} from './scene-style';
import type {CueLine,MusicEvent,Pose,Weight} from './types';

export const GlyphWord:React.FC<{text:string;weight:Weight;tracking:number;fill:string;stroke?:string;strokeWidth?:number;fillOpacity?:number}> = ({text,weight,tracking,fill,stroke,strokeWidth,fillOpacity=1})=>{
  let cursor=0;
  return <>{Array.from(text).map((char,i)=>{
    const glyph=FONTS[weight][char];if(!glyph)return null;
    const x=cursor;cursor+=characterAdvance(text,i,weight,tracking);
    return <path key={i} d={glyph.path} transform={`translate(${x} 0)`} fill={fill} fillOpacity={fillOpacity} stroke={stroke} strokeWidth={strokeWidth} paintOrder="stroke"/>;
  })}</>;
};
export function poseTransform(p:Pose){
  const projection=1600/(1600-p.depth),yaw=p.tilt*Math.PI/180;
  return `translate(${p.x} ${p.y}) rotate(${p.rotation}) scale(${p.scale*projection}) matrix(${Math.cos(yaw)} ${Math.sin(yaw)*.12} 0 1 0 0) translate(${-p.anchorX} ${-p.anchorY})`;
}

const MovingSamples:React.FC<{lines:CueLine[];events:MusicEvent[];offset:number;ids:Set<string>;edition:SceneEdition}>=({lines,events,offset,ids,edition})=>{
  // The sampled child reads its own fractional frame. Passing the parent's fixed
  // frame would silently eliminate motion blur.
  const frame=useCurrentFrame()-offset;
  const camera=cameraAt(frame,lines,events);
  const style=sceneStyleAt(frame,events,edition);
  return <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute',inset:0}}>
    <g transform={cameraTransform(camera)}>
      {lines.flatMap(line=>placements(line).map(p=>{
        const token=line.tokens[p.index];if(!ids.has(token.id))return null;
        const pose=tokenPose(line,p,frame,lines,events);
        return <g key={token.id} data-node-id={token.id} transform={poseTransform(pose)} opacity={pose.opacity} style={{filter:pose.blur>0?`blur(${pose.blur/Math.max(.7,pose.scale)}px)`:undefined}}>
          <GlyphWord text={token.text} weight={p.weight} tracking={p.tracking} fill={frame>line.endFrame-12?style.history:style.foreground}/>
        </g>;
      }))}
    </g>
  </svg>;
};

export const TypeWorld:React.FC<{frame:number;lines:CueLine[];events:MusicEvent[];offset:number;edition?:SceneEdition}>=({frame,lines,events,offset,edition='classic'})=>{
  const camera=cameraAt(frame,lines,events);
  const style=sceneStyleAt(frame,events,edition);
  const blurred=new Set<string>();
  for(const line of lines){
    const release=Math.max(line.tokens.at(-1)!.readableFrame+15,line.endFrame-12);
    const portalCut=events.find(e=>e.id===`cut-${line.id+1}`);
    const inPortal=[7,12].includes(line.id)&&portalCut&&frame>=line.tokens.at(-1)!.readableFrame+18&&frame<portalCut.frame;
    for(const token of line.tokens){
      const age=frame-token.readableFrame;
      if(inPortal||(age<0&&age>=-DIRECTIONS[line.id].lead)||(frame>release&&frame<release+42))blurred.add(token.id);
    }
  }
  return <>
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute',inset:0}}>
      <defs>
        <linearGradient id="v3-hope-ink" x1="0" y1="0" x2="1" y2="1"><stop stopColor={style.foreground}/><stop offset="1" stopColor={style.emphasis}/></linearGradient>
      </defs>
      <g transform={cameraTransform(camera)}>
        <SceneBackdrop frame={frame} lines={lines} events={events} style={style}/>
        <WorldGeometry frame={frame} lines={lines} events={events} edition={edition}/>
        {lines.map(line=>{
          const keys=keyIndices(line);
          const lastKey=Math.max(...keys.map(i=>line.tokens[i].readableFrame));
          if(frame<lastKey+15||frame>line.endFrame+150)return null;
          const origin=originAt(line,frame,lines,events);
          const appear=smooth(progress(frame,lastKey+15,lastKey+34));
          const age=progress(frame,line.endFrame,line.endFrame+150);
          const text=keys.map(i=>line.tokens[i].text).join('');
          const size=Math.min(480,850/Math.max(1,wordWidth(text,'bold'))*100);
          return <g key={`hero-${line.id}`} data-node-id={`hero-${line.tokens[keys[0]].id}`}
            transform={`translate(${origin.x+(line.id%2?-430:60)} ${origin.y+120}) scale(${size/100})`}
            opacity={appear*(1-age)*(.06+DIRECTIONS[line.id].intensity*.09)*(style.isLight?.68:1)}>
            <GlyphWord text={text} weight="bold" tracking={0} fill={line.id>=17?style.emphasis:style.hero}/>
          </g>;
        })}
        {lines.flatMap(line=>placements(line).map(p=>{
          const token=line.tokens[p.index];if(frame<token.readableFrame)return null;
          if(blurred.has(token.id))return null;
          const pose=tokenPose(line,p,frame,lines,events);
          if(Math.abs(pose.x-camera.x)>1900||Math.abs(pose.y-camera.y)>1500)return null;
          const out=frame>line.endFrame-12;
          const outline=DIRECTIONS[line.id].layout==='transparent'&&p.index>=8&&frame>line.tokens.at(-1)!.readableFrame+15;
          const fill=line.id>=17?'url(#v3-hope-ink)':out?style.history:style.foreground;
          return <g key={token.id} data-node-id={token.id} transform={poseTransform(pose)} opacity={pose.opacity}>
            <GlyphWord text={token.text} weight={p.weight} tracking={p.tracking} fill={fill} fillOpacity={outline?.12:1} stroke={outline?style.foreground:undefined} strokeWidth={outline?1.1:undefined}/>
          </g>;
        }))}
      </g>
    </svg>
    {blurred.size>0&&<CameraMotionBlur samples={5} shutterAngle={90}><MovingSamples lines={lines} events={events} offset={offset} ids={blurred} edition={edition}/></CameraMotionBlur>}
  </>;
};
