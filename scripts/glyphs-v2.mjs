import opentype from 'opentype.js';
import {readFileSync,writeFileSync} from 'node:fs';

const font=opentype.loadSync('public/v2/fonts/SourceHanSerifSC-Light.otf');
const source=JSON.parse(readFileSync('src/timeline.json','utf8'));
const alphabet=new Set(Array.from(source.lyrics.map(l=>l.text).join('')+'雨爱RAINIELOVE'));
const glyphs={};
for(const char of alphabet){
  const g=font.charToGlyph(char);
  const path=g.getPath(0,0,100);
  const box=path.getBoundingBox();
  glyphs[char]={path:path.toPathData(3),advance:g.advanceWidth/font.unitsPerEm*100,
    points:path.commands.filter(c=>Number.isFinite(c.x)).map(c=>[c.x,c.y]).filter((_,i)=>i%3===0),
    box:{x1:box.x1,y1:box.y1,x2:box.x2,y2:box.y2}};
}
writeFileSync('src/v2/glyphs.json',JSON.stringify({font:'SourceHanSerifSC-Light',units:100,glyphs}));
console.log(`Generated ${alphabet.size} outline glyphs with real advance widths.`);
