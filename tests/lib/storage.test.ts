import { describe, expect, it, beforeEach, vi } from 'vitest'
import { loadSettings, saveSettings, type StoredSettings } from '@/lib/storage'
import { storageService } from '@/lib/services/storageService'

vi.mock('@/lib/services/storageService', () => ({
  storageService: {
    saveSettings: vi.fn(),
    loadSettings: vi.fn()
  }
}))

describe('lib/storage wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('saveSettings delegates to storageService.saveSettings with exact args', () => {
    saveSettings('Bogdan', 180, true)

    expect(storageService.saveSettings).toHaveBeenCalledTimes(1)
    expect(storageService.saveSettings).toHaveBeenCalledWith('Bogdan', 180, true)
  })

  it('loadSettings returns value from storageService.loadSettings', () => {
    const mockedSettings: StoredSettings = {
      userName: 'Alice',
      slotDuration: 90,
      isCustomDuration: true
    }

    vi.mocked(storageService.loadSettings).mockReturnValue(mockedSettings)

    const result = loadSettings()

    expect(storageService.loadSettings).toHaveBeenCalledTimes(1)
    expect(result).toEqual(mockedSettings)
  })

  it('loadSettings handles missing-like defaults by returning mocked default object', () => {
    const mockedDefaults: StoredSettings = {
      userName: '',
      slotDuration: 120,
      isCustomDuration: false
    }

    vi.mocked(storageService.loadSettings).mockReturnValue(mockedDefaults)

    const result = loadSettings()

    expect(storageService.loadSettings).toHaveBeenCalledTimes(1)
    expect(result).toEqual(mockedDefaults)
  })
})
