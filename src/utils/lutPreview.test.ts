import { describe, expect, it } from 'vitest'
import { parseCubeLut } from './cubeLut'
import { applyGradedPixelsToImageData } from './lutPreview'
import { DEFAULT_COLOR } from '../types/project'

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

describe('applyGradedPixelsToImageData', () => {
  function makeImageData(r: number, g: number, b: number): ImageData {
    return {
      data: new Uint8ClampedArray([r, g, b, 255]),
      width: 1,
      height: 1,
      colorSpace: 'srgb',
    } as ImageData
  }

  it('LUT と色温度を順に適用する', () => {
    const lut = parseCubeLut(WARM_CUBE_2)!
    const imageData = makeImageData(255, 0, 0)
    applyGradedPixelsToImageData(imageData, lut, 1, { ...DEFAULT_COLOR, temperature: 0.2 })
    expect(imageData.data[0]).toBeGreaterThan(200)
    expect(imageData.data[1]).toBeGreaterThan(20)
  })

  it('LUT 強度 0 では元のピクセルを維持する', () => {
    const lut = parseCubeLut(WARM_CUBE_2)!
    const imageData = makeImageData(80, 90, 100)
    applyGradedPixelsToImageData(imageData, lut, 0, DEFAULT_COLOR)
    expect(imageData.data[0]).toBe(80)
    expect(imageData.data[1]).toBe(90)
    expect(imageData.data[2]).toBe(100)
  })
})
