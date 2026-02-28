import type { User } from 'firebase/auth'
import { authService } from '@/lib/services/authService'

export async function authenticateAnonymously(): Promise<User> {
  await authService.getCurrentUserId()
  const user = authService.getCurrentUser()

  if (!user) {
    throw new Error('Authentication failed')
  }

  return user
}

export function getCurrentUser(): User | null {
  return authService.getCurrentUser()
}

export async function getCurrentUserId(): Promise<string> {
  return authService.getCurrentUserId()
}
