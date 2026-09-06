import { describe, expect, it } from 'vitest'
import { normalizeSceneProgress, shouldRunScene } from './AuthCanvasScene'

describe('canvas onboarding motion guards', () => {
  it('clamps scroll progress to a predictable 0–1 range', () => {
    expect(normalizeSceneProgress(0, 100, 800)).toBe(0)
    expect(normalizeSceneProgress(450, 100, 800)).toBeCloseTo(.5)
    expect(normalizeSceneProgress(1200, 100, 800)).toBe(1)
    expect(normalizeSceneProgress(100, 100, 100)).toBe(0)
  })
  it('only runs the animation when visible and motion is allowed', () => {
    expect(shouldRunScene(true, false)).toBe(true)
    expect(shouldRunScene(false, false)).toBe(false)
    expect(shouldRunScene(true, true)).toBe(false)
  })
})
