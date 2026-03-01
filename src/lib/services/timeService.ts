import { computeRemainingSeconds } from '@/lib/sessionLogic'

export interface TimeService {
  now(): number
  setInterval(handler: () => void, ms: number): ReturnType<typeof globalThis.setInterval>
  clearInterval(id: ReturnType<typeof globalThis.setInterval>): void
  computeRemainingSeconds(slotEndsAt: number | null): number
}

const realTimeService: TimeService = {
  now() {
    return Date.now()
  },

  setInterval(handler, ms) {
    return globalThis.setInterval(handler, ms)
  },

  clearInterval(id) {
    globalThis.clearInterval(id)
  },

  computeRemainingSeconds(slotEndsAt) {
    return computeRemainingSeconds(slotEndsAt, realTimeService.now())
  }
}

export const timeService: TimeService = realTimeService
