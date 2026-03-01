import { auth } from '@/lib/firebase'
import { onAuthStateChanged, signInAnonymously, type User, type Unsubscribe } from 'firebase/auth'

export interface AuthService {
  getCurrentUser(): User | null
  getCurrentUserId(): Promise<string>
  onAuthStateChange(listener: (user: User | null) => void): Unsubscribe
}

const realAuthService: AuthService = {
  getCurrentUser(): User | null {
    return auth.currentUser
  },

  async getCurrentUserId(): Promise<string> {
    if (auth.currentUser) {
      return auth.currentUser.uid
    }

    const userCredential = await signInAnonymously(auth)
    return userCredential.user.uid
  },

  onAuthStateChange(listener) {
    return onAuthStateChanged(auth, listener)
  }
}

export const authService: AuthService = realAuthService
