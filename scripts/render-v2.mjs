import {bundle} from '@remotion/bundler';
import {openBrowser,renderMedia,renderStill,selectComposition} from '@remotion/renderer';
import {mkdirSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'out/v2');
mkdirSync(out,{recursive:true});
const mode=process.argv[2]??'keyframes';
if(!['keyframes','audit','preview','film','frame'].includes(mode))throw new Error('Use keyframes, audit, preview, film or frame NUMBER.');
const timing=JSON.parse(readFileSync(path.join(root,'src/v2/word-timing.json'),'utf8'));
const visual=JSON.parse(readFileSync(path.join(root,'src/v2/visual-settings.json'),'utf8'));
const inputProps={timing,reviewAudio:mode==='preview',visualOffsetFrames:visual.visualOffsetFrames};
const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts'),publicDir:path.join(root,'public'),outDir:path.join(root,`.cache/bundle-v2-${mode}`)});
const browser=await openBrowser('chrome',{logLevel:'error'});
try{
  const composition=await selectComposition({serveUrl,id:mode==='preview'?'RainLoveV2Review':'RainLoveV2',inputProps,puppeteerInstance:browser});
  if(['keyframes','audit','frame'].includes(mode)){
    const frames=mode==='keyframes'?[['01-glass-room',210],['02-liquid-light',1640],['03-spectrum',3000]]:
      mode==='frame'?[[`frame-${process.argv[3]}`,Number(process.argv[3])]]:
      timing.lines.filter(line=>!process.argv[3]||line.id+1===Number(process.argv[3])).flatMap(line=>{
        const first=line.tokens[0].startFrame+11;
        const middle=line.tokens[Math.floor(line.tokens.length/2)].startFrame+7;
        const last=Math.min(line.endFrame-1,line.tokens.at(-1).startFrame+15);
        return [['start',first],['middle',middle],['complete',last]].map(([phase,frame])=>[`lyric-${String(line.id+1).padStart(2,'0')}-${phase}`,frame]);
      }).concat([['last-frame',3728],['intro-wide',400],['solo-1',3220],['solo-2',3420],['solo-3',3590]]);
    const folder=path.join(out,mode==='audit'?'audit-frames':'keyframes');mkdirSync(folder,{recursive:true});
    for(const [name,frame] of frames){
      await renderStill({serveUrl,composition,inputProps,frame,imageFormat:'png',output:path.join(folder,`${name}.png`),puppeteerInstance:browser});
      console.log(`Saved ${name} @ ${frame}`);
    }
  }else{
    const destination=path.join(out,mode==='preview'?'雨爱-V2-25秒样段-含音乐.mp4':'雨爱-V2-精绘逐字-1080p-无声.mp4');
    let last=-5;
    await renderMedia({serveUrl,composition,inputProps,puppeteerInstance:browser,outputLocation:destination,
      codec:'h264',pixelFormat:'yuv420p',colorSpace:'bt709',imageFormat:'png',crf:18,x264Preset:'medium',concurrency:8,
      muted:mode==='film',enforceAudioTrack:mode==='preview',audioCodec:'aac',audioBitrate:'192k',
      ...(mode==='preview'?{frameRange:[1530,2279]}:{}),
      onProgress:({progress,renderedFrames,encodedFrames})=>{const pct=Math.floor(progress*100);if(pct>=last+5){last=pct;console.log(`${mode}: ${pct}% (rendered ${renderedFrames}, encoded ${encodedFrames})`);}}});
    console.log(`Saved ${destination}`);
  }
}finally{await browser.close({silent:true});}
