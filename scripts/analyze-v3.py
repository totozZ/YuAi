"""Partial character anchors + local vocal interpolation, and targeted drum events."""
from pathlib import Path
import json,re,subprocess,gc,sys
import numpy as np
ROOT=Path(__file__).resolve().parent.parent
CACHE=ROOT/'.cache'/'v3';CACHE.mkdir(parents=True,exist_ok=True)
SRC=ROOT/'src'/'v3';SRC.mkdir(parents=True,exist_ok=True)
OUT=ROOT/'out'/'v3';OUT.mkdir(parents=True,exist_ok=True)
base=json.loads((ROOT/'src'/'timeline.json').read_text(encoding='utf8'))
prior=json.loads((ROOT/'src'/'v2'/'word-timing.json').read_text(encoding='utf8'))
raw=json.loads((ROOT/'.cache'/'v2'/'raw-char-alignment.json').read_text(encoding='utf8'))
FPS=30

def decode(path,rate=16000,channels=1):
    r=subprocess.run(['ffmpeg','-v','error','-i',str(path),'-t','125.4','-ar',str(rate),'-ac',str(channels),'-f','f32le','pipe:1'],capture_output=True,check=True)
    return np.frombuffer(r.stdout,dtype='<f4').copy().reshape(-1,channels).T

def drums():
    file=CACHE/'drums.wav'
    if file.exists():return file
    import torch,soundfile as sf
    from demucs.pretrained import get_model
    from demucs.apply import apply_model
    torch.set_num_threads(8)
    print('Separating drum stem with cached htdemucs model.',flush=True)
    model=get_model('htdemucs').eval()
    wav=torch.from_numpy(decode(ROOT/base['sourceAudio'],44100,2))
    ref=wav.mean(0);mean,std=ref.mean(),ref.std()
    with torch.no_grad():result=apply_model(model,((wav-mean)/std)[None],device='cpu',shifts=1,split=True,overlap=.25,progress=True)[0]
    sf.write(file,(result[model.sources.index('drums')].numpy()*float(std)+float(mean)).T,44100,subtype='FLOAT')
    del model,result,wav;gc.collect()
    return file

vocal=decode(ROOT/'.cache'/'v2'/'vocals.wav')[0]
def active_times(a,b):
    hop=160
    sample=vocal[int(a*16000):int(b*16000)]
    n=len(sample)//hop
    if n<2:return np.array([a,b])
    rms=np.sqrt(np.mean(sample[:n*hop].reshape(n,hop)**2,axis=1))
    active=rms>max(.003,float(rms.max())*.10)
    times=a+np.flatnonzero(active)*.01
    return times if len(times)>1 else np.linspace(a,b,max(2,int((b-a)*100)))

def units(text):return re.findall(r'[A-Za-z]+|[\u4e00-\u9fff]',text)

english=[]
try:
    file=CACHE/'english-alignment.json'
    if file.exists():english=json.loads(file.read_text(encoding='utf8'))['word_segments']
    else:
        import os,torch
        os.environ['NLTK_DATA']=str(ROOT/'.cache'/'v2'/'nltk_data')
        torch.set_num_threads(8)
        from whisperx.alignment import load_align_model,align
        print('Aligning the supplied two English words separately.',flush=True)
        model,meta=load_align_model('en','cpu',model_dir=str(ROOT/'.cache'/'v2'/'models'))
        result=align([{'start':71.0,'end':75.006,'text':'Rainie Love'}],model,meta,vocal,'cpu',return_char_alignments=True)
        file.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
        english=result['word_segments'];del model;gc.collect()
except Exception as exc:print('English alignment fallback:',repr(exc),flush=True)

lines=[]
for cue in base['lyrics']:
    words=units(cue['text']);n=len(words);start=cue['sourceSeconds'];end=cue['endFrame']/30
    chars=[c for c in raw['segments'][cue['id']].get('chars',[]) if c.get('char','').strip()]
    groups=[];cursor=0
    for word in words:groups.append(chars[cursor:cursor+len(word)]);cursor+=len(word)
    anchors={0:(start,'lrc',None)}
    for i,g in enumerate(groups):
        if i==0 or not g or ''.join(c['char'] for c in g).casefold()!=words[i].casefold():continue
        if any('start' not in c or 'end' not in c for c in g):continue
        score=float(np.mean([c.get('score',0) for c in g]));t=float(g[0]['start'])
        if score>=.70 and start+.065*i<=t<=end-.5 and g[-1]['end']-t>=.035:
            anchors[i]=(t,'ctc-estimate',round(score,4))
    if cue['id']==12:
        for word in english:
            if word.get('word') in ['Rainie','Love'] and word.get('score',0)>=.65:
                i=words.index(word['word']);anchors[i]=(word['start'],'english-ctc-estimate',word['score'])
    # Last syllable onset can be estimated from the previous confident boundary.
    if n-1 not in anchors:
        final=groups[-1];prev=groups[-2] if n>1 else []
        hint=prev[-1].get('end') if prev and prev[-1].get('score',0)>=.7 else None
        if len(words[-1])==1 and hint is not None and start+.065*(n-1)<=hint<=end-.5:
            anchors[n-1]=(hint,'adjacent-boundary-estimate',None)
        else:anchors[n-1]=(prior['lines'][cue['id']]['tokens'][-1]['sourceStart'],'vocal-window-estimate',None)
    # Reject crowded/reversed candidates while preserving reliable local anchors.
    accepted={0:anchors[0]}
    for i in sorted(anchors)[1:]:
        p=max(accepted)
        if anchors[i][0]-accepted[p][0]>=.065*(i-p):accepted[i]=anchors[i]
    if n-1 not in accepted:
        p=max(accepted);accepted[n-1]=(max(accepted[p][0]+.08*(n-1-p),min(end-.5,prior['lines'][cue['id']]['tokens'][-1]['sourceStart'])),'vocal-window-estimate',None)
    tokens=[]
    for i,word in enumerate(words):
        if i in accepted:t,source,score=accepted[i]
        else:
            left=max(k for k in accepted if k<i);right=min(k for k in accepted if k>i)
            a,b=accepted[left][0],accepted[right][0];times=active_times(a,b)
            fraction=(i-left)/(right-left)
            t=float(times[min(len(times)-1,int(fraction*(len(times)-1)))])
            t=max(a+.065*(i-left),min(b-.065*(right-i),t));source='local-vocal-interpolation';score=None
        frame=max(cue['startFrame'],min(cue['endFrame']-15,int(t*30+.5)))
        tokens.append({'id':f'l{cue["id"]:02}-t{i:02}','text':word,'readableFrame':frame,'sourceSeconds':round(t,4),'source':source,'confidence':score})
    for i,token in enumerate(tokens):
        if i:token['readableFrame']=max(token['readableFrame'],tokens[i-1]['readableFrame']+2)
        token['endFrame']=tokens[i+1]['readableFrame'] if i+1<n else cue['endFrame']
    lines.append({'id':cue['id'],'text':cue['text'],'startFrame':cue['startFrame'],'endFrame':cue['endFrame'],'tokens':tokens})
    print(f"Line {cue['id']+1}: {len(accepted)} anchors / {n} units",flush=True)

audio=decode(drums(),22050)[0];hop=256;size=1024
flux=[];last=None
for i in range(0,len(audio)-size,hop):
    mag=np.abs(np.fft.rfft(audio[i:i+size]*np.hanning(size)))
    feature=np.log1p(mag*16)
    delta=np.maximum(0,feature-last) if last is not None else feature*0
    flux.append(float(delta[:160].mean()*.55+delta[160:360].mean()*.45));last=feature
flux=np.array(flux);scale=float(np.percentile(flux,97));candidates=[]
for i in range(2,len(flux)-2):
    local=flux[max(0,i-20):i+21];threshold=np.median(local)*1.4+.008
    if flux[i]>=max(flux[i-2:i+3]) and flux[i]>threshold:
        t=(i*hop+size/2)/22050
        if not candidates or t-candidates[-1]['seconds']>.28:
            candidates.append({'frame':int(t*30+.5),'seconds':round(t,4),'strength':round(min(1,float(flux[i]/scale)),4)})
events=[]
for i in [8,13]:
    target=base['lyrics'][i]['startFrame']
    nearby=[c for c in candidates if abs(c['frame']-target)<=9]
    chosen=max(nearby,key=lambda c:c['strength']-.065*abs(c['frame']-target)) if nearby else {'frame':target,'strength':.5,'seconds':target/30}
    events.append({'id':f'cut-{i}','type':'match-cut','frame':chosen['frame'],'strength':chosen['strength'],'target':f'bridge-{i-1}','source':'drum-stem-onset' if nearby else 'lrc-section'})

keywords=['天','表情','雨','不想','抽离','剧情','泪','放弃','清晰','呼吸','不停','透明','勇气','累积','记忆','不停','延续','相信','美丽']
for line,key in zip(lines,keywords):
    text=''.join(t['text'] for t in line['tokens']);idx=text.find(key)
    tokenIndex=idx if line['id']!=12 else 5
    tokenIndex=max(0,min(len(line['tokens'])-1,tokenIndex))
    events.append({'id':f'accent-{line["id"]}','type':'vocal-accent','frame':line['tokens'][tokenIndex]['readableFrame'],'strength':.25 if line['id']<6 else .45 if line['id']<8 else .8,'target':line['tokens'][tokenIndex]['id'],'source':line['tokens'][tokenIndex]['source']})
    pool=[c for c in candidates if line['startFrame']+12<c['frame']<line['endFrame']-12]
    count=0 if line['id']<6 else 1 if line['id']<8 else 2
    selected=sorted(sorted(pool,key=lambda c:c['strength'],reverse=True)[:count],key=lambda c:c['frame'])
    for j,c in enumerate(selected):events.append({'id':f'beat-{line["id"]}-{j}','type':'beat','frame':c['frame'],'strength':c['strength'],'target':f'bridge-{line["id"]}','source':'drum-stem-onset'})
sections=[('intro',0,.15),('verse',489,.25),('build',1354,.50),('chorus-a',1528,.85),('chorus-b',2250,.95),('hope',2795,.65),('solo',3117,.55),('outro',3525,.20)]
for label,frame,intensity in sections:events.append({'id':f'section-{label}','type':'section','frame':frame,'strength':intensity,'target':'world','source':'lrc-structure'})
# The guitar phrase has less drum energy: use the original mix's spectral onsets,
# conservatively spaced, to flex the already-existing spectral curves.
solo=[]
for c in sorted([c for c in base['beats'] if 3117<c['frame']<3550],key=lambda c:c['strength'],reverse=True):
    if c['strength']>=.65 and all(abs(c['frame']-s['frame'])>34 for s in solo):solo.append(c)
for i,c in enumerate(sorted(solo[:8],key=lambda c:c['frame'])):
    events.append({'id':f'solo-{i}','type':'instrumental','frame':c['frame'],'strength':c['strength'],'target':'spectrum-from-rainbow','source':'mix-spectral-onset'})
timing={'version':3,'fps':30,'durationInFrames':3729,'audioOffsetFrames':0,'sourceAudioSha256':base['audioSha256'],'lines':lines,'humanListening':False}
(SRC/'generated-timing.json').write_text(json.dumps(timing,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(SRC/'music-events.json').write_text(json.dumps(sorted(events,key=lambda e:e['frame']),ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(OUT/'timing-provenance.json').write_text(json.dumps(timing,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(OUT/'drum-onset-candidates.json').write_text(json.dumps(candidates,indent=2),encoding='utf8')
print(f'Saved {len(events)} targeted music events; {len(candidates)} drum candidates.',flush=True)
