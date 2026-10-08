# 《雨爱》V3.1：雾蓝光谱

V3.1 沿用 V3 的 19 句歌词、163 个逐字／英文词单位和既有时间校准，增加音乐事件驱动的背景场景与统一配色。1920×1080、30 fps、124.3 秒、3729 帧；成片为 H.264、yuv420p、Rec.709、CRF 18，无音频流。

成片：`out/v3.1/雨爱-V3.1-雾蓝光谱-1080p-无声.mp4`。副歌样段：`out/v3.1/雨爱-V3.1-副歌样段-含音乐.mp4`，对应原曲 50–76 秒，780 帧。工程包与场景总览在同一目录。

## 运行与检查

Node 24 已验证。安装 Node 依赖：`npm ci`；正常预览／导出使用工程自带的矢量字形，不需要安装中文字体或音频模型。FFmpeg / FFprobe 须在 PATH。Python 检查和总览脚本需要 numpy、Pillow。

```powershell
npm run studio               # 选择 RainLoveV31，预览播放参考音乐
npm run check:v31            # 歌词、时间、安全区、配色与旧版保留检查
npm run scenes:v31           # 背景与切换关键帧
npm run audit:v31            # 19 句首字／中段／完整检查
npm run preview:chorus:v31   # 原曲 50–76 秒，带音乐
npm run verify:preview:v31   # 编码及样段音轨区间相关性
npm run render:v31           # 3729 帧无声全片
npm run verify:v31           # FFprobe 核验规格及无音频流
npm run inspect:v31          # 实际 MP4 抽帧及暖白终帧检查
npm run contact-sheet:v31    # 场景总览与逐字检查图
npm run package:v31          # 可修改工程压缩包
```

任意帧：`node scripts/render-v3.mjs frame 2253 --color`。原 V3 外观通过 `RainLoveV3` 或原 `render:v3` 命令预览／导出。V3.1 的导出全部进入 `out/v3.1/`。

## 场景与修改

| 事件 | 默认帧号 | 背景与几何 |
|---|---:|---|
| cut-8 | 1528 | 雾蓝；窗格展开成透视平面与流动线带 |
| cut-13 | 2253 | 淡紫；列阵转为记忆网格 |
| section-hope | 2795 | 网格逐步打开，向暖米白过渡 |
| section-hope + 100 | 2895 | 暖米白与弧线光场 |
| section-solo | 3117 | 暖白光谱；笔画与曲线逐渐减速 |
| 片尾 | 3670–3728 | 全部文字、纹理与几何淡出，停在暖白 |

`src/v3/scene-style.ts` 集中保存锚点关联、底色、文字色、几何色、段落强度与变化时长。`src/v3/SceneBackdrop.tsx` 定义共用摄像机的透视平面、网格与光场；中间阅读区域通过遮罩留白。

主文字、轮廓、已唱文字残影和运动模糊的每个采样帧使用同一配色函数。深色阶段为暖白字，浅色阶段为深色字。两处副歌入口随原有匹配切换同步换色；暖色阶段连续插值。

逐字与音乐事件修正仍在 `src/v3/overrides.json`。`tokenReadFrames` 使用绝对帧号；`eventFrames` 可调整 `cut-8`、`cut-13`、`section-hope` 等事件，相关背景自动跟随。整体视觉偏移默认 0，音轨始终从 0 开始。更多逐字来源与手工调整说明见 [README-V3.md](README-V3.md)。

## 配乐与验证范围

后期把同一份 `雨爱-杨丞琳.mp3` 从视频第 0 秒放入，保留原始开头静音；视频区间为 0–124.300 秒，下一段人声的 LRC 为 124.322 秒。音频不拉伸、不删除换气。

本次仅修改视觉与文档，既有逐字、音乐事件、手工校准、排版和镜头时间数据保持原样；部分逐字时间仍是 CTC 或局部插值估计。代码检查不会把估算提升为人工认证的精确咬字时间。

检查证据位于 `out/v3.1/`：`source-validation.json`、`scene-validation.json`、`preview-audio-verification.json`、`verification.json` 和 `encoded-frame-verification.json`。旧 V3 的 MP4、逐字与编排文件通过 SHA256 比较确认保留。
