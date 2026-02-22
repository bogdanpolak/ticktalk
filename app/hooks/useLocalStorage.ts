'use client'

import { useState } from 'react'
import { loadSettings } from '@/lib/storage'

type LocalSettings = {
  userName: string
  slotDuration: number
  isCustomDuration: boolean
}

type LocalStorageState = {
  settings: LocalSettings
  hasStoredName: boolean
  isReady: boolean
}

export const useLocalStorage = (): LocalStorageState => {
  const [settings] = useState<LocalSettings>(() => loadSettings())

  const hasStoredName = settings.userName.trim().length > 0

  return {
    settings,
    hasStoredName,
    isReady: true
  }
}
