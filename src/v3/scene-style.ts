import {PALETTE} from './direction';
import {lerp,progress,smoother} from './motion';
import type {MusicEvent} from './types';

export type SceneEdition='classic'|'color';
export type ScenePalette={background:string;foreground:string;geometry:string;history:string;hero:string;emphasis:string;surface:string;highlight:string;spectrum:string[]};
export type SceneStyle=ScenePalette&{edition:SceneEdition;phase:'night'|'blue'|'memory'|'warm'|'solo';intensity:number;isLight:boolean;
  anchors:{chorus:number;repeat:number;hope:number;warmEnd:number;solo:number};
  unfold:number;memory:number;hope:number;solo:number;ambientGradient:string};

// Music IDs, colors and density are independent of lyric timing and choreography.
export const SCENE_CONFIG={
  anchors:{chorus:{eventId:'cut-8',fallback:1528,offset:0},repeat:{eventId:'cut-13',fallback:2253,offset:0},
    hope:{eventId:'section-hope',fallback:2795,offset:0},warmEnd:{eventId:'section-hope',fallback:2795,offset:100},solo:{eventId:'section-solo',fallback:3117,offset:0}},
  unfoldFrames:48,memoryFrames:72,soloFrames:93,
  intensity:{night:.15,blue:.56,memory:.64,warm:.38,solo:.24},
  palettes:{
    blue:{background:'#9db5c6',foreground:'#102a3a',geometry:'#44677e',history:'#45647a',hero:'#33556d',emphasis:'#244c64',surface:'#7394ae',highlight:'#dae8ed',spectrum:['#718cae','#9982ab','#b67c90','#b89056','#719687']},
    memory:{background:'#d1c9e4',foreground:'#2d2542',geometry:'#807494',history:'#6b607d',hero:'#695c82',emphasis:'#514066',surface:'#afa2cf',highlight:'#eee8f7',spectrum:['#718cae','#9982ab','#b67c90','#b89056','#719687']},
    warm:{background:'#f1e8d8',foreground:'#46362b',geometry:'#a98c63',history:'#9a836a',hero:'#9a784e',emphasis:'#77522e',surface:'#ddc8aa',highlight:'#fffaed',spectrum:['#718cae','#9982ab','#b67c90','#b89056','#719687']},
    solo:{background:'#f5f0e7',foreground:'#40362f',geometry:'#aa9375',history:'#a79680',hero:'#aa936f',emphasis:'#6e4f2d',surface:'#dccdbc',highlight:'#fffcf3',spectrum:['#718cae','#9982ab','#b67c90','#b89056','#719687']},
  } satisfies Record<string,ScenePalette>,
};
export const rgb=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
export const colorMix=(a:string,b:string,t:number)=>`#${rgb(a).map((v,i)=>Math.round(lerp(v,rgb(b)[i],t)).toString(16).padStart(2,'0')).join('')}`;
function mixPalette(a:ScenePalette,b:ScenePalette,t:number):ScenePalette{
  const result={...a};
  for(const key of ['background','foreground','geometry','history','hero','emphasis','surface','highlight'] as const)result[key]=colorMix(a[key],b[key],t);
  result.spectrum=a.spectrum.map((c,i)=>colorMix(c,b.spectrum[i],t));return result;
}
export function sceneStyleAt(frame:number,events:MusicEvent[],edition:SceneEdition='color'):SceneStyle{
  const anchors=Object.fromEntries(Object.entries(SCENE_CONFIG.anchors).map(([key,a])=>[key,(events.find(e=>e.id===a.eventId)?.frame??a.fallback)+a.offset])) as SceneStyle['anchors'];
  const classicWarm=smoother(progress(frame,2795,3210));
  const classicGradient=`radial-gradient(ellipse at 64% 44%,rgba(${lerp(19,44,classicWarm)},${lerp(35,30,classicWarm)},${lerp(47,24,classicWarm)},.7),transparent 72%)`;
  const common={edition,anchors,unfold:smoother(progress(frame,anchors.chorus,anchors.chorus+SCENE_CONFIG.unfoldFrames)),
    memory:smoother(progress(frame,anchors.repeat,anchors.repeat+SCENE_CONFIG.memoryFrames)),
    hope:smoother(progress(frame,anchors.hope,anchors.warmEnd)),solo:smoother(progress(frame,anchors.solo,anchors.solo+SCENE_CONFIG.soloFrames))};
  if(edition==='classic'||frame<anchors.chorus)return {...common,phase:'night',intensity:.15,isLight:false,
    background:PALETTE.ink,foreground:PALETTE.paper,geometry:classicWarm>.5?PALETTE.gold:PALETTE.blue,history:PALETTE.blue,hero:PALETTE.blue,
    emphasis:PALETTE.gold,surface:PALETTE.muted,highlight:PALETTE.blue,spectrum:PALETTE.spectrum,ambientGradient:classicGradient};
  let phase:SceneStyle['phase']=frame<anchors.repeat?'blue':frame<anchors.hope?'memory':frame<anchors.solo?'warm':'solo';
  let palette=phase==='blue'?SCENE_CONFIG.palettes.blue:phase==='memory'?SCENE_CONFIG.palettes.memory:
    phase==='warm'?mixPalette(SCENE_CONFIG.palettes.memory,SCENE_CONFIG.palettes.warm,common.hope):mixPalette(SCENE_CONFIG.palettes.warm,SCENE_CONFIG.palettes.solo,common.solo);
  const ambientGradient=`radial-gradient(ellipse at 72% 20%,${palette.highlight}88,transparent 68%),linear-gradient(160deg,${palette.highlight}22,transparent 55%,${palette.surface}28)`;
  return {...common,...palette,phase,intensity:SCENE_CONFIG.intensity[phase],isLight:true,ambientGradient};
}
