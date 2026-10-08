import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {moduleFromTs} from './v3-module.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,process.argv.includes('--color')?'out/v3.1':'out/v3');mkdirSync(out,{recursive:true});
const load=name=>moduleFromTs(path.join(root,`src/v3/${name}.ts`));
const {resolveData,OVERRIDES}=load('data');
const {DIRECTIONS}=load('direction');
const {cameraAt}=load('camera');
const {placements,FONTS,characterAdvance}=load('layout');
const {tokenPose}=load('poses');
const {timing,events}=resolveData();
const base=JSON.parse(readFileSync(path.join(root,'src/timeline.json'),'utf8'));
const hash=createHash('sha256').update(readFileSync(path.join(root,base.sourceAudio))).digest('hex');
assert.equal(hash,timing.sourceAudioSha256);
assert.equal(hash,createHash('sha256').update(readFileSync(path.join(root,'public/reference.mp3'))).digest('hex'));
assert.equal(timing.fps,30);assert.equal(timing.durationInFrames,3729);assert.equal(timing.audioOffsetFrames,0);
assert.equal(timing.lines.length,19);assert.equal(DIRECTIONS.length,19);
const sources={},bounds=[],readChecks=[];
for(const line of timing.lines){
  assert.equal(line.text,base.lyrics[line.id].text);
  assert.equal(line.startFrame,base.lyrics[line.id].startFrame+(OVERRIDES.lineOffsetFrames[String(line.id)]??0));
  assert.deepEqual(line.tokens.map(t=>t.text),line.text.match(/[A-Za-z]+|[\u4e00-\u9fff]/g));
  assert.ok(line.endFrame-line.tokens.at(-1).readableFrame>=15,'Complete reading platform >= .5s');
  const placed=placements(line);assert.equal(placed.length,line.tokens.length);
  for(const [i,token] of line.tokens.entries()){
    assert.ok(Number.isInteger(token.readableFrame));
    assert.ok(token.readableFrame>=line.startFrame&&token.readableFrame<line.endFrame);
    if(i)assert.ok(token.readableFrame>line.tokens[i-1].readableFrame);
    assert.equal(token.endFrame,line.tokens[i+1]?.readableFrame??line.endFrame);
    sources[token.source]=(sources[token.source]??0)+1;
    const pose=tokenPose(line,placed[i],token.readableFrame,timing.lines,events);
    assert.equal(pose.opacity,1);assert.equal(pose.blur,0);
    const pre=tokenPose(line,placed[i],token.readableFrame-1,timing.lines,events);
    assert.ok(pre.opacity<=.5&&pre.blur>0,'Preparatory entrance must not be fully readable');
    readChecks.push({id:token.id,readableFrame:token.readableFrame,opacity:pose.opacity,blur:pose.blur});
  }
  // Check every clear glyph at every sampled reading frame, through the actual
  // camera and local perspective transform. Hero background crops are intentional.
  let all=[Infinity,Infinity,-Infinity,-Infinity];
  const last=line.tokens.at(-1).readableFrame;
  const release=Math.max(last+15,line.endFrame-12);
  // Intentional portal magnification begins only after 18 frames of complete
  // readability in lines 8/13; oversized crops thereafter are part of the design.
  const readUntil=[7,12].includes(line.id)?Math.min(release,last+17):release;
  for(let frame=line.startFrame;frame<=readUntil;frame+=3){
    const camera=cameraAt(frame,timing.lines,events),angle=-camera.rotation*Math.PI/180;
    for(const p of placed){
      const token=line.tokens[p.index];if(frame<token.readableFrame)continue;
      const pose=tokenPose(line,p,frame,timing.lines,events),rotation=pose.rotation*Math.PI/180;
      let cursor=0;
      for(const [j,char] of Array.from(token.text).entries()){
        const glyph=FONTS[p.weight][char];assert.ok(glyph,`Missing glyph ${char}`);
        for(const x of [glyph.box.x1,glyph.box.x2])for(const y of [glyph.box.y1,glyph.box.y2]){
          const k=1600/(1600-pose.depth),yaw=pose.tilt*Math.PI/180;
          const gx=(x+cursor)*Math.cos(yaw)*pose.scale*k;
          const gy=(y+(x+cursor)*Math.sin(yaw)*.12)*pose.scale*k;
          const worldX=pose.x+gx*Math.cos(rotation)-gy*Math.sin(rotation)-camera.x;
          const worldY=pose.y+gx*Math.sin(rotation)+gy*Math.cos(rotation)-camera.y;
          const sx=960+(worldX*Math.cos(angle)-worldY*Math.sin(angle))*camera.zoom;
          const sy=540+(worldX*Math.sin(angle)+worldY*Math.cos(angle))*camera.zoom;
          all=[Math.min(all[0],sx),Math.min(all[1],sy),Math.max(all[2],sx),Math.max(all[3],sy)];
        }
        cursor+=characterAdvance(token.text,j,p.weight,p.tracking);
      }
    }
  }
  assert.ok(all[0]>=65&&all[1]>=65&&all[2]<=1855&&all[3]<=1015,`Line ${line.id+1} unsafe bounds: ${all}`);
  bounds.push({line:line.id+1,bounds:all.map(Math.round),completeFrame:last,holdFrames:release-last,readBoundsCheckedUntil:readUntil,intentionalPortalAfterRead:[7,12].includes(line.id)});
}
assert.equal(Object.values(sources).reduce((a,b)=>a+b,0),163);
assert.deepEqual(timing.lines[12].tokens.slice(-2).map(t=>t.text),['Rainie','Love']);
for(let i=2;i<DIRECTIONS.length;i++){
  const signature=d=>[d.entry,d.layout,d.handoff].join('/');
  assert.ok(!(signature(DIRECTIONS[i])===signature(DIRECTIONS[i-1])&&signature(DIRECTIONS[i])===signature(DIRECTIONS[i-2])));
}
const derivatives=[];
for(const line of timing.lines){
  const key=line.startFrame-10,eps=.001;
  const a=cameraAt(key-eps,timing.lines,events),b=cameraAt(key,timing.lines,events),c=cameraAt(key+eps,timing.lines,events);
  const deltas={};
  for(const field of ['x','y','zoom','rotation']){
    const delta=Math.abs((b[field]-a[field])/eps-(c[field]-b[field])/eps);
    assert.ok(delta<.001,`Camera velocity discontinuity ${key} ${field}: ${delta}`);deltas[field]=delta;
  }
  derivatives.push({frame:key,velocityError:deltas});
}
const modified=structuredClone(OVERRIDES);modified.tokenReadFrames['l00-t01']=timing.lines[0].tokens[1].readableFrame+2;
modified.eventFrames['cut-8']=events.find(e=>e.id==='cut-8').frame+1;
const recalculated=resolveData(modified);
assert.equal(recalculated.timing.lines[0].tokens[1].readableFrame,timing.lines[0].tokens[1].readableFrame+2);
assert.equal(recalculated.timing.lines[0].tokens[0].endFrame,recalculated.timing.lines[0].tokens[1].readableFrame);
assert.equal(recalculated.events.find(e=>e.id==='cut-8').frame,events.find(e=>e.id==='cut-8').frame+1);
const token=timing.lines[9].tokens[2],edited=structuredClone(OVERRIDES);edited.tokenReadFrames[token.id]=token.readableFrame+2;
assert.equal(resolveData(edited).events.find(e=>e.id==='accent-9').frame,token.readableFrame+2);
assert.equal(events.filter(e=>e.type==='match-cut').length,2);
assert.ok(events.filter(e=>e.type==='instrumental').length>=3);
assert.deepEqual(cameraAt(1730,timing.lines,events),cameraAt(1730,timing.lines,events));
const report={status:'passed',lyricLines:19,units:163,sources,audioSha256:hash,
  clearAtReadableFrame:true,readingBounds:bounds,cameraContinuity:derivatives,manualOverrides:'passed',
  matchCuts:events.filter(e=>e.type==='match-cut'),musicEvents:events.length,humanListening:false,
  note:'Frame scheduling is deterministic. CTC and interpolated times remain estimates of sung timing.'};
writeFileSync(path.join(out,'source-validation.json'),JSON.stringify(report,null,2));
writeFileSync(path.join(out,'readable-frame-audit.json'),JSON.stringify(readChecks,null,2));
writeFileSync(path.join(out,'choreography.json'),JSON.stringify(DIRECTIONS,null,2));
console.log(JSON.stringify(report));
