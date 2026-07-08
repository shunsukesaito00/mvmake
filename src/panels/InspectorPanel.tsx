import { useState, type ReactNode } from 'react'
import { useProjectStore } from '../store/projectStore'
import type { AudioClip, ImageClip, TextClip, Transform, VideoClip } from '../types/project'
import { DEFAULT_COLOR, DEFAULT_CROP, DEFAULT_DUCKING, DEFAULT_TEXT_LINE_HEIGHT, DEFAULT_TEXT_BACKGROUND_PADDING, DEFAULT_TEXT_BACKGROUND_RADIUS, SUBTITLE_BAND_COLOR, TEXT_PRESETS } from '../types/project'
import { useToastStore } from '../store/toastStore'
import { PanelHeader, SectionTitle, Slider, EmptyState, Btn } from '../components/ui'
import { VolumeKeyframesSection } from '../components/VolumeKeyframesSection'
import { ColorAdjustmentsSection } from '../components/ColorAdjustmentsSection'
import { VisualFadeSection } from '../components/VisualFadeSection'
import { PhotoGuideSection } from '../components/PhotoGuideSection'
import { MarkerInspectorSection } from '../components/MarkerInspectorSection'
import { Icons } from '../components/icons'
import { isPhotoGuideClip } from '../utils/photoGuide'

function InspectorEmptyState() {
  const addTextClip = useProjectStore((s) => s.addTextClip)
  const showToast = useToastStore((s) => s.showToast)

  const handleAddText = () => {
    const preset = TEXT_PRESETS[0]
    if (!preset) return
    addTextClip(preset)
    showToast(`「${preset.label}」テキストを追加しました`, 'success')
  }

  const handleImportMedia = () => {
    const input = document.querySelector<HTMLInputElement>('input[accept*="video"]')
    if (input) input.click()
    else showToast('左パネルのメディアタブからファイルを選択してください', 'info')
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <EmptyState
        icon={<Icons.Film size={20} />}
        title="クリップ未選択"
        description="タイムラインでクリップを選択するとプロパティを編集できます"
      />
      <div className="space-y-2 px-4 pb-6">
        <p className="text-[11px] font-semibold tracking-wider text-text-muted uppercase">クイックスタート</p>
        <button
          type="button"
          onClick={handleAddText}
          className="flex w-full items-center gap-3 rounded-xl bg-surface-3 px-3 py-2.5 text-left ring-1 ring-border transition-all hover:bg-surface-4 hover:ring-accent/30"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent">
            <Icons.Type size={16} />
          </span>
          <span>
            <span className="block text-xs font-medium text-text-primary">テキストを追加</span>
            <span className="block text-[10px] text-text-muted">Opening プリセットをタイムラインへ</span>
          </span>
        </button>
        <button
          type="button"
          onClick={handleImportMedia}
          className="flex w-full items-center gap-3 rounded-xl bg-surface-3 px-3 py-2.5 text-left ring-1 ring-border transition-all hover:bg-surface-4 hover:ring-accent/30"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent">
            <Icons.Upload size={16} />
          </span>
          <span>
            <span className="block text-xs font-medium text-text-primary">メディアをインポート</span>
            <span className="block text-[10px] text-text-muted">動画・写真・BGM を左パネルから追加</span>
          </span>
        </button>
        <p className="pt-1 text-[10px] leading-relaxed text-text-muted">
          クリップ配置後はタイムライン上のクリップをクリックして、位置・色・トランジションなどを編集できます。
        </p>
      </div>
    </div>
  )
}

function CollapsibleSection({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-border">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-surface-3/50">
        <SectionTitle>{title}</SectionTitle>
        <Icons.ChevronDown size={14} className={`text-text-muted transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && <div className="space-y-3 px-3 pb-3">{children}</div>}
    </div>
  )
}

export function InspectorPanel() {
  const selectedMarker = useProjectStore((s) => s.getSelectedMarker())
  const selectedClip = useProjectStore((s) => s.getSelectedClip())
  const updateClip = useProjectStore((s) => s.updateClip)
  const removeClip = useProjectStore((s) => s.removeClip)
  const splitClipAt = useProjectStore((s) => s.splitClipAt)
  const rippleDelete = useProjectStore((s) => s.rippleDelete)

  if (selectedMarker) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <PanelHeader title="インスペクター" icon={<Icons.Settings size={14} />} />
        <div className="border-b border-border px-3 py-2.5">
          <p className="text-sm font-semibold text-text-primary">章マーカー</p>
          <p className="font-mono text-[10px] text-text-muted">{selectedMarker.time.toFixed(1)}s</p>
        </div>
        <MarkerInspectorSection marker={selectedMarker} />
      </div>
    )
  }

  if (!selectedClip) {
    return (
      <div className="flex h-full flex-col">
        <PanelHeader title="インスペクター" icon={<Icons.Settings size={14} />} />
        <InspectorEmptyState />
      </div>
    )
  }

  const handleTransformChange = (partial: Partial<Transform>) => {
    if ('transform' in selectedClip) updateClip(selectedClip.id, { transform: { ...selectedClip.transform, ...partial } })
  }

  const typeLabel = selectedClip.type === 'text' ? 'テキスト' : selectedClip.type === 'audio' ? 'オーディオ' : selectedClip.type === 'image' ? '画像' : '動画'
  const photoGuideClip = selectedClip.type === 'text' && isPhotoGuideClip(selectedClip) ? (selectedClip as TextClip) : null
  const regularTextClip = selectedClip.type === 'text' && !isPhotoGuideClip(selectedClip) ? selectedClip : null

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PanelHeader title="インスペクター" icon={<Icons.Settings size={14} />} />

      <div className="border-b border-border px-3 py-2.5">
        <p className="text-sm font-semibold text-text-primary">{typeLabel}</p>
        <p className="font-mono text-[10px] text-text-muted">
          {selectedClip.startTime.toFixed(1)}s — {(selectedClip.startTime + selectedClip.duration).toFixed(1)}s
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <CollapsibleSection title="基本">
          <Slider label="長さ (秒)" value={selectedClip.duration} min={0.2} max={selectedClip.type === 'image' || selectedClip.type === 'text' ? 60 : 300} step={0.1}
            onChange={(v) => updateClip(selectedClip.id, { duration: v, sourceDuration: v }, true)} />
        </CollapsibleSection>

        {'transform' in selectedClip && (
          <CollapsibleSection title="位置・変形">
            <Slider label="X" value={selectedClip.transform.x} min={0} max={1} step={0.01} onChange={(v) => handleTransformChange({ x: v })} />
            <Slider label="Y" value={selectedClip.transform.y} min={0} max={1} step={0.01} onChange={(v) => handleTransformChange({ y: v })} />
            <Slider label="スケール" value={selectedClip.transform.scale} min={0.1} max={3} step={0.01} onChange={(v) => handleTransformChange({ scale: v })} />
            <Slider label="回転" value={selectedClip.transform.rotation} min={-180} max={180} step={1} onChange={(v) => handleTransformChange({ rotation: v })} format={(v) => `${v}°`} />
            <Slider label="不透明度" value={selectedClip.transform.opacity} min={0} max={1} step={0.01} onChange={(v) => handleTransformChange({ opacity: v })} />
          </CollapsibleSection>
        )}

        {selectedClip.type === 'video' && (
          <>
            <CollapsibleSection title="動画音声">
              <Slider label="音量" value={(selectedClip as VideoClip).audio.volume} min={0} max={2} step={0.01} onChange={(v) => updateClip(selectedClip.id, { audio: { ...(selectedClip as VideoClip).audio, volume: v } })} />
            </CollapsibleSection>
            <CollapsibleSection title="音量キーフレーム" defaultOpen={false}>
              <VolumeKeyframesSection
                clip={selectedClip as VideoClip}
                audio={(selectedClip as VideoClip).audio}
                onAudioChange={(patch) => updateClip(selectedClip.id, { audio: { ...(selectedClip as VideoClip).audio, ...patch } })}
              />
            </CollapsibleSection>
            <CollapsibleSection title="再生速度">
              <Slider label="速度" value={(selectedClip as VideoClip).speed} min={0.25} max={4} step={0.25} onChange={(v) => updateClip(selectedClip.id, { speed: v }, true)} format={(v) => `${v}x`} />
            </CollapsibleSection>
            <CollapsibleSection title="色調補正">
              <ColorAdjustmentsSection
                color={(selectedClip as VideoClip).color ?? DEFAULT_COLOR}
                onChange={(next, recordHistory) => updateClip(selectedClip.id, { color: next }, recordHistory)}
              />
            </CollapsibleSection>
            <CollapsibleSection title="フェード" defaultOpen={false}>
              <VisualFadeSection
                fadeIn={(selectedClip as VideoClip).fadeIn}
                fadeOut={(selectedClip as VideoClip).fadeOut}
                clipDuration={selectedClip.duration}
                onChange={(patch, recordHistory) => updateClip(selectedClip.id, patch, recordHistory)}
              />
            </CollapsibleSection>
            <CollapsibleSection title="クロップ" defaultOpen={false}>
              <label className="flex items-center gap-2 text-xs text-text-secondary">
                <input type="checkbox" checked={(selectedClip as VideoClip).crop?.enabled} onChange={(e) => updateClip(selectedClip.id, { crop: { ...(selectedClip as VideoClip).crop ?? DEFAULT_CROP, enabled: e.target.checked } })} className="accent-accent" />
                クロップ有効
              </label>
              {(selectedClip as VideoClip).crop?.enabled && (
                <>
                  <Slider label="X" value={(selectedClip as VideoClip).crop.x} min={0} max={0.9} step={0.01} onChange={(v) => updateClip(selectedClip.id, { crop: { ...(selectedClip as VideoClip).crop, x: v } })} />
                  <Slider label="Y" value={(selectedClip as VideoClip).crop.y} min={0} max={0.9} step={0.01} onChange={(v) => updateClip(selectedClip.id, { crop: { ...(selectedClip as VideoClip).crop, width: (selectedClip as VideoClip).crop.width, height: (selectedClip as VideoClip).crop.height, y: v } })} />
                  <Slider label="幅" value={(selectedClip as VideoClip).crop.width} min={0.1} max={1} step={0.01} onChange={(v) => updateClip(selectedClip.id, { crop: { ...(selectedClip as VideoClip).crop, width: v } })} />
                  <Slider label="高さ" value={(selectedClip as VideoClip).crop.height} min={0.1} max={1} step={0.01} onChange={(v) => updateClip(selectedClip.id, { crop: { ...(selectedClip as VideoClip).crop, height: v } })} />
                </>
              )}
            </CollapsibleSection>
          </>
        )}

        {selectedClip.type === 'image' && (
          <>
            <CollapsibleSection title="色調補正">
              <ColorAdjustmentsSection
                color={(selectedClip as ImageClip).color ?? DEFAULT_COLOR}
                onChange={(next, recordHistory) => updateClip(selectedClip.id, { color: next }, recordHistory)}
              />
            </CollapsibleSection>
            <CollapsibleSection title="フェード" defaultOpen={false}>
              <VisualFadeSection
                fadeIn={(selectedClip as ImageClip).fadeIn}
                fadeOut={(selectedClip as ImageClip).fadeOut}
                clipDuration={selectedClip.duration}
                onChange={(patch, recordHistory) => updateClip(selectedClip.id, patch, recordHistory)}
              />
            </CollapsibleSection>
            <CollapsibleSection title="Ken Burns" defaultOpen={false}>
              <label className="flex items-center gap-2 text-xs text-text-secondary">
                <input type="checkbox" checked={(selectedClip as ImageClip).kenBurns.enabled} onChange={(e) => updateClip(selectedClip.id, { kenBurns: { ...(selectedClip as ImageClip).kenBurns, enabled: e.target.checked } })} className="accent-accent" />
                ズームパン効果
              </label>
              <Slider label="開始スケール" value={(selectedClip as ImageClip).kenBurns.startScale} min={0.5} max={2} step={0.01} onChange={(v) => updateClip(selectedClip.id, { kenBurns: { ...(selectedClip as ImageClip).kenBurns, startScale: v } })} />
              <Slider label="終了スケール" value={(selectedClip as ImageClip).kenBurns.endScale} min={0.5} max={2} step={0.01} onChange={(v) => updateClip(selectedClip.id, { kenBurns: { ...(selectedClip as ImageClip).kenBurns, endScale: v } })} />
              <Slider label="開始 X" value={(selectedClip as ImageClip).kenBurns.startX} min={0} max={1} step={0.01} onChange={(v) => updateClip(selectedClip.id, { kenBurns: { ...(selectedClip as ImageClip).kenBurns, startX: v } })} />
              <Slider label="開始 Y" value={(selectedClip as ImageClip).kenBurns.startY} min={0} max={1} step={0.01} onChange={(v) => updateClip(selectedClip.id, { kenBurns: { ...(selectedClip as ImageClip).kenBurns, startY: v } })} />
              <Slider label="終了 X" value={(selectedClip as ImageClip).kenBurns.endX} min={0} max={1} step={0.01} onChange={(v) => updateClip(selectedClip.id, { kenBurns: { ...(selectedClip as ImageClip).kenBurns, endX: v } })} />
              <Slider label="終了 Y" value={(selectedClip as ImageClip).kenBurns.endY} min={0} max={1} step={0.01} onChange={(v) => updateClip(selectedClip.id, { kenBurns: { ...(selectedClip as ImageClip).kenBurns, endY: v } })} />
            </CollapsibleSection>
          </>
        )}

        {photoGuideClip && (
          <CollapsibleSection title="写真ガイド">
            <PhotoGuideSection clip={photoGuideClip} />
          </CollapsibleSection>
        )}

        {regularTextClip && (
          <CollapsibleSection title="テキスト">
            <textarea
              aria-label="テキスト内容"
              value={regularTextClip.text.content}
              onChange={(e) => updateClip(regularTextClip.id, { text: { ...regularTextClip.text, content: e.target.value } })}
              placeholder="改行で複数行入力できます"
              className="w-full rounded-lg bg-surface-3 p-2.5 text-sm text-text-primary outline-none ring-1 ring-border focus:ring-accent/50"
              rows={3}
            />
            <select value={regularTextClip.text.fontFamily} onChange={(e) => updateClip(regularTextClip.id, { text: { ...regularTextClip.text, fontFamily: e.target.value } })} className="w-full rounded-lg bg-surface-3 p-2 text-xs text-text-secondary ring-1 ring-border">
              <option value="Noto Sans JP">Noto Sans JP</option>
              <option value="Noto Serif JP">Noto Serif JP</option>
              <option value="Shippori Mincho">Shippori Mincho</option>
            </select>
            <select value={regularTextClip.text.textAlign} onChange={(e) => updateClip(regularTextClip.id, { text: { ...regularTextClip.text, textAlign: e.target.value as TextClip['text']['textAlign'] } })} className="w-full rounded-lg bg-surface-3 p-2 text-xs text-text-secondary ring-1 ring-border">
              <option value="left">左揃え</option>
              <option value="center">中央</option>
              <option value="right">右揃え</option>
            </select>
            <select
              aria-label="縦配置"
              value={regularTextClip.text.verticalAlign ?? 'center'}
              onChange={(e) => updateClip(regularTextClip.id, { text: { ...regularTextClip.text, verticalAlign: e.target.value as TextClip['text']['verticalAlign'] } })}
              className="w-full rounded-lg bg-surface-3 p-2 text-xs text-text-secondary ring-1 ring-border"
            >
              <option value="top">上揃え</option>
              <option value="center">中央</option>
              <option value="bottom">下揃え</option>
            </select>
            <Slider label="フォントサイズ" value={regularTextClip.text.fontSize} min={12} max={120} step={1} onChange={(v) => updateClip(regularTextClip.id, { text: { ...regularTextClip.text, fontSize: v } })} format={(v) => `${v}px`} />
            <Slider
              label="行間"
              value={regularTextClip.text.lineHeight ?? DEFAULT_TEXT_LINE_HEIGHT}
              min={0.8}
              max={2.5}
              step={0.1}
              onChange={(v) => updateClip(regularTextClip.id, { text: { ...regularTextClip.text, lineHeight: v } })}
              format={(v) => `${v.toFixed(1)}倍`}
            />
            <Slider label="縁取り" value={regularTextClip.text.strokeWidth} min={0} max={10} step={0.5} onChange={(v) => updateClip(regularTextClip.id, { text: { ...regularTextClip.text, strokeWidth: v } })} />
            <Slider label="影のぼかし" value={regularTextClip.text.shadowBlur} min={0} max={20} step={1} onChange={(v) => updateClip(regularTextClip.id, { text: { ...regularTextClip.text, shadowBlur: v } })} />
            <div className="flex gap-3">
              <label className="flex items-center gap-1.5 text-xs text-text-secondary">文字色<input type="color" value={regularTextClip.text.color} onChange={(e) => updateClip(regularTextClip.id, { text: { ...regularTextClip.text, color: e.target.value } })} className="h-6 w-8 cursor-pointer border-0 bg-transparent" /></label>
              <label className="flex items-center gap-1.5 text-xs text-text-secondary">縁色<input type="color" value={regularTextClip.text.strokeColor} onChange={(e) => updateClip(regularTextClip.id, { text: { ...regularTextClip.text, strokeColor: e.target.value } })} className="h-6 w-8 cursor-pointer border-0 bg-transparent" /></label>
            </div>
            <label className="flex items-center gap-2 text-xs text-text-secondary">
              <input
                type="checkbox"
                aria-label="字幕帯"
                checked={Boolean(regularTextClip.text.backgroundColor)}
                onChange={(e) =>
                  updateClip(regularTextClip.id, {
                    text: {
                      ...regularTextClip.text,
                      backgroundColor: e.target.checked
                        ? regularTextClip.text.backgroundColor || SUBTITLE_BAND_COLOR
                        : '',
                    },
                  })
                }
                className="accent-accent"
              />
              字幕帯（半透明背景）
            </label>
            {regularTextClip.text.backgroundColor && (
              <>
                <label className="flex items-center gap-1.5 text-xs text-text-secondary">
                  背景色
                  <input
                    type="color"
                    aria-label="字幕帯の背景色"
                    value={regularTextClip.text.backgroundColor.startsWith('#') ? regularTextClip.text.backgroundColor : '#000000'}
                    onChange={(e) => updateClip(regularTextClip.id, { text: { ...regularTextClip.text, backgroundColor: e.target.value } })}
                    className="h-6 w-8 cursor-pointer border-0 bg-transparent"
                  />
                </label>
                <Slider
                  label="背景余白"
                  value={regularTextClip.text.backgroundPadding ?? DEFAULT_TEXT_BACKGROUND_PADDING}
                  min={0}
                  max={40}
                  step={1}
                  onChange={(v) => updateClip(regularTextClip.id, { text: { ...regularTextClip.text, backgroundPadding: v } })}
                  format={(v) => `${v}px`}
                />
                <Slider
                  label="角丸"
                  value={regularTextClip.text.backgroundRadius ?? DEFAULT_TEXT_BACKGROUND_RADIUS}
                  min={0}
                  max={24}
                  step={1}
                  onChange={(v) => updateClip(regularTextClip.id, { text: { ...regularTextClip.text, backgroundRadius: v } })}
                  format={(v) => `${v}px`}
                />
              </>
            )}
            <select value={regularTextClip.animation.type} onChange={(e) => updateClip(regularTextClip.id, { animation: { ...regularTextClip.animation, type: e.target.value as TextClip['animation']['type'] } })} className="w-full rounded-lg bg-surface-3 p-2 text-xs text-text-secondary ring-1 ring-border">
              <option value="none">アニメーションなし</option>
              <option value="fadeIn">フェードイン</option>
              <option value="fadeOut">フェードアウト</option>
              <option value="slideUp">スライドアップ</option>
              <option value="typewriter">タイプライター</option>
              <option value="scaleIn">スケールイン</option>
            </select>
            {regularTextClip.animation.type !== 'none' && (
              <Slider label="アニメーション長" value={regularTextClip.animation.duration} min={0.2} max={3} step={0.1} onChange={(v) => updateClip(regularTextClip.id, { animation: { ...regularTextClip.animation, duration: v } })} format={(v) => `${v.toFixed(1)}秒`} />
            )}
          </CollapsibleSection>
        )}

        {selectedClip.type === 'audio' && (
          <>
            <CollapsibleSection title="オーディオ">
              <Slider label="音量" value={(selectedClip as AudioClip).audio.volume} min={0} max={2} step={0.01} onChange={(v) => updateClip(selectedClip.id, { audio: { ...(selectedClip as AudioClip).audio, volume: v } })} />
              <Slider label="フェードイン" value={(selectedClip as AudioClip).audio.fadeIn} min={0} max={5} step={0.1} onChange={(v) => updateClip(selectedClip.id, { audio: { ...(selectedClip as AudioClip).audio, fadeIn: v } })} />
              <Slider label="フェードアウト" value={(selectedClip as AudioClip).audio.fadeOut} min={0} max={5} step={0.1} onChange={(v) => updateClip(selectedClip.id, { audio: { ...(selectedClip as AudioClip).audio, fadeOut: v } })} />
              <Slider label="再生速度" value={(selectedClip as AudioClip).speed ?? 1} min={0.5} max={2} step={0.1} onChange={(v) => updateClip(selectedClip.id, { speed: v }, true)} format={(v) => `${v}x`} />
            </CollapsibleSection>
            <CollapsibleSection title="音量キーフレーム" defaultOpen={false}>
              <VolumeKeyframesSection
                clip={selectedClip as AudioClip}
                audio={(selectedClip as AudioClip).audio}
                onAudioChange={(patch) => updateClip(selectedClip.id, { audio: { ...(selectedClip as AudioClip).audio, ...patch } })}
              />
            </CollapsibleSection>
            <CollapsibleSection title="ダッキング" defaultOpen={false}>
              <label className="flex items-center gap-2 text-xs text-text-secondary">
                <input type="checkbox" checked={(selectedClip as AudioClip).ducking?.enabled ?? false} onChange={(e) => updateClip(selectedClip.id, { ducking: { ...((selectedClip as AudioClip).ducking ?? DEFAULT_DUCKING), enabled: e.target.checked } })} className="accent-accent" />
                動画音声がある区間でBGMを下げる
              </label>
              {(selectedClip as AudioClip).ducking?.enabled && (
                <>
                  <Slider label="ダッキング音量" value={(selectedClip as AudioClip).ducking.amount} min={0} max={1} step={0.05} onChange={(v) => updateClip(selectedClip.id, { ducking: { ...(selectedClip as AudioClip).ducking, amount: v } })} format={(v) => `${Math.round(v * 100)}%`} />
                  <Slider label="フェード時間" value={(selectedClip as AudioClip).ducking.fade} min={0.1} max={2} step={0.1} onChange={(v) => updateClip(selectedClip.id, { ducking: { ...(selectedClip as AudioClip).ducking, fade: v } })} format={(v) => `${v.toFixed(1)}秒`} />
                </>
              )}
            </CollapsibleSection>
          </>
        )}

        {(selectedClip.type === 'video' || selectedClip.type === 'image') && (selectedClip as VideoClip | ImageClip).transition && (
          <CollapsibleSection title="トランジション" defaultOpen={false}>
            <p className="text-xs text-text-muted">{(selectedClip as VideoClip | ImageClip).transition?.type}</p>
            <Slider label="長さ" value={(selectedClip as VideoClip | ImageClip).transition!.duration} min={0.2} max={3} step={0.1} onChange={(v) => updateClip(selectedClip.id, { transition: { ...(selectedClip as VideoClip | ImageClip).transition!, duration: v } }, true)} />
          </CollapsibleSection>
        )}
      </div>

      <div className="flex shrink-0 gap-2 border-t border-border p-3">
        <Btn variant="default" className="flex-1 text-xs" onClick={() => splitClipAt(selectedClip.id, useProjectStore.getState().currentTime)}>
          <span className="flex items-center justify-center gap-1.5"><Icons.Scissors size={13} /> 分割 (S)</span>
        </Btn>
        <Btn variant="danger" className="flex-1 text-xs" onClick={() => removeClip(selectedClip.id, rippleDelete)}>
          <span className="flex items-center justify-center gap-1.5"><Icons.Trash size={13} /> 削除</span>
        </Btn>
      </div>
    </div>
  )
}
