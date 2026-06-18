export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ['/login', '/register']
  if (publicRoutes.includes(to.path)) return

  const session = await $fetch('/api/auth/get-session', {
    headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined,
  }).catch(() => null) as { user?: unknown } | null

  if (!session?.user) {
    return navigateTo('/login')
  }
})
