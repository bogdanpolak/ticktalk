import { beforeEach, describe, expect, it, vi } from 'vitest'
import { playTimerExpiredSound, stopTimerExpiredSound } from '@/lib/audio'
import { audioService } from '@/lib/services/audioService'

vi.mock('@/lib/services/audioService', () => ({
  audioService: {
    playTimerExpiredSound: vi.fn(),
    stopTimerExpiredSound: vi.fn(),
  },
}))

describe('lib/audio', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('playTimerExpiredSound delegates to audioService.playTimerExpiredSound', () => {
    playTimerExpiredSound()

    expect(audioService.playTimerExpiredSound).toHaveBeenCalledTimes(1)
  })

  it('stopTimerExpiredSound delegates to audioService.stopTimerExpiredSound', () => {
    stopTimerExpiredSound()

    expect(audioService.stopTimerExpiredSound).toHaveBeenCalledTimes(1)
  })

  it('increments delegation call counts across multiple calls', () => {
    playTimerExpiredSound()
    playTimerExpiredSound()
    stopTimerExpiredSound()
    stopTimerExpiredSound()
    stopTimerExpiredSound()

    expect(audioService.playTimerExpiredSound).toHaveBeenCalledTimes(2)
    expect(audioService.stopTimerExpiredSound).toHaveBeenCalledTimes(3)
  })
})
