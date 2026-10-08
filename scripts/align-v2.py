"""Align only the supplied lyrics. Preserve song time zero and audit fallback timing.

Run with .venv-alignment/Scripts/python.exe. Separates vocals with Demucs and
uses WhisperX's forced aligner directly, without generating replacement lyrics.
"""
from pathlib import Path
import gc
import json
import os
import re
import subprocess
import traceback
import sys
import urllib.request
import zipfile
import io
import numpy as np

ROOT=Path(__file__).resolve().parent.parent
CACHE=ROOT/'.cache'/'v2'
CACHE.mkdir(parents=True,exist_ok=True)
os.environ['NLTK_DATA']=str(CACHE/'nltk_data')
BASE=json.loads((ROOT/'src'/'timeline.json').read_text(encoding='utf-8'))
FPS=BASE['fps']


def tokenizer_data():
    target=CACHE/'nltk_data'/'tokenizers'
    if (target/'punkt_tab'/'english'/'collocations.tab').exists():return
    # Fetch the official data directly. Keep NLTK's network safety checks enabled.
    url='https://raw.githubusercontent.com/nltk/nltk_data/gh-pages/packages/tokenizers/punkt_tab.zip'
    with urllib.request.urlopen(url) as response:data=response.read()
    target.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        for entry in archive.infolist():
            if not (target/entry.filename).resolve().is_relative_to(target.resolve()):raise ValueError('Unsafe tokenizer archive path')
        archive.extractall(target)


def decode(path, rate=16000, channels=1):
    result=subprocess.run(['ffmpeg','-v','error','-i',str(path),'-t','125.4',
        '-ac',str(channels),'-ar',str(rate),'-f','f32le','pipe:1'],capture_output=True,check=True)
    return np.frombuffer(result.stdout,dtype='<f4').copy().reshape(-1,channels).T


def separate():
    target=CACHE/'vocals.wav'
    if target.exists():
        print('Reusing separated vocals.',flush=True)
        return target
    import torch
    import soundfile as sf
    from demucs.pretrained import get_model
    from demucs.apply import apply_model
    device='cuda' if torch.cuda.is_available() else 'cpu'
    torch.set_num_threads(8)
    print(f'Demucs htdemucs on {device}.',flush=True)
    model=get_model('htdemucs').to(device).eval()
    audio=torch.from_numpy(decode(ROOT/BASE['sourceAudio'],44100,2))
    ref=audio.mean(0)
    mean,std=ref.mean(),ref.std()
    with torch.no_grad():
        prediction=apply_model(model,((audio-mean)/std)[None],device=device,
            shifts=1,split=True,overlap=.25,progress=True,num_workers=0)[0]
    vocal=prediction[model.sources.index('vocals')].cpu().numpy()*float(std)+float(mean)
    sf.write(target,vocal.T,44100,subtype='FLOAT')
    del prediction,model,audio
    gc.collect()
    if device=='cuda':torch.cuda.empty_cache()
    return target


def visible_tokens(text):
    # Latin words are semantic units; Chinese characters remain separate.
    return re.findall(r'[A-Za-z]+|[\u4e00-\u9fff]',text)


def voice_window(audio, start, end):
    hop=160
    sample=audio[int(start*16000):int(end*16000)]
    count=len(sample)//hop
    if count<2:return start,max(start+.2,end-.3),np.array([start])
    rms=np.sqrt(np.mean(sample[:count*hop].reshape(count,hop)**2,axis=1))
    threshold=max(float(np.max(rms))*.075,.002)
    active=rms>threshold
    # Bridge short intra-syllable dips, preserving longer breath gaps.
    for i in range(1,len(active)-1):
        if not active[i] and active[i-1]:
            following=np.flatnonzero(active[i:])
            if len(following) and following[0]<=9:active[i:i+following[0]]=True
    times=start+np.flatnonzero(active)*.01
    voice_end=min(end-.16,float(times[-1])+.08) if len(times) else end-.3
    voice_end=max(start+.25,voice_end)
    # Leave at least 0.3s for reading the complete line, while sustained vowels
    # remain associated with the final visible character.
    schedule_end=min(voice_end,end-.3)
    schedule_end=max(start+.20,schedule_end)
    times=times[times<=schedule_end]
    if len(times)<2:times=np.linspace(start,schedule_end,max(2,int((schedule_end-start)*100)))
    return start,voice_end,times


def tail_hint(text,chars,start,end):
    """An adjacent confident segment can suggest where the sustained last syllable starts.

    This is only a fallback-window estimate, never accepted as a scored character alignment.
    """
    relevant=[c for c in chars if c.get('char','').strip()]
    expected=''.join(visible_tokens(text))
    if ''.join(c.get('char','') for c in relevant).casefold()!=expected.casefold():return None
    if len(relevant)<2 or not re.fullmatch(r'[\u4e00-\u9fff]',relevant[-1]['char']):return None
    previous=relevant[-2]
    candidate=previous.get('end')
    if candidate is None or previous.get('score',0)<.70:return None
    if candidate<start+(end-start)*.25 or candidate>end-.35:return None
    return float(candidate)


def fallback(text,start,end,audio,chars):
    words=visible_tokens(text)
    _,vocal_end,times=voice_window(audio,start,end)
    hint=tail_hint(text,chars,start,end)
    if hint is not None:
        times=times[times<=hint]
        if len(times)<2:times=np.linspace(start,hint,100)
    output=[]
    for i,word in enumerate(words):
        divisor=max(1,len(words)-1) if hint is not None else max(1,len(words))
        position=min(len(times)-1,int(i/divisor*len(times)))
        seconds=start if i==0 else float(times[position])
        output.append({'text':word,'sourceStart':round(seconds,4),
                       'startFrame':int(seconds*FPS+.5),'method':'voiced-window-uniform','confidence':None})
    for i,token in enumerate(output):
        token['endFrame']=output[i+1]['startFrame'] if i+1<len(output) else int(end*FPS+.5)
    return output,vocal_end,hint


def aligned_tokens(cue,chars):
    wanted=visible_tokens(cue['text'])
    relevant=[c for c in chars if c.get('char','').strip()]
    output=[]
    cursor=0
    for word in wanted:
        group=relevant[cursor:cursor+len(word)]
        cursor+=len(word)
        if ''.join(c.get('char','') for c in group).casefold()!=word.casefold():return None,'character coverage'
        if any('start' not in c or 'end' not in c for c in group):return None,'missing timestamps'
        score=float(np.mean([c.get('score',0) for c in group]))
        seconds=float(group[0]['start'])
        last=float(group[-1]['end'])
        if score<.28:return None,'low confidence'
        if seconds<cue['sourceSeconds']-.18 or last>cue['endFrame']/FPS+.04:return None,'outside line'
        output.append({'text':word,'sourceStart':round(seconds,4),'startFrame':int(seconds*FPS+.5),
                       'method':'whisperx-ctc','confidence':round(score,4)})
    if len(output)!=len(wanted) or cursor!=len(relevant):return None,'character coverage'
    starts=[t['sourceStart'] for t in output]
    if any(b-a<.065 for a,b in zip(starts,starts[1:])):return None,'crowded or reversed starts'
    if starts[0]>cue['sourceSeconds']+.40:return None,'late first character'
    if len(starts)>3 and starts[-1]-starts[0]<(cue['endFrame']/FPS-cue['sourceSeconds'])*.40:
        return None,'implausibly compressed singing'
    for i,token in enumerate(output):
        token['endFrame']=output[i+1]['startFrame'] if i+1<len(output) else cue['endFrame']
    return output,None


def main():
    errors=[]
    separated=False
    try:
        vocal_path=separate()
        vocals=decode(vocal_path)[0]
        separated=True
    except Exception as exc:
        errors.append('Vocal separation: '+repr(exc))
        traceback.print_exc()
        vocals=decode(ROOT/BASE['sourceAudio'])[0]
    aligned=[]
    try:
        raw=CACHE/'raw-char-alignment.json'
        if '--reuse-raw' in sys.argv and raw.exists():
            aligned=json.loads(raw.read_text(encoding='utf-8'))['segments']
            print('Reusing audited raw model candidates.',flush=True)
            raise StopIteration
        import torch
        torch.set_num_threads(8)
        tokenizer_data()
        from whisperx.alignment import load_align_model,align
        device='cuda' if torch.cuda.is_available() else 'cpu'
        print('Loading Chinese forced-alignment model; supplied transcript only.',flush=True)
        model,metadata=load_align_model('zh',device,model_dir=str(CACHE/'models'))
        transcript=[{'start':max(0,c['sourceSeconds']-.12),'end':c['endFrame']/FPS,'text':c['text']} for c in BASE['lyrics']]
        result=align(transcript,model,metadata,vocals,device,return_char_alignments=True,print_progress=True)
        aligned=result['segments']
        (CACHE/'raw-char-alignment.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
        del model
        gc.collect()
    except StopIteration:
        pass
    except Exception as exc:
        errors.append('Forced alignment: '+repr(exc))
        traceback.print_exc()
    lines=[]
    for cue in BASE['lyrics']:
        end=cue['endFrame']/FPS
        result=aligned[cue['id']] if cue['id']<len(aligned) else {}
        tokens,reason=aligned_tokens(cue,result.get('chars') or [])
        _,vocal_end,_=voice_window(vocals,cue['sourceSeconds'],end)
        hint=None
        if tokens is None:tokens,vocal_end,hint=fallback(cue['text'],cue['sourceSeconds'],end,vocals,result.get('chars') or [])
        lines.append({'id':cue['id'],'text':cue['text'],'startFrame':cue['startFrame'],'endFrame':cue['endFrame'],
                      'vocalEndSeconds':round(vocal_end,4),'tokens':tokens,'fallbackReason':reason,
                      'estimatedSustainStart':hint,'sustainHintSource':'adjacent-confident-CTC-boundary-estimate' if hint else None})
        print(f"Line {cue['id']+1:02}: {tokens[0]['method']}, {len(tokens)} units, {reason or 'accepted'}",flush=True)
    overrides=json.loads((ROOT/'src'/'v2'/'timing-overrides.json').read_text(encoding='utf-8'))['tokens']
    for line in lines:
        for j,token in enumerate(line['tokens']):
            key=f"{line['id']}:{j}"
            if key in overrides:
                token['originalMethod']=token['method']
                token['startFrame']=int(overrides[key])
                token['sourceStart']=round(token['startFrame']/FPS,4)
                token['method']='manual-override'
                token['confidence']=None
        for j,token in enumerate(line['tokens']):
            token['endFrame']=line['tokens'][j+1]['startFrame'] if j+1<len(line['tokens']) else line['endFrame']
            if not line['startFrame']<=token['startFrame']<token['endFrame']<=line['endFrame']:
                raise ValueError(f"Invalid token override {line['id']}:{j}")
    report={'version':2,'fps':FPS,'durationInFrames':BASE['durationInFrames'],'sourceAudioSha256':BASE['audioSha256'],
            'audioOffsetFrames':0,'vocalSeparated':separated,'lines':lines,'errors':errors,
            'model':'WhisperX Chinese wav2vec2 CTC','humanListening':False}
    (ROOT/'src'/'v2'/'word-timing.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (ROOT/'out'/'v2'/'逐字时间报告.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Saved independent V2 token timing and provenance.',flush=True)


if __name__=='__main__':main()
