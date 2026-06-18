import { authClient } from '~/utils/auth-client'

export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ['/login', '/register']
  if (publicRoutes.includes(to.path)) return

  const { data: session } = await authClient.useSession(useFetch)
  if (!session.value) {
    return navigateTo('/login')
  }
})
