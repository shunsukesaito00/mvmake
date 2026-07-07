import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from './projectStore'
import type { ImageClip, MediaAsset, Project, VideoClip } from '../types/project'
import { DEFAULT_AUDIO, DEFAULT_COLOR, DEFAULT_CROP, DEFAULT_TRANSFORM } from '../types/project'

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
    ...overrides,
  }
}

function makeProject(clips: VideoClip[] = [], mediaAssets: MediaAsset[] = []): Project {
  return {
    id: 'test-project',
    name: 'テスト',
    width: 1920,
    height: 1080,
    fps: 30,
    mediaAssets,
    markers: [],
    tracks: [
      { id: TRACK_V1, name: '映像 1', type: 'video', clips: [...clips], muted: false, locked: false },
      { id: TRACK_V2, name: '映像 2', type: 'video', clips: [], muted: false, locked: false },
      { id: TRACK_TEXT, name: 'テキスト', type: 'text', clips: [], muted: false, locked: false },
      { id: TRACK_BGM, name: 'BGM', type: 'audio', clips: [], muted: false, locked: false },
    ],
  }
}

function setProject(project: Project): void {
  useProjectStore.setState({
    project,
    currentTime: 0,
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

  it('does nothing when split point is outside the clip', () => {
    setProject(makeProject([videoClip('c1', 0, 4)]))
    useProjectStore.getState().splitClipAt('c1', 5)
    expect(getTrackClips(TRACK_V1)).toHaveLength(1)
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
})
