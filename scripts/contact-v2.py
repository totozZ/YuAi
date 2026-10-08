"""Collect already-rendered inspection frames; original generated art is unchanged."""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'out'/'v2'
timing=json.loads((ROOT/'src'/'v2'/'word-timing.json').read_text(encoding='utf-8'))
font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',16)

def sheet(items,cols,name,width=480):
    height=int(width*9/16)
    canvas=Image.new('RGB',(width*cols,(height+40)*((len(items)+cols-1)//cols)),'#101a2a')
    draw=ImageDraw.Draw(canvas)
    for i,(file,label) in enumerate(items):
        x,y=(i%cols)*width,(i//cols)*(height+40)
        with Image.open(file) as im:canvas.paste(im.convert('RGB').resize((width,height),Image.Resampling.LANCZOS),(x,y))
        draw.text((x+12,y+height+10),label,font=font,fill='#e1d7c8')
    canvas.save(OUT/name,quality=94)

frames=OUT/'audit-frames'
items=[(OUT/'keyframes'/'01-glass-room.png','01 / 前奏：玻璃房间'),(frames/'intro-wide.png','02 / 前奏：镜面水上')]
items += [(frames/f"lyric-{l['id']+1:02}-complete.png",f"{l['id']+3:02} / {l['text']}") for l in timing['lines']]
items += [(frames/f'solo-{i}.png',f'{21+i:02} / Solo 镜头 {i}') for i in range(1,4)]
sheet(items,4,'24镜头分镜总览.jpg')
items=[]
for line in timing['lines']:
    for phase,label in [('start','开头'),('middle','中间'),('complete','完整')]:
        items.append((frames/f"lyric-{line['id']+1:02}-{phase}.png",f"{line['id']+1:02} / {label} / {line['text']}"))
sheet(items,3,'19句逐字进度检查.jpg',512)
print('Saved 24-shot storyboard and 57-frame lyric inspection sheet.')
