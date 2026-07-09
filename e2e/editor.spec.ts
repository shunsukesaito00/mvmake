import { test, expect } from '@playwright/test'
import { installNarrationRecordingMocks, makeSilentWav, makeTinyWebmVideo } from './helpers'

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

test('インスペクター: 未選択時のクイックスタートからテキストを追加できる', async ({ page }) => {
  await page.getByTitle('プロジェクト一覧').click()
  await page.getByRole('button', { name: '+ 新規プロジェクト' }).click()
  await expect(page.getByText('新規プロジェクトを作成しました')).toBeVisible()
  await expect(page.locator('footer').getByText('Opening')).toBeHidden()

  await expect(page.getByText('クイックスタート')).toBeVisible()
  await page.getByRole('button', { name: 'テキストを追加' }).click()
  await expect(page.locator('footer').getByText('Opening')).toBeVisible()
})

test('インスペクター: 音量キーフレームを追加・編集できる', async ({ page }) => {
  const wav = makeSilentWav(0.5)
  await page.setInputFiles('input[accept*="audio"]', { name: 'bgm.wav', mimeType: 'audio/wav', buffer: wav })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()

  await page.getByTitle('クリックで再生位置に追加').click()
  await page.locator('footer').getByText('bgm.wav').click()

  await page.getByRole('button', { name: '音量キーフレーム' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await expect(page.getByText('キーフレーム 1')).toBeVisible()
  await expect(page.getByText('1件', { exact: true })).toBeVisible()
})

test('タイムライン: 音量キーフレームをドラッグ編集できる', async ({ page }) => {
  const wav = makeSilentWav(1)
  await page.setInputFiles('input[accept*="audio"]', { name: 'bgm.wav', mimeType: 'audio/wav', buffer: wav })
  await page.getByTitle('クリックで再生位置に追加').click()
  await page.locator('footer').getByText('bgm.wav').click()

  await page.getByRole('button', { name: '音量キーフレーム' }).click()
  await page.getByRole('button', { name: 'キーフレームを追加' }).click()
  await page.getByRole('slider', { name: '位置 (秒)' }).fill('0.2')

  const handle = page.getByRole('button', { name: '音量キーフレーム 1' })
  await expect(handle).toHaveAttribute('title', /0\.2s/)

  const box = (await handle.boundingBox())!
  await handle.hover()
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
  const clip = page.locator('footer').getByText('photo.png')
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

test('色調補正: カラールックプリセットを適用できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  await page.setInputFiles('input[accept*="image"]', { name: 'photo.png', mimeType: 'image/png', buffer: png })
  await page.getByTitle('クリックで再生位置に追加').click()
  await page.locator('footer').getByText('photo.png').click()

  await page.getByRole('button', { name: 'フィルム風ルック' }).click()
  await expect(page.getByText('「フィルム風」ルックを適用しました')).toBeVisible()
  await expect(page.getByRole('button', { name: 'フィルム風ルック' })).toHaveAttribute('aria-pressed', 'true')
})

test('映像フェード: 画像クリップにフェードインを設定できる', async ({ page }) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  )
  await page.setInputFiles('input[accept*="image"]', { name: 'photo.png', mimeType: 'image/png', buffer: png })
  await page.getByTitle('クリックで再生位置に追加').click()
  await page.locator('footer').getByText('photo.png').click()

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

  await page.locator('footer').getByText('写真: 新郎 幼少期').click()
  await expect(page.getByRole('button', { name: 'ガイド区間にスライドショーを配置' })).toBeVisible()
  await page.getByRole('button', { name: 'ガイド区間にスライドショーを配置' }).click()
  await expect(page.getByText('2枚の写真をガイド区間に配置しました')).toBeVisible()

  await expect(page.locator('footer').getByText('写真: 新郎 幼少期')).toBeHidden()
  await expect(page.locator('footer').getByText('guide-a.png')).toBeVisible()
  await expect(page.locator('footer').getByText('guide-b.png')).toBeVisible()
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

test('書き出し: 章マーカー一括書き出し UI が表示される', async ({ page }) => {
  await page.getByTitle('テンプレ').click()
  await page.getByRole('button', { name: /結婚式フル構成/ }).click()
  await page.getByRole('button', { name: '書き出し' }).click()

  await expect(page.getByRole('button', { name: '全章を ZIP で書き出し' })).toBeVisible()
  await expect(page.getByText('5 章を個別 MP4 化して ZIP にまとめます')).toBeVisible()
  await expect(page.getByRole('button', { name: '全章を ZIP で書き出し' })).toContainText('5 章')
})

test('マーカー: インスペクターで編集しタイムライン上でドラッグ移動できる', async ({ page }) => {
  await page.getByTitle('テンプレ').click()
  await page.getByRole('button', { name: /結婚式フル構成/ }).click()

  const marker = page.locator('[title="新郎プロフィール"]')
  await marker.click()
  const markerId = await marker.getAttribute('data-marker-id')
  expect(markerId).toBeTruthy()
  await expect(page.locator('aside').getByText('章マーカー', { exact: true })).toBeVisible()

  const labelInput = page.locator('input[type="text"]').first()
  await labelInput.fill('新郎パート')
  await expect(page.locator(`[data-marker-id="${markerId}"]`)).toHaveAttribute('title', '新郎パート')

  const timeInput = page.locator('input[type="number"]').first()
  await timeInput.fill('25')
  await expect(page.locator('aside').getByText('25.0s')).toBeVisible()

  const markerHandle = page.locator(`[data-marker-id="${markerId}"]`)
  const box = await markerHandle.boundingBox()
  expect(box).toBeTruthy()
  const startX = box!.x + box!.width / 2
  const startY = box!.y + box!.height / 2
  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(startX + 80, startY)
  await page.mouse.up()

  const movedTime = Number(await timeInput.inputValue())
  expect(movedTime).toBeGreaterThan(25)
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

test('メディア: ナレーション録音をプレビューしてタイムラインに配置できる', async ({ page }) => {
  await installNarrationRecordingMocks(page)
  await page.goto('./')
  await expect(page.getByText('FABLE', { exact: true })).toBeVisible()

  await page.getByTitle('メディア').click()
  await page.getByRole('button', { name: '録音開始' }).click()
  await expect(page.getByText(/録音中/)).toBeVisible()
  await page.getByRole('button', { name: '停止' }).click()
  await expect(page.getByLabel('録音プレビュー')).toBeVisible()
  await page.getByRole('button', { name: 'タイムラインに配置' }).click()
  await expect(page.getByText('ナレーションをタイムラインに配置しました')).toBeVisible()
  await expect(page.locator('footer').getByText(/^narration-/)).toBeVisible()
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
  await page.locator('footer').getByText('photo-a.png').click()

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
  await page.locator('footer').getByText('photo.png').click()

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
  await page.locator('footer').getByText('clip.webm').click()

  await page.getByRole('button', { name: 'メディア' }).click()
  await page.getByRole('button', { name: 'still.png に差し替え' }).click()
  await expect(page.getByText('「still.png」に差し替えました')).toBeVisible()
  await expect(page.locator('footer').getByText('still.png')).toBeVisible()
  await expect(page.locator('footer').getByText('clip.webm')).toBeHidden()
})
