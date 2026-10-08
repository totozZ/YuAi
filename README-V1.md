# 雨爱 · 歌词雨景影片

1920×1080 / 30 fps / Rec.709 / SVG 矢量场景 / 19 行动态歌词 / 完整第一段与间奏。

最终无声成片：`out/雨爱-歌词雨景-1080p-无声.mp4`。

副歌参考预览：`out/雨爱-副歌预览-含参考音频.mp4`。此文件用于查看音乐与画面关系；正式成片没有音频轨。

## 打开与导出

当前电脑的 Node.js、Python + NumPy、FFmpeg 和中文字体已可用。

```powershell
npm.cmd ci
npm.cmd run studio
```

Remotion Studio 中选择 `RainLove` 即可逐帧查看完整影片，预览会播放参考音频。`RainLoveReview` 用于导出带音频的校对片段。

```powershell
npm.cmd run check
npm.cmd run stills
npm.cmd run preview
npm.cmd run render
npm.cmd run verify
npm.cmd run verify:preview
npm.cmd run contact-sheet
```

`stills` 输出 10 张场景关键帧与 19 张逐句检查帧；`preview` 输出从原曲 00:50 开始的 13 秒副歌；`render` 输出完整无声片；`verify` 使用 FFprobe 核验成片；`verify:preview` 检验预览音轨与原曲区间的采样相关性；`contact-sheet` 将逐句检查帧合成为分镜总览。

## 素材与同步

- 原音频：根目录 `雨爱-杨丞琳.mp3`，不改变原文件、不去除起始静音。
- 毫秒歌词：`geci/geciLRC.txt`；与 `geci/geci.txt` 的前 19 行逐一核对。
- 集中时间轴：`src/timeline.json`。逐句起点四舍五入到最近帧，误差不超过半帧。
- LRC 的最后一个空白标记为 01:43.903，下一段人声标记为 02:04.322；成片以此前的整帧边界 02:04.300 结束，共 3729 帧。
- 节奏候选由实际 MP3 的对数频谱正向变化提取，不假定固定 BPM。它们控制涟漪、轻微镜头响应和环境节奏，歌词起点仍以 LRC 为准。
- LRC 不包含逐字时间。字符依次入场属于排版动画，不代表逐字演唱校准。

这套时间轴已做程序核验和静帧视觉检查。源文件边界以用户提供的 LRC 为依据，未声称完成对人声起止的人工试听。可用 Studio 的参考音轨做最后听审；需调整时直接修改对应帧号。

后期把同一份原 MP3 的解码起点与视频第 0 秒对齐，无需额外平移或删除前奏。详见 `out/配乐对齐说明.md`。

## 修改画面

- `src/Scenery.tsx`：天空、城市、窗框、人物、雨滴、倒影和彩虹。
- `src/TypographicRain.tsx`：逐字入场、窗框遮罩、重影聚焦、抽离、涟漪、透明、积累和弧线排版。
- `src/Film.tsx`：场景切换、色温变化、参考音轨和首尾淡入淡出。
- `src/timeline.json`：每句原文、短语、位置、字号、起止帧、动效类型、场景和节奏事件。

`visualOffsetFrames` 是统一的视觉偏移：正值让画面相对参考音频延后，负值提前。最终片长保持不变，首尾淡出仍锚定导出边界。逐句修改优先直接调整歌词起止帧，并保持相邻句衔接。

颜色与随机细节是固定的，所有运动只依赖帧号，无浏览器实时计时或随机漂移。

## 重新分析素材

```powershell
npm.cmd run prepare:media
```

此命令从原始素材重新生成 `src/timeline.json`、参考音频副本和分析结果，会覆盖时间轴中的手工修改。先备份已经校准的时间轴。

换电脑时，音频分析与分镜总览所需的 Python 依赖可通过 `python -m pip install -r requirements.txt` 安装；预览和渲染现有工程只需要 Node.js。

字体从本机 `C:/Windows/Fonts/msyh.ttc` 复制到 `public/fonts/scene-font.ttc`，工程不通过网络加载字体。换电脑时可在该位置放置兼容的中文字体并更新字体格式；原音频与字体副本不纳入版本控制。

依赖锁定在 `package-lock.json`。原歌曲和原歌词文件始终保留。
