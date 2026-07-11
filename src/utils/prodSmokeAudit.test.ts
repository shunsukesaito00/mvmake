import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { countE2eTestCalls } from './docSyncAudit'
import {
  PROD_SMOKE_SCENARIO_COUNT,
  PROD_SMOKE_V211_ADDITIONS,
  PROD_SMOKE_V212_ADDITIONS,
  PROD_SMOKE_V213_ADDITIONS,
  PROD_SMOKE_V214_ADDITIONS,
  PROD_SMOKE_V215_ADDITIONS,
  PROD_SMOKE_V220_ADDITIONS,
  PROD_SMOKE_V221_ADDITIONS,
  PROD_SMOKE_V222_ADDITIONS,
  PROD_SMOKE_V223_ADDITIONS,
  PROD_SMOKE_V224_ADDITIONS,
  PROD_SMOKE_V225_ADDITIONS,
  PROD_SMOKE_V226_ADDITIONS,
  PROD_SMOKE_V227_ADDITIONS,
  PROD_SMOKE_V228_ADDITIONS,
  PROD_SMOKE_V229_ADDITIONS,
  PROD_SMOKE_V2210_ADDITIONS,
  PROD_SMOKE_V2211_ADDITIONS,
  PROD_SMOKE_V2212_ADDITIONS,
  PROD_SMOKE_V2213_ADDITIONS,
  PROD_SMOKE_V2214_ADDITIONS,
  PROD_SMOKE_V2215_ADDITIONS,
  PROD_SMOKE_V2216_ADDITIONS,
  PROD_SMOKE_V2217_ADDITIONS,
  PROD_SMOKE_V2218_ADDITIONS,
  PROD_SMOKE_V2219_ADDITIONS,
  PROD_SMOKE_V2220_ADDITIONS,
  PROD_SMOKE_V2221_ADDITIONS,
  PROD_SMOKE_V2222_ADDITIONS,
  PROD_SMOKE_V2223_ADDITIONS,
  PROD_SMOKE_V2224_ADDITIONS,
  PROD_SMOKE_V2225_ADDITIONS,
  PROD_SMOKE_V2226_ADDITIONS,
  PROD_SMOKE_V2227_ADDITIONS,
  PROD_SMOKE_V2228_ADDITIONS,
  PROD_SMOKE_V2229_ADDITIONS,
  PROD_SMOKE_V2230_ADDITIONS,
  PROD_SMOKE_V2231_ADDITIONS,
  PROD_SMOKE_V2232_ADDITIONS,
  PROD_SMOKE_V2233_ADDITIONS,
  PROD_SMOKE_V2234_ADDITIONS,
  PROD_SMOKE_V2235_ADDITIONS,
  PROD_SMOKE_V2236_ADDITIONS,
  PROD_SMOKE_V2237_ADDITIONS,
  PROD_SMOKE_V2238_ADDITIONS,
  PROD_SMOKE_V2239_ADDITIONS,
  PROD_SMOKE_V2240_ADDITIONS,
  PROD_SMOKE_V2241_ADDITIONS,
  PROD_SMOKE_V2242_ADDITIONS,
  PROD_SMOKE_V2243_ADDITIONS,
  PROD_SMOKE_V2244_ADDITIONS,
  PROD_SMOKE_V2245_ADDITIONS,
  PROD_SMOKE_V2246_ADDITIONS,
  PROD_SMOKE_V2247_ADDITIONS,
  PROD_SMOKE_V2248_ADDITIONS,
  PROD_SMOKE_V2249_ADDITIONS,
  PROD_SMOKE_V2250_ADDITIONS,
  PROD_SMOKE_V2251_ADDITIONS,
  PROD_SMOKE_V2252_ADDITIONS,
  PROD_SMOKE_V2253_ADDITIONS,
  PROD_SMOKE_V2254_ADDITIONS,
  PROD_SMOKE_V2255_ADDITIONS,
  PROD_SMOKE_V2256_ADDITIONS,
  PROD_SMOKE_V2257_ADDITIONS,
  PROD_SMOKE_V2258_ADDITIONS,
  PROD_SMOKE_V2259_ADDITIONS,
  PROD_SMOKE_V2260_ADDITIONS,
  PROD_SMOKE_V2261_ADDITIONS,
  PROD_SMOKE_V2262_ADDITIONS,
  PROD_SMOKE_V2263_ADDITIONS,
  PROD_SMOKE_V2264_ADDITIONS,
  PROD_SMOKE_V2265_ADDITIONS,
  PROD_SMOKE_V2266_ADDITIONS,
} from './prodSmokeAudit'

const rootDir = resolve(import.meta.dirname, '../..')

describe('prodSmokeAudit', () => {
  const basic = readFileSync(resolve(rootDir, 'e2e/basic.spec.ts'), 'utf8')

  it('basic.spec.ts の件数が PROD_SMOKE_SCENARIO_COUNT と一致する', () => {
    expect(countE2eTestCalls(basic)).toBe(PROD_SMOKE_SCENARIO_COUNT)
  })

  it('v2.1.1 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V211_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.1.2 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V212_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.1.3 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V213_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.1.4 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V214_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.1.5 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V215_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.0 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V220_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.1 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V221_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.2 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V222_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.3 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V223_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.4 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V224_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.5 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V225_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.6 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V226_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.7 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V227_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.8 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V228_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.9 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V229_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.10 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2210_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.11 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2211_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.12 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2212_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.13 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2213_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.14 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2214_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.15 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2215_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.16 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2216_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.17 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2217_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.18 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2218_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.19 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2219_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.20 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2220_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.21 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2221_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.22 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2222_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.23 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2223_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.24 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2224_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.25 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2225_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.26 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2226_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.27 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2227_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.28 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2228_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.29 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2229_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.30 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2230_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.31 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2231_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.32 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2232_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.33 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2233_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.34 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2234_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.35 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2235_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.36 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2236_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.37 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2237_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.38 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2238_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.39 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2239_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.40 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2240_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.41 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2241_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.42 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2242_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.43 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2243_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.44 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2244_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.45 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2245_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.46 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2246_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.47 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2247_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.48 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2248_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.49 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2249_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.50 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2250_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.51 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2251_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.52 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2252_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.53 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2253_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.54 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2254_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.55 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2255_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.56 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2256_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.57 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2257_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.58 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2258_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.59 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2259_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.60 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2260_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.61 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2261_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.62 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2262_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.63 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2263_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.64 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2264_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.65 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2265_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.66 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2266_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })
})
