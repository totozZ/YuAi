import {bundle} from '@remotion/bundler';
import {openBrowser,renderMedia,renderStill,selectComposition} from '@remotion/renderer';
import {mkdirSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'out');
mkdirSync(out,{recursive:true});
const mode=process.argv[2] ?? 'stills';
if(!['stills','preview','film'].includes(mode)) throw new Error('Use stills, preview, or film.');
const timeline=JSON.parse(readFileSync(path.join(root,'src/timeline.json'),'utf8'));
console.log(`Preparing ${mode}: ${timeline.durationInFrames} frames at ${timeline.fps} fps.`);
const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts'),publicDir:path.join(root,'public'),outDir:path.join(root,`.cache/bundle-${mode}`)});
const browser=await openBrowser('chrome', {logLevel:'error'});
try {
  const inputProps={timeline,reviewAudio:mode==='preview'};
  const composition=await selectComposition({serveUrl,id:mode==='preview' ? 'RainLoveReview' : 'RainLove',inputProps,puppeteerInstance:browser});
  if(mode==='stills'){
    const frames=[['01-title',210],['02-window',580],['03-street',860],['04-silhouette',1380],
      ['05-chorus',1685],['06-transparent',1975],['07-memory',2410],['08-rainbow',2970],['09-solo',3420],['10-last-frame',timeline.durationInFrames-1],
      ...timeline.lyrics.map(cue=>[`lyric-${String(cue.id+1).padStart(2,'0')}`,cue.startFrame+Math.min(60,Math.floor((cue.endFrame-cue.startFrame)*.45))])];
    const folder=path.join(out,'stills');mkdirSync(folder,{recursive:true});
    for(const [name,frame] of frames){
      await renderStill({serveUrl,composition,inputProps,frame,imageFormat:'png',output:path.join(folder,`${name}.png`),puppeteerInstance:browser});
      console.log(`Saved ${name} @ ${frame}`);
    }
  } else {
    const destination=path.join(out,mode==='preview' ? '雨爱-副歌预览-含参考音频.mp4' : '雨爱-歌词雨景-1080p-无声.mp4');
    let last=-1;
    await renderMedia({serveUrl,composition,inputProps,puppeteerInstance:browser,outputLocation:destination,
      codec:'h264',pixelFormat:'yuv420p',colorSpace:'bt709',imageFormat:'png',crf:18,x264Preset:'medium',concurrency:10,
      muted:mode==='film',enforceAudioTrack:mode==='preview',audioCodec:'aac',audioBitrate:'192k',
      ...(mode==='preview' ? {frameRange:[1500,1889]} : {}),
      onProgress:({progress,renderedFrames,encodedFrames})=>{
        const pct=Math.floor(progress*100);
        if(pct>=last+5){last=pct;console.log(`${mode}: ${pct}% (rendered ${renderedFrames}, encoded ${encodedFrames})`);}
      }});
    console.log(`Saved ${destination}`);
  }
} finally {await browser.close({silent:true});}
