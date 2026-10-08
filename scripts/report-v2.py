"""Write truthful, reproducible timing provenance for the delivered video."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent.parent
out=ROOT/'out'/'v2'
r=json.loads((ROOT/'src'/'v2'/'word-timing.json').read_text(encoding='utf8'))
lines=['# 逐字时间来源与检查报告','',
 '共 19 句、163 个出现单位：161 个中文字，`Rainie`、`Love` 两个英文单词。原文全部保留。','',
 '**直接接受的模型对齐：0；有效人声窗口均分估算：163。** Demucs 人声分离和 WhisperX 字符强制对齐均已实际运行。19 句都因至少一个字符低置信度未通过整句检查，未通过的候选没有直接用作正式逐字时间。','',
 '17 句采用相邻高置信度 CTC 片段的结束边界，估计尾字拖音起点，作为均分窗口的尾端；这属于辅助估计。另外 2 句仅依据人声音量窗口。停顿和句尾换气只影响文字时间分配，原 MP3 与成片长度均未裁改。','',
 '每个单位保存出现帧、结束帧、来源和置信度。估算值置信度为 null，不能视为人工验证。出现后保持可读，尾字持续至该句退出。已出现的字按同一句累计显示。','',
 '| 行 | 原文 | 首字帧 | 尾字帧 | 估计拖音起点（秒） | 来源 |',
 '|---|---|---:|---:|---:|---|']
for l in r['lines']:
    tail=l['estimatedSustainStart']
    lines.append(f"| {l['id']+1} | {l['text']} | {l['tokens'][0]['startFrame']} | {l['tokens'][-1]['startFrame']} | {tail if tail else '—'} | 人声窗口均分 |")
lines += ['',
 '19 句均输出开头、中间、完整状态的检查帧，见 `audit-frames/` 和 `19句逐字进度检查.jpg`。末句“丽”在估计拖音起点前后显现，直到 103.9 秒歌词退出；随后为 solo。','',
 '真实音频起点保持为解码后的第 0 秒。样段为原曲 51–76 秒，三个检查点均为零样本偏移，相关系数均大于 0.9996；记录见 `preview-audio-verification.json`。最终 124.3 秒早于 LRC 下一段人声 124.322 秒。没有人工试听认证。','',
 '毫秒时间到帧号采用最近帧舍入，误差不超过半帧。这验证的是对配置标记的落帧，不能将估算字时误称为相对真实演唱小于一帧。','',
 '后续手工校准请修改 `src/v2/timing-overrides.json`，重新分析会保留它。']
(out/'逐字时间报告.md').write_text('\n'.join(lines)+'\n',encoding='utf8')
(out/'配乐与修改说明.md').write_text((ROOT/'README-V2.md').read_text(encoding='utf8'),encoding='utf8')
print('Saved timing report and edit/music instructions.')
