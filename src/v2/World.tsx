import React from 'react';
import {Img,staticFile} from 'remotion';
import {ease,rand,range} from '../math';
import {ART} from './direction';
import {Surface} from './Surface';
import type {Shot} from './types';

export const World:React.FC<{shot:Shot;frame:number;pulse:number;prefix:string}> = ({shot,frame,pulse,prefix})=>{
  const progress=ease(range(frame,shot.startFrame,shot.endFrame));
  const camera=shot.cameraFrom.map((v,i)=>v+(shot.cameraTo[i]-v)*progress);
  const art=staticFile(`v2/art/${ART[shot.art]}.png`);
  const cool=1-ease(range(frame/30,91,112));
  const focus=shot.layout==='right' ? 1460 : shot.layout==='center' ? 960 : 455;
  const cameraStyle={position:'absolute' as const,inset:0,transform:`translate(${camera[0]}px,${camera[1]}px) scale(${camera[2]+pulse*.0025}) rotate(${camera[3]}deg)`};
  const float=Math.sin(frame*.013+shot.id)*12;
  const subjectX=shot.art===1 || shot.art===4 ? 550 : shot.art===2 ? 1390 : 1390;
  const subjectTravel=Math.sin(frame*.007+shot.id)*3+progress*4;
  return <div style={{position:'absolute',inset:0,overflow:'hidden',background:'#182339'}}>
    <div style={cameraStyle}>
      <Img src={art} style={{position:'absolute',width:1920,height:1080,inset:0,objectFit:'cover'}}/>
      <Surface art={shot.art} frame={frame} pulse={pulse}/>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute',inset:0}}>
        <defs>
          <radialGradient id={`${prefix}-haze`}><stop stopColor="#dce0e9" stopOpacity=".10"/><stop offset="1" stopColor="#dce0e9" stopOpacity="0"/></radialGradient>
          <linearGradient id={`${prefix}-thread`}><stop stopColor="#a8c0db" stopOpacity="0"/><stop offset=".5" stopColor="#fae7c8" stopOpacity=".8"/><stop offset="1" stopColor="#c2bfdd" stopOpacity="0"/></linearGradient>
          <clipPath id={`${prefix}-lens`}><ellipse cx={shot.layout==='right' ? 185 : 1715} cy={455+float} rx="110" ry="160"/></clipPath>
          <radialGradient id={`${prefix}-subject-mask`}><stop offset=".60" stopColor="white"/><stop offset="1" stopColor="black"/></radialGradient>
          <mask id={`${prefix}-subject`}><ellipse cx={subjectX} cy="430" rx="650" ry="410" fill={`url(#${prefix}-subject-mask)`}/></mask>
        </defs>
        <g mask={`url(#${prefix}-subject)`} transform={`translate(${subjectTravel} ${Math.sin(frame*.006)*2})`}>
          <image href={art} width="1920" height="1080" preserveAspectRatio="none"/>
        </g>
        <ellipse cx={900+Math.sin(frame*.004)*160} cy={625} rx="1100" ry="130" fill={`url(#${prefix}-haze)`}/>
        <g clipPath={`url(#${prefix}-lens)`} opacity=".5">
          <image href={art} x={-16-Math.sin(frame*.014)*7} y={8+Math.cos(frame*.011)*5} width="1952" height="1098" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <ellipse cx={shot.layout==='right' ? 185 : 1715} cy={455+float} rx="110" ry="160" fill="none" stroke="#dfdbe5" strokeWidth=".8" opacity=".19"/>
        {Array.from({length:11},(_,i)=>{
          const y=600+i*19+Math.sin(frame*.018+i*.31)*16;
          const bend=Math.sin(frame*.012+i*.13)*70;
          return <path key={i} d={`M -170 ${y+90} C 440 ${y-145+bend} 1050 ${y+205} 2100 ${y-100}`} fill="none" stroke={`url(#${prefix}-thread)`} strokeWidth={i===0 ? 1.2 : .55} opacity={shot.art===3 || shot.art===5 ? .35 : .09}/>;
        })}
        {Array.from({length:95},(_,i)=>{
          const t=(rand(i+131)+frame*(.00045+rand(i+653)*.00015))%1;
          const x=2100*t-90;
          const y=690+Math.sin(t*Math.PI*2+i*.41+frame*.004)*140+rand(i+27)*170;
          const bright=Math.pow(Math.sin((t+.2)*Math.PI),2);
          return <circle key={i} cx={x} cy={y} r={.6+rand(i+43)*2.3} fill={i%3 ? '#e7d4b4' : '#bfd2ed'} opacity={bright*(.11+rand(i+27)*.33)*(shot.art>=3 ? 1 : .45)}/>;
        })}
      </svg>
    </div>
    <div style={{position:'absolute',inset:0,background:`rgba(10,23,49,${.18*cool})`,mixBlendMode:'multiply'}}/>
    <Img src={staticFile(`v2/art/fg-${shot.texture==='glass' ? 'frame' : shot.texture==='dew' ? 'droplets' : 'ribbon'}.png`)}
      style={{position:'absolute',width:shot.texture==='glass' ? 530 : 610,height:800,objectFit:'contain',
        left:shot.layout==='right' ? -260+progress*42 : 1540-progress*68,
        top:185+float-progress*30,opacity:shot.texture==='glass' ? .53 : .43,
        transform:`rotate(${shot.layout==='right' ? -17 : 12}deg) translateY(${Math.sin(frame*.008)*10}px)`,filter:'blur(1.3px)'}}/>
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute',inset:0}}>
      <defs>
        <radialGradient id={`${prefix}-shade`} cx={focus/1920} cy=".43" r=".65"><stop stopColor="#061022" stopOpacity=".36"/><stop offset=".57" stopColor="#071123" stopOpacity=".08"/><stop offset="1" stopColor="#071123" stopOpacity="0"/></radialGradient>
        <radialGradient id={`${prefix}-edge`} r=".78"><stop offset=".4" stopColor="#091325" stopOpacity="0"/><stop offset="1" stopColor="#091325" stopOpacity=".58"/></radialGradient>
      </defs>
      <rect width="1920" height="1080" fill={`url(#${prefix}-shade)`}/>
      <rect width="1920" height="1080" fill={`url(#${prefix}-edge)`}/>
    </svg>
  </div>;
};
