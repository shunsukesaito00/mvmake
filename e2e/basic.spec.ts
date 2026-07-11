import { test, expect, type Page } from '@playwright/test'
import {
  TINY_PNG,
  applyWeddingFullTemplate,
  assertPlaybackStops,
  clickTimelineClip,
  makeSilentWav,
  makeTinyWebmVideo,
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
