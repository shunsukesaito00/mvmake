import { existsSync, globSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** Q5〜Q11 で整備した監査ドキュメント（存在 + AGENTS 参照を検証） */
export const REQUIRED_AUDIT_DOCS = [
  'docs/RENDER_PATH_AUDIT.md',
  'docs/COLOR_STACK_AUDIT.md',
  'docs/AUDIO_STACK_AUDIT.md',
  'docs/PERFORMANCE_AUDIT.md',
  'docs/TEXT_SRT_AUDIT.md',
  'docs/ONBOARDING_AUDIT.md',
  'docs/PRESET_CATALOG_AUDIT.md',
  'docs/DOC_SYNC_AUDIT.md',
  'docs/CHAPTER_EXPORT_AUDIT.md',
  'docs/CHAPTER_RANGE_EXPORT_AUDIT.md',
  'docs/PHOTO_GUIDE_SLIDESHOW_AUDIT.md',
  'docs/MARKER_EDIT_AUDIT.md',
] as const

export const DOC_SYNC_PATHS = {
  packageJson: 'package.json',
  readme: 'README.md',
  featureComparison: 'docs/FEATURE_COMPARISON.md',
  agents: 'AGENTS.md',
  e2eBasic: 'e2e/basic.spec.ts',
  e2eEditor: 'e2e/editor.spec.ts',
} as const

export function parsePackageVersion(packageJson: string): string {
  const parsed = JSON.parse(packageJson) as { version?: string }
  if (!parsed.version) throw new Error('package.json missing version')
  return parsed.version
}

export function formatVersionLabel(version: string): string {
  return version.startsWith('v') ? version : `v${version}`
}

export function countE2eTestCalls(source: string): number {
  return (source.match(/^\s*test\s*\(/gm) ?? []).length
}

export function countUnitTestCasesInSource(source: string): number {
  let eachCases = 0
  for (const match of source.matchAll(/(?:it|test)\.each\s*\(\s*\[([\s\S]*?)\]\s*\)/g)) {
    eachCases += match[1].split('\n').filter((line) => /^\s*\{/.test(line)).length
  }
  const plain =
    (source.match(/^\s*it\s*\(/gm) ?? []).length +
    (source.match(/^\s*test\s*\(/gm) ?? []).length
  return plain + eachCases
}

export function countUnitTestCases(rootDir: string): number {
  const files = globSync('src/**/*.test.ts', { cwd: rootDir })
  return files.reduce((sum, rel) => {
    const src = readFileSync(resolve(rootDir, rel), 'utf8')
    return sum + countUnitTestCasesInSource(src)
  }, 0)
}

export function extractMarkdownSection(md: string, heading: string): string {
  const pattern = new RegExp(`^${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm')
  const match = pattern.exec(md)
  if (!match) return ''
  const rest = md.slice(match.index + heading.length)
  const next = rest.search(/^## /m)
  return next < 0 ? rest : rest.slice(0, next)
}

/** `## 実装済み` 機能マトリクス内のデータ行数（ヘッダー・区切り行を除く） */
export function countFeatureMatrixRows(featureComparisonMd: string): number {
  const section = extractMarkdownSection(featureComparisonMd, '## 実装済み')
  return (section.match(/^\| [^|-]/gm) ?? []).length
}

/** 機能マトリクス備考列の `(MVP)` 件数 */
export function countMvpRemarksInFeatureMatrix(featureComparisonMd: string): number {
  const section = extractMarkdownSection(featureComparisonMd, '## 実装済み')
  return (section.match(/\(MVP\)/g) ?? []).length
}

export interface FeatureComparisonSummary {
  packageVersion: string | null
  implementedCount: number | null
  mvpCount: number | null
  unitTests: number | null
  e2eTotal: number | null
  prodSmoke: number | null
}

export function parseFeatureComparisonSummary(md: string): FeatureComparisonSummary {
  const packageVersion = md.match(/\*\*package\.json バージョン\*\* \| v([\d.]+)/)?.[1] ?? null
  const implementedCount = Number(md.match(/\*\*実装済み機能\*\* \| (\d+)/)?.[1] ?? NaN) || null
  const mvpMatch = md.match(/\*\*実装済み機能\*\* \| \d+ 項目（うち MVP 要磨[りき]込み (\d+) 項目）/)
  const unitTests = Number(md.match(/\*\*ユニットテスト\*\* \| (\d+)/)?.[1] ?? NaN) || null
  const e2eMatch = md.match(/\*\*E2E\*\* \| (\d+) シナリオ（本番スモーク (\d+)）/)
  return {
    packageVersion,
    implementedCount,
    mvpCount: mvpMatch ? Number(mvpMatch[1]) : null,
    unitTests,
    e2eTotal: e2eMatch ? Number(e2eMatch[1]) : null,
    prodSmoke: e2eMatch ? Number(e2eMatch[2]) : null,
  }
}

export function parseFeatureComparisonTestCoverage(md: string): { unitTests: number | null } {
  const section = extractMarkdownSection(md, '## テストカバレッジ')
  const unitTests = Number(section.match(/ユニットテスト \(Vitest\): (\d+)件/)?.[1] ?? NaN) || null
  return { unitTests }
}

export function parseReadmeVersion(md: string): string | null {
  return md.match(/\*\*現在のバージョン\*\*: v([\d.]+)/)?.[1] ?? null
}

export function parseReadmeProdSmokeCount(md: string): number | null {
  const match = md.match(/test:e2e:prod[^（]*（[^0-9]*(\d+)\s*シナリオ）/)
  return match ? Number(match[1]) : null
}

export function auditDocsReferencedInAgents(agentsMd: string): string[] {
  return REQUIRED_AUDIT_DOCS.filter((doc) => agentsMd.includes(doc))
}

export function missingAuditDocFiles(rootDir: string): string[] {
  return REQUIRED_AUDIT_DOCS.filter((doc) => !existsSync(resolve(rootDir, doc)))
}

export interface DocSyncMetrics {
  packageVersion: string
  readmeVersion: string | null
  featureComparisonVersion: string | null
  unitTestCount: number
  e2eBasicCount: number
  e2eEditorCount: number
  e2eTotal: number
  prodSmokeCount: number
  featureMatrixRows: number
  mvpRemarkCount: number
  summary: FeatureComparisonSummary
}

export function collectDocSyncMetrics(rootDir: string): DocSyncMetrics {
  const packageJson = readFileSync(resolve(rootDir, DOC_SYNC_PATHS.packageJson), 'utf8')
  const readme = readFileSync(resolve(rootDir, DOC_SYNC_PATHS.readme), 'utf8')
  const featureComparison = readFileSync(resolve(rootDir, DOC_SYNC_PATHS.featureComparison), 'utf8')
  const e2eBasic = readFileSync(resolve(rootDir, DOC_SYNC_PATHS.e2eBasic), 'utf8')
  const e2eEditor = readFileSync(resolve(rootDir, DOC_SYNC_PATHS.e2eEditor), 'utf8')

  const e2eBasicCount = countE2eTestCalls(e2eBasic)
  const e2eEditorCount = countE2eTestCalls(e2eEditor)
  const summary = parseFeatureComparisonSummary(featureComparison)

  return {
    packageVersion: parsePackageVersion(packageJson),
    readmeVersion: parseReadmeVersion(readme),
    featureComparisonVersion: summary.packageVersion,
    unitTestCount: countUnitTestCases(rootDir),
    e2eBasicCount,
    e2eEditorCount,
    e2eTotal: e2eBasicCount + e2eEditorCount,
    prodSmokeCount: e2eBasicCount,
    featureMatrixRows: countFeatureMatrixRows(featureComparison),
    mvpRemarkCount: countMvpRemarksInFeatureMatrix(featureComparison),
    summary,
  }
}
