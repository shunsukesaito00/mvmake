import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from './projectStore'
import { PROJECT_TEMPLATES } from '../types/project'
import type { ImageClip, MediaAsset, Project, VideoClip } from '../types/project'
import { DEFAULT_AUDIO, DEFAULT_COLOR, DEFAULT_CROP, DEFAULT_KEN_BURNS, DEFAULT_TRANSFORM, DEFAULT_VISUAL_FADE } from '../types/project'

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

function makeProject(clips: (VideoClip | ImageClip)[] = [], mediaAssets: MediaAsset[] = []): Project {
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
    useProjectStore.getState().addMarker(5, 'Before')
    const markerId = useProjectStore.getState().project.markers![0].id

    useProjectStore.getState().updateMarker(markerId, { label: 'After', time: 12 }, true)

    const marker = useProjectStore.getState().project.markers?.find((m) => m.id === markerId)
    expect(marker?.label).toBe('After')
    expect(marker?.time).toBe(12)
  })

  it('removeMarker で選択中マーカーを解除する', () => {
    useProjectStore.getState().addMarker(2, 'Remove me')
    const markerId = useProjectStore.getState().project.markers![0].id
    useProjectStore.getState().setSelectedMarkerId(markerId)

    useProjectStore.getState().removeMarker(markerId)

    expect(useProjectStore.getState().selectedMarkerId).toBeNull()
    expect(useProjectStore.getState().project.markers).toHaveLength(0)
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

  it('型不一致や同一メディアは拒否する', () => {
    setProject(makeProject(
      [imageClip('c1', 0, 4, { mediaId: 'img1' })],
      [imageAsset('img1'), videoAsset('media-v1')],
    ))

    expect(useProjectStore.getState().replaceClipMedia('c1', 'media-v1')).toBe(false)
    expect(useProjectStore.getState().replaceClipMedia('c1', 'img1')).toBe(false)
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
})
