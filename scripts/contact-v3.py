"""Assemble actual rendered frames and report the independently editable timing."""
from pathlib import Path
import json
from collections import Counter
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'out'/'v3'
timing=json.loads((ROOT/'src'/'v3'/'generated-timing.json').read_text(encoding='utf8'))
events=json.loads((ROOT/'src'/'v3'/'music-events.json').read_text(encoding='utf8'))
font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',16)
def sheet(items,cols,name,width=480):
    height=int(width*9/16);footer=48
    canvas=Image.new('RGB',(cols*width,((len(items)+cols-1)//cols)*(height+footer)),'#0b1119')
    draw=ImageDraw.Draw(canvas)
    for i,(file,label) in enumerate(items):
        x,y=(i%cols)*width,(i//cols)*(height+footer)
        with Image.open(file) as im:canvas.paste(im.convert('RGB').resize((width,height),Image.Resampling.LANCZOS),(x,y))
        draw.text((x+10,y+height+12),label,font=font,fill='#ece9e0')
    canvas.save(OUT/name,quality=94)
items=[(OUT/'stills'/'00-title.png','前奏 / 雨爱 → 窗框空间')]
items += [(OUT/'stills'/f'line-{l["id"]+1:02}.png',f'{l["id"]+1:02} / {l["text"]}') for l in timing['lines']]
items += [(OUT/'stills'/f'solo-{phase}.png',f'Solo / {label}') for phase,label in [('flow','流动'),('expand','展开'),('resolve','收束')]]
items += [(OUT/'stills'/'last-frame.png','终帧 / 3728 / 墨色静止')]
sheet(items,4,'V3-连续编排总览.jpg')
items=[]
for line in timing['lines']:
    for phase,label in [('first','首字到位'),('middle','逐字中段'),('complete','完整阅读')]:
        items.append((OUT/'audit'/f'line-{line["id"]+1:02}-{phase}.png',f'{line["id"]+1:02} / {label} / {line["text"]}'))
sheet(items,3,'V3-19句逐字检查.jpg',512)
items=[]
for line in timing['lines'][1:]:
    for phase,label in [('before12','前12帧'),('before1','前1帧'),('after8','后8帧'),('after20','后20帧')]:
        items.append((OUT/'bridges'/f'bridge-{line["id"]:02}-{phase}.png',f'{line["id"]:02} → {line["id"]+1:02} / {label}'))
if all(file.exists() for file,_ in items):sheet(items,4,'V3-跨句连续性检查.jpg',480)
sources=Counter(t['source'] for l in timing['lines'] for t in l['tokens'])
translations={'lrc':'LRC 句级首字锚点','ctc-estimate':'筛选后保留的 CTC 估计','adjacent-boundary-estimate':'邻字边界估计','local-vocal-interpolation':'相邻锚点间的人声窗口插值','vocal-window-estimate':'有效演唱窗口估计'}
report=['# V3 同步来源与修正报告','',
        '音频起点与原 MP3 保持一致，整体音频偏移为 0。总长度 124.3 秒 / 3729 帧；下一段人声 LRC 为 124.322 秒。原声未剪去换气或起始静音。','',
        'V2 的逐字起点后还有 5 帧填充延迟。V3 将逐字时间解释为已经清晰到位的 `readableFrame`：准备动作提前 6–10 帧，指定帧的填充为 1、模糊为 0。前四句不再额外延后约 0.167 秒；LRC 句级首字锚点不移动。逐字候选经过重新筛选，后续字的时刻与 V2 均分结果不同。','',
        '## 来源统计','', '| 来源 | 单位数 |','|---|---:|']
report += [f'| {translations[k]} | {v} |' for k,v in sources.items()]
report += ['', '总计 163 个单位：161 个汉字、Rainie 与 Love 两个英文词。字符顺序及原文与所提供 LRC / 歌词文件核对。低置信度字符只在邻近锚点内补齐，没有因尾字失败而重分整句。', '',
           '单独运行的英文 CTC 结果置信度低于接受门槛，未采用；英文词保留原强制对齐中的聚合候选，来源仍标为估计。', '',
           '**准确性边界：**CTC 分数不是歌唱时间误差的证明。数据校验验证了顺序、乐句范围、阅读平台和落帧；未宣称每个字相对真实演唱误差小于 1 帧，也未进行人工试听验收。25 个局部插值和 18 个边界／窗口估计应优先复核。两个带原曲的样段用于实际感受同步。','',
           '## 每句逐字时刻','', '格式：字／词 `帧号(秒)`；来源详见 `timing-provenance.json`。','']
for line in timing['lines']:
    units=' · '.join(f'{t["text"]} `{t["readableFrame"]}({t["readableFrame"]/30:.3f})`' for t in line['tokens'])
    report += [f'{line["id"]+1:02}. **{line["text"]}**  ',units,'']
report += ['## 音乐事件','',
           '鼓轨由 Demucs htdemucs 从同一 MP3 分离。共 236 个鼓轨起音候选，选择性采用主歌推进与副歌事件；不让每个字随所有鼓点弹跳。V3 分别保存人声重音、鼓轨事件、段落事件和 solo 的原混音频谱起音。','']
for e in events:
    if e['type']=='match-cut':report += [f'- `{e["id"]}`：{e["frame"]} 帧 / {e["frame"]/30:.3f} 秒，来源 `{e["source"]}`，目标 `{e["target"]}`。']
report += ['', '## 修改方法','',
           '在 `src/v3/overrides.json` 修改 `tokenReadFrames`（绝对帧号）、`lineOffsetFrames`（句级相对偏移）或 `eventFrames`（绝对帧号）。ID 可从逐字数据和事件数据复制。`visualOffsetFrames` 正值让整体视觉延后，负值提前，默认 0；不会移动音轨。', '',
           '手工逐字帧优先于自动结果及句级偏移。重新分析只生成逐字数据与音乐事件，不覆盖 `overrides.json`、编排与排版。修改后执行 `npm run check:v3`，检查顺序与至少 0.5 秒完整阅读窗口；若需要重新规划句级首字，请同步修改第一字的手工值。','',
           '数据验证：`source-validation.json`。逐字清晰检查：`readable-frame-audit.json`。编码与帧数：`verification.json`。样段音轨位置：`preview-audio-verification.json`。']
(OUT/'V3-同步来源与修正报告.md').write_text('\n'.join(report)+'\n',encoding='utf8')
print('Saved storyboard, lyric/bridge inspection sheets, and timing report.')
