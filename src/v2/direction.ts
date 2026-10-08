import base from '../timeline.json';
import type {Shot,Transition} from './types';

export const ART=['01-pavilion','02-skyglass','03-distance','04-ribbons','05-memory','06-spectrum'];
const patterns: Transition[]=['frame','iris','ripple','prism','shards','ribbon'];
const cameras: [number,number,number,number][][]=[
  [[-65,15,1.22,-.7],[-15,-8,1.07,0]],
  [[100,-62,1.48,0],[54,-32,1.33,.6]],
  [[-95,45,1.34,-.35],[-40,-26,1.49,.3]],
  [[30,20,1.15,.4],[-18,-12,1.06,0]],
  [[-80,-65,1.42,0],[45,12,1.20,-.5]],
];
const shots: Shot[]=[
  {id:0,art:0,startFrame:0,endFrame:234,cameraFrom:[-86,12,1.31,-1],cameraTo:[-40,0,1.19,-.3],transition:'iris',layout:'left',texture:'glass'},
  {id:1,art:0,startFrame:234,endFrame:base.lyrics[0].startFrame,cameraFrom:[-20,-4,1.15,0],cameraTo:[22,5,1.06,.3],transition:'frame',layout:'left',texture:'dew'},
];
base.lyrics.forEach((cue,i)=>{
  const art=i<4 ? 1 : i<8 ? 2 : i<13 ? 3 : i<17 ? 4 : 5;
  const camera=cameras[i%cameras.length];
  const layout=art===1 || art===4 ? 'right' : art===2 ? 'center' : i===18 ? 'arc' : 'left';
  shots.push({id:i+2,art,startFrame:cue.startFrame,endFrame:cue.endFrame,
    cameraFrom:camera[0] as Shot['cameraFrom'],cameraTo:camera[1] as Shot['cameraTo'],
    transition:({0:'frame',4:'shards',8:'ripple',13:'shards',17:'prism',18:'ribbon'} as Record<number,Transition>)[i]??patterns[i%patterns.length],layout,texture:art===3 ? 'ribbon' : i%2 ? 'glass' : 'dew'});
});
shots.push(
  {id:21,art:5,startFrame:base.lyricClearFrame,endFrame:3327,cameraFrom:[-88,24,1.32,.8],cameraTo:[-20,-10,1.17,0],transition:'ribbon',layout:'left',texture:'ribbon'},
  {id:22,art:5,startFrame:3327,endFrame:3525,cameraFrom:[50,16,1.21,-.7],cameraTo:[-5,-4,1.11,.4],transition:'prism',layout:'left',texture:'glass'},
  {id:23,art:5,startFrame:3525,endFrame:3729,cameraFrom:[0,0,1.09,0],cameraTo:[0,0,1.015,0],transition:'iris',layout:'left',texture:'dew'},
);
export const SHOTS=shots;
