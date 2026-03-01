import { storageService, type StoredSettings } from '@/lib/services/storageService'

export type { StoredSettings }

export const saveSettings = (name: string, duration: number, isCustom: boolean) => {
  storageService.saveSettings(name, duration, isCustom)
}

export const loadSettings = (): StoredSettings => {
  return storageService.loadSettings()
}
