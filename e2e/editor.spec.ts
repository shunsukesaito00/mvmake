import { test, expect } from '@playwright/test'

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
    await expect(page.getByText(/エンコードがサポートされていません/)).toBeVisible()
  }
})

test('ショートカット: Space で再生・停止、Cmd/Ctrl+Z で取り消し', async ({ page }) => {
  await addOpeningText(page)

  // 選択解除してフォーカスの影響を避ける(トランスポートのスライダーは main 内)
  await page.keyboard.press('Escape')

  const transport = page.locator('main input[type="range"]').first()
  const before = parseFloat(await transport.inputValue())

  // Space で再生開始 → 再生ヘッドが進む
  await page.keyboard.press('Space')
  await page.waitForTimeout(1000)
  const during = parseFloat(await transport.inputValue())
  expect(during).toBeGreaterThan(before)

  // Space で停止 → 進行が止まる
  await page.keyboard.press('Space')
  await page.waitForTimeout(300)
  const paused = parseFloat(await transport.inputValue())
  await page.waitForTimeout(500)
  expect(parseFloat(await transport.inputValue())).toBeCloseTo(paused, 2)

  // Cmd/Ctrl+Z でテキスト追加を取り消し
  await page.keyboard.press('ControlOrMeta+z')
  await expect(page.locator('footer').getByText('Opening')).toBeHidden()
})
