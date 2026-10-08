# 《雨爱》V2：精绘与逐字歌词

成片：1920×1080、30 fps、3729 帧（124.300 秒），H.264、yuv420p、Rec.709，无音频流。第一段 19 行歌词，歌词在 103.900 秒退出，后续 solo 保留到下一段人声前。V1 文件仍在 `out/`，V2 文件位于 `out/v2/`。

## 预览与导出

需要 Node.js、FFmpeg；依赖版本由 `package-lock.json` 锁定。解压工程后执行：

```powershell
npm ci
npm run studio
npm run check:v2
npm run keyframes:v2
npm run preview:v2
npm run audit:v2
npm run render:v2
npm run verify:v2
npm run verify:preview:v2
npm run contact-sheet:v2
```

Studio 中选择 `RainLoveV2`；预览会播放参考音频。正式导出固定静音。`RainLoveV2Review` 用于带音乐检查。

样段从原曲 51.000 秒到 76.000 秒，共 750 帧。输出某帧：`node scripts/render-v2.mjs frame 2979`。单句检查：`node scripts/render-v2.mjs audit 19`，行号从 1 起。

## 配乐

将根目录同一份 `雨爱-杨丞琳.mp3` 从视频第 0 秒放入后期软件；保留 MP3 解码后的开头，不裁静音，不增加 MP3 编码器的 start_time 偏移。裁出 124.300 秒范围。画面末尾 1.8 秒淡出，包含在 solo 时长内。

MP3 SHA-256：`d538acd1969921a0ba76e102c89c8e617e3c6922defc4825910936d1ea9bedf7`。

`src/v2/visual-settings.json` 的 `visualOffsetFrames` 可整体平移镜头和文字，正数代表延后；音频仍从第 0 秒播放。默认 0。

## 修改镜头和文字

- `src/v2/direction.ts`：24 个镜头、六组绘景、摄像机起止位置、前景、转场及排版。
- `src/v2/World.tsx`：背景镜头、独立主体局部图层、透明前景视差、折射、光带和沿路径粒子。
- `src/v2/Surface.tsx`：Canvas 水面分条位移和涟漪；所有参数由帧号驱动。
- `src/v2/Transitions.tsx`：窗框、镜面水滴、碎片、光带和光谱遮罩。
- `src/v2/Lyrics.tsx`：横排、错落短语、弧线歌词、描边与擦出、退出时字形粒子。
- `src/v2/glyphs.json`：思源宋体真实字形轮廓、字宽和轮廓采样点；修改字库后运行 `npm run glyphs:v2`。
- `src/v2/word-timing.json`：分析生成的独立逐字时间。
- `src/v2/timing-overrides.json`：独立手工校准。键为 `行号:字序号`（从 0 起），值为绝对出现帧。分析脚本始终保留这份文件。

修改手工时间后运行 `align-v2.py --reuse-raw`，再执行 `npm run check:v2`。例如 `18:4` 对应末句“丽”。`Rainie` 与 `Love` 各为一个单词单位，空格仅用于排版。

## 重新分析音频

Python 3.12 的独立环境已在本机 `.venv-alignment` 中；工程压缩包不包含环境和模型缓存。重建时用 Python 3.12 创建虚拟环境，安装锁定依赖：

```powershell
py -3.12 -m venv .venv-alignment
.venv-alignment\Scripts\python.exe -m pip install -r requirements-alignment.lock.txt
.venv-alignment\Scripts\python.exe scripts\align-v2.py
```

模型和 NLTK 分句资源首次运行会下载到缓存。脚本先用 Demucs `htdemucs` 分离人声，再将已提供的歌词输入 WhisperX 字符强制对齐，不运行歌词识别或改写。

这次 19 句都因至少一个字符低置信度未通过整句检查。正式时间为 **163 个估算单位（161 个中文字、2 个英文单词）**，直接采用的完整模型对齐字符为 0。按照有效人声窗口均分，跳过能量检测到的停顿，预留至少 0.3 秒整句阅读；其中 17 句用相邻高置信度片段的边界估计尾字拖音起点，再保留尾字。该边界是估计，不能视为精确咬字时间。

原始模型候选位于 `.cache/v2/raw-char-alignment.json`，可用 `--reuse-raw` 重算分配而不再运行模型。重新分析不会改写美术配置或手工校准文件。详细来源见 `out/v2/逐字时间报告.md` 与 JSON。

## 验证范围

程序检查原文覆盖、重复字顺序、帧界、逐步显字、真实字宽安全边距、24 镜头连续性和音频哈希；输出 19 句的开头、中间、完整状态，共 57 张检查帧。样段音轨在前、中、后三处做区间相关性检查。FFprobe 验证最终编码和完整帧数。

动作严格落在配置帧上，毫秒到 30 fps 帧号的舍入误差不超过半帧。**估算的逐字时间没有人工试听认证，也没有宣称相对真实咬字误差小于一帧。** Solo 终点沿用用户已确认的 LRC 边界和正确音频位置。

## 美术与字体来源

六组绘景和三件真实 Alpha 前景由内置 imagegen 生成，提示词归档在 `public/v2/art/PROMPTS.md`。图像不含歌词，全部歌词由程序绘制。八类技术分别在镜头、遮罩、光带、水面、折射、粒子与字形退出中实现。

思源宋体 Light 来自 [Adobe Source Han Serif](https://github.com/adobe-fonts/source-han-serif)，许可随字体保存。强制对齐接口参考 [WhisperX alignment](https://github.com/m-bain/whisperX/blob/main/whisperx/alignment.py)，编码参数参考 [Remotion renderMedia](https://www.remotion.dev/docs/renderer/render-media)。
