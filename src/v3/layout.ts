import font from './glyphs.json';
import {DIRECTIONS} from './direction';
import type {CueLine,Placement,Weight} from './types';
export type Glyph={path:string;advance:number;box:{x1:number;y1:number;x2:number;y2:number};points:number[][]};
export const FONTS=font.weights as Record<Weight,Record<string,Glyph>>;
const KERN=font.kern as Record<string,number>;
export function characterAdvance(text:string,index:number,weight:Weight,tracking:number){
  const char=text[index],next=text[index+1];
  return (FONTS[weight][char]?.advance??50)+(next?tracking+(KERN[`${weight}:${char}${next}`]??0):0);
}
export function wordWidth(text:string,weight:Weight='light',tracking=2){
  const chars=Array.from(text);
  return chars.reduce((sum,_,i)=>sum+characterAdvance(text,i,weight,tracking),0);
}
export function placements(line:CueLine):Placement[]{
  const result:Placement[]=[];
  const add=(start:number,count:number,x:number,y:number,size:number,weight:Weight='light',rotation=0,tracking=3)=>{
    let cursor=0;
    for(let j=0;j<count;j++){
      const index=start+j,token=line.tokens[index];
      result.push({index,x:x+cursor,y,size,weight,rotation,tracking});
      cursor+=(wordWidth(token.text,weight,tracking)+5)*size/100;
    }
  };
  switch(DIRECTIONS[line.id].layout){
    case 'window':add(0,5,-420,0,116);break;
    case 'expression':add(0,3,-610,-120,94);add(3,6,-280,135,112);break;
    case 'rainfall':add(0,3,-540,-140,108);add(3,1,-285,135,235,'regular');add(4,4,20,145,104);break;
    case 'focus':add(0,3,-580,-120,114);add(3,6,-155,145,104);result.forEach(p=>{if(p.index===5||p.index===6)p.weight='regular';});break;
    case 'distance':add(0,3,-640,0,104);add(3,6,-65,75,94);break;
    case 'shutter':add(0,5,-550,-100,95);add(5,2,125,155,205,'regular');break;
    case 'heart':add(0,2,-330,-145,88);add(2,1,-50,60,235,'regular');add(3,4,-345,230,108);break;
    case 'release':add(0,2,-465,-85,110);add(2,2,-160,145,225,'regular');break;
    case 'droplet-columns':add(0,5,-645,-145,116);add(5,1,150,20,102);add(6,1,320,120,102);add(7,1,490,220,102);add(8,2,-380,175,190,'bold');break;
    case 'breath':add(0,2,-650,-130,88);add(2,2,-380,-100,170,'regular');add(4,3,110,-115,103);add(7,2,-590,155,112);add(9,4,-260,175,135);break;
    case 'horizontal-contrast':add(0,4,-640,-130,112);add(4,4,-230,165,170);result.forEach(p=>{if(p.index>=6)p.weight='bold';});break;
    case 'transparent':add(0,5,-610,-100,135);add(5,5,-165,180,124);break;
    case 'english':{
      add(0,8,-650,-190,89);
      const size=Math.min(216,1260/(wordWidth('Rainie')+wordWidth('Love')+27)*100);
      add(8,1,-620,150,size);add(9,1,-620+(wordWidth('Rainie')+27)*size/100,150,size);
      break;
    }
    case 'accumulation':add(0,5,-555,-155,110);add(5,1,-480,50,100);add(6,1,-255,135,110);add(7,1,-30,220,120);add(8,2,230,240,200,'bold');break;
    case 'memory':add(0,5,-600,-175,94);add(5,6,-360,45,94);add(11,2,180,240,225,'regular');break;
    case 'vertical-contrast':for(let i=0;i<4;i++)add(i,1,-515,-210+i*115,93);add(4,2,-225,-75,112);add(6,2,40,200,210,'bold');break;
    case 'secret':add(0,5,-455,-125,120);add(5,5,-90,175,124);break;
    case 'belief':add(0,1,-550,-155,90);add(1,2,-325,70,236,'regular');add(3,5,-230,260,104);break;
    case 'rainbow':for(let i=0;i<5;i++){
      const angle=(-125+i*17)*Math.PI/180;
      add(i,1,Math.cos(angle)*530-30,Math.sin(angle)*530+340,150,'light',(-125+i*17)+90);
    }break;
  }
  return result.sort((a,b)=>a.index-b.index);
}
