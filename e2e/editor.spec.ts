import { test, expect } from '@playwright/test'
import path from 'node:path'
import { Buffer } from 'node:buffer'
import { installNarrationRecordingMocks, installNarrationPermissionDeniedMock, installNarrationNoDeviceMock, installNarrationEmptyRecordingMock, makeSilentWav, makeTinyWebmVideo, makeWavWithPeak, clickTimelineClip, timelineClip, TINY_PNG, applyWeddingFullTemplate, assertPlaybackStops, checkEncodersSupported, loadChapterExportStressProject, loadChapterExportE2eProject, loadPhotoGuideSlideshowStress, loadMarkerEditStress, clearTextStylePresets, loadTextStylePresetStress, loadMediaListStress, loadBatchTransitionStress, loadBatchTransitionRemovalStress, loadMediaReplaceStress, loadUserProjectTemplateStress, loadUserProjectTemplateExportStress, importUserProjectTemplateJson, clearUserProjectTemplates, getUserProjectTemplateCount, getProjectClipCount, loadProjectSettingsPresetExportStress, importProjectSettingsPresetJson, clearProjectSettingsPresets, getProjectSettingsPresetCount, getProjectWidth, getProjectHeight, getProjectFps, getRippleDelete, setRippleInsert, getLoopPlayback, loadAudioNormalizeStress, getClipAudioVolume, getClipVolumeKeyframeMax, loadTransformKeyframeStress, getClipTransformKeyframeCount, getInterpolatedTransformAt, listImageClipTransformKeyframeCounts, loadStructuredWeddingTemplateStress, getStructuredWeddingTemplateStressStats, getChapterMarkerCount, getPhotoGuideClipCount, loadVertical916PresetStress, getVertical916PresetStressStats, applyVertical916Preset, loadExportResolutionAlignmentStress, getExportResolutionAlignmentStressStats, applyResolutionPresetById, loadExportPresetStress, loadExportPresetExportStress, applyExportPresetByName, importExportPresetJson, clearExportPresets, getExportPresetCount, getInPoint, getOutPoint, loadVideoFadeStress, getMediaVisualOpacityForClip, getClipFadeValues, applyClipFade, loadVolumeKeyframeTimelineStress, loadVolumeKeyframeStress, getVolumeAtClipLocalTime, getClipVolumeKeyframeCount, listAudioClipVolumeKeyframeCounts, listVolumeKeyframeClipCounts, listAudioTrackVolumeKeyframeCounts, updateVolumeKeyframeById, loadSlipSlideStress, loadRollingEditStress, rollingTrimAtEditPointById, getRollingEditClipDuration, getRollingEditClipStartTime, toggleTrackLock, loadKeyframeNavStress, jumpToAdjacentKeyframe, getSelectedNavKeyframe, loadVideoAudioLinkStress, isClipAudioLinked, detachVideoAudioById, linkVideoAudioById, getDuckingIntervalCount, getAudibleVideoAudioClipCount, prepareNarrationForVideoClipById, loadColorPasteStress, copyClipColorById, hasColorClipboard, pasteColorToSelectedClips, applyPrimaryClipColorToSelection, clipMatchesColorPasteSourceClip, loadSpeedAudioLinkStress, isClipSpeedAudioLinked, setSpeedAudioLinkedById, getVideoAudioSpeedScheduleForClip, previewExportScheduleParity, getClipSourceStart, getClipStartTime, getStressClipDuration, getClipTransformKeyframeTimes, getClipVolumeKeyframeTimes, slipClipById, slideClipById, loadToneCurveStress, getClipColorMidtones, getClipPixelGradeSample, getRgbCurveSampleAt, applyClipColorMidtones, applyClipRgbCurvePoint, loadTemplateStress, applyBuiltinTemplateById, applyUserTemplateById, tryImportTemplateStressJson, getTemplateStressClipCount, getTemplateStressMarkerCount, selectClipById, getSelectedClipCount, getAudioTrackIds, getTrackVolume, setTrackVolume, toggleTrackSolo, getTrackSolo, getTimelineEditTool, setTimelineEditTool, getColorPreviewMode, getShowColorScope, getColorScopeMode, countClipsWithTransition, getClipMediaId, getClipKenBurnsEnabled, getMediaReplaceCandidateCount, getMediaAssetName, getTrackCount, getTrackSummaries, getTrackName, removeTrack, getPlaybackShuttleRate, getIsPlaying, shuttleForward, addClipFromMediaAt, getFirstMediaAssetId, listClipStartTimesOnTrack } from './helpers'

test.beforeEach(async ({ page }) => {
  // オンボーディング済みとして起動
  await page.addInitScript(() => localStorage.setItem('fable-onboarded', '1'))
  await page.goto('./')
  await expect(page.getByText('FABLE', { exact: true })).toBeVisible()
})

async function addOpeningText(page: import('@playwright/test').Page) {
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: /Opening/ }).first().click()
  await expect(page.locator('footer').getByText('Opening')).toBeVisible()
}

test('プロジェクト一覧: モーダル開閉と新規プロジェクト作成', async ({ page }) => {
  // クリップを追加してから新規プロジェクトを作ると、タイムラインが空に戻ることを確認できる
  await addOpeningText(page)

  await page.getByTitle('プロジェクト一覧').click()
  await expect(page.getByText('プロジェクト', { exact: true })).toBeVisible()

  // 閉じる → 再度開く
  await page.getByRole('button', { name: '閉じる' }).click()
  await expect(page.getByText('プロジェクト', { exact: true })).toBeHidden()
  await page.getByTitle('プロジェクト一覧').click()

  // 新規プロジェクト作成でモーダルが閉じ、タイムラインが空になる
  await page.getByRole('button', { name: '+ 新規プロジェクト' }).click()
  await expect(page.getByText('新規プロジェクトを作成しました')).toBeVisible()
  await expect(page.getByText('プロジェクト', { exact: true })).toBeHidden()
  await expect(page.locator('footer').getByText('Opening')).toBeHidden()

  // 一覧には旧プロジェクト(クリップ1件)が保存されている
  await page.getByTitle('プロジェクト一覧').click()
  await expect(page.getByText(/クリップ1件/)).toBeVisible()
})

test('インスペクター: テキスト内容の編集がタイムラインへ反映される', async ({ page }) => {
  await addOpeningText(page)

  // addTextClip はクリップを選択状態にするのでインスペクターに編集欄が出る
  const textarea = page.locator('textarea')
  await expect(textarea).toBeVisible()
  await textarea.fill('乾杯のご挨拶')

  await expect(page.locator('footer').getByText('乾杯のご挨拶')).toBeVisible()
  await expect(page.locator('footer').getByText('Opening')).toBeHidden()
})

test('インスペクター: 複数行テキストを入力できる', async ({ page }) => {
  await addOpeningText(page)

  const textarea = page.getByRole('textbox', { name: 'テキスト内容' })
  await textarea.fill('新郎\n新婦')
  await expect(textarea).toHaveValue('新郎\n新婦')
  await expect(page.locator('footer').getByText('新郎')).toBeVisible()
})

test('インスペクター: テキストの行間と縦配置を設定できる', async ({ page }) => {
  await addOpeningText(page)

  await page.getByRole('slider', { name: '行間' }).fill('1.8')
  await expect(page.getByRole('slider', { name: '行間' })).toHaveValue('1.8')

  await page.getByLabel('縦配置').selectOption('top')
  await expect(page.getByLabel('縦配置')).toHaveValue('top')
})

test('インスペクター: テキストに字幕帯を設定できる', async ({ page }) => {
  await addOpeningText(page)

  await page.getByRole('checkbox', { name: '字幕帯' }).check()
  await expect(page.getByRole('slider', { name: '背景余白' })).toBeVisible()
  await expect(page.getByRole('slider', { name: '角丸' })).toBeVisible()

  await page.getByRole('slider', { name: '背景余白' }).fill('20')
  await expect(page.getByRole('slider', { name: '背景余白' })).toHaveValue('20')
})

test('インスペクター: テキストスタイルを保存して適用できる', async ({ page }) => {
  await addOpeningText(page)

  await page.getByRole('slider', { name: 'フォントサイズ' }).fill('80')
  await expect(page.getByRole('slider', { name: 'フォントサイズ' })).toHaveValue('80')

  await page.getByRole('button', { name: 'スタイルプリセット' }).click()
  await page.getByLabel('スタイル名').fill('大見出し')
  await page.getByRole('button', { name: 'スタイル保存' }).click()
  await expect(page.getByText('「大見出し」スタイルを保存しました')).toBeVisible()

  await page.getByRole('slider', { name: 'フォントサイズ' }).fill('36')
  await expect(page.getByRole('slider', { name: 'フォントサイズ' })).toHaveValue('36')

  await page.getByRole('button', { name: '大見出しを適用' }).click()
  await expect(page.getByText('「大見出し」スタイルを適用しました')).toBeVisible()
  await expect(page.getByRole('slider', { name: 'フォントサイズ' })).toHaveValue('80')
})

test('インスペクター: 同名スタイル保存は上書きする', async ({ page }) => {
  await clearTextStylePresets(page)
  await addOpeningText(page)

  await page.getByRole('button', { name: 'スタイルプリセット' }).click()
  await page.getByRole('slider', { name: 'フォントサイズ' }).fill('80')
  await page.getByLabel('スタイル名').fill('大見出し')
  await page.getByRole('button', { name: 'スタイル保存' }).click()
  await expect(page.getByText('「大見出し」スタイルを保存しました')).toBeVisible()

  await page.getByRole('slider', { name: 'フォントサイズ' }).fill('48')
  await page.getByLabel('スタイル名').fill('大見出し')
  await page.getByRole('button', { name: 'スタイル保存' }).click()
  await expect(page.getByText('「大見出し」スタイルを上書き保存しました')).toBeVisible()
  await expect(page.getByRole('button', { name: '大見出しを適用' })).toHaveCount(1)

  await page.getByRole('slider', { name: 'フォントサイズ' }).fill('24')
  await page.getByRole('button', { name: '大見出しを適用' }).click()
  await expect(page.getByRole('slider', { name: 'フォントサイズ' })).toHaveValue('48')
})

test('インスペクター: 保存スタイルを削除できる', async ({ page }) => {
  await clearTextStylePresets(page)
  const stats = await loadTextStylePresetStress(page)
  expect(stats.presetCount).toBeGreaterThan(0)

  await addOpeningText(page)
  await page.getByRole('button', { name: 'スタイルプリセット' }).click()
  await page.getByRole('button', { name: `${stats.names[0]}を削除` }).click()
  await expect(page.getByText(`「${stats.names[0]}」スタイルを削除しました`)).toBeVisible()
  await expect(page.getByRole('button', { name: `${stats.names[0]}を適用` })).toHaveCount(0)
})

test('インスペクター: スタイル適用を undo で復元できる', async ({ page }) => {
  await clearTextStylePresets(page)
  await addOpeningText(page)

  await page.getByRole('button', { name: 'スタイルプリセット' }).click()
  await page.getByRole('slider', { name: 'フォントサイズ' }).fill('80')
  await page.getByLabel('スタイル名').fill('大見出し')
  await page.getByRole('button', { name: 'スタイル保存' }).click()

  await page.getByRole('slider', { name: 'フォントサイズ' }).fill('36')
  await page.getByRole('button', { name: '大見出しを適用' }).click()
  await expect(page.getByRole('slider', { name: 'フォントサイズ' })).toHaveValue('80')

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z')
  await expect(page.getByRole('slider', { name: 'フォントサイズ' })).toHaveValue('36')
})

test('インスペクター: Google Fonts を 10 種以上から選択できる', async ({ page }) => {
  await addOpeningText(page)

  const fontSelect = page.getByLabel('フォント', { exact: true })
  await expect(fontSelect.locator('option')).toHaveCount(12)
  await fontSelect.selectOption('Zen Old Mincho')
  await expect(fontSelect).toHaveValue('Zen Old Mincho')
})

test('メディア: 検索・種類フィルタ・ソートができる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )

  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="video"]', [
    { name: 'zebra.png', mimeType: 'image/png', buffer: png },
    { name: 'alpha-photo.png', mimeType: 'image/png', buffer: png },
    { name: 'bgm-theme.wav', mimeType: 'audio/wav', buffer: makeSilentWav() },
  ])
  await expect(page.getByText('3件のメディアを追加しました')).toBeVisible()

  await page.getByLabel('メディア検索').fill('alpha')
  await expect(page.getByText('1/3件表示')).toBeVisible()
  await expect(page.getByText('alpha-photo.png')).toBeVisible()
  await expect(page.getByText('zebra.png')).toBeHidden()

  await page.getByLabel('メディア検索').fill('')
  await page.getByLabel('メディア種類').selectOption('image')
  await expect(page.getByText('2/3件表示')).toBeVisible()
  await expect(page.getByText('bgm-theme.wav')).toBeHidden()

  await page.getByLabel('メディア並び順').selectOption('name')
  await expect(page.locator('.grid.grid-cols-2 > div').first().getByText('alpha-photo.png')).toBeVisible()
})

test('メディア: 52件ストレスで検索・フィルタ・ソートが動作する', async ({ page }) => {
  const stats = await loadMediaListStress(page)
  expect(stats.mediaCount).toBe(52)

  await page.getByTitle('メディア').click()
  await expect(page.getByText('52件のメディア')).toBeVisible()

  await page.getByLabel('メディア検索').fill('alpha')
  await expect(page.getByText('1/52件表示')).toBeVisible()
  await expect(page.getByText('alpha-cover.jpg')).toBeVisible()

  await page.getByLabel('メディア検索').fill('')
  await page.getByLabel('メディア種類').selectOption('audio')
  await expect(page.getByText('5/52件表示')).toBeVisible()
  await expect(page.getByText('bgm-01.wav')).toBeVisible()
  await expect(page.getByText('photo-001.jpg')).toBeHidden()

  await page.getByLabel('メディア並び順').selectOption('name')
  await expect(page.locator('.grid.grid-cols-2 > div').first().getByText('bgm-01.wav')).toBeVisible()
})

test('メディア: 該当なし検索で空状態を表示する', async ({ page }) => {
  await loadMediaListStress(page)
  await page.getByTitle('メディア').click()

  await page.getByLabel('メディア検索').fill('not-found-xyz')
  await expect(page.getByText('該当するメディアがありません')).toBeVisible()
  await expect(page.getByText('0/52件表示')).toBeVisible()
})

test('メディア: 種類フィルタ切替で件数が更新される', async ({ page }) => {
  await loadMediaListStress(page)
  await page.getByTitle('メディア').click()

  await page.getByLabel('メディア種類').selectOption('image')
  await expect(page.getByText('45/52件表示')).toBeVisible()

  await page.getByLabel('メディア種類').selectOption('video')
  await expect(page.getByText('2/52件表示')).toBeVisible()
  await expect(page.getByText('clip-01.mp4')).toBeVisible()
})

test('インスペクター: 未選択時のクイックスタートからテキストを追加できる', async ({ page }) => {
  await page.getByTitle('プロジェクト一覧').click()
  await page.getByRole('button', { name: '+ 新規プロジェクト' }).click()
  await expect(page.getByText('新規プロジェクトを作成しました')).toBeVisible()
  await expect(page.locator('footer').getByText('Opening')).toBeHidden()

  await expect(page.getByText('クイックスタート')).toBeVisible()
  await page.getByRole('button', { name: 'テキストを追加' }).click()
  await expect(page.locator('footer').getByText('Opening')).toBeVisible()
})

test('インスペクター: 音量を正規化できる', async ({ page }) => {
  const wav = makeWavWithPeak(0.1, 0.5)
  await page.setInputFiles('input[accept*="audio"]', { name: 'quiet-bgm.wav', mimeType: 'audio/wav', buffer: wav })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()

  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'quiet-bgm.wav')

  const volumeSlider = page.getByRole('slider', { name: '音量' })
  await expect(volumeSlider).toHaveValue('1')

  await page.getByRole('button', { name: '音量を正規化' }).click()
  await expect(page.getByText('音量を正規化しました')).toBeVisible()
  await expect(volumeSlider).toHaveValue('2')
})

test('インスペクター: 音量正規化を undo で復元できる', async ({ page }) => {
  const stats = await loadAudioNormalizeStress(page)
  await selectClipById(page, stats.bgmClipId)
  await clickTimelineClip(page, stats.bgmClipName)

  const volumeSlider = page.getByRole('slider', { name: '音量' })
  await expect(volumeSlider).toHaveValue('1')

  await page.getByRole('button', { name: '音量を正規化' }).click()
  await expect(page.getByText('音量を正規化しました')).toBeVisible()
  await expect(volumeSlider).toHaveValue('2')

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z')
  await expect.poll(() => getClipAudioVolume(page, stats.bgmClipId)).toBe(1)
})

test('インスペクター: 音量キーフレーム付きクリップを正規化すると KF も同倍率スケールする', async ({ page }) => {
  const stats = await loadAudioNormalizeStress(page)
  await selectClipById(page, stats.keyframedClipId)
  await clickTimelineClip(page, stats.keyframedClipName)

  expect(await getClipAudioVolume(page, stats.keyframedClipId)).toBe(0.5)
  expect(await getClipVolumeKeyframeMax(page, stats.keyframedClipId)).toBe(0.8)

  await page.getByRole('button', { name: '音量を正規化' }).click()
  await expect(page.getByText('音量を正規化しました')).toBeVisible()

  await expect.poll(() => getClipAudioVolume(page, stats.keyframedClipId)).toBeCloseTo(1.25, 1)
  await expect.poll(() => getClipVolumeKeyframeMax(page, stats.keyframedClipId)).toBe(2)
})

test('インスペクター: ストレス投入の BGM とナレーションを順次正規化できる', async ({ page }) => {
  const stats = await loadAudioNormalizeStress(page)
  expect(stats.clipCount).toBe(3)

  await selectClipById(page, stats.bgmClipId)
  await clickTimelineClip(page, stats.bgmClipName)
  await page.getByRole('button', { name: '音量を正規化' }).click()
  await expect(page.getByText('音量を正規化しました')).toBeVisible()
  expect(await getClipAudioVolume(page, stats.bgmClipId)).toBe(2)

  await selectClipById(page, stats.narrationClipId)
  await clickTimelineClip(page, stats.narrationClipName)
  await expect(page.getByRole('slider', { name: '音量' })).toHaveValue('0.75')
  await page.getByRole('button', { name: '音量を正規化' }).click()
  await expect(page.getByText('音量を正規化しました')).toBeVisible()
  await expect.poll(() => getClipAudioVolume(page, stats.narrationClipId)).toBe(2)
})

test('インスペクター: トランスフォームキーフレームを追加・編集できる', async ({ page }) => {
  await page.getByRole('button', { name: 'テキストを追加' }).click()
  await clickTimelineClip(page, 'Opening')

  await page.getByRole('button', { name: 'トランスフォームキーフレーム' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await expect(page.getByText('キーフレーム 1')).toBeVisible()
  await expect(page.getByText('1件', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'トランスフォームキーフレーム 1' })).toBeVisible()
})

test('インスペクター: トランスフォームキーフレームの不透明度を設定できる', async ({ page }) => {
  await page.getByRole('button', { name: 'テキストを追加' }).click()
  await clickTimelineClip(page, 'Opening')

  await page.getByRole('button', { name: 'トランスフォームキーフレーム' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()

  const opacitySliders = page.getByRole('slider', { name: '不透明度' })
  await opacitySliders.nth(1).fill('0.4')
  await expect(opacitySliders.nth(1)).toHaveValue('0.4')
})

test('インスペクター: トランスフォームキーフレームのイージングを設定できる', async ({ page }) => {
  await page.getByRole('button', { name: 'テキストを追加' }).click()
  await clickTimelineClip(page, 'Opening')

  await page.getByRole('button', { name: 'トランスフォームキーフレーム' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()

  await page.getByLabel('補間イージング').selectOption('easeOut')
  await expect(page.getByLabel('補間イージング')).toHaveValue('easeOut')
})

test('インスペクター: トランスフォームキーフレームのスケールを数値入力できる', async ({ page }) => {
  await page.getByRole('button', { name: 'テキストを追加' }).click()
  await clickTimelineClip(page, 'Opening')

  await page.getByRole('button', { name: 'トランスフォームキーフレーム' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()

  await expect(page.getByTestId('transform-kf-graph-editor')).toBeVisible()

  const scaleInput = page.getByRole('spinbutton', { name: 'スケール 数値' })
  await scaleInput.fill('1.8')
  await scaleInput.blur()
  await expect(scaleInput).toHaveValue('1.8')

  await page.getByTestId('transform-graph-property-rotation').click()
  await expect(page.getByTestId('transform-graph-property-rotation')).toHaveAttribute('aria-pressed', 'true')
})

test('クリップ分割: トランスフォームキーフレームを両側に再配分する', async ({ page }) => {
  await addOpeningText(page)
  await clickTimelineClip(page, 'Opening')

  await page.getByRole('button', { name: 'トランスフォームキーフレーム' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()

  const timeSliders = page.getByRole('slider', { name: '位置 (秒)' })
  await timeSliders.nth(1).fill('2')

  await page.locator('main input[type="range"]').fill('2')
  await page.getByRole('button', { name: '分割 (S)' }).click()

  await expect(page.locator('footer').getByText('Opening')).toHaveCount(2)
  await expect(page.getByRole('button', { name: 'トランスフォームキーフレーム 1' })).toHaveCount(2)
})

test('トランスフォームキーフレーム: ストレス投入で8キーフレームがロードされる', async ({ page }) => {
  const stats = await loadTransformKeyframeStress(page)
  expect(stats.keyframeCount).toBe(8)
  expect(await getClipTransformKeyframeCount(page, stats.clipId)).toBe(8)
})

test('トランスフォームキーフレーム: ストレス分割で4+4に再配分される', async ({ page }) => {
  const stats = await loadTransformKeyframeStress(page)
  await selectClipById(page, stats.clipId)
  await clickTimelineClip(page, stats.clipName)

  await page.locator('main input[type="range"]').fill(String(stats.splitAt))
  await page.getByRole('button', { name: '分割 (S)' }).click()

  const counts = await listImageClipTransformKeyframeCounts(page)
  expect(counts).toHaveLength(2)
  expect(counts.map((c) => c.count).sort()).toEqual([4, 4])
})

test('トランスフォームキーフレーム: ストレス補間値が中間時刻で安定する', async ({ page }) => {
  const stats = await loadTransformKeyframeStress(page)
  const transform = await getInterpolatedTransformAt(page, stats.clipId, stats.midLocalTime)
  expect(transform).not.toBeNull()
  expect(transform!.x).toBeCloseTo(stats.expectedMidX, 3)
  expect(transform!.opacity).toBeCloseTo(stats.expectedMidOpacity, 3)
  expect(transform!.scale).toBeGreaterThan(1)
  expect(transform!.rotation).toBeGreaterThan(0)
})

test('音量キーフレームUI: ストレス投入で6キーフレームがロードされる', async ({ page }) => {
  const stats = await loadVolumeKeyframeTimelineStress(page)
  expect(stats.keyframeCount).toBe(6)
  expect(stats.hasCurvePath).toBe(true)
  expect(await getClipVolumeKeyframeCount(page, stats.clipId)).toBe(6)
})

test('音量キーフレーム: ストレス投入で音声4KF・動画2KFと補間が一致する', async ({ page }) => {
  const stats = await loadVolumeKeyframeStress(page)
  expect(stats.audioKeyframeCount).toBe(4)
  expect(stats.videoKeyframeCount).toBe(2)
  expect(stats.automationEventCount).toBeGreaterThanOrEqual(2)
  expect(await getVolumeAtClipLocalTime(page, stats.audioClipId, stats.audioMidLocalTime)).toBeCloseTo(stats.audioMidVolume, 3)
  expect(await getVolumeAtClipLocalTime(page, stats.videoClipId, stats.videoMidLocalTime)).toBeCloseTo(stats.videoMidVolume, 3)
  const counts = await listVolumeKeyframeClipCounts(page)
  expect(counts.map((c) => c.count).sort()).toEqual([2, 4])
})

test('音量キーフレーム: ストレス分割で2+2に再配分される', async ({ page }) => {
  const stats = await loadVolumeKeyframeStress(page)
  await selectClipById(page, stats.audioClipId)
  await clickTimelineClip(page, stats.audioClipName)

  await page.locator('main input[type="range"]').fill(String(stats.splitAt))
  await page.getByRole('button', { name: '分割 (S)' }).click()

  const counts = await listAudioTrackVolumeKeyframeCounts(page)
  expect(counts).toHaveLength(2)
  expect(counts.map((c) => c.count).sort()).toEqual([2, 2])
})

test('音量キーフレーム: キーフレーム変更を undo で復元できる', async ({ page }) => {
  const stats = await loadVolumeKeyframeStress(page)
  const before = await getVolumeAtClipLocalTime(page, stats.audioClipId, 0)
  await updateVolumeKeyframeById(page, stats.audioClipId, stats.firstAudioKeyframeId, { volume: 1.9 })
  expect(await getVolumeAtClipLocalTime(page, stats.audioClipId, 0)).toBe(1.9)

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z')
  expect(await getVolumeAtClipLocalTime(page, stats.audioClipId, 0)).toBeCloseTo(before, 3)
})

test('スリップ/スライド: ストレス投入で隣接3クリップとKFがロードされる', async ({ page }) => {
  const stats = await loadSlipSlideStress(page)
  expect(stats.clipCount).toBe(3)
  expect(stats.transformKeyframeCount).toBe(2)
  expect(stats.volumeKeyframeCount).toBe(2)
  expect(await getClipTransformKeyframeTimes(page, stats.selectedClipId)).toEqual(stats.transformKeyframeTimes)
})

test('スリップ/スライド: スリップでsourceStartが変化しKF時刻は維持される', async ({ page }) => {
  const stats = await loadSlipSlideStress(page)
  const transformBefore = await getClipTransformKeyframeTimes(page, stats.selectedClipId)
  const volumeBefore = await getClipVolumeKeyframeTimes(page, stats.selectedClipId)

  expect(await slipClipById(page, stats.selectedClipId, stats.slipDelta)).toBe(true)
  expect(await getClipSourceStart(page, stats.selectedClipId)).toBe(stats.sourceStartAfterSlip)
  expect(await getClipStartTime(page, stats.selectedClipId)).toBe(stats.selectedStartBefore)
  expect(await getClipTransformKeyframeTimes(page, stats.selectedClipId)).toEqual(transformBefore)
  expect(await getClipVolumeKeyframeTimes(page, stats.selectedClipId)).toEqual(volumeBefore)
})

test('スリップ/スライド: スライドで隣接が連動しundoで復元できる', async ({ page }) => {
  const stats = await loadSlipSlideStress(page)
  const beforeStart = await getClipStartTime(page, stats.selectedClipId)
  const beforePrevDuration = await getStressClipDuration(page, stats.prevClipId)

  expect(await slideClipById(page, stats.selectedClipId, stats.slideDelta)).toBe(true)
  expect(await getClipStartTime(page, stats.selectedClipId)).toBeCloseTo(stats.selectedStartAfterSlide, 3)
  expect(await getStressClipDuration(page, stats.prevClipId)).toBeCloseTo(stats.prevDurationAfterSlide, 3)

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z')
  expect(await getClipStartTime(page, stats.selectedClipId)).toBeCloseTo(beforeStart, 3)
  expect(await getStressClipDuration(page, stats.prevClipId)).toBeCloseTo(beforePrevDuration, 3)
})

test('トーンカーブ: ストレス投入でトーン・RGBカーブが有効', async ({ page }) => {
  const stats = await loadToneCurveStress(page)
  expect(stats.toneCurveActive).toBe(true)
  expect(stats.rgbCurvesActive).toBe(true)
  expect(stats.midtones).toBeCloseTo(0.2, 3)
  expect(await getRgbCurveSampleAt(page, stats.clipId, 'r', 0.5)).toBeCloseTo(stats.rgbSampleAtHalf, 3)
  const pixel = await getClipPixelGradeSample(page, stats.clipId)
  expect(pixel.r).toBeGreaterThan(128)
})

test('トーンカーブ: ミッドトーン変更でピクセルグレードが変化する', async ({ page }) => {
  const stats = await loadToneCurveStress(page)
  const before = await getClipPixelGradeSample(page, stats.clipId)
  await applyClipColorMidtones(page, stats.clipId, 0.45)
  expect(await getClipColorMidtones(page, stats.clipId)).toBe(0.45)
  const after = await getClipPixelGradeSample(page, stats.clipId)
  expect(after.r).toBeGreaterThan(before.r)
})

test('トーンカーブ: RGB Rチャンネル変更をundoで復元できる', async ({ page }) => {
  const stats = await loadToneCurveStress(page)
  const beforeSample = await getRgbCurveSampleAt(page, stats.clipId, 'r', 0.5)
  await applyClipRgbCurvePoint(page, stats.clipId, 'r', 2, 0.8)
  expect(await getRgbCurveSampleAt(page, stats.clipId, 'r', 0.5)).toBeCloseTo(0.8, 2)

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z')
  expect(await getRgbCurveSampleAt(page, stats.clipId, 'r', 0.5)).toBeCloseTo(beforeSample, 2)
})

test('テンプレート: ストレス投入で組み込み4種とユーザー保存が有効', async ({ page }) => {
  const stats = await loadTemplateStress(page)
  expect(stats.builtinTemplateCount).toBe(4)
  expect(stats.openingClipCount).toBe(1)
  expect(stats.endingClipCount).toBe(2)
  expect(stats.structuredClipCount).toBe(11)
  expect(await getTemplateStressClipCount(page)).toBe(11)
  expect(await getTemplateStressMarkerCount(page)).toBe(5)
  expect(await applyBuiltinTemplateById(page, 'profile-movie')).toBe(1)
})

test('テンプレート: ユーザー適用をundoで復元できる', async ({ page }) => {
  const stats = await loadTemplateStress(page)
  await applyBuiltinTemplateById(page, 'opening-movie')
  const beforeCount = await getTemplateStressClipCount(page)

  expect(await applyUserTemplateById(page, stats.userTemplateId)).toBe(true)
  expect(await getTemplateStressClipCount(page)).toBe(stats.userClipCount)

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z')
  expect(await getTemplateStressClipCount(page)).toBe(beforeCount)
})

test('テンプレート: 破損JSONインポートはエラー', async ({ page }) => {
  const result = await tryImportTemplateStressJson(page, '{broken')
  expect(result.ok).toBe(false)
  if (!result.ok) {
    expect(result.error).toContain('JSON')
  }
})

test('音量キーフレームUI: ストレス分割で3+3に再配分される', async ({ page }) => {
  const stats = await loadVolumeKeyframeTimelineStress(page)
  await selectClipById(page, stats.clipId)
  await clickTimelineClip(page, stats.clipName)

  await page.locator('main input[type="range"]').fill(String(stats.splitAt))
  await page.getByRole('button', { name: '分割 (S)' }).click()

  const counts = await listAudioClipVolumeKeyframeCounts(page)
  expect(counts).toHaveLength(2)
  expect(counts.map((c) => c.count).sort()).toEqual([3, 3])
})

test('音量キーフレームUI: キーフレーム変更を undo で復元できる', async ({ page }) => {
  const stats = await loadVolumeKeyframeTimelineStress(page)
  const before = await getVolumeAtClipLocalTime(page, stats.clipId, 0)
  await updateVolumeKeyframeById(page, stats.clipId, stats.firstKeyframeId, { volume: 1.8 })
  expect(await getVolumeAtClipLocalTime(page, stats.clipId, 0)).toBe(1.8)

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z')
  expect(await getVolumeAtClipLocalTime(page, stats.clipId, 0)).toBeCloseTo(before, 3)
})

test('クリップ分割: 音量キーフレームを両側に再配分する', async ({ page }) => {
  const wav = makeSilentWav(2)
  await page.setInputFiles('input[accept*="audio"]', { name: 'bgm-split.wav', mimeType: 'audio/wav', buffer: wav })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'bgm-split.wav')

  await page.getByRole('button', { name: '音量キーフレーム' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()

  const timeSliders = page.getByRole('slider', { name: '位置 (秒)' })
  await timeSliders.nth(1).fill('2')

  await page.locator('main input[type="range"]').fill('1')
  await page.getByRole('button', { name: '分割 (S)' }).click()

  await expect(page.locator('footer').getByText('bgm-split.wav')).toHaveCount(2)
  await expect(page.getByRole('button', { name: '音量キーフレーム 1' })).toHaveCount(2)
})

test('タイムライン: レーンをダブルクリックでトランスフォームキーフレームを追加できる', async ({ page }) => {
  await addOpeningText(page)
  await clickTimelineClip(page, 'Opening')
  await page.getByTestId('transform-property-lane').dblclick({ position: { x: 40, y: 12 } })
  await expect(page.getByRole('button', { name: 'トランスフォームキーフレーム 1' })).toBeVisible()
})

test('タイムライン: トランスフォームキーフレームをドラッグ編集できる', async ({ page }) => {
  await page.getByRole('button', { name: 'テキストを追加' }).click()
  await clickTimelineClip(page, 'Opening')

  await page.getByRole('button', { name: 'トランスフォームキーフレーム' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await page.getByRole('slider', { name: '位置 (秒)' }).fill('0.2')

  const handle = page.getByRole('button', { name: 'トランスフォームキーフレーム 1' })
  await expect(handle).toHaveAttribute('title', /0\.2s/)

  const box = (await handle.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + 60, box.y - 8, { steps: 8 })
  await page.mouse.up()

  await expect(handle).toHaveAttribute('title', /0\.[3-9]s|1\.0s/)
})

test('タイムライン: トランスフォームキーフレームのベジェハンドルをドラッグ編集できる', async ({ page }) => {
  await page.getByRole('button', { name: 'テキストを追加' }).click()
  await clickTimelineClip(page, 'Opening')

  await page.getByRole('button', { name: 'トランスフォームキーフレーム' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await page.getByRole('slider', { name: '位置 (秒)' }).nth(1).fill('2')
  await page.getByLabel('補間イージング').selectOption('bezier')

  const handle = page.getByTestId('transform-bezier-handle-out-1')
  await expect(handle).toBeVisible()

  const box = (await handle.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + 30, box.y - 20, { steps: 10 })
  await page.mouse.up()

  const newBox = (await handle.boundingBox())!
  expect(newBox.y).not.toBeCloseTo(box.y, 0)
})

test('タイムライン: トランスフォームキーフレームの全属性を同時表示できる', async ({ page }) => {
  await page.getByRole('button', { name: 'テキストを追加' }).click()
  await clickTimelineClip(page, 'Opening')

  await page.getByRole('button', { name: 'トランスフォームキーフレーム' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await page.getByRole('slider', { name: '位置 (秒)' }).nth(1).fill('2')
  await page.getByRole('slider', { name: '不透明度' }).nth(1).fill('0.3')
  await page.getByRole('slider', { name: 'スケール' }).nth(1).fill('1.5')

  await page.getByTestId('transform-kf-show-all').click()
  await expect(page.getByTestId('transform-kf-show-all')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('transform-kf-legend')).toBeVisible()
  await expect(page.getByTestId('transform-kf-curve-opacity')).toBeVisible()
  await expect(page.getByTestId('transform-kf-curve-scale')).toBeVisible()

  await page.getByTestId('transform-kf-property-x').click()
  await expect(page.getByTestId('transform-kf-curve-x')).toHaveAttribute('stroke-width', '2')

  await page.getByTestId('transform-kf-show-all').click()
  await expect(page.getByTestId('transform-kf-curve-opacity')).toBeHidden()
  await expect(page.getByTestId('transform-kf-curve-scale')).toBeHidden()
})

test('プレビュー: 不透明度ハンドルで transform キーフレームを更新できる', async ({ page }) => {
  await page.getByRole('button', { name: 'テキストを追加' }).click()
  await clickTimelineClip(page, 'Opening')

  await page.getByRole('button', { name: 'トランスフォームキーフレーム' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()

  const opacityHandle = page.getByTitle(/不透明度 .*上下ドラッグ/)
  await expect(opacityHandle).toBeVisible()

  const box = (await opacityHandle.boundingBox())!
  await opacityHandle.hover()
  await page.mouse.down()
  await page.mouse.move(box.x, box.y + 40, { steps: 6 })
  await page.mouse.up()

  await expect(opacityHandle).not.toHaveAttribute('title', /不透明度 100%/)
})

test('インスペクター: 音量キーフレームを追加・編集できる', async ({ page }) => {
  const wav = makeSilentWav(0.5)
  await page.setInputFiles('input[accept*="audio"]', { name: 'bgm.wav', mimeType: 'audio/wav', buffer: wav })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()

  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'bgm.wav')

  await page.getByRole('button', { name: '音量キーフレーム' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await expect(page.getByText('キーフレーム 1')).toBeVisible()
  await expect(page.getByText('1件', { exact: true })).toBeVisible()
  await expect(page.getByTestId('volume-kf-graph-editor')).toBeVisible()
})

test('インスペクター: 音量キーフレームのグラフで削除と再追加ができる', async ({ page }) => {
  const wav = makeSilentWav(0.5)
  await page.setInputFiles('input[accept*="audio"]', { name: 'vol-graph.wav', mimeType: 'audio/wav', buffer: wav })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()

  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'vol-graph.wav')

  await page.getByRole('button', { name: '音量キーフレーム' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await expect(page.getByText('2件', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'グラフ上のキーフレーム 2' }).click()
  await page.locator('.ring-emerald-400\\/40').getByRole('button', { name: '削除' }).click()
  await expect(page.getByText('1件', { exact: true })).toBeVisible()

  await page.locator('.ring-emerald-400\\/40').getByRole('button', { name: '削除' }).click()
  await expect(page.getByText('0件', { exact: true })).toBeVisible()
  await expect(page.getByTestId('volume-kf-graph-editor')).toBeHidden()

  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await expect(page.getByText('1件', { exact: true })).toBeVisible()
  await expect(page.getByTestId('volume-kf-graph-editor')).toBeVisible()
})

test('インスペクター: 音量キーフレームの音量を数値入力できる', async ({ page }) => {
  const wav = makeSilentWav(0.5)
  await page.setInputFiles('input[accept*="audio"]', { name: 'vol-num.wav', mimeType: 'audio/wav', buffer: wav })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()

  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'vol-num.wav')

  await page.getByRole('button', { name: '音量キーフレーム' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await expect(page.getByTestId('volume-kf-graph-editor')).toBeVisible()

  const volumeInput = page.getByRole('spinbutton', { name: '音量 数値' })
  await volumeInput.fill('1.5')
  await volumeInput.blur()
  await expect(volumeInput).toHaveValue('1.5')
})

test('インスペクター: 速度キーフレームを追加・編集できる', async ({ page }) => {
  const webm = await makeTinyWebmVideo(page)
  await page.setInputFiles('input[accept*="video"]', { name: 'speed-kf.webm', mimeType: 'video/webm', buffer: webm })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible({ timeout: 15_000 })

  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'speed-kf.webm')

  await page.getByRole('button', { name: '再生速度' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await expect(page.getByText('キーフレーム 1')).toBeVisible()
  await expect(page.getByRole('slider', { name: '基本速度' })).toBeVisible()
})

test('クリップ分割: 速度キーフレームを両側に再配分する', async ({ page }) => {
  const webm = await makeTinyWebmVideo(page)
  await page.setInputFiles('input[accept*="video"]', { name: 'speed-split.webm', mimeType: 'video/webm', buffer: webm })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible({ timeout: 15_000 })

  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'speed-split.webm')

  await page.getByRole('button', { name: '再生速度' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()

  const timeSliders = page.getByRole('slider', { name: '位置 (秒)' })
  await timeSliders.nth(1).fill('1')

  await page.locator('main input[type="range"]').fill('0.5')
  await page.getByRole('button', { name: '分割 (S)' }).click()

  await expect(page.locator('footer').getByText('speed-split.webm')).toHaveCount(2)
  await expect(page.getByRole('button', { name: '速度キーフレーム 1' })).toHaveCount(2)
})

test('タイムライン: 速度キーフレームをドラッグ編集できる', async ({ page }) => {
  const webm = await makeTinyWebmVideo(page)
  await page.setInputFiles('input[accept*="video"]', { name: 'speed-drag.webm', mimeType: 'video/webm', buffer: webm })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible({ timeout: 15_000 })

  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'speed-drag.webm')

  await page.getByRole('button', { name: '再生速度' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await page.getByRole('slider', { name: '位置 (秒)' }).fill('0.2')

  const handle = page.getByRole('button', { name: '速度キーフレーム 1' })
  await expect(handle).toHaveAttribute('title', /0\.2s/)

  const box = (await handle.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + 60, box.y - 10, { steps: 8 })
  await page.mouse.up()

  await expect(handle).toHaveAttribute('title', /0\.[3-9]s|1\.0s/)
})

test('タイムライン: 速度キーフレームのベジェハンドルをドラッグ編集できる', async ({ page }) => {
  const webm = await makeTinyWebmVideo(page)
  await page.setInputFiles('input[accept*="video"]', { name: 'speed-bezier.webm', mimeType: 'video/webm', buffer: webm })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible({ timeout: 15_000 })

  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'speed-bezier.webm')

  await page.getByRole('button', { name: '再生速度' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await page.getByRole('slider', { name: '位置 (秒)' }).nth(1).fill('2')
  await page.getByLabel('補間イージング').selectOption('bezier')

  const handle = page.getByTestId('speed-bezier-handle-out-1')
  await expect(handle).toBeVisible()

  const box = (await handle.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + 30, box.y - 20, { steps: 10 })
  await page.mouse.up()

  const newBox = (await handle.boundingBox())!
  expect(newBox.y).not.toBeCloseTo(box.y, 0)
})

test('タイムライン: 音量キーフレームをドラッグ編集できる', async ({ page }) => {
  const wav = makeSilentWav(1)
  await page.setInputFiles('input[accept*="audio"]', { name: 'bgm.wav', mimeType: 'audio/wav', buffer: wav })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'bgm.wav')

  await page.getByRole('button', { name: '音量キーフレーム' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await page.getByRole('slider', { name: '位置 (秒)' }).fill('0.2')

  const handle = page.getByRole('button', { name: '音量キーフレーム 1' })
  await expect(handle).toHaveAttribute('title', /0\.2s/)

  const box = (await handle.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + 60, box.y - 10, { steps: 8 })
  await page.mouse.up()

  await expect(handle).toHaveAttribute('title', /0\.[3-9]s|1\.0s/)
})

test('モーダル: 開くと最初の要素にフォーカスし、Escape で閉じる', async ({ page }) => {
  await page.getByTitle('プロジェクト一覧').click()
  await expect(page.getByRole('dialog', { name: 'プロジェクト' })).toBeVisible()

  // フォーカストラップ: 最初のフォーカス可能要素へ移動している
  await expect(page.getByRole('button', { name: '+ 新規プロジェクト' })).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'プロジェクト' })).toBeHidden()
})

test('ヘルプ: 「?」キーでショートカット一覧をトグル表示', async ({ page }) => {
  await page.keyboard.press('?')
  await expect(page.getByRole('dialog', { name: 'キーボードショートカット' })).toBeVisible()
  await expect(page.getByText('再生 / 一時停止')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'キーボードショートカット' })).toBeHidden()
})

test('トランジション: 画像クリップへの適用フロー', async ({ page }) => {
  // 1x1 PNG をインポート
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  // file input は .fable インポート用とメディア用の2つあるため accept 属性で特定する
  await page.setInputFiles('input[accept*="image"]', { name: 'photo.png', mimeType: 'image/png', buffer: png })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()

  // クリックで再生位置(0秒)にクリップ追加 → タイムラインに出る
  await page.getByTitle('クリックで再生位置に追加').click()
  const clip = timelineClip(page, 'photo.png')
  await expect(clip).toBeVisible()

  // クリップを選択して効果タブからクロスフェードを適用
  await clip.click()
  await page.getByTitle('効果').click()
  await page.getByRole('button', { name: 'クロスフェード' }).click()
  await expect(page.getByText('クロスフェードを適用しました')).toBeVisible()
})

test('効果: 隣接クリップへトランジションを一括適用できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )

  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="image"]', [
    { name: 'batch-a.png', mimeType: 'image/png', buffer: png },
    { name: 'batch-b.png', mimeType: 'image/png', buffer: png },
  ])
  await expect(page.getByText('2件のメディアを追加しました')).toBeVisible()

  const cardA = page.locator('div.group.relative').filter({ hasText: 'batch-a.png' })
  const cardB = page.locator('div.group.relative').filter({ hasText: 'batch-b.png' })
  await cardA.hover()
  await cardA.getByTitle('スライドショー用に選択').click()
  await cardB.hover()
  await cardB.getByTitle('スライドショー用に選択').click()
  await page.getByRole('button', { name: 'スライドショー作成' }).click()
  await page.getByRole('dialog').locator('select').selectOption('none')
  await page.getByRole('button', { name: 'タイムラインに追加' }).click()
  await expect(page.getByText('2枚の写真をタイムラインに配置しました')).toBeVisible()

  await page.getByTitle('効果').click()
  await page.getByLabel('一括適用スコープ').selectOption('all-video-tracks')
  await page.getByLabel('一括トランジション種類').selectOption('crossfade')
  await page.getByRole('button', { name: '隣接クリップへ一括適用' }).click()
  await expect(page.getByText('1件のクリップにクロスフェードを一括適用しました')).toBeVisible()
})

test('効果: 全映像トラックからトランジションを一括削除できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )

  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="image"]', [
    { name: 'clear-a.png', mimeType: 'image/png', buffer: png },
    { name: 'clear-b.png', mimeType: 'image/png', buffer: png },
  ])
  await expect(page.getByText('2件のメディアを追加しました')).toBeVisible()

  const cardA = page.locator('div.group.relative').filter({ hasText: 'clear-a.png' })
  const cardB = page.locator('div.group.relative').filter({ hasText: 'clear-b.png' })
  await cardA.hover()
  await cardA.getByTitle('スライドショー用に選択').click()
  await cardB.hover()
  await cardB.getByTitle('スライドショー用に選択').click()
  await page.getByRole('button', { name: 'スライドショー作成' }).click()
  await page.getByRole('dialog').locator('select').selectOption('none')
  await page.getByRole('button', { name: 'タイムラインに追加' }).click()
  await expect(page.getByText('2枚の写真をタイムラインに配置しました')).toBeVisible()

  await page.getByTitle('効果').click()
  await page.getByLabel('一括適用スコープ').selectOption('all-video-tracks')
  await page.getByLabel('一括トランジション種類').selectOption('crossfade')
  await page.getByRole('button', { name: '隣接クリップへ一括適用' }).click()
  await expect(page.getByText('1件のクリップにクロスフェードを一括適用しました')).toBeVisible()

  await page.getByLabel('一括削除スコープ').selectOption('all-video-tracks')
  await page.getByRole('button', { name: 'トランジションを一括削除' }).click()
  await expect(page.getByText('1件のクリップからトランジションを一括削除しました')).toBeVisible()
})

test('効果: ストレスプロジェクトで全映像トラックから30件一括削除できる', async ({ page }) => {
  await loadBatchTransitionRemovalStress(page)
  await expect.poll(() => countClipsWithTransition(page)).toBe(30)

  await page.getByTitle('効果').click()
  await page.getByLabel('一括削除スコープ').selectOption('all-video-tracks')
  await page.getByRole('button', { name: 'トランジションを一括削除' }).click()
  await expect(page.getByText('30件のクリップからトランジションを一括削除しました')).toBeVisible()
  await expect.poll(() => countClipsWithTransition(page)).toBe(0)
})

test('効果: selected-track スコープで副トラックのみ一括削除できる', async ({ page }) => {
  const stats = await loadBatchTransitionRemovalStress(page)
  await selectClipById(page, stats.firstSecondaryClipId)

  await page.getByTitle('効果').click()
  await page.getByLabel('一括削除スコープ').selectOption('selected-track')
  await page.getByRole('button', { name: 'トランジションを一括削除' }).click()
  await expect(page.getByText('10件のクリップからトランジションを一括削除しました')).toBeVisible()
  await expect.poll(() => countClipsWithTransition(page)).toBe(20)
})

test('効果: 一括削除を undo で復元できる', async ({ page }) => {
  await loadBatchTransitionRemovalStress(page)
  await expect.poll(() => countClipsWithTransition(page)).toBe(30)

  await page.getByTitle('効果').click()
  await page.getByLabel('一括削除スコープ').selectOption('all-video-tracks')
  await page.getByRole('button', { name: 'トランジションを一括削除' }).click()
  await expect.poll(() => countClipsWithTransition(page)).toBe(0)

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z')
  await expect.poll(() => countClipsWithTransition(page)).toBe(30)
})

test('効果: ストレスプロジェクトで全映像トラックへ一括適用できる', async ({ page }) => {
  const stats = await loadBatchTransitionStress(page)
  expect(stats.allVideoTargetCount).toBe(30)

  await page.getByTitle('効果').click()
  await page.getByLabel('一括適用スコープ').selectOption('all-video-tracks')
  await page.getByLabel('一括トランジション種類').selectOption('zoom')
  await page.getByRole('button', { name: '隣接クリップへ一括適用' }).click()
  await expect(page.getByText('30件のクリップにズームを一括適用しました')).toBeVisible()
  await expect.poll(() => countClipsWithTransition(page)).toBe(30)
})

test('効果: selected-track スコープで副トラックのみ一括適用できる', async ({ page }) => {
  const stats = await loadBatchTransitionStress(page)
  await selectClipById(page, stats.firstSecondaryClipId)

  await page.getByTitle('効果').click()
  await page.getByLabel('一括適用スコープ').selectOption('selected-track')
  await page.getByLabel('一括トランジション種類').selectOption('slideLeft')
  await page.getByRole('button', { name: '隣接クリップへ一括適用' }).click()
  await expect(page.getByText('10件のクリップにスライド左を一括適用しました')).toBeVisible()
  await expect.poll(() => countClipsWithTransition(page)).toBe(10)
})

test('効果: 一括適用を undo で復元できる', async ({ page }) => {
  await loadBatchTransitionStress(page)

  await page.getByTitle('効果').click()
  await page.getByLabel('一括適用スコープ').selectOption('all-video-tracks')
  await page.getByLabel('一括トランジション種類').selectOption('crossfade')
  await page.getByRole('button', { name: '隣接クリップへ一括適用' }).click()
  await expect.poll(() => countClipsWithTransition(page)).toBe(30)

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z')
  await expect.poll(() => countClipsWithTransition(page)).toBe(0)
})

test('色調補正: カラールックプリセットを適用できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  await page.setInputFiles('input[accept*="image"]', { name: 'photo.png', mimeType: 'image/png', buffer: png })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'photo.png')

  await expect(page.getByLabel('カラールックプレビュー')).toBeVisible()
  await expect(page.getByLabel('カラールックプレビュー').locator('canvas')).toBeVisible()
  await page.getByRole('button', { name: 'フィルム風ルック', exact: true }).click()
  await expect(page.getByText('「フィルム風」ルックを適用しました')).toBeVisible()
  await expect(page.getByRole('button', { name: 'フィルム風ルック', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('色調補正: カラールックプリセットを JSON エクスポート/インポートできる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  await page.setInputFiles('input[accept*="image"]', { name: 'photo.png', mimeType: 'image/png', buffer: png })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'photo.png')

  await page.getByRole('button', { name: 'フィルム風ルック', exact: true }).click()
  await page.getByRole('slider', { name: 'ミッドトーン' }).fill('0.15')
  await page.getByLabel('ルックプリセット名').fill('E2EColorLook')
  await page.getByRole('button', { name: 'ルック保存' }).click()
  await expect(page.getByText('「E2EColorLook」ルックを保存しました')).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'E2EColorLookをエクスポート' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toContain('.fable-color-look-preset.json')

  const exportPath = path.join(test.info().outputDir, 'e2e-color-look-preset.json')
  await download.saveAs(exportPath)

  await page.getByRole('button', { name: 'E2EColorLookを削除' }).click()
  await expect(page.getByRole('button', { name: 'E2EColorLookルック', exact: true })).toBeHidden()

  await page.getByLabel('カラールックプリセットファイルをインポート').setInputFiles(exportPath)
  await expect(page.getByText('「E2EColorLook」ルックプリセットをインポートしました')).toBeVisible()

  await page.getByRole('button', { name: 'なしルック', exact: true }).click()
  await page.getByRole('button', { name: 'E2EColorLookルック', exact: true }).click()
  await expect(page.getByText('「E2EColorLook」ルックを適用しました')).toBeVisible()
  await expect(page.getByRole('button', { name: 'E2EColorLookルック', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('色調補正: RGB カーブ変更で組み込みルックの選択が解除される', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  await page.setInputFiles('input[accept*="image"]', { name: 'rgb-look-photo.png', mimeType: 'image/png', buffer: png })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'rgb-look-photo.png')

  const filmButton = page.getByRole('button', { name: 'フィルム風ルック', exact: true })
  await filmButton.click()
  await expect(filmButton).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('slider', { name: 'R カーブ 50%' }).fill('0.7')
  await expect(filmButton).toHaveAttribute('aria-pressed', 'false')
})

test('色調補正: RGB カーブ付きルックを保存して再適用できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  await page.setInputFiles('input[accept*="image"]', { name: 'rgb-save-photo.png', mimeType: 'image/png', buffer: png })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'rgb-save-photo.png')

  await page.getByRole('button', { name: 'フィルム風ルック', exact: true }).click()
  await page.getByRole('slider', { name: 'R カーブ 50%' }).fill('0.65')
  await page.getByLabel('ルックプリセット名').fill('E2ERgbLook')
  await page.getByRole('button', { name: 'ルック保存' }).click()
  await expect(page.getByText('「E2ERgbLook」ルックを保存しました')).toBeVisible()

  await page.getByRole('button', { name: 'なしルック', exact: true }).click()
  const savedButton = page.getByRole('button', { name: 'E2ERgbLookルック', exact: true })
  await savedButton.click()
  await expect(page.getByText('「E2ERgbLook」ルックを適用しました')).toBeVisible()
  await expect(savedButton).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'フィルム風ルック', exact: true })).toHaveAttribute('aria-pressed', 'false')
})

test('色調補正: ルックプリセット要約にトーンカーブとRGBカーブが表示される', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  await page.setInputFiles('input[accept*="image"]', { name: 'summary-photo.png', mimeType: 'image/png', buffer: png })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'summary-photo.png')

  await page.getByRole('slider', { name: 'ミッドトーン' }).fill('0.2')
  await page.getByRole('slider', { name: 'R カーブ 50%' }).fill('0.65')
  await page.getByLabel('ルックプリセット名').fill('E2ESummaryLook')
  await page.getByRole('button', { name: 'ルック保存' }).click()
  await expect(page.getByText('「E2ESummaryLook」ルックを保存しました')).toBeVisible()
  await expect(page.getByText(/ミッド.*RGBカーブ\(R\)|RGBカーブ\(R\).*ミッド/)).toBeVisible()
})

test('映像フェード: 画像クリップにフェードインを設定できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  await page.setInputFiles('input[accept*="image"]', { name: 'photo.png', mimeType: 'image/png', buffer: png })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'photo.png')

  await page.getByRole('button', { name: 'フェード' }).click()
  const fadeIn = page.getByRole('slider', { name: 'フェードイン' })
  await fadeIn.fill('0.5')
  await expect(fadeIn).toHaveValue('0.5')
})

test('タイムライン: クリップのドラッグ移動', async ({ page }) => {
  await addOpeningText(page)
  const clip = page.locator('footer').getByText('Opening')

  const before = (await clip.boundingBox())!

  // クリップ中央を掴んで右へ 160px (80px/s なので +2秒) ドラッグ
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2)
  await page.mouse.down()
  await page.mouse.move(before.x + before.width / 2 + 160, before.y + before.height / 2, { steps: 8 })
  await page.mouse.up()

  const after = (await clip.boundingBox())!
  // スナップ閾値(0.15秒=12px)を考慮した誤差内で移動している
  expect(after.x - before.x).toBeGreaterThan(140)
  expect(after.x - before.x).toBeLessThan(180)
})

test('タイムライン: 右端ハンドルのトリムで長さが短くなる', async ({ page }) => {
  await addOpeningText(page)
  const clip = page.locator('footer').getByText('Opening')
  const before = (await clip.boundingBox())!

  // 回帰ケース: ラベル行と重なる上部の高さ(y+10px)でハンドルを掴む
  // (かつてラベルがハンドルを覆い「移動」ドラッグになるバグがあった)
  await page.mouse.move(before.x + before.width - 3, before.y + 10)
  await page.mouse.down()
  await page.mouse.move(before.x + before.width - 83, before.y + 10, { steps: 5 })
  await page.mouse.up()

  // 80px/s なので約1秒短縮。開始位置は変わらない
  const after = (await clip.boundingBox())!
  expect(after.x).toBeCloseTo(before.x, 0)
  expect(before.width - after.width).toBeGreaterThan(60)
  expect(before.width - after.width).toBeLessThan(100)
})

test('タイムライン: 左端ハンドルのトリムで開始位置と長さが変わる', async ({ page }) => {
  await addOpeningText(page)
  const clip = page.locator('footer').getByText('Opening')
  const before = (await clip.boundingBox())!

  // 左端ハンドルを右へ 80px (約1秒) ドラッグ
  await page.mouse.move(before.x + 3, before.y + before.height / 2)
  await page.mouse.down()
  await page.mouse.move(before.x + 83, before.y + before.height / 2, { steps: 5 })
  await page.mouse.up()

  // startTime が約1秒進み、duration が約1秒縮む(右端は動かない)
  const after = (await clip.boundingBox())!
  expect(after.x - before.x).toBeGreaterThan(60)
  expect(after.x - before.x).toBeLessThan(100)
  expect(before.width - after.width).toBeGreaterThan(60)
  expect(after.x + after.width).toBeCloseTo(before.x + before.width, 0)
})

test('タイムライン: Alt+ドラッグでクリップを複製して移動', async ({ page }) => {
  await addOpeningText(page)
  const clips = page.locator('footer').getByText('Opening')
  await expect(clips).toHaveCount(1)

  const box = (await clips.first().boundingBox())!
  await page.keyboard.down('Alt')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 200, box.y + box.height / 2, { steps: 8 })
  await page.mouse.up()
  await page.keyboard.up('Alt')

  // 元クリップが残り、複製が移動している
  await expect(clips).toHaveCount(2)

  // Cmd/Ctrl+Z 一発で複製ごと取り消せる
  await page.keyboard.press('ControlOrMeta+z')
  await expect(clips).toHaveCount(1)
})

test('書き出し: プリセットを保存して適用できる', async ({ page }) => {
  await addOpeningText(page)
  await page.getByRole('button', { name: '書き出し' }).click()

  await page.getByRole('button', { name: /軽量/ }).click()
  await page.getByRole('button', { name: '解像度 720p' }).click()
  await page.getByPlaceholder('プリセット名').fill('SNS用')
  await page.getByRole('button', { name: 'プリセット保存' }).click()
  await expect(page.getByText('「SNS用」プリセットを保存しました')).toBeVisible()
  await expect(page.getByRole('button', { name: 'SNS用を適用' })).toBeVisible()

  await page.getByRole('button', { name: /高品質/ }).click()
  await page.getByRole('button', { name: '解像度 プロジェクト' }).click()
  await expect(page.getByRole('button', { name: /軽量/ })).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByRole('button', { name: '解像度 720p' })).toHaveAttribute('aria-pressed', 'false')

  await page.getByRole('button', { name: 'SNS用を適用' }).click()
  await expect(page.getByText('「SNS用」プリセットを適用しました')).toBeVisible()
  await expect(page.getByRole('button', { name: /軽量/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: '解像度 720p' })).toHaveAttribute('aria-pressed', 'true')
})

test('書き出し: プリセットを JSON エクスポート/インポートできる', async ({ page }) => {
  await addOpeningText(page)
  await page.getByRole('button', { name: '書き出し' }).click()

  await page.getByRole('button', { name: /軽量/ }).click()
  await page.getByRole('button', { name: '解像度 720p' }).click()
  await page.getByPlaceholder('プリセット名').fill('E2EExportPreset')
  await page.getByRole('button', { name: 'プリセット保存' }).click()
  await expect(page.getByText('「E2EExportPreset」プリセットを保存しました')).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'E2EExportPresetをエクスポート' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toContain('.fable-export-preset.json')

  const exportPath = path.join(test.info().outputDir, 'e2e-export-preset.json')
  await download.saveAs(exportPath)

  await page.getByRole('button', { name: 'E2EExportPresetを削除' }).click()
  await expect(page.getByRole('button', { name: 'E2EExportPresetを適用' })).toBeHidden()

  await page.getByLabel('書き出しプリセットファイルをインポート').setInputFiles(exportPath)
  await expect(page.getByText('「E2EExportPreset」プリセットをインポートしました')).toBeVisible()

  await page.getByRole('button', { name: 'E2EExportPresetを適用' }).click()
  await expect(page.getByText('「E2EExportPreset」プリセットを適用しました')).toBeVisible()
  await expect(page.getByRole('button', { name: /軽量/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: '解像度 720p' })).toHaveAttribute('aria-pressed', 'true')
})

test('書き出し: 正方形プロジェクトはネイティブ解像度で書き出せる', async ({ page }) => {
  await addOpeningText(page)
  await page.getByTitle('プロジェクト設定').click()
  await page.getByRole('button', { name: /正方形/ }).click()
  await page.getByRole('button', { name: '適用' }).click()

  await page.getByRole('button', { name: '書き出し' }).click()
  await expect(page.getByText('プロジェクト解像度: 1080×1080')).toBeVisible()
  await expect(page.getByRole('button', { name: '1080×1080 で書き出し' })).toBeVisible()
})

test('書き出し: 縦型9:16プロジェクトはネイティブ解像度で書き出せる', async ({ page }) => {
  await addOpeningText(page)
  await page.getByTitle('プロジェクト設定').click()
  await page.getByRole('button', { name: /縦型 9:16/ }).click()
  await page.getByRole('button', { name: '適用' }).click()

  await page.getByRole('button', { name: '書き出し' }).click()
  await expect(page.getByText('プロジェクト解像度: 1080×1920')).toBeVisible()
  await expect(page.getByRole('button', { name: '9:16 で書き出し' })).toBeVisible()
})

test('テンプレート: 構造化テンプレートで章マーカーと写真ガイドを配置', async ({ page }) => {
  await page.getByTitle('テンプレ').click()
  await page.getByRole('button', { name: /結婚式フル構成/ }).click()
  await expect(page.getByText('結婚式フル構成テンプレートを適用しました')).toBeVisible()

  await expect(page.locator('[title="オープニング"]')).toBeVisible()
  await expect(page.locator('[title="新郎プロフィール"]')).toBeVisible()
  await expect(page.locator('footer').getByText('写真: 新郎 幼少期')).toBeVisible()
  await expect(page.locator('footer').getByText('Opening')).toBeVisible()
})

test('構造化ウェディング: ストレス投入で11クリップ・5章マーカーが配置される', async ({ page }) => {
  const stats = await loadStructuredWeddingTemplateStress(page)
  expect(stats.totalClipCount).toBe(11)
  expect(stats.photoGuideCount).toBe(8)
  expect(stats.markerCount).toBe(5)
  expect(stats.textClipCount).toBe(3)
  await expect(page.locator('footer').getByText('Opening')).toBeVisible()
  await expect(page.locator('[title="オープニング"]')).toBeVisible()
  await expect(page.locator('footer').getByText(stats.firstPhotoGuideLabel)).toBeVisible()
})

test('構造化ウェディング: 適用を undo で復元できる', async ({ page }) => {
  const stats = await loadStructuredWeddingTemplateStress(page)
  expect(stats.totalClipCount).toBe(11)

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z')
  await expect.poll(() => getProjectClipCount(page)).toBe(0)
  expect(await getChapterMarkerCount(page)).toBe(0)
  expect(await getPhotoGuideClipCount(page)).toBe(0)
})

test('構造化ウェディング: undo 後の再適用で章マーカーと写真ガイドが復元される', async ({ page }) => {
  await loadStructuredWeddingTemplateStress(page)
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z')
  await expect.poll(() => getProjectClipCount(page)).toBe(0)

  await applyWeddingFullTemplate(page)
  const stats = await getStructuredWeddingTemplateStressStats(page)
  expect(stats.totalClipCount).toBe(11)
  expect(stats.photoGuideCount).toBe(8)
  expect(stats.markerCount).toBe(5)
  expect(stats.chapterLabels).toContain('新郎プロフィール')
  await expect(page.locator('footer').getByText('写真: 新郎 幼少期')).toBeVisible()
})

test('縦型9:16: ストレス投入で1080×1920と9:16書き出しラベルが設定される', async ({ page }) => {
  const stats = await loadVertical916PresetStress(page)
  expect(stats.width).toBe(1080)
  expect(stats.height).toBe(1920)
  expect(stats.exportButtonLabel).toBe('9:16 で書き出し')
  expect(stats.nativeExportWidth).toBe(1080)
  expect(stats.nativeExportHeight).toBe(1920)

  await addOpeningText(page)
  await page.getByRole('button', { name: '書き出し' }).click()
  await expect(page.getByText('プロジェクト解像度: 1080×1920')).toBeVisible()
  await expect(page.getByRole('button', { name: '9:16 で書き出し' })).toBeVisible()
})

test('縦型9:16: 適用を undo で1080pに復元できる', async ({ page }) => {
  await loadVertical916PresetStress(page)
  expect(await getProjectWidth(page)).toBe(1080)
  expect(await getProjectHeight(page)).toBe(1920)

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z')
  expect(await getProjectWidth(page)).toBe(1920)
  expect(await getProjectHeight(page)).toBe(1080)

  const stats = await getVertical916PresetStressStats(page)
  expect(stats.exportButtonLabel).toBe('1080p で書き出し')
})

test('縦型9:16: undo 後の再適用で縦型解像度と書き出しラベルが復元される', async ({ page }) => {
  await loadVertical916PresetStress(page)
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z')
  expect(await getProjectWidth(page)).toBe(1920)

  const stats = await applyVertical916Preset(page)
  expect(stats.width).toBe(1080)
  expect(stats.height).toBe(1920)
  expect(stats.exportButtonLabel).toBe('9:16 で書き出し')

  await addOpeningText(page)
  await page.getByRole('button', { name: '書き出し' }).click()
  await expect(page.getByRole('button', { name: '9:16 で書き出し' })).toBeVisible()
})

test('書き出し整合: ストレス投入で4形式検証・4K状態・720pダウンスケール', async ({ page }) => {
  const stats = await loadExportResolutionAlignmentStress(page)
  expect(stats.verifiedPresetIds).toHaveLength(4)
  expect(stats.verifiedPresetIds).toContain('4k')
  expect(stats.verifiedPresetIds).toContain('square')
  expect(stats.width).toBe(3840)
  expect(stats.height).toBe(2160)
  expect(stats.nativeExportLabel).toBe('4K で書き出し')
  expect(stats.downscale720Width).toBe(1280)
  expect(stats.downscale720Height).toBe(720)

  await addOpeningText(page)
  await page.getByRole('button', { name: '書き出し' }).click()
  await expect(page.getByText('プロジェクト解像度: 3840×2160')).toBeVisible()
  await expect(page.getByRole('button', { name: '4K で書き出し' })).toBeVisible()
  await expect(page.getByRole('button', { name: '720p で書き出し' })).toBeVisible()
  await page.getByRole('button', { name: '解像度 720p' }).click()
  await expect(page.getByText('1280×720').first()).toBeVisible()
})

test('書き出し整合: 適用を undo で1080pに復元できる', async ({ page }) => {
  await loadExportResolutionAlignmentStress(page)
  expect(await getProjectWidth(page)).toBe(3840)

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z')
  expect(await getProjectWidth(page)).toBe(1920)
  expect(await getProjectHeight(page)).toBe(1080)

  const stats = await getExportResolutionAlignmentStressStats(page)
  expect(stats.nativeExportLabel).toBe('1080p で書き出し')
  expect(stats.downscale720Width).toBe(1280)
  expect(stats.downscale720Height).toBe(720)
})

test('書き出し整合: undo 後の再適用で正方形ネイティブと720pダウンスケール', async ({ page }) => {
  await loadExportResolutionAlignmentStress(page)
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z')

  const stats = await applyResolutionPresetById(page, 'square')
  expect(stats.width).toBe(1080)
  expect(stats.height).toBe(1080)
  expect(stats.nativeExportLabel).toBe('1080×1080 で書き出し')
  expect(stats.downscale720Width).toBe(1280)

  await addOpeningText(page)
  await page.getByRole('button', { name: '書き出し' }).click()
  await expect(page.getByText('プロジェクト解像度: 1080×1080')).toBeVisible()
  await expect(page.getByRole('button', { name: '1080×1080 で書き出し' })).toBeVisible()
  await page.getByRole('button', { name: '解像度 720p' }).click()
  await expect(page.getByText('1280×720').first()).toBeVisible()
})

test('書き出しプリセット: ストレス投入で4件保存・UI適用で品質/解像度が反映される', async ({ page }) => {
  const stats = await loadExportPresetStress(page)
  expect(stats.presetCount).toBe(4)
  expect(stats.names).toContain('SNS軽量')

  await addOpeningText(page)
  await page.getByRole('button', { name: '書き出し' }).click()
  await page.getByRole('button', { name: 'SNS軽量を適用' }).click()
  await expect(page.getByText('「SNS軽量」プリセットを適用しました')).toBeVisible()
  await expect(page.getByRole('button', { name: /軽量SNS共有/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: '解像度 720p' })).toHaveAttribute('aria-pressed', 'true')
})

test('書き出しプリセット: In/Outクリア後の再適用で範囲が復元される', async ({ page }) => {
  const stats = await loadExportPresetStress(page)
  await applyExportPresetByName(page, stats.highlightPresetName)
  expect(await getInPoint(page)).toBe(stats.highlightInPoint)
  expect(await getOutPoint(page)).toBe(stats.highlightOutPoint)

  await applyExportPresetByName(page, '標準全体')
  expect(await getInPoint(page)).toBeNull()
  expect(await getOutPoint(page)).toBeNull()

  await applyExportPresetByName(page, stats.highlightPresetName)
  expect(await getInPoint(page)).toBe(stats.highlightInPoint)
  expect(await getOutPoint(page)).toBe(stats.highlightOutPoint)
})

test('書き出しプリセット: JSON往復で4件が維持される', async ({ page }) => {
  const stats = await loadExportPresetExportStress(page)
  await clearExportPresets(page)
  expect(await getExportPresetCount(page)).toBe(0)

  const names = await importExportPresetJson(page, stats.exportJson)
  expect(names).toHaveLength(stats.presetCount)
  expect(await getExportPresetCount(page)).toBe(stats.presetCount)
})

test('映像フェード: ストレス投入で2クリップ・開始/終端不透明度が整合', async ({ page }) => {
  const stats = await loadVideoFadeStress(page)
  expect(stats.clipCount).toBe(2)
  expect(stats.imageOpacityAtStart).toBe(0)
  expect(stats.imageOpacityAtMid).toBeCloseTo(0.5)
  expect(stats.videoOpacityAtEnd).toBe(0)
  expect(await getMediaVisualOpacityForClip(page, stats.imageClipId, 0)).toBe(0)
  expect(await getMediaVisualOpacityForClip(page, stats.videoClipId, stats.videoFadeIn)).toBeCloseTo(1)
})

test('映像フェード: 適用を undo で復元できる', async ({ page }) => {
  const stats = await loadVideoFadeStress(page)
  await applyClipFade(page, stats.imageClipId, 0.2, 0.2)
  expect((await getClipFadeValues(page, stats.imageClipId)).fadeIn).toBe(0.2)

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z')
  expect((await getClipFadeValues(page, stats.imageClipId)).fadeIn).toBe(stats.imageFadeIn)
  expect((await getClipFadeValues(page, stats.imageClipId)).fadeOut).toBe(stats.imageFadeOut)
  expect(await getMediaVisualOpacityForClip(page, stats.imageClipId, 0)).toBe(0)
})

test('映像フェード: undo 後の再適用でフェードが復元される', async ({ page }) => {
  const stats = await loadVideoFadeStress(page)
  await applyClipFade(page, stats.videoClipId, 0, 0)
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z')

  const applied = await applyClipFade(page, stats.videoClipId, stats.videoFadeIn, stats.videoFadeOut)
  expect(applied.fadeIn).toBe(stats.videoFadeIn)
  expect(applied.fadeOut).toBe(stats.videoFadeOut)
  expect(await getMediaVisualOpacityForClip(page, stats.videoClipId, stats.videoFadeIn)).toBeCloseTo(1)
  expect(await getMediaVisualOpacityForClip(page, stats.videoClipId, 6)).toBe(0)
})

test('写真ガイド: 選択区間にスライドショーを配置できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )

  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="image"]', [
    { name: 'guide-a.png', mimeType: 'image/png', buffer: png },
    { name: 'guide-b.png', mimeType: 'image/png', buffer: png },
  ])
  await expect(page.getByText('2件のメディアを追加しました')).toBeVisible()

  await page.getByTitle('テンプレ').click()
  await page.getByRole('button', { name: /結婚式フル構成/ }).click()

  await clickTimelineClip(page, '写真: 新郎 幼少期')
  await expect(page.getByRole('button', { name: 'ガイド区間にスライドショーを配置' })).toBeVisible()
  await page.getByRole('button', { name: 'ガイド区間にスライドショーを配置' }).click()
  await expect(page.getByText('2枚の写真をガイド区間に配置しました')).toBeVisible()

  await expect(page.locator('footer').getByText('写真: 新郎 幼少期')).toBeHidden()
  await expect(page.locator('footer').getByText('guide-a.png')).toBeVisible()
  await expect(page.locator('footer').getByText('guide-b.png')).toBeVisible()
})

test('写真ガイド: 52 枚を1区間に配置できる', async ({ page }) => {
  const stats = await loadPhotoGuideSlideshowStress(page)
  expect(stats.imageCount).toBeGreaterThanOrEqual(50)
  expect(stats.guideCount).toBeGreaterThanOrEqual(5)

  await clickTimelineClip(page, '写真: 新郎 幼少期')
  await page.getByRole('button', { name: 'ガイド区間にスライドショーを配置' }).click()
  await expect(page.getByText(`${stats.imageCount}枚の写真をガイド区間に配置しました`)).toBeVisible()
  await expect(page.locator('footer').getByText('写真: 新郎 幼少期')).toBeHidden()
  await expect(page.locator('footer').getByText('photo-001.jpg')).toBeVisible()
})

test('写真ガイド: 複数区間に順次配置できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  await applyWeddingFullTemplate(page)
  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="image"]', [
    { name: 'multi-a.png', mimeType: 'image/png', buffer: png },
    { name: 'multi-b.png', mimeType: 'image/png', buffer: png },
    { name: 'multi-c.png', mimeType: 'image/png', buffer: png },
  ])
  await expect(page.getByText('3件のメディアを追加しました')).toBeVisible()

  await clickTimelineClip(page, '写真: 新郎 幼少期')
  await page.locator('label').filter({ hasText: 'multi-a.png' }).locator('input').uncheck()
  await page.getByRole('button', { name: 'ガイド区間にスライドショーを配置' }).click()
  await expect(page.getByText('2枚の写真をガイド区間に配置しました')).toBeVisible()

  await clickTimelineClip(page, '写真: 新婦 幼少期')
  await page.locator('label').filter({ hasText: 'multi-a.png' }).locator('input').check()
  await page.locator('label').filter({ hasText: 'multi-b.png' }).locator('input').uncheck()
  await page.locator('label').filter({ hasText: 'multi-c.png' }).locator('input').uncheck()
  await page.getByRole('button', { name: 'ガイド区間にスライドショーを配置' }).click()
  await expect(page.getByText('1枚の写真をガイド区間に配置しました')).toBeVisible()
})

test('写真ガイド: 配置後に undo でガイドが復元される', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  await applyWeddingFullTemplate(page)
  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="image"]', { name: 'undo-guide.png', mimeType: 'image/png', buffer: png })
  await clickTimelineClip(page, '写真: 新郎 幼少期')
  await page.getByRole('button', { name: 'ガイド区間にスライドショーを配置' }).click()
  await expect(page.getByText('1枚の写真をガイド区間に配置しました')).toBeVisible()
  await expect(page.locator('footer').getByText('写真: 新郎 幼少期')).toBeHidden()

  await page.keyboard.press('Meta+z')
  await expect(page.locator('footer').getByText('写真: 新郎 幼少期')).toBeVisible()
  await expect(page.locator('footer').getByText('undo-guide.png')).toBeHidden()
})

test('書き出し: 章マーカー区間を In/Out に設定できる', async ({ page }) => {
  await page.getByTitle('テンプレ').click()
  await page.getByRole('button', { name: /結婚式フル構成/ }).click()
  await page.getByRole('button', { name: '書き出し' }).click()

  await page.getByRole('button', { name: '章「新郎プロフィール」を In/Out に設定' }).click()
  await expect(page.getByText('「新郎プロフィール」を In/Out に設定しました')).toBeVisible()
  await expect(page.getByText('IN 20.0')).toBeVisible()
  await expect(page.getByText('OUT 50.0')).toBeVisible()
  await expect(page.getByText('書き出し範囲: 20.0–50.0s')).toBeVisible()
})

test('書き出し: 先頭章・末尾章の In/Out 境界', async ({ page }) => {
  await applyWeddingFullTemplate(page)
  await page.getByRole('button', { name: '書き出し' }).click()

  await page.getByRole('button', { name: '章「オープニング」を In/Out に設定' }).click()
  await expect(page.getByText('書き出し範囲: 0.0–20.0s')).toBeVisible()

  await page.getByRole('button', { name: '章「エンディング」を In/Out に設定' }).click()
  await expect(page.getByText(/書き出し範囲: 110\.0–/)).toBeVisible()
})

test('書き出し: 章 In/Out 範囲の書き出しをキャンセルできる', async ({ page }) => {
  test.setTimeout(120_000)

  const encodersSupported = await checkEncodersSupported(page)
  test.skip(!encodersSupported, 'エンコーダ非対応環境のためスキップ')

  await applyWeddingFullTemplate(page)
  await page.getByRole('button', { name: '書き出し' }).click()
  await page.getByRole('button', { name: '章「新郎プロフィール」を In/Out に設定' }).click()
  await page.getByRole('button', { name: '軽量' }).click()
  await page.getByRole('button', { name: '1080p で書き出し' }).click()
  await page.getByRole('button', { name: 'キャンセル' }).click()
  await expect(page.getByRole('status', { name: '書き出し結果' })).toBeVisible()
  await expect(page.getByText('書き出しをキャンセルしました')).toBeVisible()
  await expect(page.getByText('書き出し範囲: 20.0–50.0s')).toBeVisible()
})

test('書き出し: 章 In/Out 範囲の MP4 をダウンロード（対応環境）', async ({ page }) => {
  test.setTimeout(180_000)

  const encodersSupported = await checkEncodersSupported(page)
  test.skip(!encodersSupported, 'エンコーダ非対応環境のためスキップ')

  await applyWeddingFullTemplate(page)
  await page.getByRole('button', { name: '書き出し' }).click()
  await page.getByRole('button', { name: '章「オープニング」を In/Out に設定' }).click()
  await expect(page.getByText('書き出し範囲: 0.0–20.0s')).toBeVisible()
  await page.getByRole('button', { name: '軽量' }).click()
  const downloadPromise = page.waitForEvent('download', { timeout: 150_000 })
  await page.getByRole('button', { name: '1080p で書き出し' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/\.mp4$/)
  await expect(page.getByText('書き出しが完了しました')).toBeVisible()
})

test('書き出し: 章マーカー一括書き出し UI が表示される', async ({ page }) => {
  await page.getByTitle('テンプレ').click()
  await page.getByRole('button', { name: /結婚式フル構成/ }).click()
  await page.getByRole('button', { name: '書き出し' }).click()

  await expect(page.getByRole('button', { name: '全章を ZIP で書き出し' })).toBeVisible()
  await expect(page.getByText('5 章を個別 MP4 化して ZIP にまとめます')).toBeVisible()
  await expect(page.getByRole('button', { name: '全章を ZIP で書き出し' })).toContainText('5 章')
})

test('書き出し: 大容量プロジェクトで章 ZIP UI（6 章・50+ クリップ）', async ({ page }) => {
  const stats = await loadChapterExportStressProject(page)
  expect(stats.totalClips).toBeGreaterThanOrEqual(50)
  expect(stats.chapterCount).toBeGreaterThanOrEqual(6)

  await page.getByRole('button', { name: '書き出し' }).click()
  await expect(page.getByRole('button', { name: '全章を ZIP で書き出し' })).toBeVisible()
  await expect(page.getByText('6 章を個別 MP4 化して ZIP にまとめます')).toBeVisible()
  await expect(page.getByRole('button', { name: /章「オープニング」を In\/Out に設定/ })).toBeVisible()
})

test('書き出し: 章 ZIP 一括をキャンセルできる', async ({ page }) => {
  test.setTimeout(120_000)

  const encodersSupported = await checkEncodersSupported(page)
  test.skip(!encodersSupported, 'エンコーダ非対応環境のためスキップ')

  await loadChapterExportE2eProject(page)
  await page.getByRole('button', { name: '書き出し' }).click()
  await page.getByRole('button', { name: '軽量' }).click()
  await page.getByRole('button', { name: '全章を ZIP で書き出し' }).click()
  await expect(page.getByText(/章「.+」を書き出し中/)).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: 'キャンセル' }).click()
  await expect(page.getByRole('status', { name: '書き出し結果' })).toBeVisible()
  await expect(page.getByText('書き出しをキャンセルしました')).toBeVisible()
  await page.getByRole('button', { name: '設定に戻る' }).click()
  await expect(page.getByRole('button', { name: '全章を ZIP で書き出し' })).toBeVisible()
})

test('書き出し: 短尺プロジェクトで章 ZIP をダウンロード（対応環境）', async ({ page }) => {
  test.setTimeout(300_000)

  const encodersSupported = await checkEncodersSupported(page)
  test.skip(!encodersSupported, 'エンコーダ非対応環境のためスキップ')

  await loadChapterExportE2eProject(page)
  await page.getByRole('button', { name: '書き出し' }).click()
  await page.getByRole('button', { name: '軽量' }).click()
  const downloadPromise = page.waitForEvent('download', { timeout: 240_000 })
  await page.getByRole('button', { name: '全章を ZIP で書き出し' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/_chapters\.zip$/)
  await expect(page.getByText(/6 章を ZIP で書き出しました/)).toBeVisible({ timeout: 30_000 })
})

test('マーカー: インスペクターで編集しタイムライン上でドラッグ移動できる', async ({ page }) => {
  await page.getByTitle('テンプレ').click()
  await page.getByRole('button', { name: /結婚式フル構成/ }).click()

  const marker = page.locator('[title="新郎プロフィール"]')
  await marker.click()
  const markerId = await marker.getAttribute('data-marker-id')
  expect(markerId).toBeTruthy()
  await expect(page.locator('aside').getByText('章マーカー', { exact: true })).toBeVisible()

  const labelInput = page.getByRole('textbox', { name: 'マーカーラベル' })
  await labelInput.fill('新郎パート')
  await expect(labelInput).toHaveValue('新郎パート')
  await expect(page.locator(`[data-marker-id="${markerId}"]`)).toHaveAttribute('title', '新郎パート')

  const markerHandle = page.locator(`[data-marker-id="${markerId}"]`)
  await expect(markerHandle).toHaveAttribute('title', '新郎パート')

  const timeInput = page.getByRole('spinbutton', { name: 'マーカー時刻' })
  const initialTime = Number(await timeInput.inputValue())
  const nudgedTime = initialTime + 5
  await timeInput.fill(String(nudgedTime))
  await timeInput.press('Tab')
  await expect(timeInput).toHaveValue(String(nudgedTime))

  await markerHandle.scrollIntoViewIfNeeded()
  const box = await markerHandle.boundingBox()
  expect(box).toBeTruthy()
  const startX = box!.x + box!.width / 2
  const startY = box!.y + box!.height / 2
  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.waitForTimeout(50)
  await page.mouse.move(startX + 160, startY, { steps: 12 })
  await page.mouse.up()

  await expect.poll(async () => Number(await timeInput.inputValue())).toBeGreaterThan(nudgedTime)
})

test('マーカー: ラベル編集を undo で復元できる', async ({ page }) => {
  await loadMarkerEditStress(page)

  const marker = page.locator('[title="新郎プロフィール"]')
  await marker.click()
  const labelInput = page.getByRole('textbox', { name: 'マーカーラベル' })
  await labelInput.fill('新郎パート改')
  await expect(labelInput).toHaveValue('新郎パート改')

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z')
  await expect(labelInput).toHaveValue('新郎プロフィール')
})

test('マーカー: インスペクターから削除できる', async ({ page }) => {
  await loadMarkerEditStress(page)

  const marker = page.locator('[title="エンディング"]')
  await marker.click()
  await expect(page.locator('aside').getByText('章マーカー', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'マーカーを削除' }).click()
  await expect(marker).toHaveCount(0)
  await expect(page.locator('aside').getByText('章マーカー', { exact: true })).toHaveCount(0)
})

test('マーカー: 境界時刻の編集と再生位置へ移動', async ({ page }) => {
  await loadMarkerEditStress(page)

  const marker = page.locator('[title="オープニング"]')
  await marker.click()
  const timeInput = page.getByRole('spinbutton', { name: 'マーカー時刻' })

  await timeInput.fill('0')
  await timeInput.press('Tab')
  await expect(timeInput).toHaveValue('0')

  await page.locator('main input[type="range"]').fill('30')
  await expect.poll(async () => page.evaluate(() => window.__FABLE_E2E__?.getPlaybackTime() ?? -1)).toBeGreaterThan(20)

  await page.getByRole('button', { name: '再生位置へ移動' }).click()
  await expect.poll(async () => page.evaluate(() => window.__FABLE_E2E__?.getPlaybackTime() ?? -1)).toBe(0)
})

test('書き出し: 対応環境ではMP4ダウンロード、非対応環境ではエラー表示(スモーク)', async ({ page }) => {
  test.setTimeout(180_000)

  const hasWebCodecs = await page.evaluate(
    () => typeof VideoEncoder !== 'undefined' && typeof AudioEncoder !== 'undefined',
  )
  test.skip(!hasWebCodecs, 'WebCodecs 自体が存在しない環境のためスキップ')

  // Playwright 同梱 Chromium は H.264/AAC エンコーダを持たないことがある。
  // その場合はエラーハンドリング(分かりやすいメッセージ表示)を検証する。
  const encodersSupported = await page.evaluate(async () => {
    const v = await VideoEncoder.isConfigSupported({ codec: 'avc1.42E01E', width: 1920, height: 1080, bitrate: 8_000_000, framerate: 30 }).catch(() => null)
    const a = await AudioEncoder.isConfigSupported({ codec: 'mp4a.40.2', sampleRate: 48000, numberOfChannels: 2, bitrate: 192_000 }).catch(() => null)
    return Boolean(v?.supported && a?.supported)
  })

  await addOpeningText(page)
  await page.getByRole('button', { name: '書き出し' }).click()

  if (encodersSupported) {
    const downloadPromise = page.waitForEvent('download', { timeout: 150_000 })
    await page.getByRole('button', { name: '1080p で書き出し' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.mp4$/)
    await expect(page.getByText('書き出しが完了しました')).toBeVisible()
  } else {
    await page.getByRole('button', { name: '1080p で書き出し' }).click()
    await expect(page.getByRole('alert', { name: '書き出しエラー' })).toBeVisible()
    await expect(page.getByText(/エンコードがサポートされていません/)).toBeVisible()
    await page.getByRole('button', { name: '設定に戻る' }).click()
    await expect(page.getByRole('button', { name: '1080p で書き出し' })).toBeVisible()
  }
})

test('書き出し: キャンセル後に設定画面へ戻れる', async ({ page }) => {
  test.setTimeout(60_000)

  const encodersSupported = await page.evaluate(async () => {
    if (typeof VideoEncoder === 'undefined' || typeof AudioEncoder === 'undefined') return false
    const v = await VideoEncoder.isConfigSupported({ codec: 'avc1.42E01E', width: 1920, height: 1080, bitrate: 8_000_000, framerate: 30 }).catch(() => null)
    const a = await AudioEncoder.isConfigSupported({ codec: 'mp4a.40.2', sampleRate: 48000, numberOfChannels: 2, bitrate: 192_000 }).catch(() => null)
    return Boolean(v?.supported && a?.supported)
  })
  test.skip(!encodersSupported, 'エンコーダ非対応環境のためスキップ')

  await addOpeningText(page)
  await page.getByRole('button', { name: '書き出し' }).click()
  await page.getByRole('button', { name: '1080p で書き出し' }).click()
  await page.getByRole('button', { name: 'キャンセル' }).click()
  await expect(page.getByRole('status', { name: '書き出し結果' })).toBeVisible()
  await expect(page.getByText('書き出しをキャンセルしました')).toBeVisible()
  await page.getByRole('button', { name: '設定に戻る' }).click()
  await expect(page.getByRole('button', { name: '1080p で書き出し' })).toBeVisible()
})

test('ショートカット: Space で再生・停止、Cmd/Ctrl+Z で取り消し', async ({ page }) => {
  await addOpeningText(page)

  // 選択解除してフォーカスの影響を避ける(トランスポートのスライダーは main 内)
  await page.keyboard.press('Escape')

  const transport = page.locator('main input[type="range"]').first()
  const before = parseFloat(await transport.inputValue())

  // Space で再生開始 → 再生ヘッドが進む(固定 sleep ではなく値の変化を待つ)
  await page.keyboard.press('Space')
  await expect.poll(async () => parseFloat(await transport.inputValue()), { timeout: 5000 }).toBeGreaterThan(before + 0.05)

  // Space で停止 → 進行が止まる
  await page.keyboard.press('Space')
  await expect.poll(async () => {
    const paused = parseFloat(await transport.inputValue())
    await page.waitForTimeout(400)
    return Math.abs(parseFloat(await transport.inputValue()) - paused)
  }, { timeout: 3000 }).toBeLessThan(0.05)

  // Cmd/Ctrl+Z でテキスト追加を取り消し
  await page.keyboard.press('ControlOrMeta+z')
  await expect(page.locator('footer').getByText('Opening')).toBeHidden()
})

test('ショートカット: J/K/L で戻る・停止・再生', async ({ page }) => {
  await addOpeningText(page)
  await page.keyboard.press('Escape')

  const transport = page.locator('main input[type="range"]').first()
  await transport.fill('2')
  await page.locator('header').getByText('FABLE', { exact: true }).click()
  const beforeJ = parseFloat(await transport.inputValue())
  expect(beforeJ).toBeGreaterThan(1)

  await page.keyboard.press('j')
  await expect.poll(async () => parseFloat(await transport.inputValue())).toBeLessThan(beforeJ - 0.5)

  await page.keyboard.press('l')
  const atPlay = parseFloat(await transport.inputValue())
  await expect.poll(async () => parseFloat(await transport.inputValue()), { timeout: 5000 }).toBeGreaterThan(atPlay + 0.05)

  await page.keyboard.press('k')
  const atStop = parseFloat(await transport.inputValue())
  await page.waitForTimeout(400)
  expect(Math.abs(parseFloat(await transport.inputValue()) - atStop)).toBeLessThan(0.05)
})

test('プレビュー: 動画クリップを配置して再生・停止できる', async ({ page }) => {
  const webm = await makeTinyWebmVideo(page)
  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="video"]', { name: 'playback.webm', mimeType: 'video/webm', buffer: webm })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible({ timeout: 15_000 })

  await page.getByTitle('クリックで再生位置に追加').click()
  await expect(page.locator('footer').getByText('playback.webm')).toBeVisible()

  await page.keyboard.press('Escape')
  const transport = page.locator('main input[type="range"]').first()
  const before = parseFloat(await transport.inputValue())

  await page.keyboard.press('Space')
  await expect.poll(async () => parseFloat(await transport.inputValue()), { timeout: 5000 }).toBeGreaterThan(before + 0.05)

  await page.keyboard.press('Space')
  await expect.poll(async () => {
    const paused = parseFloat(await transport.inputValue())
    await page.waitForTimeout(400)
    return Math.abs(parseFloat(await transport.inputValue()) - paused)
  }, { timeout: 3000 }).toBeLessThan(0.05)

  await page.getByRole('button', { name: '再生 (Space)' }).click()
  await expect.poll(async () => parseFloat(await transport.inputValue()), { timeout: 5000 }).toBeGreaterThan(before + 0.05)

  await page.getByRole('button', { name: '再生 (Space)' }).click()
  const atPause = parseFloat(await transport.inputValue())
  await page.waitForTimeout(400)
  expect(Math.abs(parseFloat(await transport.inputValue()) - atPause)).toBeLessThan(0.05)

  await page.keyboard.press('l')
  await expect.poll(async () => parseFloat(await transport.inputValue()), { timeout: 5000 }).toBeGreaterThan(atPause + 0.05)

  await page.keyboard.press('k')
  const atStop = parseFloat(await transport.inputValue())
  await page.waitForTimeout(400)
  expect(Math.abs(parseFloat(await transport.inputValue()) - atStop)).toBeLessThan(0.05)
})

test('婚礼ゴールデンパス: テンプレ→写真→動画→テロップ→ルック→トランジション→章書き出し→再生停止', async ({ page }) => {
  test.setTimeout(180_000)

  const webm = await makeTinyWebmVideo(page)

  // 1. 構造化テンプレート適用
  await applyWeddingFullTemplate(page)
  await expect(page.locator('footer').getByText('写真: 新郎 幼少期')).toBeVisible()

  // 2. 写真複数枚をガイド区間へ配置
  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="image"]', [
    { name: 'golden-a.png', mimeType: 'image/png', buffer: TINY_PNG },
    { name: 'golden-b.png', mimeType: 'image/png', buffer: TINY_PNG },
    { name: 'golden-c.png', mimeType: 'image/png', buffer: TINY_PNG },
  ])
  await expect(page.getByText('3件のメディアを追加しました')).toBeVisible()
  await clickTimelineClip(page, '写真: 新郎 幼少期')
  await page.getByRole('button', { name: 'ガイド区間にスライドショーを配置' }).click()
  await expect(page.getByText('3枚の写真をガイド区間に配置しました')).toBeVisible()
  await expect(page.locator('footer').getByText('golden-a.png')).toBeVisible()

  // 3. 実動画をタイムラインへ配置
  await page.setInputFiles('input[accept*="video"]', { name: 'golden-highlight.webm', mimeType: 'video/webm', buffer: webm })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible({ timeout: 15_000 })
  await page.locator('div.group.relative').filter({ hasText: 'golden-highlight.webm' }).getByTitle('クリックで再生位置に追加').click()
  await expect(page.locator('footer').getByText('golden-highlight.webm')).toBeVisible()

  // 4. テロップ追加（テンプレに無いロワーサード）
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: /乾杯/ }).first().click()
  await expect(page.locator('footer').getByText('乾杯')).toBeVisible()

  // 5. カラールック適用
  await clickTimelineClip(page, 'golden-a.png')
  await page.getByRole('button', { name: 'ウエディング暖色ルック', exact: true }).click()
  await expect(page.getByText('「ウエディング暖色」ルックを適用しました')).toBeVisible()

  // 6. トランジション適用
  await timelineClip(page, 'golden-a.png').click()
  await page.getByTitle('効果').click()
  await page.getByRole('button', { name: 'クロスフェード' }).click()
  await expect(page.getByText('クロスフェードを適用しました')).toBeVisible()

  // 7. 章 In/Out 書き出し設定
  await page.getByRole('button', { name: '書き出し' }).click()
  await page.getByRole('button', { name: '章「新郎プロフィール」を In/Out に設定' }).click()
  await expect(page.getByText('書き出し範囲: 20.0–50.0s')).toBeVisible()
  await expect(page.getByRole('button', { name: '全章を ZIP で書き出し' })).toBeVisible()

  await page.keyboard.press('Escape')

  // 8. 動画クリップの再生・停止
  await clickTimelineClip(page, 'golden-highlight.webm')
  await assertPlaybackStops(page)

  // 9. 対応環境では章 In/Out 範囲の MP4 を検証
  const encodersSupported = await checkEncodersSupported(page)
  if (encodersSupported) {
    await page.getByRole('button', { name: '書き出し' }).click()
    const downloadPromise = page.waitForEvent('download', { timeout: 150_000 })
    await page.getByRole('button', { name: '1080p で書き出し' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.mp4$/)
    const savePath = test.info().outputPath('golden-path-chapter.mp4')
    await download.saveAs(savePath)
    const fs = await import('node:fs')
    expect(fs.statSync(savePath).size).toBeGreaterThan(1000)
    await expect(page.getByText('書き出しが完了しました')).toBeVisible()
  }
})

test('ショートカット: スライド編集で隣接クリップが連動', async ({ page }) => {
  await addOpeningText(page)
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: /Thank you/ }).first().click()
  await page.getByRole('button', { name: /エンディング/ }).first().click()

  await clickTimelineClip(page, 'Thank you')
  const opening = page.locator('footer').getByText('Opening')
  const thankYou = page.locator('footer').getByText('Thank you')
  const openingBefore = (await opening.boundingBox())!
  const thankYouBefore = (await thankYou.boundingBox())!

  await page.keyboard.press('Shift+]')

  const openingAfter = (await opening.boundingBox())!
  const thankYouAfter = (await thankYou.boundingBox())!
  expect(openingAfter.width).toBeGreaterThan(openingBefore.width + 50)
  expect(thankYouAfter.x).toBeGreaterThan(thankYouBefore.x + 50)
})

test('ショートカット: 動画クリップのスリップ編集', async ({ page }) => {
  const webm = await makeTinyWebmVideo(page)
  await page.setInputFiles('input[accept*="video"]', { name: 'slip.webm', mimeType: 'video/webm', buffer: webm })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'slip.webm')

  await page.keyboard.press('Shift+.')
  await expect(page.locator('footer').getByText('slip.webm')).toBeVisible()
})

test('タイムライン: リップルトリムで後続クリップが連動', async ({ page }) => {
  await addOpeningText(page)
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: /Thank you/ }).first().click()
  await expect(page.locator('footer').getByText('Thank you')).toBeVisible()

  const opening = page.locator('footer').getByText('Opening')
  const thankYou = page.locator('footer').getByText('Thank you')
  const thankYouBefore = (await thankYou.boundingBox())!

  const openingBox = (await opening.boundingBox())!
  await page.mouse.move(openingBox.x + openingBox.width - 3, openingBox.y + openingBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(openingBox.x + openingBox.width - 83, openingBox.y + openingBox.height / 2, { steps: 5 })
  await page.mouse.up()

  const thankYouAfter = (await thankYou.boundingBox())!
  expect(thankYouAfter.x).toBeLessThan(thankYouBefore.x)
  expect(thankYouBefore.x - thankYouAfter.x).toBeGreaterThan(60)
})

test('色調補正: ウエディング暖色ルックを適用できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  await page.setInputFiles('input[accept*="image"]', { name: 'photo.png', mimeType: 'image/png', buffer: png })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'photo.png')

  await page.getByRole('button', { name: 'ウエディング暖色ルック', exact: true }).click()
  await expect(page.getByText('「ウエディング暖色」ルックを適用しました')).toBeVisible()
})

test('色調補正: ロマンティック夕暮れルックを適用できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  await page.setInputFiles('input[accept*="image"]', { name: 'sunset.png', mimeType: 'image/png', buffer: png })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'sunset.png')

  await page.getByRole('button', { name: 'ロマンティック夕暮れルック', exact: true }).click()
  await expect(page.getByText('「ロマンティック夕暮れ」ルックを適用しました')).toBeVisible()
  await expect(page.getByRole('button', { name: 'ロマンティック夕暮れルック', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('色調補正: 桜ピンクルックを適用できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  await page.setInputFiles('input[accept*="image"]', { name: 'sakura.png', mimeType: 'image/png', buffer: png })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'sakura.png')

  await page.getByRole('button', { name: '桜ピンクルック', exact: true }).click()
  await expect(page.getByText('「桜ピンク」ルックを適用しました')).toBeVisible()
  await expect(page.getByRole('button', { name: '桜ピンクルック', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('色調補正: ブライダルホワイトルックを適用できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  await page.setInputFiles('input[accept*="image"]', { name: 'bridal.png', mimeType: 'image/png', buffer: png })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'bridal.png')

  await page.getByRole('button', { name: 'ブライダルホワイトルック', exact: true }).click()
  await expect(page.getByText('「ブライダルホワイト」ルックを適用しました')).toBeVisible()
  await expect(page.getByRole('button', { name: 'ブライダルホワイトルック', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('色調補正: ガーデンパーティルックを適用できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  await page.setInputFiles('input[accept*="image"]', { name: 'garden-party.png', mimeType: 'image/png', buffer: png })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'garden-party.png')

  await page.getByRole('button', { name: 'ガーデンパーティルック', exact: true }).click()
  await expect(page.getByText('「ガーデンパーティ」ルックを適用しました')).toBeVisible()
  await expect(page.getByRole('button', { name: 'ガーデンパーティルック', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('トランジション: ディゾルブを画像クリップに適用できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  await page.setInputFiles('input[accept*="image"]', { name: 'photo-a.png', mimeType: 'image/png', buffer: png })
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'photo-a.png' }).click()
  await page.setInputFiles('input[accept*="image"]', { name: 'photo-b.png', mimeType: 'image/png', buffer: png })
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'photo-b.png' }).click()

  await clickTimelineClip(page, 'photo-b.png')
  await page.getByTitle('効果').click()
  await page.getByRole('button', { name: 'ディゾルブ', exact: true }).click()
  await expect(page.getByText('ディゾルブを適用しました')).toBeVisible()
})

test('トランジション: フェード to 暖色を画像クリップに適用できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  await page.setInputFiles('input[accept*="image"]', { name: 'warm-a.png', mimeType: 'image/png', buffer: png })
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'warm-a.png' }).click()
  await page.setInputFiles('input[accept*="image"]', { name: 'warm-b.png', mimeType: 'image/png', buffer: png })
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'warm-b.png' }).click()

  await clickTimelineClip(page, 'warm-b.png')
  await page.getByTitle('効果').click()
  await page.getByRole('button', { name: 'フェード to 暖色', exact: true }).click()
  await expect(page.getByText('フェード to 暖色を適用しました')).toBeVisible()
})

test('トランジション: フィルムバーンを画像クリップに適用できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  await page.setInputFiles('input[accept*="image"]', { name: 'burn-a.png', mimeType: 'image/png', buffer: png })
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'burn-a.png' }).click()
  await page.setInputFiles('input[accept*="image"]', { name: 'burn-b.png', mimeType: 'image/png', buffer: png })
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'burn-b.png' }).click()

  await clickTimelineClip(page, 'burn-b.png')
  await page.getByTitle('効果').click()
  await page.getByRole('button', { name: 'フィルムバーン', exact: true }).click()
  await expect(page.getByText('フィルムバーンを適用しました')).toBeVisible()
})

test('トランジション: 花びら舞を画像クリップに適用できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  await page.setInputFiles('input[accept*="image"]', { name: 'petal-a.png', mimeType: 'image/png', buffer: png })
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'petal-a.png' }).click()
  await page.setInputFiles('input[accept*="image"]', { name: 'petal-b.png', mimeType: 'image/png', buffer: png })
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'petal-b.png' }).click()

  await clickTimelineClip(page, 'petal-b.png')
  await page.getByTitle('効果').click()
  await page.getByRole('button', { name: '花びら舞', exact: true }).click()
  await expect(page.getByText('花びら舞を適用しました')).toBeVisible()
})

test('トランジション: キャンドルグローを画像クリップに適用できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  await page.setInputFiles('input[accept*="image"]', { name: 'candle-a.png', mimeType: 'image/png', buffer: png })
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'candle-a.png' }).click()
  await page.setInputFiles('input[accept*="image"]', { name: 'candle-b.png', mimeType: 'image/png', buffer: png })
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'candle-b.png' }).click()

  await clickTimelineClip(page, 'candle-b.png')
  await page.getByTitle('効果').click()
  await page.getByRole('button', { name: 'キャンドルグロー', exact: true }).click()
  await expect(page.getByText('キャンドルグローを適用しました')).toBeVisible()
})

test('トランジション: シルクフェードを画像クリップに適用できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  await page.setInputFiles('input[accept*="image"]', { name: 'silk-a.png', mimeType: 'image/png', buffer: png })
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'silk-a.png' }).click()
  await page.setInputFiles('input[accept*="image"]', { name: 'silk-b.png', mimeType: 'image/png', buffer: png })
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'silk-b.png' }).click()

  await clickTimelineClip(page, 'silk-b.png')
  await page.getByTitle('効果').click()
  await page.getByRole('button', { name: 'シルクフェード', exact: true }).click()
  await expect(page.getByText('シルクフェードを適用しました')).toBeVisible()
})

test('トランジション: パールシマーを画像クリップに適用できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  await page.setInputFiles('input[accept*="image"]', { name: 'pearl-a.png', mimeType: 'image/png', buffer: png })
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'pearl-a.png' }).click()
  await page.setInputFiles('input[accept*="image"]', { name: 'pearl-b.png', mimeType: 'image/png', buffer: png })
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'pearl-b.png' }).click()

  await clickTimelineClip(page, 'pearl-b.png')
  await page.getByTitle('効果').click()
  await page.getByRole('button', { name: 'パールシマー', exact: true }).click()
  await expect(page.getByText('パールシマーを適用しました')).toBeVisible()
})

test('メディア: ナレーション録音をプレビューしてタイムラインに配置できる', async ({ page }) => {
  await installNarrationRecordingMocks(page)
  await page.goto('./')
  await expect(page.getByText('FABLE', { exact: true })).toBeVisible()

  await page.getByTitle('メディア').click()
  await page.getByRole('button', { name: '録音開始' }).click()
  await expect(page.getByText(/録音中/)).toBeVisible()
  await expect(page.getByText(/録音中 0:0[1-9]/)).toBeVisible({ timeout: 3000 })
  await page.getByRole('button', { name: '停止' }).click()
  await expect(page.getByLabel('録音プレビュー')).toBeVisible()
  await page.getByRole('button', { name: 'タイムラインに配置' }).click()
  await expect(page.getByText('ナレーションをタイムラインに配置しました')).toBeVisible()
  await expect(page.locator('footer').getByText(/^narration-/)).toBeVisible()
})

test('メディア: マイク拒否時に案内と再試行を表示する', async ({ page }) => {
  await installNarrationPermissionDeniedMock(page)
  await page.goto('./')
  await expect(page.getByText('FABLE', { exact: true })).toBeVisible()

  await page.getByTitle('メディア').click()
  await page.getByRole('button', { name: '録音開始' }).click()
  await expect(page.getByRole('alert')).toContainText('マイクの使用が許可されていません')
  await expect(page.getByRole('button', { name: '再試行' })).toBeVisible()
  await page.getByRole('button', { name: '権限の確認方法' }).click()
  await expect(page.getByRole('dialog', { name: 'マイク権限の確認方法' })).toBeVisible()
})

test('メディア: マイク未検出時に案内と再試行を表示する', async ({ page }) => {
  await installNarrationNoDeviceMock(page)
  await page.goto('./')
  await page.getByTitle('メディア').click()

  await page.getByRole('button', { name: '録音開始' }).click()
  await expect(page.getByRole('alert')).toContainText('マイクが見つかりません')
  await expect(page.getByRole('button', { name: '再試行' })).toBeVisible()
  await expect(page.getByRole('button', { name: '権限の確認方法' })).toBeVisible()
})

test('メディア: 空の録音データはエラー表示する', async ({ page }) => {
  await installNarrationEmptyRecordingMock(page)
  await page.goto('./')
  await page.getByTitle('メディア').click()

  await page.getByRole('button', { name: '録音開始' }).click()
  await page.getByRole('button', { name: '停止' }).click()
  await expect(page.getByRole('alert')).toContainText('録音データが空です')
  await expect(page.getByRole('button', { name: '録音開始' })).toBeVisible()
})

test('メディア: ナレーション配置を undo でクリップから除去できる', async ({ page }) => {
  await installNarrationRecordingMocks(page)
  await page.goto('./')
  await page.getByTitle('メディア').click()

  await page.getByRole('button', { name: '録音開始' }).click()
  await expect(page.getByText(/録音中 0:0[1-9]/)).toBeVisible({ timeout: 3000 })
  await page.getByRole('button', { name: '停止' }).click()
  await page.getByRole('button', { name: 'タイムラインに配置' }).click()
  await expect(page.getByText('ナレーションをタイムラインに配置しました')).toBeVisible()
  await expect(page.locator('footer').getByText(/^narration-/)).toBeVisible()

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z')
  await expect(page.locator('footer').getByText(/^narration-/)).toHaveCount(0)
})

test('インスペクター: 画像クリップのメディアを差し替えできる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )

  await page.setInputFiles('input[accept*="image"]', [
    { name: 'photo-a.png', mimeType: 'image/png', buffer: png },
    { name: 'photo-b.png', mimeType: 'image/png', buffer: png },
  ])
  await expect(page.getByText('2件のメディアを追加しました')).toBeVisible()

  await page.getByTitle('クリックで再生位置に追加').first().click()
  await clickTimelineClip(page, 'photo-a.png')

  await page.getByRole('button', { name: 'メディア' }).click()
  await page.getByRole('button', { name: 'photo-b.png に差し替え' }).click()
  await expect(page.getByText('「photo-b.png」に差し替えました')).toBeVisible()
  await expect(page.locator('footer').getByText('photo-b.png')).toBeVisible()
  await expect(page.locator('footer').getByText('photo-a.png')).toBeHidden()
})

test('テキスト: SRT 字幕ファイルをインポートしてクリップを生成できる', async ({ page }) => {
  const srt = `1
00:00:01,000 --> 00:00:03,500
乾杯のご挨拶

2
00:00:05,000 --> 00:00:08,000
ありがとうございました`

  await page.getByTitle('テキスト').click()
  await page.setInputFiles('input[aria-label="SRT 字幕ファイル"]', {
    name: 'subtitles.srt',
    mimeType: 'application/x-subrip',
    buffer: Buffer.from(srt, 'utf-8'),
  })

  await expect(page.getByText('2件の字幕クリップをインポートしました')).toBeVisible()
  await expect(page.locator('footer').getByText('乾杯のご挨拶')).toBeVisible()
  await expect(page.locator('footer').getByText('ありがとうございました')).toBeVisible()
})

test('テキスト: Shift_JIS の SRT をインポートできる', async ({ page }) => {
  const header = Buffer.from('1\r\n00:00:01,000 --> 00:00:03,500\r\n', 'utf-8')
  const body = new Uint8Array([
    0x8a, 0xa3, 0x94, 0x74, 0x82, 0xcc, 0x82, 0xb2, 0x88, 0xa5, 0x8e, 0x41, 0x0d, 0x0a,
  ])
  const buffer = Buffer.concat([header, Buffer.from(body)])

  await page.getByTitle('テキスト').click()
  await page.setInputFiles('input[aria-label="SRT 字幕ファイル"]', {
    name: 'subtitles-sjis.srt',
    mimeType: 'application/x-subrip',
    buffer,
  })
  await expect(page.getByText('1件の字幕クリップをインポートしました（Shift_JIS）')).toBeVisible()
  await expect(page.locator('footer').getByText('乾杯のご挨拶')).toBeVisible()
})

test('テキスト: SRT 字幕をエクスポートできる', async ({ page }) => {
  const srt = `1
00:00:01,000 --> 00:00:03,500
乾杯のご挨拶

2
00:00:05,000 --> 00:00:08,000
ありがとうございました`

  await page.getByTitle('テキスト').click()
  await page.setInputFiles('input[aria-label="SRT 字幕ファイル"]', {
    name: 'subtitles.srt',
    mimeType: 'application/x-subrip',
    buffer: Buffer.from(srt, 'utf-8'),
  })
  await expect(page.getByText('2件の字幕クリップをインポートしました')).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'SRT を保存' }).click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toMatch(/\.srt$/)
  const path = await download.path()
  expect(path).toBeTruthy()
  const exported = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of exported!) {
    chunks.push(Buffer.from(chunk))
  }
  const content = Buffer.concat(chunks).toString('utf-8')
  expect(content).toContain('乾杯のご挨拶')
  expect(content).toContain('00:00:01,000 --> 00:00:03,500')
  await expect(page.getByText('2件の字幕をSRTでエクスポートしました')).toBeVisible()
})

test('テキスト: 長文 SRT をインポートして再エクスポートできる', async ({ page }) => {
  const longText =
    '本日はお越しいただき、誠にありがとうございます。新郎新婦一同、心より感謝申し上げます。'
  const srt = `1
00:00:01,000 --> 00:00:06,500
${longText}`

  await page.getByTitle('テキスト').click()
  await page.setInputFiles('input[aria-label="SRT 字幕ファイル"]', {
    name: 'long-subtitles.srt',
    mimeType: 'application/x-subrip',
    buffer: Buffer.from(srt, 'utf-8'),
  })
  await expect(page.getByText('1件の字幕クリップをインポートしました')).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'SRT を保存' }).click()
  const download = await downloadPromise
  const path = await download.path()
  expect(path).toBeTruthy()
  const exported = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of exported!) {
    chunks.push(Buffer.from(chunk))
  }
  const content = Buffer.concat(chunks).toString('utf-8')
  expect(content).toContain('00:00:01,000 --> 00:00:06,500')
  expect(content).toContain('本日はお越しいただき')
})

test('テキスト: VTT 字幕をエクスポートできる', async ({ page }) => {
  const srt = `1
00:00:01,000 --> 00:00:03,500
VTT エクスポート確認`

  await page.getByTitle('テキスト').click()
  await page.setInputFiles('input[aria-label="SRT 字幕ファイル"]', {
    name: 'vtt-source.srt',
    mimeType: 'application/x-subrip',
    buffer: Buffer.from(srt, 'utf-8'),
  })
  await expect(page.getByText('1件の字幕クリップをインポートしました')).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'VTT を保存' }).click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toMatch(/\.vtt$/)
  const path = await download.path()
  expect(path).toBeTruthy()
  const exported = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of exported!) {
    chunks.push(Buffer.from(chunk))
  }
  const content = Buffer.concat(chunks).toString('utf-8')
  expect(content).toContain('WEBVTT')
  expect(content).toContain('00:00:01.000 --> 00:00:03.500')
  expect(content).toContain('VTT エクスポート確認')
  await expect(page.getByText('1件の字幕をVTTでエクスポートしました')).toBeVisible()
})

test('メディア: 動画をインポートして UI が応答し続ける', async ({ page }) => {
  const webm = await makeTinyWebmVideo(page)

  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="video"]', {
    name: 'sample-clip.webm',
    mimeType: 'video/webm',
    buffer: webm,
  })

  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('sample-clip.webm')).toBeVisible()

  // 取り込み直後も UI がブロックされないこと（ヘルプモーダルが開ける）
  await page.keyboard.press('?')
  await expect(page.getByRole('dialog', { name: 'キーボードショートカット' })).toBeVisible()
  await page.keyboard.press('Escape')

  // 動画としてリスト登録されていること
  await expect(page.getByText(/video ·/)).toBeVisible()
})

test('メディア: 複数ファイル取り込みで進捗表示が使われる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )

  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="video"]', [
    { name: 'import-a.png', mimeType: 'image/png', buffer: png },
    { name: 'import-b.png', mimeType: 'image/png', buffer: png },
    { name: 'import-c.png', mimeType: 'image/png', buffer: png },
  ])

  await expect(page.getByText('3件のメディアを追加しました')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('import-a.png')).toBeVisible()
  await expect(page.getByText('import-b.png')).toBeVisible()
  await expect(page.getByText('import-c.png')).toBeVisible()
})

test('自動保存: 編集後にインジケータが表示される', async ({ page }) => {
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: /Opening/ }).first().click()
  await expect(page.locator('footer').getByText('Opening')).toBeVisible()

  await expect(page.getByLabel(/自動保存:/)).toBeVisible({ timeout: 8_000 })
})

test('インスペクター: 画像クリップを動画メディアへ差し替えできる', async ({ page }) => {
  const webm = await makeTinyWebmVideo(page)
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )

  await page.setInputFiles('input[accept*="video"]', [
    { name: 'photo.png', mimeType: 'image/png', buffer: png },
    { name: 'clip.webm', mimeType: 'video/webm', buffer: webm },
  ])
  await expect(page.getByText('2件のメディアを追加しました')).toBeVisible({ timeout: 15_000 })

  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'photo.png' }).click()
  await clickTimelineClip(page, 'photo.png')

  await page.getByRole('button', { name: 'メディア' }).click()
  await page.getByRole('button', { name: 'clip.webm に差し替え' }).click()
  await expect(page.getByText('「clip.webm」に差し替えました')).toBeVisible()
  await expect(page.locator('footer').getByText('clip.webm')).toBeVisible()
  await expect(page.locator('footer').getByText('photo.png')).toBeHidden()
})

test('インスペクター: 動画クリップを画像メディアへ差し替えできる', async ({ page }) => {
  const webm = await makeTinyWebmVideo(page)
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )

  await page.setInputFiles('input[accept*="video"]', [
    { name: 'clip.webm', mimeType: 'video/webm', buffer: webm },
    { name: 'still.png', mimeType: 'image/png', buffer: png },
  ])
  await expect(page.getByText('2件のメディアを追加しました')).toBeVisible({ timeout: 15_000 })

  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'clip.webm' }).click()
  await clickTimelineClip(page, 'clip.webm')

  await page.getByRole('button', { name: 'メディア' }).click()
  await page.getByRole('button', { name: 'still.png に差し替え' }).click()
  await expect(page.getByText('「still.png」に差し替えました')).toBeVisible()
  await expect(page.locator('footer').getByText('still.png')).toBeVisible()
  await expect(page.locator('footer').getByText('clip.webm')).toBeHidden()
})

test('インスペクター: 画像クリップのメディア差し替えを undo できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )

  await page.setInputFiles('input[accept*="image"]', [
    { name: 'undo-a.png', mimeType: 'image/png', buffer: png },
    { name: 'undo-b.png', mimeType: 'image/png', buffer: png },
  ])
  await expect(page.getByText('2件のメディアを追加しました')).toBeVisible()

  await page.getByTitle('クリックで再生位置に追加').first().click()
  await clickTimelineClip(page, 'undo-a.png')

  await page.getByRole('button', { name: 'メディア' }).click()
  await page.getByRole('button', { name: 'undo-b.png に差し替え' }).click()
  await expect(page.getByText('「undo-b.png」に差し替えました')).toBeVisible()
  await expect(page.locator('footer').getByText('undo-b.png')).toBeVisible()

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z')
  await expect(page.locator('footer').getByText('undo-a.png')).toBeVisible()
  await expect(page.locator('footer').getByText('undo-b.png')).toBeHidden()
})

test('インスペクター: 動画差し替え後も音量設定を維持する', async ({ page }) => {
  const stats = await loadMediaReplaceStress(page)
  await selectClipById(page, stats.videoClipId)

  expect(await getClipAudioVolume(page, stats.videoClipId)).toBeCloseTo(0.42, 2)

  const replaceName = await getMediaAssetName(page, stats.videoReplaceTargetId)
  await page.getByRole('button', { name: 'メディア', exact: true }).click()
  await page.getByRole('button', { name: `${replaceName} に差し替え` }).click()
  await expect(page.getByText(`「${replaceName}」に差し替えました`)).toBeVisible()

  expect(await getClipMediaId(page, stats.videoClipId)).toBe(stats.videoReplaceTargetId)
  expect(await getClipAudioVolume(page, stats.videoClipId)).toBeCloseTo(0.42, 2)
})

test('メディア差し替えストレス: 候補件数と Ken Burns 引き継ぎ', async ({ page }) => {
  const stats = await loadMediaReplaceStress(page)

  expect(await getMediaReplaceCandidateCount(page, stats.imageClipId)).toBe(10)

  await selectClipById(page, stats.imageClipId)
  expect(await getClipKenBurnsEnabled(page, stats.imageClipId)).toBe(true)

  const replaceName = await getMediaAssetName(page, stats.imageReplaceTargetId)
  await page.getByRole('button', { name: 'メディア', exact: true }).click()
  await page.getByRole('button', { name: `${replaceName} に差し替え` }).click()
  await expect(page.getByText(`「${replaceName}」に差し替えました`)).toBeVisible()

  expect(await getClipKenBurnsEnabled(page, stats.imageClipId)).toBe(true)
  expect(await getClipMediaId(page, stats.imageClipId)).toBe(stats.imageReplaceTargetId)
})

test('ユーザーテンプレート: 保存・適用・新規作成', async ({ page }) => {
  await page.getByTitle('テンプレ').click()
  await page.getByRole('button', { name: /結婚式フル構成/ }).click()
  await expect(page.getByText('結婚式フル構成テンプレートを適用しました')).toBeVisible()

  await page.getByLabel('テンプレート名').fill('E2E保存テンプレ')
  await page.getByRole('button', { name: '現在の構成をテンプレート保存' }).click()
  await expect(page.getByText('「E2E保存テンプレ」テンプレートを保存しました')).toBeVisible()

  await page.getByTitle('プロジェクト一覧').click()
  await page.getByRole('button', { name: '+ 新規プロジェクト' }).click()
  await expect(page.getByText('新規プロジェクトを作成しました')).toBeVisible()
  await expect(page.locator('footer').getByText('Opening')).toBeHidden()

  await page.getByTitle('プロジェクト一覧').click()
  await page.getByRole('button', { name: 'E2E保存テンプレで新規作成' }).click()
  await expect(page.getByText('「E2E保存テンプレ」で新規プロジェクトを作成しました')).toBeVisible()
  await expect(page.locator('footer').getByText('Opening')).toBeVisible()
  await expect(page.locator('[title="オープニング"]')).toBeVisible()

  await page.getByTitle('テンプレ').click()
  await page.getByRole('button', { name: 'E2E保存テンプレを適用' }).click()
  await expect(page.getByText('「E2E保存テンプレ」テンプレートを適用しました')).toBeVisible()
  await expect(page.locator('footer').getByText('Opening')).toBeVisible()
})

test('ユーザーテンプレート: 適用を undo で復元できる', async ({ page }) => {
  const stats = await loadUserProjectTemplateStress(page)
  expect(stats.clipCount).toBeGreaterThan(0)

  await page.getByTitle('プロジェクト一覧').click()
  await page.getByRole('button', { name: '+ 新規プロジェクト' }).click()
  await expect(page.getByText('新規プロジェクトを作成しました')).toBeVisible()
  await expect.poll(() => getProjectClipCount(page)).toBe(0)

  await page.getByTitle('テンプレ').click()
  await page.getByRole('button', { name: `${stats.templateLabel}を適用` }).click()
  await expect(page.getByText(`「${stats.templateLabel}」テンプレートを適用しました`)).toBeVisible()
  await expect.poll(() => getProjectClipCount(page)).toBe(stats.clipCount)

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z')
  await expect.poll(() => getProjectClipCount(page)).toBe(0)
})

test('ユーザーテンプレート: 保存済みテンプレートを削除できる', async ({ page }) => {
  const stats = await loadUserProjectTemplateStress(page)
  expect(await getUserProjectTemplateCount(page)).toBe(1)

  await page.getByTitle('テンプレ').click()
  await page.getByRole('button', { name: `${stats.templateLabel}を削除` }).click()
  await expect(page.getByText(`「${stats.templateLabel}」テンプレートを削除しました`)).toBeVisible()
  await expect(page.getByText('保存済みテンプレートはありません')).toBeVisible()
  expect(await getUserProjectTemplateCount(page)).toBe(0)
})

test('ユーザーテンプレート: ストレス投入から新規作成できる', async ({ page }) => {
  const stats = await loadUserProjectTemplateStress(page)

  await page.getByTitle('プロジェクト一覧').click()
  await page.getByRole('button', { name: `${stats.templateLabel}で新規作成` }).click()
  await expect(page.getByText(`「${stats.templateLabel}」で新規プロジェクトを作成しました`)).toBeVisible()
  await expect.poll(() => getProjectClipCount(page)).toBe(stats.clipCount)
  await expect(page.locator('footer').getByText('Opening')).toBeVisible()
})

test('ユーザーテンプレート: エクスポートとインポート', async ({ page }) => {
  await page.getByTitle('テンプレ').click()
  await page.getByRole('button', { name: /結婚式フル構成/ }).click()
  await expect(page.getByText('結婚式フル構成テンプレートを適用しました')).toBeVisible()

  await page.getByLabel('テンプレート名').fill('E2EExportテンプレ')
  await page.getByRole('button', { name: '現在の構成をテンプレート保存' }).click()
  await expect(page.getByText('「E2EExportテンプレ」テンプレートを保存しました')).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'E2EExportテンプレをエクスポート' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toContain('.fable-template.json')

  const exportPath = path.join(test.info().outputDir, 'e2e-export-template.json')
  await download.saveAs(exportPath)

  await page.evaluate(() => localStorage.removeItem('fable-user-project-templates'))
  await page.reload()
  await expect(page.getByText('FABLE', { exact: true })).toBeVisible()

  await page.getByTitle('テンプレ').click()
  await expect(page.getByText('保存済みテンプレートはありません')).toBeVisible()

  await page.getByLabel('テンプレートファイルをインポート').setInputFiles(exportPath)
  await expect(page.getByText('「E2EExportテンプレ」テンプレートをインポートしました')).toBeVisible()

  await page.getByTitle('プロジェクト一覧').click()
  await page.getByRole('button', { name: 'E2EExportテンプレで新規作成' }).click()
  await expect(page.getByText('「E2EExportテンプレ」で新規プロジェクトを作成しました')).toBeVisible()
  await expect(page.locator('footer').getByText('Opening')).toBeVisible()
  await expect(page.locator('[title="オープニング"]')).toBeVisible()
})

test('ユーザーテンプレート: 破損 JSON のインポートはエラー表示する', async ({ page }) => {
  await page.getByTitle('テンプレ').click()
  await page.getByLabel('テンプレートファイルをインポート').setInputFiles({
    name: 'broken.fable-template.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{not-valid-json', 'utf-8'),
  })
  await expect(page.getByText('テンプレートファイルの JSON が読み取れません')).toBeVisible()
})

test('ユーザーテンプレート: 同名テンプレートの再インポートでラベルが重複回避される', async ({ page }) => {
  const stats = await loadUserProjectTemplateExportStress(page)

  const exportPath = path.join(test.info().outputDir, 'duplicate-import-template.json')
  const fs = await import('node:fs')
  fs.mkdirSync(test.info().outputDir, { recursive: true })
  fs.writeFileSync(exportPath, stats.exportJson, 'utf-8')

  await page.getByTitle('テンプレ').click()
  await page.getByLabel('テンプレートファイルをインポート').setInputFiles(exportPath)
  await expect(page.getByText(`「${stats.templateLabel} (インポート)」テンプレートをインポートしました`)).toBeVisible()

  await page.getByLabel('テンプレートファイルをインポート').setInputFiles(exportPath)
  await expect(page.getByText(`「${stats.templateLabel} (インポート 2)」テンプレートをインポートしました`)).toBeVisible()
  expect(await getUserProjectTemplateCount(page)).toBe(3)
})

test('ユーザーテンプレート: ストレス JSON のエクスポート往復で新規作成できる', async ({ page }) => {
  const stats = await loadUserProjectTemplateExportStress(page)
  await clearUserProjectTemplates(page)
  expect(await getUserProjectTemplateCount(page)).toBe(0)

  const label = await importUserProjectTemplateJson(page, stats.exportJson)
  expect(label).toBe(stats.templateLabel)
  expect(await getUserProjectTemplateCount(page)).toBe(1)

  await page.getByTitle('プロジェクト一覧').click()
  await page.getByRole('button', { name: `${stats.templateLabel}で新規作成` }).click()
  await expect(page.getByText(`「${stats.templateLabel}」で新規プロジェクトを作成しました`)).toBeVisible()
  await expect.poll(() => getProjectClipCount(page)).toBe(stats.clipCount)
  await expect(page.locator('footer').getByText('Opening')).toBeVisible()
})

test('タイムラインズーム: 選択クリップへズームとフィット', async ({ page }) => {
  await page.getByTitle('テンプレ').click()
  await page.getByRole('button', { name: /結婚式フル構成/ }).click()
  await expect(page.getByText('結婚式フル構成テンプレートを適用しました')).toBeVisible()

  await clickTimelineClip(page, 'Opening')

  const zoomLabel = page.getByTestId('timeline-zoom-label')
  const before = Number((await zoomLabel.textContent())?.replace('px/s', '') ?? '0')

  await page.getByTitle('選択クリップへズーム (Z)').click()
  const afterZoom = Number((await zoomLabel.textContent())?.replace('px/s', '') ?? '0')
  expect(afterZoom).toBeGreaterThan(before)

  await page.getByTitle('フィット').click()
  const afterFit = Number((await zoomLabel.textContent())?.replace('px/s', '') ?? '0')
  expect(afterFit).toBeLessThan(afterZoom)
})

test('プロジェクト設定: プリセットを保存して適用できる', async ({ page }) => {
  await addOpeningText(page)

  await page.getByTitle('プロジェクト設定').click()
  await page.getByRole('button', { name: /縦型 9:16/ }).click()
  await page.getByLabel('設定プリセット名').fill('縦型婚礼')
  await page.getByRole('button', { name: '設定プリセット保存' }).click()
  await expect(page.getByText('「縦型婚礼」設定を保存しました')).toBeVisible()

  await page.getByRole('button', { name: /正方形/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: '適用', exact: true }).click()

  await page.getByTitle('プロジェクト設定').click()
  await page.getByRole('button', { name: '縦型婚礼を適用' }).click()
  await expect(page.getByText('「縦型婚礼」設定を適用しました')).toBeVisible()
  await expect(page.getByRole('button', { name: /縦型 9:16/ })).toHaveClass(/accent/)

  await page.getByRole('dialog').getByRole('button', { name: '適用', exact: true }).click()
  await page.getByRole('button', { name: '書き出し' }).click()
  await expect(page.getByText('プロジェクト解像度: 1080×1920')).toBeVisible()
})

test('プロジェクト設定: プリセットを JSON エクスポート/インポートできる', async ({ page }) => {
  await addOpeningText(page)

  await page.getByTitle('プロジェクト設定').click()
  await page.getByRole('button', { name: /縦型 9:16/ }).click()
  await page.getByLabel('設定プリセット名').fill('E2EProjectPreset')
  await page.getByRole('button', { name: '設定プリセット保存' }).click()
  await expect(page.getByText('「E2EProjectPreset」設定を保存しました')).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'E2EProjectPresetをエクスポート' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toContain('.fable-project-preset.json')

  const exportPath = path.join(test.info().outputDir, 'e2e-project-preset.json')
  await download.saveAs(exportPath)

  await page.getByRole('button', { name: 'E2EProjectPresetを削除' }).click()
  await expect(page.getByRole('button', { name: 'E2EProjectPresetを適用' })).toBeHidden()

  await page.getByLabel('プロジェクト設定プリセットファイルをインポート').setInputFiles(exportPath)
  await expect(page.getByText('「E2EProjectPreset」設定プリセットをインポートしました')).toBeVisible()

  await page.getByRole('button', { name: 'E2EProjectPresetを適用' }).click()
  await expect(page.getByText('「E2EProjectPreset」設定を適用しました')).toBeVisible()
  await expect(page.getByRole('button', { name: /縦型 9:16/ })).toHaveClass(/accent/)
})

test('プロジェクト設定: 破損 JSON のインポートはエラー表示する', async ({ page }) => {
  await page.getByTitle('プロジェクト設定').click()
  await page.getByLabel('プロジェクト設定プリセットファイルをインポート').setInputFiles({
    name: 'broken.fable-project-preset.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{not-valid-json', 'utf-8'),
  })
  await expect(page.getByText('JSON の読み込みに失敗しました')).toBeVisible()
})

test('プロジェクト設定: 同名プリセットの再インポートで名前が重複回避される', async ({ page }) => {
  const stats = await loadProjectSettingsPresetExportStress(page)

  const singlePresetJson = JSON.stringify({
    schemaVersion: 1,
    presets: [{
      name: stats.verticalPresetName,
      width: stats.verticalWidth,
      height: stats.verticalHeight,
      fps: stats.verticalFps,
      rippleDelete: true,
      loopPlayback: true,
    }],
  })
  const exportPath = path.join(test.info().outputDir, 'duplicate-import-project-preset.json')
  const fs = await import('node:fs')
  fs.mkdirSync(test.info().outputDir, { recursive: true })
  fs.writeFileSync(exportPath, singlePresetJson, 'utf-8')

  await page.getByTitle('プロジェクト設定').click()
  await page.getByLabel('プロジェクト設定プリセットファイルをインポート').setInputFiles(exportPath)
  await expect(page.getByText(`「${stats.verticalPresetName}」設定プリセットをインポートしました`)).toBeVisible()
  await expect(page.getByRole('button', { name: `${stats.verticalPresetName} (インポート)を適用` })).toBeVisible()

  await page.getByLabel('プロジェクト設定プリセットファイルをインポート').setInputFiles(exportPath)
  await expect(page.getByRole('button', { name: `${stats.verticalPresetName} (インポート 2)を適用` })).toBeVisible()
  expect(await getProjectSettingsPresetCount(page)).toBe(stats.presetCount + 2)
})

test('プロジェクト設定: ストレス JSON 往復で縦型婚礼を適用できる', async ({ page }) => {
  const stats = await loadProjectSettingsPresetExportStress(page)
  await clearProjectSettingsPresets(page)
  expect(await getProjectSettingsPresetCount(page)).toBe(0)

  const names = await importProjectSettingsPresetJson(page, stats.exportJson)
  expect(names).toHaveLength(stats.presetCount)
  expect(await getProjectSettingsPresetCount(page)).toBe(stats.presetCount)

  await page.getByTitle('プロジェクト設定').click()
  await page.getByRole('button', { name: `${stats.verticalPresetName}を適用` }).click()
  await expect(page.getByText(`「${stats.verticalPresetName}」設定を適用しました`)).toBeVisible()
  await expect(page.getByRole('button', { name: /縦型 9:16/ })).toHaveClass(/accent/)

  expect(await getProjectWidth(page)).toBe(stats.verticalWidth)
  expect(await getProjectHeight(page)).toBe(stats.verticalHeight)
  expect(await getProjectFps(page)).toBe(stats.verticalFps)
  expect(await getRippleDelete(page)).toBe(true)
  expect(await getLoopPlayback(page)).toBe(true)
})

test('テキスト: カテゴリ絞り込みでロワーサードのみ表示する', async ({ page }) => {
  await page.getByTitle('テキスト').click()
  await page.getByRole('group', { name: 'テキストプリセット絞り込み' }).getByRole('button', { name: 'ロワーサード' }).click()
  await expect(page.getByRole('button', { name: 'Taro & Hanako ロワーサード（名前）' })).toBeVisible()
  await page.getByRole('button', { name: 'Taro & Hanako ロワーサード（名前）' }).click()
  await expect(page.locator('footer').getByText('Taro & Hanako')).toBeVisible()
})

test('テキスト: よく使うに登録して絞り込める', async ({ page }) => {
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: 'Openingをよく使うに追加' }).click()
  await page.getByRole('group', { name: 'テキストプリセット絞り込み' }).getByRole('button', { name: 'よく使う' }).click()
  await expect(page.getByRole('button', { name: 'Opening Opening' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Taro & Hanako ロワーサード（名前）' })).toBeHidden()

  await page.reload()
  await page.getByTitle('テキスト').click()
  await page.getByRole('group', { name: 'テキストプリセット絞り込み' }).getByRole('button', { name: 'よく使う' }).click()
  await expect(page.getByRole('button', { name: 'Opening Opening' })).toBeVisible()
})

test('テキスト: ロワーサードプリセットを追加できる', async ({ page }) => {
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: 'ロワーサード（名前）' }).click()
  await expect(page.locator('footer').getByText('Taro & Hanako')).toBeVisible()
})

test('テキスト: 新規ロワーサード（スピーチ）を追加できる', async ({ page }) => {
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: 'ロワーサード（スピーチ）' }).click()
  await expect(page.locator('footer').getByText('Speech by')).toBeVisible()
})

test('テキスト: 新規テロップ（入場）を追加できる', async ({ page }) => {
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: 'テロップ（入場）' }).click()
  await expect(page.locator('footer').getByText('入場')).toBeVisible()
})

test('テキスト: ロワーサード（司会）プリセットを追加できる', async ({ page }) => {
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: 'ロワーサード（司会）' }).click()
  await expect(page.locator('footer').getByText('司会  山田 太郎')).toBeVisible()
})

test('テキスト: テロップ（指輪交換）プリセットを追加できる', async ({ page }) => {
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: 'テロップ（指輪交換）' }).click()
  await expect(page.locator('footer').getByText('Ring Exchange')).toBeVisible()
})

test('テキスト: MG タイトルリビールプリセットを追加できる', async ({ page }) => {
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: 'MG: タイトルリビール' }).click()
  await expect(page.locator('footer').getByText('Our Wedding Story')).toBeVisible()
})

test('テキスト: MG エレガントネームプリセットを追加できる', async ({ page }) => {
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: 'MG: エレガントネーム' }).click()
  await expect(page.locator('footer').getByText('Taro & Hanako')).toBeVisible()
})

test('テキスト: MG スパークル誓いプリセットを追加できる', async ({ page }) => {
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: 'MG: スパークル誓い' }).click()
  await expect(page.locator('footer').getByText('I Do')).toBeVisible()
})

test('テキスト: MG プリセットをカスタムキーフレームに変換できる', async ({ page }) => {
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: 'MG: タイトルリビール' }).click()
  await clickTimelineClip(page, 'Our Wedding Story')

  await page.getByRole('button', { name: 'カスタムキーフレームに変換' }).click()
  await expect(page.getByText('MG アニメをカスタムキーフレームに変換しました')).toBeVisible()

  await page.getByRole('button', { name: 'トランスフォームキーフレーム', exact: true }).click()
  await expect(page.getByText('キーフレーム 1')).toBeVisible()
  await expect(page.getByText('キーフレーム 2')).toBeVisible()
  await expect(page.locator('select').filter({ hasText: 'カスタム（キーフレーム）' })).toBeVisible()
})

test('テキスト: MG カスタムキーフレームのスケールをタイムラインで編集できる', async ({ page }) => {
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: 'MG: タイトルリビール' }).click()
  await clickTimelineClip(page, 'Our Wedding Story')

  await page.getByRole('button', { name: 'カスタムキーフレームに変換' }).click()
  await expect(page.getByText('MG アニメをカスタムキーフレームに変換しました')).toBeVisible()

  await page.getByTestId('transform-kf-property-scale').click()
  await expect(page.getByTestId('transform-kf-property-scale')).toHaveAttribute('aria-pressed', 'true')

  const handle = page.getByRole('button', { name: 'トランスフォームキーフレーム 2' })
  const beforeTitle = await handle.getAttribute('title')
  expect(beforeTitle).toMatch(/スケール/)

  const box = (await handle.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2, box.y - 20, { steps: 10 })
  await page.mouse.up()

  await expect(handle).not.toHaveAttribute('title', beforeTitle!)
})

test('BGM: ビートマーカーを配置しスナップに使える', async ({ page }) => {
  const wav = makeWavWithPeak(0.2, 4)
  await page.setInputFiles('input[accept*="audio"]', { name: 'beat-bgm.wav', mimeType: 'audio/wav', buffer: wav })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'beat-bgm.wav')

  await page.getByRole('button', { name: 'ビートマーカー' }).click()
  await page.getByRole('button', { name: 'クリップ内に等間隔配置' }).click()
  await expect(page.getByText(/件のビートマーカーを配置しました/)).toBeVisible()
  await expect(page.locator('[data-marker-type="beat"]')).toHaveCount(8)

  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: /Opening/ }).first().click()
  const clip = page.locator('footer').getByText('Opening')
  const before = (await clip.boundingBox())!

  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2)
  await page.mouse.down()
  await page.mouse.move(before.x + before.width / 2 + 70, before.y + before.height / 2, { steps: 6 })
  await page.mouse.up()

  const after = (await clip.boundingBox())!
  expect(after.x - before.x).toBeGreaterThan(55)
  expect(after.x - before.x).toBeLessThan(95)
})

test('調整レイヤー: 追加して色調プリセットを適用できる', async ({ page }) => {
  await page.getByRole('button', { name: '調整レイヤーを追加 章全体へ色調を一括適用' }).click()
  await expect(page.getByText('調整レイヤーを追加しました')).toBeVisible()
  await expect(page.locator('footer').getByText('調整レイヤー')).toBeVisible()

  await clickTimelineClip(page, '調整レイヤー')
  await expect(page.getByText('調整レイヤー', { exact: true }).first()).toBeVisible()

  await page.getByRole('button', { name: 'ウエディング暖色ルック', exact: true }).click()
  await expect(page.getByText('「ウエディング暖色」ルックを適用しました')).toBeVisible()
})

test('効果タブ: 調整レイヤーを追加できる', async ({ page }) => {
  await page.getByTitle('効果').click()
  await page.getByRole('button', { name: '調整レイヤーを追加', exact: true }).click()
  await expect(page.getByText('調整レイヤーを追加しました')).toBeVisible()
  await expect(page.locator('footer').getByText('調整レイヤー')).toBeVisible()
})

test('インスペクター: BGM ダッキングを設定できる', async ({ page }) => {
  const wav = makeWavWithPeak(0.8, 2)
  await page.setInputFiles('input[accept*="audio"]', { name: 'duck-bgm.wav', mimeType: 'audio/wav', buffer: wav })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()

  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'duck-bgm.wav')

  await page.getByRole('button', { name: 'ダッキング' }).click()
  await page.getByText('動画音声がある区間でBGMを下げる').click()
  await expect(page.getByRole('slider', { name: 'ダッキング音量' })).toBeVisible()

  const duckAmount = page.getByRole('slider', { name: 'ダッキング音量' })
  await duckAmount.fill('0.25')
  await expect(duckAmount).toHaveValue('0.25')
})

test('インスペクター: オーディオ EQ を設定できる', async ({ page }) => {
  const wav = makeSilentWav(1)
  await page.setInputFiles('input[accept*="audio"]', { name: 'eq-bgm.wav', mimeType: 'audio/wav', buffer: wav })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()

  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'eq-bgm.wav')

  await page.getByRole('button', { name: 'イコライザー' }).click()
  await page.getByLabel('イコライザーを有効化').check()
  await page.getByRole('slider', { name: '低域' }).fill('3')

  await expect(page.getByRole('slider', { name: '低域' })).toHaveValue('3')
  await expect(page.getByLabel('イコライザーを有効化')).toBeChecked()
})

test('インスペクター: オーディオノイズ除去を設定できる', async ({ page }) => {
  const wav = makeSilentWav(1)
  await page.setInputFiles('input[accept*="audio"]', { name: 'nr-narration.wav', mimeType: 'audio/wav', buffer: wav })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()

  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'nr-narration.wav')

  await page.getByRole('button', { name: 'ノイズ除去' }).click()
  await page.getByLabel('ノイズ除去を有効化').check()
  await page.getByRole('slider', { name: 'ハイパス' }).fill('120')
  await page.getByLabel('高周波ヒス除去（ローパス）').check()

  await expect(page.getByLabel('ノイズ除去を有効化')).toBeChecked()
  await expect(page.getByRole('slider', { name: 'ハイパス' })).toHaveValue('120')
  await expect(page.getByLabel('高周波ヒス除去（ローパス）')).toBeChecked()
  await expect(page.getByRole('slider', { name: 'ローパス' })).toBeVisible()
})

test('テキスト: MG 花びら舞プリセットを追加できる', async ({ page }) => {
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: 'MG: 花びら舞' }).click()
  await expect(page.locator('footer').getByText('Petals of Love')).toBeVisible()
})

test('テキスト: テロップ（ケーキカット）プリセットを追加できる', async ({ page }) => {
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: 'テロップ（ケーキカット）' }).click()
  await expect(page.locator('footer').getByText('Cake Cutting')).toBeVisible()
})

test('テキスト: MG ベルの祝福プリセットを追加できる', async ({ page }) => {
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: 'MG: ベルの祝福' }).click()
  await expect(page.locator('footer').getByText('Wedding Bells')).toBeVisible()
})

test('テキスト: テロップ（余興）プリセットを追加できる', async ({ page }) => {
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: 'テロップ（余興）' }).click()
  await expect(page.locator('footer').getByText('余興')).toBeVisible()
})

test('色調スタック: 調整レイヤー + ルック + LUT を複合適用できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  const cube = Buffer.from(`LUT_3D_SIZE 2
0 0 0
1 0.1 0
0 1 0
1 0.2 0
0 0 1
1 0.1 1
0 1 1
1 0.2 1
`)

  await page.setInputFiles('input[accept*="image"]', { name: 'stack-photo.png', mimeType: 'image/png', buffer: png })
  await page.getByTitle('クリックで再生位置に追加').click()
  await expect(page.locator('footer').getByText('stack-photo.png')).toBeVisible()

  await page.getByTitle('効果').click()
  await page.getByRole('button', { name: '調整レイヤーを追加', exact: true }).click()
  await expect(page.getByText('調整レイヤーを追加しました')).toBeVisible()
  await clickTimelineClip(page, '調整レイヤー')
  await page.getByRole('button', { name: 'ロマンティック夕暮れルック', exact: true }).click()
  await expect(page.getByText('「ロマンティック夕暮れ」ルックを適用しました')).toBeVisible()

  await clickTimelineClip(page, 'stack-photo.png')
  await page.getByRole('button', { name: 'ウエディング暖色ルック', exact: true }).click()
  await expect(page.getByText('「ウエディング暖色」ルックを適用しました')).toBeVisible()

  await page.setInputFiles('input[accept*=".cube"]', { name: 'stack-warm.cube', mimeType: 'text/plain', buffer: cube })
  await expect(page.getByText('「stack-warm」をインポートしました')).toBeVisible()
  await page.getByLabel('LUT', { exact: true }).selectOption({ label: 'stack-warm (2³)' })
  await expect(page.getByText('「stack-warm」LUT を適用しました')).toBeVisible()

  const midtone = page.getByRole('slider', { name: 'ミッドトーン' })
  await midtone.fill('0.15')
  await expect(midtone).toHaveValue('0.15')
  await expect(page.getByRole('slider', { name: 'LUT 強度' })).toBeVisible()
})

test('色調補正: LUT をインポートして適用できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  const cube = Buffer.from(`LUT_3D_SIZE 2
0 0 0
1 0.1 0
0 1 0
1 0.2 0
0 0 1
1 0.1 1
0 1 1
1 0.2 1
`)

  await page.setInputFiles('input[accept*="image"]', { name: 'lut-photo.png', mimeType: 'image/png', buffer: png })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'lut-photo.png')

  await page.setInputFiles('input[accept*=".cube"]', { name: 'wedding-warm.cube', mimeType: 'text/plain', buffer: cube })
  await expect(page.getByText('「wedding-warm」をインポートしました')).toBeVisible()

  await page.getByLabel('LUT', { exact: true }).selectOption({ label: 'wedding-warm (2³)' })
  await expect(page.getByText('「wedding-warm」LUT を適用しました')).toBeVisible()
  await expect(page.getByRole('slider', { name: 'LUT 強度' })).toBeVisible()
  await expect(page.getByLabel('LUTプレビュー')).toBeVisible()
})

test('色調補正: HSL の色温度を設定できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  await page.setInputFiles('input[accept*="image"]', { name: 'hsl-photo.png', mimeType: 'image/png', buffer: png })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'hsl-photo.png')

  const temperature = page.getByRole('slider', { name: '色温度' })
  await temperature.fill('0.4')
  await expect(temperature).toHaveValue('0.4')
})

test('色調補正: トーンカーブのミッドトーンを設定できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  await page.setInputFiles('input[accept*="image"]', { name: 'tone-photo.png', mimeType: 'image/png', buffer: png })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'tone-photo.png')

  const midtones = page.getByRole('slider', { name: 'ミッドトーン' })
  await midtones.fill('0.3')
  await expect(midtones).toHaveValue('0.3')
})

test('色調補正: RGB カーブの R チャンネルを調整できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  await page.setInputFiles('input[accept*="image"]', { name: 'rgb-curve-photo.png', mimeType: 'image/png', buffer: png })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'rgb-curve-photo.png')

  const rMid = page.getByRole('slider', { name: 'R カーブ 50%' })
  await rMid.fill('0.7')
  await expect(rMid).toHaveValue('0.7')
  await expect(page.getByLabel('RGB カーブ (R)')).toBeVisible()
})

test('色調補正: RGB カーブに制御点を追加できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  await page.setInputFiles('input[accept*="image"]', { name: 'rgb-bezier-photo.png', mimeType: 'image/png', buffer: png })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'rgb-bezier-photo.png')

  const graph = page.getByLabel('RGB カーブ (R)')
  const box = await graph.boundingBox()
  expect(box).not.toBeNull()
  await graph.dblclick({ position: { x: box!.width * 0.4, y: box!.height * 0.45 } })
  await page.getByRole('button', { name: '制御点を削除' }).click()
  await expect(page.getByRole('button', { name: '制御点を削除' })).toHaveCount(0)
})

test('マルチ選択: Shift+クリックで追加選択し一括削除できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )

  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="image"]', [
    { name: 'msel-a.png', mimeType: 'image/png', buffer: png },
    { name: 'msel-b.png', mimeType: 'image/png', buffer: png },
    { name: 'msel-c.png', mimeType: 'image/png', buffer: png },
  ])
  await expect(page.getByText('3件のメディアを追加しました')).toBeVisible()

  const cardA = page.locator('div.group.relative').filter({ hasText: 'msel-a.png' })
  const cardB = page.locator('div.group.relative').filter({ hasText: 'msel-b.png' })
  const cardC = page.locator('div.group.relative').filter({ hasText: 'msel-c.png' })
  for (const card of [cardA, cardB, cardC]) {
    await card.hover()
    await card.getByTitle('スライドショー用に選択').click()
  }
  await page.getByRole('button', { name: 'スライドショー作成' }).click()
  await page.getByRole('dialog').locator('select').selectOption('none')
  await page.getByRole('button', { name: 'タイムラインに追加' }).click()
  await expect(page.getByText('3枚の写真をタイムラインに配置しました')).toBeVisible()

  const beforeCount = await getProjectClipCount(page)
  await timelineClip(page, 'msel-a.png').click()
  await timelineClip(page, 'msel-b.png').click({ modifiers: ['Shift'] })
  await expect(page.getByText('2件選択中')).toBeVisible()
  expect(await getSelectedClipCount(page)).toBe(2)

  await page.keyboard.press('Delete')
  expect(await getProjectClipCount(page)).toBe(beforeCount - 2)
  expect(await getSelectedClipCount(page)).toBe(0)
})

test('マルチ選択: Cmd+A でトラック内の全クリップを選択できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )

  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="image"]', [
    { name: 'selall-a.png', mimeType: 'image/png', buffer: png },
    { name: 'selall-b.png', mimeType: 'image/png', buffer: png },
  ])
  await expect(page.getByText('2件のメディアを追加しました')).toBeVisible()

  const cardA = page.locator('div.group.relative').filter({ hasText: 'selall-a.png' })
  const cardB = page.locator('div.group.relative').filter({ hasText: 'selall-b.png' })
  await cardA.hover()
  await cardA.getByTitle('スライドショー用に選択').click()
  await cardB.hover()
  await cardB.getByTitle('スライドショー用に選択').click()
  await page.getByRole('button', { name: 'スライドショー作成' }).click()
  await page.getByRole('dialog').locator('select').selectOption('none')
  await page.getByRole('button', { name: 'タイムラインに追加' }).click()

  await timelineClip(page, 'selall-a.png').click()
  await page.keyboard.press('Meta+a')
  expect(await getSelectedClipCount(page)).toBe(2)
  await expect(page.getByText('2件選択中')).toBeVisible()
})

test('ミキサー: トラックフェーダーとソロを操作できる', async ({ page }) => {
  await page.setInputFiles('input[accept*="audio"]', {
    name: 'mixer-bgm.wav',
    mimeType: 'audio/wav',
    buffer: makeSilentWav(1),
  })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()
  await page.getByTitle('クリックで再生位置に追加').click()

  await expect(page.getByRole('region', { name: 'オーディオミキサー' })).toBeVisible()
  const audioTrackIds = await getAudioTrackIds(page)
  expect(audioTrackIds.length).toBeGreaterThan(0)
  const bgmTrackId = audioTrackIds[0]

  await setTrackVolume(page, bgmTrackId, 0.6)
  expect(await getTrackVolume(page, bgmTrackId)).toBeCloseTo(0.6, 2)

  await toggleTrackSolo(page, bgmTrackId)
  expect(await getTrackSolo(page, bgmTrackId)).toBe(true)

  await page.getByLabel('BGM フェーダー').fill('0.8')
  await expect(page.getByLabel('BGM フェーダー')).toHaveValue('0.8')
})

test('編集ツール: タイムラインツールバーとショートカットで切替できる', async ({ page }) => {
  expect(await getTimelineEditTool(page)).toBe('selection')
  await expect(page.getByTestId('timeline-tool-selection')).toHaveAttribute('aria-pressed', 'true')

  await page.getByTestId('timeline-tool-slip').click()
  expect(await getTimelineEditTool(page)).toBe('slip')
  await expect(page.getByTestId('timeline-tool-slip')).toHaveAttribute('aria-pressed', 'true')

  await page.keyboard.press('u')
  expect(await getTimelineEditTool(page)).toBe('slide')
  await expect(page.getByTestId('timeline-tool-slide')).toHaveAttribute('aria-pressed', 'true')

  await page.keyboard.press('v')
  expect(await getTimelineEditTool(page)).toBe('selection')
  await expect(page.getByTestId('timeline-tool-selection')).toHaveAttribute('aria-pressed', 'true')

  await setTimelineEditTool(page, 'slip')
  await page.keyboard.press('y')
  expect(await getTimelineEditTool(page)).toBe('slip')
})

async function openImageColorInspector(page: import('@playwright/test').Page, name: string) {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  await page.setInputFiles('input[accept*="image"]', { name, mimeType: 'image/png', buffer: png })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, name)
}

test('色調: Before/After 分割プレビューを切替できる', async ({ page }) => {
  await openImageColorInspector(page, 'ba-photo.png')
  await page.getByTestId('inspector-color-before-after').click()
  expect(await getColorPreviewMode(page)).toBe('beforeAfter')
  await expect(page.getByTestId('color-before-after-toggle')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('Before', { exact: true })).toBeVisible()
  await expect(page.getByText('After', { exact: true })).toBeVisible()
})

test('色調: 輝度波形スコープを表示できる', async ({ page }) => {
  await openImageColorInspector(page, 'scope-photo.png')
  await page.getByTestId('inspector-color-scope').click()
  expect(await getShowColorScope(page)).toBe(true)
  expect(await getColorScopeMode(page)).toBe('waveform')
  await expect(page.getByTestId('color-waveform-scope')).toBeVisible()
})

test('色調: ベクトルスコープを表示できる', async ({ page }) => {
  await openImageColorInspector(page, 'vector-scope-photo.png')
  await page.getByTestId('inspector-color-vector-scope').click()
  expect(await getShowColorScope(page)).toBe(true)
  expect(await getColorScopeMode(page)).toBe('vector')
  await expect(page.getByTestId('color-vector-scope')).toBeVisible()
})

test('色調: セレクティブ HSL を有効化して調整できる', async ({ page }) => {
  await openImageColorInspector(page, 'sel-hsl-photo.png')
  await page.getByLabel('セレクティブ HSL を有効化').check()
  const saturation = page.getByRole('slider', { name: 'セレクティブ彩度' })
  await saturation.fill('0.4')
  await expect(saturation).toHaveValue('0.4')
  await expect(page.getByTestId('selective-hsl-section')).toBeVisible()
})

test('トラック管理: 映像トラックを追加して空トラックを削除できる', async ({ page }) => {
  const beforeSummaries = await getTrackSummaries(page)
  const before = beforeSummaries.length
  await page.getByTestId('timeline-add-track-menu').click()
  await page.getByTestId('timeline-add-track-video').click()
  const afterSummaries = await getTrackSummaries(page)
  expect(afterSummaries.length).toBe(before + 1)

  const newTrack = afterSummaries.find((t) => !beforeSummaries.some((b) => b.id === t.id))
  expect(newTrack?.clipCount).toBe(0)
  await page.getByTestId(`track-delete-${newTrack!.id}`).click()
  expect(await getTrackCount(page)).toBe(before)
})

test('トラック管理: クリップがあるトラックは削除できない', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  await page.setInputFiles('input[accept*="image"]', { name: 'trk-block.png', mimeType: 'image/png', buffer: png })
  await page.getByTitle('クリックで再生位置に追加').click()

  const summaries = await getTrackSummaries(page)
  const withClip = summaries.find((t) => t.clipCount > 0)
  expect(withClip).toBeTruthy()
  expect(await removeTrack(page, withClip!.id)).toBe(false)
  await expect(page.getByTestId(`track-delete-${withClip!.id}`)).toHaveCount(0)
})

test('トラック管理: トラック名を変更できる', async ({ page }) => {
  const trackId = (await getTrackSummaries(page)).find((t) => t.type === 'text')!.id
  await page.getByTestId(`track-header-${trackId}`).locator('span').dblclick()
  const input = page.getByTestId(`track-rename-input-${trackId}`)
  await input.fill('ナレーション')
  await input.press('Enter')
  expect(await getTrackName(page, trackId)).toBe('ナレーション')
})

test('トラック管理: レーン高さをリサイズできる', async ({ page }) => {
  const trackId = (await getTrackSummaries(page))[0].id
  const row = page.getByTestId(`track-row-${trackId}`)
  const before = await row.evaluate((el) => el.getBoundingClientRect().height)
  const handle = page.getByTestId(`track-resize-handle-${trackId}`)
  const box = await handle.boundingBox()
  expect(box).toBeTruthy()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await page.mouse.down()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + 24)
  await page.mouse.up()
  const after = await row.evaluate((el) => el.getBoundingClientRect().height)
  expect(after).toBeGreaterThan(before + 10)
})

test('JKLシャトル: L連打で 2x/4x に切り替わる', async ({ page }) => {
  await page.setInputFiles('input[accept*="audio"]', {
    name: 'shuttle-bgm.wav',
    mimeType: 'audio/wav',
    buffer: makeSilentWav(30),
  })
  await page.getByTitle('クリックで再生位置に追加').click()

  await page.keyboard.press('l')
  expect(await getIsPlaying(page)).toBe(true)
  expect(await getPlaybackShuttleRate(page)).toBe(1)
  await expect(page.getByTestId('playback-shuttle-rate')).toHaveCount(0)

  await page.keyboard.press('l')
  expect(await getPlaybackShuttleRate(page)).toBe(2)
  await expect(page.getByTestId('playback-shuttle-rate')).toHaveText('2x')

  await page.keyboard.press('l')
  expect(await getPlaybackShuttleRate(page)).toBe(4)
  await expect(page.getByTestId('playback-shuttle-rate')).toHaveText('4x')
})

test('JKLシャトル: K で停止するとレートが 1x に戻る', async ({ page }) => {
  await page.setInputFiles('input[accept*="audio"]', {
    name: 'shuttle-stop.wav',
    mimeType: 'audio/wav',
    buffer: makeSilentWav(30),
  })
  await page.getByTitle('クリックで再生位置に追加').click()

  await shuttleForward(page)
  await shuttleForward(page)
  expect(await getPlaybackShuttleRate(page)).toBe(2)

  await page.keyboard.press('k')
  expect(await getIsPlaying(page)).toBe(false)
  expect(await getPlaybackShuttleRate(page)).toBe(1)
  await expect(page.getByTestId('playback-shuttle-rate')).toHaveCount(0)

  const transport = page.locator('main input[type="range"]').first()
  const atStop = parseFloat(await transport.inputValue())
  await page.waitForTimeout(400)
  expect(Math.abs(parseFloat(await transport.inputValue()) - atStop)).toBeLessThan(0.05)
})

async function seedRippleInsertGapClips(page: import('@playwright/test').Page) {
  await page.setInputFiles('input[accept*="image"]', { name: 'ripple-gap.png', mimeType: 'image/png', buffer: TINY_PNG })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()
  const mediaId = await getFirstMediaAssetId(page)
  expect(mediaId).toBeTruthy()
  const trackId = (await getTrackSummaries(page)).find((t) => t.type === 'video')!.id
  expect(await addClipFromMediaAt(page, mediaId!, 0, trackId)).toBe(true)
  expect(await addClipFromMediaAt(page, mediaId!, 8, trackId)).toBe(true)
  return { mediaId: mediaId!, trackId }
}

test('リップルインサート: ON でギャップ挿入時に後続クリップがシフトする', async ({ page }) => {
  const { mediaId, trackId } = await seedRippleInsertGapClips(page)
  await setRippleInsert(page, true)
  await expect(page.getByTestId('ripple-insert-indicator')).toHaveText('挿入 ON')

  expect(await addClipFromMediaAt(page, mediaId, 5, trackId)).toBe(true)
  const starts = (await listClipStartTimesOnTrack(page, trackId)).sort((a, b) => a - b)
  expect(starts).toContain(13)
})

test('リップルインサート: OFF では従来どおり重なり回避で配置する', async ({ page }) => {
  const { mediaId, trackId } = await seedRippleInsertGapClips(page)
  await setRippleInsert(page, false)

  expect(await addClipFromMediaAt(page, mediaId, 5, trackId)).toBe(true)
  const starts = (await listClipStartTimesOnTrack(page, trackId)).sort((a, b) => a - b)
  expect(starts).toContain(8)
  expect(starts.some((t) => t > 8)).toBe(true)
})

test('リップルインサート: 挿入操作を undo できる', async ({ page }) => {
  const { mediaId, trackId } = await seedRippleInsertGapClips(page)
  await setRippleInsert(page, true)
  const before = (await listClipStartTimesOnTrack(page, trackId)).length
  expect(await addClipFromMediaAt(page, mediaId, 5, trackId)).toBe(true)
  expect((await listClipStartTimesOnTrack(page, trackId)).length).toBe(before + 1)

  await page.evaluate(() => window.__FABLE_E2E__!.undo())
  expect((await listClipStartTimesOnTrack(page, trackId)).length).toBe(before)
  expect((await listClipStartTimesOnTrack(page, trackId)).sort((a, b) => a - b)).toEqual([0, 8])
})

test('Rolling edit: 編集点ハンドルをドラッグして隣接クリップを同時トリムできる', async ({ page }) => {
  const stats = await loadRollingEditStress(page)
  await setTimelineEditTool(page, 'selection')

  const handle = page.getByTestId(`rolling-edit-handle-${stats.prevClipId}-${stats.nextClipId}`)
  await expect(handle).toBeVisible()
  const box = await handle.boundingBox()
  expect(box).toBeTruthy()

  const centerX = box!.x + box!.width / 2
  const centerY = box!.y + box!.height / 2
  await page.mouse.move(centerX, centerY)
  await page.mouse.down()
  await page.mouse.move(centerX + 40, centerY)
  await page.mouse.up()

  const prevDuration = await getRollingEditClipDuration(page, stats.prevClipId)
  const nextStart = await getRollingEditClipStartTime(page, stats.nextClipId)
  expect(prevDuration).toBeGreaterThan(stats.prevDurationBefore)
  expect(nextStart).toBe(prevDuration)
})

test('Rolling edit: 編集点操作を undo できる', async ({ page }) => {
  const stats = await loadRollingEditStress(page)
  await setTimelineEditTool(page, 'selection')

  expect(await rollingTrimAtEditPointById(page, stats.prevClipId, stats.nextClipId, stats.rollingDelta)).toBe(true)
  expect(await getRollingEditClipDuration(page, stats.prevClipId)).toBe(stats.prevDurationBefore + stats.rollingDelta)

  await page.evaluate(() => window.__FABLE_E2E__!.undo())
  expect(await getRollingEditClipDuration(page, stats.prevClipId)).toBe(stats.prevDurationBefore)
  expect(await getRollingEditClipStartTime(page, stats.nextClipId)).toBe(stats.nextStartBefore)
})

test('Rolling edit: ロックトラックでは編集点ハンドルが表示されない', async ({ page }) => {
  const stats = await loadRollingEditStress(page)
  await setTimelineEditTool(page, 'selection')
  await expect(page.getByTestId(`rolling-edit-handle-${stats.prevClipId}-${stats.nextClipId}`)).toBeVisible()

  await toggleTrackLock(page, stats.trackId)
  await expect(page.getByTestId(`rolling-edit-handle-${stats.prevClipId}-${stats.nextClipId}`)).toHaveCount(0)
  expect(await rollingTrimAtEditPointById(page, stats.prevClipId, stats.nextClipId, stats.rollingDelta)).toBe(false)
})

test('キーフレームナビ: 統合ジャンプで再生位置と選択が更新される', async ({ page }) => {
  const stats = await loadKeyframeNavStress(page)
  expect(await jumpToAdjacentKeyframe(page, 'next')).toBe(true)
  await expect.poll(async () => page.evaluate(() => window.__FABLE_E2E__!.getPlaybackTime())).toBeCloseTo(stats.firstNavTime, 2)
  expect(await getSelectedNavKeyframe(page)).toMatchObject({ clipId: stats.clipId, type: stats.firstNavType })

  expect(await jumpToAdjacentKeyframe(page, 'next')).toBe(true)
  await expect.poll(async () => page.evaluate(() => window.__FABLE_E2E__!.getPlaybackTime())).toBeCloseTo(stats.secondNavTime, 2)
  expect(await getSelectedNavKeyframe(page)).toMatchObject({ clipId: stats.clipId, type: stats.secondNavType })
})

test('キーフレームナビ: ; / \' ショートカットで前後ジャンプできる', async ({ page }) => {
  const stats = await loadKeyframeNavStress(page)
  await page.keyboard.press("'")
  await expect.poll(async () => page.evaluate(() => window.__FABLE_E2E__!.getPlaybackTime())).toBeCloseTo(stats.firstNavTime, 2)
  await page.keyboard.press("'")
  await expect.poll(async () => page.evaluate(() => window.__FABLE_E2E__!.getPlaybackTime())).toBeCloseTo(stats.secondNavTime, 2)
  await page.keyboard.press(';')
  await expect.poll(async () => page.evaluate(() => window.__FABLE_E2E__!.getPlaybackTime())).toBeCloseTo(stats.firstNavTime, 2)
})

test('キーフレームナビ: キーフレームがないクリップではジャンプしない', async ({ page }) => {
  await addOpeningText(page)
  await clickTimelineClip(page, 'Opening')
  expect(await jumpToAdjacentKeyframe(page, 'next')).toBe(false)
})

test('動画音声リンク: 切り離しでダッキング区間と可聴動画音声が減る', async ({ page }) => {
  const stats = await loadVideoAudioLinkStress(page)
  expect(await isClipAudioLinked(page, stats.videoClipId)).toBe(true)
  expect(await getAudibleVideoAudioClipCount(page)).toBe(1)
  expect(await getDuckingIntervalCount(page)).toBe(stats.duckingIntervalCountBefore)
  expect(stats.duckingIntervalCountBefore).toBeGreaterThan(0)

  expect(await detachVideoAudioById(page, stats.videoClipId)).toBe(true)
  expect(await isClipAudioLinked(page, stats.videoClipId)).toBe(false)
  expect(await getAudibleVideoAudioClipCount(page)).toBe(0)
  expect(await getDuckingIntervalCount(page)).toBe(0)
})

test('動画音声リンク: リンク復帰でダッキング区間と可聴動画音声が戻る', async ({ page }) => {
  const stats = await loadVideoAudioLinkStress(page)
  expect(await detachVideoAudioById(page, stats.videoClipId)).toBe(true)
  expect(await getDuckingIntervalCount(page)).toBe(0)

  expect(await linkVideoAudioById(page, stats.videoClipId)).toBe(true)
  expect(await isClipAudioLinked(page, stats.videoClipId)).toBe(true)
  expect(await getAudibleVideoAudioClipCount(page)).toBe(1)
  expect(await getDuckingIntervalCount(page)).toBe(stats.duckingIntervalCountBefore)
})

test('動画音声リンク: ナレーション配置準備で切り離しとクリップ先頭へシークする', async ({ page }) => {
  const stats = await loadVideoAudioLinkStress(page)
  await page.evaluate(() => window.__FABLE_E2E__!.setPlaybackTime(10))

  const result = await prepareNarrationForVideoClipById(page, stats.videoClipId)
  expect(result).toMatchObject({
    clipId: stats.videoClipId,
    audioTrackId: stats.audioTrackId,
    startTime: stats.narrationStartTime,
    duration: 5,
  })
  expect(await isClipAudioLinked(page, stats.videoClipId)).toBe(false)
  expect(await getAudibleVideoAudioClipCount(page)).toBe(0)
  await expect.poll(async () => page.evaluate(() => window.__FABLE_E2E__!.getPlaybackTime())).toBeCloseTo(stats.narrationStartTime, 2)
})

test('色調ペースト: コピーして選択クリップへ一括ペーストできる', async ({ page }) => {
  const stats = await loadColorPasteStress(page)
  expect(await copyClipColorById(page, stats.sourceClipId)).toBe(true)
  expect(await hasColorClipboard(page)).toBe(true)

  for (const clipId of stats.targetClipIds) {
    await page.evaluate((id) => window.__FABLE_E2E__!.toggleClipInSelection(id), clipId)
  }

  expect(await pasteColorToSelectedClips(page)).toBe(2)
  for (const clipId of stats.targetClipIds) {
    expect(await clipMatchesColorPasteSourceClip(page, clipId, stats.sourceClipId)).toBe(true)
  }
})

test('色調ペースト: 先頭クリップの色調を他の選択へ適用できる', async ({ page }) => {
  const stats = await loadColorPasteStress(page)

  for (const clipId of stats.targetClipIds) {
    await page.evaluate((id) => window.__FABLE_E2E__!.toggleClipInSelection(id), clipId)
  }

  expect(await applyPrimaryClipColorToSelection(page)).toBe(2)
  for (const clipId of stats.targetClipIds) {
    expect(await clipMatchesColorPasteSourceClip(page, clipId, stats.sourceClipId)).toBe(true)
  }
})

test('色調ペースト: クリップボードが空のときペーストは 0 件', async ({ page }) => {
  const stats = await loadColorPasteStress(page)
  await page.evaluate((id) => window.__FABLE_E2E__!.toggleClipInSelection(id), stats.targetClipIds[0])
  expect(await hasColorClipboard(page)).toBe(false)
  expect(await pasteColorToSelectedClips(page)).toBe(0)
})

test('速度オーディオ連動: 連動時はスロー区間で素材消費が抑えられる', async ({ page }) => {
  const stats = await loadSpeedAudioLinkStress(page)
  expect(await isClipSpeedAudioLinked(page, stats.videoClipId)).toBe(true)
  const schedule = await getVideoAudioSpeedScheduleForClip(page, stats.videoClipId, 0, stats.timelineDuration)
  expect(schedule?.linked).toBe(true)
  expect(schedule?.bufferDuration).toBe(stats.linkedBufferDuration)
  expect(schedule?.bufferDuration).toBeLessThan(stats.unlinkedBufferDuration)
})

test('速度オーディオ連動: 連動解除で線形 1x 素材マッピングに戻る', async ({ page }) => {
  const stats = await loadSpeedAudioLinkStress(page)
  expect(await setSpeedAudioLinkedById(page, stats.videoClipId, false)).toBe(true)
  expect(await isClipSpeedAudioLinked(page, stats.videoClipId)).toBe(false)

  const schedule = await getVideoAudioSpeedScheduleForClip(page, stats.videoClipId, 0, stats.timelineDuration)
  expect(schedule).toMatchObject({
    linked: false,
    bufferDuration: stats.unlinkedBufferDuration,
    timelineDuration: stats.timelineDuration,
  })
})

test('速度オーディオ連動: プレビュー/書き出しスケジュールが一致する', async ({ page }) => {
  const stats = await loadSpeedAudioLinkStress(page)
  expect(await previewExportScheduleParity(page, stats.videoClipId, 0, stats.timelineDuration)).toBe(true)
})
