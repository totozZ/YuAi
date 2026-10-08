"""Verify rendered review audio is the intended source interval, not song time zero."""
from pathlib import Path
import json
import subprocess
import sys
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
V2 = '--v2' in sys.argv
PREVIEW = ROOT / 'out' / 'v2' / '雨爱-V2-25秒样段-含音乐.mp4' if V2 else ROOT / 'out' / '雨爱-副歌预览-含参考音频.mp4'
START = 51 if V2 else 50
DURATION = 25 if V2 else 13
SR = 8000


def decode(path, duration=None):
    args = ['ffmpeg', '-v', 'error', '-i', str(path)]
    if duration is not None:
        args += ['-t', str(duration)]
    args += ['-ac', '1', '-ar', str(SR), '-f', 'f32le', 'pipe:1']
    return np.frombuffer(subprocess.run(args, capture_output=True, check=True).stdout, dtype='<f4')


source = decode(ROOT / '雨爱-杨丞琳.mp3', START+DURATION+1)
rendered = decode(PREVIEW)
reference = source[START * SR:(START+DURATION) * SR]
# Discard the encoder edge and test both beginning and end for accumulating drift.
checks = []
for seconds in ((1, 12, 22) if V2 else (1, 10)):
    sample = rendered[seconds * SR:(seconds+2)*SR].astype(np.float64)
    sample -= sample.mean()
    candidates = source[(START+seconds)*SR-200:(START+seconds+2)*SR+200].astype(np.float64)
    n = 1 << (len(sample)+len(candidates)-1).bit_length()
    correlation = np.fft.irfft(np.fft.rfft(candidates,n)*np.fft.rfft(sample[::-1],n),n)
    valid = correlation[len(sample)-1:len(candidates)]
    shift = int(np.argmax(valid))-200
    matching = candidates[shift+200:shift+200+len(sample)]
    coefficient = float(np.corrcoef(sample,matching)[0,1])
    assert abs(shift)/SR < 1/30, f'Audio misaligned by {shift/SR}s'
    assert coefficient > .95, f'Review audio does not match source: {coefficient}'
    checks.append({'testAtSeconds':seconds,'offsetSamples':shift,'offsetSeconds':shift/SR,'correlation':coefficient})
report = {'status':'passed','reviewStartInSongSeconds':START,'reviewDurationSeconds':DURATION,'checks':checks}
destination = ROOT / 'out' / 'v2' / 'preview-audio-verification.json' if V2 else ROOT / 'out' / 'preview-audio-verification.json'
destination.write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report))
