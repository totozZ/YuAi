"""Record finished deliverables and human-readable continuous choreography."""
from pathlib import Path
import json,hashlib
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'out'/'v3'
timing=json.loads((ROOT/'src'/'v3'/'generated-timing.json').read_text(encoding='utf8'))
directions=json.loads((OUT/'choreography.json').read_text(encoding='utf8'))
descriptions=[
    ('窗格基线逐字建立','基线伸向两组表情文字'),
    ('两组错落短语交错入场','表情字形成为雨线'),
    ('下落急停；第二个雨放大','雨线延伸进入聚焦区域'),
    ('模糊准备后在演唱帧清晰；不想加重','留白成为抽离的通道'),
    ('离开你与我抽离分居两侧','拉开的间隙承接下一句'),
    ('上下遮挡条揭开；剧情放大','轮廓重组为框结构'),
    ('泪字放大；流在心里保持清晰','泪字轮廓逐步转为圆环'),
    ('字距张开；完整阅读后放大笔画','沿竖向笔画推进，在第一副歌鼓点匹配跳切'),
    ('听雨与清晰形成尺寸对比；一滴滴递进','列阵延伸进入呼吸的空间'),
    ('呼吸局部张合；其余文字交错到位','爱里与框空间容纳后续文字'),
    ('横向大小对比；不停局部重音','保留同方向的运动与基线'),
    ('两组短语沿同一空间推进；透明转轮廓','轮廓展开为英文平面'),
    ('中文与两个英文词分层；读完后推进 Love','英文间隙放大，按鼓轨事件切入重复段'),
    ('复用雨滴列阵，累积加重并递增字号','原笔画重组为记忆网格'),
    ('歌词与已唱过的文字形成档案层','文字折叠并沿网格移向下一句'),
    ('重复句改为纵向对比和局部透视','折叠边缘接成秘密容器'),
    ('两组短语打开围合空间','延续的基线传给相信'),
    ('相信成为清晰中心；看到沿延长线建立','负空间与环线带入彩虹弧'),
    ('彩虹末句沿弧逐字到位并保留尾音','既有笔画和弧线转为 solo 光谱')
]
lines=['# V3 连续编排说明','',
       '这 19 组排版位于一条持续的世界路线。镜头以 Hermite 曲线移动；旧句逐个退为纹理，关键词的轮廓点连接到下一句的几何结构。画面不使用绘景图片或整页切换。所有辅助文字都来自已经演唱过的内容。','',
       '| 句 | 原曲起点 | 主体动作 | 下一句连接 |','|---|---:|---|---|']
for cue,(action,bridge) in zip(timing['lines'],descriptions):
    lines.append(f'| {cue["id"]+1:02} {cue["text"]} | {cue["startFrame"]/30:.3f}s | {action} | {bridge} |')
lines += ['', '前奏以雨爱标题、基线及窗框建立空间。Solo 沿用已唱过的笔画与光谱曲线，经历流动、展开和减速收束；混音频谱起音对曲线弯曲和线宽产生选择性响应，最后 3670–3728 帧收至墨色。','',
          '两处匹配跳切绑定 `cut-8`（1528 帧）与 `cut-13`（2253 帧）。放大操作在整句完整可读至少 18 帧以后开始；局部裁切属于后续空间推进。高速文字及这两处文字推进使用 5 次采样、90° 快门运动模糊；主阅读层在清晰帧恢复锐利。','',
          '源数据：`src/v3/direction.ts`；独立逐字时间：`src/v3/generated-timing.json`；手工入口：`src/v3/overrides.json`。实际成片抽帧见 `V3-成片抽帧检查.jpg`，跨句 72 帧见 `V3-跨句连续性检查.jpg`。']
(OUT/'V3-连续编排说明.md').write_text('\n'.join(lines)+'\n',encoding='utf8')
(OUT/'V3-配乐与修改说明.md').write_bytes((ROOT/'README-V3.md').read_bytes())
names=['雨爱-V3-连续文字空间-1080p-无声.mp4','雨爱-V3-主歌样段-含音乐.mp4','雨爱-V3-副歌样段-含音乐.mp4']
files=[]
for name in names:
    file=OUT/name
    files.append({'file':name,'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
report={'version':3,'status':'rendered-and-verified','width':1920,'height':1080,'fps':30,'frames':3729,'durationSeconds':124.3,
        'audioOffsetFrames':0,'reference':'雨爱-杨丞琳.mp3','lyricLines':19,'units':163,
        'humanListening':False,'timingAccuracy':'CTC and interpolated estimates; individual manual overrides supported',
        'evidence':['source-validation.json','verification.json','encoded-frame-verification.json','preview-audio-verification.json'],
        'files':files}
(OUT/'delivery-manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print('Saved delivery manifest, choreography and music/editing instructions.')
