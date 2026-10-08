import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {cancelRender,continueRender,delayRender,staticFile} from 'remotion';
import {rand} from '../math';
import {ART} from './direction';

export const Surface: React.FC<{art:number; frame:number; pulse:number}> = ({art,frame,pulse})=>{
  const canvas=useRef<HTMLCanvasElement>(null);
  const [images,setImages]=useState<HTMLImageElement[]|null>(null);
  const [handle]=useState(()=>delayRender('加载精绘水面图层'));
  const released=useRef(false);
  useEffect(()=>{
    let mounted=true;
    Promise.all(ART.map(name=>new Promise<HTMLImageElement>((resolve,reject)=>{
      const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error(`Missing art ${name}`));
      image.src=staticFile(`v2/art/${name}.png`);
    }))).then(loaded=>{if(mounted)setImages(loaded);}).catch(cancelRender);
    return ()=>{mounted=false;};
  },[]);
  useLayoutEffect(()=>{
    if(!images || !canvas.current)return;
    const ctx=canvas.current.getContext('2d')!;
    ctx.clearRect(0,0,1920,1080);
    const im=images[art];
    // Only displace the reflected water. The sky and pavilion retain sharp edges.
    for(let y=656;y<1080;y+=5){
      const depth=(y-656)/424;
      const shift=Math.sin(y*.052+frame*.055)*(.7+depth*2.8)+Math.sin(y*.017-frame*.026)*depth*2;
      ctx.drawImage(im,0,y/1080*im.height,im.width,5/1080*im.height,shift,y,1920,5.35);
    }
    ctx.globalCompositeOperation='screen';
    for(let i=0;i<44;i++){
      const x=rand(i+577)*1920;
      const y=688+rand(i+287)*370;
      const p=(frame+rand(i+183)*170)%170/170;
      const width=8+Math.sin(p*Math.PI)*75;
      ctx.strokeStyle=`rgba(219,205,176,${Math.sin(p*Math.PI)*(.04+pulse*.035)})`;
      ctx.lineWidth=.6;
      ctx.beginPath();ctx.ellipse(x,y,width,width*.09,0,0,Math.PI*2);ctx.stroke();
    }
    ctx.globalCompositeOperation='source-over';
    if(!released.current){released.current=true;continueRender(handle);}
  },[images,art,frame,pulse,handle]);
  return <canvas ref={canvas} width={1920} height={1080} style={{position:'absolute',inset:0}}/>;
};
