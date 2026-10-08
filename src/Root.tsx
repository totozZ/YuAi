import React from 'react';
import {Composition} from 'remotion';
import {Film} from './Film';
import source from './timeline.json';
import type {Timeline} from './types';
import {FilmV2,V2_TIMING} from './v2/FilmV2';
import visualSettings from './v2/visual-settings.json';
import {FilmV3,V3_DEFAULTS} from './v3/FilmV3';

const timeline=source as Timeline;
export const Root: React.FC = () => <>
  <Composition id="RainLoveV3" component={FilmV3} width={1920} height={1080} fps={30} durationInFrames={3729} defaultProps={V3_DEFAULTS}/>
  <Composition id="RainLoveV3Review" component={FilmV3} width={1920} height={1080} fps={30} durationInFrames={3729} defaultProps={{...V3_DEFAULTS,reviewAudio:true}}/>
  <Composition id="RainLoveV2" component={FilmV2} width={timeline.width} height={timeline.height} fps={timeline.fps}
    durationInFrames={timeline.durationInFrames} defaultProps={{timing:V2_TIMING,reviewAudio:false,visualOffsetFrames:visualSettings.visualOffsetFrames}}/>
  <Composition id="RainLoveV2Review" component={FilmV2} width={timeline.width} height={timeline.height} fps={timeline.fps}
    durationInFrames={timeline.durationInFrames} defaultProps={{timing:V2_TIMING,reviewAudio:true,visualOffsetFrames:visualSettings.visualOffsetFrames}}/>
  <Composition id="RainLove" component={Film} width={timeline.width} height={timeline.height} fps={timeline.fps}
    durationInFrames={timeline.durationInFrames} defaultProps={{timeline,reviewAudio:false}}
    calculateMetadata={({props})=>({durationInFrames:props.timeline.durationInFrames, fps:props.timeline.fps, width:props.timeline.width,height:props.timeline.height})}/>
  <Composition id="RainLoveReview" component={Film} width={timeline.width} height={timeline.height} fps={timeline.fps}
    durationInFrames={timeline.durationInFrames} defaultProps={{timeline,reviewAudio:true}}
    calculateMetadata={({props})=>({durationInFrames:props.timeline.durationInFrames, fps:props.timeline.fps, width:props.timeline.width,height:props.timeline.height})}/>
</>;
