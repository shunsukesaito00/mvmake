// maskable アイコン生成スクリプト(必要時のみ手動実行)
// 通常アイコンと違い、マスク切り抜きを想定して全面塗り・セーフゾーン(中央80%)内に
// ロゴを収めた 512px PNG を public/pwa-maskable-512.png として出力する。
// 実行: node scripts/generate-maskable-icon.mjs
import { chromium } from '@playwright/test'
import { writeFileSync } from 'node:fs'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 512, height: 512 } })

const dataUrl = await page.evaluate(() => {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  // 全面塗りの背景(透過なし)
  ctx.fillStyle = '#111116'
  ctx.fillRect(0, 0, size, size)

  // 中央に柔らかい光
  const glow = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.7)
  glow.addColorStop(0, 'rgba(212,184,126,0.14)')
  glow.addColorStop(1, 'rgba(212,184,126,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, size, size)

  // ゴールドグラデーションの F (セーフゾーン内に収める)
  const g = ctx.createLinearGradient(size * 0.3, size * 0.2, size * 0.7, size * 0.8)
  g.addColorStop(0, '#d4b87e')
  g.addColorStop(1, '#a07840')
  ctx.fillStyle = g
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '900 300px system-ui, sans-serif'
  ctx.fillText('F', size / 2, size / 2 + 16)

  return canvas.toDataURL('image/png')
})

writeFileSync('public/pwa-maskable-512.png', Buffer.from(dataUrl.split(',')[1], 'base64'))
await browser.close()
console.log('generated public/pwa-maskable-512.png')
