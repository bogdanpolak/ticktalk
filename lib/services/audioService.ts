export interface AudioService {
  playTimerExpiredSound(): void
  stopTimerExpiredSound(): void
  setEnabled(enabled: boolean): void
}

let audioInstance: HTMLAudioElement | null = null
let enabled = true

const realAudioService: AudioService = {
  playTimerExpiredSound() {
    if (!enabled) {
      return
    }

    try {
      if (!audioInstance) {
        audioInstance = new Audio('/sounds/timer-expired.mp3')
        audioInstance.volume = 0.7
      }

      audioInstance.currentTime = 0
      audioInstance.play().catch(err => {
        console.warn('Failed to play timer expired sound:', err)
      })
    } catch (error) {
      console.warn('Audio initialization failed:', error)
    }
  },

  stopTimerExpiredSound() {
    if (!audioInstance) {
      return
    }

    audioInstance.pause()
    audioInstance.currentTime = 0
  },

  setEnabled(nextEnabled) {
    enabled = nextEnabled
    if (!enabled) {
      realAudioService.stopTimerExpiredSound()
    }
  }
}

export const audioService: AudioService = realAudioService
