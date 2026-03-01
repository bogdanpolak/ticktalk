import { audioService } from '@/lib/services/audioService'

export function playTimerExpiredSound(): void {
  audioService.playTimerExpiredSound()
}

export function stopTimerExpiredSound(): void {
  audioService.stopTimerExpiredSound()
}
