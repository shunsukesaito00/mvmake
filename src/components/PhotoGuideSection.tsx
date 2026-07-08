import { useEffect, useState } from 'react'
import type { TextClip } from '../types/project'
import { useProjectStore } from '../store/projectStore'
import { useToastStore } from '../store/toastStore'
import { getPhotoGuideSlotLabel } from '../utils/photoGuide'
import { Btn } from './ui'

interface PhotoGuideSectionProps {
  clip: TextClip
}

export function PhotoGuideSection({ clip }: PhotoGuideSectionProps) {
  const mediaAssets = useProjectStore((s) => s.project.mediaAssets)
  const addSlideshowToGuide = useProjectStore((s) => s.addSlideshowToGuide)
  const showToast = useToastStore((s) => s.showToast)

  const images = mediaAssets.filter((a) => a.type === 'image')
  const imageIdsKey = images.map((a) => a.id).join(',')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(images.map((a) => a.id)))

  useEffect(() => {
    const ids = imageIdsKey ? imageIdsKey.split(',') : []
    setSelectedIds((prev) => {
      const next = new Set<string>()
      for (const id of ids) {
        if (prev.has(id)) next.add(id)
      }
      if (next.size === 0) {
        for (const id of ids) next.add(id)
      }
      return next
    })
  }, [imageIdsKey])

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handlePlace = () => {
    const ids = images.filter((a) => selectedIds.has(a.id)).map((a) => a.id)
    if (ids.length === 0) {
      showToast('配置する写真を選択してください', 'error')
      return
    }
    const placed = addSlideshowToGuide(clip.id, ids, {
      transitionType: 'crossfade',
      transitionDuration: 0.6,
      kenBurns: true,
    })
    if (placed > 0) {
      showToast(`${placed}枚の写真をガイド区間に配置しました`, 'success')
    } else {
      showToast('スライドショーを配置できませんでした', 'error')
    }
  }

  const slotLabel = getPhotoGuideSlotLabel(clip.text.content)

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-secondary">
        <span className="font-medium text-text-primary">{slotLabel}</span>
        <span className="text-text-muted"> — {clip.duration.toFixed(1)}秒の区間</span>
      </p>
      {images.length === 0 ? (
        <p className="text-[11px] text-text-muted">左パネルから写真をインポートしてから配置してください。</p>
      ) : (
        <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg bg-surface-3 p-2 ring-1 ring-border">
          {images.map((asset) => (
            <label key={asset.id} className="flex cursor-pointer items-center gap-2 text-xs text-text-secondary">
              <input
                type="checkbox"
                checked={selectedIds.has(asset.id)}
                onChange={() => toggle(asset.id)}
                className="accent-accent"
              />
              <span className="truncate">{asset.name}</span>
            </label>
          ))}
        </div>
      )}
      <Btn
        variant="accent"
        className="w-full"
        aria-label="ガイド区間にスライドショーを配置"
        disabled={images.length === 0}
        onClick={handlePlace}
      >
        スライドショーを配置
      </Btn>
    </div>
  )
}
