"""Decode the actual film, inspect palette changes and its warm-white final frame."""
from pathlib import Path
import json,subprocess,hashlib
import numpy as np
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'out'/'v3.1'
FILM=OUT/'雨爱-V3.1-雾蓝光谱-1080p-无声.mp4'
run=subprocess.run(['ffmpeg','-v','error','-i',str(FILM),'-vf','scale=240:135','-pix_fmt','rgb24','-f','rawvideo','pipe:1'],capture_output=True,check=True)
frames=np.frombuffer(run.stdout,dtype=np.uint8).reshape(-1,135,240,3)
assert len(frames)==3729
gray=frames[489:3117].astype(np.float32).mean(axis=3)
contrast=gray.max(axis=(1,2))-gray.min(axis=(1,2))
blank=np.flatnonzero(contrast<12)+489
assert not len(blank),f'Unexpected empty lyric frames: {blank.tolist()}'
tail=frames[-1].astype(np.float32)
assert tail.std(axis=(0,1)).max()<1.5,'Last frame has a visible remnant'
assert np.max(np.abs(tail.mean(axis=(0,1))-[245,240,231]))<=3,'Last frame is not warm white'
assert frames[1603].mean()-frames[1497].mean()>80,'First chorus did not visibly brighten'
stagePixels={str(f):np.median(frames[f,5:25,180:230],axis=(0,1)).tolist() for f in [1497,1603,2484,2981,3430,3728]}
folder=OUT/'encoded-checks';folder.mkdir(exist_ok=True)
font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',16)
items=[1132,1497,1527,1528,1603,1754,2181,2252,2253,2484,2845,2981,3210,3430,3600,3728]
canvas=Image.new('RGB',(1920,4*310),'#102a3a');draw=ImageDraw.Draw(canvas)
for i,frame in enumerate(items):
    file=folder/f'frame-{frame}.png'
    subprocess.run(['ffmpeg','-v','error','-i',str(FILM),'-vf',fr'select=eq(n\,{frame})','-frames:v','1','-y',str(file)],check=True)
    x,y=(i%4)*480,(i//4)*310
    with Image.open(file) as im:canvas.paste(im.convert('RGB').resize((480,270),Image.Resampling.LANCZOS),(x,y))
    draw.text((x+12,y+279),f'{frame} 帧 / {frame/30:.3f} 秒',font=font,fill='#f5f0e7')
canvas.save(OUT/'V3.1-成片抽帧检查.jpg',quality=94)
report={'status':'passed','decodedFrames':len(frames),'unexpectedBlankLyricFrames':blank.tolist(),
        'lastFrameMeanRGB':tail.mean(axis=(0,1)).tolist(),'lastFramePixelStandardDeviation':tail.std(axis=(0,1)).tolist(),
        'stagePixels':stagePixels,'source':'actual encoded MP4','checksAtFrames':items,
        'filmSha256':hashlib.sha256(FILM.read_bytes()).hexdigest()}
(OUT/'encoded-frame-verification.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print(json.dumps(report))
