import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DOC_SYNC_PATHS,
  REQUIRED_AUDIT_DOCS,
  auditDocsReferencedInAgents,
  collectDocSyncMetrics,
  missingAuditDocFiles,
  parseReadmeProdSmokeCount,
  parseFeatureComparisonTestCoverage,
} from './docSyncAudit'

const rootDir = resolve(import.meta.dirname, '../..')

describe('docSyncAudit', () => {
  const metrics = collectDocSyncMetrics(rootDir)
  const readme = readFileSync(resolve(rootDir, DOC_SYNC_PATHS.readme), 'utf8')
  const agents = readFileSync(resolve(rootDir, DOC_SYNC_PATHS.agents), 'utf8')

  it('package.json / README / FEATURE_COMPARISON のバージョンが一致する', () => {
    expect(metrics.readmeVersion).toBe(metrics.packageVersion)
    expect(metrics.featureComparisonVersion).toBe(metrics.packageVersion)
  })

  it('FEATURE_COMPARISON サマリーの数値が実測と一致する', () => {
    expect(metrics.summary.unitTests).toBe(metrics.unitTestCount)
    expect(metrics.summary.e2eTotal).toBe(metrics.e2eTotal)
    expect(metrics.summary.prodSmoke).toBe(metrics.prodSmokeCount)
    expect(metrics.summary.implementedCount).toBe(metrics.featureMatrixRows)
    expect(metrics.summary.mvpCount).toBe(metrics.mvpRemarkCount)
  })

  it('README の本番スモーク件数が basic E2E と一致する', () => {
    expect(parseReadmeProdSmokeCount(readme)).toBe(metrics.e2eBasicCount)
  })

  it('FEATURE_COMPARISON テストカバレッジ節のユニット件数が実測と一致する', () => {
    const featureComparison = readFileSync(resolve(rootDir, DOC_SYNC_PATHS.featureComparison), 'utf8')
    const { unitTests } = parseFeatureComparisonTestCoverage(featureComparison)
    expect(unitTests).toBe(metrics.unitTestCount)
  })

  it('監査ドキュメントがすべて存在し AGENTS に参照されている', () => {
    expect(missingAuditDocFiles(rootDir)).toEqual([])
    expect(auditDocsReferencedInAgents(agents)).toEqual([...REQUIRED_AUDIT_DOCS])
  })
})
