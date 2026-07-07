import { test, expect } from '@playwright/test'

test('基本フロー: 起動 → オンボーディング → テキスト追加 → タイムライン確認', async ({ page }) => {
  await page.goto('/')

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
