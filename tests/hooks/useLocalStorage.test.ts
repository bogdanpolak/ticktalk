import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useLocalStorage } from '@/app/hooks/useLocalStorage'

const STORAGE_KEYS = {
  userName: 'ticktalk_userName',
  slotDuration: 'ticktalk_slotDuration',
  isCustomDuration: 'ticktalk_isCustomDuration'
} as const

function setStoredSettings(name: string, duration: number, isCustom: boolean): void {
  window.localStorage.setItem(STORAGE_KEYS.userName, name)
  window.localStorage.setItem(STORAGE_KEYS.slotDuration, String(duration))
  window.localStorage.setItem(STORAGE_KEYS.isCustomDuration, String(isCustom))
}

describe('useLocalStorage', () => {
  it('loads settings on mount', () => {
    setStoredSettings('Alice', 90, true)

    const { result } = renderHook(() => useLocalStorage())

    expect(result.current.settings).toEqual({
      userName: 'Alice',
      slotDuration: 90,
      isCustomDuration: true
    })
  })

  it('returns hasStoredName=true when a non-empty name exists', () => {
    setStoredSettings('Bogdan', 120, false)

    const { result } = renderHook(() => useLocalStorage())

    expect(result.current.hasStoredName).toBe(true)
  })

  it.each(['', '   '])('returns hasStoredName=false for empty or whitespace-only name: "%s"', name => {
    setStoredSettings(name, 120, false)

    const { result } = renderHook(() => useLocalStorage())

    expect(result.current.hasStoredName).toBe(false)
  })

  it('always reports isReady=true', () => {
    const { result } = renderHook(() => useLocalStorage())

    expect(result.current.isReady).toBe(true)
  })

  it('gracefully falls back to defaults when localStorage access fails', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('localStorage unavailable')
    })

    const { result } = renderHook(() => useLocalStorage())

    expect(result.current.settings).toEqual({
      userName: '',
      slotDuration: 120,
      isCustomDuration: false
    })
    expect(result.current.hasStoredName).toBe(false)
    expect(result.current.isReady).toBe(true)
  })
})
