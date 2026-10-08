import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const timeline=JSON.parse(readFileSync(path.join(root,'src/timeline.json'),'utf8'));
const target=path.join(root,'out/雨爱-歌词雨景-1080p-无声.mp4');
const result=spawnSync('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',target],{encoding:'utf8'});
if(result.status!==0) throw new Error(result.stderr);
const metadata=JSON.parse(result.stdout);
const video=metadata.streams.find(s=>s.codec_type==='video');
assert.ok(video);
assert.equal(metadata.streams.length,1,'Final output must contain one video stream and no audio.');
assert.equal(video.codec_name,'h264');
assert.equal(video.pix_fmt,'yuv420p');
assert.equal(video.color_range,'tv');
assert.equal(video.color_space,'bt709');
assert.equal(video.width,1920);
assert.equal(video.height,1080);
assert.equal(video.avg_frame_rate,'30/1');
assert.equal(Number(video.nb_read_frames),timeline.durationInFrames);
assert.ok(Math.abs(Number(video.duration)-timeline.durationInFrames/30)<.001);
assert.ok(Number(video.duration)<=timeline.nextVocalSeconds);
writeFileSync(path.join(root,'out/verification.json'),JSON.stringify({status:'passed',specifications:metadata,
  lyricCount:timeline.lyrics.length,sourceAudioSha256:timeline.audioSha256,
  synchronization:'Line starts: user supplied millisecond LRC. Rhythmic accents: audio-derived onset candidates. Human listening not performed.'},null,2));
console.log(`Verified silent H.264 yuv420p, 1920×1080, 30fps, ${video.nb_read_frames} frames, ${video.duration}s.`);
