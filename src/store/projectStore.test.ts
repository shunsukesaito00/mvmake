import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from './projectStore'
import { PROJECT_TEMPLATES, TEXT_PRESETS } from '../types/project'
import { buildUserProjectTemplate } from '../utils/userProjectTemplate'
import { PHOTO_GUIDE_SLIDESHOW_STRESS_IMAGE_COUNT } from '../utils/photoGuideSlideshow'
import { applyTextStylePreset, buildSavedTextStylePreset } from '../utils/textStylePresetUtils'
import {
  createBatchTransitionStressProject,
  getBatchTransitionStressStats,
} from '../utils/batchTransitionStressSetup'
import { seedBatchTransitionRemovalStress } from '../utils/batchTransitionRemovalStressSetup'
import type { AudioClip, ImageClip, MediaAsset, Project, VideoClip } from '../types/project'
import { DEFAULT_AUDIO, DEFAULT_COLOR, DEFAULT_CROP, DEFAULT_DUCKING, DEFAULT_KEN_BURNS, DEFAULT_TRANSFORM, DEFAULT_VISUAL_FADE, normalizeColorAdjustments, normalizeProject } from '../types/project'

const TRACK_V1 = 'track-v1'
const TRACK_V2 = 'track-v2'
const TRACK_TEXT = 'track-text'
const TRACK_BGM = 'track-bgm'

function imageAsset(id: string): MediaAsset {
  return { id, name: `${id}.jpg`, type: 'image', blob: new Blob(), url: `blob:${id}`, duration: 5 }
}

function videoClip(id: string, startTime: number, duration: number, overrides: Partial<VideoClip> = {}): VideoClip {
  return {
    id,
    trackId: TRACK_V1,
    type: 'video',
    mediaId: 'media-v1',
    startTime,
    duration,
    sourceStart: 0,
    sourceDuration: duration,
    transform: { ...DEFAULT_TRANSFORM },
    audio: { ...DEFAULT_AUDIO },
    speed: 1,
    color: { ...DEFAULT_COLOR },
    crop: { ...DEFAULT_CROP },
    ...DEFAULT_VISUAL_FADE,
    ...overrides,
  }
}

function imageClip(id: string, startTime: number, duration: number, overrides: Partial<ImageClip> = {}): ImageClip {
  return {
    id,
    trackId: TRACK_V1,
    type: 'image',
    mediaId: 'img1',
    startTime,
    duration,
    sourceStart: 0,
    sourceDuration: duration,
    transform: { ...DEFAULT_TRANSFORM },
    kenBurns: { ...DEFAULT_KEN_BURNS },
    color: { ...DEFAULT_COLOR },
    crop: { ...DEFAULT_CROP },
    ...DEFAULT_VISUAL_FADE,
    ...overrides,
  }
}

function videoAsset(id: string, duration = 10): MediaAsset {
  return { id, name: `${id}.mp4`, type: 'video', blob: new Blob(), url: `blob:${id}`, duration }
}

function audioClip(id: string, startTime: number, duration: number, overrides: Partial<AudioClip> = {}): AudioClip {
  return {
    id,
    trackId: TRACK_BGM,
    type: 'audio',
    mediaId: 'media-a1',
    startTime,
    duration,
    sourceStart: 0,
    sourceDuration: duration,
    audio: { ...DEFAULT_AUDIO },
    speed: 1,
    ducking: { ...DEFAULT_DUCKING },
    ...overrides,
  }
}

function makeProject(clips: (VideoClip | ImageClip | AudioClip)[] = [], mediaAssets: MediaAsset[] = [], trackId = TRACK_V1): Project {
  const isAudioTrack = trackId === TRACK_BGM
  return {
    id: 'test-project',
    name: 'テスト',
    width: 1920,
    height: 1080,
    fps: 30,
    mediaAssets,
    markers: [],
    tracks: [
      { id: TRACK_V1, name: '映像 1', type: 'video', clips: isAudioTrack ? [] : [...clips as (VideoClip | ImageClip)[]], muted: false, locked: false },
      { id: TRACK_V2, name: '映像 2', type: 'video', clips: [], muted: false, locked: false },
      { id: TRACK_TEXT, name: 'テキスト', type: 'text', clips: [], muted: false, locked: false },
      { id: TRACK_BGM, name: 'BGM', type: 'audio', clips: isAudioTrack ? [...clips as AudioClip[]] : [], muted: false, locked: false },
    ],
  }
}

function setProject(project: Project): void {
  useProjectStore.setState({
    project,
    currentTime: 0,
    selectedClipIds: [],
    selectedClipId: null,
    past: [],
    future: [],
    clipboard: null,
    inPoint: null,
    outPoint: null,
  })
}

function getTrackClips(trackId: string) {
  return useProjectStore.getState().project.tracks.find((t) => t.id === trackId)!.clips
}

beforeEach(() => {
  setProject(makeProject())
})

describe('addSlideshow', () => {
  it('places image clips sequentially with transitions from the 2nd clip', () => {
    setProject(makeProject([], [imageAsset('img1'), imageAsset('img2'), imageAsset('img3')]))

    const placed = useProjectStore.getState().addSlideshow(['img1', 'img2', 'img3'], {
      durationPerImage: 4,
      transitionType: 'crossfade',
      transitionDuration: 0.8,
      kenBurns: true,
    })

    expect(placed).toBe(3)
    const clips = getTrackClips(TRACK_V1) as ImageClip[]
    expect(clips).toHaveLength(3)
    expect(clips.map((c) => c.startTime)).toEqual([0, 4, 8])
    expect(clips[0].transition).toBeUndefined()
    expect(clips[1].transition).toEqual({ type: 'crossfade', duration: 0.8 })
    expect(clips.every((c) => c.kenBurns.enabled)).toBe(true)
  })

  it('appends after existing clips and skips unknown or non-image ids', () => {
    setProject(makeProject([videoClip('c1', 0, 6)], [imageAsset('img1')]))

    const placed = useProjectStore.getState().addSlideshow(['img1', 'missing'], {
      durationPerImage: 3,
      transitionType: 'none',
      transitionDuration: 0.8,
      kenBurns: false,
    })

    expect(placed).toBe(1)
    const clips = getTrackClips(TRACK_V1)
    expect(clips).toHaveLength(2)
    expect(clips[1].startTime).toBe(6)
    expect((clips[1] as ImageClip).transition).toBeUndefined()
  })

  it('returns 0 when no image is given', () => {
    expect(
      useProjectStore.getState().addSlideshow([], {
        durationPerImage: 4,
        transitionType: 'none',
        transitionDuration: 0.8,
        kenBurns: true,
      }),
    ).toBe(0)
    expect(useProjectStore.getState().past).toHaveLength(0)
  })
})

describe('duplicateClipInPlace', () => {
  it('duplicates a clip at the same position with a new id', () => {
    setProject(makeProject([videoClip('c1', 2, 4)]))

    const newId = useProjectStore.getState().duplicateClipInPlace('c1')

    expect(newId).not.toBeNull()
    expect(newId).not.toBe('c1')
    const clips = getTrackClips(TRACK_V1)
    expect(clips).toHaveLength(2)
    const dup = clips.find((c) => c.id === newId)!
    expect(dup.startTime).toBe(2)
    expect(dup.duration).toBe(4)
  })

  it('returns null for a locked track or unknown clip', () => {
    const project = makeProject([videoClip('c1', 0, 4)])
    project.tracks[0].locked = true
    setProject(project)

    expect(useProjectStore.getState().duplicateClipInPlace('c1')).toBeNull()
    expect(useProjectStore.getState().duplicateClipInPlace('missing')).toBeNull()
    expect(getTrackClips(TRACK_V1)).toHaveLength(1)
  })
})

describe('splitClipAt', () => {
  it('splits a clip into two with correct source offsets (speed considered)', () => {
    setProject(makeProject([videoClip('c1', 0, 4, { speed: 2 })]))

    useProjectStore.getState().splitClipAt('c1', 1)

    const clips = getTrackClips(TRACK_V1)
    expect(clips).toHaveLength(2)
    expect(clips[0].duration).toBe(1)
    expect(clips[1].startTime).toBe(1)
    expect(clips[1].duration).toBe(3)
    expect(clips[1].sourceStart).toBe(2)
  })

  it('splits transform keyframes across both clips', () => {
    setProject(makeProject([videoClip('c1', 0, 4, {
      transformKeyframes: [
        { id: 'kf1', time: 0, x: 0.2, y: 0.5, scale: 1, rotation: 0 },
        { id: 'kf2', time: 2, x: 0.8, y: 0.5, scale: 1, rotation: 0 },
        { id: 'kf3', time: 4, x: 0.5, y: 0.5, scale: 1, rotation: 0 },
      ],
    })]))

    useProjectStore.getState().splitClipAt('c1', 2)

    const clips = getTrackClips(TRACK_V1) as VideoClip[]
    expect(clips[0].transformKeyframes?.map((kf) => kf.time)).toEqual([0, 2])
    expect(clips[1].transformKeyframes?.map((kf) => kf.time)).toEqual([0, 2])
    expect(clips[1].transformKeyframes?.[1].x).toBe(0.5)
  })

  it('splits volume keyframes across both clips', () => {
    setProject(makeProject([audioClip('c1', 0, 4, {
      audio: {
        ...DEFAULT_AUDIO,
        volumeKeyframes: [
          { id: 'v1', time: 0, volume: 0.2 },
          { id: 'v2', time: 2, volume: 1 },
          { id: 'v3', time: 4, volume: 0.5 },
        ],
      },
    })], [], TRACK_BGM))

    useProjectStore.getState().splitClipAt('c1', 2)

    const clips = getTrackClips(TRACK_BGM) as AudioClip[]
    expect(clips[0].audio.volumeKeyframes?.map((kf) => kf.time)).toEqual([0, 2])
    expect(clips[1].audio.volumeKeyframes?.map((kf) => kf.time)).toEqual([0, 2])
    expect(clips[1].audio.volumeKeyframes?.[1].volume).toBe(0.5)
  })

  it('splits speed keyframes across both clips', () => {
    setProject(makeProject([videoClip('c1', 0, 4, {
      speedKeyframes: [
        { id: 's1', time: 0, speed: 0.5 },
        { id: 's2', time: 2, speed: 2 },
        { id: 's3', time: 4, speed: 1 },
      ],
    })]))

    useProjectStore.getState().splitClipAt('c1', 2)

    const clips = getTrackClips(TRACK_V1) as VideoClip[]
    expect(clips[0].speedKeyframes?.map((kf) => kf.time)).toEqual([0, 2])
    expect(clips[1].speedKeyframes?.map((kf) => kf.time)).toEqual([0, 2])
    expect(clips[1].speedKeyframes?.[1].speed).toBe(1)
  })

  it('does nothing when split point is outside the clip', () => {
    setProject(makeProject([videoClip('c1', 0, 4)]))
    useProjectStore.getState().splitClipAt('c1', 5)
    expect(getTrackClips(TRACK_V1)).toHaveLength(1)
  })
})

describe('slipSelectedClip with keyframes', () => {
  it('preserves transform keyframes when slipping video', () => {
    const kfs = [{ id: 'kf1', time: 0.5, x: 0.2, y: 0.5, scale: 1, rotation: 0, opacity: 1 }]
    setProject(makeProject(
      [videoClip('c1', 0, 4, { sourceStart: 2, transformKeyframes: kfs })],
      [videoAsset('media-v1', 30)],
    ))
    useProjectStore.setState({ selectedClipId: 'c1' })

    expect(useProjectStore.getState().slipSelectedClip(1)).toBe(true)

    const clip = getTrackClips(TRACK_V1)[0] as VideoClip
    expect(clip.sourceStart).toBe(3)
    expect(clip.transformKeyframes).toEqual(kfs)
  })
})

describe('slideSelectedClip with keyframes', () => {
  it('preserves transform keyframes on selected clip', () => {
    const kfs = [{ id: 'kf1', time: 0.5, x: 0.3, y: 0.5, scale: 1, rotation: 0, opacity: 1 }]
    setProject(makeProject([
      videoClip('c1', 0, 4),
      videoClip('c2', 4, 2, { transformKeyframes: kfs }),
      videoClip('c3', 6, 3),
    ], [videoAsset('media-v1', 30)]))
    useProjectStore.setState({ selectedClipId: 'c2' })

    expect(useProjectStore.getState().slideSelectedClip(0.5)).toBe(true)

    const clip = getTrackClips(TRACK_V1).find((c) => c.id === 'c2') as VideoClip
    expect(clip.transformKeyframes).toEqual(kfs)
    expect(clip.startTime).toBe(4.5)
  })
})

describe('rollingTrimAtEditPoint', () => {
  it('trims adjacent clips at the edit point', () => {
    setProject(makeProject([
      videoClip('c1', 0, 4),
      videoClip('c2', 4, 3),
    ], [videoAsset('media-v1', 30)]))

    expect(useProjectStore.getState().rollingTrimAtEditPoint('c1', 'c2', 0.5)).toBe(true)

    const clips = getTrackClips(TRACK_V1)
    expect(clips.find((c) => c.id === 'c1')!.duration).toBe(4.5)
    expect(clips.find((c) => c.id === 'c2')!.startTime).toBe(4.5)
    expect(clips.find((c) => c.id === 'c2')!.duration).toBe(2.5)
  })

  it('rejects locked tracks', () => {
    setProject(makeProject([videoClip('c1', 0, 4), videoClip('c2', 4, 3)]))
    useProjectStore.getState().toggleTrackLock(TRACK_V1)

    expect(useProjectStore.getState().rollingTrimAtEditPoint('c1', 'c2', 0.5)).toBe(false)
    expect(getTrackClips(TRACK_V1).find((c) => c.id === 'c1')!.duration).toBe(4)
  })
})

describe('jumpToAdjacentKeyframe', () => {
  it('jumps across transform, volume, and speed keyframes on the selected clip', () => {
    setProject(makeProject([
      videoClip('c1', 2, 10, {
        transformKeyframes: [{ id: 'tf1', time: 1, x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 }],
        audio: {
          ...DEFAULT_AUDIO,
          volumeKeyframes: [{ id: 'vol1', time: 2, volume: 0.8 }],
        },
        speedKeyframes: [{ id: 'sp1', time: 3, speed: 1.5 }],
      }),
    ]))
    useProjectStore.setState({ selectedClipId: 'c1', currentTime: 2 })

    expect(useProjectStore.getState().jumpToAdjacentKeyframe('next')).toBe(true)
    expect(useProjectStore.getState().currentTime).toBe(3)
    expect(useProjectStore.getState().selectedNavKeyframe).toEqual({
      clipId: 'c1',
      type: 'transform',
      keyframeId: 'tf1',
    })

    expect(useProjectStore.getState().jumpToAdjacentKeyframe('next')).toBe(true)
    expect(useProjectStore.getState().currentTime).toBe(4)
    expect(useProjectStore.getState().selectedNavKeyframe?.type).toBe('volume')

    expect(useProjectStore.getState().jumpToAdjacentKeyframe('prev')).toBe(true)
    expect(useProjectStore.getState().currentTime).toBe(3)
    expect(useProjectStore.getState().selectedNavKeyframe?.type).toBe('transform')
  })

  it('returns false when the selected clip has no keyframes', () => {
    setProject(makeProject([videoClip('c1', 0, 4)]))
    useProjectStore.setState({ selectedClipId: 'c1' })
    expect(useProjectStore.getState().jumpToAdjacentKeyframe('next')).toBe(false)
  })
})

describe('video audio link', () => {
  it('detachVideoAudio excludes clip from ducking intervals', () => {
    setProject(makeProject([
      videoClip('c1', 1, 4),
      audioClip('a1', 0, 10, { ducking: { enabled: true, amount: 0.3, fade: 0.5 } }),
    ], [videoAsset('media-v1', 30), videoAsset('media-a1', 30)]))
    useProjectStore.setState({ selectedClipId: 'c1' })

    expect(useProjectStore.getState().detachVideoAudio('c1')).toBe(true)
    const clip = getTrackClips(TRACK_V1)[0] as VideoClip
    expect(clip.audioLinked).toBe(false)
  })

  it('linkVideoAudio restores linked state', () => {
    setProject(makeProject([videoClip('c1', 0, 4, { audioLinked: false })]))
    expect(useProjectStore.getState().linkVideoAudio('c1')).toBe(true)
    expect((getTrackClips(TRACK_V1)[0] as VideoClip).audioLinked).toBe(true)
  })

  it('prepareNarrationForVideoClip detaches audio and seeks to clip start', () => {
    setProject(makeProject([videoClip('c1', 3, 5)], [videoAsset('media-v1', 30)]))
    useProjectStore.setState({ currentTime: 9 })

    const result = useProjectStore.getState().prepareNarrationForVideoClip('c1')
    expect(result).toMatchObject({ clipId: 'c1', audioTrackId: TRACK_BGM, startTime: 3, duration: 5 })
    expect(useProjectStore.getState().currentTime).toBe(3)
    expect((getTrackClips(TRACK_V1)[0] as VideoClip).audioLinked).toBe(false)
  })
})

describe('color paste', () => {
  const sourceColor = normalizeColorAdjustments({
    ...DEFAULT_COLOR,
    midtones: 0.35,
    temperature: 0.2,
  })

  it('copyClipColor stores settings in colorClipboard', () => {
    setProject(makeProject([
      imageClip('c1', 0, 4, { color: sourceColor, lutId: 'lut-1', lutIntensity: 0.7 }),
      imageClip('c2', 4, 4),
    ]))
    useProjectStore.getState().setSelectedClipId('c1')
    expect(useProjectStore.getState().copyClipColor()).toBe(true)
    expect(useProjectStore.getState().colorClipboard?.color.midtones).toBeCloseTo(0.35)
    expect(useProjectStore.getState().colorClipboard?.lutId).toBe('lut-1')
  })

  it('pasteColorToSelectedClips applies clipboard to selected clips', () => {
    setProject(makeProject([
      imageClip('c1', 0, 4, { color: sourceColor, lutId: 'lut-1' }),
      imageClip('c2', 4, 4),
      imageClip('c3', 8, 4),
    ]))
    useProjectStore.getState().copyClipColor('c1')
    useProjectStore.setState({ selectedClipIds: ['c2', 'c3'], selectedClipId: 'c2' })
    expect(useProjectStore.getState().pasteColorToSelectedClips()).toBe(2)
    const clips = getTrackClips(TRACK_V1)
    expect((clips[1] as ImageClip).color.midtones).toBeCloseTo(0.35)
    expect((clips[2] as ImageClip).lutId).toBe('lut-1')
  })

  it('applyPrimaryClipColorToSelection copies primary to other selected clips', () => {
    setProject(makeProject([
      imageClip('c1', 0, 4, { color: sourceColor }),
      imageClip('c2', 4, 4),
    ]))
    useProjectStore.setState({ selectedClipIds: ['c1', 'c2'], selectedClipId: 'c1' })
    expect(useProjectStore.getState().applyPrimaryClipColorToSelection()).toBe(1)
    expect((getTrackClips(TRACK_V1)[1] as ImageClip).color.midtones).toBeCloseTo(0.35)
  })
})

describe('speed audio link', () => {
  it('normalizeProject defaults speedAudioLinked to true', () => {
    setProject(normalizeProject(makeProject([videoClip('c1', 0, 4)])))
    expect((getTrackClips(TRACK_V1)[0] as VideoClip).speedAudioLinked).toBe(true)
  })
})

describe('applyRippleTrimOnTrack with keyframes', () => {
  it('preserves transform keyframes when shifting subsequent clips', () => {
    const kfs = [{ id: 'kf1', time: 1, x: 0.2, y: 0.5, scale: 1, rotation: 0, opacity: 1 }]
    setProject(makeProject([
      videoClip('c1', 0, 4),
      videoClip('c2', 4, 3, { transformKeyframes: kfs }),
    ]))

    useProjectStore.getState().applyRippleTrimOnTrack(TRACK_V1, 'c1', 4, -1)

    const clip = getTrackClips(TRACK_V1).find((c) => c.id === 'c2') as VideoClip
    expect(clip.startTime).toBe(3)
    expect(clip.transformKeyframes).toEqual(kfs)
  })
})

describe('removeClip with ripple', () => {
  it('shifts subsequent clips on the same track', () => {
    setProject(makeProject([videoClip('c1', 0, 3), videoClip('c2', 5, 2)]))

    useProjectStore.getState().removeClip('c1', true)

    const clips = getTrackClips(TRACK_V1)
    expect(clips).toHaveLength(1)
    expect(clips[0].startTime).toBe(2)
  })

  it('keeps subsequent clips in place without ripple', () => {
    setProject(makeProject([videoClip('c1', 0, 3), videoClip('c2', 5, 2)]))

    useProjectStore.getState().removeClip('c1', false)

    expect(getTrackClips(TRACK_V1)[0].startTime).toBe(5)
  })
})

describe('undo / redo', () => {
  it('restores previous state and reapplies it', () => {
    setProject(makeProject([videoClip('c1', 0, 4)]))
    const store = useProjectStore.getState()

    store.splitClipAt('c1', 2)
    expect(getTrackClips(TRACK_V1)).toHaveLength(2)

    useProjectStore.getState().undo()
    expect(getTrackClips(TRACK_V1)).toHaveLength(1)

    useProjectStore.getState().redo()
    expect(getTrackClips(TRACK_V1)).toHaveLength(2)
  })

  it('clears redo stack after a new action', () => {
    setProject(makeProject([videoClip('c1', 0, 4)]))

    useProjectStore.getState().splitClipAt('c1', 2)
    useProjectStore.getState().undo()
    expect(useProjectStore.getState().canRedo()).toBe(true)

    useProjectStore.getState().splitClipAt('c1', 1)
    expect(useProjectStore.getState().canRedo()).toBe(false)
  })
})

describe('copy / paste', () => {
  it('pastes a copy at current time on the same track', () => {
    setProject(makeProject([videoClip('c1', 0, 3)]))
    useProjectStore.setState({ selectedClipId: 'c1', currentTime: 10 })

    useProjectStore.getState().copySelectedClip()
    useProjectStore.getState().pasteClip()

    const clips = getTrackClips(TRACK_V1)
    expect(clips).toHaveLength(2)
    expect(clips[1].startTime).toBe(10)
    expect(clips[1].id).not.toBe('c1')
  })

  it('ripple insert shifts subsequent clips when pasting in a gap', () => {
    setProject(makeProject([videoClip('c1', 0, 5), videoClip('c2', 8, 5)]))
    useProjectStore.setState({ selectedClipId: 'c1', currentTime: 5, rippleInsert: true })

    useProjectStore.getState().copySelectedClip()
    useProjectStore.getState().pasteClip()

    const clips = getTrackClips(TRACK_V1).sort((a, b) => a.startTime - b.startTime)
    expect(clips).toHaveLength(3)
    expect(clips.find((c) => c.id === 'c2')?.startTime).toBe(13)
  })
})

describe('magnetic timeline', () => {
  it('addClipFromMedia shifts subsequent clips when magnetic timeline is on by default', () => {
    const asset = imageAsset('img-magnetic')
    setProject(makeProject([videoClip('c1', 0, 5), videoClip('c2', 8, 5)], [asset]))
    useProjectStore.setState({ magneticTimeline: true, rippleInsert: false })

    const ok = useProjectStore.getState().addClipFromMedia(asset.id, TRACK_V1, 5)
    expect(ok).toBe(true)
    expect(getTrackClips(TRACK_V1).find((c) => c.id === 'c2')?.startTime).toBe(13)
  })

  it('addClipFromMedia keeps overlap resolution when magnetic and ripple insert are off', () => {
    const asset = imageAsset('img-non-magnetic')
    setProject(makeProject([videoClip('c1', 0, 5), videoClip('c2', 8, 5)], [asset]))
    useProjectStore.setState({ magneticTimeline: false, rippleInsert: false })

    useProjectStore.getState().addClipFromMedia(asset.id, TRACK_V1, 5)
    const clips = getTrackClips(TRACK_V1)
    expect(clips.find((c) => c.id === 'c2')?.startTime).toBe(8)
    expect(clips.find((c) => c.mediaId === 'img-non-magnetic')?.startTime).toBeGreaterThan(8)
  })
})

describe('ripple insert media', () => {
  it('addClipFromMedia shifts subsequent clips when ripple insert is on', () => {
    const asset = imageAsset('img-gap')
    setProject(makeProject([videoClip('c1', 0, 5), videoClip('c2', 8, 5)], [asset]))
    useProjectStore.setState({ rippleInsert: true })

    const ok = useProjectStore.getState().addClipFromMedia(asset.id, TRACK_V1, 5)
    expect(ok).toBe(true)
    const clips = getTrackClips(TRACK_V1)
    expect(clips.find((c) => c.mediaId === 'img-gap')?.startTime).toBe(5)
    expect(clips.find((c) => c.id === 'c2')?.startTime).toBe(13)
  })

  it('addClipFromMedia keeps overlap resolution when ripple insert is off', () => {
    const asset = imageAsset('img-overlap')
    setProject(makeProject([videoClip('c1', 0, 5), videoClip('c2', 8, 5)], [asset]))
    useProjectStore.setState({ rippleInsert: false })

    useProjectStore.getState().addClipFromMedia(asset.id, TRACK_V1, 5)
    const clips = getTrackClips(TRACK_V1)
    expect(clips.find((c) => c.id === 'c2')?.startTime).toBe(8)
    const inserted = clips.find((c) => c.mediaId === 'img-overlap')
    expect(inserted?.startTime).toBeGreaterThan(8)
  })
})

describe('applyBatchTransitions', () => {
  it('隣接クリップに一括でトランジションを適用する', () => {
    setProject(makeProject([
      videoClip('c1', 0, 4),
      videoClip('c2', 4, 4),
      videoClip('c3', 10, 4),
    ]))

    const count = useProjectStore.getState().applyBatchTransitions('all-video-tracks', {
      type: 'crossfade',
      duration: 0.6,
    })

    expect(count).toBe(1)
    const clips = getTrackClips(TRACK_V1) as VideoClip[]
    expect(clips[1].transition).toEqual({ type: 'crossfade', duration: 0.6 })
    expect(clips[0].transition).toBeUndefined()
    expect(clips[2].transition).toBeUndefined()
  })

  it('selected-track スコープで選択中トラックのみ適用する', () => {
    setProject(makeProject([
      videoClip('c1', 0, 4),
      videoClip('c2', 4, 4),
    ]))
    useProjectStore.setState({ selectedClipId: 'c1' })

    const count = useProjectStore.getState().applyBatchTransitions('selected-track', {
      type: 'wipe',
      duration: 0.8,
    })

    expect(count).toBe(1)
    expect((getTrackClips(TRACK_V1)[1] as VideoClip).transition?.type).toBe('wipe')
  })

  it('ストレスプロジェクトで全映像トラックへ一括適用する', () => {
    const project = createBatchTransitionStressProject()
    setProject(project)
    const stats = getBatchTransitionStressStats(project)

    const count = useProjectStore.getState().applyBatchTransitions('all-video-tracks', {
      type: 'zoom',
      duration: 0.7,
    })

    expect(count).toBe(stats.allVideoTargetCount)
    expect(count).toBe(30)
  })

  it('ストレスプロジェクトで副トラックのみ selected-track 適用する', () => {
    const project = createBatchTransitionStressProject()
    setProject(project)
    const stats = getBatchTransitionStressStats(project)
    useProjectStore.setState({ selectedClipId: stats.firstSecondaryClipId })

    const count = useProjectStore.getState().applyBatchTransitions('selected-track', {
      type: 'slideLeft',
      duration: 0.5,
    })

    expect(count).toBe(stats.secondaryOnlyTargetCount)
    expect(count).toBe(10)
  })

  it('一括適用の undo でトランジションを復元する', () => {
    setProject(makeProject([
      videoClip('c1', 0, 4),
      videoClip('c2', 4, 4),
    ]))

    useProjectStore.getState().applyBatchTransitions('all-video-tracks', {
      type: 'crossfade',
      duration: 0.6,
    })
    expect((getTrackClips(TRACK_V1)[1] as VideoClip).transition).toBeDefined()

    useProjectStore.getState().undo()
    expect((getTrackClips(TRACK_V1)[1] as VideoClip).transition).toBeUndefined()
  })
})

describe('clearBatchTransitions', () => {
  it('全映像トラックのトランジションを一括削除する', () => {
    setProject(makeProject([
      videoClip('c1', 0, 4),
      videoClip('c2', 4, 4, { transition: { type: 'crossfade', duration: 0.8 } }),
      videoClip('c3', 10, 4, { transition: { type: 'wipe', duration: 0.6 } }),
    ]))

    const count = useProjectStore.getState().clearBatchTransitions('all-video-tracks')
    expect(count).toBe(2)

    const clips = getTrackClips(TRACK_V1) as VideoClip[]
    expect(clips[1].transition).toBeUndefined()
    expect(clips[2].transition).toBeUndefined()
  })

  it('selected-track スコープで選択中トラックのみ削除する', () => {
    const clipWithTransition = videoClip('c2', 4, 4, { transition: { type: 'crossfade', duration: 0.8 } })
    setProject(makeProject([videoClip('c1', 0, 4), clipWithTransition]))
    useProjectStore.setState({ selectedClipId: 'c1' })

    const count = useProjectStore.getState().clearBatchTransitions('selected-track')
    expect(count).toBe(1)
    expect((getTrackClips(TRACK_V1)[1] as VideoClip).transition).toBeUndefined()
  })

  it('トランジションがなければ 0 を返す', () => {
    setProject(makeProject([videoClip('c1', 0, 4), videoClip('c2', 4, 4)]))
    expect(useProjectStore.getState().clearBatchTransitions('all-video-tracks')).toBe(0)
  })

  it('selected-track で未選択なら 0 を返す', () => {
    setProject(makeProject([
      videoClip('c1', 0, 4),
      videoClip('c2', 4, 4, { transition: { type: 'crossfade', duration: 0.8 } }),
    ]))
    useProjectStore.setState({ selectedClipId: null })
    expect(useProjectStore.getState().clearBatchTransitions('selected-track')).toBe(0)
  })

  it('ストレスプロジェクトで全映像トラック30件を一括削除する', () => {
    const stats = seedBatchTransitionRemovalStress()
    const count = useProjectStore.getState().clearBatchTransitions('all-video-tracks')
    expect(count).toBe(30)
    expect(stats.removalTargetCountAll).toBe(30)

    const withTransition = useProjectStore.getState().project.tracks
      .flatMap((t) => t.clips)
      .filter((c) => (c.type === 'video' || c.type === 'image') && c.transition)
    expect(withTransition).toHaveLength(0)
  })

  it('ストレスプロジェクトで副トラックのみ一括削除する', () => {
    const stats = seedBatchTransitionRemovalStress()
    useProjectStore.getState().setSelectedClipId(stats.firstSecondaryClipId)

    const count = useProjectStore.getState().clearBatchTransitions('selected-track')
    expect(count).toBe(10)

    const primaryWithTransition = useProjectStore.getState().project.tracks
      .find((t) => t.id === stats.primaryTrackId)!
      .clips.filter((c) => (c.type === 'video' || c.type === 'image') && c.transition)
    expect(primaryWithTransition).toHaveLength(20)
  })

  it('一括削除の undo でトランジションを復元する', () => {
    seedBatchTransitionRemovalStress()
    useProjectStore.getState().clearBatchTransitions('all-video-tracks')

    const beforeUndo = useProjectStore.getState().project.tracks
      .flatMap((t) => t.clips)
      .filter((c) => (c.type === 'video' || c.type === 'image') && c.transition)
    expect(beforeUndo).toHaveLength(0)

    useProjectStore.getState().undo()
    const afterUndo = useProjectStore.getState().project.tracks
      .flatMap((t) => t.clips)
      .filter((c) => (c.type === 'video' || c.type === 'image') && c.transition)
    expect(afterUndo).toHaveLength(30)
  })
})

describe('narration placement', () => {
  it('ナレーション音声を再生位置へ BGM トラックに配置できる', () => {
    const asset: MediaAsset = {
      id: 'narr-1',
      name: 'narration-test.webm',
      type: 'audio',
      blob: new Blob(),
      url: 'blob:narr-1',
      duration: 3,
    }
    setProject(makeProject([], [asset]))
    useProjectStore.getState().setCurrentTime(7)

    const ok = useProjectStore.getState().addClipFromMedia(asset.id, TRACK_BGM, 7)
    expect(ok).toBe(true)

    const clip = getTrackClips(TRACK_BGM)[0] as AudioClip
    expect(clip.mediaId).toBe('narr-1')
    expect(clip.startTime).toBe(7)
  })

  it('ナレーション配置の undo でクリップを除去する', () => {
    const asset: MediaAsset = {
      id: 'narr-2',
      name: 'narration-undo.webm',
      type: 'audio',
      blob: new Blob(),
      url: 'blob:narr-2',
      duration: 2,
    }
    setProject(makeProject([], [asset]))
    useProjectStore.getState().addClipFromMedia(asset.id, TRACK_BGM, 0)
    expect(getTrackClips(TRACK_BGM)).toHaveLength(1)

    useProjectStore.getState().undo()
    expect(getTrackClips(TRACK_BGM)).toHaveLength(0)
    expect(useProjectStore.getState().project.mediaAssets).toHaveLength(1)
  })
})

describe('importSrtSubtitles', () => {
  const srt = `1
00:00:01,000 --> 00:00:03,000
字幕A

2
00:00:04,000 --> 00:00:06,000
字幕B`

  it('SRT からテキストクリップを一括生成する', () => {
    const count = useProjectStore.getState().importSrtSubtitles(srt)
    expect(count).toBe(2)

    const textClips = getTrackClips(TRACK_TEXT)
    expect(textClips).toHaveLength(2)
    expect(textClips[0]?.startTime).toBe(1)
    expect(textClips[0]?.duration).toBe(2)
    expect(textClips[0]?.type).toBe('text')
    if (textClips[0]?.type === 'text') {
      expect(textClips[0].text.content).toBe('字幕A')
    }
  })

  it('不正な SRT は 0 を返す', () => {
    expect(useProjectStore.getState().importSrtSubtitles('invalid')).toBe(0)
  })

  it('undo でインポート前に戻せる', () => {
    useProjectStore.getState().importSrtSubtitles(srt)
    expect(getTrackClips(TRACK_TEXT)).toHaveLength(2)
    useProjectStore.getState().undo()
    expect(getTrackClips(TRACK_TEXT)).toHaveLength(0)
  })
})

describe('updateMediaAsset', () => {
  it('メディアアセットのフィールドを部分更新する', () => {
    useProjectStore.getState().addMediaAsset(imageAsset('img1'))
    const id = useProjectStore.getState().project.mediaAssets[0]!.id
    useProjectStore.getState().updateMediaAsset(id, { thumbnail: 'data:image/jpeg;base64,thumb' })
    expect(useProjectStore.getState().project.mediaAssets[0]?.thumbnail).toBe('data:image/jpeg;base64,thumb')
  })
})

describe('applyTemplate', () => {
  it('構造化テンプレートで章マーカーと写真ガイドを配置する', () => {
    const template = PROJECT_TEMPLATES.find((t) => t.id === 'structured-wedding')!
    useProjectStore.getState().applyTemplate(template)

    const { project } = useProjectStore.getState()
    expect(project.name).toBe('結婚式ムービー')
    expect(project.markers).toHaveLength(5)
    expect(project.markers?.map((m) => m.label)).toContain('新郎プロフィール')

    const textClips = getTrackClips(TRACK_TEXT)
    expect(textClips.length).toBe(template.textClips.length + (template.photoGuides?.length ?? 0))
    expect(textClips.some((c) => c.type === 'text' && c.text.content === '写真: 新郎 幼少期')).toBe(true)
  })
})

describe('addSlideshowToGuide', () => {
  it('写真ガイド区間にスライドショーを配置しガイドクリップを削除する', () => {
    const template = PROJECT_TEMPLATES.find((t) => t.id === 'structured-wedding')!
    useProjectStore.getState().applyTemplate(template)

    useProjectStore.getState().addMediaAsset(imageAsset('img1'))
    useProjectStore.getState().addMediaAsset(imageAsset('img2'))

    const guide = useProjectStore.getState().project.tracks
      .find((t) => t.type === 'text')!
      .clips.find((c) => c.type === 'text' && c.text.content === '写真: 新郎 幼少期')
    expect(guide).toBeDefined()

    const placed = useProjectStore.getState().addSlideshowToGuide(guide!.id, ['img1', 'img2'], {
      transitionType: 'crossfade',
      transitionDuration: 0.6,
      kenBurns: true,
    })

    expect(placed).toBe(2)
    const textClips = useProjectStore.getState().project.tracks.find((t) => t.type === 'text')!.clips
    expect(textClips.some((c) => c.id === guide!.id)).toBe(false)
    const videoClips = useProjectStore.getState().project.tracks.find((t) => t.type === 'video')!.clips
    expect(videoClips).toHaveLength(2)
    expect(videoClips[0].startTime).toBe(guide!.startTime)
    expect(videoClips[0].duration).toBeCloseTo(guide!.duration / 2)
  })

  it(`${PHOTO_GUIDE_SLIDESHOW_STRESS_IMAGE_COUNT} 枚をガイド区間内に配置できる`, () => {
    const template = PROJECT_TEMPLATES.find((t) => t.id === 'structured-wedding')!
    useProjectStore.getState().applyTemplate(template)

    const ids = Array.from({ length: PHOTO_GUIDE_SLIDESHOW_STRESS_IMAGE_COUNT }, (_, i) => `img-${i}`)
    for (const id of ids) useProjectStore.getState().addMediaAsset(imageAsset(id))

    const guide = useProjectStore.getState().project.tracks
      .find((t) => t.type === 'text')!
      .clips.find((c) => c.type === 'text' && c.text.content === '写真: 新郎 幼少期')!

    const placed = useProjectStore.getState().addSlideshowToGuide(guide.id, ids, {
      transitionType: 'crossfade',
      transitionDuration: 0.6,
      kenBurns: true,
    })

    expect(placed).toBe(PHOTO_GUIDE_SLIDESHOW_STRESS_IMAGE_COUNT)
    const videoClips = useProjectStore.getState().project.tracks.find((t) => t.type === 'video')!.clips
    expect(videoClips).toHaveLength(PHOTO_GUIDE_SLIDESHOW_STRESS_IMAGE_COUNT)
    const last = videoClips[videoClips.length - 1]
    expect(last.startTime + last.duration).toBeCloseTo(guide.startTime + guide.duration, 4)
  })

  it('複数ガイド区間に順次配置できる', () => {
    const template = PROJECT_TEMPLATES.find((t) => t.id === 'structured-wedding')!
    useProjectStore.getState().applyTemplate(template)
    useProjectStore.getState().addMediaAsset(imageAsset('a'))
    useProjectStore.getState().addMediaAsset(imageAsset('b'))
    useProjectStore.getState().addMediaAsset(imageAsset('c'))

    const guides = useProjectStore.getState().project.tracks
      .find((t) => t.type === 'text')!
      .clips.filter((c) => c.type === 'text' && c.text.content.startsWith('写真:'))

    const g1 = guides.find((c) => c.text.content === '写真: 新郎 幼少期')!
    const g2 = guides.find((c) => c.text.content === '写真: 新婦 幼少期')!

    const opts = { transitionType: 'crossfade' as const, transitionDuration: 0.6, kenBurns: true }
    expect(useProjectStore.getState().addSlideshowToGuide(g1.id, ['a', 'b'], opts)).toBe(2)
    expect(useProjectStore.getState().addSlideshowToGuide(g2.id, ['c'], opts)).toBe(1)

    const textClips = useProjectStore.getState().project.tracks.find((t) => t.type === 'text')!.clips
    expect(textClips.some((c) => c.id === g1.id)).toBe(false)
    expect(textClips.some((c) => c.id === g2.id)).toBe(false)
    expect(useProjectStore.getState().project.tracks.find((t) => t.type === 'video')!.clips).toHaveLength(3)
  })

  it('配置後に undo でガイドクリップが復元される', () => {
    const template = PROJECT_TEMPLATES.find((t) => t.id === 'structured-wedding')!
    useProjectStore.getState().applyTemplate(template)
    useProjectStore.getState().addMediaAsset(imageAsset('img1'))

    const guide = useProjectStore.getState().project.tracks
      .find((t) => t.type === 'text')!
      .clips.find((c) => c.text.content === '写真: 新郎 幼少期')!
    const guideId = guide!.id

    useProjectStore.getState().addSlideshowToGuide(guideId, ['img1'], {
      transitionType: 'none',
      transitionDuration: 0,
      kenBurns: false,
    })
    expect(useProjectStore.getState().project.tracks.find((t) => t.type === 'text')!.clips.some((c) => c.id === guideId)).toBe(false)

    useProjectStore.getState().undo()
    expect(useProjectStore.getState().project.tracks.find((t) => t.type === 'text')!.clips.some((c) => c.id === guideId)).toBe(true)
    expect(useProjectStore.getState().project.tracks.find((t) => t.type === 'video')!.clips).toHaveLength(0)
  })

  it('無効なガイド ID では 0 を返す', () => {
    useProjectStore.getState().addMediaAsset(imageAsset('img1'))
    const placed = useProjectStore.getState().addSlideshowToGuide('missing', ['img1'], {
      transitionType: 'none',
      transitionDuration: 0,
      kenBurns: false,
    })
    expect(placed).toBe(0)
  })
})

describe('setInOutFromMarker', () => {
  it('章マーカー区間を In/Out に設定する', () => {
    const template = PROJECT_TEMPLATES.find((t) => t.id === 'structured-wedding')!
    useProjectStore.getState().applyTemplate(template)

    const marker = useProjectStore.getState().project.markers?.find((m) => m.label === '新郎プロフィール')
    expect(marker).toBeDefined()

    const ok = useProjectStore.getState().setInOutFromMarker(marker!.id)
    expect(ok).toBe(true)
    expect(useProjectStore.getState().inPoint).toBe(20)
    expect(useProjectStore.getState().outPoint).toBe(50)
  })

  it('極短章区間は In/Out に設定できない', () => {
    useProjectStore.getState().resetProject()
    useProjectStore.getState().addMarker(0, '短')
    useProjectStore.getState().addMarker(0.005, '本編')
    const shortMarker = useProjectStore.getState().project.markers!.find((m) => m.label === '短')!
    expect(useProjectStore.getState().setInOutFromMarker(shortMarker.id)).toBe(false)
    expect(useProjectStore.getState().inPoint).toBeNull()
  })

  it('先頭章・末尾章の境界を In/Out に設定できる', () => {
    const template = PROJECT_TEMPLATES.find((t) => t.id === 'structured-wedding')!
    useProjectStore.getState().applyTemplate(template)
    const opening = useProjectStore.getState().project.markers!.find((m) => m.label === 'オープニング')!
    const ending = useProjectStore.getState().project.markers!.find((m) => m.label === 'エンディング')!

    expect(useProjectStore.getState().setInOutFromMarker(opening.id)).toBe(true)
    expect(useProjectStore.getState().inPoint).toBe(0)
    expect(useProjectStore.getState().outPoint).toBe(20)

    expect(useProjectStore.getState().setInOutFromMarker(ending.id)).toBe(true)
    expect(useProjectStore.getState().inPoint).toBe(110)
    expect(useProjectStore.getState().outPoint).toBeGreaterThan(110)
  })
})

describe('marker selection and editing', () => {
  it('マーカー選択時はクリップ選択を解除する', () => {
    setProject(makeProject([videoClip('c1', 0, 3)]))
    useProjectStore.getState().addMarker(1, 'Test')
    const markerId = useProjectStore.getState().project.markers![0].id

    useProjectStore.getState().setSelectedClipId('c1')
    useProjectStore.getState().setSelectedMarkerId(markerId)

    expect(useProjectStore.getState().selectedClipId).toBeNull()
    expect(useProjectStore.getState().getSelectedMarker()?.label).toBe('Test')
  })

  it('updateMarker でラベルと時刻を更新できる', () => {
    setProject(makeProject([videoClip('c1', 0, 30)]))
    useProjectStore.getState().addMarker(5, 'Before')
    const markerId = useProjectStore.getState().project.markers![0].id

    useProjectStore.getState().updateMarker(markerId, { label: 'After', time: 12 }, true)

    const marker = useProjectStore.getState().project.markers?.find((m) => m.id === markerId)
    expect(marker?.label).toBe('After')
    expect(marker?.time).toBe(12)
  })

  it('updateMarker はプロジェクト尺を超える時刻をクランプする', () => {
    setProject(makeProject([videoClip('c1', 0, 30)]))
    useProjectStore.getState().addMarker(5, 'Clamp')
    const markerId = useProjectStore.getState().project.markers![0].id

    useProjectStore.getState().updateMarker(markerId, { time: 999 }, true)

    const marker = useProjectStore.getState().project.markers?.find((m) => m.id === markerId)
    expect(marker?.time).toBe(30)
  })

  it('updateMarker は無効 ID で変更しない', () => {
    useProjectStore.getState().addMarker(1, 'Keep')
    const before = useProjectStore.getState().project.markers!.length

    useProjectStore.getState().updateMarker('invalid-id', { label: 'X' }, true)

    expect(useProjectStore.getState().project.markers).toHaveLength(before)
    expect(useProjectStore.getState().project.markers![0].label).toBe('Keep')
  })

  it('マーカー編集の undo が復元する', () => {
    useProjectStore.getState().addMarker(10, 'Original')
    const markerId = useProjectStore.getState().project.markers![0].id

    useProjectStore.getState().updateMarker(markerId, { label: 'Edited', time: 15 }, true)
    expect(useProjectStore.getState().project.markers![0].label).toBe('Edited')

    useProjectStore.getState().undo()
    expect(useProjectStore.getState().project.markers![0].label).toBe('Original')
    expect(useProjectStore.getState().project.markers![0].time).toBe(10)
  })

  it('章マーカー時刻変更後も setInOutFromMarker が有効な区間を返す', () => {
    const template = PROJECT_TEMPLATES.find((t) => t.id === 'structured-wedding')!
    useProjectStore.getState().applyTemplate(template)
    const marker = useProjectStore.getState().project.markers!.find((m) => m.label === '新郎プロフィール')!
    const duration = useProjectStore.getState().getProjectDuration()

    useProjectStore.getState().updateMarker(marker.id, { time: 25 }, true)
    expect(useProjectStore.getState().setInOutFromMarker(marker.id)).toBe(true)

    const { inPoint, outPoint } = useProjectStore.getState()
    expect(inPoint).toBe(25)
    expect(outPoint).toBeLessThanOrEqual(duration)
    expect(outPoint!).toBeGreaterThan(25)
  })

  it('removeMarker で選択中マーカーを解除する', () => {
    useProjectStore.getState().addMarker(2, 'Remove me')
    const markerId = useProjectStore.getState().project.markers![0].id
    useProjectStore.getState().setSelectedMarkerId(markerId)

    useProjectStore.getState().removeMarker(markerId)

    expect(useProjectStore.getState().selectedMarkerId).toBeNull()
    expect(useProjectStore.getState().project.markers).toHaveLength(0)
  })

  it('removeMarker の undo でマーカーを復元する', () => {
    useProjectStore.getState().addMarker(3, 'Restore')
    const markerId = useProjectStore.getState().project.markers![0].id

    useProjectStore.getState().removeMarker(markerId)
    expect(useProjectStore.getState().project.markers).toHaveLength(0)

    useProjectStore.getState().undo()
    expect(useProjectStore.getState().project.markers).toHaveLength(1)
    expect(useProjectStore.getState().project.markers![0].label).toBe('Restore')
  })
})

describe('text style preset apply', () => {
  it('スタイル適用の undo で書式を復元する', () => {
    const opening = TEXT_PRESETS.find((p) => p.id === 'opening')!
    useProjectStore.getState().addTextClip(opening, TRACK_TEXT, 0)
    const clipId = useProjectStore.getState().selectedClipId!
    const clip = useProjectStore.getState().getSelectedClip()
    expect(clip?.type).toBe('text')
    if (clip?.type !== 'text') return

    const beforeSize = clip.text.fontSize
    const preset = buildSavedTextStylePreset('test', { ...clip.text, fontSize: 99 })
    useProjectStore.getState().updateClip(
      clipId,
      { text: applyTextStylePreset(clip.text, preset.style) },
      true,
    )

    const updated = useProjectStore.getState().getSelectedClip()
    expect(updated?.type === 'text' && updated.text.fontSize).toBe(99)

    useProjectStore.getState().undo()
    const restored = useProjectStore
      .getState()
      .project.tracks.flatMap((t) => t.clips)
      .find((c) => c.id === clipId)
    expect(restored?.type === 'text' && restored.text.fontSize).toBe(beforeSize)
  })
})

describe('replaceClipMedia', () => {
  it('画像クリップのタイミングと長さを維持して別素材に差し替える', () => {
    setProject(makeProject(
      [imageClip('c1', 2, 4, { mediaId: 'img1' })],
      [imageAsset('img1'), imageAsset('img2')],
    ))
    useProjectStore.getState().setSelectedClipId('c1')

    const ok = useProjectStore.getState().replaceClipMedia('c1', 'img2')
    expect(ok).toBe(true)

    const clip = getTrackClips(TRACK_V1)[0] as ImageClip
    expect(clip.mediaId).toBe('img2')
    expect(clip.startTime).toBe(2)
    expect(clip.duration).toBe(4)
  })

  it('動画クリップは短い素材へ差し替えると duration をクランプする', () => {
    setProject(makeProject(
      [videoClip('c1', 1, 8)],
      [videoAsset('media-v1', 10), videoAsset('media-v2', 3)],
    ))

    const ok = useProjectStore.getState().replaceClipMedia('c1', 'media-v2')
    expect(ok).toBe(true)

    const clip = getTrackClips(TRACK_V1)[0] as VideoClip
    expect(clip.mediaId).toBe('media-v2')
    expect(clip.startTime).toBe(1)
    expect(clip.duration).toBe(3)
  })

  it('音声は映像メディアへ差し替えできない', () => {
    setProject(makeProject(
      [imageClip('c1', 0, 4, { mediaId: 'img1' })],
      [imageAsset('img1'), videoAsset('media-v1')],
    ))

    expect(useProjectStore.getState().replaceClipMedia('c1', 'img1')).toBe(false)
  })

  it('画像クリップを動画メディアへ差し替えできる', () => {
    setProject(makeProject(
      [imageClip('c1', 1, 6, { mediaId: 'img1' })],
      [imageAsset('img1'), videoAsset('media-v1', 4)],
    ))

    const ok = useProjectStore.getState().replaceClipMedia('c1', 'media-v1')
    expect(ok).toBe(true)

    const clip = getTrackClips(TRACK_V1)[0]
    expect(clip?.type).toBe('video')
    expect((clip as VideoClip).mediaId).toBe('media-v1')
    expect(clip?.startTime).toBe(1)
    expect(clip?.duration).toBe(4)
  })

  it('動画クリップを画像メディアへ差し替えできる', () => {
    setProject(makeProject(
      [videoClip('c1', 2, 8)],
      [videoAsset('media-v1', 10), imageAsset('img2')],
    ))

    const ok = useProjectStore.getState().replaceClipMedia('c1', 'img2')
    expect(ok).toBe(true)

    const clip = getTrackClips(TRACK_V1)[0]
    expect(clip?.type).toBe('image')
    expect((clip as ImageClip).mediaId).toBe('img2')
    expect(clip?.duration).toBe(8)
  })

  it('undo で差し替え前に戻せる', () => {
    setProject(makeProject(
      [imageClip('c1', 0, 4, { mediaId: 'img1' })],
      [imageAsset('img1'), imageAsset('img2')],
    ))

    useProjectStore.getState().replaceClipMedia('c1', 'img2')
    expect((getTrackClips(TRACK_V1)[0] as ImageClip).mediaId).toBe('img2')

    useProjectStore.getState().undo()
    expect((getTrackClips(TRACK_V1)[0] as ImageClip).mediaId).toBe('img1')
  })

  it('動画→動画差し替えで音声設定と speed を引き継ぐ', () => {
    setProject(makeProject(
      [videoClip('c1', 0, 5, {
        audio: { volume: 0.42, fadeIn: 0.8, fadeOut: 0.3 },
        speed: 1.5,
      })],
      [videoAsset('media-v1', 10), videoAsset('media-v2', 10)],
    ))

    const ok = useProjectStore.getState().replaceClipMedia('c1', 'media-v2')
    expect(ok).toBe(true)

    const clip = getTrackClips(TRACK_V1)[0] as VideoClip
    expect(clip.mediaId).toBe('media-v2')
    expect(clip.audio.volume).toBe(0.42)
    expect(clip.audio.fadeIn).toBe(0.8)
    expect(clip.speed).toBe(1.5)
  })

  it('画像→画像差し替えで Ken Burns を引き継ぐ', () => {
    const customKenBurns = {
      enabled: true,
      startScale: 1.1,
      endScale: 1.4,
      startX: 0.4,
      startY: 0.45,
      endX: 0.6,
      endY: 0.55,
    }
    setProject(makeProject(
      [imageClip('c1', 0, 4, { mediaId: 'img1', kenBurns: customKenBurns })],
      [imageAsset('img1'), imageAsset('img2')],
    ))

    useProjectStore.getState().replaceClipMedia('c1', 'img2')
    const clip = getTrackClips(TRACK_V1)[0] as ImageClip
    expect(clip.mediaId).toBe('img2')
    expect(clip.kenBurns).toEqual(customKenBurns)
  })

  it('音声クリップを別の音声メディアへ差し替えできる', () => {
    const mkAudioAsset = (id: string): MediaAsset => ({
      id, name: `${id}.wav`, type: 'audio', blob: new Blob(), url: `blob:${id}`, duration: 30,
    })
    setProject(makeProject(
      [audioClip('a1', 0, 6, { mediaId: 'media-a1' })],
      [mkAudioAsset('media-a1'), mkAudioAsset('media-a2')],
      TRACK_BGM,
    ))

    const ok = useProjectStore.getState().replaceClipMedia('a1', 'media-a2')
    expect(ok).toBe(true)
    expect((getTrackClips(TRACK_BGM)[0] as AudioClip).mediaId).toBe('media-a2')
  })

  it('ロック済みトラックのクリップは差し替えできない', () => {
    const project = makeProject(
      [imageClip('c1', 0, 4, { mediaId: 'img1' })],
      [imageAsset('img1'), imageAsset('img2')],
    )
    project.tracks[0].locked = true
    setProject(project)

    expect(useProjectStore.getState().replaceClipMedia('c1', 'img2')).toBe(false)
  })

  it('クロス差し替えで transform と transition を引き継ぐ', () => {
    setProject(makeProject(
      [videoClip('c1', 1, 5, {
        transform: { x: 0.35, y: 0.65, scale: 1.2, rotation: 5, opacity: 0.9 },
        transition: { type: 'wipe', duration: 0.4 },
      })],
      [videoAsset('media-v1', 10), imageAsset('img2')],
    ))

    useProjectStore.getState().replaceClipMedia('c1', 'img2')
    const clip = getTrackClips(TRACK_V1)[0] as ImageClip
    expect(clip.transform.x).toBe(0.35)
    expect(clip.transition?.type).toBe('wipe')
  })
})

describe('user project template', () => {
  beforeEach(() => {
    useProjectStore.getState().resetProject()
  })

  it('applyUserProjectTemplate で構成を現在のプロジェクトへ適用する', () => {
    const fullTemplate = PROJECT_TEMPLATES.find((t) => t.id === 'structured-wedding')!
    useProjectStore.getState().applyTemplate(fullTemplate)
    const template = buildUserProjectTemplate(useProjectStore.getState().project, '保存済み')

    useProjectStore.getState().resetProject()
    expect(useProjectStore.getState().project.tracks.flatMap((t) => t.clips)).toHaveLength(0)

    useProjectStore.getState().applyUserProjectTemplate(template)
    const project = useProjectStore.getState().project
    expect(project.width).toBe(template.width)
    expect(project.tracks.flatMap((t) => t.clips).length).toBeGreaterThan(0)
    expect(project.markers?.length).toBe(template.markers.length)
  })

  it('createProjectFromUserTemplate で新規プロジェクトを作成する', () => {
    const fullTemplate = PROJECT_TEMPLATES.find((t) => t.id === 'structured-wedding')!
    useProjectStore.getState().applyTemplate(fullTemplate)
    const template = buildUserProjectTemplate(useProjectStore.getState().project, '新規用')

    useProjectStore.getState().createProjectFromUserTemplate(template)
    const project = useProjectStore.getState().project
    expect(project.name).toBe('新規用')
    expect(project.mediaAssets).toHaveLength(0)
    expect(project.tracks.flatMap((t) => t.clips).length).toBeGreaterThan(0)
  })

  it('applyUserProjectTemplate の undo で適用前の構成に戻せる', () => {
    const fullTemplate = PROJECT_TEMPLATES.find((t) => t.id === 'structured-wedding')!
    useProjectStore.getState().applyTemplate(fullTemplate)
    const template = buildUserProjectTemplate(useProjectStore.getState().project, 'undo検証')

    useProjectStore.getState().resetProject()
    const emptyWidth = useProjectStore.getState().project.width
    expect(useProjectStore.getState().project.tracks.flatMap((t) => t.clips)).toHaveLength(0)

    useProjectStore.getState().applyUserProjectTemplate(template)
    expect(useProjectStore.getState().project.tracks.flatMap((t) => t.clips).length).toBe(template.clipEntries.length)

    useProjectStore.getState().undo()
    expect(useProjectStore.getState().project.tracks.flatMap((t) => t.clips)).toHaveLength(0)
    expect(useProjectStore.getState().project.width).toBe(emptyWidth)
  })

  it('createProjectFromUserTemplate はメディアを破棄して空にする', () => {
    setProject(makeProject([], [imageAsset('img1')]))
    const template = buildUserProjectTemplate(
      { ...makeProject(), mediaAssets: [imageAsset('img1')] },
      'メディアなし新規',
    )
    useProjectStore.getState().createProjectFromUserTemplate(template)
    expect(useProjectStore.getState().project.mediaAssets).toHaveLength(0)
  })
})

describe('multi clip selection', () => {
  it('selectClipAtClick toggles selection with additive mode', () => {
    setProject(makeProject([videoClip('c1', 0, 4), videoClip('c2', 4, 4)]))

    useProjectStore.getState().selectClipAtClick('c1', false)
    expect(useProjectStore.getState().selectedClipIds).toEqual(['c1'])
    expect(useProjectStore.getState().selectedClipId).toBe('c1')

    useProjectStore.getState().selectClipAtClick('c2', true)
    expect(useProjectStore.getState().selectedClipIds).toEqual(['c1', 'c2'])

    useProjectStore.getState().selectClipAtClick('c1', true)
    expect(useProjectStore.getState().selectedClipIds).toEqual(['c2'])
  })

  it('selectAllClipsOnActiveTrack selects every clip on the anchor track', () => {
    setProject(makeProject([videoClip('c1', 0, 4), videoClip('c2', 4, 4)]))
    useProjectStore.getState().setSelectedClipId('c1')
    useProjectStore.getState().selectAllClipsOnActiveTrack()
    expect(useProjectStore.getState().selectedClipIds.sort()).toEqual(['c1', 'c2'])
  })

  it('removeSelectedClips deletes multiple clips with ripple', () => {
    setProject(makeProject([videoClip('c1', 0, 4), videoClip('c2', 4, 4), videoClip('c3', 8, 4)]))
    useProjectStore.setState({ selectedClipIds: ['c1', 'c3'], selectedClipId: 'c1', rippleDelete: true })

    useProjectStore.getState().removeSelectedClips()

    const clips = getTrackClips(TRACK_V1)
    expect(clips).toHaveLength(1)
    expect(clips[0].id).toBe('c2')
    expect(clips[0].startTime).toBe(0)
    expect(useProjectStore.getState().selectedClipIds).toEqual([])
  })

  it('duplicateSelectedClip duplicates all selected clips', () => {
    setProject(makeProject([videoClip('c1', 0, 4), videoClip('c2', 4, 4)]))
    useProjectStore.setState({ selectedClipIds: ['c1', 'c2'], selectedClipId: 'c1' })

    useProjectStore.getState().duplicateSelectedClip()

    const clips = getTrackClips(TRACK_V1)
    expect(clips).toHaveLength(4)
    expect(useProjectStore.getState().selectedClipIds).toHaveLength(2)
    expect(useProjectStore.getState().selectedClipIds.every((id) => clips.some((c) => c.id === id))).toBe(true)
  })

  it('setTimelineEditTool switches timeline edit mode', () => {
    expect(useProjectStore.getState().timelineEditTool).toBe('selection')
    useProjectStore.getState().setTimelineEditTool('slip')
    expect(useProjectStore.getState().timelineEditTool).toBe('slip')
    useProjectStore.getState().setTimelineEditTool('slide')
    expect(useProjectStore.getState().timelineEditTool).toBe('slide')
  })
})

describe('track management', () => {
  beforeEach(() => {
    useProjectStore.getState().resetProject()
  })

  it('addTrack inserts a new track and supports undo', () => {
    const before = useProjectStore.getState().project.tracks.length
    const newId = useProjectStore.getState().addTrack('video')
    expect(useProjectStore.getState().project.tracks.length).toBe(before + 1)
    expect(useProjectStore.getState().project.tracks.some((t) => t.id === newId)).toBe(true)

    useProjectStore.getState().undo()
    expect(useProjectStore.getState().project.tracks.length).toBe(before)
  })

  it('removeTrack rejects tracks with clips or below minimum count', () => {
    setProject(makeProject([videoClip('c1', 0, 4)]))
    const trackId = useProjectStore.getState().project.tracks[0].id
    expect(useProjectStore.getState().removeTrack(trackId)).toBe(false)

    const emptySecondary = useProjectStore.getState().addTrack('video')
    expect(useProjectStore.getState().removeTrack(emptySecondary)).toBe(true)
    expect(useProjectStore.getState().project.tracks.some((t) => t.id === emptySecondary)).toBe(false)
  })

  it('renameTrack updates the track name with undo', () => {
    const trackId = useProjectStore.getState().project.tracks[0].id
    useProjectStore.getState().renameTrack(trackId, 'メイン映像')
    expect(useProjectStore.getState().project.tracks.find((t) => t.id === trackId)?.name).toBe('メイン映像')

    useProjectStore.getState().undo()
    expect(useProjectStore.getState().project.tracks.find((t) => t.id === trackId)?.name).not.toBe('メイン映像')
  })
})

describe('playback shuttle', () => {
  beforeEach(() => {
    useProjectStore.getState().resetProject()
  })

  it('shuttleForward starts at 1x then cycles to 2x and 4x', () => {
    useProjectStore.getState().shuttleForward()
    expect(useProjectStore.getState().isPlaying).toBe(true)
    expect(useProjectStore.getState().playbackShuttleRate).toBe(1)

    useProjectStore.getState().shuttleForward()
    expect(useProjectStore.getState().playbackShuttleRate).toBe(2)

    useProjectStore.getState().shuttleForward()
    expect(useProjectStore.getState().playbackShuttleRate).toBe(4)
  })

  it('shuttleStop halts playback and resets rate', () => {
    useProjectStore.getState().shuttleForward()
    useProjectStore.getState().shuttleForward()
    useProjectStore.getState().shuttleStop()
    expect(useProjectStore.getState().isPlaying).toBe(false)
    expect(useProjectStore.getState().playbackShuttleRate).toBe(1)
  })
})
