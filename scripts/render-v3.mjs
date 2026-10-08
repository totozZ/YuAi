import {bundle} from '@remotion/bundler';
import {openBrowser,renderMedia,renderStill,selectComposition} from '@remotion/renderer';
import {mkdirSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'out/v3');mkdirSync(out,{recursive:true});
const mode=process.argv[2]??'stills';
if(!['stills','audit','verse','chorus','film','frame','bridge'].includes(mode))throw new Error('Modes: stills, audit, verse, chorus, film, frame NUMBER, bridge.');
const preview=mode==='verse'||mode==='chorus';
const overrides=JSON.parse(readFileSync(path.join(root,'src/v3/overrides.json'),'utf8'));
const inputProps={reviewAudio:preview,overrides};
const timing=JSON.parse(readFileSync(path.join(root,'src/v3/generated-timing.json'),'utf8'));
const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts'),publicDir:path.join(root,'public'),outDir:path.join(root,`.cache/bundle-v3-${mode}`),enableCaching:false});
const browser=await openBrowser('chrome',{logLevel:'error'});
try{
  const composition=await selectComposition({serveUrl,id:preview?'RainLoveV3Review':'RainLoveV3',inputProps,puppeteerInstance:browser});
  if(['stills','audit','frame','bridge'].includes(mode)){
    const frames=mode==='frame'?[[`frame-${process.argv[3]}`,Number(process.argv[3])]]:
      mode==='bridge'?timing.lines.slice(1).flatMap(line=>[-12,-1,8,20].map(delta=>[`bridge-${String(line.id).padStart(2,'0')}-${delta<0?'before'+Math.abs(delta):'after'+delta}`,line.startFrame+delta])):
      mode==='stills'?[['00-title',210],...timing.lines.map(line=>[`line-${String(line.id+1).padStart(2,'0')}`,Math.min(line.endFrame-20,line.tokens.at(-1).readableFrame+17)]),['solo-flow',3210],['solo-expand',3430],['solo-resolve',3600],['last-frame',3728]]:
      timing.lines.flatMap(line=>{
        const frames=[['first',line.tokens[0].readableFrame],['middle',line.tokens[Math.floor(line.tokens.length/2)].readableFrame],['complete',line.tokens.at(-1).readableFrame+3]];
        return frames.map(([phase,frame])=>[`line-${String(line.id+1).padStart(2,'0')}-${phase}`,frame]);
      });
    const folder=path.join(out,mode==='stills'?'stills':mode==='frame'?'frames':mode==='bridge'?'bridges':'audit');mkdirSync(folder,{recursive:true});
    for(const [name,frame]of frames){await renderStill({serveUrl,composition,inputProps,frame,imageFormat:'png',output:path.join(folder,`${name}.png`),puppeteerInstance:browser});console.log(`${name} @ ${frame}`);}
  }else{
    const names={verse:'雨爱-V3-主歌样段-含音乐.mp4',chorus:'雨爱-V3-副歌样段-含音乐.mp4',film:'雨爱-V3-连续文字空间-1080p-无声.mp4'};
    let last=-5;
    await renderMedia({serveUrl,composition,inputProps,puppeteerInstance:browser,outputLocation:path.join(out,names[mode]),
      codec:'h264',pixelFormat:'yuv420p',colorSpace:'bt709',imageFormat:'png',crf:18,x264Preset:'medium',concurrency:8,
      muted:mode==='film',enforceAudioTrack:preview,audioCodec:'aac',audioBitrate:'192k',
      ...(mode==='verse'?{frameRange:[420,1259]}:mode==='chorus'?{frameRange:[1500,2279]}:{}),
      onProgress:({progress,renderedFrames,encodedFrames})=>{const pct=Math.floor(progress*100);if(pct>=last+5){last=pct;console.log(`${mode}: ${pct}% (rendered ${renderedFrames}, encoded ${encodedFrames})`);}}});
    console.log(`Saved ${names[mode]}`);
  }
}finally{await browser.close({silent:true});}
