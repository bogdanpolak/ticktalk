import { auth } from './firebase';
import { signInAnonymously, User } from 'firebase/auth';

/**
 * Authenticate user anonymously
 * Returns the authenticated user
 */
export async function authenticateAnonymously(): Promise<User> {
  const userCredential = await signInAnonymously(auth);
  return userCredential.user;
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Generate a unique user ID (uses Firebase Auth UID)
 */
export async function getCurrentUserId(): Promise<string> {
  const user = getCurrentUser();
  if (user) return user.uid;
  
  const newUser = await authenticateAnonymously();
  return newUser.uid;
}
