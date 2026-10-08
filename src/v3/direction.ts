import type {Direction} from './types';
// World anchors belong to a continuous route, not independent screen pages.
export const DIRECTIONS:Direction[]=[
  {id:0,world:[0,0],rotation:0,layout:'window',entry:'trace',handoff:'baseline',key:'天',bridge:'window',intensity:.22,lead:8},
  {id:1,world:[540,-90],rotation:-3,layout:'expression',entry:'cross',handoff:'rain',key:'表情',bridge:'rain',intensity:.25,lead:9},
  {id:2,world:[910,440],rotation:0,layout:'rainfall',entry:'rain',handoff:'focus',key:'雨',bridge:'rain',intensity:.32,lead:7},
  {id:3,world:[1510,530],rotation:2,layout:'focus',entry:'focus',handoff:'gap',key:'不想',bridge:'rail',intensity:.25,lead:9},
  {id:4,world:[2140,500],rotation:0,layout:'distance',entry:'split',handoff:'depart',key:'抽离',bridge:'rail',intensity:.30,lead:8},
  {id:5,world:[2730,150],rotation:-4,layout:'shutter',entry:'shutter',handoff:'frame',key:'剧情',bridge:'window',intensity:.38,lead:8},
  {id:6,world:[3050,780],rotation:1,layout:'heart',entry:'arc',handoff:'ring',key:'泪',bridge:'ring',intensity:.50,lead:7},
  {id:7,world:[3700,660],rotation:0,layout:'release',entry:'release',handoff:'stem-cut',key:'放弃',bridge:'rail',intensity:.62,lead:6},
  {id:8,world:[4300,690],rotation:-2,layout:'droplet-columns',entry:'impulse',handoff:'channel',key:'清晰',bridge:'rain',intensity:.90,lead:6},
  {id:9,world:[4900,1110],rotation:3,layout:'breath',entry:'cross',handoff:'inside',key:'呼吸',bridge:'window',intensity:.85,lead:7},
  {id:10,world:[5510,1040],rotation:0,layout:'horizontal-contrast',entry:'impulse',handoff:'continue',key:'不停',bridge:'rail',intensity:.90,lead:6},
  {id:11,world:[6120,490],rotation:-3,layout:'transparent',entry:'flow',handoff:'outline',key:'透明',bridge:'window',intensity:.82,lead:8},
  {id:12,world:[6920,660],rotation:0,layout:'english',entry:'depth',handoff:'letter-gap',key:'勇气',bridge:'ring',intensity:.90,lead:7},
  {id:13,world:[7450,1410],rotation:4,layout:'accumulation',entry:'cascade',handoff:'archive',key:'累积',bridge:'grid',intensity:.95,lead:6},
  {id:14,world:[6900,2060],rotation:-3,layout:'memory',entry:'stack',handoff:'fold',key:'记忆',bridge:'grid',intensity:.88,lead:8},
  {id:15,world:[7880,2070],rotation:0,layout:'vertical-contrast',entry:'fold',handoff:'container',key:'不停',bridge:'window',intensity:.95,lead:7},
  {id:16,world:[8520,1590],rotation:3,layout:'secret',entry:'unseal',handoff:'extend',key:'延续',bridge:'rail',intensity:.83,lead:8},
  {id:17,world:[9190,1640],rotation:0,layout:'belief',entry:'resolve',handoff:'spectrum-open',key:'相信',bridge:'ring',intensity:.65,lead:9},
  {id:18,world:[9910,1080],rotation:0,layout:'rainbow',entry:'arc',handoff:'spectrum',key:'美丽',bridge:'spectrum',intensity:.55,lead:10},
];
export const PALETTE={ink:'#0b1119',paper:'#ece9e0',blue:'#8dabbc',muted:'#51616e',gold:'#d7bc89',spectrum:['#a9bcd2','#b5aacd','#d2a9b8','#debf97','#b7cfbf']};
