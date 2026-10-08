"""Inspect the encoded film for unintended blank frames and capture its real tail."""
from pathlib import Path
import json,subprocess,hashlib
import numpy as np
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'out'/'v3'
FILM=OUT/'雨爱-V3-连续文字空间-1080p-无声.mp4'
run=subprocess.run(['ffmpeg','-v','error','-i',str(FILM),'-vf','scale=240:135','-pix_fmt','rgb24','-f','rawvideo','pipe:1'],capture_output=True,check=True)
frames=np.frombuffer(run.stdout,dtype=np.uint8).reshape(-1,135,240,3)
assert len(frames)==3729
# Any bright main glyph or meaningful structure should survive the thumbnail.
# Intentional ink at the opening and the final fade is excluded.
active=frames[489:3117].astype(np.float32)
contrast=active.max(axis=(1,2,3))-active.mean(axis=(1,2,3))
blank=np.flatnonzero(contrast<12)+489
assert not len(blank),f'Unexpected empty lyric frames: {blank.tolist()}'
tail=frames[-1].astype(np.float32)
assert tail.std(axis=(0,1)).max()<1.5,'Last frame has an unintended visible remnant'
folder=OUT/'encoded-checks';folder.mkdir(exist_ok=True)
font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',16)
items=[562,905,1125,1516,1527,1536,2167,2238,2249,2253,2480,2967,3210,3430,3600,3728]
canvas=Image.new('RGB',(1920,4*310),'#0b1119');draw=ImageDraw.Draw(canvas)
for i,frame in enumerate(items):
    file=folder/f'frame-{frame}.png'
    subprocess.run(['ffmpeg','-v','error','-i',str(FILM),'-vf',fr'select=eq(n\,{frame})','-frames:v','1','-y',str(file)],check=True)
    x,y=(i%4)*480,(i//4)*310
    with Image.open(file) as im:canvas.paste(im.convert('RGB').resize((480,270),Image.Resampling.LANCZOS),(x,y))
    draw.text((x+12,y+279),f'{frame} 帧 / {frame/30:.3f} 秒',font=font,fill='#ece9e0')
canvas.save(OUT/'V3-成片抽帧检查.jpg',quality=94)
report={'status':'passed','decodedFrames':len(frames),'unexpectedBlankLyricFrames':blank.tolist(),
        'lastFramePixelStandardDeviation':tail.std(axis=(0,1)).tolist(),
        'source':'actual encoded MP4','checksAtFrames':items,
        'filmSha256':hashlib.sha256(FILM.read_bytes()).hexdigest()}
(OUT/'encoded-frame-verification.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print(json.dumps(report))
