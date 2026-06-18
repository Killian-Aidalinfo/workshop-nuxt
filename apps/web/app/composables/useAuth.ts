import { authClient } from '~/utils/auth-client'

export function useAuth() {
  const session = authClient.useSession()

  async function signIn(email: string, password: string) {
    return authClient.signIn.email({ email, password })
  }

  async function signUp(email: string, password: string, name: string) {
    return authClient.signUp.email({ email, password, name })
  }

  async function signOut() {
    await authClient.signOut()
    await navigateTo('/login')
  }

  return { session, signIn, signUp, signOut }
}
