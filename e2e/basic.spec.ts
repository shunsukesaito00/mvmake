import { test, expect, type Page } from '@playwright/test'
import path from 'node:path'
import { Buffer } from 'node:buffer'
import {
  TINY_PNG,
  applyWeddingFullTemplate,
  assertPlaybackStops,
  clickTimelineClip,
  clearTextStylePresets,
  installNarrationRecordingMocks,
  installNarrationPermissionDeniedMock,
  installNarrationNoDeviceMock,
  installNarrationEmptyRecordingMock,
  loadTextStylePresetStress,
  loadMediaListStress,
  loadAudioNormalizeStress,
  getClipAudioVolume,
  getClipVolumeKeyframeMax,
  selectClipById,
  loadTransformKeyframeStress,
  getClipTransformKeyframeCount,
  getInterpolatedTransformAt,
  listImageClipTransformKeyframeCounts,
  loadVolumeKeyframeTimelineStress,
  getClipVolumeKeyframeCount,
  loadVolumeKeyframeStress,
  getVolumeAtClipLocalTime,
  listVolumeKeyframeClipCounts,
  listAudioTrackVolumeKeyframeCounts,
  listAudioClipVolumeKeyframeCounts,
  updateVolumeKeyframeById,
  loadSlipSlideStress,
  getClipTransformKeyframeTimes,
  getClipVolumeKeyframeTimes,
  getClipSourceStart,
  getClipStartTime,
  slipClipById,
  slideClipById,
  getStressClipDuration,
  loadToneCurveStress,
  getRgbCurveSampleAt,
  getClipPixelGradeSample,
  applyClipColorMidtones,
  getClipColorMidtones,
  applyClipRgbCurvePoint,
  loadTemplateStress,
  applyBuiltinTemplateById,
  applyUserTemplateById,
  tryImportTemplateStressJson,
  getTemplateStressClipCount,
  getTemplateStressMarkerCount,
  loadStructuredWeddingTemplateStress,
  getStructuredWeddingTemplateStressStats,
  loadPhotoGuideSlideshowStress,
  getPhotoGuideClipCount,
  getProjectClipCount,
  getChapterMarkerCount,
  loadBatchTransitionRemovalStress,
  loadBatchTransitionStress,
  countClipsWithTransition,
  loadVertical916PresetStress,
  getVertical916PresetStressStats,
  applyVertical916Preset,
  loadExportResolutionAlignmentStress,
  loadExportPresetStress,
  applyExportPresetByName,
  loadExportPresetExportStress,
  clearExportPresets,
  getExportPresetCount,
  importExportPresetJson,
  getInPoint,
  getOutPoint,
  loadVideoFadeStress,
  applyClipFade,
  getClipFadeValues,
  getMediaVisualOpacityForClip,
  getProjectWidth,
  getProjectHeight,
  makeSilentWav,
  makeTinyWebmVideo,
  makeWavWithPeak,
  timelineClip,
  checkEncodersSupported,
  loadChapterExportStressProject,
  loadChapterExportE2eProject,
  loadMarkerEditStress,
  loadUserProjectTemplateStress,
  loadUserProjectTemplateExportStress,
  loadMediaReplaceStress,
  getUserProjectTemplateCount,
  clearUserProjectTemplates,
  importUserProjectTemplateJson,
  loadProjectSettingsPresetExportStress,
  clearProjectSettingsPresets,
  importProjectSettingsPresetJson,
  getProjectSettingsPresetCount,
  getProjectFps,
  getRippleDelete,
  getLoopPlayback,
  getClipMediaId,
  getMediaAssetName,
  getMediaReplaceCandidateCount,
  getClipKenBurnsEnabled,
} from './helpers'

async function goOnboarded(page: Page) {
  await page.addInitScript(() => localStorage.setItem('fable-onboarded', '1'))
  await page.goto('./')
  await expect(page.getByText('FABLE', { exact: true })).toBeVisible()
}

async function addOpeningText(page: Page) {
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: /Opening/ }).first().click()
  await expect(page.locator('footer').getByText('Opening')).toBeVisible()
}

test('基本フロー: 起動 → オンボーディング → テキスト追加 → タイムライン確認', async ({ page }) => {
  // './' は baseURL のサブパス(本番の /mvmake/ など)を保持する
  await page.goto('./')

  // ツールバーが表示される
  await expect(page.getByText('FABLE', { exact: true })).toBeVisible()

  // 初回起動なのでオンボーディングが表示される
  await expect(page.getByText('FABLE へようこそ')).toBeVisible()
  await page.getByRole('button', { name: 'スキップ' }).click()
  await expect(page.getByText('FABLE へようこそ')).toBeHidden()

  // テキストタブに切り替えてプリセットを追加
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: /Opening/ }).first().click()

  // タイムライン(footer)にクリップが配置される
  await expect(page.locator('footer').getByText('Opening')).toBeVisible()

  // リロードしてもオンボーディングは再表示されない(localStorage記録)
  await page.reload()
  await expect(page.getByText('FABLE', { exact: true })).toBeVisible()
  await expect(page.getByText('FABLE へようこそ')).toBeHidden()
})

test('サンプルプロジェクト: オンボーディングから開いて編集体験を開始できる', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByText('FABLE へようこそ')).toBeVisible()

  await page.getByRole('button', { name: '次へ' }).click()
  await page.getByRole('button', { name: '次へ' }).click()
  await page.getByRole('button', { name: 'サンプルで体験する' }).click()
  await expect(page.getByText('サンプルを開きました', { exact: false })).toBeVisible()
  await expect(page.getByText('FABLE へようこそ')).toBeHidden()

  await expect(page.getByRole('button', { name: 'サンプルプロジェクト' })).toBeVisible()
  await expect(page.locator('footer').getByText('Our Story.jpg')).toBeVisible()
  await expect(page.locator('footer').getByText('Opening')).toBeVisible()
  await expect(page.getByText('▶ 再生してプレビュー')).toBeVisible()
})

test('サンプルプロジェクト: 再生ガイド後に書き出しへ誘導される', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByText('FABLE へようこそ')).toBeVisible()

  await page.getByRole('button', { name: '次へ' }).click()
  await page.getByRole('button', { name: '次へ' }).click()
  await page.getByRole('button', { name: 'サンプルで体験する' }).click()
  await expect(page.getByText('▶ 再生してプレビュー')).toBeVisible()

  await page.getByRole('button', { name: '再生 (Space)' }).click()
  await expect(page.getByText('書き出しから MP4 を保存')).toBeVisible()

  await page.getByRole('button', { name: '書き出し' }).click()
  await expect(page.getByRole('button', { name: '1080p で書き出し' })).toBeVisible()
  await expect(page.getByText('章マーカー区間')).toBeVisible()
})

test('書き出し: 空プロジェクトではボタンが無効', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'スキップ' }).click()
  await expect(page.getByRole('button', { name: '書き出し' })).toBeDisabled()
})

test('音量キーフレーム: オーディオクリップでキーフレームを追加できる', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('fable-onboarded', '1'))
  await page.goto('./')
  await expect(page.getByText('FABLE', { exact: true })).toBeVisible()

  const wav = makeSilentWav(0.5)
  await page.setInputFiles('input[accept*="audio"]', { name: 'bgm.wav', mimeType: 'audio/wav', buffer: wav })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()

  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'bgm.wav')

  await page.getByRole('button', { name: '音量キーフレーム' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await expect(page.getByText('キーフレーム 1')).toBeVisible()
})

test('テンプレート: 結婚式フル構成を適用できる', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('fable-onboarded', '1'))
  await page.goto('./')
  await applyWeddingFullTemplate(page)
  await expect(page.locator('[title="オープニング"]')).toBeVisible()
  await expect(page.locator('footer').getByText('Opening')).toBeVisible()
})

test('色調: ウエディング暖色ルックを適用できる', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('fable-onboarded', '1'))
  await page.goto('./')

  await page.setInputFiles('input[accept*="image"]', { name: 'look-photo.png', mimeType: 'image/png', buffer: TINY_PNG })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'look-photo.png')

  await page.getByRole('button', { name: 'ウエディング暖色ルック', exact: true }).click()
  await expect(page.getByText('「ウエディング暖色」ルックを適用しました')).toBeVisible()
})

test('トランジション: クロスフェードを適用できる', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('fable-onboarded', '1'))
  await page.goto('./')

  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="image"]', [
    { name: 'tr-a.png', mimeType: 'image/png', buffer: TINY_PNG },
    { name: 'tr-b.png', mimeType: 'image/png', buffer: TINY_PNG },
  ])
  await expect(page.getByText('2件のメディアを追加しました')).toBeVisible()

  const cardA = page.locator('div.group.relative').filter({ hasText: 'tr-a.png' })
  const cardB = page.locator('div.group.relative').filter({ hasText: 'tr-b.png' })
  await cardA.hover()
  await cardA.getByTitle('スライドショー用に選択').click()
  await cardB.hover()
  await cardB.getByTitle('スライドショー用に選択').click()
  await page.getByRole('button', { name: 'スライドショー作成' }).click()
  await page.getByRole('dialog').locator('select').selectOption('none')
  await page.getByRole('button', { name: 'タイムラインに追加' }).click()
  await expect(page.getByText('2枚の写真をタイムラインに配置しました')).toBeVisible()

  await timelineClip(page, 'tr-a.png').click()
  await page.getByTitle('効果').click()
  await page.getByRole('button', { name: 'クロスフェード', exact: true }).click()
  await expect(page.getByText('クロスフェードを適用しました')).toBeVisible()
})

test('書き出し: ダイアログを開いて1080pボタンを確認', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('fable-onboarded', '1'))
  await page.goto('./')

  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: /Opening/ }).first().click()
  await page.getByRole('button', { name: '書き出し' }).click()
  await expect(page.getByRole('button', { name: '1080p で書き出し' })).toBeVisible()
})

test('書き出し: 章マーカー区間を In/Out に設定できる', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('fable-onboarded', '1'))
  await page.goto('./')
  await applyWeddingFullTemplate(page)

  await page.getByRole('button', { name: '書き出し' }).click()
  await page.getByRole('button', { name: '章「新郎プロフィール」を In/Out に設定' }).click()
  await expect(page.getByText('「新郎プロフィール」を In/Out に設定しました')).toBeVisible()
  await expect(page.getByText('書き出し範囲: 20.0–50.0s')).toBeVisible()
})

test('書き出し: 章 ZIP 書き出し UI を確認', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('fable-onboarded', '1'))
  await page.goto('./')
  await applyWeddingFullTemplate(page)

  await page.getByRole('button', { name: '書き出し' }).click()
  await expect(page.getByRole('button', { name: '全章を ZIP で書き出し' })).toBeVisible()
  await expect(page.getByText('5 章を個別 MP4 化して ZIP にまとめます')).toBeVisible()
})

test('プレビュー: 動画クリップ配置後に再生停止できる', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('fable-onboarded', '1'))
  await page.goto('./')

  const webm = await makeTinyWebmVideo(page)
  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="video"]', { name: 'prod-playback.webm', mimeType: 'video/webm', buffer: webm })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible({ timeout: 15_000 })
  await page.getByTitle('クリックで再生位置に追加').click()
  await expect(page.locator('footer').getByText('prod-playback.webm')).toBeVisible()

  await assertPlaybackStops(page)
})

test('プロジェクト一覧: モーダル開閉と新規プロジェクト作成', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)

  await page.getByTitle('プロジェクト一覧').click()
  await expect(page.getByText('プロジェクト', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: '閉じる' }).click()
  await expect(page.getByText('プロジェクト', { exact: true })).toBeHidden()
  await page.getByTitle('プロジェクト一覧').click()

  await page.getByRole('button', { name: '+ 新規プロジェクト' }).click()
  await expect(page.getByText('新規プロジェクトを作成しました')).toBeVisible()
  await expect(page.getByText('プロジェクト', { exact: true })).toBeHidden()
  await expect(page.locator('footer').getByText('Opening')).toBeHidden()

  await page.getByTitle('プロジェクト一覧').click()
  await expect(page.getByText(/クリップ1件/)).toBeVisible()
})

test('インスペクター: テキスト内容の編集がタイムラインへ反映される', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)

  const textarea = page.locator('textarea')
  await expect(textarea).toBeVisible()
  await textarea.fill('乾杯のご挨拶')

  await expect(page.locator('footer').getByText('乾杯のご挨拶')).toBeVisible()
  await expect(page.locator('footer').getByText('Opening')).toBeHidden()
})

test('インスペクター: 未選択時のクイックスタートからテキストを追加できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('プロジェクト一覧').click()
  await page.getByRole('button', { name: '+ 新規プロジェクト' }).click()
  await expect(page.getByText('新規プロジェクトを作成しました')).toBeVisible()
  await expect(page.locator('footer').getByText('Opening')).toBeHidden()

  await expect(page.getByText('クイックスタート')).toBeVisible()
  await page.getByRole('button', { name: 'テキストを追加' }).click()
  await expect(page.locator('footer').getByText('Opening')).toBeVisible()
})

test('ヘルプ: 「?」キーでショートカット一覧をトグル表示', async ({ page }) => {
  await goOnboarded(page)

  await page.keyboard.press('?')
  await expect(page.getByRole('dialog', { name: 'キーボードショートカット' })).toBeVisible()
  await expect(page.getByText('再生 / 一時停止')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'キーボードショートカット' })).toBeHidden()
})

test('ユーザーテンプレート: 保存・適用・新規作成', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('テンプレ').click()
  await page.getByRole('button', { name: /結婚式フル構成/ }).click()
  await expect(page.getByText('結婚式フル構成テンプレートを適用しました')).toBeVisible()

  await page.getByLabel('テンプレート名').fill('ProdSmoke保存テンプレ')
  await page.getByRole('button', { name: '現在の構成をテンプレート保存' }).click()
  await expect(page.getByText('「ProdSmoke保存テンプレ」テンプレートを保存しました')).toBeVisible()

  await page.getByTitle('プロジェクト一覧').click()
  await page.getByRole('button', { name: '+ 新規プロジェクト' }).click()
  await expect(page.getByText('新規プロジェクトを作成しました')).toBeVisible()
  await expect(page.locator('footer').getByText('Opening')).toBeHidden()

  await page.getByTitle('プロジェクト一覧').click()
  await page.getByRole('button', { name: 'ProdSmoke保存テンプレで新規作成' }).click()
  await expect(page.getByText('「ProdSmoke保存テンプレ」で新規プロジェクトを作成しました')).toBeVisible()
  await expect(page.locator('footer').getByText('Opening')).toBeVisible()
  await expect(page.locator('[title="オープニング"]')).toBeVisible()

  await page.getByTitle('テンプレ').click()
  await page.getByRole('button', { name: 'ProdSmoke保存テンプレを適用' }).click()
  await expect(page.getByText('「ProdSmoke保存テンプレ」テンプレートを適用しました')).toBeVisible()
  await expect(page.locator('footer').getByText('Opening')).toBeVisible()
})

test('メディア: 画像をインポートしてタイムラインに配置できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="image"]', { name: 'smoke-photo.png', mimeType: 'image/png', buffer: TINY_PNG })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()
  await page.getByTitle('クリックで再生位置に追加').click()
  await expect(page.locator('footer').getByText('smoke-photo.png')).toBeVisible()
})

test('編集: クリップ削除を undo で復元できる', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)
  await page.keyboard.press('Delete')
  await expect(page.locator('footer').getByText('Opening')).toBeHidden()
  await page.keyboard.press('ControlOrMeta+z')
  await expect(page.locator('footer').getByText('Opening')).toBeVisible()
})

test('編集: クリップをコピーしてペーストできる', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)
  await page.keyboard.press('ControlOrMeta+c')
  await expect(page.getByText('コピーしました')).toBeVisible()
  await page.keyboard.press('ControlOrMeta+v')
  await expect(page.locator('footer').getByText('Opening')).toHaveCount(2)
})

test('メディア: 検索・種類フィルタができる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="video"]', [
    { name: 'zebra.png', mimeType: 'image/png', buffer: TINY_PNG },
    { name: 'alpha-photo.png', mimeType: 'image/png', buffer: TINY_PNG },
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
})

test('書き出し: ダイアログを Escape で閉じられる', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)
  await page.getByRole('button', { name: '書き出し' }).click()
  await expect(page.getByRole('dialog', { name: 'MP4書き出し' })).toBeVisible()
  await expect(page.getByRole('button', { name: '1080p で書き出し' })).toBeVisible()
  await page.getByRole('dialog', { name: 'MP4書き出し' }).press('Escape')
  await expect(page.getByRole('dialog', { name: 'MP4書き出し' })).toBeHidden()
})

test('編集: クリップを再生位置で分割できる', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)
  await clickTimelineClip(page, 'Opening')
  await page.locator('main input[type="range"]').fill('2')
  await page.locator('[data-preview-container]').click()
  await page.getByRole('button', { name: '分割 (S)' }).click()
  await expect(page.locator('footer').getByText('Opening')).toHaveCount(2)
})

test('編集: In/Out点を設定できる', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)
  const playhead = page.locator('main input[type="range"]')
  await playhead.fill('1')
  await playhead.blur()
  await page.keyboard.press('i')
  await playhead.fill('3')
  await playhead.blur()
  await page.keyboard.press('o')
  await expect(page.getByText('IN 1.0')).toBeVisible()
  await expect(page.getByText('OUT 3.0')).toBeVisible()
})

test('編集: 章マーカーを追加できる', async ({ page }) => {
  await goOnboarded(page)
  await page.keyboard.press('m')
  await expect(page.locator('[title="Marker 0.0s"]')).toBeVisible()
  await page.locator('[title="Marker 0.0s"]').click()
  await expect(page.locator('aside').getByText('章マーカー', { exact: true })).toBeVisible()
})

test('インスペクター: Google Fonts を選択できる', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)
  const fontSelect = page.getByLabel('フォント', { exact: true })
  await expect(fontSelect.locator('option')).toHaveCount(12)
  await fontSelect.selectOption('Zen Old Mincho')
  await expect(fontSelect).toHaveValue('Zen Old Mincho')
})

test('映像フェード: 画像クリップにフェードインを設定できる', async ({ page }) => {
  await goOnboarded(page)
  await page.setInputFiles('input[accept*="image"]', { name: 'fade-photo.png', mimeType: 'image/png', buffer: TINY_PNG })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'fade-photo.png')
  await page.getByRole('button', { name: 'フェード' }).click()
  const fadeIn = page.getByRole('slider', { name: 'フェードイン' })
  await fadeIn.fill('0.5')
  await expect(fadeIn).toHaveValue('0.5')
})

test('タイムライン: 右端ハンドルのトリムで長さが短くなる', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)
  const clip = page.locator('footer').getByText('Opening')
  const before = (await clip.boundingBox())!

  await page.mouse.move(before.x + before.width - 3, before.y + 10)
  await page.mouse.down()
  await page.mouse.move(before.x + before.width - 83, before.y + 10, { steps: 5 })
  await page.mouse.up()

  const after = (await clip.boundingBox())!
  expect(after.x).toBeCloseTo(before.x, 0)
  expect(before.width - after.width).toBeGreaterThan(60)
  expect(before.width - after.width).toBeLessThan(100)
})

test('タイムライン: クリップのドラッグ移動', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)
  const clip = page.locator('footer').getByText('Opening')
  const before = (await clip.boundingBox())!

  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2)
  await page.mouse.down()
  await page.mouse.move(before.x + before.width / 2 + 160, before.y + before.height / 2, { steps: 8 })
  await page.mouse.up()

  const after = (await clip.boundingBox())!
  expect(after.x - before.x).toBeGreaterThan(140)
  expect(after.x - before.x).toBeLessThan(180)
})

test('テキスト: SRT 字幕をエクスポートできる', async ({ page }) => {
  await goOnboarded(page)
  const srt = `1
00:00:01,000 --> 00:00:03,500
乾杯のご挨拶`

  await page.getByTitle('テキスト').click()
  await page.setInputFiles('input[aria-label="SRT 字幕ファイル"]', {
    name: 'subtitles.srt',
    mimeType: 'application/x-subrip',
    buffer: Buffer.from(srt, 'utf-8'),
  })
  await expect(page.getByText('1件の字幕クリップをインポートしました')).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'SRT を保存' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/\.srt$/)
  await expect(page.getByText('1件の字幕をSRTでエクスポートしました')).toBeVisible()
})

test('編集: ビートマーカーを追加できる', async ({ page }) => {
  await goOnboarded(page)
  await page.locator('[data-preview-container]').click()
  await page.keyboard.press('Shift+M')
  await expect(page.locator('[data-marker-type="beat"]')).toHaveCount(1)
  await expect(page.locator('[title="Beat 1"]')).toBeVisible()
})

test('プレビュー: セーフエリア表示を切り替えできる', async ({ page }) => {
  await goOnboarded(page)
  const safeBtn = page.getByTitle('セーフエリア (G)')
  await safeBtn.click()
  await expect(safeBtn).toHaveClass(/bg-accent-muted/)
  await page.locator('[data-preview-container]').click()
  await page.keyboard.press('g')
  await expect(safeBtn).not.toHaveClass(/bg-accent-muted/)
})

test('タイムライン: 左端ハンドルのトリムで開始位置と長さが変わる', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)
  const clip = page.locator('footer').getByText('Opening')
  const before = (await clip.boundingBox())!

  await page.mouse.move(before.x + 3, before.y + before.height / 2)
  await page.mouse.down()
  await page.mouse.move(before.x + 83, before.y + before.height / 2, { steps: 5 })
  await page.mouse.up()

  const after = (await clip.boundingBox())!
  expect(after.x - before.x).toBeGreaterThan(60)
  expect(after.x - before.x).toBeLessThan(100)
  expect(before.width - after.width).toBeGreaterThan(60)
  expect(after.x + after.width).toBeCloseTo(before.x + before.width, 0)
})

test('タイムライン: Alt+ドラッグでクリップを複製して移動', async ({ page }) => {
  await goOnboarded(page)
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

  await expect(clips).toHaveCount(2)
})

test('テキスト: VTT 字幕をエクスポートできる', async ({ page }) => {
  await goOnboarded(page)
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
  await expect(page.getByText('1件の字幕をVTTでエクスポートしました')).toBeVisible()
})

test('効果: 調整レイヤーを追加できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByRole('button', { name: '調整レイヤーを追加 章全体へ色調を一括適用' }).click()
  await expect(page.getByText('調整レイヤーを追加しました')).toBeVisible()
  await expect(page.locator('footer').getByText('調整レイヤー')).toBeVisible()
})

test('プロジェクト設定: モーダルを開いて解像度を変更できる', async ({ page }) => {
  await goOnboarded(page)
  await expect(page.getByText('1920×1080 · 30fps')).toBeVisible()
  await page.getByTitle('プロジェクト設定').click()
  await expect(page.getByRole('dialog', { name: 'プロジェクト設定' })).toBeVisible()
  await page.getByRole('button', { name: /正方形/ }).click()
  await page.getByRole('dialog', { name: 'プロジェクト設定' }).getByRole('button', { name: '適用', exact: true }).click()
  await expect(page.getByText('1080×1080 · 30fps')).toBeVisible()
})

test('プロジェクト設定: 縦型9:16に変更して書き出しラベルを確認', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)
  await page.getByTitle('プロジェクト設定').click()
  await page.getByRole('button', { name: /縦型 9:16/ }).click()
  await page.getByRole('dialog', { name: 'プロジェクト設定' }).getByRole('button', { name: '適用', exact: true }).click()
  await expect(page.getByText('1080×1920 · 30fps')).toBeVisible()
  await page.getByRole('button', { name: '書き出し' }).click()
  await expect(page.getByRole('button', { name: '9:16 で書き出し' })).toBeVisible()
})

test('書き出し: プリセットを保存して適用できる', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)
  await page.getByRole('button', { name: '書き出し' }).click()
  await page.getByRole('button', { name: /軽量/ }).click()
  await page.getByRole('button', { name: '解像度 720p' }).click()
  await page.getByPlaceholder('プリセット名').fill('SNS用')
  await page.getByRole('button', { name: 'プリセット保存' }).click()
  await expect(page.getByText('「SNS用」プリセットを保存しました')).toBeVisible()
  await page.getByRole('button', { name: 'SNS用を適用' }).click()
  await expect(page.getByText('「SNS用」プリセットを適用しました')).toBeVisible()
  await expect(page.getByRole('button', { name: /軽量/ })).toHaveAttribute('aria-pressed', 'true')
})

test('メディア: スライドショーを作成してタイムラインに配置できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="image"]', [
    { name: 'ss-a.png', mimeType: 'image/png', buffer: TINY_PNG },
    { name: 'ss-b.png', mimeType: 'image/png', buffer: TINY_PNG },
  ])
  await expect(page.getByText('2件のメディアを追加しました')).toBeVisible()

  const cardA = page.locator('div.group.relative').filter({ hasText: 'ss-a.png' })
  const cardB = page.locator('div.group.relative').filter({ hasText: 'ss-b.png' })
  await cardA.hover()
  await cardA.getByTitle('スライドショー用に選択').click()
  await cardB.hover()
  await cardB.getByTitle('スライドショー用に選択').click()
  await page.getByRole('button', { name: 'スライドショー作成' }).click()
  await page.getByRole('dialog').locator('select').selectOption('none')
  await page.getByRole('button', { name: 'タイムラインに追加' }).click()
  await expect(page.getByText('2枚の写真をタイムラインに配置しました')).toBeVisible()
})

test('インスペクター: オーディオクリップにフェードイン/アウトを設定できる', async ({ page }) => {
  await goOnboarded(page)
  const wav = makeSilentWav(2)
  await page.setInputFiles('input[accept*="audio"]', { name: 'fade-bgm.wav', mimeType: 'audio/wav', buffer: wav })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'fade-bgm.wav')

  const fadeIn = page.getByRole('slider', { name: 'フェードイン' })
  const fadeOut = page.getByRole('slider', { name: 'フェードアウト' })
  await fadeIn.fill('0.5')
  await fadeOut.fill('1')
  await expect(fadeIn).toHaveValue('0.5')
  await expect(fadeOut).toHaveValue('1')
})

test('インスペクター: BGM ダッキングを設定できる', async ({ page }) => {
  await goOnboarded(page)
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

test('トランジション: フェード to 黒を画像クリップに適用できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="image"]', [
    { name: 'black-a.png', mimeType: 'image/png', buffer: TINY_PNG },
    { name: 'black-b.png', mimeType: 'image/png', buffer: TINY_PNG },
  ])
  await expect(page.getByText('2件のメディアを追加しました')).toBeVisible()
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'black-a.png' }).click()
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'black-b.png' }).click()

  await clickTimelineClip(page, 'black-b.png')
  await page.getByTitle('効果').click()
  await page.getByRole('button', { name: 'フェード to 黒', exact: true }).click()
  await expect(page.getByText('フェード to 黒を適用しました')).toBeVisible()
})

test('インスペクター: 音量を正規化できる', async ({ page }) => {
  await goOnboarded(page)
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

test('インスペクター: オーディオ EQ を設定できる', async ({ page }) => {
  await goOnboarded(page)
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

test('トランジション: ディゾルブを画像クリップに適用できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="image"]', [
    { name: 'dissolve-a.png', mimeType: 'image/png', buffer: TINY_PNG },
    { name: 'dissolve-b.png', mimeType: 'image/png', buffer: TINY_PNG },
  ])
  await expect(page.getByText('2件のメディアを追加しました')).toBeVisible()
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'dissolve-a.png' }).click()
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'dissolve-b.png' }).click()

  await clickTimelineClip(page, 'dissolve-b.png')
  await page.getByTitle('効果').click()
  // 絞り込みチップと同名のため、トランジション一覧側（2番目）をクリック
  await page.getByRole('button', { name: 'ディゾルブ', exact: true }).nth(1).click()
  await expect(page.getByText('ディゾルブを適用しました')).toBeVisible()
})

test('インスペクター: オーディオノイズ除去を設定できる', async ({ page }) => {
  await goOnboarded(page)
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

test('インスペクター: テキストスタイルを保存して適用できる', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)

  await page.getByRole('slider', { name: 'フォントサイズ' }).fill('80')
  await expect(page.getByRole('slider', { name: 'フォントサイズ' })).toHaveValue('80')
  await page.getByRole('button', { name: 'スタイルプリセット' }).click()
  await page.getByLabel('スタイル名').fill('大見出し')
  await page.getByRole('button', { name: 'スタイル保存' }).click()
  await expect(page.getByText('「大見出し」スタイルを保存しました')).toBeVisible()

  await page.getByRole('slider', { name: 'フォントサイズ' }).fill('36')
  await page.getByRole('button', { name: '大見出しを適用' }).click()
  await expect(page.getByText('「大見出し」スタイルを適用しました')).toBeVisible()
  await expect(page.getByRole('slider', { name: 'フォントサイズ' })).toHaveValue('80')
})

test('テキスト: MG 花びら舞プリセットを追加できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: 'Petals of Love MG: 花びら舞' }).click()
  await expect(page.locator('footer').getByText('Petals of Love')).toBeVisible()
})

test('テキスト: テロップ（ケーキカット）プリセットを追加できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: 'Cake Cutting テロップ（ケーキカット）' }).click()
  await expect(page.locator('footer').getByText('Cake Cutting')).toBeVisible()
})

test('プロジェクト設定: ループ再生を切り替えできる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('プロジェクト設定').click()
  const loopCheckbox = page.getByLabel('In/Out点間をループ再生')
  await expect(loopCheckbox).not.toBeChecked()
  await loopCheckbox.check()
  await expect(loopCheckbox).toBeChecked()
  await page.getByRole('dialog', { name: 'プロジェクト設定' }).getByRole('button', { name: '適用', exact: true }).click()
  await page.getByTitle('プロジェクト設定').click()
  await expect(page.getByLabel('In/Out点間をループ再生')).toBeChecked()
})

test('プロジェクト設定: リップル削除を切り替えできる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('プロジェクト設定').click()
  const rippleCheckbox = page.getByLabel('リップル編集（削除・トリム）')
  await expect(rippleCheckbox).toBeChecked()
  await rippleCheckbox.uncheck()
  await expect(rippleCheckbox).not.toBeChecked()
  await page.getByRole('dialog', { name: 'プロジェクト設定' }).getByRole('button', { name: '適用', exact: true }).click()
  await page.getByTitle('プロジェクト設定').click()
  await expect(page.getByLabel('リップル編集（削除・トリム）')).not.toBeChecked()
})

test('テキスト: カテゴリ絞り込みでロワーサードのみ表示する', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('テキスト').click()
  await page.getByRole('group', { name: 'テキストプリセット絞り込み' }).getByRole('button', { name: 'ロワーサード' }).click()
  await expect(page.getByRole('button', { name: 'Taro & Hanako ロワーサード（名前）' })).toBeVisible()
  await page.getByRole('button', { name: 'Taro & Hanako ロワーサード（名前）' }).click()
  await expect(page.locator('footer').getByText('Taro & Hanako')).toBeVisible()
})

test('テキスト: よく使うに登録して絞り込める', async ({ page }) => {
  await goOnboarded(page)
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

test('インスペクター: 画像クリップのメディアを差し替えできる', async ({ page }) => {
  await goOnboarded(page)
  await page.setInputFiles('input[accept*="image"]', [
    { name: 'photo-a.png', mimeType: 'image/png', buffer: TINY_PNG },
    { name: 'photo-b.png', mimeType: 'image/png', buffer: TINY_PNG },
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
  await goOnboarded(page)
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

test('効果: 隣接クリップへトランジションを一括適用できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="image"]', [
    { name: 'batch-a.png', mimeType: 'image/png', buffer: TINY_PNG },
    { name: 'batch-b.png', mimeType: 'image/png', buffer: TINY_PNG },
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

test('色調: ガーデンパーティルックを適用できる', async ({ page }) => {
  await goOnboarded(page)
  await page.setInputFiles('input[accept*="image"]', { name: 'garden-party.png', mimeType: 'image/png', buffer: TINY_PNG })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'garden-party.png')
  await page.getByRole('button', { name: 'ガーデンパーティルック', exact: true }).click()
  await expect(page.getByText('「ガーデンパーティ」ルックを適用しました')).toBeVisible()
  await expect(page.getByRole('button', { name: 'ガーデンパーティルック', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('効果: 全映像トラックからトランジションを一括削除できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="image"]', [
    { name: 'clear-a.png', mimeType: 'image/png', buffer: TINY_PNG },
    { name: 'clear-b.png', mimeType: 'image/png', buffer: TINY_PNG },
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

test('トランジション: フェード to 暖色を画像クリップに適用できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="image"]', [
    { name: 'warm-a.png', mimeType: 'image/png', buffer: TINY_PNG },
    { name: 'warm-b.png', mimeType: 'image/png', buffer: TINY_PNG },
  ])
  await expect(page.getByText('2件のメディアを追加しました')).toBeVisible()
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'warm-a.png' }).click()
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'warm-b.png' }).click()

  await clickTimelineClip(page, 'warm-b.png')
  await page.getByTitle('効果').click()
  await page.getByRole('button', { name: 'フェード to 暖色', exact: true }).click()
  await expect(page.getByText('フェード to 暖色を適用しました')).toBeVisible()
})

test('テキスト: ロワーサードプリセットを追加できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: 'Taro & Hanako ロワーサード（名前）' }).click()
  await expect(page.locator('footer').getByText('Taro & Hanako')).toBeVisible()
})

test('インスペクター: 複数行テキストを入力できる', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)

  const textarea = page.getByRole('textbox', { name: 'テキスト内容' })
  await textarea.fill('新郎\n新婦')
  await expect(textarea).toHaveValue('新郎\n新婦')
  await expect(page.locator('footer').getByText('新郎')).toBeVisible()
})

test('トランジション: フィルムバーンを画像クリップに適用できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="image"]', [
    { name: 'burn-a.png', mimeType: 'image/png', buffer: TINY_PNG },
    { name: 'burn-b.png', mimeType: 'image/png', buffer: TINY_PNG },
  ])
  await expect(page.getByText('2件のメディアを追加しました')).toBeVisible()
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'burn-a.png' }).click()
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'burn-b.png' }).click()

  await clickTimelineClip(page, 'burn-b.png')
  await page.getByTitle('効果').click()
  await page.getByRole('button', { name: 'フィルムバーン', exact: true }).click()
  await expect(page.getByText('フィルムバーンを適用しました')).toBeVisible()
})

test('テキスト: 新規テロップ（入場）を追加できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: '入場 テロップ（入場）' }).click()
  await expect(page.locator('footer').getByText('入場')).toBeVisible()
})

test('インスペクター: テキストの行間と縦配置を設定できる', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)

  await page.getByRole('slider', { name: '行間' }).fill('1.8')
  await expect(page.getByRole('slider', { name: '行間' })).toHaveValue('1.8')

  await page.getByLabel('縦配置').selectOption('top')
  await expect(page.getByLabel('縦配置')).toHaveValue('top')
})

test('トランジション: 花びら舞を画像クリップに適用できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="image"]', [
    { name: 'petal-a.png', mimeType: 'image/png', buffer: TINY_PNG },
    { name: 'petal-b.png', mimeType: 'image/png', buffer: TINY_PNG },
  ])
  await expect(page.getByText('2件のメディアを追加しました')).toBeVisible()
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'petal-a.png' }).click()
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'petal-b.png' }).click()

  await clickTimelineClip(page, 'petal-b.png')
  await page.getByTitle('効果').click()
  await page.getByRole('button', { name: '花びら舞', exact: true }).click()
  await expect(page.getByText('花びら舞を適用しました')).toBeVisible()
})

test('テキスト: ロワーサード（司会）プリセットを追加できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: '司会  山田 太郎 ロワーサード（司会）' }).click()
  await expect(page.locator('footer').getByText('司会  山田 太郎')).toBeVisible()
})

test('インスペクター: テキストに字幕帯を設定できる', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)

  await page.getByRole('checkbox', { name: '字幕帯' }).check()
  await expect(page.getByRole('slider', { name: '背景余白' })).toBeVisible()
  await expect(page.getByRole('slider', { name: '角丸' })).toBeVisible()

  await page.getByRole('slider', { name: '背景余白' }).fill('20')
  await expect(page.getByRole('slider', { name: '背景余白' })).toHaveValue('20')
})

test('トランジション: キャンドルグローを画像クリップに適用できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="image"]', [
    { name: 'candle-a.png', mimeType: 'image/png', buffer: TINY_PNG },
    { name: 'candle-b.png', mimeType: 'image/png', buffer: TINY_PNG },
  ])
  await expect(page.getByText('2件のメディアを追加しました')).toBeVisible()
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'candle-a.png' }).click()
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'candle-b.png' }).click()

  await clickTimelineClip(page, 'candle-b.png')
  await page.getByTitle('効果').click()
  await page.getByRole('button', { name: 'キャンドルグロー', exact: true }).click()
  await expect(page.getByText('キャンドルグローを適用しました')).toBeVisible()
})

test('テキスト: テロップ（指輪交換）プリセットを追加できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: 'Ring Exchange テロップ（指輪交換）' }).click()
  await expect(page.locator('footer').getByText('Ring Exchange')).toBeVisible()
})

test('色調: ロマンティック夕暮れルックを適用できる', async ({ page }) => {
  await goOnboarded(page)
  await page.setInputFiles('input[accept*="image"]', { name: 'sunset.png', mimeType: 'image/png', buffer: TINY_PNG })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'sunset.png')

  await page.getByRole('button', { name: 'ロマンティック夕暮れルック', exact: true }).click()
  await expect(page.getByText('「ロマンティック夕暮れ」ルックを適用しました')).toBeVisible()
  await expect(page.getByRole('button', { name: 'ロマンティック夕暮れルック', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('トランジション: シルクフェードを画像クリップに適用できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="image"]', [
    { name: 'silk-a.png', mimeType: 'image/png', buffer: TINY_PNG },
    { name: 'silk-b.png', mimeType: 'image/png', buffer: TINY_PNG },
  ])
  await expect(page.getByText('2件のメディアを追加しました')).toBeVisible()
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'silk-a.png' }).click()
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'silk-b.png' }).click()

  await clickTimelineClip(page, 'silk-b.png')
  await page.getByTitle('効果').click()
  await page.getByRole('button', { name: 'シルクフェード', exact: true }).click()
  await expect(page.getByText('シルクフェードを適用しました')).toBeVisible()
})

test('テキスト: MG タイトルリビールプリセットを追加できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: 'Our Wedding Story MG: タイトルリビール' }).click()
  await expect(page.locator('footer').getByText('Our Wedding Story')).toBeVisible()
})

test('色調: 桜ピンクルックを適用できる', async ({ page }) => {
  await goOnboarded(page)
  await page.setInputFiles('input[accept*="image"]', { name: 'sakura.png', mimeType: 'image/png', buffer: TINY_PNG })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'sakura.png')

  await page.getByRole('button', { name: '桜ピンクルック', exact: true }).click()
  await expect(page.getByText('「桜ピンク」ルックを適用しました')).toBeVisible()
  await expect(page.getByRole('button', { name: '桜ピンクルック', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('トランジション: パールシマーを画像クリップに適用できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="image"]', [
    { name: 'pearl-a.png', mimeType: 'image/png', buffer: TINY_PNG },
    { name: 'pearl-b.png', mimeType: 'image/png', buffer: TINY_PNG },
  ])
  await expect(page.getByText('2件のメディアを追加しました')).toBeVisible()
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'pearl-a.png' }).click()
  await page.locator('button[title="クリックで再生位置に追加"]').filter({ hasText: 'pearl-b.png' }).click()

  await clickTimelineClip(page, 'pearl-b.png')
  await page.getByTitle('効果').click()
  await page.getByRole('button', { name: 'パールシマー', exact: true }).click()
  await expect(page.getByText('パールシマーを適用しました')).toBeVisible()
})

test('テキスト: MG エレガントネームプリセットを追加できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: 'Taro & Hanako MG: エレガントネーム' }).click()
  await expect(page.locator('footer').getByText('Taro & Hanako')).toBeVisible()
})

test('色調: ブライダルホワイトルックを適用できる', async ({ page }) => {
  await goOnboarded(page)
  await page.setInputFiles('input[accept*="image"]', { name: 'bridal.png', mimeType: 'image/png', buffer: TINY_PNG })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'bridal.png')

  await page.getByRole('button', { name: 'ブライダルホワイトルック', exact: true }).click()
  await expect(page.getByText('「ブライダルホワイト」ルックを適用しました')).toBeVisible()
  await expect(page.getByRole('button', { name: 'ブライダルホワイトルック', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('テキスト: MG スパークル誓いプリセットを追加できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: 'I Do MG: スパークル誓い' }).click()
  await expect(page.locator('footer').getByText('I Do')).toBeVisible()
})

test('テキスト: 新規ロワーサード（スピーチ）を追加できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: 'Speech by ロワーサード（スピーチ）' }).click()
  await expect(page.locator('footer').getByText('Speech by')).toBeVisible()
})

test('テキスト: テロップ（余興）プリセットを追加できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: '余興 テロップ（余興）' }).click()
  await expect(page.locator('footer').getByText('余興')).toBeVisible()
})

test('テキスト: MG ベルの祝福プリセットを追加できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: 'Wedding Bells MG: ベルの祝福' }).click()
  await expect(page.locator('footer').getByText('Wedding Bells')).toBeVisible()
})

test('色調: フィルム風ルックを適用できる', async ({ page }) => {
  await goOnboarded(page)
  await page.setInputFiles('input[accept*="image"]', { name: 'film-photo.png', mimeType: 'image/png', buffer: TINY_PNG })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'film-photo.png')

  await expect(page.getByLabel('カラールックプレビュー')).toBeVisible()
  await page.getByRole('button', { name: 'フィルム風ルック', exact: true }).click()
  await expect(page.getByText('「フィルム風」ルックを適用しました')).toBeVisible()
  await expect(page.getByRole('button', { name: 'フィルム風ルック', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('インスペクター: 同名スタイル保存は上書きする', async ({ page }) => {
  await goOnboarded(page)
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

test('インスペクター: スタイル適用を undo で復元できる', async ({ page }) => {
  await goOnboarded(page)
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
  await clickTimelineClip(page, 'Opening')
  await expect(page.getByRole('slider', { name: 'フォントサイズ' })).toHaveValue('36')
})

test('テキスト: Shift_JIS の SRT をインポートできる', async ({ page }) => {
  await goOnboarded(page)
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

test('色調: HSL の色温度を設定できる', async ({ page }) => {
  await goOnboarded(page)
  await page.setInputFiles('input[accept*="image"]', { name: 'hsl-photo.png', mimeType: 'image/png', buffer: TINY_PNG })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'hsl-photo.png')

  const temperature = page.getByRole('slider', { name: '色温度' })
  await temperature.fill('0.4')
  await expect(temperature).toHaveValue('0.4')
})

test('色調: トーンカーブのミッドトーンを設定できる', async ({ page }) => {
  await goOnboarded(page)
  await page.setInputFiles('input[accept*="image"]', { name: 'tone-photo.png', mimeType: 'image/png', buffer: TINY_PNG })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'tone-photo.png')

  const midtones = page.getByRole('slider', { name: 'ミッドトーン' })
  await midtones.fill('0.3')
  await expect(midtones).toHaveValue('0.3')
})

test('インスペクター: 保存スタイルを削除できる', async ({ page }) => {
  await goOnboarded(page)
  await clearTextStylePresets(page)
  const stats = await loadTextStylePresetStress(page)
  expect(stats.presetCount).toBeGreaterThan(0)

  await addOpeningText(page)
  await page.getByRole('button', { name: 'スタイルプリセット' }).click()
  await page.getByRole('button', { name: `${stats.names[0]}を削除` }).click()
  await expect(page.getByText(`「${stats.names[0]}」スタイルを削除しました`)).toBeVisible()
  await expect(page.getByRole('button', { name: `${stats.names[0]}を適用` })).toHaveCount(0)
})

test('テキスト: MG プリセットをカスタムキーフレームに変換できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: 'Our Wedding Story MG: タイトルリビール' }).click()
  await clickTimelineClip(page, 'Our Wedding Story')

  await page.getByRole('button', { name: 'カスタムキーフレームに変換' }).click()
  await expect(page.getByText('MG アニメをカスタムキーフレームに変換しました')).toBeVisible()

  await page.getByRole('button', { name: 'トランスフォームキーフレーム', exact: true }).click()
  await expect(page.getByText('キーフレーム 1')).toBeVisible()
  await expect(page.getByText('キーフレーム 2')).toBeVisible()
  await expect(page.locator('select').filter({ hasText: 'カスタム（キーフレーム）' })).toBeVisible()
})

test('色調: RGB カーブの R チャンネルを調整できる', async ({ page }) => {
  await goOnboarded(page)
  await page.setInputFiles('input[accept*="image"]', { name: 'rgb-curve-photo.png', mimeType: 'image/png', buffer: TINY_PNG })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'rgb-curve-photo.png')

  const rMid = page.getByRole('slider', { name: 'R カーブ 50%' })
  await rMid.fill('0.7')
  await expect(rMid).toHaveValue('0.7')
  await expect(page.getByLabel('RGB カーブ (R)')).toBeVisible()
})

test('インスペクター: トランスフォームキーフレームを追加・編集できる', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)
  await clickTimelineClip(page, 'Opening')

  await page.getByRole('button', { name: 'トランスフォームキーフレーム', exact: true }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await expect(page.getByText('キーフレーム 1')).toBeVisible()
  await expect(page.getByText('1件', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'トランスフォームキーフレーム 1' })).toBeVisible()
})

test('テキスト: MG カスタムキーフレームのスケールをタイムラインで編集できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: 'Our Wedding Story MG: タイトルリビール' }).click()
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

test('色調: RGB カーブに制御点を追加できる', async ({ page }) => {
  await goOnboarded(page)
  await page.setInputFiles('input[accept*="image"]', { name: 'rgb-bezier-photo.png', mimeType: 'image/png', buffer: TINY_PNG })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'rgb-bezier-photo.png')

  const graph = page.getByLabel('RGB カーブ (R)')
  const box = await graph.boundingBox()
  expect(box).not.toBeNull()
  await graph.dblclick({ position: { x: box!.width * 0.4, y: box!.height * 0.45 } })
  await page.getByRole('button', { name: '制御点を削除' }).click()
  await expect(page.getByRole('button', { name: '制御点を削除' })).toHaveCount(0)
})

test('インスペクター: トランスフォームキーフレームの不透明度を設定できる', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)
  await clickTimelineClip(page, 'Opening')

  await page.getByRole('button', { name: 'トランスフォームキーフレーム', exact: true }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()

  const opacitySliders = page.getByRole('slider', { name: '不透明度' })
  await opacitySliders.nth(1).fill('0.4')
  await expect(opacitySliders.nth(1)).toHaveValue('0.4')
})

test('BGM: ビートマーカーを配置しスナップに使える', async ({ page }) => {
  await goOnboarded(page)
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

test('インスペクター: トランスフォームキーフレームのイージングを設定できる', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)
  await clickTimelineClip(page, 'Opening')

  await page.getByRole('button', { name: 'トランスフォームキーフレーム', exact: true }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()

  await page.getByLabel('補間イージング').selectOption('easeOut')
  await expect(page.getByLabel('補間イージング')).toHaveValue('easeOut')
})

test('インスペクター: トランスフォームキーフレームのスケールを数値入力できる', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)
  await clickTimelineClip(page, 'Opening')

  await page.getByRole('button', { name: 'トランスフォームキーフレーム', exact: true }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()

  await expect(page.getByTestId('transform-kf-graph-editor')).toBeVisible()

  const scaleInput = page.getByRole('spinbutton', { name: 'スケール 数値' })
  await scaleInput.fill('1.8')
  await scaleInput.blur()
  await expect(scaleInput).toHaveValue('1.8')

  await page.getByTestId('transform-graph-property-rotation').click()
  await expect(page.getByTestId('transform-graph-property-rotation')).toHaveAttribute('aria-pressed', 'true')
})

test('調整レイヤー: 追加して色調プリセットを適用できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByRole('button', { name: '調整レイヤーを追加 章全体へ色調を一括適用' }).click()
  await expect(page.getByText('調整レイヤーを追加しました')).toBeVisible()
  await expect(page.locator('footer').getByText('調整レイヤー')).toBeVisible()

  await clickTimelineClip(page, '調整レイヤー')
  await expect(page.getByText('調整レイヤー', { exact: true }).first()).toBeVisible()

  await page.getByRole('button', { name: 'ウエディング暖色ルック', exact: true }).click()
  await expect(page.getByText('「ウエディング暖色」ルックを適用しました')).toBeVisible()
})

test('クリップ分割: トランスフォームキーフレームを両側に再配分する', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)
  await clickTimelineClip(page, 'Opening')

  await page.getByRole('button', { name: 'トランスフォームキーフレーム', exact: true }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()

  const timeSliders = page.getByRole('slider', { name: '位置 (秒)' })
  await timeSliders.nth(1).fill('2')

  await page.locator('main input[type="range"]').fill('2')
  await page.getByRole('button', { name: '分割 (S)' }).click()

  await expect(page.locator('footer').getByText('Opening')).toHaveCount(2)
  await expect(page.getByRole('button', { name: 'トランスフォームキーフレーム 1' })).toHaveCount(2)
})

test('クリップ分割: 音量キーフレームを両側に再配分する', async ({ page }) => {
  await goOnboarded(page)
  const wav = makeSilentWav(2)
  await page.setInputFiles('input[accept*="audio"]', { name: 'bgm-split.wav', mimeType: 'audio/wav', buffer: wav })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()
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

test('クリップ分割: 速度キーフレームを両側に再配分する', async ({ page }) => {
  await goOnboarded(page)
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

test('色調: LUT をインポートして適用できる', async ({ page }) => {
  await goOnboarded(page)
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

  await page.setInputFiles('input[accept*="image"]', { name: 'lut-photo.png', mimeType: 'image/png', buffer: TINY_PNG })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'lut-photo.png')

  await page.setInputFiles('input[accept*=".cube"]', { name: 'wedding-warm.cube', mimeType: 'text/plain', buffer: cube })
  await expect(page.getByText('「wedding-warm」をインポートしました')).toBeVisible()

  await page.getByLabel('LUT', { exact: true }).selectOption({ label: 'wedding-warm (2³)' })
  await expect(page.getByText('「wedding-warm」LUT を適用しました')).toBeVisible()
  await expect(page.getByRole('slider', { name: 'LUT 強度' })).toBeVisible()
  await expect(page.getByLabel('LUTプレビュー')).toBeVisible()
})

test('色調スタック: 調整レイヤー + ルック + LUT を複合適用できる', async ({ page }) => {
  await goOnboarded(page)
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

  await page.setInputFiles('input[accept*="image"]', { name: 'stack-photo.png', mimeType: 'image/png', buffer: TINY_PNG })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()
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

test('タイムライン: レーンをダブルクリックでトランスフォームキーフレームを追加できる', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)
  await clickTimelineClip(page, 'Opening')
  await page.getByTestId('transform-property-lane').dblclick({ position: { x: 40, y: 12 } })
  await expect(page.getByRole('button', { name: 'トランスフォームキーフレーム 1' })).toBeVisible()
})

test('タイムライン: トランスフォームキーフレームをドラッグ編集できる', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)
  await clickTimelineClip(page, 'Opening')

  await page.getByRole('button', { name: 'トランスフォームキーフレーム', exact: true }).click()
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
  await goOnboarded(page)
  await addOpeningText(page)
  await clickTimelineClip(page, 'Opening')

  await page.getByRole('button', { name: 'トランスフォームキーフレーム', exact: true }).click()
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

test('インスペクター: 音量キーフレームを追加・編集できる', async ({ page }) => {
  await goOnboarded(page)
  const wav = makeSilentWav(0.5)
  await page.setInputFiles('input[accept*="audio"]', { name: 'bgm-kf.wav', mimeType: 'audio/wav', buffer: wav })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()

  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'bgm-kf.wav')

  await page.getByRole('button', { name: '音量キーフレーム' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await expect(page.getByText('キーフレーム 1')).toBeVisible()
  await expect(page.getByText('1件', { exact: true })).toBeVisible()
})

test('色調: カラールックプリセットを適用できる', async ({ page }) => {
  await goOnboarded(page)
  await page.setInputFiles('input[accept*="image"]', { name: 'look-photo.png', mimeType: 'image/png', buffer: TINY_PNG })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'look-photo.png')

  await expect(page.getByLabel('カラールックプレビュー')).toBeVisible()
  await expect(page.getByLabel('カラールックプレビュー').locator('canvas')).toBeVisible()
  await page.getByRole('button', { name: 'フィルム風ルック', exact: true }).click()
  await expect(page.getByText('「フィルム風」ルックを適用しました')).toBeVisible()
  await expect(page.getByRole('button', { name: 'フィルム風ルック', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('インスペクター: 速度キーフレームを追加・編集できる', async ({ page }) => {
  await goOnboarded(page)
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

test('タイムライン: 速度キーフレームをドラッグ編集できる', async ({ page }) => {
  await goOnboarded(page)
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

test('タイムライン: トランスフォームキーフレームの全属性を同時表示できる', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)
  await clickTimelineClip(page, 'Opening')

  await page.getByRole('button', { name: 'トランスフォームキーフレーム', exact: true }).click()
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
  await goOnboarded(page)
  await addOpeningText(page)
  await clickTimelineClip(page, 'Opening')

  await page.getByRole('button', { name: 'トランスフォームキーフレーム', exact: true }).click()
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

test('タイムライン: 速度キーフレームのベジェハンドルをドラッグ編集できる', async ({ page }) => {
  await goOnboarded(page)
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
  await goOnboarded(page)
  const wav = makeSilentWav(1)
  await page.setInputFiles('input[accept*="audio"]', { name: 'bgm-drag.wav', mimeType: 'audio/wav', buffer: wav })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'bgm-drag.wav')

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

test('メディア: 検索・種類フィルタ・ソートができる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="video"]', [
    { name: 'zebra.png', mimeType: 'image/png', buffer: TINY_PNG },
    { name: 'alpha-photo.png', mimeType: 'image/png', buffer: TINY_PNG },
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

test('モーダル: 開くと最初の要素にフォーカスし、Escape で閉じる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('プロジェクト一覧').click()
  await expect(page.getByRole('dialog', { name: 'プロジェクト' })).toBeVisible()

  await expect(page.getByRole('button', { name: '+ 新規プロジェクト' })).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'プロジェクト' })).toBeHidden()
})

test('メディア: 該当なし検索で空状態を表示する', async ({ page }) => {
  await goOnboarded(page)
  await loadMediaListStress(page)
  await page.getByTitle('メディア', { exact: true }).click()

  await page.getByLabel('メディア検索').fill('not-found-xyz')
  await expect(page.getByText('該当するメディアがありません')).toBeVisible()
  await expect(page.getByText('0/52件表示')).toBeVisible()
})

test('メディア: 種類フィルタ切替で件数が更新される', async ({ page }) => {
  await goOnboarded(page)
  await loadMediaListStress(page)
  await page.getByTitle('メディア', { exact: true }).click()

  await page.getByLabel('メディア種類').selectOption('image')
  await expect(page.getByText('45/52件表示')).toBeVisible()

  await page.getByLabel('メディア種類').selectOption('video')
  await expect(page.getByText('2/52件表示')).toBeVisible()
  await expect(page.getByText('clip-01.mp4')).toBeVisible()
})

test('メディア: 52件ストレスで検索・フィルタ・ソートが動作する', async ({ page }) => {
  await goOnboarded(page)
  const stats = await loadMediaListStress(page)
  expect(stats.mediaCount).toBe(52)

  await page.getByTitle('メディア', { exact: true }).click()
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

test('インスペクター: 音量正規化を undo で復元できる', async ({ page }) => {
  await goOnboarded(page)
  const stats = await loadAudioNormalizeStress(page)
  await selectClipById(page, stats.bgmClipId)
  await clickTimelineClip(page, stats.bgmClipName)

  const volumeSlider = page.getByRole('slider', { name: '音量' })
  await expect(volumeSlider).toHaveValue('1')

  await page.getByRole('button', { name: '音量を正規化' }).click()
  await expect(page.getByText('音量を正規化しました')).toBeVisible()
  await expect(volumeSlider).toHaveValue('2')

  await page.keyboard.press('ControlOrMeta+z')
  await expect.poll(() => getClipAudioVolume(page, stats.bgmClipId)).toBe(1)
})

test('インスペクター: 音量キーフレーム付きクリップを正規化すると KF も同倍率スケールする', async ({ page }) => {
  await goOnboarded(page)
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
  await goOnboarded(page)
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

test('インスペクター: Google Fonts を 10 種以上から選択できる', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)

  const fontSelect = page.getByLabel('フォント', { exact: true })
  await expect(fontSelect.locator('option')).toHaveCount(12)
  await fontSelect.selectOption('Zen Old Mincho')
  await expect(fontSelect).toHaveValue('Zen Old Mincho')
})

test('トランスフォームキーフレーム: ストレス投入で8キーフレームがロードされる', async ({ page }) => {
  await goOnboarded(page)
  const stats = await loadTransformKeyframeStress(page)
  expect(stats.keyframeCount).toBe(8)
  expect(await getClipTransformKeyframeCount(page, stats.clipId)).toBe(8)
})

test('トランスフォームキーフレーム: ストレス分割で4+4に再配分される', async ({ page }) => {
  await goOnboarded(page)
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
  await goOnboarded(page)
  const stats = await loadTransformKeyframeStress(page)
  const transform = await getInterpolatedTransformAt(page, stats.clipId, stats.midLocalTime)
  expect(transform).not.toBeNull()
  expect(transform!.x).toBeCloseTo(stats.expectedMidX, 3)
  expect(transform!.opacity).toBeCloseTo(stats.expectedMidOpacity, 3)
  expect(transform!.scale).toBeGreaterThan(1)
  expect(transform!.rotation).toBeGreaterThan(0)
})

test('音量キーフレームUI: ストレス投入で6キーフレームがロードされる', async ({ page }) => {
  await goOnboarded(page)
  const stats = await loadVolumeKeyframeTimelineStress(page)
  expect(stats.keyframeCount).toBe(6)
  expect(stats.hasCurvePath).toBe(true)
  expect(await getClipVolumeKeyframeCount(page, stats.clipId)).toBe(6)
})

test('音量キーフレーム: ストレス投入で音声4KF・動画2KFと補間が一致する', async ({ page }) => {
  await goOnboarded(page)
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
  await goOnboarded(page)
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
  await goOnboarded(page)
  const stats = await loadVolumeKeyframeStress(page)
  const before = await getVolumeAtClipLocalTime(page, stats.audioClipId, 0)
  await updateVolumeKeyframeById(page, stats.audioClipId, stats.firstAudioKeyframeId, { volume: 1.9 })
  expect(await getVolumeAtClipLocalTime(page, stats.audioClipId, 0)).toBe(1.9)

  await page.keyboard.press('ControlOrMeta+z')
  expect(await getVolumeAtClipLocalTime(page, stats.audioClipId, 0)).toBeCloseTo(before, 3)
})

test('音量キーフレームUI: ストレス分割で3+3に再配分される', async ({ page }) => {
  await goOnboarded(page)
  const stats = await loadVolumeKeyframeTimelineStress(page)
  await selectClipById(page, stats.clipId)
  await clickTimelineClip(page, stats.clipName)

  await page.locator('main input[type="range"]').fill(String(stats.splitAt))
  await page.getByRole('button', { name: '分割 (S)' }).click()

  const counts = await listAudioClipVolumeKeyframeCounts(page)
  expect(counts).toHaveLength(2)
  expect(counts.map((c) => c.count).sort()).toEqual([3, 3])
})

test('スリップ/スライド: ストレス投入で隣接3クリップとKFがロードされる', async ({ page }) => {
  await goOnboarded(page)
  const stats = await loadSlipSlideStress(page)
  expect(stats.clipCount).toBe(3)
  expect(stats.transformKeyframeCount).toBe(2)
  expect(stats.volumeKeyframeCount).toBe(2)
  expect(await getClipTransformKeyframeTimes(page, stats.selectedClipId)).toEqual(stats.transformKeyframeTimes)
})

test('スリップ/スライド: スリップでsourceStartが変化しKF時刻は維持される', async ({ page }) => {
  await goOnboarded(page)
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
  await goOnboarded(page)
  const stats = await loadSlipSlideStress(page)
  const beforeStart = await getClipStartTime(page, stats.selectedClipId)
  const beforePrevDuration = await getStressClipDuration(page, stats.prevClipId)

  expect(await slideClipById(page, stats.selectedClipId, stats.slideDelta)).toBe(true)
  expect(await getClipStartTime(page, stats.selectedClipId)).toBeCloseTo(stats.selectedStartAfterSlide, 3)
  expect(await getStressClipDuration(page, stats.prevClipId)).toBeCloseTo(stats.prevDurationAfterSlide, 3)

  await page.keyboard.press('ControlOrMeta+z')
  expect(await getClipStartTime(page, stats.selectedClipId)).toBeCloseTo(beforeStart, 3)
  expect(await getStressClipDuration(page, stats.prevClipId)).toBeCloseTo(beforePrevDuration, 3)
})

test('音量キーフレームUI: キーフレーム変更を undo で復元できる', async ({ page }) => {
  await goOnboarded(page)
  const stats = await loadVolumeKeyframeTimelineStress(page)
  const before = await getVolumeAtClipLocalTime(page, stats.clipId, 0)
  await updateVolumeKeyframeById(page, stats.clipId, stats.firstKeyframeId, { volume: 1.8 })
  expect(await getVolumeAtClipLocalTime(page, stats.clipId, 0)).toBe(1.8)

  await page.keyboard.press('ControlOrMeta+z')
  expect(await getVolumeAtClipLocalTime(page, stats.clipId, 0)).toBeCloseTo(before, 3)
})

test('トーンカーブ: ストレス投入でトーン・RGBカーブが有効', async ({ page }) => {
  await goOnboarded(page)
  const stats = await loadToneCurveStress(page)
  expect(stats.toneCurveActive).toBe(true)
  expect(stats.rgbCurvesActive).toBe(true)
  expect(stats.midtones).toBeCloseTo(0.2, 3)
  expect(await getRgbCurveSampleAt(page, stats.clipId, 'r', 0.5)).toBeCloseTo(stats.rgbSampleAtHalf, 3)
  const pixel = await getClipPixelGradeSample(page, stats.clipId)
  expect(pixel.r).toBeGreaterThan(128)
})

test('トーンカーブ: ミッドトーン変更でピクセルグレードが変化する', async ({ page }) => {
  await goOnboarded(page)
  const stats = await loadToneCurveStress(page)
  const before = await getClipPixelGradeSample(page, stats.clipId)
  await applyClipColorMidtones(page, stats.clipId, 0.45)
  expect(await getClipColorMidtones(page, stats.clipId)).toBe(0.45)
  const after = await getClipPixelGradeSample(page, stats.clipId)
  expect(after.r).toBeGreaterThan(before.r)
})

test('トーンカーブ: RGB Rチャンネル変更をundoで復元できる', async ({ page }) => {
  await goOnboarded(page)
  const stats = await loadToneCurveStress(page)
  const beforeSample = await getRgbCurveSampleAt(page, stats.clipId, 'r', 0.5)
  await applyClipRgbCurvePoint(page, stats.clipId, 'r', 2, 0.8)
  expect(await getRgbCurveSampleAt(page, stats.clipId, 'r', 0.5)).toBeCloseTo(0.8, 2)

  await page.keyboard.press('ControlOrMeta+z')
  expect(await getRgbCurveSampleAt(page, stats.clipId, 'r', 0.5)).toBeCloseTo(beforeSample, 2)
})

test('テンプレート: ストレス投入で組み込み4種とユーザー保存が有効', async ({ page }) => {
  await goOnboarded(page)
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
  await goOnboarded(page)
  const stats = await loadTemplateStress(page)
  await applyBuiltinTemplateById(page, 'opening-movie')
  const beforeCount = await getTemplateStressClipCount(page)

  expect(await applyUserTemplateById(page, stats.userTemplateId)).toBe(true)
  expect(await getTemplateStressClipCount(page)).toBe(stats.userClipCount)

  await page.keyboard.press('ControlOrMeta+z')
  expect(await getTemplateStressClipCount(page)).toBe(beforeCount)
})

test('テンプレート: 破損JSONインポートはエラー', async ({ page }) => {
  await goOnboarded(page)
  const result = await tryImportTemplateStressJson(page, '{broken')
  expect(result.ok).toBe(false)
  if (!result.ok) {
    expect(result.error).toContain('JSON')
  }
})

test('構造化ウェディング: ストレス投入で11クリップ・5章マーカーが配置される', async ({ page }) => {
  await goOnboarded(page)
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
  await goOnboarded(page)
  const stats = await loadStructuredWeddingTemplateStress(page)
  expect(stats.totalClipCount).toBe(11)

  await page.keyboard.press('ControlOrMeta+z')
  await expect.poll(() => getProjectClipCount(page)).toBe(0)
  expect(await getChapterMarkerCount(page)).toBe(0)
  expect(await getPhotoGuideClipCount(page)).toBe(0)
})

test('構造化ウェディング: undo 後の再適用で章マーカーと写真ガイドが復元される', async ({ page }) => {
  await goOnboarded(page)
  await loadStructuredWeddingTemplateStress(page)
  await page.keyboard.press('ControlOrMeta+z')
  await expect.poll(() => getProjectClipCount(page)).toBe(0)

  await applyWeddingFullTemplate(page)
  const stats = await getStructuredWeddingTemplateStressStats(page)
  expect(stats.totalClipCount).toBe(11)
  expect(stats.photoGuideCount).toBe(8)
  expect(stats.markerCount).toBe(5)
  expect(stats.chapterLabels).toContain('新郎プロフィール')
  await expect(page.locator('footer').getByText('写真: 新郎 幼少期')).toBeVisible()
})

test('効果: ストレスプロジェクトで全映像トラックから30件一括削除できる', async ({ page }) => {
  await goOnboarded(page)
  await loadBatchTransitionRemovalStress(page)
  await expect.poll(() => countClipsWithTransition(page)).toBe(30)

  await page.getByTitle('効果').click()
  await page.getByLabel('一括削除スコープ').selectOption('all-video-tracks')
  await page.getByRole('button', { name: 'トランジションを一括削除' }).click()
  await expect(page.getByText('30件のクリップからトランジションを一括削除しました')).toBeVisible()
  await expect.poll(() => countClipsWithTransition(page)).toBe(0)
})

test('効果: selected-track スコープで副トラックのみ一括削除できる', async ({ page }) => {
  await goOnboarded(page)
  const stats = await loadBatchTransitionRemovalStress(page)
  await selectClipById(page, stats.firstSecondaryClipId)

  await page.getByTitle('効果').click()
  await page.getByLabel('一括削除スコープ').selectOption('selected-track')
  await page.getByRole('button', { name: 'トランジションを一括削除' }).click()
  await expect(page.getByText('10件のクリップからトランジションを一括削除しました')).toBeVisible()
  await expect.poll(() => countClipsWithTransition(page)).toBe(20)
})

test('効果: 一括削除を undo で復元できる', async ({ page }) => {
  await goOnboarded(page)
  await loadBatchTransitionRemovalStress(page)
  await expect.poll(() => countClipsWithTransition(page)).toBe(30)

  await page.getByTitle('効果').click()
  await page.getByLabel('一括削除スコープ').selectOption('all-video-tracks')
  await page.getByRole('button', { name: 'トランジションを一括削除' }).click()
  await expect.poll(() => countClipsWithTransition(page)).toBe(0)

  await page.keyboard.press('ControlOrMeta+z')
  await expect.poll(() => countClipsWithTransition(page)).toBe(30)
})

test('効果: ストレスプロジェクトで全映像トラックへ一括適用できる', async ({ page }) => {
  await goOnboarded(page)
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
  await goOnboarded(page)
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
  await goOnboarded(page)
  await loadBatchTransitionStress(page)

  await page.getByTitle('効果').click()
  await page.getByLabel('一括適用スコープ').selectOption('all-video-tracks')
  await page.getByLabel('一括トランジション種類').selectOption('crossfade')
  await page.getByRole('button', { name: '隣接クリップへ一括適用' }).click()
  await expect.poll(() => countClipsWithTransition(page)).toBe(30)

  await page.keyboard.press('ControlOrMeta+z')
  await expect.poll(() => countClipsWithTransition(page)).toBe(0)
})

test('色調補正: カラールックプリセットを JSON エクスポート/インポートできる', async ({ page }) => {
  await goOnboarded(page)
  await page.setInputFiles('input[accept*="image"]', { name: 'photo.png', mimeType: 'image/png', buffer: TINY_PNG })
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
  await goOnboarded(page)
  await page.setInputFiles('input[accept*="image"]', { name: 'rgb-look-photo.png', mimeType: 'image/png', buffer: TINY_PNG })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'rgb-look-photo.png')

  const filmButton = page.getByRole('button', { name: 'フィルム風ルック', exact: true })
  await filmButton.click()
  await expect(filmButton).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('slider', { name: 'R カーブ 50%' }).fill('0.7')
  await expect(filmButton).toHaveAttribute('aria-pressed', 'false')
})

test('色調補正: RGB カーブ付きルックを保存して再適用できる', async ({ page }) => {
  await goOnboarded(page)
  await page.setInputFiles('input[accept*="image"]', { name: 'rgb-save-photo.png', mimeType: 'image/png', buffer: TINY_PNG })
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
  await goOnboarded(page)
  await page.setInputFiles('input[accept*="image"]', { name: 'summary-photo.png', mimeType: 'image/png', buffer: TINY_PNG })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'summary-photo.png')

  await page.getByRole('slider', { name: 'ミッドトーン' }).fill('0.2')
  await page.getByRole('slider', { name: 'R カーブ 50%' }).fill('0.65')
  await page.getByLabel('ルックプリセット名').fill('E2ESummaryLook')
  await page.getByRole('button', { name: 'ルック保存' }).click()
  await expect(page.getByText('「E2ESummaryLook」ルックを保存しました')).toBeVisible()
  await expect(page.getByText(/ミッド.*RGBカーブ\(R\)|RGBカーブ\(R\).*ミッド/)).toBeVisible()
})

test('テンプレート: 構造化テンプレートで章マーカーと写真ガイドを配置', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('テンプレ').click()
  await page.getByRole('button', { name: /結婚式フル構成/ }).click()
  await expect(page.getByText('結婚式フル構成テンプレートを適用しました')).toBeVisible()

  await expect(page.locator('[title="オープニング"]')).toBeVisible()
  await expect(page.locator('[title="新郎プロフィール"]')).toBeVisible()
  await expect(page.locator('footer').getByText('写真: 新郎 幼少期')).toBeVisible()
  await expect(page.locator('footer').getByText('Opening')).toBeVisible()
})

test('縦型9:16: ストレス投入で1080×1920と9:16書き出しラベルが設定される', async ({ page }) => {
  await goOnboarded(page)
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
  await goOnboarded(page)
  await loadVertical916PresetStress(page)
  expect(await getProjectWidth(page)).toBe(1080)
  expect(await getProjectHeight(page)).toBe(1920)

  await page.keyboard.press('ControlOrMeta+z')
  expect(await getProjectWidth(page)).toBe(1920)
  expect(await getProjectHeight(page)).toBe(1080)

  const stats = await getVertical916PresetStressStats(page)
  expect(stats.exportButtonLabel).toBe('1080p で書き出し')
})

test('縦型9:16: undo 後の再適用で1080×1920に復元できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('プロジェクト設定').click()
  await page.getByRole('button', { name: /縦型 9:16/ }).click()
  await page.getByRole('dialog', { name: 'プロジェクト設定' }).getByRole('button', { name: 'キャンセル' }).click()
  await expect(page.getByText('1080×1920 · 30fps')).toBeVisible()

  await page.keyboard.press('ControlOrMeta+z')
  await expect(page.getByText('1920×1080 · 30fps')).toBeVisible()

  await page.getByTitle('プロジェクト設定').click()
  await page.getByRole('button', { name: /縦型 9:16/ }).click()
  await page.getByRole('dialog', { name: 'プロジェクト設定' }).getByRole('button', { name: 'キャンセル' }).click()
  await expect(page.getByText('1080×1920 · 30fps')).toBeVisible()

  await addOpeningText(page)
  await page.getByRole('button', { name: '書き出し' }).click()
  await expect(page.getByText('プロジェクト解像度: 1080×1920')).toBeVisible()
  await expect(page.getByRole('button', { name: '9:16 で書き出し' })).toBeVisible()
})

test('書き出し: 正方形プロジェクトはネイティブ解像度で書き出せる', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)
  await page.getByTitle('プロジェクト設定').click()
  await page.getByRole('button', { name: /正方形/ }).click()
  await page.getByRole('button', { name: '適用' }).click()

  await page.getByRole('button', { name: '書き出し' }).click()
  await expect(page.getByText('プロジェクト解像度: 1080×1080')).toBeVisible()
  await expect(page.getByRole('button', { name: '1080×1080 で書き出し' })).toBeVisible()
})

test('書き出し: 縦型9:16プロジェクトはネイティブ解像度で書き出せる', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)
  await page.getByTitle('プロジェクト設定').click()
  await page.getByRole('button', { name: /縦型 9:16/ }).click()
  await page.getByRole('button', { name: '適用' }).click()

  await page.getByRole('button', { name: '書き出し' }).click()
  await expect(page.getByText('プロジェクト解像度: 1080×1920')).toBeVisible()
  await expect(page.getByRole('button', { name: '9:16 で書き出し' })).toBeVisible()
})

test('書き出し整合: ストレス投入で4形式検証・4K状態・720pダウンスケール', async ({ page }) => {
  await goOnboarded(page)
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

test('書き出し整合: 4Kプロジェクトはネイティブ解像度で書き出せる', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)
  await page.getByTitle('プロジェクト設定').click()
  await page.getByRole('button', { name: /4K/ }).click()
  await page.getByRole('dialog', { name: 'プロジェクト設定' }).getByRole('button', { name: 'キャンセル' }).click()
  await expect(page.getByText('3840×2160 · 30fps')).toBeVisible()

  await page.getByRole('button', { name: '書き出し' }).click()
  await expect(page.getByText('プロジェクト解像度: 3840×2160')).toBeVisible()
  await expect(page.getByRole('button', { name: '4K で書き出し' })).toBeVisible()
})

test('書き出し整合: 720pダウンスケール書き出しラベルを確認', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)
  await page.getByTitle('プロジェクト設定').click()
  await page.getByRole('button', { name: /4K/ }).click()
  await page.getByRole('dialog', { name: 'プロジェクト設定' }).getByRole('button', { name: 'キャンセル' }).click()

  await page.getByRole('button', { name: '書き出し' }).click()
  await expect(page.getByRole('button', { name: '720p で書き出し' })).toBeVisible()
  await page.getByRole('button', { name: '解像度 720p' }).click()
  await expect(page.getByText('1280×720').first()).toBeVisible()
})

test('書き出し整合: 適用を undo で1080pに復元できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('プロジェクト設定').click()
  await page.getByRole('button', { name: /4K/ }).click()
  await page.getByRole('dialog', { name: 'プロジェクト設定' }).getByRole('button', { name: 'キャンセル' }).click()
  await expect(page.getByText('3840×2160 · 30fps')).toBeVisible()

  await page.keyboard.press('ControlOrMeta+z')
  await expect(page.getByText('1920×1080 · 30fps')).toBeVisible()

  await addOpeningText(page)
  await page.getByRole('button', { name: '書き出し' }).click()
  await expect(page.getByRole('button', { name: '1080p で書き出し' })).toBeVisible()
  await expect(page.getByRole('button', { name: '720p で書き出し' })).toBeVisible()
})

test('書き出し整合: undo 後の再適用で正方形ネイティブと720pダウンスケール', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('プロジェクト設定').click()
  await page.getByRole('button', { name: /4K/ }).click()
  await page.getByRole('dialog', { name: 'プロジェクト設定' }).getByRole('button', { name: 'キャンセル' }).click()
  await page.keyboard.press('ControlOrMeta+z')
  await expect(page.getByText('1920×1080 · 30fps')).toBeVisible()

  await page.getByTitle('プロジェクト設定').click()
  await page.getByRole('button', { name: /正方形/ }).click()
  await page.getByRole('dialog', { name: 'プロジェクト設定' }).getByRole('button', { name: 'キャンセル' }).click()
  await expect(page.getByText('1080×1080 · 30fps')).toBeVisible()

  await addOpeningText(page)
  await page.getByRole('button', { name: '書き出し' }).click()
  await expect(page.getByText('プロジェクト解像度: 1080×1080')).toBeVisible()
  await expect(page.getByRole('button', { name: '1080×1080 で書き出し' })).toBeVisible()
  await page.getByRole('button', { name: '解像度 720p' }).click()
  await expect(page.getByText('1280×720').first()).toBeVisible()
})

test('書き出しプリセット: ストレス投入で4件保存・UI適用で品質/解像度が反映される', async ({ page }) => {
  await goOnboarded(page)
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
  await goOnboarded(page)
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
  await goOnboarded(page)
  const stats = await loadExportPresetExportStress(page)
  await clearExportPresets(page)
  expect(await getExportPresetCount(page)).toBe(0)

  const names = await importExportPresetJson(page, stats.exportJson)
  expect(names).toHaveLength(stats.presetCount)
  expect(await getExportPresetCount(page)).toBe(stats.presetCount)
})

test('映像フェード: ストレス投入で2クリップ・開始/終端不透明度が整合', async ({ page }) => {
  await goOnboarded(page)
  const stats = await loadVideoFadeStress(page)
  expect(stats.clipCount).toBe(2)
  expect(stats.imageOpacityAtStart).toBe(0)
  expect(stats.imageOpacityAtMid).toBeCloseTo(0.5)
  expect(stats.videoOpacityAtEnd).toBe(0)
  expect(await getMediaVisualOpacityForClip(page, stats.imageClipId, 0)).toBe(0)
  expect(await getMediaVisualOpacityForClip(page, stats.videoClipId, stats.videoFadeIn)).toBeCloseTo(1)
})

test('映像フェード: フェード適用を undo で復元できる', async ({ page }) => {
  await goOnboarded(page)
  const stats = await loadVideoFadeStress(page)
  await applyClipFade(page, stats.imageClipId, 0.2, 0.2)
  expect((await getClipFadeValues(page, stats.imageClipId)).fadeIn).toBe(0.2)

  await page.keyboard.press('ControlOrMeta+z')
  expect((await getClipFadeValues(page, stats.imageClipId)).fadeIn).toBe(stats.imageFadeIn)
  expect((await getClipFadeValues(page, stats.imageClipId)).fadeOut).toBe(stats.imageFadeOut)
  expect(await getMediaVisualOpacityForClip(page, stats.imageClipId, 0)).toBe(0)
})

test('映像フェード: undo 後のフェード再適用で復元される', async ({ page }) => {
  await goOnboarded(page)
  const stats = await loadVideoFadeStress(page)
  await applyClipFade(page, stats.videoClipId, 0, 0)
  await page.keyboard.press('ControlOrMeta+z')

  const applied = await applyClipFade(page, stats.videoClipId, stats.videoFadeIn, stats.videoFadeOut)
  expect(applied.fadeIn).toBe(stats.videoFadeIn)
  expect(applied.fadeOut).toBe(stats.videoFadeOut)
  expect(await getMediaVisualOpacityForClip(page, stats.videoClipId, stats.videoFadeIn)).toBeCloseTo(1)
  expect(await getMediaVisualOpacityForClip(page, stats.videoClipId, 6)).toBe(0)
})

test('書き出しプリセット: 書き出しモーダル適用で In/Outマーカーで範囲復元', async ({ page }) => {
  await goOnboarded(page)
  const stats = await loadExportPresetStress(page)
  await addOpeningText(page)
  await page.getByRole('button', { name: '書き出し' }).click()

  await page.getByRole('button', { name: `${stats.highlightPresetName}を適用` }).click()
  await expect(page.getByText(`「${stats.highlightPresetName}」プリセットを適用しました`)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByText('IN 2.0')).toBeVisible()
  await expect(page.getByText('OUT 10.0')).toBeVisible()

  await page.getByRole('button', { name: '書き出し' }).click()
  await page.getByRole('button', { name: '標準全体を適用' }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByText('IN 2.0')).toBeHidden()

  await page.getByRole('button', { name: '書き出し' }).click()
  await page.getByRole('button', { name: `${stats.highlightPresetName}を適用` }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByText('IN 2.0')).toBeVisible()
  await expect(page.getByText('OUT 10.0')).toBeVisible()
})

test('写真ガイド: 選択区間にスライドショーを配置できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="image"]', [
    { name: 'guide-a.png', mimeType: 'image/png', buffer: TINY_PNG },
    { name: 'guide-b.png', mimeType: 'image/png', buffer: TINY_PNG },
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

test('写真ガイド: ストレス投入で8ガイド・8写真クリップが配置される', async ({ page }) => {
  await goOnboarded(page)
  const stats = await loadPhotoGuideSlideshowStress(page)
  expect(stats.guideCount).toBe(8)
  expect(stats.guideClipIds).toHaveLength(8)
  expect(stats.imageCount).toBe(52)
  expect(await getPhotoGuideClipCount(page)).toBe(8)
  await expect(page.locator('footer').getByText('写真: 新郎 幼少期')).toBeVisible()
  await expect(page.locator('footer').getByText('写真: 思い出の写真')).toBeVisible()
})

test('写真ガイド: スライドショー適用を undo で復元できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('テンプレ').click()
  await page.getByRole('button', { name: /結婚式フル構成/ }).click()
  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="image"]', { name: 'undo-guide.png', mimeType: 'image/png', buffer: TINY_PNG })
  await clickTimelineClip(page, '写真: 新郎 幼少期')
  await page.getByRole('button', { name: 'ガイド区間にスライドショーを配置' }).click()
  await expect(page.getByText('1枚の写真をガイド区間に配置しました')).toBeVisible()
  await expect(page.locator('footer').getByText('写真: 新郎 幼少期')).toBeHidden()

  await page.keyboard.press('ControlOrMeta+z')
  await expect(page.locator('footer').getByText('写真: 新郎 幼少期')).toBeVisible()
  await expect(page.locator('footer').getByText('undo-guide.png')).toBeHidden()
})

test('写真ガイド: 52 枚を1区間に配置できる', async ({ page }) => {
  await goOnboarded(page)
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
  await goOnboarded(page)
  await applyWeddingFullTemplate(page)
  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="image"]', [
    { name: 'multi-a.png', mimeType: 'image/png', buffer: TINY_PNG },
    { name: 'multi-b.png', mimeType: 'image/png', buffer: TINY_PNG },
    { name: 'multi-c.png', mimeType: 'image/png', buffer: TINY_PNG },
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

test('書き出し: 先頭章・末尾章の In/Out 境界', async ({ page }) => {
  await goOnboarded(page)
  await applyWeddingFullTemplate(page)
  await page.getByRole('button', { name: '書き出し' }).click()

  await page.getByRole('button', { name: '章「オープニング」を In/Out に設定' }).click()
  await expect(page.getByText('書き出し範囲: 0.0–20.0s')).toBeVisible()

  await page.getByRole('button', { name: '章「エンディング」を In/Out に設定' }).click()
  await expect(page.getByText(/書き出し範囲: 110\.0–/)).toBeVisible()
})

test('書き出し: 大容量プロジェクトで章 ZIP UI（6 章・50+ クリップ）', async ({ page }) => {
  await goOnboarded(page)
  const stats = await loadChapterExportStressProject(page)
  expect(stats.totalClips).toBeGreaterThanOrEqual(50)
  expect(stats.chapterCount).toBeGreaterThanOrEqual(6)

  await page.getByRole('button', { name: '書き出し' }).click()
  await expect(page.getByRole('button', { name: '全章を ZIP で書き出し' })).toBeVisible()
  await expect(page.getByText('6 章を個別 MP4 化して ZIP にまとめます')).toBeVisible()
  await expect(page.getByRole('button', { name: /章「オープニング」を In\/Out に設定/ })).toBeVisible()
})

test('書き出し: 章 In/Out 範囲の書き出しをキャンセルできる', async ({ page }) => {
  test.setTimeout(120_000)

  await goOnboarded(page)
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

  await goOnboarded(page)
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

test('書き出し: 章 ZIP 一括をキャンセルできる', async ({ page }) => {
  test.setTimeout(120_000)

  await goOnboarded(page)
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

  await goOnboarded(page)
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
  await goOnboarded(page)
  await applyWeddingFullTemplate(page)

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
  await goOnboarded(page)
  await loadMarkerEditStress(page)

  const marker = page.locator('[title="新郎プロフィール"]')
  await marker.click()
  const labelInput = page.getByRole('textbox', { name: 'マーカーラベル' })
  await labelInput.fill('新郎パート改')
  await expect(labelInput).toHaveValue('新郎パート改')

  await page.keyboard.press('ControlOrMeta+z')
  await expect(labelInput).toHaveValue('新郎プロフィール')
})

test('マーカー: インスペクターから削除できる', async ({ page }) => {
  await goOnboarded(page)
  await loadMarkerEditStress(page)

  const marker = page.locator('[title="エンディング"]')
  await marker.click()
  await expect(page.locator('aside').getByText('章マーカー', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'マーカーを削除' }).click()
  await expect(marker).toHaveCount(0)
  await expect(page.locator('aside').getByText('章マーカー', { exact: true })).toHaveCount(0)
})

test('マーカー: 境界時刻の編集と再生位置へ移動', async ({ page }) => {
  await goOnboarded(page)
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

  await goOnboarded(page)
  const hasWebCodecs = await page.evaluate(
    () => typeof VideoEncoder !== 'undefined' && typeof AudioEncoder !== 'undefined',
  )
  test.skip(!hasWebCodecs, 'WebCodecs 自体が存在しない環境のためスキップ')

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

  await goOnboarded(page)
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
  await goOnboarded(page)
  await addOpeningText(page)

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

  await page.keyboard.press('ControlOrMeta+z')
  await expect(page.locator('footer').getByText('Opening')).toBeHidden()
})

test('ショートカット: J/K/L で戻る・停止・再生', async ({ page }) => {
  await goOnboarded(page)
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

test('プレビュー: 1フレーム進むボタンで再生ヘッドが進む', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)
  await page.keyboard.press('Escape')

  const transport = page.locator('main input[type="range"]').first()
  const before = parseFloat(await transport.inputValue())
  await page.getByRole('button', { name: '1フレーム進む' }).click()
  await expect.poll(async () => parseFloat(await transport.inputValue())).toBeGreaterThan(before)
})

test('プレビュー: 1フレーム戻るボタンで再生ヘッドが戻る', async ({ page }) => {
  await goOnboarded(page)
  await addOpeningText(page)
  await page.keyboard.press('Escape')

  const transport = page.locator('main input[type="range"]').first()
  await transport.fill('2')
  const before = parseFloat(await transport.inputValue())
  expect(before).toBeGreaterThan(0)

  await page.getByRole('button', { name: '1フレーム戻る' }).click()
  await expect.poll(async () => parseFloat(await transport.inputValue())).toBeLessThan(before)
})

test('ショートカット: スライド編集で隣接クリップが連動', async ({ page }) => {
  await goOnboarded(page)
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
  await goOnboarded(page)
  const webm = await makeTinyWebmVideo(page)
  await page.setInputFiles('input[accept*="video"]', { name: 'slip.webm', mimeType: 'video/webm', buffer: webm })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'slip.webm')

  await page.keyboard.press('Shift+.')
  await expect(page.locator('footer').getByText('slip.webm')).toBeVisible()
})

test('タイムライン: リップルトリムで後続クリップが連動', async ({ page }) => {
  await goOnboarded(page)
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

test('自動保存: 編集後にインジケータが表示される', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: /Opening/ }).first().click()
  await expect(page.locator('footer').getByText('Opening')).toBeVisible()

  await expect(page.getByLabel(/自動保存:/)).toBeVisible({ timeout: 8_000 })
})

test('タイムラインズーム: 選択クリップへズームとフィット', async ({ page }) => {
  await goOnboarded(page)
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

test('写真ガイド: 配置後に undo でガイドが復元される', async ({ page }) => {
  await goOnboarded(page)
  await applyWeddingFullTemplate(page)
  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="image"]', { name: 'undo-guide.png', mimeType: 'image/png', buffer: TINY_PNG })
  await clickTimelineClip(page, '写真: 新郎 幼少期')
  await page.getByRole('button', { name: 'ガイド区間にスライドショーを配置' }).click()
  await expect(page.getByText('1枚の写真をガイド区間に配置しました')).toBeVisible()
  await expect(page.locator('footer').getByText('写真: 新郎 幼少期')).toBeHidden()

  await page.keyboard.press('ControlOrMeta+z')
  await expect(page.locator('footer').getByText('写真: 新郎 幼少期')).toBeVisible()
  await expect(page.locator('footer').getByText('undo-guide.png')).toBeHidden()
})

test('ユーザーテンプレート: 適用を undo で復元できる', async ({ page }) => {
  await goOnboarded(page)
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

  await page.keyboard.press('ControlOrMeta+z')
  await expect.poll(() => getProjectClipCount(page)).toBe(0)
})

test('プロジェクト設定: プリセットを保存して適用できる', async ({ page }) => {
  await goOnboarded(page)
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

test('メディア: 複数ファイル取り込みで進捗表示が使われる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="video"]', [
    { name: 'import-a.png', mimeType: 'image/png', buffer: TINY_PNG },
    { name: 'import-b.png', mimeType: 'image/png', buffer: TINY_PNG },
    { name: 'import-c.png', mimeType: 'image/png', buffer: TINY_PNG },
  ])

  await expect(page.getByText('3件のメディアを追加しました')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('import-a.png')).toBeVisible()
  await expect(page.getByText('import-b.png')).toBeVisible()
  await expect(page.getByText('import-c.png')).toBeVisible()
})

test('プロジェクト設定: プリセットを JSON エクスポート/インポートできる', async ({ page }) => {
  await goOnboarded(page)
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

test('ユーザーテンプレート: 保存済みテンプレートを削除できる', async ({ page }) => {
  await goOnboarded(page)
  const stats = await loadUserProjectTemplateStress(page)
  expect(await getUserProjectTemplateCount(page)).toBe(1)

  await page.getByTitle('テンプレ').click()
  await page.getByRole('button', { name: `${stats.templateLabel}を削除` }).click()
  await expect(page.getByText(`「${stats.templateLabel}」テンプレートを削除しました`)).toBeVisible()
  await expect(page.getByText('保存済みテンプレートはありません')).toBeVisible()
  expect(await getUserProjectTemplateCount(page)).toBe(0)
})

test('テキスト: 長文 SRT をインポートして再エクスポートできる', async ({ page }) => {
  await goOnboarded(page)
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
  const downloadPath = await download.path()
  expect(downloadPath).toBeTruthy()
  const exported = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of exported!) {
    chunks.push(Buffer.from(chunk))
  }
  const content = Buffer.concat(chunks).toString('utf-8')
  expect(content).toContain('00:00:01,000 --> 00:00:06,500')
  expect(content).toContain('本日はお越しいただき')
})

test('ユーザーテンプレート: ストレス投入から新規作成できる', async ({ page }) => {
  await goOnboarded(page)
  const stats = await loadUserProjectTemplateStress(page)

  await page.getByTitle('プロジェクト一覧').click()
  await page.getByRole('button', { name: `${stats.templateLabel}で新規作成` }).click()
  await expect(page.getByText(`「${stats.templateLabel}」で新規プロジェクトを作成しました`)).toBeVisible()
  await expect.poll(() => getProjectClipCount(page)).toBe(stats.clipCount)
  await expect(page.locator('footer').getByText('Opening')).toBeVisible()
})

test('プロジェクト設定: 破損 JSON のインポートはエラー表示する', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('プロジェクト設定').click()
  await page.getByLabel('プロジェクト設定プリセットファイルをインポート').setInputFiles({
    name: 'broken.fable-project-preset.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{not-valid-json', 'utf-8'),
  })
  await expect(page.getByText('JSON の読み込みに失敗しました')).toBeVisible()
})

test('メディア: マイク拒否時に案内と再試行を表示する', async ({ page }) => {
  await installNarrationPermissionDeniedMock(page)
  await goOnboarded(page)

  await page.getByTitle('メディア').click()
  await page.getByRole('button', { name: '録音開始' }).click()
  await expect(page.getByRole('alert')).toContainText('マイクの使用が許可されていません')
  await expect(page.getByRole('button', { name: '再試行' })).toBeVisible()
  await page.getByRole('button', { name: '権限の確認方法' }).click()
  await expect(page.getByRole('dialog', { name: 'マイク権限の確認方法' })).toBeVisible()
})

test('メディア: マイク未検出時に案内と再試行を表示する', async ({ page }) => {
  await installNarrationNoDeviceMock(page)
  await goOnboarded(page)

  await page.getByTitle('メディア').click()
  await page.getByRole('button', { name: '録音開始' }).click()
  await expect(page.getByRole('alert')).toContainText('マイクが見つかりません')
  await expect(page.getByRole('button', { name: '再試行' })).toBeVisible()
  await expect(page.getByRole('button', { name: '権限の確認方法' })).toBeVisible()
})

test('メディア: 空の録音データはエラー表示する', async ({ page }) => {
  await installNarrationEmptyRecordingMock(page)
  await goOnboarded(page)

  await page.getByTitle('メディア').click()
  await page.getByRole('button', { name: '録音開始' }).click()
  await page.getByRole('button', { name: '停止' }).click()
  await expect(page.getByRole('alert')).toContainText('録音データが空です')
  await expect(page.getByRole('button', { name: '録音開始' })).toBeVisible()
})

test('メディア: ナレーション配置を undo でクリップから除去できる', async ({ page }) => {
  await installNarrationRecordingMocks(page)
  await goOnboarded(page)

  await page.getByTitle('メディア').click()
  await page.getByRole('button', { name: '録音開始' }).click()
  await expect(page.getByText(/録音中 0:0[1-9]/)).toBeVisible({ timeout: 3000 })
  await page.getByRole('button', { name: '停止' }).click()
  await page.getByRole('button', { name: 'タイムラインに配置' }).click()
  await expect(page.getByText('ナレーションをタイムラインに配置しました')).toBeVisible()
  await expect(page.locator('footer').getByText(/^narration-/)).toBeVisible()

  await page.keyboard.press('ControlOrMeta+z')
  await expect(page.locator('footer').getByText(/^narration-/)).toHaveCount(0)
})

test('メディア: 動画をインポートして UI が応答し続ける', async ({ page }) => {
  await goOnboarded(page)
  const webm = await makeTinyWebmVideo(page)

  await page.getByTitle('メディア').click()
  await page.setInputFiles('input[accept*="video"]', {
    name: 'sample-clip.webm',
    mimeType: 'video/webm',
    buffer: webm,
  })

  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('sample-clip.webm')).toBeVisible()

  await page.keyboard.press('?')
  await expect(page.getByRole('dialog', { name: 'キーボードショートカット' })).toBeVisible()
  await page.keyboard.press('Escape')

  await expect(page.getByText(/video ·/)).toBeVisible()
})

test('ユーザーテンプレート: 破損 JSON のインポートはエラー表示する', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('テンプレ').click()
  await page.getByLabel('テンプレートファイルをインポート').setInputFiles({
    name: 'broken.fable-template.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{not-valid-json', 'utf-8'),
  })
  await expect(page.getByText('テンプレートファイルの JSON が読み取れません')).toBeVisible()
})

test('ユーザーテンプレート: エクスポートとインポート', async ({ page }) => {
  await goOnboarded(page)
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

test('インスペクター: 画像クリップを動画メディアへ差し替えできる', async ({ page }) => {
  await goOnboarded(page)
  const webm = await makeTinyWebmVideo(page)

  await page.setInputFiles('input[accept*="video"]', [
    { name: 'photo.png', mimeType: 'image/png', buffer: TINY_PNG },
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
  await goOnboarded(page)
  const webm = await makeTinyWebmVideo(page)

  await page.setInputFiles('input[accept*="video"]', [
    { name: 'clip.webm', mimeType: 'video/webm', buffer: webm },
    { name: 'still.png', mimeType: 'image/png', buffer: TINY_PNG },
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

test('ユーザーテンプレート: 同名テンプレートの再インポートでラベルが重複回避される', async ({ page }) => {
  await goOnboarded(page)
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

test('インスペクター: 画像クリップのメディア差し替えを undo できる', async ({ page }) => {
  await goOnboarded(page)

  await page.setInputFiles('input[accept*="image"]', [
    { name: 'undo-a.png', mimeType: 'image/png', buffer: TINY_PNG },
    { name: 'undo-b.png', mimeType: 'image/png', buffer: TINY_PNG },
  ])
  await expect(page.getByText('2件のメディアを追加しました')).toBeVisible()

  await page.getByTitle('クリックで再生位置に追加').first().click()
  await clickTimelineClip(page, 'undo-a.png')

  await page.getByRole('button', { name: 'メディア' }).click()
  await page.getByRole('button', { name: 'undo-b.png に差し替え' }).click()
  await expect(page.getByText('「undo-b.png」に差し替えました')).toBeVisible()
  await expect(page.locator('footer').getByText('undo-b.png')).toBeVisible()

  await page.keyboard.press('ControlOrMeta+z')
  await expect(page.locator('footer').getByText('undo-a.png')).toBeVisible()
  await expect(page.locator('footer').getByText('undo-b.png')).toBeHidden()
})

test('インスペクター: 動画差し替え後も音量設定を維持する', async ({ page }) => {
  await goOnboarded(page)
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
  await goOnboarded(page)
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

test('ユーザーテンプレート: ストレス JSON のエクスポート往復で新規作成できる', async ({ page }) => {
  await goOnboarded(page)
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

test('プロジェクト設定: 同名プリセットの再インポートで名前が重複回避される', async ({ page }) => {
  await goOnboarded(page)
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
  await goOnboarded(page)
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

test('縦型9:16: undo 後の再適用で縦型解像度と書き出しラベルが復元される', async ({ page }) => {
  await goOnboarded(page)
  await loadVertical916PresetStress(page)
  await page.keyboard.press('ControlOrMeta+z')
  expect(await getProjectWidth(page)).toBe(1920)

  const stats = await applyVertical916Preset(page)
  expect(stats.width).toBe(1080)
  expect(stats.height).toBe(1920)
  expect(stats.exportButtonLabel).toBe('9:16 で書き出し')

  await addOpeningText(page)
  await page.getByRole('button', { name: '書き出し' }).click()
  await expect(page.getByRole('button', { name: '9:16 で書き出し' })).toBeVisible()
})

test('書き出し: 章マーカー一括書き出し UI が表示される', async ({ page }) => {
  await goOnboarded(page)
  await applyWeddingFullTemplate(page)

  await page.getByRole('button', { name: '書き出し' }).click()
  await expect(page.getByRole('button', { name: '全章を ZIP で書き出し' })).toBeVisible()
  await expect(page.getByText('5 章を個別 MP4 化して ZIP にまとめます')).toBeVisible()
  await expect(page.getByRole('button', { name: '全章を ZIP で書き出し' })).toContainText('5 章')
})

test('婚礼ゴールデンパス: テンプレ→写真→動画→テロップ→ルック→トランジション→章書き出し→再生停止', async ({ page }) => {
  test.setTimeout(180_000)
  await goOnboarded(page)

  const webm = await makeTinyWebmVideo(page)

  await applyWeddingFullTemplate(page)
  await expect(page.locator('footer').getByText('写真: 新郎 幼少期')).toBeVisible()

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

  await page.setInputFiles('input[accept*="video"]', { name: 'golden-highlight.webm', mimeType: 'video/webm', buffer: webm })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible({ timeout: 15_000 })
  await page.locator('div.group.relative').filter({ hasText: 'golden-highlight.webm' }).getByTitle('クリックで再生位置に追加').click()
  await expect(page.locator('footer').getByText('golden-highlight.webm')).toBeVisible()

  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: /乾杯/ }).first().click()
  await expect(page.locator('footer').getByText('乾杯')).toBeVisible()

  await clickTimelineClip(page, 'golden-a.png')
  await page.getByRole('button', { name: 'ウエディング暖色ルック', exact: true }).click()
  await expect(page.getByText('「ウエディング暖色」ルックを適用しました')).toBeVisible()

  await timelineClip(page, 'golden-a.png').click()
  await page.getByTitle('効果').click()
  await page.getByRole('button', { name: 'クロスフェード', exact: true }).click()
  await expect(page.getByText('クロスフェードを適用しました')).toBeVisible()

  await page.getByRole('button', { name: '書き出し' }).click()
  await page.getByRole('button', { name: '章「新郎プロフィール」を In/Out に設定' }).click()
  await expect(page.getByText('書き出し範囲: 20.0–50.0s')).toBeVisible()
  await expect(page.getByRole('button', { name: '全章を ZIP で書き出し' })).toBeVisible()

  await page.keyboard.press('Escape')

  await clickTimelineClip(page, 'golden-highlight.webm')
  await assertPlaybackStops(page)

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

test('トランジション: 画像クリップへの適用フロー', async ({ page }) => {
  await goOnboarded(page)
  await page.setInputFiles('input[accept*="image"]', { name: 'photo.png', mimeType: 'image/png', buffer: TINY_PNG })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()

  await page.getByTitle('クリックで再生位置に追加').click()
  const clip = timelineClip(page, 'photo.png')
  await expect(clip).toBeVisible()

  await clip.click()
  await page.getByTitle('効果').click()
  await page.getByRole('button', { name: 'クロスフェード', exact: true }).click()
  await expect(page.getByText('クロスフェードを適用しました')).toBeVisible()
})

test('プレビュー: 動画クリップを配置して再生・停止できる', async ({ page }) => {
  await goOnboarded(page)
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

test('効果タブ: 調整レイヤーを追加できる', async ({ page }) => {
  await goOnboarded(page)
  await page.getByTitle('効果').click()
  await page.getByRole('button', { name: '調整レイヤーを追加', exact: true }).click()
  await expect(page.getByText('調整レイヤーを追加しました')).toBeVisible()
  await expect(page.locator('footer').getByText('調整レイヤー')).toBeVisible()
})

test('色調補正: カラールックプリセットを適用できる', async ({ page }) => {
  await goOnboarded(page)
  await page.setInputFiles('input[accept*="image"]', { name: 'photo.png', mimeType: 'image/png', buffer: TINY_PNG })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'photo.png')

  await expect(page.getByLabel('カラールックプレビュー')).toBeVisible()
  await expect(page.getByLabel('カラールックプレビュー').locator('canvas')).toBeVisible()
  await page.getByRole('button', { name: 'フィルム風ルック', exact: true }).click()
  await expect(page.getByText('「フィルム風」ルックを適用しました')).toBeVisible()
  await expect(page.getByRole('button', { name: 'フィルム風ルック', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('映像フェード: 適用を undo で復元できる', async ({ page }) => {
  await goOnboarded(page)
  const stats = await loadVideoFadeStress(page)
  await applyClipFade(page, stats.imageClipId, 0.2, 0.2)
  expect((await getClipFadeValues(page, stats.imageClipId)).fadeIn).toBe(0.2)

  await page.keyboard.press('ControlOrMeta+z')
  expect((await getClipFadeValues(page, stats.imageClipId)).fadeIn).toBe(stats.imageFadeIn)
  expect((await getClipFadeValues(page, stats.imageClipId)).fadeOut).toBe(stats.imageFadeOut)
  expect(await getMediaVisualOpacityForClip(page, stats.imageClipId, 0)).toBe(0)
})

test('映像フェード: undo 後の再適用でフェードが復元される', async ({ page }) => {
  await goOnboarded(page)
  const stats = await loadVideoFadeStress(page)
  await applyClipFade(page, stats.videoClipId, 0, 0)
  await page.keyboard.press('ControlOrMeta+z')

  const applied = await applyClipFade(page, stats.videoClipId, stats.videoFadeIn, stats.videoFadeOut)
  expect(applied.fadeIn).toBe(stats.videoFadeIn)
  expect(applied.fadeOut).toBe(stats.videoFadeOut)
  expect(await getMediaVisualOpacityForClip(page, stats.videoClipId, stats.videoFadeIn)).toBeCloseTo(1)
  expect(await getMediaVisualOpacityForClip(page, stats.videoClipId, 6)).toBe(0)
})

test('色調補正: ウエディング暖色ルックを適用できる', async ({ page }) => {
  await goOnboarded(page)
  await page.setInputFiles('input[accept*="image"]', { name: 'photo.png', mimeType: 'image/png', buffer: TINY_PNG })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'photo.png')

  await page.getByRole('button', { name: 'ウエディング暖色ルック', exact: true }).click()
  await expect(page.getByText('「ウエディング暖色」ルックを適用しました')).toBeVisible()
})

test('色調補正: ロマンティック夕暮れルックを適用できる', async ({ page }) => {
  await goOnboarded(page)
  await page.setInputFiles('input[accept*="image"]', { name: 'sunset.png', mimeType: 'image/png', buffer: TINY_PNG })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'sunset.png')

  await page.getByRole('button', { name: 'ロマンティック夕暮れルック', exact: true }).click()
  await expect(page.getByText('「ロマンティック夕暮れ」ルックを適用しました')).toBeVisible()
  await expect(page.getByRole('button', { name: 'ロマンティック夕暮れルック', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('色調補正: 桜ピンクルックを適用できる', async ({ page }) => {
  await goOnboarded(page)
  await page.setInputFiles('input[accept*="image"]', { name: 'sakura.png', mimeType: 'image/png', buffer: TINY_PNG })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'sakura.png')

  await page.getByRole('button', { name: '桜ピンクルック', exact: true }).click()
  await expect(page.getByText('「桜ピンク」ルックを適用しました')).toBeVisible()
  await expect(page.getByRole('button', { name: '桜ピンクルック', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('色調補正: ブライダルホワイトルックを適用できる', async ({ page }) => {
  await goOnboarded(page)
  await page.setInputFiles('input[accept*="image"]', { name: 'bridal.png', mimeType: 'image/png', buffer: TINY_PNG })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'bridal.png')

  await page.getByRole('button', { name: 'ブライダルホワイトルック', exact: true }).click()
  await expect(page.getByText('「ブライダルホワイト」ルックを適用しました')).toBeVisible()
  await expect(page.getByRole('button', { name: 'ブライダルホワイトルック', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('色調補正: ガーデンパーティルックを適用できる', async ({ page }) => {
  await goOnboarded(page)
  await page.setInputFiles('input[accept*="image"]', { name: 'garden-party.png', mimeType: 'image/png', buffer: TINY_PNG })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'garden-party.png')

  await page.getByRole('button', { name: 'ガーデンパーティルック', exact: true }).click()
  await expect(page.getByText('「ガーデンパーティ」ルックを適用しました')).toBeVisible()
  await expect(page.getByRole('button', { name: 'ガーデンパーティルック', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('色調補正: LUT をインポートして適用できる', async ({ page }) => {
  await goOnboarded(page)
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

  await page.setInputFiles('input[accept*="image"]', { name: 'lut-photo.png', mimeType: 'image/png', buffer: TINY_PNG })
  await page.getByTitle('クリックで再生位置に追加').click()
  await clickTimelineClip(page, 'lut-photo.png')

  await page.setInputFiles('input[accept*=".cube"]', { name: 'wedding-warm.cube', mimeType: 'text/plain', buffer: cube })
  await expect(page.getByText('「wedding-warm」をインポートしました')).toBeVisible()

  await page.getByLabel('LUT', { exact: true }).selectOption({ label: 'wedding-warm (2³)' })
  await expect(page.getByText('「wedding-warm」LUT を適用しました')).toBeVisible()
  await expect(page.getByRole('slider', { name: 'LUT 強度' })).toBeVisible()
  await expect(page.getByLabel('LUTプレビュー')).toBeVisible()
})
