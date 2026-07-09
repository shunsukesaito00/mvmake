import { useCallback, useMemo, useRef, useState } from 'react'
import { useProjectStore, type SlideshowOptions } from '../store/projectStore'
import { loadMediaFiles, enrichMediaAsset } from '../engine/mediaLoader'
import { TEXT_PRESETS, PROJECT_TEMPLATES, type TransitionType } from '../types/project'
import { useToastStore } from '../store/toastStore'
import { PanelHeader, Btn, EmptyState, Modal, Slider } from '../components/ui'
import { Icons } from '../components/icons'
import {
  filterAndSortMediaAssets,
  formatMediaListSummary,
  type MediaSortOrder,
  type MediaTypeFilter,
} from '../utils/mediaListFilter'
import { formatBatchTransitionSummary, formatBatchTransitionRemovalSummary, type BatchTransitionScope } from '../utils/batchTransition'
import { SrtImportSection } from '../components/SrtImportSection'
import { NarrationRecorderSection } from '../components/NarrationRecorderSection'

const LARGE_FILE_BYTES = 500 * 1024 * 1024

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}GB`
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`
  return `${Math.ceil(bytes / 1024)}KB`
}

const TRANSITION_OPTIONS: { type: TransitionType; label: string }[] = [
  { type: 'crossfade', label: 'クロスフェード' },
  { type: 'fadeBlack', label: 'フェード to 黒' },
  { type: 'fadeWhite', label: 'フェード to 白' },
  { type: 'wipe', label: 'ワイプ' },
  { type: 'slideLeft', label: 'スライド左' },
  { type: 'slideRight', label: 'スライド右' },
  { type: 'zoom', label: 'ズーム' },
]

const SLIDESHOW_TRANSITIONS: { value: TransitionType | 'none'; label: string }[] = [
  ...TRANSITION_OPTIONS.map((t) => ({ value: t.type, label: t.label })),
  { value: 'none', label: 'なし' },
]

function SlideshowDialog({ open, onClose, count, onConfirm }: {
  open: boolean
  onClose: () => void
  count: number
  onConfirm: (options: SlideshowOptions) => void
}) {
  const [duration, setDuration] = useState(4)
  const [transitionType, setTransitionType] = useState<TransitionType | 'none'>('crossfade')
  const [transitionDuration, setTransitionDuration] = useState(0.8)
  const [kenBurns, setKenBurns] = useState(true)

  return (
    <Modal open={open} onClose={onClose} title={`スライドショー作成 (${count}枚)`}>
      <div className="space-y-4">
        <Slider label="1枚あたりの表示秒数" value={duration} min={1} max={10} step={0.5} onChange={setDuration} format={(v) => `${v}秒`} />

        <div>
          <p className="mb-1.5 text-[11px] text-text-secondary">トランジション</p>
          <select
            value={transitionType}
            onChange={(e) => setTransitionType(e.target.value as TransitionType | 'none')}
            className="w-full rounded-lg bg-surface-3 p-2 text-xs text-text-secondary ring-1 ring-border"
          >
            {SLIDESHOW_TRANSITIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {transitionType !== 'none' && (
          <Slider label="トランジション長" value={transitionDuration} min={0.2} max={2} step={0.1} onChange={setTransitionDuration} format={(v) => `${v.toFixed(1)}秒`} />
        )}

        <label className="flex items-center gap-2.5 text-sm text-text-secondary">
          <input type="checkbox" checked={kenBurns} onChange={(e) => setKenBurns(e.target.checked)} className="accent-accent" />
          Ken Burns 効果（ズームパン）
        </label>
      </div>

      <div className="mt-5 flex gap-2">
        <Btn variant="accent" className="flex-1" onClick={() => onConfirm({ durationPerImage: duration, transitionType, transitionDuration, kenBurns })}>
          タイムラインに追加
        </Btn>
        <Btn variant="ghost" className="flex-1" onClick={onClose}>キャンセル</Btn>
      </div>
    </Modal>
  )
}

const TRANSITION_PREVIEW_ANIM: Record<TransitionType, string> = {
  crossfade: 'tp-in-fade',
  fadeBlack: 'tp-in-cut',
  fadeWhite: 'tp-in-cut',
  wipe: 'tp-in-wipe',
  slideLeft: 'tp-in-slide-left',
  slideRight: 'tp-in-slide-right',
  zoom: 'tp-in-zoom',
}

function TransitionPreview({ type }: { type: TransitionType }) {
  const anim = (name: string) => ({ animation: `${name} 2.4s ease-in-out infinite` })
  return (
    <div className="relative h-8 w-14 shrink-0 overflow-hidden rounded-md ring-1 ring-border" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-br from-rose-400/80 to-amber-600/80" />
      <div
        className="absolute inset-0 bg-gradient-to-br from-sky-500/90 to-indigo-700/90"
        style={anim(TRANSITION_PREVIEW_ANIM[type])}
      />
      {(type === 'fadeBlack' || type === 'fadeWhite') && (
        <div
          className={`absolute inset-0 ${type === 'fadeBlack' ? 'bg-black' : 'bg-white'}`}
          style={anim('tp-flash')}
        />
      )}
    </div>
  )
}

type Tab = 'media' | 'text' | 'transition' | 'templates'

const TABS: { id: Tab; icon: typeof Icons.Film; label: string }[] = [
  { id: 'media', icon: Icons.Film, label: 'メディア' },
  { id: 'text', icon: Icons.Type, label: 'テキスト' },
  { id: 'transition', icon: Icons.Sparkles, label: '効果' },
  { id: 'templates', icon: Icons.Layout, label: 'テンプレ' },
]

export function MediaPanel() {
  const [tab, setTab] = useState<Tab>('media')
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showSlideshow, setShowSlideshow] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<MediaTypeFilter>('all')
  const [sortOrder, setSortOrder] = useState<MediaSortOrder>('added')
  const [batchScope, setBatchScope] = useState<BatchTransitionScope>('selected-track')
  const [batchType, setBatchType] = useState<TransitionType>('crossfade')
  const [batchDuration, setBatchDuration] = useState(0.8)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const mediaAssets = useProjectStore((s) => s.project.mediaAssets)
  const filteredMediaAssets = useMemo(
    () => filterAndSortMediaAssets(mediaAssets, searchQuery, typeFilter, sortOrder),
    [mediaAssets, searchQuery, typeFilter, sortOrder],
  )
  const addMediaAsset = useProjectStore((s) => s.addMediaAsset)
  const updateMediaAsset = useProjectStore((s) => s.updateMediaAsset)
  const removeMediaAsset = useProjectStore((s) => s.removeMediaAsset)
  const addClipFromMedia = useProjectStore((s) => s.addClipFromMedia)
  const addTextClip = useProjectStore((s) => s.addTextClip)
  const setClipTransition = useProjectStore((s) => s.setClipTransition)
  const applyBatchTransitions = useProjectStore((s) => s.applyBatchTransitions)
  const clearBatchTransitions = useProjectStore((s) => s.clearBatchTransitions)
  const selectedClip = useProjectStore((s) => s.getSelectedClip())
  const applyTemplate = useProjectStore((s) => s.applyTemplate)
  const addSlideshow = useProjectStore((s) => s.addSlideshow)
  const showToast = useToastStore((s) => s.showToast)

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedImageIds = mediaAssets
    .filter((a) => a.type === 'image' && selectedIds.has(a.id))
    .map((a) => a.id)

  const handleSlideshowConfirm = (options: SlideshowOptions) => {
    const placed = addSlideshow(selectedImageIds, options)
    setShowSlideshow(false)
    if (placed > 0) {
      showToast(`${placed}枚の写真をタイムラインに配置しました`, 'success')
      setSelectedIds(new Set())
    } else {
      showToast('配置できる映像トラックがありません', 'error')
    }
  }

  const handleBatchTransitionApply = () => {
    const label = TRANSITION_OPTIONS.find((t) => t.type === batchType)?.label ?? batchType
    const count = applyBatchTransitions(batchScope, { type: batchType, duration: batchDuration })
    if (count === 0) {
      showToast('一括適用できる隣接クリップがありません', 'error')
      return
    }
    showToast(formatBatchTransitionSummary(count, label), 'success')
  }

  const handleBatchTransitionClear = () => {
    const count = clearBatchTransitions(batchScope)
    if (count === 0) {
      showToast('削除できるトランジションがありません', 'error')
      return
    }
    showToast(formatBatchTransitionRemovalSummary(count), 'success')
  }

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      const oversized = fileArray.filter((f) => f.size > LARGE_FILE_BYTES)
      if (oversized.length > 0) {
        const names = oversized.map((f) => `・${f.name} (${formatBytes(f.size)})`).join('\n')
        const ok = confirm(
          `${LARGE_FILE_BYTES / 1024 / 1024}MB を超えるファイルが含まれています。\n読み込みや自動保存に時間がかかり、動作が不安定になる場合があります。\n\n${names}\n\nこのままインポートしますか？`,
        )
        if (!ok) return
      }

      setIsLoading(true)
      try {
        const assets = await loadMediaFiles(fileArray)
        if (assets.length === 0) {
          showToast('対応していないファイル形式です', 'error')
          return
        }
        for (const asset of assets) addMediaAsset(asset)
        showToast(`${assets.length}件のメディアを追加しました`, 'success')

        for (const asset of assets) {
          void enrichMediaAsset(asset).then((updates) => {
            if (Object.keys(updates).length > 0) {
              updateMediaAsset(asset.id, updates)
            }
          })
        }
      } catch {
        showToast('メディアの読み込みに失敗しました', 'error')
      } finally {
        setIsLoading(false)
      }
    },
    [addMediaAsset, updateMediaAsset, showToast],
  )

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files.length > 0) await handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const currentTab = TABS.find((t) => t.id === tab)!
  const TabIcon = currentTab.icon

  return (
    <div className="flex h-full">
      {/* Vertical icon tabs */}
      <nav className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-border bg-surface-1 py-2">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            title={label}
            className={`flex h-10 w-10 flex-col items-center justify-center rounded-lg transition-all duration-150 ${
              tab === id
                ? 'bg-accent-muted text-accent ring-1 ring-accent/30'
                : 'text-text-muted hover:bg-surface-3 hover:text-text-secondary'
            }`}
          >
            <Icon size={16} />
            <span className="mt-0.5 text-[8px] font-medium">{label.slice(0, 2)}</span>
          </button>
        ))}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <PanelHeader title={currentTab.label} icon={<TabIcon size={14} />} />

        {tab === 'media' && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div
              className={`m-3 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 transition-all duration-200 ${
                isDragging
                  ? 'border-accent bg-accent-muted scale-[1.02]'
                  : 'border-border hover:border-border-light hover:bg-surface-3/50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
            >
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-surface-3 text-text-muted">
                <Icons.Upload size={18} />
              </div>
              <p className="text-center text-xs text-text-secondary">
                {isLoading ? '読み込み中...' : <>動画・画像・音声を<br />ドラッグ&ドロップ</>}
              </p>
              <Btn variant="ghost" className="mt-2 text-xs" onClick={() => fileInputRef.current?.click()}>
                ファイルを選択
              </Btn>
              <input ref={fileInputRef} type="file" multiple accept="video/*,image/*,audio/*" className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
            </div>

            <NarrationRecorderSection />

            {mediaAssets.length > 0 && (
              <div className="space-y-2 px-3 pb-2">
                <input
                  type="search"
                  aria-label="メディア検索"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="名前で検索..."
                  className="w-full rounded-lg bg-surface-3 px-3 py-2 text-xs text-text-primary outline-none ring-1 ring-border focus:ring-accent/50"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    aria-label="メディア種類"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as MediaTypeFilter)}
                    className="w-full rounded-lg bg-surface-3 p-2 text-xs text-text-secondary ring-1 ring-border"
                  >
                    <option value="all">すべて</option>
                    <option value="video">動画</option>
                    <option value="image">画像</option>
                    <option value="audio">音声</option>
                  </select>
                  <select
                    aria-label="メディア並び順"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as MediaSortOrder)}
                    className="w-full rounded-lg bg-surface-3 p-2 text-xs text-text-secondary ring-1 ring-border"
                  >
                    <option value="added">追加順</option>
                    <option value="name">名前順</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-3 pb-3">
              {mediaAssets.length === 0 ? (
                <EmptyState icon={<Icons.Film size={20} />} title="メディアがありません" description="ファイルをインポートしてください" />
              ) : filteredMediaAssets.length === 0 ? (
                <EmptyState icon={<Icons.Film size={20} />} title="該当するメディアがありません" description="検索条件や種類フィルタを変更してください" />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {filteredMediaAssets.map((asset) => {
                    const isSelected = selectedIds.has(asset.id)
                    return (
                      <div key={asset.id} className={`group relative overflow-hidden rounded-lg bg-surface-3 ring-1 transition-all ${isSelected ? 'ring-accent' : 'ring-border hover:ring-accent/40'}`}>
                        <button
                          draggable
                          onDragStart={(e) => { e.dataTransfer.setData('mediaId', asset.id); e.dataTransfer.effectAllowed = 'copy' }}
                          onClick={() => addClipFromMedia(asset.id, undefined, useProjectStore.getState().currentTime)}
                          className="w-full text-left"
                          title="クリックで再生位置に追加"
                        >
                          <div className="aspect-video bg-surface-0">
                            {asset.thumbnail ? (
                              <img src={asset.thumbnail} alt={asset.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-text-muted">
                                {asset.type === 'audio' ? <Icons.Music size={24} /> : <Icons.Image size={24} />}
                              </div>
                            )}
                          </div>
                          <div className="p-2">
                            <p className="truncate text-[10px] font-medium text-text-primary">{asset.name}</p>
                            <p className="text-[9px] text-text-muted">{asset.type} · {asset.duration.toFixed(1)}s</p>
                          </div>
                        </button>
                        {asset.type === 'image' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleSelect(asset.id) }}
                            className={`absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-md transition-all ${
                              isSelected ? 'bg-accent text-surface-0' : 'hidden bg-black/70 text-text-secondary group-hover:flex'
                            }`}
                            title="スライドショー用に選択"
                          >
                            {isSelected ? '✓' : '+'}
                          </button>
                        )}
                        <button
                          onClick={() => removeMediaAsset(asset.id)}
                          className="absolute top-1.5 right-1.5 hidden h-5 w-5 items-center justify-center rounded-md bg-black/70 text-red-400 group-hover:flex"
                          title="メディアを削除"
                        >
                          <Icons.X size={12} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {mediaAssets.length > 0 && (
              <div className="flex items-center justify-between border-t border-border px-3 py-1.5">
                <span className="text-[10px] text-text-muted">
                  {formatMediaListSummary(filteredMediaAssets.length, mediaAssets.length)}
                </span>
                <span className="font-mono text-[10px] text-text-muted" title="メディア合計サイズ(自動保存にも使用されます)">
                  {formatBytes(mediaAssets.reduce((n, a) => n + a.blob.size, 0))}
                </span>
              </div>
            )}

            {selectedImageIds.length > 0 && (
              <div className="flex items-center gap-2 border-t border-border bg-surface-2 p-2.5 animate-fade-in">
                <span className="flex-1 text-[11px] text-text-secondary">{selectedImageIds.length}枚選択中</span>
                <Btn variant="ghost" className="px-2 py-1 text-[11px]" onClick={() => setSelectedIds(new Set())}>解除</Btn>
                <Btn variant="accent" className="px-3 py-1 text-[11px]" onClick={() => setShowSlideshow(true)}>
                  スライドショー作成
                </Btn>
              </div>
            )}

            <SlideshowDialog
              open={showSlideshow}
              onClose={() => setShowSlideshow(false)}
              count={selectedImageIds.length}
              onConfirm={handleSlideshowConfirm}
            />
          </div>
        )}

        {tab === 'text' && (
          <div className="flex-1 overflow-y-auto p-3">
            <SrtImportSection />
            <p className="mb-3 text-[11px] text-text-muted">プリセットをクリックで追加</p>
            <div className="space-y-2">
              {TEXT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => addTextClip(preset)}
                  className="w-full rounded-xl bg-surface-3 p-3 text-left ring-1 ring-border transition-all hover:ring-accent/40"
                >
                  <p className="truncate text-sm font-bold" style={{ fontFamily: preset.text.fontFamily, color: preset.text.color }}>
                    {preset.text.content}
                  </p>
                  <p className="mt-1 text-[10px] text-text-muted">{preset.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'transition' && (
          <div className="flex-1 overflow-y-auto p-3">
            <p className="mb-3 text-[11px] text-text-muted">選択中のクリップにトランジションを適用</p>
            {!selectedClip || (selectedClip.type !== 'video' && selectedClip.type !== 'image') ? (
              <EmptyState icon={<Icons.Sparkles size={20} />} title="クリップ未選択" description="タイムラインで映像・画像クリップを選択してください" />
            ) : (
              <div className="space-y-1.5">
                {TRANSITION_OPTIONS.map(({ type, label }) => (
                  <button
                    key={type}
                    onClick={() => { setClipTransition(selectedClip.id, { type, duration: 0.8 }); showToast(`${label}を適用しました`, 'success') }}
                    className="flex w-full items-center gap-3 rounded-lg bg-surface-3 px-3 py-2 text-left text-sm text-text-secondary ring-1 ring-border transition-all hover:text-text-primary hover:ring-accent/40"
                  >
                    <TransitionPreview type={type} />
                    {label}
                  </button>
                ))}
                <button
                  onClick={() => { setClipTransition(selectedClip.id, undefined); showToast('トランジションを削除しました', 'info') }}
                  className="mt-2 w-full rounded-lg bg-red-500/10 px-3 py-2.5 text-left text-sm text-red-400 ring-1 ring-red-500/20 transition-all hover:bg-red-500/15"
                >
                  トランジションを削除
                </button>
              </div>
            )}

            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-1 text-[11px] font-semibold tracking-wider text-accent uppercase">隣接クリップへ一括適用</p>
              <p className="mb-3 text-[10px] leading-relaxed text-text-muted">
                同トラック上で隣接する映像クリップの2枚目以降に適用します
              </p>
              <div className="space-y-2">
                <select
                  aria-label="一括適用スコープ"
                  value={batchScope}
                  onChange={(e) => setBatchScope(e.target.value as BatchTransitionScope)}
                  className="w-full rounded-lg bg-surface-3 p-2 text-xs text-text-secondary ring-1 ring-border"
                >
                  <option value="selected-track">選択中クリップのトラック</option>
                  <option value="all-video-tracks">すべての映像トラック</option>
                </select>
                <select
                  aria-label="一括トランジション種類"
                  value={batchType}
                  onChange={(e) => setBatchType(e.target.value as TransitionType)}
                  className="w-full rounded-lg bg-surface-3 p-2 text-xs text-text-secondary ring-1 ring-border"
                >
                  {TRANSITION_OPTIONS.map(({ type, label }) => (
                    <option key={type} value={type}>{label}</option>
                  ))}
                </select>
                <Slider
                  label="トランジション長"
                  value={batchDuration}
                  min={0.2}
                  max={2}
                  step={0.1}
                  onChange={setBatchDuration}
                  format={(v) => `${v.toFixed(1)}秒`}
                />
                <Btn variant="accent" className="w-full text-xs" onClick={handleBatchTransitionApply}>
                  隣接クリップへ一括適用
                </Btn>
              </div>
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-1 text-[11px] font-semibold tracking-wider text-accent uppercase">トランジション一括削除</p>
              <p className="mb-3 text-[10px] leading-relaxed text-text-muted">
                対象トラック上の映像クリップからトランジションをすべて削除します
              </p>
              <div className="space-y-2">
                <select
                  aria-label="一括削除スコープ"
                  value={batchScope}
                  onChange={(e) => setBatchScope(e.target.value as BatchTransitionScope)}
                  className="w-full rounded-lg bg-surface-3 p-2 text-xs text-text-secondary ring-1 ring-border"
                >
                  <option value="selected-track">選択中クリップのトラック</option>
                  <option value="all-video-tracks">すべての映像トラック</option>
                </select>
                <Btn variant="danger" className="w-full text-xs" onClick={handleBatchTransitionClear}>
                  トランジションを一括削除
                </Btn>
              </div>
            </div>
          </div>
        )}

        {tab === 'templates' && (
          <div className="flex-1 overflow-y-auto p-3">
            <p className="mb-3 text-[11px] text-text-muted">結婚式ムービーテンプレート</p>
            <div className="space-y-2">
              {PROJECT_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => { applyTemplate(tpl); showToast(`${tpl.label}テンプレートを適用しました`, 'success') }}
                  className="w-full rounded-xl bg-surface-3 p-3 text-left ring-1 ring-border transition-all hover:ring-accent/40"
                >
                  <p className="text-sm font-semibold text-text-primary">{tpl.label}</p>
                  <p className="mt-1 text-[10px] text-text-muted">{tpl.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
