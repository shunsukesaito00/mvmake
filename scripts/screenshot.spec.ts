import { test, expect } from '@playwright/test'

/**
 * README 用スクリーンショットの自動生成。
 * オンボーディングのサンプルプロジェクト(Canvas生成画像4枚+テキスト3種)を開き、
 * クリップが並んだエディタ画面を docs/screenshot.png として保存する。
 */
test('README 用スクリーンショットを生成', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByText('FABLE へようこそ')).toBeVisible()

  // サンプルプロジェクトを開く(画像クリップ4つ+テキストクリップ3つが配置される)
  await page.getByRole('button', { name: 'サンプルプロジェクトを開いて試す' }).click()
  await expect(page.locator('footer').getByText('Our Story.jpg')).toBeVisible()

  // トースト通知(3秒)が消えるのを待つ
  await expect(page.getByText('サンプルプロジェクトを開きました', { exact: false })).toBeHidden({ timeout: 6000 })

  // ルーラーをクリックして 2 秒付近へシーク(1枚目の画像 + Opening テキストが映る)
  const ruler = page.locator('footer .cursor-pointer').first()
  await ruler.click({ position: { x: 160, y: 12 } })

  // テキストクリップを選択してインスペクターとバウンディングボックスを表示
  await page.locator('footer').getByText('Opening').click()

  // フォント・レンダリングの完了を待つ
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1500)

  await page.screenshot({ path: 'docs/screenshot.png' })
})
