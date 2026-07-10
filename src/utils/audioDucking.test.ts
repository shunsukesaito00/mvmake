import { describe, expect, it } from 'vitest'
import { applyDucking } from './audioDucking'

type AutomationEvent = { type: 'set' | 'ramp'; time: number; value: number }

function createMockGainParam(): GainNode['gain'] & { events: AutomationEvent[] } {
  const events: AutomationEvent[] = []
  const param = {
    value: 1,
    defaultValue: 1,
    events,
    setValueAtTime(value: number, time: number) {
      events.push({ type: 'set', time, value })
      param.value = value
    },
    linearRampToValueAtTime(value: number, time: number) {
      events.push({ type: 'ramp', time, value })
    },
    exponentialRampToValueAtTime() {},
    setTargetAtTime() {},
    cancelScheduledValues() {},
    cancelAndHoldAtTime() {},
  }
  return param as GainNode['gain'] & { events: AutomationEvent[] }
}

describe('applyDucking', () => {
  const ducking = {
    intervals: [{ start: 2, end: 5 }],
    amount: 0.3,
    fade: 0.5,
  }

  it('schedules duck-down before interval and restore after', () => {
    const gain = createMockGainParam()
    applyDucking(gain, ducking, 0, 10, 0, (pt) => pt)

    expect(gain.events.some((e) => e.type === 'set' && e.time === 2 && e.value === 1)).toBe(true)
    expect(gain.events.some((e) => e.type === 'ramp' && e.time === 2.5 && e.value === 0.3)).toBe(true)
    expect(gain.events.some((e) => e.type === 'set' && e.time === 5 && e.value === 0.3)).toBe(true)
    expect(gain.events.some((e) => e.type === 'ramp' && e.time === 5.5 && e.value === 1)).toBe(true)
  })

  it('starts ducked when playback begins inside interval', () => {
    const gain = createMockGainParam()
    applyDucking(gain, ducking, 0, 10, 3, (pt) => pt)

    expect(gain.events[0]).toEqual({ type: 'set', time: 3, value: 0.3 })
  })

  it('ignores intervals outside clip range', () => {
    const gain = createMockGainParam()
    applyDucking(gain, ducking, 6, 10, 0, (pt) => pt)
    expect(gain.events.filter((e) => e.type === 'ramp')).toHaveLength(0)
  })
})
