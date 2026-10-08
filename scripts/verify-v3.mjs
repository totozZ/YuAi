import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const previews=process.argv.includes('--previews');
const targets=previews?[
  ['雨爱-V3-主歌样段-含音乐.mp4',840,28],['雨爱-V3-副歌样段-含音乐.mp4',780,26]
]:[['雨爱-V3-连续文字空间-1080p-无声.mp4',3729,124.3]];
const checks=[];
for(const [name,frames,duration] of targets){
  const result=spawnSync('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',path.join(root,'out/v3',name)],{encoding:'utf8'});
  if(result.status!==0)throw new Error(result.stderr);
  const metadata=JSON.parse(result.stdout),video=metadata.streams.find(s=>s.codec_type==='video');
  assert.equal(video.codec_name,'h264');assert.equal(video.pix_fmt,'yuv420p');assert.equal(video.color_range,'tv');
  for(const property of ['color_space','color_transfer','color_primaries'])assert.equal(video[property],'bt709');
  assert.equal(video.width,1920);assert.equal(video.height,1080);assert.equal(video.avg_frame_rate,'30/1');
  assert.equal(Number(video.nb_read_frames),frames);assert.ok(Math.abs(Number(video.duration)-duration)<.001);
  assert.equal(metadata.streams.filter(s=>s.codec_type==='audio').length,previews?1:0);
  if(!previews){assert.equal(metadata.streams.length,1);assert.ok(duration<124.322);}
  checks.push({name,status:'passed',metadata});
  console.log(`Verified ${name}: ${frames} frames / ${duration}s / ${previews?'AAC reference music':'no audio stream'}.`);
}
writeFileSync(path.join(root,'out/v3',previews?'previews-video-verification.json':'verification.json'),JSON.stringify({status:'passed',checks},null,2));
