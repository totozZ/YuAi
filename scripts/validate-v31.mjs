import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {moduleFromTs} from './v3-module.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {sceneStyleAt,SCENE_CONFIG,rgb}=moduleFromTs(path.join(root,'src/v3/scene-style.ts'));
const {resolveData}=moduleFromTs(path.join(root,'src/v3/data.ts'));
const {events,timing}=resolveData();
const anchors=sceneStyleAt(0,events,'color').anchors;
const luminance=c=>rgb(c).map(v=>v/255).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
const samples=[];
for(let frame=0;frame<3729;frame++){
  const style=sceneStyleAt(frame,events,'color');
  const colors=[style.background,style.highlight,style.surface];
  // Test the primary text against the base and the two ambient gradient colors.
  // The surface shade is applied at low opacity, so evaluate its actual mixture.
  const backgrounds=style.isLight?[colors[0],colors[1],`#${rgb(colors[0]).map((v,i)=>Math.round(v*.85+rgb(colors[2])[i]*.15).toString(16).padStart(2,'0')).join('')}`]:[colors[0],'#13232f'];
  for(const background of backgrounds)assert.ok(ratio(style.foreground,background)>=4.5,`Main contrast ${frame}: ${ratio(style.foreground,background)}`);
  if(frame>=anchors.hope)for(const background of backgrounds)assert.ok(ratio(style.emphasis,background)>=4.5,`Warm emphasis contrast ${frame}`);
  if(frame%120===0||[1527,1528,2252,2253,2795,2845,2895,3117,3210,3728].includes(frame))samples.push({frame,phase:style.phase,background:style.background,foreground:style.foreground,contrast:ratio(style.foreground,style.background)});
  if(frame<anchors.chorus){const classic=sceneStyleAt(frame,events,'classic');assert.equal(style.background,classic.background);assert.equal(style.foreground,classic.foreground);}
}
assert.equal(sceneStyleAt(anchors.chorus-1,events).phase,'night');assert.equal(sceneStyleAt(anchors.chorus,events).phase,'blue');
assert.equal(sceneStyleAt(anchors.repeat-1,events).phase,'blue');assert.equal(sceneStyleAt(anchors.repeat,events).phase,'memory');
assert.equal(sceneStyleAt(anchors.warmEnd,events).background,SCENE_CONFIG.palettes.warm.background);
assert.equal(sceneStyleAt(3728,events).background,SCENE_CONFIG.palettes.solo.background);
const changed=events.map(e=>e.id==='cut-8'?{...e,frame:e.frame+5}:e);
assert.equal(sceneStyleAt(anchors.chorus+2,changed).phase,'night');assert.equal(sceneStyleAt(anchors.chorus+5,changed).phase,'blue');
const baseline=JSON.parse(readFileSync(path.join(root,'out/v3.1/baseline-preservation.json'),'utf8'));
const absentOldMovies=[],baselineChanges=[];
for(const [file,hash]of Object.entries(baseline)){
  const target=path.join(root,file);
  if(!existsSync(target)){
    assert.ok(file.startsWith('out\\v3\\')||file.startsWith('out/v3/'),'Required source missing: '+file);
    absentOldMovies.push(file);continue;
  }
  const current=createHash('sha256').update(readFileSync(target)).digest('hex');
  if(current!==hash)baselineChanges.push(file);
  if(process.argv.includes('--preserve-baseline'))assert.equal(current,hash,`Baseline changed: ${file}`);
}
assert.equal(timing.lines.length,19);
const report={status:'passed',edition:'3.1',timelineUnchanged:!baselineChanges.some(p=>/generated-timing|music-events|overrides/.test(p)),
  originalChoreographyUnchanged:!baselineChanges.some(p=>/camera.ts|poses.ts|layout.ts/.test(p)),
  oldOutputsUnchanged:absentOldMovies.length?'old MP4 files not included in source archive':!baselineChanges.some(p=>p.endsWith('.mp4')),
  absentOldMovies,baselineChanges,allFramesMainContrastAtLeast:4.5,eventLinkedAnchors:true,sceneConfig:SCENE_CONFIG,samples};
writeFileSync(path.join(root,'out/v3.1/scene-validation.json'),JSON.stringify(report,null,2));
console.log(`V3.1: 3729 palette frames checked; ${baselineChanges.length} changes to baseline input/MP4 hashes; event-linked scene anchors passed.`);
