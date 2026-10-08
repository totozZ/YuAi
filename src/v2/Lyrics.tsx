import React from 'react';
import outlines from './glyphs.json';
import base from '../timeline.json';
import {ease,rand,range} from '../math';
import type {Shot,WordLine} from './types';

type Glyph={path:string;advance:number;box:{x1:number;y1:number;x2:number;y2:number};points?:number[][]};
const GLYPHS=outlines.glyphs as Record<string,Glyph>;
const words=(text:string)=>text.match(/[A-Za-z]+|[\u4e00-\u9fff]/g)??[];
const emWidth=(text:string)=>Array.from(text).reduce((n,c)=>n+(GLYPHS[c]?.advance??50)+(/\s/.test(c)?0:7),0);

export function positions(line:WordLine,shot:Shot){
  const phrases=base.lyrics[line.id].phrases;
  const result:{token:number;text:string;x:number;y:number;size:number;rotation:number}[]=[];
  let tokenIndex=0;
  phrases.forEach((phrase,row)=>{
    const units=words(phrase);
    const maximum=shot.layout==='right' ? 770 : shot.layout==='center' ? 1160 : 970;
    const size=Math.min(row ? 106 : 95,maximum/emWidth(phrase)*100);
    const width=emWidth(phrase)*size/100;
    const anchor=shot.layout==='right' ? 1000+(row ? 22 : 0) : shot.layout==='center' ? (1920-width)/2 : 190+(row ? 72 : 0);
    let cursor=0;
    units.forEach((unit,i)=>{
      let x=anchor+cursor;
      let y=(shot.layout==='center' ? 438 : shot.layout==='right' ? 397 : 420)+row*145;
      let rotation=0;
      if(shot.layout==='arc'){
        const angle=(-120+i*15)*Math.PI/180;
        x=855+560*Math.cos(angle);
        y=840+560*Math.sin(angle);
        rotation=(-120+i*15)+90;
      }
      result.push({token:tokenIndex++,text:unit,x,y,size:shot.layout==='arc' ? 110 : size,rotation});
      cursor+=emWidth(unit)*size/100+(unit.length>1 ? 20 : 0);
    });
  });
  return result;
}

export const Lyrics:React.FC<{line:WordLine;shot:Shot;frame:number;outgoing?:boolean}> = ({line,shot,frame,outgoing=false})=>{
  const elapsed=frame-line.startFrame;
  const after=Math.max(0,frame-line.endFrame);
  const vanish=outgoing ? 1-ease(range(after,0,11)) : 1;
  const layout=positions(line,shot);
  const prefix=`words-${line.id}`;
  return <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute',inset:0,overflow:'hidden'}}>
    <defs>
      <linearGradient id={`${prefix}-ink`} x2=".25" y2="1"><stop stopColor="#fff8ec"/><stop offset="1" stopColor="#ded5d3"/></linearGradient>
      <linearGradient id={`${prefix}-light`}><stop stopColor="#c2d6ee"/><stop offset=".6" stopColor="#ffe8be"/><stop offset="1" stopColor="#c8b9e5"/></linearGradient>
      <filter id={`${prefix}-shadow`} x="-15%" y="-20%" width="140%" height="145%"><feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0b152b" floodOpacity=".7"/></filter>
      {layout.map((position,i)=>{
        const age=frame-line.tokens[position.token].startFrame;
        return <clipPath key={i} id={`${prefix}-wipe-${i}`}><rect x="-5" y="-103" width={emWidth(position.text)*ease(range(age,0,5))+10} height="127"/></clipPath>;
      })}
    </defs>
    <g filter={`url(#${prefix}-shadow)`}>
      {layout.map((position,index)=>{
        const token=line.tokens[position.token];
        const age=frame-token.startFrame;
        if(age<0)return null;
        const entering=ease(range(age,0,10));
        const scaling=position.size/100;
        let cursor=0;
        return <g key={index} transform={`translate(${position.x+after*1.6} ${position.y+(1-entering)*14-after*.25}) rotate(${position.rotation+(outgoing ? after*.45 : 0)}) scale(${scaling})`} opacity={vanish}>
          {Array.from(position.text).map((char,k)=>{
            const glyph=GLYPHS[char];
            if(!glyph)return null;
            const x=cursor;cursor+=glyph.advance+7;
            return <g key={k} transform={`translate(${x} 0)`}>
              <path d={glyph.path} fill="none" stroke={`url(#${prefix}-light)`} strokeWidth={.65} strokeDasharray="1000" strokeDashoffset={(1-ease(range(age,0,8)))*1000} opacity={age<18 ? 1 : .26}/>
              <g clipPath={`url(#${prefix}-wipe-${index})`}><path d={glyph.path} fill={`url(#${prefix}-ink)`} stroke="#273046" strokeWidth=".28" paintOrder="stroke"/></g>
            </g>;
          })}
          {age<17 && <path d={`M ${-10+ease(range(age,0,12))*emWidth(position.text)} -98 v 108`} stroke="#f6dfb6" strokeWidth=".6" opacity={Math.sin(range(age,0,17)*Math.PI)*.65}/>} 
        </g>;
      })}
    </g>
    {!outgoing && line.id!==18 && <g opacity=".28" fill="none" stroke={`url(#${prefix}-light)`}>
      {layout.filter(p=>frame>=line.tokens[p.token].startFrame).map((p,i)=>{
        const age=frame-line.tokens[p.token].startFrame;
        const expand=ease(range(age,0,24));
        return <path key={i} d={`M ${p.x+12} ${p.y+35} q ${expand*25} ${4+Math.sin(elapsed*.019+i)*7} ${expand*58} 0`} strokeWidth=".7"/>;
      })}
    </g>}
    {outgoing && <g fill="#efd5ab">
      {layout.map((p,i)=>{
        if(frame<line.tokens[p.token].startFrame)return null;
        const glyph=GLYPHS[p.text[0]];
        return (glyph?.points??[]).slice(0,12).map((point,j)=><circle key={`${i}-${j}`} cx={p.x+point[0]*p.size/100+after*(2+rand(i*18+j)*5)} cy={p.y+point[1]*p.size/100-after*(1+rand(j+83)*4)} r={.8+rand(j+63)*1.3} opacity={vanish*.75}/>);
      })}
    </g>}
  </svg>;
};

export const Title:React.FC<{frame:number}>=({frame})=>{
  const opacity=ease(range(frame,30,80))*(1-ease(range(frame,425,482)));
  return <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute',inset:0}}>
    <defs><linearGradient id="v2-title"><stop stopColor="#f4eee7"/><stop offset=".65" stopColor="#f4dbac"/><stop offset="1" stopColor="#bcb7db"/></linearGradient></defs>
    <g transform="translate(210 542)" opacity={opacity}>
      <text x="6" y="-244" fontFamily="V2Serif" fontSize="17" letterSpacing="8" fill="#f0e3cf" opacity=".8">RAINIE / LOVE</text>
      {['雨','爱'].map((char,i)=>{
        const glyph=GLYPHS[char];
        const age=frame-(58+i*48);
        const filling=ease(range(age,14,95));
        return <g key={i} transform={`translate(${i*248} 0) scale(2.08)`}>
          <path d={glyph.path} fill="none" stroke="url(#v2-title)" strokeWidth=".8" strokeDasharray="1800" strokeDashoffset={(1-ease(range(age,0,82)))*1800}/>
          <path d={glyph.path} fill="url(#v2-title)" opacity={filling}/>
        </g>;
      })}
      <path d={`M 5 54 C 190 36 325 81 ${5+ease(range(frame,110,220))*443} 55`} fill="none" stroke="#e1cbab" strokeWidth="1" opacity=".55"/>
      <text x="8" y="112" fontFamily="V2Serif" fontSize="22" letterSpacing="7" fill="#e4d9d0">杨丞琳</text>
    </g>
  </svg>;
};
