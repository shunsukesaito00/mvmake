/** `e2e/basic.spec.ts` = `npm run test:e2e:prod` の期待シナリオ数 */
export const PROD_SMOKE_SCENARIO_COUNT = 53

/** v2.1.1 で basic.spec に追加したシナリオ（test 名の部分一致用） */
export const PROD_SMOKE_V211_ADDITIONS = [
  'プロジェクト一覧',
  'テキスト内容の編集',
  'クイックスタート',
  'ショートカット一覧',
  'ユーザーテンプレート',
] as const

/** v2.1.2 で basic.spec に追加したシナリオ（test 名の部分一致用） */
export const PROD_SMOKE_V212_ADDITIONS = [
  '画像をインポート',
  'undo で復元',
  'コピーしてペースト',
  '検索・種類フィルタ',
  'Escape で閉じ',
] as const

/** v2.1.3 で basic.spec に追加したシナリオ（test 名の部分一致用） */
export const PROD_SMOKE_V213_ADDITIONS = [
  '分割できる',
  'In/Out点',
  '章マーカー',
  'Google Fonts',
  'フェードイン',
] as const

/** v2.1.4 で basic.spec に追加したシナリオ（test 名の部分一致用） */
export const PROD_SMOKE_V214_ADDITIONS = [
  'トリムで長さ',
  'ドラッグ移動',
  'SRT 字幕をエクスポート',
  'ビートマーカー',
  'セーフエリア',
] as const

/** v2.1.5 で basic.spec に追加したシナリオ（test 名の部分一致用） */
export const PROD_SMOKE_V215_ADDITIONS = [
  '左端ハンドル',
  'Alt+ドラッグ',
  'VTT 字幕',
  '調整レイヤー',
  'プロジェクト設定',
] as const

/** v2.2.0 で basic.spec に追加したシナリオ（test 名の部分一致用） */
export const PROD_SMOKE_V220_ADDITIONS = [
  '縦型9:16',
  'プリセットを保存',
  'スライドショー',
] as const

/** v2.2.1 で basic.spec に追加したシナリオ（test 名の部分一致用） */
export const PROD_SMOKE_V221_ADDITIONS = [
  'オーディオクリップにフェード',
  'BGM ダッキング',
  'フェード to 黒',
] as const

/** v2.2.2 で basic.spec に追加したシナリオ（test 名の部分一致用） */
export const PROD_SMOKE_V222_ADDITIONS = [
  '音量を正規化',
  'オーディオ EQ',
  'ディゾルブ',
] as const

/** v2.2.3 で basic.spec に追加したシナリオ（test 名の部分一致用） */
export const PROD_SMOKE_V223_ADDITIONS = [
  'ノイズ除去',
  'ナレーション録音',
  'テキストスタイル',
] as const

/** v2.2.4 で basic.spec に追加したシナリオ（test 名の部分一致用） */
export const PROD_SMOKE_V224_ADDITIONS = [
  'MG 花びら舞',
] as const

/** v2.2.5 で basic.spec に追加したシナリオ（test 名の部分一致用） */
export const PROD_SMOKE_V225_ADDITIONS = [
  'ケーキカット',
  'ループ再生',
  'リップル削除',
] as const
