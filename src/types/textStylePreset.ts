import type { TextStyle } from './project'

/** テキスト内容を除いた書式フィールド */
export type SavedTextStyleFields = Omit<TextStyle, 'content'>

/** localStorage に保存するユーザー定義テキストスタイル */
export interface SavedTextStylePreset {
  id: string
  name: string
  style: SavedTextStyleFields
}
