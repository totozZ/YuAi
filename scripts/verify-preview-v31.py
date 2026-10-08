"""Check the V3.1 review track against source audio 50–76s."""
from pathlib import Path
import json,subprocess
import numpy as np
ROOT=Path(__file__).resolve().parent.parent
SR=8000
def decode(path):
    result=subprocess.run(['ffmpeg','-v','error','-i',str(path),'-ac','1','-ar',str(SR),'-f','f32le','pipe:1'],capture_output=True,check=True)
    return np.frombuffer(result.stdout,dtype='<f4')
source=decode(ROOT/'雨爱-杨丞琳.mp3')
rendered=decode(ROOT/'out'/'v3.1'/'雨爱-V3.1-副歌样段-含音乐.mp4')
checks=[]
for seconds in [1,13,23]:
    sample=rendered[seconds*SR:(seconds+2)*SR].astype(np.float64);sample-=sample.mean()
    candidates=source[(50+seconds)*SR-300:(50+seconds+2)*SR+300].astype(np.float64)
    n=1<<(len(sample)+len(candidates)-1).bit_length()
    correlation=np.fft.irfft(np.fft.rfft(candidates,n)*np.fft.rfft(sample[::-1],n),n)
    valid=correlation[len(sample)-1:len(candidates)]
    shift=int(np.argmax(valid))-300
    matching=candidates[shift+300:shift+300+len(sample)]
    coefficient=float(np.corrcoef(sample,matching)[0,1])
    assert abs(shift)/SR<1/30,f'Audio offset {shift/SR}s'
    assert coefficient>.95,f'Wrong reference interval: {coefficient}'
    checks.append({'reviewSecond':seconds,'offsetSeconds':shift/SR,'correlation':coefficient})
report={'status':'passed','songIntervalSeconds':[50,76],'checks':checks}
(ROOT/'out'/'v3.1'/'preview-audio-verification.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print(json.dumps(report))
