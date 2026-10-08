import {DIRECTIONS} from './direction';
import {originAt,cameraAt} from './camera';
import {clamp,progress,smooth,smoother,expo,lerp,damp} from './motion';
import type {CueLine,Placement,MusicEvent,Pose} from './types';
export function tokenPose(line:CueLine,p:Placement,frame:number,lines:CueLine[],events:MusicEvent[]):Pose{
  const token=line.tokens[p.index],age=frame-token.readableFrame,d=DIRECTIONS[line.id];
  const release=Math.max(line.tokens.at(-1)!.readableFrame+15,line.endFrame-12);
  const out=progress(frame,release,release+42);
  const origin=originAt(line,frame,lines,events);
  const prep=progress(frame,token.readableFrame-d.lead,token.readableFrame);
  const remaining=d.entry==='rain'||d.entry==='cascade'?1-prep*prep:
    d.entry==='flow'||d.entry==='arc'?1-smoother(prep):Math.pow(1-prep,3);
  let x=p.x,y=p.y,rotation=p.rotation,scale=1,depth=0,tilt=0;
  if(age<0){
    switch(d.entry){
      case 'rain':case 'cascade':y-=remaining*(140+p.index*15);break;
      case 'cross':x+=(p.index%2?1:-1)*remaining*180;y+=remaining*(p.index%2?40:-40);break;
      case 'split':x+=(p.index<3?-1:1)*remaining*180;break;
      case 'arc':x-=Math.cos(p.index*.5)*remaining*140;y+=Math.sin(p.index*.5)*remaining*150;rotation+=remaining*20;break;
      case 'fold':tilt=remaining*72;scale=1-remaining*.2;break;
      case 'depth':depth=-remaining*600;scale=1-remaining*.4;x-=remaining*80;break;
      case 'impulse':x-=remaining*220;scale=1+remaining*.25;break;
      case 'stack':y+=remaining*140;x-=remaining*70;break;
      case 'flow':x-=remaining*170;y+=remaining*80;break;
      case 'unseal':x+=(p.index<5?-1:1)*remaining*90;break;
      case 'release':x+=(p.index-1.5)*remaining*85;break;
      case 'shutter':y+=remaining*100;break;
      case 'focus':scale=1+remaining*.04;break;
      default:x-=remaining*50;break;
    }
  }
  const accent=events.find(e=>e.type==='vocal-accent'&&e.target===token.id);
  if(accent){const a=frame-accent.frame;scale+=damp(a)*(.045+d.intensity*.05);}
  if(age>6&&d.intensity>.5&&keyIndices(line).includes(p.index)){
    const pulse=events.filter(e=>e.type==='beat'&&e.target===`bridge-${line.id}`&&frame>=e.frame&&frame<e.frame+16)
      .reduce((v,e)=>v+e.strength*(1-smoother((frame-e.frame)/16)),0);
    scale+=pulse*.045;depth+=pulse*28;
  }
  if(d.layout==='breath' && p.index>=2&&p.index<=3 && age>=0&&age<26){const breath=Math.sin(age/26*Math.PI);x+=(p.index===2?-1:1)*breath*8;scale+=breath*.018;}
  if(d.layout==='distance'&&p.index>=3&&age>12){x+=smoother(progress(age,12,65))*55;}
  if(d.layout==='release'&&age>=0){x+=(p.index-1.5)*smoother(progress(age,0,55))*35;}
  // Individual words become the archive/structure, with different paths per handoff.
  if(out>0){
    const u=smoother(out);
    const destinationX=(p.index%5)*100-220,destinationY=Math.floor(p.index/5)*100+330;
    if(d.handoff==='rain'||d.handoff==='archive'){
      x=lerp(x,destinationX,u);y=lerp(y,destinationY,u);rotation+=u*(d.handoff==='archive'?0:8);scale=lerp(scale,.35,u);
    }else if(d.handoff==='depart'||d.handoff==='gap'){
      x+=u*(p.index<3?-250:310);y+=u*(p.index%2?70:-40);scale=lerp(scale,.4,u);
    }else if(d.handoff==='ring'||d.handoff==='container'||d.handoff==='inside'){
      const angle=p.index/line.tokens.length*Math.PI*2;
      x=lerp(x,Math.cos(angle)*285,u);y=lerp(y,Math.sin(angle)*175+110,u);rotation+=u*angle*18;scale=lerp(scale,.30,u);
    }else if(d.handoff==='fold'){
      x=lerp(x,destinationX,u);y=lerp(y,destinationY-130,u);tilt=u*58;scale=lerp(scale,.33,u);
    }else if(d.handoff==='spectrum'){
      x+=u*(p.index-2)*140;y+=u*80;scale=lerp(scale,.5,u);
    }else{
      x+=u*(p.index-2)*65;y=lerp(y,300+Math.floor(p.index/4)*80,u);scale=lerp(scale,.38,u);
    }
  }
  const alpha=age<0?Math.pow(prep,1.4)*.5:lerp(1,.12,smoother(out));
  // The repeat begins three frames before its drum cut. Its first characters
  // keep their normal reading size inside the outgoing Love portal.
  const repeatCut=events.find(e=>e.id==='cut-13');
  if(line.id===13&&repeatCut&&frame<repeatCut.frame&&frame>=line.startFrame-DIRECTIONS[13].lead){
    const zoom=cameraAt(frame,lines,events).zoom;x/=zoom;y/=zoom;scale/=zoom;
  }
  return {x:origin.x+x,y:origin.y+y,scale:scale*p.size/100,rotation,opacity:alpha,
    blur:age<0?Math.min(16,6+remaining*7+(1-prep)*3):0,depth,tilt,anchorX:0,anchorY:0,tracking:p.tracking};
}
export function keyIndices(line:CueLine){
  const key=DIRECTIONS[line.id].key;const text=line.tokens.map(t=>t.text).join('');const start=text.indexOf(key);
  return line.tokens.map((_,i)=>i).filter(i=>i>=start&&i<start+key.length);
}
