"""Check both AAC review tracks against the original decoded MP3, at three times."""
from pathlib import Path
import json,subprocess
import numpy as np
ROOT=Path(__file__).resolve().parent.parent
SR=8000
def decode(path):
    result=subprocess.run(['ffmpeg','-v','error','-i',str(path),'-ac','1','-ar',str(SR),'-f','f32le','pipe:1'],capture_output=True,check=True)
    return np.frombuffer(result.stdout,dtype='<f4')
source=decode(ROOT/'雨爱-杨丞琳.mp3')
reports=[]
for filename,start,duration in [('雨爱-V3-主歌样段-含音乐.mp4',14,28),('雨爱-V3-副歌样段-含音乐.mp4',50,26)]:
    rendered=decode(ROOT/'out'/'v3'/filename);checks=[]
    for seconds in [1,duration//2,duration-3]:
        sample=rendered[seconds*SR:(seconds+2)*SR].astype(np.float64);sample-=sample.mean()
        candidates=source[(start+seconds)*SR-300:(start+seconds+2)*SR+300].astype(np.float64)
        n=1<<(len(sample)+len(candidates)-1).bit_length()
        correlation=np.fft.irfft(np.fft.rfft(candidates,n)*np.fft.rfft(sample[::-1],n),n)
        valid=correlation[len(sample)-1:len(candidates)]
        shift=int(np.argmax(valid))-300
        matching=candidates[shift+300:shift+300+len(sample)]
        coefficient=float(np.corrcoef(sample,matching)[0,1])
        assert abs(shift)/SR<1/30,f'{filename}: offset {shift/SR}s'
        assert coefficient>.95,f'{filename}: correlation {coefficient}'
        checks.append({'reviewSecond':seconds,'offsetSeconds':shift/SR,'correlation':coefficient})
    reports.append({'file':filename,'songIntervalSeconds':[start,start+duration],'status':'passed','checks':checks})
(ROOT/'out'/'v3'/'preview-audio-verification.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(reports,ensure_ascii=False))
