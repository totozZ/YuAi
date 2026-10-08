import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data=JSON.parse(readFileSync(path.join(root,'src/timeline.json'),'utf8'));
const plain=readFileSync(path.join(root,'geci/geci.txt'),'utf8').split(/\r?\n/).filter(l=>l.trim());
const normalize=s=>s.replace(/\s/g,'');
assert.equal(data.fps,30);
assert.equal(data.width,1920);
assert.equal(data.height,1080);
assert.equal(data.lyrics.length,19);
assert.equal(data.durationInFrames,Math.floor(data.nextVocalSeconds*data.fps));
assert.equal(data.lyrics.at(-1).endFrame,data.lyricClearFrame);
assert.equal(data.scenes[0].startFrame,0);
assert.equal(data.scenes.at(-1).endFrame,data.durationInFrames);
assert.ok(Number.isInteger(data.visualOffsetFrames));
assert.ok(data.scenes.at(-1).startFrame<data.durationInFrames-48, 'Solo must contain the final fade.');
assert.equal(createHash('sha256').update(readFileSync(path.join(root,data.sourceAudio))).digest('hex'),data.audioSha256);
assert.equal(createHash('sha256').update(readFileSync(path.join(root,'public',data.audioFile))).digest('hex'),data.audioSha256);
assert.ok(existsSync(path.join(root,'public/fonts/scene-font.ttc')));
for(let i=0;i<data.lyrics.length;i++){
  const cue=data.lyrics[i];
  assert.equal(normalize(cue.text),normalize(plain[i]),`Line ${i+1} differs from source.`);
  assert.equal(normalize(cue.phrases.join('')),normalize(cue.text),`Line ${i+1} loses characters during phrase splitting.`);
  assert.equal(cue.startFrame,Math.floor(cue.sourceSeconds*data.fps+.5));
  assert.ok(Math.abs(cue.startFrame/data.fps-cue.sourceSeconds)<=.5/data.fps+.000001);
  assert.ok(cue.endFrame>cue.startFrame+35);
  if(i) assert.equal(data.lyrics[i-1].endFrame,cue.startFrame);
  if(cue.effect!=='arc'){
    cue.phrases.forEach((line,j)=>{
      const fontSize=/[a-zA-Z]/.test(line) ? 106 : cue.fontSize+(j===1 ? 12 : 0);
      const width=Array.from(line).reduce((sum,c)=>sum+(/[\u4e00-\u9fff]/.test(c) ? fontSize*1.13 : c===' ' ? fontSize*.38 : fontSize*.61),0);
      assert.ok(cue.anchor[0]+(j ? 86 : 0)+width<1800,`Line ${i+1} exceeds safe width.`);
      assert.ok(cue.anchor[1]+j*137<820,`Line ${i+1} exceeds safe height.`);
    });
  }
}
for(let i=1;i<data.scenes.length;i++) assert.equal(data.scenes[i-1].endFrame,data.scenes[i].startFrame);
for(let i=0;i<data.beats.length;i++){
  const beat=data.beats[i];
  assert.ok(Number.isInteger(beat.frame) && beat.frame>=0 && beat.frame<data.durationInFrames);
  assert.ok(beat.strength>=0 && beat.strength<=1);
  if(i) assert.ok(beat.frame>data.beats[i-1].frame);
}
console.log(`Validated: 19 exact lyric lines, source hash, frame rounding, scene coverage, typography bounds, ${data.beats.length} onset candidates.`);
