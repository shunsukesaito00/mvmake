import { test, expect } from '@playwright/test'

/**
 * README 用スクリーンショットの自動生成。
 * デモ用のコンテンツ(画像クリップ + テキストクリップ)を配置した
 * エディタ画面を docs/screenshot.png として保存する。
 */
test('README 用スクリーンショットを生成', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('fable-onboarded', '1'))
  await page.goto('/')
  await expect(page.getByText('FABLE', { exact: true })).toBeVisible()

  // テキストクリップ(Opening)を先頭に追加
  await page.getByTitle('テキスト').click()
  await page.getByRole('button', { name: /Opening/ }).first().click()
  await expect(page.locator('footer').getByText('Opening')).toBeVisible()

  // デモ用のグラデーション画像をブラウザ内で生成してインポート
  await page.getByTitle('メディア').click()
  await page.evaluate(async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 1280
    canvas.height = 720
    const ctx = canvas.getContext('2d')!
    const g = ctx.createLinearGradient(0, 0, 1280, 720)
    g.addColorStop(0, '#f7d9b0')
    g.addColorStop(0.5, '#e8a3a3')
    g.addColorStop(1, '#8e7cc3')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 1280, 720)
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.beginPath()
    ctx.arc(980, 190, 85, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(60,40,80,0.45)'
    ctx.beginPath()
    ctx.ellipse(640, 700, 900, 140, 0, Math.PI, 0)
    ctx.fill()

    const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'))
    const file = new File([blob], 'wedding-photo.png', { type: 'image/png' })
    const input = document.querySelector<HTMLInputElement>('input[accept*="image"]')!
    const dt = new DataTransfer()
    dt.items.add(file)
    input.files = dt.files
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await expect(page.getByText('1件のメディアを追加しました')).toBeVisible()

  // 画像クリップを再生位置(0秒)に配置 → テキストと重なる
  await page.getByTitle('クリックで再生位置に追加').click()
  await expect(page.locator('footer').getByText('wedding-photo.png')).toBeVisible()

  // ルーラーをクリックして 1 秒付近へシーク(プレビューに画像+テキストが映る)
  const ruler = page.locator('footer .cursor-pointer').first()
  await ruler.click({ position: { x: 80, y: 12 } })

  // テキストクリップを選択してインスペクターとバウンディングボックスを表示
  await page.locator('footer').getByText('Opening').click()

  // フォント・レンダリングの完了を待つ
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1500)

  await page.screenshot({ path: 'docs/screenshot.png' })
})
