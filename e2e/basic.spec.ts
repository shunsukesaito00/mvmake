import { test, expect, type Page } from '@playwright/test'
import { Buffer } from 'node:buffer'
import {
  TINY_PNG,
  applyWeddingFullTemplate,
  assertPlaybackStops,
  clickTimelineClip,
  clearTextStylePresets,
  installNarrationRecordingMocks,
  loadTextStylePresetStress,
  makeSilentWav,
  makeTinyWebmVideo,
  makeWavWithPeak,
  timelineClip,
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
