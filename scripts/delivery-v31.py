"""Collect the completed V3.1 delivery files and their verification evidence."""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'out' / 'v3.1'
reports = {}
for name in ['scene-validation', 'preview-video-verification', 'preview-audio-verification',
             'preview-scene-verification', 'verification', 'encoded-frame-verification']:
    reports[name] = json.loads((OUT / f'{name}.json').read_text(encoding='utf8'))
    assert reports[name].get('status') == 'passed', name
assert not reports['scene-validation']['baselineChanges']

files = {}
for relative in ['out/v3.1/雨爱-V3.1-雾蓝光谱-1080p-无声.mp4',
                 'out/v3.1/雨爱-V3.1-副歌样段-含音乐.mp4',
                 'out/v3.1/V3.1-场景变化总览.jpg', 'README.md', 'README-V3.1.md', '项目简介.md']:
    file = ROOT / relative
    files[relative] = {'bytes': file.stat().st_size,
                       'sha256': hashlib.sha256(file.read_bytes()).hexdigest()}
manifest = {'version': '3.1', 'status': 'passed', 'files': files,
            'referenceAudio': {'file': '雨爱-杨丞琳.mp3', 'offsetSeconds': 0,
                               'sha256': hashlib.sha256((ROOT / '雨爱-杨丞琳.mp3').read_bytes()).hexdigest()},
            'film': {'startSeconds': 0, 'endSeconds': 124.3, 'frames': 3729, 'fps': 30,
                     'audioStreams': 0},
            'preview': {'sourceStartSeconds': 50, 'sourceEndSeconds': 76, 'frames': 780},
            'evidence': [f'{name}.json' for name in reports],
            'timingChanged': False, 'oldVersionsPreserved': True,
            'newPhonemeAlignmentOrListeningClaim': False}
(OUT / 'delivery-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf8')
(OUT / '交付与检查.md').write_text('''# 《雨爱》V3.1 交付与检查

成片为 `雨爱-V3.1-雾蓝光谱-1080p-无声.mp4`：1920×1080、30 fps、124.3 秒、3729 帧，H.264、yuv420p、Rec.709，无音频流。后期将根目录同一份 MP3 从视频 0 秒加入，保留起始静音。

`雨爱-V3.1-副歌样段-含音乐.mp4` 对应原曲 50–76 秒，可直接查看两个副歌入口的颜色与几何变化。`V3.1-场景变化总览.jpg` 展示主歌、雾蓝、淡紫、暖色末句、solo 与暖白终帧。

## 本次变化

- 1528 帧：深墨色切换为雾蓝，窗格展开为透视平面和流动线带。
- 2253 帧：切换为淡紫，雨滴列阵进入记忆网格。
- 2795–2895 帧：底色与字色连续转暖，网格向弧线光场打开。
- Solo：暖白光谱逐渐减速，所有元素在原时长内退出，终帧停在暖白。
- 背景、字色、轮廓与运动模糊采样共用配色，背景几何共用歌词摄像机。

## 验证结果

编码、尺寸、帧率、总帧数、Rec.709 和无音频流均通过 FFprobe 检查。实际 MP4 逐帧解码未发现歌词区间意外空帧；终帧色值及均匀度通过检查。样段三处音轨相关性检查偏移均为 0；颜色变化落在既定副歌入口帧。

第一段 19 句原文、逐字校准、音乐事件、镜头与排版时间保持不变；源文件和原 V3 成片的 SHA256 与修改前一致。逐字时间继承 V3，其中估算项仍保留原来源标记，本次没有重新宣称逐音素对齐或人工试听精度。

工程包 `雨爱-V3.1-可修改工程.zip` 包含背景配置、字形、音频参考、可编辑源码、两份中文入口文档和详细说明。根目录 `README.md` 为简明使用入口，`项目简介.md` 为中文简介。依赖通过 `npm ci` 安装，Studio 选择 `RainLoveV31`；原 `RainLoveV3` 外观保留。

详细验证数据与交付文件校验值见本目录 JSON 报告及 `delivery-manifest.json`。
''', encoding='utf8')
print('V3.1 delivery manifest and Chinese inspection report written.')
