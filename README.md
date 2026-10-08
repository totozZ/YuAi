# 雨爱 · 动态歌词 MV

《雨爱》是一支以歌词为主角的动态排版音乐视觉作品。汉字与英文跟随人声逐步建立，在连续镜头中分离、重组，演化成线条、圆环与记忆网格。画面从主歌的深墨色空间，转向副歌的雾蓝与淡紫，最终在彩虹和间奏中收束为暖白光谱。项目使用 TypeScript、React、Remotion 与 SVG 制作，提供可编辑的逐字时间、音乐事件和视觉参数，并支持导出 1080p 无声视频。

最新版本 **V3.1**：1920×1080、30 fps、124.3 秒、3729 帧，H.264 / Rec.709，无音频流。
成片：`out/v3.1/雨爱-V3.1-雾蓝光谱-1080p-无声.mp4`。

## 运行

需要 Node.js（已验证 24）、FFmpeg / FFprobe；依赖由 `package-lock.json` 锁定。

```powershell
npm ci
npm run studio
npm run preview:chorus:v31
npm run render:v31
npm run verify:v31
```

Studio 选择 `RainLoveV31`；预览可听原曲。旧版入口 `RainLoveV3` 保留。

## 修改与配乐

- 逐字／逐句／音乐事件校准：`src/v3/overrides.json`。
- 段落背景、配色与几何强度：`src/v3/scene-style.ts`；调整后运行 `npm run check:v31`。
- 后期将根目录同一份 `雨爱-杨丞琳.mp3` 从视频 **0 秒**加入，保留开头静音。

详见 [V3.1 使用说明](README-V3.1.md) 和 [中文简介](项目简介.md)。V1、V2、V3 的成片与详细说明保留。
