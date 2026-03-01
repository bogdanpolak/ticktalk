import type { User } from 'firebase/auth'
import type { AuthService } from './authService'

function notImplemented(name: string): never {
  throw new Error(`Mock auth service method not implemented: ${name}`)
}

function consumeArgs(args: unknown[]): void {
  void args
}

export function createMockAuthService(overrides: Partial<AuthService> = {}): AuthService {
  return {
    getCurrentUser(): User | null {
      return null
    },
    async getCurrentUserId(): Promise<string> {
      return notImplemented('getCurrentUserId')
    },
    onAuthStateChange(...args: [(user: User | null) => void]): () => void {
      consumeArgs(args)
      return () => undefined
    },
    ...overrides
  }
}
