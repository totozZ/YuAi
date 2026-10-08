import opentype from 'opentype.js';
import {readFileSync,writeFileSync} from 'node:fs';
const base=JSON.parse(readFileSync('src/timeline.json','utf8'));
const alphabet=new Set(Array.from(base.lyrics.map(l=>l.text).join('')+'雨爱RAINIE LOVE'));
const files={light:['SourceHanSansSC-Light','Inter-Light'],regular:['SourceHanSansSC-Regular','Inter-Medium'],bold:['SourceHanSansSC-Bold','Inter-Bold']};
const weights={};const kern={};
for(const [weight,names] of Object.entries(files)){
  const chinese=opentype.loadSync(`public/v3/fonts/${names[0]}.otf`);
  const latin=opentype.loadSync(`public/v3/fonts/${names[1]}.otf`);
  const glyphs={};
  for(const char of alphabet){
    const font=/[A-Za-z\s/]/.test(char)?latin:chinese;
    const g=font.charToGlyph(char),p=g.getPath(0,0,100),box=p.getBoundingBox();
    glyphs[char]={path:p.toPathData(3),advance:g.advanceWidth/font.unitsPerEm*100,box,
      points:p.commands.filter(c=>Number.isFinite(c.x)).filter((_,i)=>i%2===0).map(c=>[c.x,c.y])};
  }
  for(const a of alphabet)for(const b of alphabet){if(/[A-Za-z]/.test(a+b))kern[`${weight}:${a}${b}`]=latin.getKerningValue(latin.charToGlyph(a),latin.charToGlyph(b))/latin.unitsPerEm*100;}
  weights[weight]=glyphs;
}
writeFileSync('src/v3/glyphs.json',JSON.stringify({units:100,weights,kern}));
console.log(`V3: ${alphabet.size} glyphs × 3 weights, actual advances and Latin kerning.`);
