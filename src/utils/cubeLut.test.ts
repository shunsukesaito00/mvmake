import { describe, expect, it } from 'vitest'
import { applyLutToImageData, parseCubeLut, sampleCubeLut } from './cubeLut'

const IDENTITY_CUBE_2 = `TITLE "identity"
LUT_3D_SIZE 2
0 0 0
1 0 0
0 1 0
1 1 0
0 0 1
1 0 1
0 1 1
1 1 1
`

const WARM_CUBE_2 = `LUT_3D_SIZE 2
0 0 0
1 0.1 0
0 1 0
1 0.2 0
0 0 1
1 0.1 1
0 1 1
1 0.2 1
`

describe('parseCubeLut', () => {
  it('parses 2³ LUT', () => {
    const parsed = parseCubeLut(IDENTITY_CUBE_2)
    expect(parsed?.size).toBe(2)
    expect(parsed?.title).toBe('identity')
    expect(parsed?.data.length).toBe(2 * 2 * 2 * 3)
  })

  it('rejects invalid LUT', () => {
    expect(parseCubeLut('LUT_3D_SIZE 2\n0 0')).toBeNull()
  })
})

describe('sampleCubeLut', () => {
  it('returns identity for identity LUT', () => {
    const parsed = parseCubeLut(IDENTITY_CUBE_2)!
    expect(sampleCubeLut(parsed, 0, 0, 0)).toEqual([0, 0, 0])
    expect(sampleCubeLut(parsed, 1, 1, 1)).toEqual([1, 1, 1])
  })
})

describe('applyLutToImageData', () => {
  function makeImageData(r: number, g: number, b: number): ImageData {
    return {
      data: new Uint8ClampedArray([r, g, b, 255]),
      width: 1,
      height: 1,
      colorSpace: 'srgb',
    } as ImageData
  }

  it('warms pixels with warm LUT at full intensity', () => {
    const parsed = parseCubeLut(WARM_CUBE_2)!
    const imageData = makeImageData(255, 0, 0)
    applyLutToImageData(imageData, parsed, 1)
    expect(imageData.data[0]).toBeGreaterThan(200)
    expect(imageData.data[1]).toBeGreaterThan(10)
  })

  it('keeps original at zero intensity', () => {
    const parsed = parseCubeLut(WARM_CUBE_2)!
    const imageData = makeImageData(100, 120, 140)
    applyLutToImageData(imageData, parsed, 0)
    expect(imageData.data[0]).toBe(100)
    expect(imageData.data[1]).toBe(120)
    expect(imageData.data[2]).toBe(140)
  })
})
