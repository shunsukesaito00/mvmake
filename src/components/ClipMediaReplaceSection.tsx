import { useMemo } from 'react'
import { useProjectStore } from '../store/projectStore'
import { useToastStore } from '../store/toastStore'
import type { Clip, MediaAsset } from '../types/project'
import { Icons } from './icons'

type MediaClip = Extract<Clip, { type: 'video' | 'image' | 'audio' }>

export function ClipMediaReplaceSection({ clip }: { clip: MediaClip }) {
  const mediaAssets = useProjectStore((s) => s.project.mediaAssets)
  const replaceClipMedia = useProjectStore((s) => s.replaceClipMedia)
  const showToast = useToastStore((s) => s.showToast)

  const currentAsset = mediaAssets.find((a) => a.id === clip.mediaId)
  const candidates = useMemo(
    () => mediaAssets.filter((a) => a.type === clip.type),
    [mediaAssets, clip.type],
  )

  const handleReplace = (asset: MediaAsset) => {
    if (asset.id === clip.mediaId) return
    const ok = replaceClipMedia(clip.id, asset.id)
    if (ok) {
      showToast(`「${asset.name}」に差し替えました`, 'success')
    } else {
      showToast('メディアの差し替えに失敗しました', 'error')
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-text-muted">
        現在: <span className="text-text-secondary">{currentAsset?.name ?? '不明なメディア'}</span>
      </p>
      {candidates.length <= 1 ? (
        <p className="text-[10px] text-text-muted">差し替え先の同種メディアがありません</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {candidates.map((asset) => {
            const isCurrent = asset.id === clip.mediaId
            return (
              <button
                key={asset.id}
                type="button"
                aria-label={`${asset.name} に差し替え`}
                aria-pressed={isCurrent}
                disabled={isCurrent}
                onClick={() => handleReplace(asset)}
                className={`overflow-hidden rounded-lg bg-surface-3 text-left ring-1 transition-all ${
                  isCurrent
                    ? 'ring-accent opacity-60'
                    : 'ring-border hover:ring-accent/40'
                }`}
              >
                <div className="aspect-video bg-surface-0">
                  {asset.thumbnail ? (
                    <img src={asset.thumbnail} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-text-muted">
                      {asset.type === 'audio' ? <Icons.Music size={20} /> : <Icons.Image size={20} />}
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="truncate text-[10px] font-medium text-text-primary">{asset.name}</p>
                  <p className="text-[9px] text-text-muted">
                    {isCurrent ? '使用中' : 'クリックで差し替え'}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
