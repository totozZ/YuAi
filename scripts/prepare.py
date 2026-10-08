"""Read the supplied LRC and decode the supplied MP3 without trimming silence.

Onsets are rhythmic candidates, not phoneme alignment or a vocalist detector.
No BPM is assumed. Original source files are never changed.
"""
from pathlib import Path
import hashlib
import json
import re
import shutil
import subprocess
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
SOURCE = ROOT / '雨爱-杨丞琳.mp3'
LRC = ROOT / 'geci' / 'geciLRC.txt'
PLAIN = ROOT / 'geci' / 'geci.txt'


def parse_lrc(text):
    cues = []
    for line in text.splitlines():
        match = re.match(r'\[(\d+):(\d+(?:\.\d+)?)\](.*)', line)
        if match:
            cues.append((int(match[1]) * 60 + float(match[2]), match[3].strip()))
    return sorted(cues)


def frame(seconds):
    return int(seconds * FPS + 0.5)


def main():
    entries = parse_lrc(LRC.read_text(encoding='utf-8-sig'))
    clear_index = next(i for i, (_, text) in enumerate(entries) if not text)
    first = entries[:clear_index]
    assert len(first) == 19, 'Expected the 19 supplied first-verse lines.'
    plain = [re.sub(r'\s+', '', line) for line in PLAIN.read_text(encoding='utf-8-sig').splitlines() if line.strip()]
    assert [re.sub(r'\s+', '', text) for _, text in first] == plain[:19], 'LRC/plain lyrics disagree.'
    clear_time = entries[clear_index][0]
    next_vocal = next(t for t, text in entries[clear_index + 1:] if text)
    duration = int(np.floor(next_vocal * FPS))
    public = ROOT / 'public'
    public.mkdir(exist_ok=True)
    shutil.copy2(SOURCE, public / 'reference.mp3')
    font_dir = public / 'fonts'
    font_dir.mkdir(exist_ok=True)
    font = Path('C:/Windows/Fonts/msyh.ttc')
    if font.exists():
        shutil.copy2(font, font_dir / 'scene-font.ttc')
    else:
        raise SystemExit('Place a Chinese-capable font at public/fonts/scene-font.ttc first.')

    # Decode from time zero, retaining all silence. Floating-point PCM is gapless
    # decoded by FFmpeg; the MP3 container start_time is not an artistic offset.
    result = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(SOURCE), '-t', str(next_vocal + 1),
                             '-ac', '1', '-ar', '22050', '-f', 'f32le', 'pipe:1'], capture_output=True, check=True)
    pcm = np.frombuffer(result.stdout, dtype='<f4')
    size, hop, sr = 1024, 256, 22050
    windows = np.lib.stride_tricks.sliding_window_view(pcm, size)[::hop]
    spectrum = np.abs(np.fft.rfft(windows * np.hanning(size), axis=1))
    frequency = np.fft.rfftfreq(size, 1 / sr)
    # Positive log-spectral flux in a percussion-friendly band, with the local
    # median removed so loud sections do not erase quiet-section transients.
    band = np.log1p(spectrum[:, (frequency > 90) & (frequency < 6500)] * 8)
    flux = np.maximum(np.diff(band, axis=0, prepend=band[:1]), 0).mean(axis=1)
    width = 87
    padded = np.pad(flux, width // 2, mode='edge')
    baseline = np.median(np.lib.stride_tricks.sliding_window_view(padded, width), axis=1)
    novelty = np.maximum(flux - baseline, 0)
    threshold = max(float(np.quantile(novelty, 0.70)), 0.001)
    candidates = [i for i in range(2, len(novelty)-2)
                  if novelty[i] > threshold and novelty[i] >= max(novelty[i-2:i+3])]
    selected = []
    for i in sorted(candidates, key=lambda i: float(novelty[i]), reverse=True):
        if all(abs(i-j)*hop/sr > 0.30 for j in selected):
            selected.append(i)
    scale = float(np.quantile(novelty[selected], .90)) if selected else 1
    beats = []
    for i in sorted(selected):
        seconds = (i * hop + size / 2) / sr
        if seconds < duration / FPS:
            beats.append({'frame': frame(seconds), 'seconds': round(seconds, 6),
                          'strength': round(min(1, float(novelty[i]) / max(scale, 1e-6)), 4)})

    effects = ['window', 'window', 'fall', 'focus', 'depart', 'depart', 'ripple', 'release',
               'rain', 'breathe', 'rain', 'transparent', 'bloom', 'accumulate', 'memory',
               'rain', 'continue', 'open', 'arc']
    phrases = [
        ['窗外的天气'], ['就像是', '你多变的表情'], ['下雨了', '雨陪我哭泣'],
        ['看不清', '我也不想看清'], ['离开你', '我安静的抽离'], ['不忍揭晓的剧情'],
        ['我的泪', '流在心里'], ['学会放弃'], ['听雨的声音', '一滴滴清晰'],
        ['你的呼吸像雨滴', '渗入我的爱里'], ['真希望雨', '能下不停'],
        ['让想念继续', '让爱变透明'], ['我爱上给我勇气的', 'Rainie Love'],
        ['窗外的雨滴', '一滴滴累积'], ['屋内的湿气', '像储存爱你的记忆'],
        ['真希望雨', '能下不停'], ['雨爱的秘密', '能一直延续'],
        ['我相信', '我将会看到'], ['彩虹的美丽']
    ]
    anchors = [(230, 390), (250, 400), (245, 380), (255, 430), (230, 390), (270, 445),
               (265, 395), (290, 440), (230, 350), (260, 375), (260, 370), (280, 380),
               (230, 380), (250, 355), (265, 400), (240, 370), (245, 395), (315, 390), (0, 0)]
    lyrics = []
    for i, (seconds, text) in enumerate(first):
        end_seconds = first[i+1][0] if i+1 < len(first) else clear_time
        lyrics.append({'id': i, 'text': text, 'phrases': phrases[i], 'sourceSeconds': seconds,
                       'startFrame': frame(seconds), 'endFrame': frame(end_seconds),
                       'effect': effects[i], 'anchor': anchors[i], 'fontSize': 83 if i != 12 else 75})
    scene_points = [(0, 'window'), (26.454, 'street'), (38.411, 'silhouette'),
                    (50.943, 'rain'), (63.210, 'memory'), (75.006, 'window'),
                    (78.144, 'memory'), (83.483, 'rain'), (93.153, 'rainbow'),
                    (clear_time, 'solo')]
    scenes = [{'kind': kind, 'startFrame': frame(seconds),
               'endFrame': frame(scene_points[i+1][0]) if i+1 < len(scene_points) else duration}
              for i, (seconds, kind) in enumerate(scene_points)]
    timeline = {'fps': FPS, 'width': 1920, 'height': 1080, 'durationInFrames': duration,
                'audioFile': 'reference.mp3', 'sourceAudio': SOURCE.name,
                'audioSha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
                'visualOffsetFrames': 0, 'lyricClearFrame': frame(clear_time),
                'nextVocalSeconds': next_vocal,
                'beatAnalysis': {'method': 'positive log-spectral flux, local median, 0.30s peak separation',
                                 'status': 'audio-derived rhythmic candidates; line timing supplied by LRC; no manual listening claimed'},
                'lyrics': lyrics, 'scenes': scenes, 'beats': beats}
    target = ROOT / 'src' / 'timeline.json'
    target.write_text(json.dumps(timeline, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    out = ROOT / 'out'
    out.mkdir(exist_ok=True)
    # A small data artifact makes timing and source identity reviewable.
    (out / 'timing-analysis.json').write_text(json.dumps({
        'sourceSha256': timeline['audioSha256'], 'sampleRate': sr,
        'onsets': beats, 'lyricStartSeconds': [t for t, _ in first],
        'clearSeconds': clear_time, 'nextVocalSeconds': next_vocal,
        'durationSeconds': duration/FPS, 'status': timeline['beatAnalysis']['status']
    }, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'lyrics': len(lyrics), 'onsets': len(beats), 'frames': duration,
                      'seconds': duration/FPS, 'source': SOURCE.name}, ensure_ascii=False))


if __name__ == '__main__':
    main()
