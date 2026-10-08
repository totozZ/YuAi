"""Assemble the actual stage/cut stills and 57 lyric inspection frames."""
from pathlib import Path
import json
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'out'/'v3.1'
font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',16)
def sheet(items,cols,name,width=480):
    height=int(width*9/16)
    canvas=Image.new('RGB',(cols*width,((len(items)+cols-1)//cols)*(height+44)),'#102a3a');draw=ImageDraw.Draw(canvas)
    for i,(file,label) in enumerate(items):
        x,y=(i%cols)*width,(i//cols)*(height+44)
        with Image.open(file) as im:canvas.paste(im.convert('RGB').resize((width,height),Image.Resampling.LANCZOS),(x,y))
        draw.text((x+10,y+height+10),label,font=font,fill='#f5f0e7')
    canvas.save(OUT/name,quality=94)
names=['01-verse','02-verse-build','03-chorus-before','04-chorus-cut','05-fog-blue','06-channel','07-love-plane','08-memory-before',
       '09-memory-cut','10-memory-grid','11-warm-transition','12-warm-rainbow','13-solo-flow','14-solo-expand','15-solo-resolve','16-last-frame']
labels=['主歌 / 深墨色','主歌推进 / 完整阅读','副歌入口 / 前1帧','1528帧 / 雾蓝打开','雾蓝 / 雨滴与透视','雾蓝 / 流动线带','雾蓝 / 英文平面','重复入口 / 前1帧',
        '2253帧 / 淡紫切换','淡紫 / 记忆网格','2845帧 / 暖色过渡','暖米白 / 彩虹末句','暖白 / 光谱流动','暖白 / 光场展开','暖白 / 减速收束','3728帧 / 暖白终帧']
sheet([(OUT/'scenes'/f'{n}.png',l) for n,l in zip(names,labels)],4,'V3.1-场景变化总览.jpg')
timing=json.loads((ROOT/'src'/'v3'/'generated-timing.json').read_text(encoding='utf8'))
items=[]
for line in timing['lines']:
    for phase,label in [('first','首字到位'),('middle','逐字中段'),('complete','完整阅读')]:
        items.append((OUT/'audit'/f'line-{line["id"]+1:02}-{phase}.png',f'{line["id"]+1:02} / {label} / {line["text"]}'))
if all(p.exists() for p,_ in items):sheet(items,3,'V3.1-19句逐字检查.jpg',512)
print('Saved V3.1 scene overview and lyric inspection sheet.')
