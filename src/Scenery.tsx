import React from 'react';
import {clamp, ease, mix, rand, range} from './math';
import type {SceneKind} from './types';

type Props = {frame: number; kind: SceneKind; progress: number; pulse: number; warmth: number; prefix: string};

const skyline = Array.from({length: 31}, (_, i) => ({
  x: i * 67 - 60, w: 45 + rand(i+8) * 68, h: 100 + rand(i+32) * 260,
  color: i % 4, seed: i+1,
}));

const City: React.FC<{warmth: number; prefix: string; distant?: boolean}> = ({warmth, prefix, distant = false}) => (
  <g opacity={distant ? .48 : 1}>
    {skyline.map((b, i) => <g key={i}>
      <path d={`M ${b.x} 820 V ${820-b.h} H ${b.x+b.w} V 820 Z`} fill={mix(['#192b43','#213049','#23354a','#1c2b40'][b.color], ['#697b8e','#768696','#64798c','#6b8090'][b.color],warmth)} />
      <path d={`M ${b.x} ${820-b.h} h ${b.w} v 5 h ${-b.w}`} fill={mix('#354459','#a7a6a1',warmth)} opacity={.4} />
      {Array.from({length: Math.floor(b.h/29)}, (_, row) => Array.from({length: Math.floor(b.w/17)}, (_, col) => {
        const light = rand(b.seed*123+row*21+col*7);
        return light>.35 ? <rect key={`${row}-${col}`} x={b.x+8+col*17} y={831-b.h+row*29} width={5+rand(row+col)*3} height={8} rx={.8}
          fill={light>.78 ? '#edc99b' : mix('#647994','#c2bfac',warmth)} opacity={light>.78 ? .50-.26*warmth : .22} /> : null;
      }))}
      {i % 6 === 0 && <><path d={`M ${b.x+b.w*.6} ${820-b.h} v -36`} stroke={mix('#2d3c55','#8c969c',warmth)} strokeWidth={2}/><circle cx={b.x+b.w*.6} cy={780-b.h} r={2} fill="#df9695" opacity={.5}/></>}
    </g>)}
    <path d="M 0 822 H 1920" stroke={`url(#${prefix}-horizon)`} strokeWidth={3}/>
  </g>
);

const Rain: React.FC<{frame: number; amount: number; prefix: string; glass?: boolean}> = ({frame, amount, prefix, glass=false}) => (
  <g opacity={amount}>
    {Array.from({length: glass ? 42 : 150}, (_, i) => {
      const depth=rand(i+404);
      const speed=glass ? .22+depth*.75 : 8+depth*14;
      const y=((rand(i+87)*1450+frame*speed)%1450)-180;
      const x=rand(i+145)*2110-70-(glass ? 0 : y*.12);
      const length=glass ? 10+depth*37 : 14+depth*45;
      return glass ? <g key={i} opacity={.18+depth*.25}>
        <path d={`M ${x} ${y-length} Q ${x+3} ${y-3} ${x} ${y}`} fill="none" stroke="#c5d5e8" strokeWidth={1.2}/>
        <ellipse cx={x} cy={y} rx={1.8+depth*1.8} ry={3+depth*3} fill={`url(#${prefix}-droplet)`}/>
        <path d={`M ${x-1} ${y-2} l 0 2`} stroke="#e4ecf3" strokeWidth={1.1}/>
      </g> : <path key={i} d={`M ${x} ${y} l ${-length*.12} ${length}`} stroke="#b4c5e2" strokeWidth={.6+depth*.9} opacity={.08+depth*.21} strokeLinecap="round"/>;
    })}
  </g>
);

const Ripples: React.FC<{frame: number; pulse: number; warmth: number}> = ({frame,pulse,warmth}) => (
  <g>
    {Array.from({length:18}, (_,i)=>{
      const period=100+rand(i+21)*80;
      const phase=((frame+rand(i+86)*period)%period)/period;
      const x=rand(i+75)*1920;
      const y=849+rand(i+555)*220;
      return <g key={i} fill="none" stroke={mix('#99b1c9','#ddc9ad',warmth)} strokeWidth={1} opacity={(1-phase)*(.13+pulse*.08)}>
        <ellipse cx={x} cy={y} rx={10+phase*100} ry={1+phase*12}/>
        <ellipse cx={x} cy={y} rx={phase*78} ry={phase*9} opacity={.5}/>
      </g>;
    })}
  </g>
);

const Person: React.FC<{x?: number; y?: number; scale?: number; umbrella?: boolean; warmth: number}> = ({x=1455,y=526,scale=1,umbrella=false,warmth}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {umbrella && <>
      <path d="M -156 -37 Q -133 -181 9 -184 Q 155 -173 172 -37 Q 134 -67 91 -36 Q 42 -68 -3 -35 Q -46 -66 -94 -36 Q -125 -67 -156 -37 Z" fill={mix('#232e45','#5a6776',warmth)} stroke={mix('#75829b','#bdc0b6',warmth)} strokeWidth={2}/>
      <path d="M 9 -184 Q -28 -132 -3 -35 M 9 -184 Q 84 -143 91 -36 M 9 -184 Q -95 -137 -94 -36" fill="none" stroke="#8691a8" opacity={.32}/>
      <path d="M 6 -202 v 18 M 6 -35 v 223 q 0 20 -13 20" stroke="#d1c3b0" strokeWidth={4} fill="none"/>
    </>}
    <path d="M -33 14 Q -41 -32 -16 -51 Q 9 -73 36 -48 Q 51 -34 44 -9 L 36 7 L 26 11 L 22 38 L -7 47 Z" fill={mix('#101b2e','#384854',warmth)}/>
    <path d="M -38 -5 Q -47 -55 -13 -64 Q 31 -83 48 -40 Q 27 -54 12 -36 Q 0 -18 -2 15 L -23 18 Z" fill={mix('#11182a','#34424e',warmth)}/>
    <path d="M -8 33 Q -53 30 -66 77 L -77 217 L -98 350 Q -24 373 53 342 L 36 223 L 30 114 Q 73 148 120 133 L 125 111 Q 67 107 42 70 Q 27 40 -8 33 Z" fill={mix('#142137','#495969',warmth)} stroke={mix('#24344b','#77838b',warmth)} strokeWidth={1.5}/>
    <path d="M -47 86 Q -55 180 -47 260 M 13 59 Q 11 148 31 213 M -69 312 Q -22 325 40 309" fill="none" stroke={mix('#35465c','#92938b',warmth)} opacity={.35} strokeWidth={2}/>
    <path d="M -43 348 L -51 465 H -79 Q -92 463 -89 455 L -70 445 L -65 345 Z M 17 350 L 21 466 H 50 Q 61 462 50 454 L 35 446 L 41 345 Z" fill={mix('#111b2c','#3d4b58',warmth)}/>
    <path d="M 45 -33 Q 51 -23 46 -14" fill="none" stroke="#a2a2a4" opacity={.3} strokeWidth={1.5}/>
  </g>
);

const Street: React.FC<{prefix: string; frame: number; warmth: number; pulse: number; silhouette: boolean}> = ({prefix,frame,warmth,pulse,silhouette}) => (
  <g>
    <path d="M 0 780 L 930 680 L 1920 795 L 1920 1080 L 0 1080 Z" fill={`url(#${prefix}-road)`}/>
    <path d="M 0 995 L 922 685 M 0 818 L 922 685 M 1920 835 L 943 685 M 1920 1060 L 943 685" fill="none" stroke={mix('#738097','#cbc0ad',warmth)} strokeWidth={2} opacity={.18}/>
    {Array.from({length:5},(_,i)=><path key={i} d={`M ${780-i*103} ${715+i*i*18} L ${1100+i*118} ${722+i*i*18}`} stroke="#bbc1ce" opacity={.07} strokeWidth={2+i*.4}/>)}
    <path d="M 1280 1050 L 1347 719 H 1384 L 1425 1050 Z" fill={`url(#${prefix}-streetReflection)`} opacity={.43}/>
    <g transform="translate(1370 405)">
      <path d="M 0 469 V 89 Q -2 0 -66 0 h -28" stroke={mix('#38445c','#85929b',warmth)} strokeWidth={9} fill="none"/>
      <path d="M -127 -5 h 62 l 18 17 h -107 Z" fill="#1d2940"/>
      <ellipse cx={-96} cy={15} rx={29} ry={4} fill="#efca9e"/>
      <ellipse cx={-96} cy={42} rx={85} ry={58} fill={`url(#${prefix}-lamp)`} opacity={.7}/>
      <path d="M -119 20 L -225 434 H 22 L -76 20 Z" fill={`url(#${prefix}-beam)`} opacity={.09}/>
    </g>
    <g opacity={.38} transform="translate(999 586) scale(.41)">
      <path d="M 0 420 V 58 Q 0 0 -53 0 h -28" stroke="#8291a3" strokeWidth={8} fill="none"/>
      <ellipse cx={-89} cy={7} rx={26} ry={5} fill="#edd0a9"/>
    </g>
    <g opacity={.3} stroke="#9bacbb" strokeWidth={2} fill="none"><path d="M 1490 712 l 430 106 M 1540 721 v 198 M 1630 744 v 220 M 1760 774 v 260"/></g>
    <Person x={silhouette ? 1480 : 1535} y={silhouette ? 535 : 696} scale={silhouette ? .84 : .43} umbrella={!silhouette} warmth={warmth}/>
    <Ripples frame={frame} pulse={pulse} warmth={warmth}/>
  </g>
);

export const Scenery: React.FC<Props> = ({frame,kind,progress,pulse,warmth,prefix}) => {
  const window = kind==='window' || kind==='memory';
  const wet = 1-ease(range(frame/30,101,116));
  const camera = kind==='solo' ? 1.06-progress*.055 : 1.018+progress*.028+pulse*.0013;
  const rainbow = ease(range(frame/30,94,100));
  const radius=625;
  return <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute',inset:0}} aria-hidden="true">
    <defs>
      <linearGradient id={`${prefix}-sky`} x2=".35" y2="1">
        <stop offset="0" stopColor={mix('#0e192e','#697c95',warmth)}/>
        <stop offset=".55" stopColor={mix('#33405c','#b7b4af',warmth)}/>
        <stop offset="1" stopColor={mix('#677183','#ecd7b5',warmth)}/>
      </linearGradient>
      <linearGradient id={`${prefix}-horizon`}><stop stopColor="#d1b49b" stopOpacity=".03"/><stop offset=".7" stopColor="#d1b49b" stopOpacity=".42"/><stop offset="1" stopColor="#d1b49b" stopOpacity=".04"/></linearGradient>
      <linearGradient id={`${prefix}-water`} x2="0" y2="1"><stop stopColor={mix('#283952','#9a9c9a',warmth)}/><stop offset="1" stopColor={mix('#0c172a','#526574',warmth)}/></linearGradient>
      <linearGradient id={`${prefix}-road`} x2="0" y2="1"><stop stopColor={mix('#29364d','#7b878e',warmth)}/><stop offset="1" stopColor={mix('#101d32','#455965',warmth)}/></linearGradient>
      <linearGradient id={`${prefix}-streetReflection`} x2="0" y2="1"><stop stopColor="#f1c69e" stopOpacity=".38"/><stop offset="1" stopColor="#ddb392" stopOpacity="0"/></linearGradient>
      <linearGradient id={`${prefix}-beam`} x2="0" y2="1"><stop stopColor="#ffdbaf"/><stop offset="1" stopColor="#ffdbaf" stopOpacity="0"/></linearGradient>
      <radialGradient id={`${prefix}-lamp`}><stop stopColor="#ebbd8f" stopOpacity=".40"/><stop offset="1" stopColor="#ebbd8f" stopOpacity="0"/></radialGradient>
      <radialGradient id={`${prefix}-sun`}><stop stopColor="#ffdfb0" stopOpacity=".6"/><stop offset=".18" stopColor="#f7d6ab" stopOpacity=".23"/><stop offset="1" stopColor="#f7d6ab" stopOpacity="0"/></radialGradient>
      <radialGradient id={`${prefix}-droplet`} cx=".35" cy=".2"><stop stopColor="#d5e3ef" stopOpacity=".5"/><stop offset=".6" stopColor="#8298b7" stopOpacity=".07"/><stop offset="1" stopColor="#071222" stopOpacity=".55"/></radialGradient>
      <linearGradient id={`${prefix}-curtain`}><stop stopColor="#081326" stopOpacity=".9"/><stop offset=".7" stopColor="#142137" stopOpacity=".65"/><stop offset="1" stopColor="#2c3a50" stopOpacity=".14"/></linearGradient>
      <linearGradient id={`${prefix}-reflectionFade`} x2="0" y2="1"><stop stopColor="white" stopOpacity=".42"/><stop offset="1" stopColor="white" stopOpacity="0"/></linearGradient>
      <mask id={`${prefix}-reflectMask`}><rect x="0" y="820" width="1920" height="260" fill={`url(#${prefix}-reflectionFade)`}/></mask>
      <radialGradient id={`${prefix}-vignette`} r=".75"><stop offset=".22" stopColor="#061021" stopOpacity="0"/><stop offset="1" stopColor="#061021" stopOpacity={.63-warmth*.26}/></radialGradient>
      <linearGradient id={`${prefix}-textShade`}><stop stopColor="#09182c" stopOpacity=".44"/><stop offset=".6" stopColor="#09182c" stopOpacity=".06"/><stop offset="1" stopColor="#09182c" stopOpacity="0"/></linearGradient>
    </defs>
    <rect width="1920" height="1080" fill={`url(#${prefix}-sky)`}/>
    <g transform={`translate(960 540) scale(${camera}) translate(-960 -540)`}>
      <ellipse cx={1500-progress*14} cy={260} rx={580} ry={410} fill={`url(#${prefix}-sun)`} opacity={warmth}/>
      <g fill={mix('#758399','#f0e1c5',warmth)} opacity={.09+warmth*.045} transform={`translate(${-progress*38} 0)`}>
        <path d="M -130 263 Q 48 213 231 258 T 699 240 Q 847 198 1055 265 Q 665 301 300 294 T -130 263 Z"/>
        <path d="M 983 145 Q 1260 99 1451 155 T 2030 156 Q 1821 191 1484 183 T 983 145 Z"/>
        <path d="M 630 405 Q 801 351 1030 405 T 1720 400 Q 1510 432 1105 439 T 630 405 Z"/>
      </g>
      {Array.from({length:11},(_,i)=><path key={i} d={`M ${i*198-90} 797 V ${575-rand(i+71)*190} h ${75+rand(i+45)*88} V 797 Z`} fill={mix('#58677e','#9fa4a6',warmth)} opacity={.3}/>)}
      <g transform="translate(0 51) scale(1 .938)"><City warmth={warmth} prefix={prefix}/></g>
      <rect y="820" width="1920" height="260" fill={`url(#${prefix}-water)`}/>
      <g mask={`url(#${prefix}-reflectMask)`}><g transform="translate(0 1164) scale(1 -.42)"><City warmth={warmth} prefix={prefix}/></g></g>
      {Array.from({length:30},(_,i)=><path key={i} d={`M ${rand(i+159)*1850} ${833+rand(i+73)*225} h ${10+rand(i+90)*160}`} stroke={mix('#9eb0c8','#e9d4b2',warmth)} strokeWidth={rand(i+4)*1.8+.3} opacity={.055+rand(i+77)*.09}/>)}
      <g opacity={rainbow*.45} fill="none" strokeWidth={7} transform="translate(1280 786)">
        {['#d1a0a4','#d2b295','#d4c69f','#afc5b2','#a4bdcc','#aaa7c6'].map((c,i)=><path key={i} d={`M ${-radius+i*12} 0 A ${radius-i*12} ${radius-i*12} 0 0 1 ${radius-i*12} 0`} stroke={c}/>) }
      </g>
      <Rain frame={frame} amount={wet*(kind==='rain' ? 1.3 : .8)} prefix={prefix}/>
      {!window && <Street prefix={prefix} frame={frame} warmth={warmth} pulse={pulse} silhouette={kind==='silhouette'}/>}
      {window && <>
        <rect x="0" y="0" width="1920" height="1080" fill="#101c30" opacity={kind==='memory' ? .12 : .04}/>
        <Rain frame={frame} amount={wet} prefix={prefix} glass/>
        <g fill="#0c172a" stroke="#526079" strokeWidth={1.2}>
          <rect x="1170" y="-60" width="27" height="1110"/>
          <rect x="-40" y="96" width="2030" height="20"/>
          <path d="M -50 967 H 1970 V 1010 H -50 Z"/>
          <path d="M -50 1010 H 1970 V 1040 H -50 Z" fill="#081224"/>
        </g>
        <path d="M 1199 -30 V 960 M -30 965 H 1950" fill="none" stroke="#8391a6" opacity={.18}/>
        <path d="M -40 -20 H 120 Q 184 244 104 415 Q 72 618 180 1020 H -40 Z" fill={`url(#${prefix}-curtain)`}/>
        <path d="M 1980 -20 H 1820 Q 1757 250 1830 422 Q 1870 650 1740 1020 H 1980 Z" fill={`url(#${prefix}-curtain)`}/>
        <path d="M 55 0 Q 111 280 62 514 Q 66 829 119 998 M 1861 0 Q 1805 291 1854 554 Q 1840 847 1793 1004" fill="none" stroke="#6f7b90" strokeWidth={3} opacity={.13}/>
        <Person x={1490} y={520} scale={.94} warmth={warmth}/>
        <path d="M 1430 974 Q 1510 988 1580 974" fill="none" stroke="#3c4b63" strokeWidth={2}/>
        <g transform="translate(328 878)">
          <path d="M -23 -30 H 20 L 17 23 H -19 Z" fill="#3c4253" stroke="#8f96a2" strokeWidth={1}/>
          <path d="M 20 -22 Q 48 -23 43 2 Q 40 13 19 9" fill="none" stroke="#8f96a2" strokeWidth={3}/>
          <path d={`M -1 -42 Q ${Math.sin(frame*.015)*12} -64 -4 -86`} fill="none" stroke="#c1c7d2" opacity={.17} strokeWidth={2}/>
        </g>
      </>}
      {kind==='memory' && <g transform={`translate(${1240+Math.sin(frame/160)*7} 330) rotate(-7)`} opacity={.12}>
        <rect width="330" height="410" fill="#e0d4c5"/><rect x="21" y="23" width="288" height="295" fill="#2c3d57"/>
        <path d="M 21 230 L 102 172 L 161 201 L 218 130 L 309 211 V 318 H 21 Z" fill="#697786"/>
        <circle cx="238" cy="89" r="23" fill="#bab1a3"/>
      </g>}
      {!window && <Rain frame={frame+110} amount={wet*.32} prefix={prefix}/>}
      <rect width="1920" height="1080" fill={`url(#${prefix}-textShade)`}/>
    </g>
    <rect width="1920" height="1080" fill={`url(#${prefix}-vignette)`}/>
    <g opacity={.09}>
      {Array.from({length:50},(_,i)=><circle key={i} cx={rand(i+351)*1920} cy={(rand(i+99)*1080-frame*.075+1080)%1080} r={.6+rand(i+46)*1.2} fill="#d4deeb"/>) }
    </g>
  </svg>;
};
