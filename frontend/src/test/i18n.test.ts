import { describe, it, expect } from 'vitest'
import { en } from '../i18n/en'
import { kn } from '../i18n/kn'

describe('i18n translations', () => {
  it('should have matching keys between English and Kannada translations', () => {
    const enKeys = Object.keys(en).sort()
    const knKeys = Object.keys(kn).sort()

    expect(enKeys).toEqual(knKeys)
  })

  it('all English keys should have non-empty strings', () => {
    for (const [key, value] of Object.entries(en)) {
      expect(value, `en.${key} is empty`).toBeTruthy()
      expect(typeof value).toBe('string')
    }
  })

  it('all Kannada keys should have non-empty strings', () => {
    for (const [key, value] of Object.entries(kn)) {
      expect(value, `kn.${key} is empty`).toBeTruthy()
      expect(typeof value).toBe('string')
    }
  })

  it('should have correct branding in both languages', () => {
    expect(en.brand).toBe('Taarvya AI')
    expect(kn.brand).toBe('ತಾರ್ವ್ಯ AI')
    expect(en.tagline).toContain('Birth Chart')
    expect(kn.tagline).toContain('ಜನ್ಮ ಚಾರ್ಟ್')
  })
})
