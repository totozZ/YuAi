# V2 绘景提示词归档

生成工具：本次会话的内置 `imagegen`，2026-10-08。六张主绘景与三张真实 Alpha 前景已保存为 PNG；不依赖外部图像 API 或运行时生成。本页保留统一风格要求和各图场景要求的整理版，便于以后续绘。

## 统一风格要求

> Use the supplied pavilion painting ONLY as a STYLE REFERENCE, not an edit target. Match its extremely refined cinematic dream realism, intricate crystal detail, pearl-blue / lavender / silver palette and painterly photographic light. One single widescreen 16:9 painting, ideally 3840x2160 detail, no panels or collage. This is a music film about yearning, memory, transparency and eventual hope. No people, no text, no letters, no typography, no logos, no watermark. Preserve open atmospheric areas for later animated lyrics. Rich detailed material surfaces and deep layered perspective.

第一张先建立玻璃亭、镜面湖、珍珠蓝与灰紫、细金属轮廓、云山远景的统一视觉语言。后五张以第一张作为风格参考，保持材质、摄影光线和配色，改变构图与情绪。

## 各图场景要求

| 文件 | 画面与构图 |
|---|---|
| `01-pavilion.png` | Glass pavilion floating just above a mirror lake, exquisite fine gold frames and crystal glass, translucent ivory curtains, cloudy mountain horizon. Pavilion on the right, open negative space on the left for title. Pearl blue, lavender, restrained warm interior lights, intimate dream realism. |
| `02-skyglass.png` | A tall ornate glass portal on the left containing an entire suspended sky and cloud system. Clouds continue through the portal into the distant mirror lake. Empty atmospheric right side for lyrics. Match the pavilion's crystalline surfaces and fine gold detail. |
| `03-distance.png` | Two halves of the glass room gradually separated across space above the lake. Tiny transparent window fragments and water droplets connect them in a floating trail. Open central space, melancholic blue cloudscape, delicate mirror reflections. |
| `04-ribbons.png` | A fine transparent room on the right threaded by a large flowing S-shaped ribbon of liquid glass and light. Ribbon curves toward the water and becomes delicate ripples and suspended beads. Open left side for lyrics, exquisite refraction, gentle silver-gold highlights. |
| `05-memory.png` | A detailed transparent architecture made of remembered room fragments, floating frames, glass leaves and filigree, with a spiral stair connecting fragile rooms on the left. Atmospheric right side for lyrics. Reflective lake, lavender sky and restrained warm memory light. |
| `06-spectrum.png` | The memory structure becomes a luminous prism garden on the right. An elegant glass arch refracts a subtle rainbow, crystalline leaves and curtains open toward the dawn. Mirror lake carries a softened spectral reflection; warm gold appears within the established cool palette. |

## 透明前景要求

同样以玻璃亭为风格参考，分别调用 imagegen，并明确设置 `transparent_background=true`。不要人物、文字、边框外背景或接地阴影；保持精细金属线、真实玻璃与折射细节。

| 文件 | 素材要求 |
|---|---|
| `fg-droplets.png` | Isolated delicate vine of glass water droplets and transparent leaves, fine gold links, several large refractive beads, diagonal arrangement; plenty of transparent empty space. |
| `fg-frame.png` | Isolated curved ornamental glass window frame entering from the right edge, thin gold filigree, suspended dew droplets, pearl-blue refraction. Open center and transparent background. |
| `fg-ribbon.png` | One isolated flowing S-shaped ribbon of transparent liquid glass and silk light, delicate gold edging and glass beads; transparent background. |

主绘景原始尺寸约 1672×941（分离房间为 1672×940），按影片构图缩放到 1080p。前景为 RGBA，包含真实透明像素。歌词全部来自程序的 SVG 字形，不生成在图片中。

镜头、独立主体局部图层、透明前景、水面位移、光线和粒子均在工程里完成；原始绘景 PNG 保留以便修改。
