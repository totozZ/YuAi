export type Token = {text: string; sourceStart: number; startFrame: number; endFrame: number; method: string; confidence: number|null};
export type WordLine = {id: number; text: string; startFrame: number; endFrame: number; vocalEndSeconds: number; tokens: Token[]; fallbackReason: string|null};
export type WordTiming = {version: number; fps: number; durationInFrames: number; sourceAudioSha256: string; audioOffsetFrames: number; vocalSeparated: boolean; lines: WordLine[]; errors: string[]};
export type Transition = 'iris'|'frame'|'prism'|'ribbon'|'shards'|'ripple';
export type Shot = {
  id: number; art: number; startFrame: number; endFrame: number;
  cameraFrom: [number,number,number,number]; cameraTo: [number,number,number,number];
  transition: Transition; layout: 'left'|'right'|'center'|'arc';
  texture: 'glass'|'dew'|'ribbon';
};
