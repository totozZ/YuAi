import generated from './generated-timing.json';
import music from './music-events.json';
import config from './overrides.json';
import type {Timing,MusicEvent,Overrides} from './types';
export const RAW_TIMING=generated as Timing;
export const OVERRIDES=config as Overrides;
export function resolveData(overrides:Overrides=OVERRIDES){
  const lines=RAW_TIMING.lines.map(line=>{
    const delta=overrides.lineOffsetFrames[String(line.id)]??0;
    const tokens=line.tokens.map(token=>({...token,readableFrame:overrides.tokenReadFrames[token.id]??token.readableFrame+delta,
      source:overrides.tokenReadFrames[token.id]!==undefined?'manual':token.source}));
    return {...line,startFrame:line.startFrame+delta,tokens};
  });
  lines.forEach((line,i)=>{
    line.endFrame=lines[i+1]?.startFrame??3117;
    line.tokens.forEach((t,j)=>{t.endFrame=line.tokens[j+1]?.readableFrame??line.endFrame;});
  });
  const events=(music as MusicEvent[]).map(event=>{
    const token=lines.flatMap(l=>l.tokens).find(t=>t.id===event.target);
    return {...event,frame:overrides.eventFrames[event.id]??(event.type==='vocal-accent'&&token?token.readableFrame:event.frame)};
  });
  return {timing:{...RAW_TIMING,lines},events,visualOffsetFrames:overrides.visualOffsetFrames};
}
