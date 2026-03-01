export type StoredSettings = {
  userName: string
  slotDuration: number
  isCustomDuration: boolean
}

const DEFAULT_SETTINGS: StoredSettings = {
  userName: '',
  slotDuration: 120,
  isCustomDuration: false
}

const STORAGE_KEYS = {
  userName: 'ticktalk_userName',
  slotDuration: 'ticktalk_slotDuration',
  isCustomDuration: 'ticktalk_isCustomDuration'
} as const

export interface StorageService {
  saveSettings(name: string, duration: number, isCustom: boolean): void
  loadSettings(): StoredSettings
}

const realStorageService: StorageService = {
  saveSettings(name, duration, isCustom) {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(STORAGE_KEYS.userName, name)
      window.localStorage.setItem(STORAGE_KEYS.slotDuration, String(duration))
      window.localStorage.setItem(STORAGE_KEYS.isCustomDuration, String(isCustom))
    } catch {
      return
    }
  },

  loadSettings() {
    if (typeof window === 'undefined') {
      return { ...DEFAULT_SETTINGS }
    }

    try {
      const storedName = window.localStorage.getItem(STORAGE_KEYS.userName)
      const storedDuration = window.localStorage.getItem(STORAGE_KEYS.slotDuration)
      const storedIsCustom = window.localStorage.getItem(STORAGE_KEYS.isCustomDuration)

      const parsedDuration = storedDuration ? Number(storedDuration) : DEFAULT_SETTINGS.slotDuration
      const slotDuration = Number.isFinite(parsedDuration)
        ? parsedDuration
        : DEFAULT_SETTINGS.slotDuration

      return {
        userName: storedName ?? DEFAULT_SETTINGS.userName,
        slotDuration,
        isCustomDuration: storedIsCustom === 'true'
      }
    } catch {
      return { ...DEFAULT_SETTINGS }
    }
  }
}

export const storageService: StorageService = realStorageService
