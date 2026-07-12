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
  PROD_SMOKE_V2267_ADDITIONS,
  PROD_SMOKE_V2268_ADDITIONS,
  PROD_SMOKE_V2269_ADDITIONS,
  PROD_SMOKE_V2270_ADDITIONS,
  PROD_SMOKE_V2271_ADDITIONS,
  PROD_SMOKE_V2272_ADDITIONS,
  PROD_SMOKE_V2273_ADDITIONS,
  PROD_SMOKE_V2274_ADDITIONS,
  PROD_SMOKE_V2275_ADDITIONS,
  PROD_SMOKE_V2276_ADDITIONS,
  PROD_SMOKE_V2277_ADDITIONS,
  PROD_SMOKE_V2278_ADDITIONS,
  PROD_SMOKE_V2279_ADDITIONS,
  PROD_SMOKE_V2280_ADDITIONS,
  PROD_SMOKE_V2281_ADDITIONS,
  PROD_SMOKE_V2282_ADDITIONS,
  PROD_SMOKE_V2283_ADDITIONS,
  PROD_SMOKE_V2284_ADDITIONS,
  PROD_SMOKE_V2285_ADDITIONS,
  PROD_SMOKE_V2286_ADDITIONS,
  PROD_SMOKE_V2287_ADDITIONS,
  PROD_SMOKE_V2288_ADDITIONS,
  PROD_SMOKE_V2289_ADDITIONS,
  PROD_SMOKE_V2290_ADDITIONS,
  PROD_SMOKE_V2291_ADDITIONS,
  PROD_SMOKE_V2292_ADDITIONS,
  PROD_SMOKE_V2293_ADDITIONS,
  PROD_SMOKE_V2294_ADDITIONS,
  PROD_SMOKE_V2295_ADDITIONS,
  PROD_SMOKE_V2296_ADDITIONS,
  PROD_SMOKE_V2297_ADDITIONS,
  PROD_SMOKE_V2298_ADDITIONS,
  PROD_SMOKE_V2299_ADDITIONS,
  PROD_SMOKE_V2300_ADDITIONS,
  PROD_SMOKE_V2301_ADDITIONS,
  PROD_SMOKE_V2302_ADDITIONS,
  PROD_SMOKE_V2303_ADDITIONS,
  PROD_SMOKE_V2304_ADDITIONS,
  PROD_SMOKE_V2305_ADDITIONS,
  PROD_SMOKE_V2306_ADDITIONS,
  PROD_SMOKE_V2307_ADDITIONS,
  PROD_SMOKE_V2308_ADDITIONS,
  PROD_SMOKE_V2309_ADDITIONS,
  PROD_SMOKE_V2400_ADDITIONS,
  PROD_SMOKE_V2401_ADDITIONS,
  PROD_SMOKE_V2402_ADDITIONS,
  PROD_SMOKE_V2403_ADDITIONS,
  PROD_SMOKE_V2404_ADDITIONS,
  PROD_SMOKE_V2405_ADDITIONS,
  PROD_SMOKE_V2406_ADDITIONS,
  PROD_SMOKE_V2407_ADDITIONS,
  PROD_SMOKE_V2408_ADDITIONS,
  PROD_SMOKE_V2409_ADDITIONS,
  PROD_SMOKE_V2500_ADDITIONS,
  PROD_SMOKE_V2501_ADDITIONS,
  PROD_SMOKE_V2502_ADDITIONS,
  PROD_SMOKE_V2503_ADDITIONS,
  PROD_SMOKE_V2504_ADDITIONS,
  PROD_SMOKE_V2505_ADDITIONS,
  PROD_SMOKE_V2506_ADDITIONS,
  PROD_SMOKE_V2507_ADDITIONS,
  PROD_SMOKE_V2508_ADDITIONS,
  PROD_SMOKE_V2509_ADDITIONS,
  PROD_SMOKE_V2510_ADDITIONS,
  PROD_SMOKE_V2511_ADDITIONS,
  PROD_SMOKE_V2512_ADDITIONS,
  PROD_SMOKE_V2513_ADDITIONS,
  PROD_SMOKE_V2514_ADDITIONS,
  PROD_SMOKE_V2515_ADDITIONS,
  PROD_SMOKE_V2516_ADDITIONS,
  PROD_SMOKE_V2517_ADDITIONS,
  PROD_SMOKE_V2518_ADDITIONS,
  PROD_SMOKE_V2519_ADDITIONS,
  PROD_SMOKE_V2520_ADDITIONS,
  PROD_SMOKE_V2521_ADDITIONS,
  PROD_SMOKE_V2522_ADDITIONS,
  PROD_SMOKE_V2523_ADDITIONS,
  PROD_SMOKE_V2524_ADDITIONS,
  PROD_SMOKE_V2525_ADDITIONS,
  PROD_SMOKE_V2526_ADDITIONS,
  PROD_SMOKE_V2527_ADDITIONS,
  PROD_SMOKE_V2528_ADDITIONS,
  PROD_SMOKE_V2529_ADDITIONS,
  PROD_SMOKE_V2530_ADDITIONS,
  PROD_SMOKE_V2531_ADDITIONS,
  PROD_SMOKE_V2532_ADDITIONS,
  PROD_SMOKE_V2533_ADDITIONS,
  PROD_SMOKE_V2534_ADDITIONS,
  PROD_SMOKE_V2535_ADDITIONS,
  PROD_SMOKE_V2536_ADDITIONS,
  PROD_SMOKE_V2537_ADDITIONS,
  PROD_SMOKE_V2538_ADDITIONS,
  PROD_SMOKE_V2539_ADDITIONS,
  PROD_SMOKE_V2540_ADDITIONS,
  PROD_SMOKE_V2541_ADDITIONS,
  PROD_SMOKE_V2542_ADDITIONS,
  PROD_SMOKE_V2543_ADDITIONS,
  PROD_SMOKE_V2544_ADDITIONS,
  PROD_SMOKE_V2545_ADDITIONS,
  PROD_SMOKE_V2546_ADDITIONS,
  PROD_SMOKE_V2547_ADDITIONS,
  PROD_SMOKE_V2548_ADDITIONS,
  PROD_SMOKE_V2549_ADDITIONS,
  PROD_SMOKE_V2550_ADDITIONS,
  PROD_SMOKE_V2551_ADDITIONS,
  PROD_SMOKE_V2552_ADDITIONS,
  PROD_SMOKE_V2553_ADDITIONS,
  PROD_SMOKE_V2554_ADDITIONS,
  PROD_SMOKE_V2555_ADDITIONS,
  PROD_SMOKE_V2556_ADDITIONS,
  PROD_SMOKE_V2557_ADDITIONS,
  PROD_SMOKE_V2558_ADDITIONS,
  PROD_SMOKE_V2559_ADDITIONS,
  PROD_SMOKE_V2560_ADDITIONS,
  PROD_SMOKE_V2561_ADDITIONS,
  PROD_SMOKE_V2562_ADDITIONS,
  PROD_SMOKE_V2563_ADDITIONS,
  PROD_SMOKE_V2564_ADDITIONS,
  PROD_SMOKE_V2565_ADDITIONS,
  PROD_SMOKE_V2566_ADDITIONS,
  PROD_SMOKE_V2567_ADDITIONS,
  PROD_SMOKE_V2568_ADDITIONS,
  PROD_SMOKE_V2569_ADDITIONS,
  PROD_SMOKE_V2570_ADDITIONS,
  PROD_SMOKE_V2571_ADDITIONS,
  PROD_SMOKE_V2572_ADDITIONS,
  PROD_SMOKE_V2573_ADDITIONS,
  PROD_SMOKE_V2575_ADDITIONS,
  PROD_SMOKE_V2576_ADDITIONS,
  PROD_SMOKE_V2577_ADDITIONS,
  PROD_SMOKE_V2578_ADDITIONS,
  PROD_SMOKE_V2579_ADDITIONS,
  PROD_SMOKE_V2580_ADDITIONS,
  PROD_SMOKE_V2581_ADDITIONS,
  PROD_SMOKE_V2582_ADDITIONS,
  PROD_SMOKE_V2583_ADDITIONS,
  PROD_SMOKE_V2584_ADDITIONS,
  PROD_SMOKE_V2585_ADDITIONS,
  PROD_SMOKE_V2586_ADDITIONS,
  PROD_SMOKE_V2587_ADDITIONS,
  PROD_SMOKE_V2588_ADDITIONS,
  PROD_SMOKE_V2589_ADDITIONS,
  PROD_SMOKE_V2590_ADDITIONS,
  PROD_SMOKE_V2591_ADDITIONS,
  PROD_SMOKE_V2592_ADDITIONS,
  PROD_SMOKE_V2593_ADDITIONS,
  PROD_SMOKE_V2594_ADDITIONS,
  PROD_SMOKE_V2595_ADDITIONS,
  PROD_SMOKE_V2596_ADDITIONS,
  PROD_SMOKE_V2597_ADDITIONS,
  PROD_SMOKE_V2598_ADDITIONS,
  PROD_SMOKE_V2599_ADDITIONS,
  PROD_SMOKE_V2600_ADDITIONS,
  PROD_SMOKE_V2601_ADDITIONS,
  PROD_SMOKE_V2602_ADDITIONS,
  PROD_SMOKE_V2603_ADDITIONS,
  PROD_SMOKE_V2604_ADDITIONS,
  PROD_SMOKE_V2605_ADDITIONS,
  PROD_SMOKE_V2606_ADDITIONS,
  PROD_SMOKE_V2607_ADDITIONS,
  PROD_SMOKE_V2608_ADDITIONS,
  PROD_SMOKE_V2609_ADDITIONS,
  PROD_SMOKE_V2610_ADDITIONS,
  PROD_SMOKE_V2611_ADDITIONS,
  PROD_SMOKE_V2612_ADDITIONS,
  PROD_SMOKE_V2613_ADDITIONS,
  PROD_SMOKE_V2614_ADDITIONS,
  PROD_SMOKE_V2615_ADDITIONS,
  PROD_SMOKE_V2616_ADDITIONS,
  PROD_SMOKE_V2617_ADDITIONS,
  PROD_SMOKE_V2618_ADDITIONS,
  PROD_SMOKE_V2619_ADDITIONS,
  PROD_SMOKE_V2620_ADDITIONS,
  PROD_SMOKE_V2621_ADDITIONS,
  PROD_SMOKE_V2622_ADDITIONS,
  PROD_SMOKE_V2623_ADDITIONS,
  PROD_SMOKE_V2624_ADDITIONS,
  PROD_SMOKE_V2625_ADDITIONS,
  PROD_SMOKE_V2626_ADDITIONS,
  PROD_SMOKE_V2627_ADDITIONS,
  PROD_SMOKE_V2628_ADDITIONS,
  PROD_SMOKE_V2629_ADDITIONS,
  PROD_SMOKE_TRANSITION_DEFINITION_COUNT,
  PROD_SMOKE_PHASE4_DOUBLE_NAMED_RECLICK_LAYER_COUNT,
  PROD_SMOKE_PHASE4_DOUBLE_NAMED_RECLICK_ROUTES,
  auditPhase4DoubleNamedReclickLayers,
  auditTransitionCoverage,
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

  it('v2.2.67 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2267_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.68 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2268_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.69 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2269_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.70 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2270_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.71 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2271_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.72 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2272_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.73 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2273_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.74 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2274_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.75 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2275_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.76 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2276_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.77 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2277_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.78 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2278_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.79 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2279_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.80 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2280_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.81 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2281_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.82 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2282_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.83 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2283_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.84 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2284_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.85 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2285_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.86 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2286_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.87 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2287_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.88 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2288_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.89 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2289_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.90 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2290_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.91 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2291_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.92 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2292_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.93 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2293_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.94 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2294_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.95 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2295_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.96 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2296_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.97 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2297_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.98 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2298_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.2.99 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2299_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.3.0 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2300_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.3.1 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2301_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.3.2 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2302_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.3.3 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2303_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.3.4 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2304_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.3.5 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2305_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.3.6 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2306_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.3.7 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2307_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.3.8 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2308_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.3.9 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2309_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.4.0 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2400_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.4.1 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2401_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.4.2 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2402_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.4.3 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2403_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.4.4 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2404_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.4.5 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2405_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.4.6 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2406_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.4.7 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2407_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.4.8 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2408_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.4.9 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2409_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.0 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2500_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.1 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2501_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.2 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2502_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.3 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2503_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.4 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2504_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.5 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2505_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.6 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2506_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.7 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2507_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.8 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2508_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.9 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2509_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.10 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2510_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.11 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2511_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.12 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2512_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.13 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2513_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.14 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2514_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.15 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2515_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.16 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2516_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.17 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2517_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.18 追加シナリオが basic.spec に含まれる', () => {
    for (const label of PROD_SMOKE_V2518_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.19 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2519_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.20 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2520_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.21 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2521_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.22 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2522_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.23 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2523_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.24 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2524_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.25 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2525_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.26 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2526_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.27 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2527_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.28 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2528_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.29 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2529_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.30 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2530_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.31 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2531_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.32 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2532_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.33 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2533_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.34 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2534_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.35 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2535_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.36 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2536_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.37 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2537_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.38 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2538_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.39 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2539_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.40 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2540_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.41 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2541_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.42 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2542_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.43 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2543_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.44 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2544_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.45 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2545_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.46 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2546_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.47 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2547_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.48 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2548_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.49 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2549_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.50 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2550_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.51 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2551_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.52 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2552_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.53 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2553_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.54 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2554_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.55 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2555_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.56 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2556_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.57 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2557_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.58 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2558_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.59 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2559_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.60 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2560_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.61 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2561_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.62 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2562_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.63 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2563_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.64 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2564_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.65 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2565_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.66 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2566_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.67 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2567_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.68 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2568_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.69 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2569_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.70 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2570_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.71 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2571_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.72 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2572_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.73 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2573_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.75 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2575_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.76 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2576_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.77 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2577_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.78 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2578_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.79 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2579_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.80 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2580_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.81 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2581_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.82 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2582_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.83 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2583_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.84 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2584_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.85 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2585_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.86 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2586_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.87 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2587_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.88 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2588_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.89 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2589_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.90 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2590_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.91 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2591_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.92 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2592_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.93 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2593_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.94 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2594_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.95 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2595_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.96 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2596_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.97 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2597_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.98 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2598_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.5.99 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2599_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.00 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2600_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.01 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2601_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.02 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2602_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.03 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2603_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.04 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2604_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.05 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2605_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.06 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2606_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.07 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2607_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.08 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2608_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.09 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2609_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.10 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2610_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.11 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2611_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.12 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2612_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.13 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2613_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.14 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2614_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.15 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2615_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.16 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2616_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.17 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2617_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.18 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2618_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.19 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2619_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.20 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2620_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.21 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2621_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.22 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2622_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.23 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2623_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.24 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2624_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.25 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2625_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.26 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2626_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.27 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2627_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.28 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2628_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('v2.6.29 追加シナリオが basic.spec.ts に含まれる', () => {
    for (const label of PROD_SMOKE_V2629_ADDITIONS) {
      expect(basic).toContain(label)
    }
  })

  it('トランジション29種が basic.spec.ts でカバーされている', () => {
    const coverage = auditTransitionCoverage(basic)
    expect(coverage.missing).toEqual([])
    expect(coverage.covered).toHaveLength(PROD_SMOKE_TRANSITION_DEFINITION_COUNT)
  })

  it('v2.5.74 suffix 整理フェーズ4 double-named-reclick 層が整理済みである', () => {
    const titles = [...basic.matchAll(/test\('([^']+)'/g)].map((match) => match[1])
    const duplicateTitles = titles.filter((title, index) => titles.indexOf(title) !== index)
    expect(duplicateTitles).toEqual([])

    const layers = auditPhase4DoubleNamedReclickLayers(basic)
    for (const route of PROD_SMOKE_PHASE4_DOUBLE_NAMED_RECLICK_ROUTES) {
      expect(layers[route.id].plain).toBe(PROD_SMOKE_PHASE4_DOUBLE_NAMED_RECLICK_LAYER_COUNT)
      expect(layers[route.id].named).toBe(PROD_SMOKE_PHASE4_DOUBLE_NAMED_RECLICK_LAYER_COUNT)
    }
  })
})
