import assert from 'node:assert/strict';
import {readFileSync,existsSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import ts from 'typescript';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cache=new Map();
function moduleFromTs(file){
  if(cache.has(file))return cache.get(file);
  const exports={};cache.set(file,exports);
  const localRequire=createRequire(file);
  const require=(name)=>{
    if(name.startsWith('.')){
      const target=path.resolve(path.dirname(file),name);
      if(target.endsWith('.json'))return JSON.parse(readFileSync(target,'utf8'));
      for(const extension of ['.ts','.tsx'])if(existsSync(target+extension))return moduleFromTs(target+extension);
    }
    return localRequire(name);
  };
  const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','module','exports',code)(require,{exports},exports);
  return exports;
}
const {SHOTS,ART}=moduleFromTs(path.join(root,'src/v2/direction.ts'));
const {positions}=moduleFromTs(path.join(root,'src/v2/Lyrics.tsx'));
const timing=JSON.parse(readFileSync(path.join(root,'src/v2/word-timing.json'),'utf8'));
const base=JSON.parse(readFileSync(path.join(root,'src/timeline.json'),'utf8'));
const glyphs=JSON.parse(readFileSync(path.join(root,'src/v2/glyphs.json'),'utf8')).glyphs;
assert.equal(timing.lines.length,19);
assert.equal(timing.durationInFrames,3729);
assert.equal(SHOTS.length,24);
assert.equal(SHOTS[0].startFrame,0);
assert.equal(SHOTS.at(-1).endFrame,3729);
SHOTS.forEach((shot,i)=>{
  assert.equal(shot.id,i);assert.ok(shot.endFrame>shot.startFrame);
  if(i)assert.equal(shot.startFrame,SHOTS[i-1].endFrame);
  assert.ok(existsSync(path.join(root,`public/v2/art/${ART[shot.art]}.png`)));
});
const methods={};
const layouts=[];
for(const line of timing.lines){
  assert.equal(line.text,base.lyrics[line.id].text);
  assert.equal(line.tokens.map(t=>t.text).join(''),line.text.replace(/\s/g,''));
  const tokenTexts=line.text.match(/[A-Za-z]+|[\u4e00-\u9fff]/g);
  assert.deepEqual(line.tokens.map(t=>t.text),tokenTexts);
  line.tokens.forEach((token,i)=>{
    assert.ok(Number.isInteger(token.startFrame));
    assert.ok(token.startFrame>=line.startFrame && token.startFrame<line.endFrame);
    assert.equal(token.endFrame,line.tokens[i+1]?.startFrame??line.endFrame);
    if(i)assert.ok(token.startFrame>line.tokens[i-1].startFrame);
    assert.ok(Math.abs(token.startFrame/30-token.sourceStart)<=1/60+.0001);
    methods[token.method]=(methods[token.method]??0)+1;
    for(const char of token.text)assert.ok(glyphs[char],`Missing outline ${char}`);
  });
  assert.ok(line.endFrame-line.tokens.at(-1).startFrame>=9,'Complete line needs at least .3s hold');
  const quarter=line.startFrame+(line.endFrame-line.startFrame)*.25;
  const seen=line.tokens.filter(t=>t.startFrame<=quarter).length;
  assert.ok(seen>0 && seen<line.tokens.length,'Must reveal progressively');
  const placement=positions(line,SHOTS[line.id+2]);
  assert.equal(placement.length,line.tokens.length);
  let bounds=[1920,1080,0,0];
  for(const p of placement){
    let cursor=0;
    for(const c of p.text){
      const glyph=glyphs[c],scale=p.size/100,angle=p.rotation*Math.PI/180;
      for(const x of [glyph.box.x1,glyph.box.x2])for(const y of [glyph.box.y1,glyph.box.y2]){
        const xx=(x+cursor)*scale,yy=y*scale;
        const px=p.x+xx*Math.cos(angle)-yy*Math.sin(angle),py=p.y+xx*Math.sin(angle)+yy*Math.cos(angle);
        bounds=[Math.min(bounds[0],px),Math.min(bounds[1],py),Math.max(bounds[2],px),Math.max(bounds[3],py)];
      }
      cursor+=glyph.advance+7;
    }
  }
  assert.ok(bounds[0]>=80 && bounds[1]>=80 && bounds[2]<=1840 && bounds[3]<=1000,`Lyric ${line.id+1} outside safe area: ${bounds}`);
  layouts.push({line:line.id+1,bounds:bounds.map(n=>Math.round(n)),size:placement[0].size});
}
const hash=createHash('sha256').update(readFileSync(path.join(root,base.sourceAudio))).digest('hex');
assert.equal(hash,timing.sourceAudioSha256);
assert.equal(hash,createHash('sha256').update(readFileSync(path.join(root,'public/reference.mp3'))).digest('hex'));
assert.equal(timing.audioOffsetFrames,0);
const report={status:'passed',shots:24,lyricLines:19,tokenCount:timing.lines.reduce((n,l)=>n+l.tokens.length,0),methods,
  frameRoundingMaximumSeconds:1/60,layouts,humanListening:false};
writeFileSync(path.join(root,'out/v2/source-validation.json'),JSON.stringify(report,null,2));
writeFileSync(path.join(root,'out/v2/shot-manifest.json'),JSON.stringify(SHOTS,null,2));
console.log(JSON.stringify(report));
