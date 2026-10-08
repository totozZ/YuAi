import React from 'react';
import {clamp,ease,FONT,range} from './math';
import type {LyricCue} from './types';

const advance = (character: string, size: number) => /[\u4e00-\u9fff]/.test(character) ? size*1.13 : character===' ' ? size*.38 : size*.61;

export const TypographicRain: React.FC<{cue: LyricCue; frame: number; pulse: number}> = ({cue,frame,pulse}) => {
  const age=frame-cue.startFrame;
  const left=cue.endFrame-frame;
  const length=cue.endFrame-cue.startFrame;
  const exit=ease(range(left,0,14));
  const progress=clamp(age/length);
  const id=`lyric-${cue.id}`;
  const overall=ease(range(age,0,12))*exit;
  const arc=cue.effect==='arc';
  const cloud=cue.effect==='open';
  const lines=cue.phrases;
  const depart=cue.effect==='depart' ? -ease(range(progress,.66,1))*30 : 0;
  const release=cue.effect==='release' ? ease(range(progress,.65,1))*36 : 0;
  return <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute',inset:0,overflow:'hidden'}}>
    <defs>
      <linearGradient id={`${id}-ink`} x2=".7" y2="1"><stop stopColor="#f4eee5"/><stop offset="1" stopColor={arc ? '#e1c9a7' : '#c3d1e5'}/></linearGradient>
      <linearGradient id={`${id}-mirror`} x2="0" y2="1"><stop stopColor="white" stopOpacity=".22"/><stop offset="1" stopColor="white" stopOpacity="0"/></linearGradient>
      <filter id={`${id}-blur`} x="-30%" y="-40%" width="160%" height="180%"><feGaussianBlur stdDeviation="2.3"/></filter>
      <clipPath id={`${id}-reveal`}><rect x="100" y="180" width={1720*ease(range(age,0,24))} height="660"/></clipPath>
      <mask id={`${id}-mirrorMask`}><rect x="150" y="700" width="1550" height="210" fill={`url(#${id}-mirror)`}/></mask>
    </defs>
    {cue.effect==='window' && <g opacity={overall*.18} fill="none" stroke="#a5b8cf" strokeWidth="1">
      <path d={`M ${cue.anchor[0]-28} ${cue.anchor[1]-102} v ${110+lines.length*140}`}/>
      <path d={`M ${cue.anchor[0]-28} ${cue.anchor[1]+lines.length*140} h ${240+ease(range(age,0,38))*420}`}/>
    </g>}
    <g clipPath={`url(#${id}-reveal)`}>
      {lines.map((phrase,lineIndex)=>{
        const english=/[a-zA-Z]/.test(phrase);
        const size=arc ? 91 : english ? 106 : cue.fontSize+(lineIndex===1 ? 12 : 0);
        const rowY=cue.anchor[1]+lineIndex*137;
        const rowX=cue.anchor[0]+(lineIndex===1 ? 86 : 0);
        let cursor=0;
        return <g key={lineIndex}>
          {Array.from(phrase).map((char,index)=>{
            const baseX=cursor;
            cursor+=advance(char,size);
            const delay=lineIndex*8+index*1.25;
            const entry=ease(range(age-delay,0,21));
            const ghost=cue.effect==='focus' ? (1-entry)*10 : 0;
            const falling=['fall','rain','accumulate'].includes(cue.effect);
            let x=rowX+baseX+(1-entry)*(cue.effect==='depart' ? 38 : 12)+depart;
            let y=rowY+(1-entry)*(falling ? -70-index%3*13 : 22)+release;
            let rotation=cue.effect==='release' ? (1-exit)*(index-3)*1.7 : falling ? (1-entry)*(index%2 ? -4 : 4) : 0;
            let opacity=entry*exit;
            if(cue.effect==='transparent') opacity*=1-.48*ease(range(progress,.5,.86));
            if(arc){
              const angle=(-114+index*12)*Math.PI/180;
              x=1280+525*Math.cos(angle);
              y=786+525*Math.sin(angle)-(1-entry)*22;
              rotation=(-114+index*12)+90;
            }
            const accent=english || (lineIndex===1 && index<2) || arc;
            return <g key={index} transform={`translate(${x} ${y}) rotate(${rotation})`} opacity={opacity}>
              {falling && <path d={`M ${size*.43} ${-size-12} v ${-20-(1-entry)*80}`} stroke="#b6c9df" opacity={(1-entry)*.65} strokeWidth="1"/>}
              {ghost>0 && <text x={ghost} y={-ghost*.32} fontFamily={FONT} fontSize={size} fontWeight={300} fill="#bbc8df" opacity={(1-entry)*.45} filter={`url(#${id}-blur)`}>{char}</text>}
              <text fontFamily={english ? 'Georgia, serif' : FONT} fontSize={size} fontWeight={300} fill={accent ? `url(#${id}-ink)` : '#e5e9ef'} stroke="#0a1528" strokeWidth=".5" paintOrder="stroke" style={{fontKerning:'normal'}}>{char}</text>
              {cue.effect==='ripple' && <ellipse cx={size*.45} cy={40+index*2} rx={12+entry*36+pulse*8} ry={2+entry*5} fill="none" stroke="#bdd0e4" strokeWidth=".7" opacity={.19*entry}/>}
              {cue.effect==='memory' && <rect x="-9" y={-size-10} width={size+12} height={size+30} fill="none" stroke="#bdd0e4" strokeWidth=".7" opacity={.11*entry}/>}
            </g>;
          })}
          {['accumulate','continue','transparent','bloom'].includes(cue.effect) && <path d={`M ${rowX} ${rowY+32} h ${cursor*ease(range(age-lineIndex*8,0,45))}`} stroke={english ? '#ddc3a5' : '#a9bfd6'} strokeWidth="1" opacity={overall*.22}/>} 
          {cue.effect==='breathe' && <path d={`M ${rowX} ${rowY+45} Q ${rowX+160} ${rowY+36-Math.sin(age/24)*13} ${rowX+320} ${rowY+45} T ${rowX+600} ${rowY+45}`} fill="none" stroke="#b9c9de" strokeWidth="1" opacity={overall*.2}/>}
        </g>;
      })}
    </g>
    {cue.effect==='transparent' && <g mask={`url(#${id}-mirrorMask)`} opacity={overall*.45} transform="translate(0 1110) scale(1 -.5)">
      {lines.map((line,i)=><text key={i} x={cue.anchor[0]+(i ? 86 : 0)} y={cue.anchor[1]+i*137} fontFamily={FONT} fontSize={cue.fontSize} letterSpacing={cue.fontSize*.13} fill="#c4d4e4">{line}</text>)}
    </g>}
    {cloud && <path d={`M 155 ${650-ease(range(age,0,65))*25} Q 635 710 1180 657`} fill="none" stroke="#d7c7b5" strokeWidth="1" opacity={overall*.2}/>}
  </svg>;
};

export const OpeningTitle: React.FC<{frame: number}> = ({frame}) => {
  const entry=ease(range(frame,32,104));
  const exit=1-ease(range(frame,355,450));
  const opacity=entry*exit;
  return <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute',inset:0}}>
    <defs><linearGradient id="titleInk" x2=".7" y2="1"><stop stopColor="#ede7df"/><stop offset="1" stopColor="#97aecb"/></linearGradient></defs>
    <g transform={`translate(275 ${380+(1-entry)*25})`} opacity={opacity}>
      <path d="M 3 -76 v -43 h 43 M 540 255 v 43 h -43" fill="none" stroke="#b0c2d8" strokeWidth="1" opacity=".35"/>
      <text y="-65" fontFamily="Georgia, serif" fontSize="17" letterSpacing="8" fill="#c2cbd8" opacity=".68">RAINIE YANG</text>
      <text x="-13" y="137" fontFamily={FONT} fontWeight="300" fontSize="191" letterSpacing="38" fill="url(#titleInk)">雨爱</text>
      <path d={`M 5 184 h ${entry*385}`} stroke="#a5b6cc" strokeWidth="1" opacity=".4"/>
      <text x="8" y="239" fontFamily="Georgia, serif" fontStyle="italic" fontSize="31" letterSpacing="3" fill="#bfcddd" opacity=".7">Rainie Love</text>
    </g>
  </svg>;
};
