# 《雨爱》V3：连续文字空间

1920×1080 / 30 fps / 3729 帧 / 124.3 秒。成片位于 `out/v3/雨爱-V3-连续文字空间-1080p-无声.mp4`。H.264、yuv420p、Rec.709、CRF 18，无音频流。V1、V2 的源码与已有成片保留。

后期把根目录的 `雨爱-杨丞琳.mp3` 从视频第 0 秒加入；不要裁开头静音，不要拉伸音轨。视频只使用原曲 0–124.300 秒，下一段人声 LRC 为 124.322 秒。原音频 SHA256：`d538acd1969921a0ba76e102c89c8e617e3c6922defc4825910936d1ea9bedf7`。

## 预览与导出

Node 24 已验证；依赖在 package-lock.json 锁定。工程中的字形 JSON 自带路径，正常预览／导出不依赖电脑安装中文字体。

```powershell
npm ci
npm run studio
# 在 Studio 中选择 RainLoveV3，可听参考音乐；正式渲染关闭音频。
npm run check:v3
npm run stills:v3
npm run preview:verse:v3   # 原曲 14–42 秒，28 秒，带音乐
npm run preview:chorus:v3  # 原曲 50–76 秒，26 秒，带音乐
npm run render:v3         # 全片无声
npm run verify:v3
npm run verify:previews:v3
```

任意关键帧：`node scripts/render-v3.mjs frame 1528`。逐句首／中／末检查：`npm run audit:v3`。跨句前后检查：`npm run bridges:v3`。`npm run contact-sheet:v3` 输出总览与报告。FFmpeg / FFprobe 须在 PATH；Python 检查脚本需要 numpy 和 Pillow。

## 独立可编辑的参数

| 内容 | 文件 |
|---|---|
| 原歌词及句级 LRC | geci/geciLRC.txt、geci/geci.txt、src/timeline.json |
| 自动逐字时刻／来源／置信度 | src/v3/generated-timing.json |
| 手工逐字／句级／视觉整体／音乐事件修正 | src/v3/overrides.json |
| 重音／鼓点／段落／solo 事件 | src/v3/music-events.json |
| 各句动作、世界位置、连接方式、强度 | src/v3/direction.ts |
| 每句独特排版、字重、字号、间距 | src/v3/layout.ts |
| 持续镜头及阅读跟随 | src/v3/camera.ts |
| 字符 Position／Rotation／Scale／Opacity／Blur／Depth／Tilt | src/v3/poses.ts |
| 笔画转几何、共享桥接节点、solo 曲线 | src/v3/WorldGeometry.tsx |
| 清晰文字与 5 次采样／90° 快门运动模糊 | src/v3/TypeWorld.tsx |

校准例子（帧号从视频 0 开始，30 帧 = 1 秒）：

```json
{
  "visualOffsetFrames": 0,
  "lineOffsetFrames": {},
  "tokenReadFrames": {"l00-t01": 490},
  "eventFrames": {"cut-8": 1528}
}
```

`readableFrame` 是字已经清晰到位的时刻。准备动作在此之前，字不会在到位之后继续等待填充。`tokenReadFrames` 优先于自动时刻和句级偏移。整体视觉偏移的正值让视觉延后、负值提前，音轨始终从 0 开始。改完运行 `check:v3`；时刻必须保持顺序并给完整歌词留出阅读时间。

## 重新分析或生成字形

已经生成的逐字、鼓点和字形随工程交付，修改排版不需要安装音频模型。若重新分析：创建 Python 3.12 独立环境，安装 `requirements-alignment.lock.txt`；先运行 `.venv-alignment/Scripts/python.exe scripts/align-v2.py` 生成分离人声与原始强制对齐候选，再运行 `.venv-alignment/Scripts/python.exe scripts/analyze-v3.py`。模型缓存不放入工程压缩包；重新分析会下载必要模型。V3 分析只更新 generated-timing / music-events，不覆盖手工校准与设计。

字体为官方思源黑体 SC Light、Regular、Bold；英文 Inter 4.1 Light、Medium、Bold，附 OFL 许可。`python scripts/fonts-v3.py` 下载，`npm run glyphs:v3` 重建矢量字形、真实字宽和字偶距。标题与歌词均为程序绘制字形，背景无生成图片文字。

## 检查范围

验证了 19 句原文、163 单位、清晰帧、阅读安全区、顺序、完整阅读平台、非硬切镜头速度连续、手工覆盖、同源音轨与编码。自动对齐的歌唱时间仍是估计；`out/v3/V3-同步来源与修正报告.md` 区分全部来源，不将插值标为精确对齐。两个带音乐样段供审看实际节奏与观感。

此版使用同一场景图、持续节点和连续镜头路线；旧文字逐个重排为已唱内容的纹理，关键词轮廓采样连接到下一句的线、环、网格。两处鼓轨事件产生匹配跳切；其余镜头用 Hermite 曲线，单字准备使用不同的快速减速、下落、景深和折叠曲线。阅读文字到位后保持清晰，模糊只用于高速准备和重组层。
