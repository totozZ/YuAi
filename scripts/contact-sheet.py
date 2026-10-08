"""Assemble rendered inspection frames; does not alter any illustration assets."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
images = sorted((ROOT / 'out' / 'stills').glob('lyric-*.png'))
width, height = 640, 360
rows = (len(images)+2)//3
sheet = Image.new('RGB', (width*3, (height+36)*rows), '#0a1424')
font = ImageFont.truetype('C:/Windows/Fonts/msyh.ttc', 17)
draw = ImageDraw.Draw(sheet)
for i,path in enumerate(images):
    x,y = (i%3)*width, (i//3)*(height+36)
    with Image.open(path) as im:
        sheet.paste(im.convert('RGB').resize((width,height),Image.Resampling.LANCZOS),(x,y))
    draw.text((x+16,y+height+8), f'歌词 {i+1:02} / 19', font=font, fill='#aebdd1')
sheet.save(ROOT/'out'/'歌词分镜总览.jpg',quality=94)
print(f'Contact sheet: {len(images)} lyric frames.')
